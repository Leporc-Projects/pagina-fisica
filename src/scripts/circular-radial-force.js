import { getSimulationModelById, localizeSimulationModel } from "../data/simulation-models.js";
import { formatNumber, t } from "../i18n/index.js";
import { normalizeSimulationExperience, validateSimulationExperience } from "../utils/simulation-experience.js";
import { createCircularRadialState, cutCircularString, getCircularRadialReadings, stepCircularRadial } from "../utils/circular-radial-force.js";
import { createCircularRadialP5Renderer } from "./p5-circular-radial-renderer.js";

const runtimes = new WeakMap();
const pending = new WeakMap();
const equalParameters = (a, b) => Object.keys(a).every((key) => a[key] === b[key]);
const readExperience = (root) => { try { return JSON.parse(root.dataset.experience ?? ""); } catch { return null; } };

const createRuntime = async (root, suppliedExperience) => {
  const locale = root.dataset.locale === "en" ? "en" : "es";
  const display = (value) => formatNumber(locale, value, { maximumFractionDigits: 2 });
  let experience = normalizeSimulationExperience(suppliedExperience ?? readExperience(root));
  const validation = validateSimulationExperience(experience);
  if (!validation.valid || getSimulationModelById(experience.modelId)?.rendererId !== "p5-circular-radial-force") throw new TypeError(validation.errors.join(" ") || "Renderer incompatible.");
  const canvas = root.querySelector("[data-circular-radial-canvas]");
  const toggleButton = root.querySelector('[data-action="toggle"]');
  const cutButton = root.querySelector('[data-action="cut"]');
  const playbackLabel = root.querySelector("[data-playback-label]");
  const playbackIcon = root.querySelector("[data-playback-icon]");
  const playbackState = root.querySelector("[data-playback-state]");
  const live = root.querySelector("[data-simulation-live]");
  if (!(canvas instanceof HTMLElement) || !(toggleButton instanceof HTMLButtonElement) || !(cutButton instanceof HTMLButtonElement) || !playbackLabel || !playbackIcon || !playbackState || !live) throw new TypeError("La interfaz circular está incompleta.");
  const abortController = new AbortController(); const options = { signal: abortController.signal };
  const defaults = () => Object.fromEntries(Object.entries(experience.parameters).map(([key, value]) => [key, value.default]));
  const definitions = () => { const model = localizeSimulationModel(getSimulationModelById(experience.modelId), locale); return Object.entries(model.parameters).map(([key, definition]) => ({ key, ...definition, ...experience.parameters[key] })); };
  const runtime = { parameters: defaults(), state: null, readings: null, trail: [], playing: false, frameId: null, previous: null, toggles: { velocity: true, acceleration: true, tension: true }, experience };
  const resetDomain = () => { runtime.state = createCircularRadialState(runtime.parameters); runtime.readings = getCircularRadialReadings(runtime.state, runtime.parameters); runtime.trail = [runtime.state.position]; };
  resetDomain();
  const renderer = await createCircularRadialP5Renderer({ container: canvas, locale, getFrame: () => ({ ...runtime, experience }) });
  const announce = (message) => { live.textContent = ""; requestAnimationFrame(() => { live.textContent = message; }); };
  const updatePlayback = () => { toggleButton.setAttribute("aria-pressed", String(runtime.playing)); playbackLabel.textContent = t(locale, runtime.playing ? "simulation.pause" : "simulation.play"); playbackIcon.textContent = runtime.playing ? "❚❚" : "▶"; playbackState.textContent = t(locale, runtime.playing ? "simulation.playing" : "simulation.paused"); };
  const pause = (message) => { runtime.playing = false; if (runtime.frameId !== null) cancelAnimationFrame(runtime.frameId); runtime.frameId = null; runtime.previous = null; updatePlayback(); if (message) announce(message); };
  const statusKey = () => `circularDynamics.status.${runtime.state.status === "broken-manual" ? "manual" : runtime.state.status === "broken-overload" ? "overload" : "connected"}`;
  const updateDom = () => {
    runtime.readings = getCircularRadialReadings(runtime.state, runtime.parameters);
    const values = { ...runtime.readings, theta: runtime.state.theta * 180 / Math.PI };
    Object.entries(values).forEach(([key, value]) => { if (typeof value !== "number") return; const node = root.querySelector(`[data-reading="${key}"]`); if (node) node.textContent = display(value); });
    const status = root.querySelector("[data-status-text]"); if (status) status.textContent = t(locale, statusKey());
    const badge = root.querySelector(".dynamics-status"); if (badge) badge.dataset.regime = runtime.state.status;
    const ratio = runtime.readings.requiredTension / runtime.parameters.Tmax;
    const progress = root.querySelector("[data-tension-progress]"); if (progress instanceof HTMLProgressElement) { progress.max = runtime.parameters.Tmax; progress.value = Math.min(runtime.readings.requiredTension, runtime.parameters.Tmax); }
    for (const [selector, value] of [["[data-meter-required]", runtime.readings.requiredTension], ["[data-meter-limit]", runtime.parameters.Tmax], ["[data-meter-ratio]", ratio * 100]]) { const node = root.querySelector(selector); if (node) node.textContent = display(value); }
    const note = root.querySelector("[data-meter-note]"); if (note) note.textContent = t(locale, ratio > 1 ? "circularDynamics.meterOverload" : "circularDynamics.meterWithin");
    cutButton.disabled = runtime.state.status !== "connected";
    const flight = root.querySelector("[data-flight-status]"); if (flight instanceof HTMLElement) flight.hidden = runtime.state.status === "connected";
    renderer.update();
  };
  const renderPresets = () => {
    const list = root.querySelector("[data-presets-list]");
    if (!(list instanceof HTMLElement)) return;
    list.replaceChildren(...experience.presets.map((preset) => {
      const button = document.createElement("button"); button.type = "button";
      button.dataset.preset = preset.id; button.textContent = preset.label; return button;
    }));
  };
  const syncControls = () => {
    definitions().forEach((control) => { for (const kind of ["range", "number"]) { const input = root.querySelector(`[data-param-${kind}="${control.key}"]`); if (input instanceof HTMLInputElement) { input.min = String(control.minimum); input.max = String(control.maximum); input.step = String(control.step); input.value = String(runtime.parameters[control.key]); } } const output = root.querySelector(`[data-param-output="${control.key}"]`); if (output) output.textContent = `${display(runtime.parameters[control.key])} ${control.unit}`; });
    root.querySelectorAll("[data-preset]").forEach((button) => { const preset = experience.presets.find(({ id }) => id === button.dataset.preset); button.setAttribute("aria-pressed", String(Boolean(preset && equalParameters(preset.parameters, runtime.parameters)))); });
  };
  const stepFrame = (time) => {
    if (!runtime.playing) return;
    if (runtime.previous === null) runtime.previous = time;
    const dt = Math.min(0.1, Math.max(0, (time - runtime.previous) / 1000)); runtime.previous = time;
    const previousStatus = runtime.state.status;
    runtime.state = stepCircularRadial(runtime.state, runtime.parameters, dt);
    runtime.trail.push(runtime.state.position); if (runtime.trail.length > 240) runtime.trail.shift();
    updateDom();
    if (previousStatus === "connected" && runtime.state.status === "broken-overload") announce(t(locale, "circularDynamics.overloadAnnounce"));
    if (runtime.state.status !== "connected" && runtime.state.t - runtime.state.breakTime >= 3) { pause(t(locale, "circularDynamics.autoPaused")); return; }
    runtime.frameId = requestAnimationFrame(stepFrame);
  };
  const reset = (message = t(locale, "simulation.resetDone")) => { pause(); runtime.parameters = defaults(); resetDomain(); syncControls(); updateDom(); announce(message); };
  root.addEventListener("input", (event) => { const input = event.target; if (!(input instanceof HTMLInputElement)) return; const key = input.dataset.paramRange ?? input.dataset.paramNumber; if (key) { const value = input.valueAsNumber; const definition = definitions().find((entry) => entry.key === key); if (Number.isFinite(value) && value >= definition.minimum && value <= definition.maximum) { pause(); runtime.parameters = { ...runtime.parameters, [key]: value }; resetDomain(); syncControls(); updateDom(); announce(t(locale, "simulation.updated")); } } }, options);
  root.addEventListener("change", (event) => { const input = event.target; if (input instanceof HTMLInputElement && input.dataset.vectorToggle) { runtime.toggles[input.dataset.vectorToggle] = input.checked; renderer.update(); } }, options);
  root.addEventListener("click", (event) => {
    const button = event.target.closest("button"); if (!(button instanceof HTMLButtonElement)) return;
    if (button.dataset.action === "toggle") { if (runtime.playing) pause(t(locale, "simulation.paused")); else { runtime.playing = true; updatePlayback(); runtime.frameId = requestAnimationFrame(stepFrame); announce(t(locale, "simulation.playing")); } }
    else if (button.dataset.action === "reset") reset();
    else if (button.dataset.action === "cut" && runtime.state.status === "connected") { runtime.state = cutCircularString(runtime.state, runtime.parameters); runtime.trail.push(runtime.state.position); updateDom(); announce(t(locale, "circularDynamics.cutAnnounce")); }
    else if (button.dataset.preset) { const preset = experience.presets.find(({ id }) => id === button.dataset.preset); if (preset) { pause(); runtime.parameters = { ...preset.parameters }; resetDomain(); syncControls(); updateDom(); announce(t(locale, "simulation.presetApplied", { preset: preset.label })); } }
  }, options);
  renderPresets(); syncControls(); updatePlayback(); updateDom();
  return { async updateExperience(next) { pause(); experience = normalizeSimulationExperience(next); runtime.experience = experience; runtime.parameters = defaults(); resetDomain(); renderPresets(); syncControls(); updateDom(); }, async destroy() { pause(); abortController.abort(); await renderer.destroy(); runtimes.delete(root); } };
};

export const initializeCircularRadialSimulation = async (root, experience) => { if (!(root instanceof HTMLElement)) return null; if (runtimes.has(root)) { if (experience) await runtimes.get(root).updateExperience(experience); return runtimes.get(root); } if (pending.has(root)) return pending.get(root); const promise = createRuntime(root, experience).then((api) => { pending.delete(root); runtimes.set(root, api); return api; }, (error) => { pending.delete(root); throw error; }); pending.set(root, promise); return promise; };
export const destroyCircularRadialSimulation = async (root) => { const api = runtimes.get(root) ?? await pending.get(root); await api?.destroy(); };
