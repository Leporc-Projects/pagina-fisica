import { localizeSimulationExperience } from "../data/simulation-experiences.js";
import { getSimulationModelById, localizeSimulationModel } from "../data/simulation-models.js";
import { formatNumber, t } from "../i18n/index.js";
import {
  createForcesFrictionRelationGeometry,
  createForcesHistoryGeometry,
} from "../utils/dynamics-charts.js";
import { normalizeSimulationExperience, validateSimulationExperience } from "../utils/simulation-experience.js";
import { createForcesFrictionState, getForcesFrictionReadings, stepForcesFriction } from "../utils/forces-friction.js";
import {
  createInclinedForceFrame,
  createRightAngleMarker,
  resolveWeightInInclinedFrame,
} from "../utils/force-frame-geometry.js";
import { createForcesFrictionP5Renderer } from "./p5-forces-friction-renderer.js";
import { initializeSimulationFloatingPlayback } from "./simulation-floating-playback.js";
import { setSvgArrow, updateSimulationLinkedChart } from "./simulation-linked-chart.js";
import { createAnalyticsOneShot, trackSimulationStart } from "../utils/analytics.js";

const runtimes = new WeakMap();
const pending = new WeakMap();
const FIXED_STEP = 1 / 120;
const HISTORY_LIMIT = 301;

const readExperience = (root) => { try { return JSON.parse(root.dataset.experience ?? ""); } catch { return null; } };
const equalParameters = (a, b) => Object.keys(a).every((key) => a[key] === b[key]);
const radians = (degrees) => degrees * Math.PI / 180;

const createRuntime = async (root, suppliedExperience) => {
  const locale = root.dataset.locale === "en" ? "en" : "es";
  const display = (value) => formatNumber(locale, value, { maximumFractionDigits: 2 });
  const canonicalExperience = normalizeSimulationExperience(suppliedExperience ?? readExperience(root));
  const validation = validateSimulationExperience(canonicalExperience);
  if (!validation.valid || getSimulationModelById(canonicalExperience.modelId)?.rendererId !== "p5-forces-friction") throw new TypeError(validation.errors.join(" ") || "Renderer incompatible.");
  let experience = localizeSimulationExperience(canonicalExperience, locale);
  const canvas = root.querySelector("[data-forces-friction-canvas]");
  const playbackSection = root.querySelector("[data-playback-section]");
  const toggleButton = root.querySelector('[data-action="toggle"]');
  const playbackLabel = root.querySelector("[data-playback-label]");
  const playbackIcon = root.querySelector("[data-playback-icon]");
  const playbackState = root.querySelector("[data-playback-state]");
  const live = root.querySelector("[data-simulation-live]");
  if (!(canvas instanceof HTMLElement) || !(playbackSection instanceof HTMLElement) || !(toggleButton instanceof HTMLButtonElement) || !playbackLabel || !playbackIcon || !playbackState || !live) throw new TypeError("La interfaz de fuerzas está incompleta.");
  const abortController = new AbortController();
  const options = { signal: abortController.signal };
  const trackFirstStart = createAnalyticsOneShot(() =>
    trackSimulationStart("forces-friction", locale)
  );
  const defaults = () => Object.fromEntries(Object.entries(experience.parameters).map(([key, value]) => [key, value.default]));
  const definitions = () => {
    const model = localizeSimulationModel(getSimulationModelById(experience.modelId), locale);
    return Object.entries(model.parameters).map(([key, definition]) => ({ key, ...definition, ...experience.parameters[key] }));
  };
  const runtime = {
    parameters: defaults(),
    state: null,
    readings: null,
    history: [],
    playing: false,
    frameId: null,
    previous: null,
    accumulator: 0,
    experience,
    toggles: { forces: experience.views.vectors, velocity: experience.views.vectors, acceleration: experience.views.vectors, fbd: experience.views.freeBodyDiagram },
    resolveWeight: false,
  };
  let floatingPlayback = null;
  const resetDomain = () => {
    runtime.state = createForcesFrictionState(runtime.parameters);
    runtime.readings = getForcesFrictionReadings(runtime.state, runtime.parameters);
    runtime.history = [{ t: runtime.state.t, v: runtime.state.v, net: runtime.readings.netParallel }];
  };
  resetDomain();
  const renderer = await createForcesFrictionP5Renderer({ container: canvas, locale, getFrame: () => ({ ...runtime, experience }) });
  const announce = (message) => { live.textContent = ""; requestAnimationFrame(() => { live.textContent = message; }); };
  const statusKey = () => `forcesFriction.status.${runtime.readings.regime === "contact-invalid" ? "contactInvalid" : runtime.readings.regime}`;
  const syncFloating = () => floatingPlayback?.sync({
    playing: runtime.playing,
    timeText: `${display(runtime.state.t)} s`,
    disabled: runtime.readings.regime === "contact-invalid",
  });
  const updatePlayback = () => {
    toggleButton.setAttribute("aria-pressed", String(runtime.playing));
    playbackLabel.textContent = t(locale, runtime.playing ? "simulation.pause" : "simulation.play");
    playbackIcon.textContent = runtime.playing ? "❚❚" : "▶";
    playbackState.textContent = t(locale, runtime.playing ? "simulation.playing" : "simulation.paused");
    syncFloating();
  };
  const pause = (message) => {
    runtime.playing = false;
    if (runtime.frameId !== null) cancelAnimationFrame(runtime.frameId);
    runtime.frameId = null;
    runtime.previous = null;
    runtime.accumulator = 0;
    updatePlayback();
    if (message) announce(message);
  };

  const arrowVector = (origin, vector) => {
    const magnitude = Math.hypot(vector.x, vector.y);
    if (magnitude < 1e-9) return { x1: origin.x, y1: origin.y, x2: origin.x, y2: origin.y };
    const length = Math.min(82, 25 + Math.sqrt(magnitude) * 5);
    return { x1: origin.x, y1: origin.y, x2: origin.x + vector.x / magnitude * length, y2: origin.y + vector.y / magnitude * length };
  };
  const updateFbd = () => {
    const panel = root.querySelector(".dynamics-external-fbd");
    if (panel instanceof HTMLElement) panel.hidden = !runtime.toggles.fbd;
    const svg = root.querySelector("[data-forces-fbd]");
    if (!(svg instanceof SVGElement)) return;
    const { tangent, outward, applied: appliedDirection } = createInclinedForceFrame(
      runtime.parameters.beta,
      runtime.parameters.alpha
    );
    const weight = resolveWeightInInclinedFrame(
      runtime.parameters.m,
      runtime.parameters.g,
      runtime.parameters.beta
    );
    const center = { x: 180, y: 127 };
    const body = svg.querySelector("[data-fbd-body]");
    const orientation = svg.querySelector("[data-fbd-orientation]");
    body?.setAttribute("transform", `rotate(${-runtime.parameters.beta} 180 127)`);
    orientation?.setAttribute("transform", `rotate(${-runtime.parameters.beta} 180 127)`);
    setSvgArrow(svg, '[data-fbd-arrow="applied"]', arrowVector(center, { x: appliedDirection.x * runtime.parameters.F, y: appliedDirection.y * runtime.parameters.F }), { x: 7, y: -6 });
    setSvgArrow(svg, '[data-fbd-arrow="normal"]', arrowVector(center, { x: outward.x * runtime.readings.normal, y: outward.y * runtime.readings.normal }), { x: 7, y: -6 });
    setSvgArrow(svg, '[data-fbd-arrow="friction"]', arrowVector(center, { x: tangent.x * runtime.readings.friction, y: tangent.y * runtime.readings.friction }), { x: 7, y: -6 });
    setSvgArrow(svg, '[data-fbd-arrow="weight"]', arrowVector(center, { x: 0, y: runtime.parameters.m * runtime.parameters.g }), { x: 7, y: 12 });
    setSvgArrow(svg, '[data-fbd-arrow="weightParallel"]', arrowVector(center, weight.parallel), { x: 7, y: 12 });
    setSvgArrow(svg, '[data-fbd-arrow="weightPerpendicular"]', arrowVector(center, weight.perpendicular), { x: 7, y: 12 });
    const marker = createRightAngleMarker(center, runtime.parameters.beta);
    svg.querySelector("[data-fbd-right-angle]")?.setAttribute(
      "points",
      marker.map(({ x, y }) => `${x},${y}`).join(" ")
    );
    svg.querySelector('[data-fbd-arrow="weight"]')?.toggleAttribute("hidden", runtime.resolveWeight);
    svg.querySelector("[data-fbd-weight-components]")?.toggleAttribute("hidden", !runtime.resolveWeight);
  };
  const setEquation = (key, value) => root.querySelectorAll(`[data-equation="${key}"]`).forEach((node) => { node.textContent = display(value); });
  const updateEquations = () => {
    const beta = radians(runtime.parameters.beta);
    const alpha = radians(runtime.parameters.alpha);
    const normalRaw = runtime.parameters.m * runtime.parameters.g * Math.cos(beta) - runtime.parameters.F * Math.sin(alpha);
    setEquation("normal", runtime.readings.normal);
    setEquation("normal-raw", normalRaw);
    setEquation("drive", -runtime.readings.requiredStatic);
    setEquation("friction", runtime.readings.friction);
    setEquation("friction-absolute", Math.abs(runtime.readings.friction));
    setEquation("net", runtime.readings.netParallel);
    setEquation("acceleration", runtime.readings.a);
    root.querySelectorAll("[data-equation-regime]").forEach((section) => {
      section.toggleAttribute("hidden", section.dataset.equationRegime !== runtime.readings.regime);
    });
  };
  const updateHistoryCharts = () => {
    const velocity = root.querySelector('[data-simulation-chart="forces-velocity-history"]');
    const net = root.querySelector('[data-simulation-chart="forces-net-history"]');
    if (velocity instanceof HTMLElement) updateSimulationLinkedChart(velocity, createForcesHistoryGeometry(runtime.history, "v"), display);
    if (net instanceof HTMLElement) updateSimulationLinkedChart(net, createForcesHistoryGeometry(runtime.history, "net"), display);
  };
  const updateRelationChart = () => {
    const chart = root.querySelector('[data-simulation-chart="forces-friction-relation"]');
    let relationRegime = runtime.readings.regime;
    if (chart instanceof HTMLElement) {
      const definition = experience.parameters.F;
      const geometry = createForcesFrictionRelationGeometry(runtime.parameters, [definition.minimum, definition.maximum]);
      relationRegime = geometry.currentRegime;
      updateSimulationLinkedChart(chart, geometry, display);
    }
    const state = root.querySelector("[data-friction-relation-state]");
    if (state) state.textContent = t(locale, relationRegime === "static" ? "forcesFriction.relationStatic" : relationRegime === "kinetic" ? "forcesFriction.relationKinetic" : "forcesFriction.relationInvalid");
  };
  const updateDom = () => {
    runtime.readings = getForcesFrictionReadings(runtime.state, runtime.parameters);
    Object.entries(runtime.readings).forEach(([key, value]) => {
      if (typeof value !== "number") return;
      const output = root.querySelector(`[data-reading="${key}"]`);
      if (output) output.textContent = display(value);
    });
    const status = root.querySelector("[data-status-text]");
    if (status) status.textContent = t(locale, statusKey());
    const badge = root.querySelector(".dynamics-status");
    if (badge) badge.dataset.regime = runtime.readings.regime;
    const required = Math.abs(runtime.readings.requiredStatic);
    const maximum = runtime.readings.maximumStatic;
    const progress = root.querySelector("[data-friction-progress]");
    if (progress instanceof HTMLProgressElement) {
      progress.max = Math.max(maximum, 1e-9);
      progress.value = Math.min(required, progress.max);
    }
    const meterValues = { "meter-required": required, "meter-maximum": maximum, "meter-current": Math.abs(runtime.readings.friction) };
    Object.entries(meterValues).forEach(([key, value]) => { const node = root.querySelector(`[data-${key}]`); if (node) node.textContent = display(value); });
    const ratio = root.querySelector("[data-meter-ratio]");
    if (ratio) ratio.textContent = maximum > 0 ? display(required / maximum * 100) : "—";
    const note = root.querySelector("[data-meter-note]");
    if (note) note.textContent = t(locale, runtime.readings.regime === "static" ? "forcesFriction.meterStatic" : runtime.readings.regime === "kinetic" ? "forcesFriction.meterKinetic" : "forcesFriction.meterInvalid");
    const warning = root.querySelector("[data-contact-warning]");
    if (warning instanceof HTMLElement) warning.hidden = runtime.readings.regime !== "contact-invalid";
    toggleButton.disabled = runtime.readings.regime === "contact-invalid";
    updateFbd();
    updateEquations();
    updateHistoryCharts();
    renderer.update();
    syncFloating();
  };
  const renderPresets = () => {
    const list = root.querySelector("[data-presets-list]");
    if (!(list instanceof HTMLElement)) return;
    list.replaceChildren(...experience.presets.map((preset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.preset = preset.id;
      button.textContent = preset.label;
      return button;
    }));
  };
  const syncControls = () => {
    definitions().forEach((control) => {
      for (const kind of ["range", "number"]) {
        const input = root.querySelector(`[data-param-${kind}="${control.key}"]`);
        if (input instanceof HTMLInputElement) {
          input.min = String(control.minimum);
          input.max = String(control.maximum);
          input.step = String(control.step);
          input.value = String(runtime.parameters[control.key]);
        }
      }
      const output = root.querySelector(`[data-param-output="${control.key}"]`);
      if (output) output.textContent = `${display(runtime.parameters[control.key])} ${control.unit}`;
    });
    root.querySelectorAll("[data-preset]").forEach((button) => {
      const preset = experience.presets.find(({ id }) => id === button.dataset.preset);
      button.setAttribute("aria-pressed", String(Boolean(preset && equalParameters(preset.parameters, runtime.parameters))));
    });
  };
  const stepFrame = (time) => {
    if (!runtime.playing) return;
    if (runtime.previous === null) runtime.previous = time;
    runtime.accumulator += Math.min(0.1, Math.max(0, (time - runtime.previous) / 1000));
    runtime.previous = time;
    while (runtime.accumulator >= FIXED_STEP) {
      runtime.state = stepForcesFriction(runtime.state, runtime.parameters, FIXED_STEP);
      runtime.accumulator -= FIXED_STEP;
    }
    runtime.readings = getForcesFrictionReadings(runtime.state, runtime.parameters);
    const latest = runtime.history.at(-1);
    if (!latest || runtime.state.t - latest.t >= 1 / 30) runtime.history.push({ t: runtime.state.t, v: runtime.state.v, net: runtime.readings.netParallel });
    if (runtime.history.length > HISTORY_LIMIT) runtime.history.splice(0, runtime.history.length - HISTORY_LIMIT);
    updateDom();
    if (runtime.readings.regime === "contact-invalid") { pause(t(locale, "forcesFriction.contactInvalidShort")); return; }
    runtime.frameId = requestAnimationFrame(stepFrame);
  };
  const play = () => {
    if (runtime.readings.regime === "contact-invalid") return;
    runtime.playing = true;
    trackFirstStart();
    updatePlayback();
    runtime.frameId = requestAnimationFrame(stepFrame);
    announce(t(locale, "simulation.playing"));
  };
  const togglePlayback = () => runtime.playing ? pause(t(locale, "simulation.paused")) : play();
  const reset = (message = t(locale, "simulation.resetDone")) => {
    pause();
    runtime.parameters = defaults();
    resetDomain();
    syncControls();
    updateDom();
    updateRelationChart();
    announce(message);
  };
  const applyParameters = (key, value) => {
    pause();
    runtime.parameters = { ...runtime.parameters, [key]: value };
    if (key === "v0") resetDomain();
    else {
      runtime.state = stepForcesFriction(runtime.state, runtime.parameters, 0);
      runtime.readings = getForcesFrictionReadings(runtime.state, runtime.parameters);
      runtime.history = [{ t: runtime.state.t, v: runtime.state.v, net: runtime.readings.netParallel }];
    }
    syncControls();
    updateDom();
    updateRelationChart();
    announce(t(locale, "simulation.updated"));
  };
  root.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const key = input.dataset.paramRange ?? input.dataset.paramNumber;
    if (!key) return;
    const value = input.valueAsNumber;
    const definition = definitions().find((entry) => entry.key === key);
    if (Number.isFinite(value) && value >= definition.minimum && value <= definition.maximum) applyParameters(key, value);
  }, options);
  root.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.dataset.forceToggle) {
      runtime.toggles[input.dataset.forceToggle] = input.checked;
      updateFbd();
      renderer.update();
    } else if (input.matches("[data-resolve-weight]")) {
      runtime.resolveWeight = input.checked;
      updateFbd();
    }
  }, options);
  root.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!(button instanceof HTMLButtonElement)) return;
    if (button.dataset.action === "toggle") togglePlayback();
    else if (button.dataset.action === "reset") reset();
    else if (button.dataset.preset) {
      const preset = experience.presets.find(({ id }) => id === button.dataset.preset);
      if (preset) {
        pause();
        runtime.parameters = { ...preset.parameters };
        resetDomain();
        syncControls();
        updateDom();
        updateRelationChart();
        announce(t(locale, "simulation.presetApplied", { preset: preset.label }));
      }
    }
  }, options);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && runtime.playing) pause(t(locale, "simulation.pausedHidden"));
  }, options);
  floatingPlayback = initializeSimulationFloatingPlayback({ root, playbackSection, locale, onToggle: togglePlayback, onReset: () => reset() });
  renderPresets();
  syncControls();
  updatePlayback();
  updateDom();
  updateRelationChart();
  const api = {
    async updateExperience(next) {
      pause();
      experience = localizeSimulationExperience(normalizeSimulationExperience(next), locale);
      runtime.experience = experience;
      runtime.parameters = defaults();
      runtime.toggles = { forces: experience.views.vectors, velocity: experience.views.vectors, acceleration: experience.views.vectors, fbd: experience.views.freeBodyDiagram };
      resetDomain();
      renderPresets();
      syncControls();
      updateDom();
      updateRelationChart();
    },
    async destroy() {
      pause();
      floatingPlayback?.destroy();
      abortController.abort();
      await renderer.destroy();
      runtimes.delete(root);
    },
  };
  window.addEventListener("pagehide", () => api.destroy(), { ...options, once: true });
  return api;
};

export const initializeForcesFrictionSimulation = async (root, experience) => {
  if (!(root instanceof HTMLElement)) return null;
  if (runtimes.has(root)) { if (experience) await runtimes.get(root).updateExperience(experience); return runtimes.get(root); }
  if (pending.has(root)) return pending.get(root);
  const promise = createRuntime(root, experience).then((api) => { pending.delete(root); runtimes.set(root, api); return api; }, (error) => { pending.delete(root); throw error; });
  pending.set(root, promise);
  return promise;
};

export const destroyForcesFrictionSimulation = async (root) => {
  const api = runtimes.get(root) ?? await pending.get(root);
  await api?.destroy();
};
