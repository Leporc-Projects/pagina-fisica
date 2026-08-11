import { getSimulationModelById, localizeSimulationModel } from "../data/simulation-models.js";
import { formatNumber, t } from "../i18n/index.js";
import {
  normalizeSimulationExperience,
  validateSimulationExperience,
} from "../utils/simulation-experience.js";
import {
  PROJECTILE_EPSILON,
  createProjectileDomains,
  getProjectileState,
  getProjectileSummary,
  sampleProjectile,
  validateProjectileParameters,
} from "../utils/projectile-2d.js";
import { createProjectileP5Renderer } from "./p5-projectile-renderer.js";

const runtimes = new WeakMap();
const pendingRuntimes = new WeakMap();

const readEmbeddedExperience = (root) => {
  try {
    return JSON.parse(root.dataset.experience ?? "");
  } catch {
    return null;
  }
};

const parametersEqual = (first, second) =>
  Object.keys(first).every((key) => first[key] === second[key]);

const createRuntime = async (root, suppliedExperience) => {
  const locale = root.dataset.locale === "en" ? "en" : "es";
  const displayNumber = (value, digits = 2) => formatNumber(locale, value, { maximumFractionDigits: digits });
  let experience = normalizeSimulationExperience(
    suppliedExperience ?? readEmbeddedExperience(root)
  );
  const initialValidation = validateSimulationExperience(experience);
  const initialModel = getSimulationModelById(experience.modelId);
  if (!initialValidation.valid || initialModel?.rendererId !== "p5-projectile-2d") {
    throw new TypeError(initialValidation.errors.join(" ") || "Renderer incompatible.");
  }

  const canvasContainer = root.querySelector("[data-projectile-canvas]");
  const scrubber = root.querySelector("[data-time-scrubber]");
  const toggleButton = root.querySelector('[data-action="toggle"]');
  const playbackLabel = root.querySelector("[data-playback-label]");
  const playbackIcon = root.querySelector("[data-playback-icon]");
  const playbackState = root.querySelector("[data-playback-state]");
  const timeOutput = root.querySelector("[data-time-output]");
  const liveRegion = root.querySelector("[data-simulation-live]");
  const rendererError = root.querySelector("[data-projectile-renderer-error]");
  if (!(canvasContainer instanceof HTMLElement) ||
      !(scrubber instanceof HTMLInputElement) ||
      !(toggleButton instanceof HTMLButtonElement) ||
      !playbackLabel || !playbackIcon || !playbackState || !timeOutput || !liveRegion) {
    throw new TypeError("La interfaz del proyectil está incompleta.");
  }

  const abortController = new AbortController();
  const listenerOptions = { signal: abortController.signal };
  const defaultsFromExperience = () => Object.fromEntries(
    Object.entries(experience.parameters).map(([key, config]) => [key, config.default])
  );
  const parameterDefinitions = () => {
    const model = localizeSimulationModel(getSimulationModelById(experience.modelId), locale);
    return Object.entries(model.parameters).map(([key, definition]) => ({
      key,
      ...definition,
      ...experience.parameters[key],
    }));
  };
  const state = {
    parameters: defaultsFromExperience(),
    time: 0,
    playing: false,
    frameId: null,
    frameStart: null,
    playStartTime: 0,
    frame: null,
  };

  const announce = (message) => {
    liveRegion.textContent = "";
    window.requestAnimationFrame(() => { liveRegion.textContent = message; });
  };
  const summary = () => getProjectileSummary(state.parameters);
  const updateFrameData = () => {
    const flight = summary();
    state.time = Math.max(0, Math.min(flight.flightTime, state.time));
    state.frame = {
      parameters: { ...state.parameters },
      state: getProjectileState(state.parameters, state.time),
      summary: flight,
      samples: sampleProjectile(state.parameters, 161),
      domains: createProjectileDomains(state.parameters),
      views: { ...experience.views },
    };
  };

  updateFrameData();
  let renderer;
  try {
    renderer = await createProjectileP5Renderer({
      container: canvasContainer,
      getFrame: () => state.frame,
      locale,
    });
  } catch (error) {
    if (rendererError instanceof HTMLElement) {
      rendererError.hidden = false;
      rendererError.textContent = t(locale, "projectile.rendererError");
    }
    throw error;
  }

  const setPlaybackPresentation = () => {
    toggleButton.setAttribute("aria-pressed", String(state.playing));
    playbackLabel.textContent = state.playing ? t(locale, "simulation.pause") : t(locale, "simulation.play");
    playbackIcon.textContent = state.playing ? "❚❚" : "▶";
    playbackState.textContent = state.playing ? t(locale, "simulation.playing") : t(locale, "simulation.paused");
  };
  const pause = ({ shouldAnnounce = false, reason = t(locale, "simulation.paused") } = {}) => {
    state.playing = false;
    if (state.frameId !== null) window.cancelAnimationFrame(state.frameId);
    state.frameId = null;
    state.frameStart = null;
    setPlaybackPresentation();
    if (shouldAnnounce) announce(reason);
  };
  const updateReadings = () => {
    const physical = state.frame.state;
    const readings = {
      time: physical.time,
      x: physical.position.x,
      y: physical.position.y,
      vx: physical.velocity.x,
      vy: physical.velocity.y,
      speed: physical.speed,
      ax: physical.acceleration.x,
      ay: physical.acceleration.y,
    };
    Object.entries(readings).forEach(([key, value]) => {
      const output = root.querySelector(`[data-reading="${key}"]`);
      if (output) output.textContent = displayNumber(value);
    });
    Object.entries({
      flightTime: state.frame.summary.flightTime,
      range: state.frame.summary.range,
      maximumHeight: state.frame.summary.maximumHeight,
    }).forEach(([key, value]) => {
      const output = root.querySelector(`[data-summary="${key}"]`);
      if (output) output.textContent = displayNumber(value);
    });
    timeOutput.textContent = `${displayNumber(physical.time)} s`;
    scrubber.max = String(state.frame.summary.flightTime);
    scrubber.value = String(physical.time);
    const immediate = state.frame.summary.flightTime <= PROJECTILE_EPSILON;
    toggleButton.disabled = immediate;
    scrubber.disabled = immediate;
    if (immediate) playbackState.textContent = t(locale, "projectile.immediateGround");
  };
  const updateControlOutputs = () => {
    parameterDefinitions().forEach((control) => {
      const output = root.querySelector(`[data-param-output="${control.key}"]`);
      if (output) output.textContent = `${displayNumber(state.parameters[control.key])} ${control.unit}`;
    });
  };
  const updatePresetState = () => {
    root.querySelectorAll("[data-preset]").forEach((button) => {
      const preset = experience.presets.find((entry) => entry.id === button.dataset.preset);
      button.setAttribute("aria-pressed", String(Boolean(preset && parametersEqual(preset.parameters, state.parameters))));
    });
  };
  const updateFrame = () => {
    updateFrameData();
    renderer.update();
    updateReadings();
  };

  const clearValidation = () => {
    root.querySelectorAll("[data-param-field]").forEach((field) => field.classList.remove("is-invalid"));
    root.querySelectorAll("[data-param-error]").forEach((output) => { output.textContent = ""; });
  };
  const readParameters = () => {
    const parameters = {};
    const issues = [];
    parameterDefinitions().forEach((control) => {
      const input = root.querySelector(`[data-param-number="${control.key}"]`);
      const value = input?.valueAsNumber;
      parameters[control.key] = value;
      if (!Number.isFinite(value) || value < control.minimum || value > control.maximum) {
        issues.push({
          field: control.key,
          message: t(locale, "simulation.valueOutOfRange", { label: control.label, minimum: control.minimum, maximum: control.maximum, unit: control.unit }),
        });
      }
    });
    if (issues.length === 0) issues.push(...validateProjectileParameters(parameters).issues);
    return { parameters, issues };
  };
  const showValidation = (issues) => {
    clearValidation();
    issues.forEach((issue) => {
      root.querySelector(`[data-param-field="${issue.field}"]`)?.classList.add("is-invalid");
      const output = root.querySelector(`[data-param-error="${issue.field}"]`);
      if (output) output.textContent = issue.message;
    });
  };
  const applyParameters = (parameters, message = t(locale, "simulation.updated")) => {
    pause();
    state.parameters = { ...parameters };
    state.time = Math.min(state.time, summary().flightTime);
    clearValidation();
    updateFrame();
    updateControlOutputs();
    updatePresetState();
    announce(message);
  };
  const configureControls = () => {
    parameterDefinitions().forEach((control) => {
      for (const selector of ["range", "number"]) {
        const input = root.querySelector(`[data-param-${selector}="${control.key}"]`);
        if (!(input instanceof HTMLInputElement)) continue;
        input.min = String(control.minimum);
        input.max = String(control.maximum);
        input.step = String(control.step);
        input.value = String(control.default);
        input.disabled = !control.editable;
      }
      const limits = root.querySelector(`[data-param-limits="${control.key}"]`);
      if (limits) {
        limits.textContent = control.editable
          ? t(locale, "simulation.range", { minimum: control.minimum, maximum: control.maximum, unit: control.unit })
          : t(locale, "simulation.fixed", { value: displayNumber(control.default), unit: control.unit });
      }
    });
  };
  const renderPresets = () => {
    const fieldset = root.querySelector("[data-presets-fieldset]");
    const list = root.querySelector("[data-presets-list]");
    if (!(fieldset instanceof HTMLElement) || !(list instanceof HTMLElement)) return;
    fieldset.hidden = experience.presets.length === 0;
    list.replaceChildren(...experience.presets.map((preset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.preset = preset.id;
      button.setAttribute("aria-pressed", String(parametersEqual(preset.parameters, state.parameters)));
      button.textContent = preset.label;
      return button;
    }));
  };
  const applyViewVisibility = () => {
    root.querySelectorAll("[data-view-section]").forEach((element) => {
      element.hidden = experience.views[element.dataset.viewSection] !== true;
    });
  };

  const animationFrame = (timestamp) => {
    if (!state.playing) return;
    if (state.frameStart === null) state.frameStart = timestamp;
    state.time = Math.min(
      summary().flightTime,
      state.playStartTime + (timestamp - state.frameStart) / 1000
    );
    updateFrame();
    if (state.time >= summary().flightTime - PROJECTILE_EPSILON) {
      pause();
      playbackState.textContent = t(locale, "projectile.groundImpact");
      announce(t(locale, "projectile.reachedGround"));
      return;
    }
    state.frameId = window.requestAnimationFrame(animationFrame);
  };
  const play = () => {
    const flightTime = summary().flightTime;
    if (flightTime <= PROJECTILE_EPSILON) {
      announce(t(locale, "projectile.immediateAnnounce"));
      return;
    }
    if (state.time >= flightTime - PROJECTILE_EPSILON) state.time = 0;
    state.playing = true;
    state.frameStart = null;
    state.playStartTime = state.time;
    setPlaybackPresentation();
    announce(t(locale, "simulation.started"));
    state.frameId = window.requestAnimationFrame(animationFrame);
  };

  root.querySelectorAll("[data-param-range], [data-param-number]").forEach((input) => {
    input.addEventListener("input", (event) => {
      const source = event.currentTarget;
      const key = source.dataset.paramRange ?? source.dataset.paramNumber;
      if (!key || experience.parameters[key]?.editable !== true) return;
      pause({ shouldAnnounce: state.playing, reason: t(locale, "simulation.pausedForParameters") });
      if (source.matches("[data-param-range]")) {
        const number = root.querySelector(`[data-param-number="${key}"]`);
        if (number instanceof HTMLInputElement) number.value = source.value;
      } else if (Number.isFinite(source.valueAsNumber)) {
        const range = root.querySelector(`[data-param-range="${key}"]`);
        if (range instanceof HTMLInputElement) range.value = source.value;
      }
      const result = readParameters();
      if (result.issues.length > 0) {
        showValidation(result.issues);
        announce(result.issues[0].message);
        return;
      }
      applyParameters(result.parameters);
    }, listenerOptions);
  });
  root.querySelector("[data-presets-list]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!(button instanceof HTMLButtonElement)) return;
    const preset = experience.presets.find((entry) => entry.id === button.dataset.preset);
    if (!preset) return;
    parameterDefinitions().forEach((control) => {
      for (const selector of ["range", "number"]) {
        const input = root.querySelector(`[data-param-${selector}="${control.key}"]`);
        if (input instanceof HTMLInputElement) input.value = String(preset.parameters[control.key]);
      }
    });
    state.time = 0;
    applyParameters(preset.parameters, t(locale, "simulation.presetLoaded", { label: preset.label }));
  }, listenerOptions);
  toggleButton.addEventListener("click", () => {
    if (state.playing) pause({ shouldAnnounce: true });
    else play();
  }, listenerOptions);
  root.querySelector('[data-action="reset"]')?.addEventListener("click", () => {
    pause();
    state.time = 0;
    updateFrame();
    announce(t(locale, "simulation.resetAnnounce"));
  }, listenerOptions);
  scrubber.addEventListener("input", () => {
    pause({ shouldAnnounce: state.playing, reason: t(locale, "simulation.pausedForTime") });
    if (Number.isFinite(scrubber.valueAsNumber)) {
      state.time = Math.max(0, Math.min(summary().flightTime, scrubber.valueAsNumber));
      updateFrame();
    }
  }, listenerOptions);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.playing) {
      pause({ shouldAnnounce: true, reason: t(locale, "simulation.pausedHidden") });
    }
  }, listenerOptions);

  const api = {
    get experience() { return experience; },
    updateExperience(nextExperience) {
      const normalized = normalizeSimulationExperience(nextExperience);
      const validation = validateSimulationExperience(normalized);
      const model = getSimulationModelById(normalized.modelId);
      if (!validation.valid || model?.rendererId !== "p5-projectile-2d") {
        throw new TypeError(validation.errors.join(" ") || "Renderer incompatible.");
      }
      pause();
      experience = normalized;
      state.parameters = defaultsFromExperience();
      state.time = 0;
      configureControls();
      renderPresets();
      applyViewVisibility();
      clearValidation();
      updateFrame();
      updateControlOutputs();
      updatePresetState();
      announce(t(locale, "simulation.previewUpdated"));
      return experience;
    },
    destroy() {
      pause();
      abortController.abort();
      renderer.destroy();
      root.removeAttribute("data-initialized");
      runtimes.delete(root);
      pendingRuntimes.delete(root);
    },
  };

  runtimes.set(root, api);
  root.dataset.initialized = "true";
  configureControls();
  renderPresets();
  applyViewVisibility();
  updateFrame();
  updateControlOutputs();
  updatePresetState();
  setPlaybackPresentation();
  window.addEventListener("pagehide", () => api.destroy(), { ...listenerOptions, once: true });
  return api;
};

export const initializeProjectileSimulation = async (root, suppliedExperience) => {
  if (!(root instanceof HTMLElement)) return null;
  const existing = runtimes.get(root);
  if (existing) {
    if (suppliedExperience) existing.updateExperience(suppliedExperience);
    return existing;
  }
  const pending = pendingRuntimes.get(root);
  if (pending) {
    const runtime = await pending;
    if (suppliedExperience) runtime.updateExperience(suppliedExperience);
    return runtime;
  }
  const creation = createRuntime(root, suppliedExperience).catch((error) => {
    root.dataset.initialized = "error";
    pendingRuntimes.delete(root);
    throw error;
  });
  pendingRuntimes.set(root, creation);
  return creation;
};

export const destroyProjectileSimulation = async (root) => {
  const runtime = runtimes.get(root) ?? await pendingRuntimes.get(root);
  runtime?.destroy();
};

if (typeof document !== "undefined") {
  document.querySelectorAll("[data-projectile-simulation]").forEach((root) => {
    if (!root.closest("[data-renderer-slot][hidden]")) {
      initializeProjectileSimulation(root).catch(() => {
        // El mensaje de error queda localizado dentro de la simulación.
      });
    }
  });
}
