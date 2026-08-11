import {
  KINEMATICS_1D_CONTROLS,
  KINEMATICS_1D_PRESETS,
} from "../data/simulations.js";
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
  formatKinematicsNumber,
} from "../utils/kinematics-svg.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const quantityKeys = ["position", "velocity", "acceleration"];

const createSvgElement = (name, attributes = {}, content = null) => {
  const element = document.createElementNS(SVG_NAMESPACE, name);
  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, String(value));
  }
  if (content !== null) element.textContent = content;
  return element;
};

const parametersEqual = (first, second) =>
  KINEMATICS_1D_CONTROLS.every(
    (control) => first[control.key] === second[control.key]
  );

const initializeSimulation = (root) => {
  if (root.dataset.initialized === "true") return;
  root.dataset.initialized = "true";

  const initialPreset = KINEMATICS_1D_PRESETS.find(
    (preset) => preset.id === root.dataset.initialPreset
  ) ?? KINEMATICS_1D_PRESETS[0];
  const scrubber = root.querySelector("[data-time-scrubber]");
  const toggleButton = root.querySelector('[data-action="toggle"]');
  const playbackLabel = root.querySelector("[data-playback-label]");
  const playbackIcon = root.querySelector("[data-playback-icon]");
  const playbackState = root.querySelector("[data-playback-state]");
  const timeOutput = root.querySelector("[data-time-output]");
  const liveRegion = root.querySelector("[data-simulation-live]");
  const motionFigure = root.querySelector("[data-kinematics-motion]");
  const motionCurrent = root.querySelector("[data-motion-current]");
  const motionCurrentLabel = root.querySelector("[data-motion-current-label]");
  const motionInitial = root.querySelector("[data-motion-initial]");

  if (
    !(scrubber instanceof HTMLInputElement) ||
    !(toggleButton instanceof HTMLButtonElement) ||
    !playbackLabel ||
    !playbackIcon ||
    !playbackState ||
    !timeOutput ||
    !liveRegion ||
    !motionFigure ||
    !motionCurrent ||
    !motionCurrentLabel ||
    !motionInitial
  ) return;

  const state = {
    parameters: { ...initialPreset.parameters },
    time: 0,
    playing: false,
    frameId: null,
    frameStart: null,
    playStartTime: 0,
    chartGeometries: new Map(),
    motionGeometry: null,
  };

  const announce = (message) => {
    liveRegion.textContent = "";
    window.requestAnimationFrame(() => {
      liveRegion.textContent = message;
    });
  };

  const setPlaybackPresentation = () => {
    toggleButton.setAttribute("aria-pressed", String(state.playing));
    playbackLabel.textContent = state.playing ? "Pausar" : "Reproducir";
    playbackIcon.textContent = state.playing ? "❚❚" : "▶";
    playbackState.textContent = state.playing ? "En reproducción" : "En pausa";
  };

  const pause = ({ shouldAnnounce = false, reason = "Simulación pausada." } = {}) => {
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
      if (element) element.textContent = formatKinematicsNumber(physicalState[key]);
    }

    const direction = root.querySelector('[data-reading="direction"]');
    if (direction) direction.textContent = `Sentido: ${physicalState.direction}`;
    timeOutput.textContent = `${formatKinematicsNumber(physicalState.time)} s`;
  };

  const updateFrame = () => {
    const physicalState = getKinematicsState(state.parameters, state.time);
    scrubber.value = String(state.time);
    updateReadings(physicalState);

    for (const quantityKey of quantityKeys) {
      const figure = root.querySelector(`[data-kinematics-chart="${quantityKey}"]`);
      const geometry = state.chartGeometries.get(quantityKey);
      if (!figure || !geometry) continue;

      const value = physicalState[quantityKey];
      const point = geometry.transform.point({ x: state.time, y: value });
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

    if (state.motionGeometry) {
      const x = state.motionGeometry.transform.x(physicalState.position);
      const labelX = Math.min(
        KINEMATICS_MOTION_VIEW.plot.left + KINEMATICS_MOTION_VIEW.plot.width - 45,
        Math.max(KINEMATICS_MOTION_VIEW.plot.left + 45, x)
      );
      motionCurrent.setAttribute("cx", String(x));
      motionCurrentLabel.setAttribute("x", String(labelX));
      motionCurrentLabel.textContent = `x = ${formatKinematicsNumber(physicalState.position)} m`;
    }
  };

  const populateChartGeometry = (quantityKey) => {
    const figure = root.querySelector(`[data-kinematics-chart="${quantityKey}"]`);
    if (!figure) return;

    const geometry = createKinematicsChartGeometry(
      state.parameters,
      quantityKey
    );
    state.chartGeometries.set(quantityKey, geometry);
    figure.dataset.xMin = String(geometry.xDomain[0]);
    figure.dataset.xMax = String(geometry.xDomain[1]);
    figure.dataset.yMin = String(geometry.yDomain[0]);
    figure.dataset.yMax = String(geometry.yDomain[1]);

    const curve = figure.querySelector("[data-chart-curve]");
    if (curve) curve.setAttribute("d", geometry.linePath);

    const grid = figure.querySelector("[data-chart-grid]");
    if (grid) {
      const lines = [
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
        })),
      ];
      grid.replaceChildren(...lines);
    }

    const ticks = figure.querySelector("[data-chart-ticks]");
    if (ticks) {
      const labels = [
        ...geometry.xTicks.map((tick) => createSvgElement("text", {
          x: geometry.transform.x(tick),
          y: KINEMATICS_CHART_VIEW.plot.top + KINEMATICS_CHART_VIEW.plot.height + 18,
          "text-anchor": "middle",
        }, formatKinematicsNumber(tick, 1))),
        ...geometry.yTicks.map((tick) => createSvgElement("text", {
          x: KINEMATICS_CHART_VIEW.plot.left - 9,
          y: geometry.transform.y(tick),
          "text-anchor": "end",
          "dominant-baseline": "middle",
        }, formatKinematicsNumber(tick, 1))),
      ];
      ticks.replaceChildren(...labels);
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
    const geometry = createKinematicsMotionGeometry(state.parameters);
    state.motionGeometry = geometry;
    motionFigure.dataset.xMin = String(geometry.xDomain[0]);
    motionFigure.dataset.xMax = String(geometry.xDomain[1]);

    const tickGroup = motionFigure.querySelector("[data-motion-ticks]");
    if (tickGroup) {
      const groups = geometry.ticks.map((tick) => {
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
          }, formatKinematicsNumber(tick, 1))
        );
        return group;
      });
      tickGroup.replaceChildren(...groups);
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
          }, "origen")
        );
        origin.replaceChildren(group);
      }
    }

    motionInitial.setAttribute("x1", String(geometry.initialX));
    motionInitial.setAttribute("x2", String(geometry.initialX));
  };

  const updateTurningReading = () => {
    const turning = getTurningPoint(state.parameters);
    const container = root.querySelector("[data-turning-reading]");
    if (!container) return;

    container.hidden = !turning;
    if (!turning) return;

    const time = container.querySelector("[data-turn-time]");
    const position = container.querySelector("[data-turn-position]");
    if (time) time.textContent = formatKinematicsNumber(turning.time);
    if (position) position.textContent = formatKinematicsNumber(turning.position);
  };

  const rebuildVisuals = () => {
    for (const quantityKey of quantityKeys) populateChartGeometry(quantityKey);
    populateMotionGeometry();
    updateTurningReading();
    scrubber.max = String(state.parameters.T);
  };

  const clearValidation = () => {
    for (const control of KINEMATICS_1D_CONTROLS) {
      const field = root.querySelector(`[data-param-field="${control.key}"]`);
      const error = root.querySelector(`[data-param-error="${control.key}"]`);
      const number = root.querySelector(`[data-param-number="${control.key}"]`);
      const range = root.querySelector(`[data-param-range="${control.key}"]`);
      field?.classList.remove("is-invalid");
      if (error) error.textContent = "";
      number?.removeAttribute("aria-invalid");
      range?.removeAttribute("aria-invalid");
    }
  };

  const showValidation = (issues) => {
    clearValidation();
    for (const issue of issues) {
      const field = root.querySelector(`[data-param-field="${issue.field}"]`);
      const error = root.querySelector(`[data-param-error="${issue.field}"]`);
      const number = root.querySelector(`[data-param-number="${issue.field}"]`);
      const range = root.querySelector(`[data-param-range="${issue.field}"]`);
      field?.classList.add("is-invalid");
      if (error) error.textContent = issue.message;
      number?.setAttribute("aria-invalid", "true");
      range?.setAttribute("aria-invalid", "true");
    }
  };

  const readParameters = () => {
    const parameters = {};
    const inputIssues = [];

    for (const control of KINEMATICS_1D_CONTROLS) {
      const input = root.querySelector(`[data-param-number="${control.key}"]`);
      if (!(input instanceof HTMLInputElement)) continue;
      parameters[control.key] = input.valueAsNumber;

      if (input.validity.stepMismatch) {
        inputIssues.push({
          field: control.key,
          message: `${control.label} debe usar incrementos de ${control.step} ${control.unit}.`,
        });
      }
    }

    const validation = validateKinematicsParameters(parameters);
    return {
      parameters,
      issues: [...inputIssues, ...validation.issues],
    };
  };

  const updatePresetState = () => {
    for (const preset of KINEMATICS_1D_PRESETS) {
      const button = root.querySelector(`[data-preset="${preset.id}"]`);
      button?.setAttribute(
        "aria-pressed",
        String(parametersEqual(preset.parameters, state.parameters))
      );
    }
  };

  const updateControlOutputs = () => {
    for (const control of KINEMATICS_1D_CONTROLS) {
      const output = root.querySelector(`[data-param-output="${control.key}"]`);
      if (output) {
        output.textContent = `${formatKinematicsNumber(state.parameters[control.key])} ${control.unit}`;
      }
    }
  };

  const applyParameters = (parameters, message = "Parámetros actualizados.") => {
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

  const handleParameterInput = (event) => {
    const source = event.currentTarget;
    const key = source.dataset.paramRange ?? source.dataset.paramNumber;
    if (!key) return;

    pause({
      shouldAnnounce: state.playing,
      reason: "La simulación se pausó para cambiar parámetros.",
    });

    if (source.matches("[data-param-range]")) {
      const number = root.querySelector(`[data-param-number="${key}"]`);
      if (number instanceof HTMLInputElement) number.value = source.value;
    } else if (Number.isFinite(source.valueAsNumber)) {
      const range = root.querySelector(`[data-param-range="${key}"]`);
      if (range instanceof HTMLInputElement) range.value = source.value;
    }

    const { parameters, issues } = readParameters();
    if (issues.length > 0) {
      showValidation(issues);
      announce(issues[0].message);
      return;
    }

    applyParameters(parameters);
  };

  const animationFrame = (timestamp) => {
    if (!state.playing) return;
    if (state.frameStart === null) state.frameStart = timestamp;

    const elapsed = (timestamp - state.frameStart) / 1000;
    state.time = Math.min(state.parameters.T, state.playStartTime + elapsed);
    updateFrame();

    if (state.time >= state.parameters.T) {
      pause();
      playbackState.textContent = "Intervalo completo";
      announce("La simulación llegó al final del intervalo.");
      return;
    }

    state.frameId = window.requestAnimationFrame(animationFrame);
  };

  const play = () => {
    if (state.time >= state.parameters.T) state.time = 0;
    state.playing = true;
    state.frameStart = null;
    state.playStartTime = state.time;
    setPlaybackPresentation();
    announce("Simulación en reproducción.");
    state.frameId = window.requestAnimationFrame(animationFrame);
  };

  for (const control of KINEMATICS_1D_CONTROLS) {
    const range = root.querySelector(`[data-param-range="${control.key}"]`);
    const number = root.querySelector(`[data-param-number="${control.key}"]`);
    range?.addEventListener("input", handleParameterInput);
    number?.addEventListener("input", handleParameterInput);
  }

  for (const preset of KINEMATICS_1D_PRESETS) {
    root.querySelector(`[data-preset="${preset.id}"]`)?.addEventListener("click", () => {
      for (const control of KINEMATICS_1D_CONTROLS) {
        const value = preset.parameters[control.key];
        const range = root.querySelector(`[data-param-range="${control.key}"]`);
        const number = root.querySelector(`[data-param-number="${control.key}"]`);
        if (range instanceof HTMLInputElement) range.value = String(value);
        if (number instanceof HTMLInputElement) number.value = String(value);
      }
      state.time = 0;
      applyParameters(preset.parameters, `Caso “${preset.label}” cargado.`);
    });
  }

  toggleButton.addEventListener("click", () => {
    if (state.playing) {
      pause({ shouldAnnounce: true });
    } else {
      play();
    }
  });

  root.querySelector('[data-action="reset"]')?.addEventListener("click", () => {
    pause();
    state.time = 0;
    updateFrame();
    announce("Tiempo reiniciado a cero segundos.");
  });

  scrubber.addEventListener("input", () => {
    pause({
      shouldAnnounce: state.playing,
      reason: "La simulación se pausó para mover el tiempo.",
    });
    const nextTime = scrubber.valueAsNumber;
    if (Number.isFinite(nextTime)) {
      state.time = Math.min(state.parameters.T, Math.max(0, nextTime));
      updateFrame();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.playing) {
      pause({
        shouldAnnounce: true,
        reason: "La simulación se pausó porque la página dejó de estar visible.",
      });
    }
  });

  window.addEventListener("pagehide", () => pause(), { once: true });

  rebuildVisuals();
  updateFrame();
  setPlaybackPresentation();
};

document.querySelectorAll("[data-kinematics-simulation]")
  .forEach(initializeSimulation);
