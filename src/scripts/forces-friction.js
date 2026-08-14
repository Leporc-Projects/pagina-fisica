import { getSimulationModelById, localizeSimulationModel } from "../data/simulation-models.js";
import { formatNumber, t } from "../i18n/index.js";
import { normalizeSimulationExperience, validateSimulationExperience } from "../utils/simulation-experience.js";
import { createForcesFrictionState, getForcesFrictionReadings, stepForcesFriction } from "../utils/forces-friction.js";
import { createForcesFrictionP5Renderer } from "./p5-forces-friction-renderer.js";

const runtimes = new WeakMap();
const pending = new WeakMap();
const FIXED_STEP = 1 / 120;
const HISTORY_LIMIT = 301;

const readExperience = (root) => { try { return JSON.parse(root.dataset.experience ?? ""); } catch { return null; } };
const equalParameters = (a, b) => Object.keys(a).every((key) => a[key] === b[key]);

const createRuntime = async (root, suppliedExperience) => {
  const locale = root.dataset.locale === "en" ? "en" : "es";
  const display = (value) => formatNumber(locale, value, { maximumFractionDigits: 2 });
  let experience = normalizeSimulationExperience(suppliedExperience ?? readExperience(root));
  const validation = validateSimulationExperience(experience);
  if (!validation.valid || getSimulationModelById(experience.modelId)?.rendererId !== "p5-forces-friction") throw new TypeError(validation.errors.join(" ") || "Renderer incompatible.");
  const canvas = root.querySelector("[data-forces-friction-canvas]");
  const toggleButton = root.querySelector('[data-action="toggle"]');
  const playbackLabel = root.querySelector("[data-playback-label]");
  const playbackIcon = root.querySelector("[data-playback-icon]");
  const playbackState = root.querySelector("[data-playback-state]");
  const live = root.querySelector("[data-simulation-live]");
  if (!(canvas instanceof HTMLElement) || !(toggleButton instanceof HTMLButtonElement) || !playbackLabel || !playbackIcon || !playbackState || !live) throw new TypeError("La interfaz de fuerzas está incompleta.");
  const abortController = new AbortController();
  const options = { signal: abortController.signal };
  const defaults = () => Object.fromEntries(Object.entries(experience.parameters).map(([key, value]) => [key, value.default]));
  const definitions = () => {
    const model = localizeSimulationModel(getSimulationModelById(experience.modelId), locale);
    return Object.entries(model.parameters).map(([key, definition]) => ({ key, ...definition, ...experience.parameters[key] }));
  };
  const runtime = { parameters: defaults(), state: null, readings: null, history: [], playing: false, frameId: null, previous: null, accumulator: 0, experience, views: { ...experience.views } };
  const resetDomain = () => {
    runtime.state = createForcesFrictionState(runtime.parameters);
    runtime.readings = getForcesFrictionReadings(runtime.state, runtime.parameters);
    runtime.history = [{ t: runtime.state.t, v: runtime.state.v, net: runtime.readings.netParallel }];
  };
  resetDomain();
  const renderer = await createForcesFrictionP5Renderer({ container: canvas, locale, getFrame: () => ({ ...runtime, experience }) });
  const announce = (message) => { live.textContent = ""; requestAnimationFrame(() => { live.textContent = message; }); };
  const statusKey = () => `forcesFriction.status.${runtime.readings.regime === "contact-invalid" ? "contactInvalid" : runtime.readings.regime}`;
  const updatePlayback = () => {
    toggleButton.setAttribute("aria-pressed", String(runtime.playing));
    playbackLabel.textContent = t(locale, runtime.playing ? "simulation.pause" : "simulation.play");
    playbackIcon.textContent = runtime.playing ? "❚❚" : "▶";
    playbackState.textContent = t(locale, runtime.playing ? "simulation.playing" : "simulation.paused");
  };
  const pause = (message) => {
    runtime.playing = false;
    if (runtime.frameId !== null) cancelAnimationFrame(runtime.frameId);
    runtime.frameId = null; runtime.previous = null; runtime.accumulator = 0;
    updatePlayback(); if (message) announce(message);
  };
  const updateDom = () => {
    runtime.readings = getForcesFrictionReadings(runtime.state, runtime.parameters);
    Object.entries(runtime.readings).forEach(([key, value]) => {
      if (typeof value !== "number") return;
      const output = root.querySelector(`[data-reading="${key}"]`); if (output) output.textContent = display(value);
    });
    const status = root.querySelector("[data-status-text]"); if (status) status.textContent = t(locale, statusKey());
    const badge = root.querySelector(".dynamics-status"); if (badge) badge.dataset.regime = runtime.readings.regime;
    const required = Math.abs(runtime.readings.requiredStatic);
    const maximum = runtime.readings.maximumStatic;
    const progress = root.querySelector("[data-friction-progress]");
    if (progress instanceof HTMLProgressElement) { progress.max = Math.max(maximum, 1e-9); progress.value = Math.min(required, progress.max); }
    const values = { "meter-required": required, "meter-maximum": maximum, "meter-kinetic": runtime.readings.regime === "kinetic" ? Math.abs(runtime.readings.friction) : 0 };
    Object.entries(values).forEach(([key, value]) => { const node = root.querySelector(`[data-${key}]`); if (node) node.textContent = display(value); });
    const note = root.querySelector("[data-meter-note]");
    if (note) note.textContent = t(locale, runtime.readings.regime === "static" ? "forcesFriction.meterStatic" : runtime.readings.regime === "kinetic" ? "forcesFriction.meterKinetic" : "forcesFriction.meterInvalid");
    const warning = root.querySelector("[data-contact-warning]"); if (warning instanceof HTMLElement) warning.hidden = runtime.readings.regime !== "contact-invalid";
    toggleButton.disabled = runtime.readings.regime === "contact-invalid";
    renderer.update();
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
      for (const kind of ["range", "number"]) { const input = root.querySelector(`[data-param-${kind}="${control.key}"]`); if (input instanceof HTMLInputElement) { input.min = String(control.minimum); input.max = String(control.maximum); input.step = String(control.step); input.value = String(runtime.parameters[control.key]); } }
      const output = root.querySelector(`[data-param-output="${control.key}"]`); if (output) output.textContent = `${display(runtime.parameters[control.key])} ${control.unit}`;
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
  const reset = (message = t(locale, "simulation.resetDone")) => { pause(); runtime.parameters = defaults(); resetDomain(); syncControls(); updateDom(); announce(message); };
  const applyParameters = (key, value) => {
    pause(); runtime.parameters = { ...runtime.parameters, [key]: value };
    if (key === "v0") resetDomain();
    else {
      runtime.state = stepForcesFriction(runtime.state, runtime.parameters, 0);
      runtime.readings = getForcesFrictionReadings(runtime.state, runtime.parameters);
      runtime.history = [{ t: runtime.state.t, v: runtime.state.v, net: runtime.readings.netParallel }];
    }
    syncControls(); updateDom(); announce(t(locale, "simulation.updated"));
  };
  root.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const key = input.dataset.paramRange ?? input.dataset.paramNumber;
    if (key) { const value = input.valueAsNumber; const definition = definitions().find((entry) => entry.key === key); if (Number.isFinite(value) && value >= definition.minimum && value <= definition.maximum) applyParameters(key, value); }
  }, options);
  root.addEventListener("click", (event) => {
    const button = event.target.closest("button"); if (!(button instanceof HTMLButtonElement)) return;
    if (button.dataset.action === "toggle") {
      if (runtime.playing) pause(t(locale, "simulation.paused"));
      else { runtime.playing = true; updatePlayback(); runtime.frameId = requestAnimationFrame(stepFrame); announce(t(locale, "simulation.playing")); }
    } else if (button.dataset.action === "reset") reset();
    else if (button.dataset.preset) { const preset = experience.presets.find(({ id }) => id === button.dataset.preset); if (preset) { pause(); runtime.parameters = { ...preset.parameters }; resetDomain(); syncControls(); updateDom(); announce(t(locale, "simulation.presetApplied", { preset: preset.label })); } }
  }, options);
  root.querySelector('[data-toggle="fbd"]')?.addEventListener("change", (event) => { experience = { ...experience, views: { ...experience.views, freeBodyDiagram: event.target.checked } }; renderer.update(); }, options);
  renderPresets(); syncControls(); updatePlayback(); updateDom();
  return {
    async updateExperience(next) { pause(); experience = normalizeSimulationExperience(next); runtime.experience = experience; runtime.parameters = defaults(); resetDomain(); renderPresets(); syncControls(); updateDom(); },
    async destroy() { pause(); abortController.abort(); await renderer.destroy(); runtimes.delete(root); },
  };
};

export const initializeForcesFrictionSimulation = async (root, experience) => {
  if (!(root instanceof HTMLElement)) return null;
  if (runtimes.has(root)) { if (experience) await runtimes.get(root).updateExperience(experience); return runtimes.get(root); }
  if (pending.has(root)) return pending.get(root);
  const promise = createRuntime(root, experience).then((api) => { pending.delete(root); runtimes.set(root, api); return api; }, (error) => { pending.delete(root); throw error; });
  pending.set(root, promise); return promise;
};
export const destroyForcesFrictionSimulation = async (root) => { const api = runtimes.get(root) ?? await pending.get(root); await api?.destroy(); };
