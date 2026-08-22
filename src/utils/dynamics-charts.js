import {
  createCartesianTransform,
  createClippedSegments,
  createLinearTicks,
  sampleFunction,
  segmentsToSvgPath,
} from "./chart.js";
import { getForcesFrictionForces } from "./forces-friction.js";
import { getRequiredCircularTension } from "./circular-radial-force.js";

export const DYNAMICS_CHART_VIEW = Object.freeze({
  width: 520,
  height: 280,
  plot: Object.freeze({ left: 62, top: 18, width: 438, height: 220 }),
});

const finitePoints = (series) => series.flatMap(({ points }) =>
  points.filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y))
);

const paddedDomain = (values, { includeZero = true } = {}) => {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return [0, 1];
  let minimum = Math.min(...finite);
  let maximum = Math.max(...finite);
  if (includeZero) {
    minimum = Math.min(0, minimum);
    maximum = Math.max(0, maximum);
  }
  if (minimum === maximum) {
    const padding = Math.max(1, Math.abs(minimum) * 0.2);
    return [minimum - padding, maximum + padding];
  }
  const padding = (maximum - minimum) * 0.1;
  return [minimum - padding, maximum + padding];
};

export const createSimulationChartGeometry = ({
  series,
  xDomain,
  yDomain,
  currentPoints = [],
  cursorX = null,
  referenceY = null,
  includeZero = true,
}) => {
  const points = finitePoints(series);
  const resolvedYDomain = yDomain ?? paddedDomain([
    ...points.map((point) => point.y),
    referenceY,
  ], { includeZero });
  const transform = createCartesianTransform({
    xDomain,
    yDomain: resolvedYDomain,
    plot: DYNAMICS_CHART_VIEW.plot,
  });
  const paths = series.map(({ points: seriesPoints }) => segmentsToSvgPath(
    createClippedSegments(seriesPoints, { xDomain, yDomain: resolvedYDomain }),
    transform
  ));
  const mappedCurrentPoints = currentPoints.map((point) =>
    point && transform.isVisible(point) ? transform.point(point) : null
  );
  return Object.freeze({
    width: DYNAMICS_CHART_VIEW.width,
    height: DYNAMICS_CHART_VIEW.height,
    plot: DYNAMICS_CHART_VIEW.plot,
    xDomain: [...xDomain],
    yDomain: resolvedYDomain,
    xTicks: createLinearTicks(xDomain, 5),
    yTicks: createLinearTicks(resolvedYDomain, 5),
    paths,
    currentPoints: mappedCurrentPoints,
    cursorValue: cursorX,
    cursorX: Number.isFinite(cursorX) && cursorX >= xDomain[0] && cursorX <= xDomain[1]
      ? transform.x(cursorX)
      : null,
    referenceValue: referenceY,
    referenceY: Number.isFinite(referenceY) && referenceY >= resolvedYDomain[0] && referenceY <= resolvedYDomain[1]
      ? transform.y(referenceY)
      : null,
  });
};

export const createForcesFrictionRelationGeometry = (params, forceDomain) => {
  const sample = (select) => sampleFunction({
    domain: forceDomain,
    samples: 121,
    evaluate: (F) => {
      const forces = getForcesFrictionForces({ ...params, F }, { v: 0 });
      return forces.regime === "contact-invalid" ? Number.NaN : select(forces);
    },
  });
  const series = [
    { points: sample((forces) => Math.abs(forces.requiredStatic)) },
    { points: sample((forces) => forces.maximumStatic) },
    { points: sample((forces) => params.muK * forces.normal) },
  ];
  const current = getForcesFrictionForces(params, { v: 0 });
  const currentPoints = current.regime === "contact-invalid" ? [null, null, null] : [
    { x: params.F, y: Math.abs(current.requiredStatic) },
    { x: params.F, y: current.maximumStatic },
    { x: params.F, y: params.muK * current.normal },
  ];
  return Object.freeze({
    series,
    currentValues: currentPoints,
    currentRegime: current.regime,
    ...createSimulationChartGeometry({ series, xDomain: forceDomain, currentPoints, cursorX: params.F }),
  });
};

export const createForcesHistoryGeometry = (history, key) => {
  if (!Array.isArray(history) || history.length === 0) throw new RangeError("history requiere al menos una muestra.");
  const lastTime = history.at(-1).t;
  const xDomain = lastTime <= 10 ? [0, 10] : [lastTime - 10, lastTime];
  const points = history.map((sample) => ({ x: sample.t, y: sample[key] }));
  const series = [{ points }];
  return Object.freeze({
    series,
    ...createSimulationChartGeometry({
      series,
      xDomain,
      currentPoints: [points.at(-1)],
      includeZero: true,
    }),
  });
};

export const createPulleyHistoryGeometry = (history, keys) => {
  if (!Array.isArray(history) || history.length === 0) throw new RangeError("history requiere al menos una muestra.");
  if (!Array.isArray(keys) || keys.length === 0 || keys.length > 3) throw new RangeError("keys requiere entre una y tres series.");
  const lastTime = history.at(-1).t;
  const xDomain = lastTime <= 10 ? [0, 10] : [lastTime - 10, lastTime];
  const series = keys.map((key) => ({
    points: history.map((sample) => ({ x: sample.t, y: sample.positions[key] })),
  }));
  return Object.freeze({
    series,
    ...createSimulationChartGeometry({
      series,
      xDomain,
      currentPoints: series.map(({ points }) => points.at(-1)),
      includeZero: true,
    }),
  });
};

export const createCircularRelationshipGeometries = (params, { vDomain, RDomain }) => {
  const speedSeries = [{
    points: sampleFunction({
      domain: vDomain,
      samples: 121,
      evaluate: (v) => getRequiredCircularTension({ ...params, v }),
    }),
  }];
  const radiusSeries = [{
    points: sampleFunction({
      domain: RDomain,
      samples: 121,
      evaluate: (R) => getRequiredCircularTension({ ...params, R }),
    }),
  }];
  const required = getRequiredCircularTension(params);
  return Object.freeze({
    speed: Object.freeze({
      series: speedSeries,
      currentValue: Object.freeze({ x: params.v, y: required }),
      ...createSimulationChartGeometry({
        series: speedSeries,
        xDomain: vDomain,
        currentPoints: [{ x: params.v, y: required }],
        referenceY: params.Tmax,
      }),
    }),
    radius: Object.freeze({
      series: radiusSeries,
      currentValue: Object.freeze({ x: params.R, y: required }),
      ...createSimulationChartGeometry({
        series: radiusSeries,
        xDomain: RDomain,
        currentPoints: [{ x: params.R, y: required }],
        referenceY: params.Tmax,
      }),
    }),
  });
};
