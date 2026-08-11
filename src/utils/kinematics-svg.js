// Proyección pura de los datos cinemáticos hacia geometría SVG. El modelo
// físico permanece en kinematics-1d.js y el DOM se actualiza en el script.

import {
  createCartesianTransform,
  createClippedSegments,
  createLinearTicks,
  segmentsToSvgPath,
} from "./chart.js";
import {
  createKinematicsDomains,
  getKinematicsState,
  sampleKinematics,
} from "./kinematics-1d.js";

export const KINEMATICS_CHART_VIEW = Object.freeze({
  width: 420,
  height: 260,
  plot: Object.freeze({ left: 58, top: 22, width: 338, height: 184 }),
});

export const KINEMATICS_MOTION_VIEW = Object.freeze({
  width: 920,
  height: 180,
  plot: Object.freeze({ left: 54, top: 36, width: 812, height: 108 }),
  axisY: 92,
});

export const KINEMATICS_QUANTITIES = Object.freeze({
  position: Object.freeze({
    key: "position",
    symbol: "x(t)",
    label: "Posición",
    unit: "m",
  }),
  velocity: Object.freeze({
    key: "velocity",
    symbol: "v(t)",
    label: "Velocidad",
    unit: "m/s",
  }),
  acceleration: Object.freeze({
    key: "acceleration",
    symbol: "a(t)",
    label: "Aceleración",
    unit: "m/s²",
  }),
});

export const formatKinematicsNumber = (value, maximumFractionDigits = 2) => {
  if (!Number.isFinite(value)) return "—";
  const normalized = Math.abs(value) < 1e-9 ? 0 : value;
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(normalized);
};

export const createKinematicsChartGeometry = (
  parameters,
  quantityKey,
  samples = 121
) => {
  const quantity = KINEMATICS_QUANTITIES[quantityKey];
  if (!quantity) throw new RangeError(`Magnitud cinemática desconocida: ${quantityKey}.`);

  const domains = createKinematicsDomains(parameters);
  const yDomain = domains[quantityKey];
  const transform = createCartesianTransform({
    xDomain: domains.time,
    yDomain,
    plot: KINEMATICS_CHART_VIEW.plot,
  });
  const physicalPoints = sampleKinematics(parameters, samples).map((sample) => ({
    x: sample.time,
    y: sample[quantityKey],
  }));
  const linePath = segmentsToSvgPath(
    createClippedSegments(physicalPoints, {
      xDomain: domains.time,
      yDomain,
    }),
    transform
  );
  const initialState = getKinematicsState(parameters, 0);

  return {
    quantity,
    xDomain: domains.time,
    yDomain,
    xTicks: createLinearTicks(domains.time, 6),
    yTicks: createLinearTicks(yDomain, 5),
    transform,
    linePath,
    zeroY: yDomain[0] <= 0 && yDomain[1] >= 0 ? transform.y(0) : null,
    initialPoint: transform.point({ x: 0, y: initialState[quantityKey] }),
  };
};

export const createKinematicsMotionGeometry = (parameters) => {
  const domains = createKinematicsDomains(parameters);
  const transform = createCartesianTransform({
    xDomain: domains.position,
    yDomain: [0, 1],
    plot: KINEMATICS_MOTION_VIEW.plot,
  });

  return {
    xDomain: domains.position,
    ticks: createLinearTicks(domains.position, 7),
    transform,
    initialX: transform.x(parameters.x0),
    originX: domains.position[0] <= 0 && domains.position[1] >= 0
      ? transform.x(0)
      : null,
  };
};
