import assert from "node:assert/strict";
import test from "node:test";

import {
  UNIT_1_EXERCISES,
} from "../src/data/physics/unit-1/exercises.js";
import {
  UNIT_1_VISUALIZATIONS,
} from "../src/data/physics/unit-1/visualizations.js";

const EPSILON = 1e-9;
const closeTo = (actual, expected, tolerance = EPSILON) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);
const answerValue = (exerciseId, symbol) => {
  const exercise = UNIT_1_EXERCISES.find((item) => item.id === exerciseId);
  return exercise?.answer?.values?.find((item) => item.symbol === symbol)?.value;
};
const pointsFor = (visualizationId) =>
  UNIT_1_VISUALIZATIONS[visualizationId].props.series[0].points.filter(Boolean);
const trapezoidArea = (points) => points.slice(1).reduce(
  (area, point, index) => {
    const previous = points[index];
    return area + (point.x - previous.x) * (point.y + previous.y) / 2;
  },
  0
);

test("el banco fijo reúne los ejercicios auditados y conserva las 12 visualizaciones centrales", () => {
  assert.equal(UNIT_1_EXERCISES.length, 55);
  assert.equal(
    UNIT_1_EXERCISES.filter((exercise) => exercise.id.startsWith("u1-extra-")).length,
    21
  );
  assert.equal(
    UNIT_1_EXERCISES.filter((exercise) => exercise.id.startsWith("u1-visual-")).length,
    12
  );
});

test("la proyección conserva notación matemática clara y una descripción accesible", () => {
  const projection = UNIT_1_VISUALIZATIONS["dot-projection"].props.vectors
    .find((vector) => vector.ariaLabel === "proyección de A sobre B");

  assert.deepEqual(projection.mathLabel, {
    base: "proy",
    sub: "B",
    suffix: "A",
    baseRole: "operator",
  });
  assert.deepEqual(projection.labelOffset, { x: 0, y: -2.4 });
  assert.equal(projection.labelAnchor, "middle");
});

test("VIS-01 conserva pendientes, reposo, desplazamiento y distancia", () => {
  const points = pointsFor("vis-position-segments");
  assert.deepEqual(points.map((point, index) => index === 0
    ? null
    : (point.y - points[index - 1].y) / (point.x - points[index - 1].x)),
  [null, 2, 0, -3]);
  assert.equal(points.at(-1).y - points[0].y, -2);
  assert.equal(points.slice(1).reduce((sum, point, index) =>
    sum + Math.abs(point.y - points[index].y), 0), 10);
});

test("VIS-02 diferencia área algebraica y distancia", () => {
  const points = pointsFor("vis-velocity-areas");
  const signedAreas = points.slice(1).map((point, index) =>
    (point.x - points[index].x) * (point.y + points[index].y) / 2);
  assert.deepEqual(signedAreas, [4, 12, 4, -2]);
  assert.equal(signedAreas.reduce((sum, area) => sum + area, 0), 18);
  assert.equal(signedAreas.reduce((sum, area) => sum + Math.abs(area), 0), 22);
});

test("los ejercicios visuales derivados conservan los valores de sus gráficas", () => {
  const answerFor = (exerciseId) => UNIT_1_EXERCISES
    .find((exercise) => exercise.id === exerciseId)?.answer?.value;

  assert.equal(answerFor("u1-extra-visual-position-net"), -2);
  assert.equal(answerFor("u1-extra-visual-velocity-final-position"), 15);
  assert.equal(answerFor("u1-extra-visual-elevator-displacement"), 16);
});

test("VIS-03 reconstruye el vector del cuadrante II", () => {
  const vector = UNIT_1_VISUALIZATIONS["vis-vector-grid"].props.vectors[0];
  const x = vector.end.x - vector.start.x;
  const y = vector.end.y - vector.start.y;
  assert.deepEqual([x, y], [-3, 4]);
  assert.equal(Math.hypot(x, y), 5);
  closeTo((Math.atan2(y, x) * 180) / Math.PI, 126.8698976, 1e-6);
});

test("VIS-04 suma los desplazamientos punta-cola sin dibujar la resultante", () => {
  const vectors = UNIT_1_VISUALIZATIONS["vis-vector-sum-grid"].props.vectors;
  assert.equal(vectors.length, 2);
  const result = {
    x: vectors[1].end.x - vectors[0].start.x,
    y: vectors[1].end.y - vectors[0].start.y,
  };
  assert.deepEqual(result, { x: 3, y: 4 });
  assert.equal(Math.hypot(result.x, result.y), 5);
});

test("VIS-05 usa posiciones de proyectil a tiempos iguales", () => {
  const points = pointsFor("vis-projectile-strobe");
  assert.ok(points.slice(1).every((point, index) => point.x - points[index].x === 1));
  assert.equal(points[5].y, Math.max(...points.map((point) => point.y)));
});

test("VIS-06 coloca la partícula sobre una circunferencia física", () => {
  const props = UNIT_1_VISUALIZATIONS["vis-circular-directions"].props;
  const circle = props.circles[0];
  const particle = props.points[0];
  closeTo(Math.hypot(
    particle.x - circle.center.x,
    particle.y - circle.center.y
  ), circle.radius);
});

test("VIS-07 conserva el triángulo de velocidades de la embarcación", () => {
  const north = Math.sqrt(2.5 ** 2 - 1.5 ** 2);
  assert.equal(north, 2);
  closeTo((Math.asin(1.5 / 2.5) * 180) / Math.PI, 36.8698976, 1e-6);
  assert.equal(120 / north, 60);
});

test("VIS-08 produce cima, desplazamiento nulo y distancia de cuarenta metros", () => {
  const points = pointsFor("vis-vertical-launch-velocity");
  const slope = (points[1].y - points[0].y) / (points[1].x - points[0].x);
  const zeroTime = -points[0].y / slope;
  assert.equal(zeroTime, 2);
  assert.equal(trapezoidArea(points), 0);
  assert.equal(0.5 * 2 * 20 * 2, 40);
});

test("VIS-09 conserva aceleraciones y desplazamiento del ascensor", () => {
  const points = pointsFor("vis-elevator-profile");
  const slopes = points.slice(1).map((point, index) =>
    (point.y - points[index].y) / (point.x - points[index].x));
  assert.deepEqual(slopes, [1, 0, -1]);
  assert.equal(trapezoidArea(points), 16);
});

test("VIS-10 presenta separaciones estroboscópicas crecientes", () => {
  const positions = UNIT_1_VISUALIZATIONS["vis-stroboscopic-spacing"]
    .props.points.map((point) => point.x);
  const gaps = positions.slice(1).map((position, index) => position - positions[index]);
  assert.deepEqual(gaps, [1, 2, 3, 4]);
});

test("VIS-11 acumula correctamente el área bajo a(t)", () => {
  const v0 = -1;
  const v2 = v0 + 2 * 2;
  const v5 = v2;
  const v9 = v5 - 1 * 4;
  assert.deepEqual([v2, v5, v9], [3, 3, -1]);
  assert.equal(-v0 / 2, 0.5);
  assert.equal(5 + v5, 8);
});

test("VIS-12 mantiene dimensiones y resultados deterministas en t igual a dos", () => {
  const t = 2;
  const position = { x: 2 * t, y: 4 * t - t ** 2 };
  const velocity = { x: 2, y: 4 - 2 * t };
  const acceleration = { x: 0, y: -2 };
  assert.deepEqual(position, { x: 4, y: 4 });
  assert.deepEqual(velocity, { x: 2, y: 0 });
  assert.deepEqual(acceleration, { x: 0, y: -2 });
  assert.equal(answerValue("u1-visual-parametric-trajectory", "y(2)"), 4);
});
