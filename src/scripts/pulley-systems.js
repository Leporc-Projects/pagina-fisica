import { PULLEY_PRESETS, PULLEY_SCENARIOS, getPulleyScenario } from "../data/pulley-scenarios.js";
import { localizeSimulationExperience } from "../data/simulation-experiences.js";
import { getSimulationModelById, localizeSimulationModel } from "../data/simulation-models.js";
import { formatNumber, t } from "../i18n/index.js";
import { createPulleyHistoryGeometry } from "../utils/dynamics-charts.js";
import { createPulleyState, getPulleyReadings, stepPulleyState, validatePulleyConfig } from "../utils/pulley-systems.js";
import { normalizeSimulationExperience, validateSimulationExperience } from "../utils/simulation-experience.js";
import { createPulleySystemsP5Renderer } from "./p5-pulley-systems-renderer.js";
import { initializeSimulationFloatingPlayback } from "./simulation-floating-playback.js";
import { updateSimulationLinkedChart } from "./simulation-linked-chart.js";

const runtimes = new WeakMap();
const pending = new WeakMap();
const FIXED_STEP = 1 / 120;
const HISTORY_LIMIT = 301;

const readExperience = (root) => { try { return JSON.parse(root.dataset.experience ?? ""); } catch { return null; } };
const historyKeys = (scenarioId) => scenarioId === "movable-pulley"
  ? ["mL", "mC"]
  : scenarioId === "double-atwood"
    ? ["m1", "m2", "m3"]
    : ["m1", "m2"];

const createRuntime = async (root, suppliedExperience) => {
  const locale = root.dataset.locale === "en" ? "en" : "es";
  const display = (value) => formatNumber(locale, Number(value), { maximumFractionDigits: 2 });
  const canonicalExperience = normalizeSimulationExperience(suppliedExperience ?? readExperience(root));
  const validation = validateSimulationExperience(canonicalExperience);
  if (!validation.valid || getSimulationModelById(canonicalExperience.modelId)?.rendererId !== "p5-pulley-systems") throw new TypeError(validation.errors.join(" ") || "Renderer incompatible.");
  let experience = localizeSimulationExperience(canonicalExperience, locale);
  const canvas = root.querySelector("[data-pulley-systems-canvas]");
  const playbackSection = root.querySelector("[data-playback-section]");
  const toggleButton = root.querySelector('[data-action="toggle"]');
  const playbackLabel = root.querySelector("[data-playback-label]");
  const playbackIcon = root.querySelector("[data-playback-icon]");
  const playbackState = root.querySelector("[data-playback-state]");
  const live = root.querySelector("[data-simulation-live]");
  if (!(canvas instanceof HTMLElement) || !(playbackSection instanceof HTMLElement) || !(toggleButton instanceof HTMLButtonElement) || !playbackLabel || !playbackIcon || !playbackState || !live) throw new TypeError("La interfaz de poleas está incompleta.");
  const abortController = new AbortController();
  const options = { signal: abortController.signal };
  const defaults = () => Object.fromEntries(Object.entries(experience.parameters).map(([key, value]) => [key, value.default]));
  const makeStores = () => Object.fromEntries(PULLEY_SCENARIOS.map((scenario) => [scenario.id, Object.fromEntries(scenario.parameterKeys.map((key) => [key, defaults()[key]]))]));
  const definitions = () => {
    const model = localizeSimulationModel(getSimulationModelById(experience.modelId), locale);
    return Object.entries(model.parameters).map(([key, definition]) => ({ key, ...definition, ...experience.parameters[key] }));
  };
  const runtime = {
    scenarioId: "table-hanging",
    stores: makeStores(),
    state: null,
    readings: null,
    history: [],
    playing: false,
    speed: 1,
    frameId: null,
    previous: null,
    accumulator: 0,
    experience,
  };
  const parameters = () => runtime.stores[runtime.scenarioId];
  const resetDomain = () => {
    runtime.state = createPulleyState(runtime.scenarioId, parameters());
    runtime.readings = getPulleyReadings(runtime.state);
    runtime.history = [{ t: 0, positions: { ...runtime.state.positions } }];
  };
  resetDomain();
  const renderer = await createPulleySystemsP5Renderer({ container: canvas, locale, getFrame: () => ({ ...runtime, parameters: parameters() }) });
  let floatingPlayback = null;
  const announce = (message) => { live.textContent = ""; requestAnimationFrame(() => { live.textContent = message; }); };
  const syncFloating = () => floatingPlayback?.sync({ playing: runtime.playing, timeText: `${display(runtime.state.t)} s`, disabled: runtime.readings.stopped });
  const updatePlayback = () => {
    toggleButton.setAttribute("aria-pressed", String(runtime.playing));
    toggleButton.disabled = runtime.readings.stopped;
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

  const setValue = (key, value) => root.querySelectorAll(`[data-pulley-value="${key}"]`).forEach((node) => { node.textContent = display(value); });
  const setSubstitution = (scenarioId, lines) => {
    const node = root.querySelector(`[data-pulley-substitution="${scenarioId}"]`);
    if (node) node.textContent = lines.join(" · ");
  };
  const syncAnalysis = () => {
    root.querySelectorAll("[data-pulley-analysis], [data-pulley-equations], [data-pulley-constraint]").forEach((node) => {
      const target = node.dataset.pulleyAnalysis ?? node.dataset.pulleyEquations ?? node.dataset.pulleyConstraint;
      node.toggleAttribute("hidden", target !== runtime.scenarioId);
    });
    const a = runtime.readings.accelerations;
    const tension = runtime.readings.tensions;
    setValue("T", tension.T ?? 0); setValue("TA", tension.TA ?? 0); setValue("TC", tension.TC ?? 0);
    setValue("friction", runtime.readings.friction);
    setValue("a1", a.m1 ?? 0); setValue("a2", a.m2 ?? 0); setValue("a3", a.m3 ?? 0);
    setValue("aL", a.mL ?? 0); setValue("aC", a.mC ?? 0);
    const config = parameters();
    if (runtime.scenarioId === "table-hanging") {
      setSubstitution(runtime.scenarioId, [
        `${display(tension.T)} − ${display(runtime.readings.friction)} = ${display(config.m1)} × ${display(a.m1)}`,
        `${display(config.m2)} × ${display(config.g)} − ${display(tension.T)} = ${display(config.m2)} × ${display(a.m2)}`,
      ]);
    } else if (runtime.scenarioId === "atwood") {
      setSubstitution(runtime.scenarioId, [
        `${display(config.m1)} × ${display(config.g)} − ${display(tension.T)} = ${display(config.m1)} × ${display(a.m1)}`,
        `${display(config.m2)} × ${display(config.g)} − ${display(tension.T)} = ${display(config.m2)} × ${display(a.m2)}`,
      ]);
    } else if (runtime.scenarioId === "movable-pulley") {
      setSubstitution(runtime.scenarioId, [
        `${display(config.mL)} × ${display(config.g)} − 2 × ${display(tension.T)} = ${display(config.mL)} × ${display(a.mL)}`,
        `${display(config.mC)} × ${display(config.g)} − ${display(tension.T)} = ${display(config.mC)} × ${display(a.mC)}`,
      ]);
    } else {
      setSubstitution(runtime.scenarioId, [
        `${display(config.m1)} × ${display(config.g)} − ${display(tension.TA)} = ${display(config.m1)} × ${display(a.m1)}`,
        `${display(config.m2)} × ${display(config.g)} − ${display(tension.TA)} = ${display(config.m2)} × ${display(a.m2)}`,
        `${display(config.m3)} × ${display(config.g)} − ${display(tension.TC)} = ${display(config.m3)} × ${display(a.m3)}`,
      ]);
    }
    const residual = runtime.scenarioId === "table-hanging"
      ? runtime.readings.positions.m1 - runtime.readings.positions.m2
      : runtime.scenarioId === "atwood"
        ? runtime.readings.positions.m1 + runtime.readings.positions.m2
        : runtime.scenarioId === "movable-pulley"
          ? 2 * runtime.readings.positions.mL + runtime.readings.positions.mC
          : runtime.readings.positions.m1 + runtime.readings.positions.m2 + 2 * runtime.readings.positions.m3;
    const residualNode = root.querySelector("[data-pulley-constraint-residual]");
    if (residualNode) residualNode.textContent = Math.abs(residual) < 1e-9 ? "0" : display(residual);
  };

  const updateHistory = () => {
    const chart = root.querySelector('[data-simulation-chart="pulley-position-history"]');
    if (chart instanceof HTMLElement) updateSimulationLinkedChart(chart, createPulleyHistoryGeometry(
      runtime.history,
      historyKeys(runtime.scenarioId),
      { contactTime: runtime.state.stopped ? runtime.state.t : null }
    ), display);
    root.querySelectorAll('[data-simulation-chart="pulley-position-history"] [data-series-legend]').forEach((item, index) => item.toggleAttribute("hidden", index >= historyKeys(runtime.scenarioId).length));
  };

  const syncControls = () => {
    const activeKeys = new Set(getPulleyScenario(runtime.scenarioId).parameterKeys);
    definitions().forEach((definition) => {
      const field = root.querySelector(`[data-param-field="${definition.key}"]`);
      field?.toggleAttribute("hidden", !activeKeys.has(definition.key));
      const value = parameters()[definition.key] ?? defaults()[definition.key];
      for (const kind of ["range", "number"]) {
        const input = root.querySelector(`[data-param-${kind}="${definition.key}"]`);
        if (input instanceof HTMLInputElement) value === undefined ? input.removeAttribute("value") : input.value = String(value);
      }
      const output = root.querySelector(`[data-param-output="${definition.key}"]`);
      if (output) output.textContent = `${display(value)} ${definition.unit}`;
      const error = root.querySelector(`[data-param-error="${definition.key}"]`);
      if (error) error.textContent = "";
    });
    root.querySelectorAll("[data-pulley-scenario]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.pulleyScenario === runtime.scenarioId)));
    root.querySelectorAll("[data-pulley-preset]").forEach((button) => button.setAttribute("aria-pressed", "false"));
  };

  const updateDom = () => {
    runtime.readings = getPulleyReadings(runtime.state);
    const reading = (key, value) => { const node = root.querySelector(`[data-pulley-reading="${key}"]`); if (node) node.textContent = display(value); };
    reading("t", runtime.readings.t);
    const activeBodies = new Set(Object.keys(runtime.readings.positions));
    root.querySelectorAll("[data-pulley-body-reading]").forEach((row) => {
      const body = row.dataset.pulleyBodyReading;
      row.toggleAttribute("hidden", !activeBodies.has(body));
      if (!activeBodies.has(body)) return;
      reading(`position-${body}`, runtime.readings.positions[body]);
      reading(`velocity-${body}`, runtime.readings.velocities[body]);
      reading(`acceleration-${body}`, runtime.readings.accelerations[body]);
    });
    for (const key of ["T", "TA", "TC"]) {
      root.querySelector(`[data-pulley-tension="${key}"]`)?.toggleAttribute("hidden", !(key in runtime.readings.tensions));
      if (key in runtime.readings.tensions) reading(`tension-${key}`, runtime.readings.tensions[key]);
    }
    root.querySelector("[data-pulley-friction]")?.toggleAttribute("hidden", runtime.scenarioId !== "table-hanging");
    reading("friction", runtime.readings.friction);
    const status = root.querySelector("[data-status-text]");
    if (status) status.textContent = t(locale, `pulleySystems.status.${runtime.readings.status}`);
    const badge = root.querySelector(".dynamics-status");
    if (badge) badge.dataset.regime = runtime.readings.status;
    root.querySelector("[data-pulley-contact-message]")?.toggleAttribute("hidden", !runtime.state.stopped);
    syncAnalysis();
    updateHistory();
    renderer.update();
    updatePlayback();
  };

  const appendHistory = () => {
    const latest = runtime.history.at(-1);
    const sample = { t: runtime.state.t, positions: { ...runtime.state.positions } };
    if (!latest || runtime.state.t - latest.t >= 1 / 30 || runtime.state.stopped) {
      if (latest?.t === runtime.state.t) runtime.history[runtime.history.length - 1] = sample;
      else runtime.history.push(sample);
    }
    if (runtime.history.length > HISTORY_LIMIT) runtime.history.splice(0, runtime.history.length - HISTORY_LIMIT);
  };
  const advance = (dt) => {
    runtime.state = stepPulleyState(runtime.state, dt);
    appendHistory();
    updateDom();
    if (runtime.state.stopped) pause(t(locale, "pulleySystems.limitReached"));
  };
  const stepFrame = (time) => {
    if (!runtime.playing) return;
    if (runtime.previous === null) runtime.previous = time;
    runtime.accumulator += Math.min(.1, Math.max(0, (time - runtime.previous) / 1000)) * runtime.speed;
    runtime.previous = time;
    while (runtime.accumulator >= FIXED_STEP) {
      runtime.state = stepPulleyState(runtime.state, FIXED_STEP);
      runtime.accumulator -= FIXED_STEP;
      if (runtime.state.stopped) break;
    }
    appendHistory();
    updateDom();
    if (runtime.state.stopped) { pause(t(locale, "pulleySystems.limitReached")); return; }
    runtime.frameId = requestAnimationFrame(stepFrame);
  };
  const play = () => {
    if (runtime.state.stopped) return;
    runtime.playing = true;
    updatePlayback();
    runtime.frameId = requestAnimationFrame(stepFrame);
    announce(t(locale, "simulation.playing"));
  };
  const togglePlayback = () => runtime.playing ? pause(t(locale, "simulation.paused")) : play();
  const reset = (message = t(locale, "simulation.resetDone")) => {
    pause(); resetDomain(); syncControls(); updateDom(); announce(message);
  };
  const selectScenario = (scenarioId, message = true) => {
    if (!getPulleyScenario(scenarioId)) return;
    pause(); runtime.scenarioId = scenarioId; resetDomain(); syncControls(); updateDom();
    if (message) announce(t(locale, "pulleySystems.scenarioChanged", { scenario: t(locale, `pulleySystems.scenario.${scenarioId}`) }));
  };

  root.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const key = input.dataset.paramRange ?? input.dataset.paramNumber;
    if (!key || !getPulleyScenario(runtime.scenarioId).parameterKeys.includes(key)) return;
    const value = input.valueAsNumber;
    const definition = definitions().find((entry) => entry.key === key);
    if (!Number.isFinite(value) || value < definition.minimum || value > definition.maximum) return;
    const candidate = { ...parameters(), [key]: value };
    const result = validatePulleyConfig(runtime.scenarioId, candidate);
    const error = root.querySelector(`[data-param-error="${key}"]`);
    if (!result.valid) {
      input.setAttribute("aria-invalid", "true");
      if (error) error.textContent = t(locale, "pulleySystems.frictionOrderError");
      return;
    }
    root.querySelectorAll(`[data-param-range="${key}"], [data-param-number="${key}"]`).forEach((control) => control.removeAttribute("aria-invalid"));
    root.querySelectorAll(`[data-param-error="${key}"]`).forEach((node) => { node.textContent = ""; });
    pause(); runtime.stores[runtime.scenarioId] = candidate; resetDomain(); syncControls(); updateDom(); announce(t(locale, "simulation.updated"));
  }, options);
  root.addEventListener("change", (event) => {
    const input = event.target;
    if (input instanceof HTMLSelectElement && input.matches("[data-playback-speed]")) runtime.speed = Number(input.value);
  }, options);
  root.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!(button instanceof HTMLButtonElement)) return;
    if (button.dataset.action === "toggle") togglePlayback();
    else if (button.dataset.action === "reset") reset();
    else if (button.dataset.action === "step") {
      pause();
      advance(1 / 30);
      if (!runtime.state.stopped) announce(t(locale, "pulleySystems.stepDone"));
    }
    else if (button.dataset.pulleyScenario) selectScenario(button.dataset.pulleyScenario);
    else if (button.dataset.pulleyPreset) {
      const preset = PULLEY_PRESETS.find(({ id }) => id === button.dataset.pulleyPreset);
      if (preset) {
        runtime.stores[preset.scenarioId] = { ...runtime.stores[preset.scenarioId], ...preset.parameters };
        selectScenario(preset.scenarioId, false);
        button.setAttribute("aria-pressed", "true");
        announce(t(locale, "simulation.presetApplied", { preset: t(locale, `pulleySystems.preset.${preset.id}`) }));
      }
    }
  }, options);
  document.addEventListener("visibilitychange", () => { if (document.hidden && runtime.playing) pause(t(locale, "simulation.pausedHidden")); }, options);
  floatingPlayback = initializeSimulationFloatingPlayback({ root, playbackSection, locale, onToggle: togglePlayback, onReset: () => reset() });
  syncControls(); updatePlayback(); updateDom();
  const api = {
    async updateExperience(next) {
      pause(); experience = localizeSimulationExperience(normalizeSimulationExperience(next), locale); runtime.experience = experience;
      runtime.stores = makeStores(); runtime.scenarioId = "table-hanging"; resetDomain(); syncControls(); updateDom();
    },
    async destroy() { pause(); floatingPlayback?.destroy(); abortController.abort(); await renderer.destroy(); runtimes.delete(root); },
  };
  window.addEventListener("pagehide", () => api.destroy(), { ...options, once: true });
  return api;
};

export const initializePulleySystemsSimulation = async (root, experience) => {
  if (!(root instanceof HTMLElement)) return null;
  if (runtimes.has(root)) { if (experience) await runtimes.get(root).updateExperience(experience); return runtimes.get(root); }
  if (pending.has(root)) return pending.get(root);
  const promise = createRuntime(root, experience).then((api) => { pending.delete(root); runtimes.set(root, api); return api; }, (error) => { pending.delete(root); throw error; });
  pending.set(root, promise);
  return promise;
};

export const destroyPulleySystemsSimulation = async (root) => {
  const api = runtimes.get(root) ?? await pending.get(root);
  await api?.destroy();
};
