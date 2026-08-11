import assert from "node:assert/strict";
import test from "node:test";

import {
  accelerationAt,
  assertKinematicsParameters,
  createFiniteDomain,
  createKinematicsDomains,
  describeDirection,
  displacementAt,
  distanceAt,
  getKinematicsState,
  getPositionExtrema,
  getTurningPoint,
  positionAt,
  sampleKinematics,
  speedAt,
  validateKinematicsParameters,
  velocityAt,
} from "../src/utils/kinematics-1d.js";

const uniform = { x0: -6, v0: 2.5, a: 0, T: 6 };
const returnCase = { x0: -4, v0: 6, a: -2, T: 6 };

test("acepta los cuatro parámetros dentro de sus límites", () => {
  assert.deepEqual(assertKinematicsParameters(uniform), uniform);
  assert.equal(validateKinematicsParameters(uniform).valid, true);
});

test("rechaza objetos ausentes y valores no finitos", () => {
  assert.equal(validateKinematicsParameters(null).valid, false);
  const result = validateKinematicsParameters({ ...uniform, a: Number.NaN });
  assert.equal(result.valid, false);
  assert.equal(result.issues[0].field, "a");
});

test("rechaza cada parámetro fuera del rango editorial", () => {
  for (const invalid of [
    { ...uniform, x0: 51 },
    { ...uniform, v0: -21 },
    { ...uniform, a: 11 },
    { ...uniform, T: 0.5 },
  ]) {
    assert.equal(validateKinematicsParameters(invalid).valid, false);
  }
});

test("calcula posición con aceleración constante", () => {
  assert.equal(positionAt(returnCase, 2), 4);
});

test("calcula velocidad con signo", () => {
  assert.equal(velocityAt(returnCase, 2), 2);
  assert.equal(velocityAt(returnCase, 4), -2);
});

test("mantiene aceleración constante, incluso en el retorno", () => {
  assert.equal(accelerationAt(returnCase, 0), -2);
  assert.equal(accelerationAt(returnCase, 6), -2);
});

test("calcula desplazamiento respecto a x0", () => {
  assert.equal(displacementAt(returnCase, 3), 9);
  assert.equal(displacementAt(returnCase, 6), 0);
});

test("calcula rapidez como magnitud de la velocidad", () => {
  assert.equal(speedAt(returnCase, 4), 2);
  assert.equal(speedAt(returnCase, 3), 0);
});

test("localiza el cambio de sentido del caso académico", () => {
  assert.deepEqual(getTurningPoint(returnCase), { time: 3, position: 5 });
});

test("no declara retorno con aceleración cero", () => {
  assert.equal(getTurningPoint(uniform), null);
});

test("no declara retorno en un extremo del intervalo", () => {
  assert.equal(getTurningPoint({ x0: 0, v0: 0, a: 1, T: 4 }), null);
  assert.equal(getTurningPoint({ x0: 0, v0: 4, a: -1, T: 4 }), null);
});

test("suma distancia por tramos antes y después del retorno", () => {
  assert.equal(distanceAt(returnCase, 2), 8);
  assert.equal(distanceAt(returnCase, 4), 10);
  assert.equal(distanceAt(returnCase, 6), 18);
});

test("distingue distancia de desplazamiento en movimiento uniforme negativo", () => {
  const parameters = { x0: 3, v0: -2, a: 0, T: 4 };
  assert.equal(displacementAt(parameters, 4), -8);
  assert.equal(distanceAt(parameters, 4), 8);
});

test("devuelve un estado físico completo y finito", () => {
  const state = getKinematicsState(returnCase, 6);
  assert.deepEqual(state, {
    time: 6,
    position: -4,
    displacement: 0,
    distance: 18,
    velocity: -6,
    speed: 6,
    acceleration: -2,
    direction: "hacia −x",
  });
  assert.ok(Object.values(state).filter(Number.isFinite).length === 7);
});

test("describe ambos sentidos y el reposo instantáneo", () => {
  assert.equal(describeDirection(2), "hacia +x");
  assert.equal(describeDirection(-2), "hacia −x");
  assert.equal(describeDirection(1e-12), "reposo instantáneo");
});

test("incluye exactamente los extremos al muestrear", () => {
  const samples = sampleKinematics(returnCase, 7);
  assert.equal(samples.length, 7);
  assert.equal(samples[0].time, 0);
  assert.equal(samples.at(-1).time, 6);
  assert.equal(samples.at(-1).position, -4);
});

test("rechaza cantidades de muestras inválidas", () => {
  assert.throws(() => sampleKinematics(uniform, 1), RangeError);
  assert.throws(() => sampleKinematics(uniform, 2.5), RangeError);
});

test("tolera redondeo flotante mínimo en los extremos temporales", () => {
  assert.equal(positionAt(uniform, -1e-12), -6);
  assert.equal(positionAt(uniform, 6 + 1e-12), 9);
});

test("rechaza tiempos no finitos o realmente fuera del intervalo", () => {
  assert.throws(() => positionAt(uniform, Number.POSITIVE_INFINITY), TypeError);
  assert.throws(() => velocityAt(uniform, -0.01), RangeError);
  assert.throws(() => accelerationAt(uniform, 6.01), RangeError);
});

test("encuentra extremos de posición incluyendo el retorno", () => {
  const extrema = getPositionExtrema(returnCase);
  assert.deepEqual(extrema.minimum, { time: 0, position: -4 });
  assert.deepEqual(extrema.maximum, { time: 3, position: 5 });
  assert.equal(extrema.points.length, 3);
});

test("crea dominio creciente para una magnitud constante", () => {
  const domain = createFiniteDomain([4, 4], { minimumSpan: 2 });
  assert.ok(domain[0] < 4 && domain[1] > 4);
  assert.ok(domain.every(Number.isFinite));
});

test("incluye cero cuando la lectura física lo requiere", () => {
  const domain = createFiniteDomain([3, 5], { includeZero: true });
  assert.ok(domain[0] < 0 && domain[1] > 5);
});

test("los dominios cubren trayectoria completa y no se degeneran", () => {
  const domains = createKinematicsDomains(returnCase);
  assert.deepEqual(domains.time, [0, 6]);
  assert.ok(domains.position[0] < -4 && domains.position[1] > 5);
  assert.ok(domains.velocity[0] < -6 && domains.velocity[1] > 6);
  assert.ok(domains.acceleration[0] < -2 && domains.acceleration[1] > 0);
  assert.ok(Object.values(domains).flat().every(Number.isFinite));
});
