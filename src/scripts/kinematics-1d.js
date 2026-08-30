import { getSimulationModelById, localizeSimulationModel } from "../data/simulation-models.js";
import { formatNumber, t } from "../i18n/index.js";
import {
  normalizeSimulationExperience,
  validateSimulationExperience,
} from "../utils/simulation-experience.js";
import {
  getKinematicsState,
  getTurningPoint,
  validateKinematicsParameters,
} from "../utils/kinematics-1d.js";
import {
  KINEMATICS_CHART_VIEW,
  KINEMATICS_MOTION_VIEW,
  createKinematicsChartGeometry,
  createKinematicsMotionGeometry,
} from "../utils/kinematics-svg.js";
import { initializeSimulationFloatingPlayback } from "./simulation-floating-playback.js";
import { createAnalyticsOneShot, trackSimulationStart } from "../utils/analytics.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const quantityViews = Object.freeze({
  position: "positionGraph",
  velocity: "velocityGraph",
  acceleration: "accelerationGraph",
});
const runtimes = new WeakMap();

const createSvgElement = (name, attributes = {}, content = null) => {
  const element = document.createElementNS(SVG_NAMESPACE, name);
  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, String(value));
  }
  if (content !== null) element.textContent = content;
  return element;
};

const readEmbeddedExperience = (root) => {
  try {
    return JSON.parse(root.dataset.experience ?? "");
  } catch {
    return null;
  }
};

export const initializeKinematicsSimulation = (root, suppliedExperience) => {
  if (!(root instanceof HTMLElement)) return null;
  const existing = runtimes.get(root);
  if (existing) {
    if (suppliedExperience) existing.updateExperience(suppliedExperience);
    return existing;
  }

  const locale = root.dataset.locale === "en" ? "en" : "es";
  const displayNumber = (value, digits = 2) => formatNumber(locale, value, { maximumFractionDigits: digits });
  let experience = normalizeSimulationExperience(
    suppliedExperience ?? readEmbeddedExperience(root)
  );
  const initialValidation = validateSimulationExperience(experience);
  const initialModel = getSimulationModelById(experience.modelId);
  if (!initialValidation.valid || initialModel?.rendererId !== "svg-kinematics-1d") {
    root.dataset.initialized = "error";
    return null;
  }

  const scrubber = root.querySelector("[data-time-scrubber]");
  const toggleButton = root.querySelector('[data-action="toggle"]');
  const playbackLabel = root.querySelector("[data-playback-label]");
  const playbackIcon = root.querySelector("[data-playback-icon]");
  const playbackState = root.querySelector("[data-playback-state]");
  const timeOutput = root.querySelector("[data-time-output]");
  const liveRegion = root.querySelector("[data-simulation-live]");
  const playbackSection = root.querySelector("[data-playback-section]");
  if (
    !(scrubber instanceof HTMLInputElement) ||
    !(toggleButton instanceof HTMLButtonElement) ||
    !playbackLabel ||
    !playbackIcon ||
    !playbackState ||
    !timeOutput ||
    !liveRegion
  ) return null;

  const abortController = new AbortController();
  const listenerOptions = { signal: abortController.signal };
  const trackFirstStart = createAnalyticsOneShot(() =>
    trackSimulationStart("kinematics-1d", locale)
  );
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
    chartGeometries: new Map(),
    motionGeometry: null,
  };
  let floatingPlayback = null;

  const announce = (message) => {
    liveRegion.textContent = "";
    window.requestAnimationFrame(() => {
      liveRegion.textContent = message;
    });
  };

  const setPlaybackPresentation = () => {
    toggleButton.setAttribute("aria-pressed", String(state.playing));
    playbackLabel.textContent = state.playing ? t(locale, "simulation.pause") : t(locale, "simulation.play");
    playbackIcon.textContent = state.playing ? "❚❚" : "▶";
    playbackState.textContent = state.playing ? t(locale, "simulation.playing") : t(locale, "simulation.paused");
    syncFloatingPlayback();
  };

  const syncFloatingPlayback = () => {
    floatingPlayback?.sync({
      playing: state.playing,
      timeText: timeOutput.textContent,
      disabled: toggleButton.disabled,
    });
  };

  const pause = ({ shouldAnnounce = false, reason = t(locale, "simulation.paused") } = {}) => {
    const wasPlaying = state.playing;
    state.playing = false;
    state.frameStart = null;
    if (state.frameId !== null) {
      window.cancelAnimationFrame(state.frameId);
      state.frameId = null;
    }
    setPlaybackPresentation();
    if (shouldAnnounce && wasPlaying) announce(reason);
  };

  const updateReadings = (physicalState) => {
    for (const key of [
      "time",
      "position",
      "displacement",
      "distance",
      "velocity",
      "speed",
      "acceleration",
    ]) {
      const element = root.querySelector(`[data-reading="${key}"]`);
      if (element) element.textContent = displayNumber(physicalState[key]);
    }
    const direction = root.querySelector('[data-reading="direction"]');
    const directionKey = physicalState.direction === "hacia +x" ? "positive" : physicalState.direction === "hacia −x" ? "negative" : "stationary";
    if (direction) direction.textContent = t(locale, "kinematics.direction", { direction: t(locale, `simulation.direction.${directionKey}`) });
    timeOutput.textContent = `${displayNumber(physicalState.time)} s`;
    syncFloatingPlayback();
  };

  const updateFrame = () => {
    const physicalState = getKinematicsState(state.parameters, state.time);
    scrubber.value = String(state.time);
    updateReadings(physicalState);

    for (const quantityKey of Object.keys(quantityViews)) {
      const figure = root.querySelector(`[data-kinematics-chart="${quantityKey}"]`);
      const geometry = state.chartGeometries.get(quantityKey);
      if (!figure || !geometry) continue;
      const point = geometry.transform.point({
        x: state.time,
        y: physicalState[quantityKey],
      });
      const cursor = figure.querySelector("[data-chart-cursor]");
      const current = figure.querySelector("[data-chart-current]");
      if (cursor) {
        cursor.setAttribute("x1", String(point.x));
        cursor.setAttribute("x2", String(point.x));
      }
      if (current) {
        current.setAttribute("cx", String(point.x));
        current.setAttribute("cy", String(point.y));
      }
    }

    const motionCurrent = root.querySelector("[data-motion-current]");
    const motionCurrentLabel = root.querySelector("[data-motion-current-label]");
    if (state.motionGeometry && motionCurrent && motionCurrentLabel) {
      const x = state.motionGeometry.transform.x(physicalState.position);
      const labelX = Math.min(
        KINEMATICS_MOTION_VIEW.plot.left + KINEMATICS_MOTION_VIEW.plot.width - 45,
        Math.max(KINEMATICS_MOTION_VIEW.plot.left + 45, x)
      );
      motionCurrent.setAttribute("cx", String(x));
      motionCurrentLabel.setAttribute("x", String(labelX));
      motionCurrentLabel.textContent = `x = ${displayNumber(physicalState.position)} m`;
    }
  };

  const populateChartGeometry = (quantityKey) => {
    const figure = root.querySelector(`[data-kinematics-chart="${quantityKey}"]`);
    if (!figure) {
      state.chartGeometries.delete(quantityKey);
      return;
    }
    const geometry = createKinematicsChartGeometry(state.parameters, quantityKey);
    state.chartGeometries.set(quantityKey, geometry);
    figure.dataset.xMin = String(geometry.xDomain[0]);
    figure.dataset.xMax = String(geometry.xDomain[1]);
    figure.dataset.yMin = String(geometry.yDomain[0]);
    figure.dataset.yMax = String(geometry.yDomain[1]);
    figure.querySelector("[data-chart-curve]")?.setAttribute("d", geometry.linePath);

    const grid = figure.querySelector("[data-chart-grid]");
    if (grid) {
      grid.replaceChildren(
        ...geometry.xTicks.map((tick) => createSvgElement("line", {
          x1: geometry.transform.x(tick),
          y1: KINEMATICS_CHART_VIEW.plot.top,
          x2: geometry.transform.x(tick),
          y2: KINEMATICS_CHART_VIEW.plot.top + KINEMATICS_CHART_VIEW.plot.height,
        })),
        ...geometry.yTicks.map((tick) => createSvgElement("line", {
          x1: KINEMATICS_CHART_VIEW.plot.left,
          y1: geometry.transform.y(tick),
          x2: KINEMATICS_CHART_VIEW.plot.left + KINEMATICS_CHART_VIEW.plot.width,
          y2: geometry.transform.y(tick),
        }))
      );
    }

    const ticks = figure.querySelector("[data-chart-ticks]");
    if (ticks) {
      ticks.replaceChildren(
        ...geometry.xTicks.map((tick) => createSvgElement("text", {
          x: geometry.transform.x(tick),
          y: KINEMATICS_CHART_VIEW.plot.top + KINEMATICS_CHART_VIEW.plot.height + 18,
          "text-anchor": "middle",
        }, displayNumber(tick, 1))),
        ...geometry.yTicks.map((tick) => createSvgElement("text", {
          x: KINEMATICS_CHART_VIEW.plot.left - 9,
          y: geometry.transform.y(tick),
          "text-anchor": "end",
          "dominant-baseline": "middle",
        }, displayNumber(tick, 1)))
      );
    }

    const zero = figure.querySelector("[data-chart-zero]");
    if (zero) {
      zero.replaceChildren(...(geometry.zeroY === null ? [] : [
        createSvgElement("line", {
          x1: KINEMATICS_CHART_VIEW.plot.left,
          y1: geometry.zeroY,
          x2: KINEMATICS_CHART_VIEW.plot.left + KINEMATICS_CHART_VIEW.plot.width,
          y2: geometry.zeroY,
        }),
      ]));
    }
  };

  const populateMotionGeometry = () => {
    const motionFigure = root.querySelector("[data-kinematics-motion]");
    const motionInitial = root.querySelector("[data-motion-initial]");
    if (!motionFigure || !motionInitial) {
      state.motionGeometry = null;
      return;
    }
    const geometry = createKinematicsMotionGeometry(state.parameters);
    state.motionGeometry = geometry;
    motionFigure.dataset.xMin = String(geometry.xDomain[0]);
    motionFigure.dataset.xMax = String(geometry.xDomain[1]);

    const tickGroup = motionFigure.querySelector("[data-motion-ticks]");
    if (tickGroup) {
      tickGroup.replaceChildren(...geometry.ticks.map((tick) => {
        const group = createSvgElement("g");
        group.append(
          createSvgElement("line", {
            x1: geometry.transform.x(tick),
            y1: KINEMATICS_MOTION_VIEW.axisY - 8,
            x2: geometry.transform.x(tick),
            y2: KINEMATICS_MOTION_VIEW.axisY + 8,
          }),
          createSvgElement("text", {
            x: geometry.transform.x(tick),
            y: KINEMATICS_MOTION_VIEW.axisY + 30,
            "text-anchor": "middle",
          }, displayNumber(tick, 1))
        );
        return group;
      }));
    }

    const origin = motionFigure.querySelector("[data-motion-origin]");
    if (origin) {
      if (geometry.originX === null) {
        origin.replaceChildren();
      } else {
        const group = createSvgElement("g");
        group.append(
          createSvgElement("line", {
            class: "kinematics-motion__origin",
            x1: geometry.originX,
            y1: KINEMATICS_MOTION_VIEW.axisY - 35,
            x2: geometry.originX,
            y2: KINEMATICS_MOTION_VIEW.axisY + 35,
          }),
          createSvgElement("text", {
            x: geometry.originX,
            y: KINEMATICS_MOTION_VIEW.axisY - 45,
            "text-anchor": "middle",
          }, t(locale, "kinematics.origin"))
        );
        origin.replaceChildren(group);
      }
    }
    motionInitial.setAttribute("x1", String(geometry.initialX));
    motionInitial.setAttribute("x2", String(geometry.initialX));
  };

  const updateTurningReading = () => {
    const container = root.querySelector("[data-turning-reading]");
    if (!container) return;
    const turning = getTurningPoint(state.parameters);
    container.hidden = experience.views.turningPoint !== true || !turning;
    if (!turning) return;
    const time = container.querySelector("[data-turn-time]");
    const position = container.querySelector("[data-turn-position]");
    if (time) time.textContent = displayNumber(turning.time);
    if (position) position.textContent = displayNumber(turning.position);
  };

  const rebuildVisuals = () => {
    Object.keys(quantityViews).forEach(populateChartGeometry);
    populateMotionGeometry();
    updateTurningReading();
    scrubber.max = String(state.parameters.T);
  };

  const clearValidation = () => {
    for (const control of parameterDefinitions()) {
      root.querySelector(`[data-param-field="${control.key}"]`)?.classList.remove("is-invalid");
      const error = root.querySelector(`[data-param-error="${control.key}"]`);
      if (error) error.textContent = "";
      root.querySelector(`[data-param-number="${control.key}"]`)?.removeAttribute("aria-invalid");
      root.querySelector(`[data-param-range="${control.key}"]`)?.removeAttribute("aria-invalid");
    }
  };

  const showValidation = (issues) => {
    clearValidation();
    for (const entry of issues) {
      const field = root.querySelector(`[data-param-field="${entry.field}"]`);
      const error = root.querySelector(`[data-param-error="${entry.field}"]`);
      field?.classList.add("is-invalid");
      if (error) error.textContent = entry.message;
      root.querySelector(`[data-param-number="${entry.field}"]`)?.setAttribute("aria-invalid", "true");
      root.querySelector(`[data-param-range="${entry.field}"]`)?.setAttribute("aria-invalid", "true");
    }
  };

  const readParameters = () => {
    const parameters = {};
    const inputIssues = [];
    for (const control of parameterDefinitions()) {
      const input = root.querySelector(`[data-param-number="${control.key}"]`);
      if (!(input instanceof HTMLInputElement)) continue;
      parameters[control.key] = input.valueAsNumber;
      if (!Number.isFinite(input.valueAsNumber) ||
          input.valueAsNumber < control.minimum ||
          input.valueAsNumber > control.maximum) {
        inputIssues.push({
          field: control.key,
          message: t(locale, "simulation.valueOutOfRange", { label: control.label, minimum: control.minimum, maximum: control.maximum, unit: control.unit }),
        });
      } else if (input.validity.stepMismatch) {
        inputIssues.push({
          field: control.key,
          message: t(locale, "simulation.invalidStep", { label: control.label, step: control.step, unit: control.unit }),
        });
      }
    }
    return {
      parameters,
      issues: inputIssues.length === 0 ? validateKinematicsParameters(parameters).issues : inputIssues,
    };
  };

  const parametersEqual = (first, second) =>
    parameterDefinitions().every((control) => first[control.key] === second[control.key]);

  const updatePresetState = () => {
    for (const preset of experience.presets) {
      root.querySelector(`[data-preset="${preset.id}"]`)?.setAttribute(
        "aria-pressed",
        String(parametersEqual(preset.parameters, state.parameters))
      );
    }
  };

  const updateControlOutputs = () => {
    for (const control of parameterDefinitions()) {
      const output = root.querySelector(`[data-param-output="${control.key}"]`);
      if (output) {
        output.textContent = `${displayNumber(state.parameters[control.key])} ${control.unit}`;
      }
    }
  };

  const applyParameters = (parameters, message = t(locale, "simulation.updated")) => {
    pause();
    state.parameters = { ...parameters };
    state.time = Math.min(state.time, state.parameters.T);
    clearValidation();
    rebuildVisuals();
    updateFrame();
    updateControlOutputs();
    updatePresetState();
    announce(message);
  };

  const configureControls = () => {
    for (const control of parameterDefinitions()) {
      const range = root.querySelector(`[data-param-range="${control.key}"]`);
      const number = root.querySelector(`[data-param-number="${control.key}"]`);
      for (const input of [range, number]) {
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
    }
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
      const view = element.dataset.viewSection;
      element.hidden = experience.views[view] !== true;
    });
    const readingsSection = root.querySelector("[data-readings-section]");
    if (readingsSection instanceof HTMLElement) {
      readingsSection.hidden = !experience.views.readings && !experience.views.turningPoint;
    }
    const stage = root.querySelector("[data-stage-section]");
    if (stage instanceof HTMLElement) {
      stage.hidden = !experience.views.motion && !experience.views.readings && !experience.views.turningPoint;
    }
    const charts = root.querySelector("[data-charts-section]");
    if (charts instanceof HTMLElement) {
      charts.hidden = !Object.values(quantityViews).some((view) => experience.views[view]);
    }
  };

  const handleParameterInput = (event) => {
    const source = event.currentTarget;
    const key = source.dataset.paramRange ?? source.dataset.paramNumber;
    if (!key || experience.parameters[key]?.editable !== true) return;
    pause({
      shouldAnnounce: state.playing,
      reason: t(locale, "simulation.pausedForParameters"),
    });
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
  };

  const animationFrame = (timestamp) => {
    if (!state.playing) return;
    if (state.frameStart === null) state.frameStart = timestamp;
    const elapsed = (timestamp - state.frameStart) / 1000;
    state.time = Math.min(state.parameters.T, state.playStartTime + elapsed);
    updateFrame();
    if (state.time >= state.parameters.T) {
      pause();
      playbackState.textContent = t(locale, "simulation.completeInterval");
      announce(t(locale, "simulation.finished"));
      return;
    }
    state.frameId = window.requestAnimationFrame(animationFrame);
  };

  const play = () => {
    if (state.time >= state.parameters.T) state.time = 0;
    state.playing = true;
    trackFirstStart();
    state.frameStart = null;
    state.playStartTime = state.time;
    setPlaybackPresentation();
    announce(t(locale, "simulation.started"));
    state.frameId = window.requestAnimationFrame(animationFrame);
  };

  const togglePlayback = () => {
    if (state.playing) pause({ shouldAnnounce: true });
    else play();
  };

  const resetPlayback = () => {
    pause();
    state.time = 0;
    updateFrame();
    announce(t(locale, "simulation.resetAnnounce"));
  };

  root.querySelectorAll("[data-param-range], [data-param-number]").forEach((input) => {
    input.addEventListener("input", handleParameterInput, listenerOptions);
  });
  root.querySelector("[data-presets-list]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!(button instanceof HTMLButtonElement)) return;
    const preset = experience.presets.find((entry) => entry.id === button.dataset.preset);
    if (!preset) return;
    for (const control of parameterDefinitions()) {
      const value = preset.parameters[control.key];
      for (const selector of ["range", "number"]) {
        const input = root.querySelector(`[data-param-${selector}="${control.key}"]`);
        if (input instanceof HTMLInputElement) input.value = String(value);
      }
    }
    state.time = 0;
    applyParameters(preset.parameters, t(locale, "simulation.presetLoaded", { label: preset.label }));
  }, listenerOptions);
  toggleButton.addEventListener("click", togglePlayback, listenerOptions);
  root.querySelector('[data-action="reset"]')?.addEventListener("click", resetPlayback, listenerOptions);
  scrubber.addEventListener("input", () => {
    pause({
      shouldAnnounce: state.playing,
      reason: t(locale, "simulation.pausedForTime"),
    });
    if (Number.isFinite(scrubber.valueAsNumber)) {
      state.time = Math.min(state.parameters.T, Math.max(0, scrubber.valueAsNumber));
      updateFrame();
    }
  }, listenerOptions);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.playing) {
      pause({
        shouldAnnounce: true,
        reason: t(locale, "simulation.pausedHidden"),
      });
    }
  }, listenerOptions);
  floatingPlayback = initializeSimulationFloatingPlayback({
    root,
    playbackSection,
    locale,
    onToggle: togglePlayback,
    onReset: resetPlayback,
  });

  const api = {
    get experience() {
      return experience;
    },
    updateExperience(nextExperience) {
      const normalized = normalizeSimulationExperience(nextExperience);
      const validation = validateSimulationExperience(normalized);
      const model = getSimulationModelById(normalized.modelId);
      if (!validation.valid || model?.rendererId !== "svg-kinematics-1d") {
        throw new TypeError(validation.errors.join(" ") || "Renderer incompatible.");
      }
      pause();
      experience = normalized;
      state.parameters = defaultsFromExperience();
      state.time = 0;
      state.chartGeometries.clear();
      applyViewVisibility();
      configureControls();
      renderPresets();
      clearValidation();
      rebuildVisuals();
      updateFrame();
      updateControlOutputs();
      updatePresetState();
      announce(t(locale, "simulation.previewUpdated"));
      return experience;
    },
    destroy() {
      pause();
      floatingPlayback?.destroy();
      abortController.abort();
      root.removeAttribute("data-initialized");
      runtimes.delete(root);
    },
  };

  runtimes.set(root, api);
  root.dataset.initialized = "true";
  applyViewVisibility();
  configureControls();
  renderPresets();
  rebuildVisuals();
  updateFrame();
  updateControlOutputs();
  setPlaybackPresentation();
  window.addEventListener("pagehide", () => api.destroy(), { ...listenerOptions, once: true });
  return api;
};

export const destroyKinematicsSimulation = (root) => {
  runtimes.get(root)?.destroy();
};

document.querySelectorAll("[data-kinematics-simulation]")
  .forEach((root) => initializeKinematicsSimulation(root));
