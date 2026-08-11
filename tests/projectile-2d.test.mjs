import assert from "node:assert/strict";
import test from "node:test";

import {
  assertProjectileParameters,
  createProjectileDomains,
  degreesToRadians,
  getInitialVelocityComponents,
  getProjectileFlightTime,
  getProjectilePeakTime,
  getProjectileState,
  getProjectileSummary,
  projectileAccelerationAt,
  projectilePositionAt,
  projectileSpeedAt,
  projectileTrajectoryYAtX,
  projectileVelocityAt,
  radiansToDegrees,
  sampleProjectile,
  validateProjectileParameters,
} from "../src/utils/projectile-2d.js";

const classic = { y0: 0, v0: 20, theta: 45, g: 10 };
const horizontal = { y0: 20, v0: 10, theta: 0, g: 10 };
const approximate = (actual, expected, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);

test("convierte grados y radianes de forma explícita", () => {
  approximate(degreesToRadians(180), Math.PI);
  approximate(radiansToDegrees(Math.PI / 2), 90);
  assert.throws(() => degreesToRadians(Number.NaN), TypeError);
});

test("valida límites y rechaza valores no finitos", () => {
  assert.deepEqual(assertProjectileParameters(classic), classic);
  assert.equal(validateProjectileParameters({ ...classic, g: 0 }).valid, false);
  assert.equal(validateProjectileParameters({ ...classic, v0: 0 }).valid, false);
  assert.equal(validateProjectileParameters({ ...classic, theta: 91 }).valid, false);
  assert.equal(validateProjectileParameters({ ...classic, y0: Infinity }).valid, false);
  assert.equal(validateProjectileParameters(null).valid, false);
});

test("calcula las componentes iniciales del caso académico", () => {
  const velocity = getInitialVelocityComponents(classic);
  approximate(velocity.vx, 20 / Math.sqrt(2));
  approximate(velocity.vy, 20 / Math.sqrt(2));
});

test("conserva posición, velocidad y aceleración iniciales", () => {
  assert.deepEqual(projectilePositionAt(classic, 0), { x: 0, y: 0 });
  const velocity = projectileVelocityAt(classic, 0);
  approximate(velocity.x, 20 / Math.sqrt(2));
  approximate(velocity.y, 20 / Math.sqrt(2));
  assert.deepEqual(projectileAccelerationAt(classic, 0), { x: 0, y: -10 });
});

test("calcula posición, velocidad y rapidez en un instante arbitrario", () => {
  const position = projectilePositionAt(classic, 1);
  approximate(position.x, 20 / Math.sqrt(2));
  approximate(position.y, 20 / Math.sqrt(2) - 5);
  const velocity = projectileVelocityAt(classic, 1);
  approximate(velocity.x, 20 / Math.sqrt(2));
  approximate(velocity.y, 20 / Math.sqrt(2) - 10);
  approximate(projectileSpeedAt(classic, 1), Math.hypot(velocity.x, velocity.y));
});

test("resuelve exactamente el caso académico de 45 grados", () => {
  const summary = getProjectileSummary(classic);
  approximate(summary.initialVelocity.vx, 14.1421356237, 1e-10);
  approximate(summary.initialVelocity.vy, 14.1421356237, 1e-10);
  approximate(summary.peakTime, 1.4142135624, 1e-10);
  approximate(summary.maximumHeight, 10, 1e-10);
  approximate(summary.flightTime, 2.8284271247, 1e-10);
  approximate(summary.range, 40, 1e-10);
  approximate(summary.vertex.x, 20, 1e-10);
  approximate(summary.vertex.y, 10, 1e-10);
});

test("resuelve un lanzamiento horizontal desde altura", () => {
  const summary = getProjectileSummary(horizontal);
  approximate(summary.flightTime, 2);
  approximate(summary.range, 20);
  assert.equal(summary.peakTime, 0);
  assert.equal(summary.maximumHeight, 20);
  assert.deepEqual(summary.impactVelocity, { x: 10, y: -20 });
  approximate(summary.impactSpeed, Math.sqrt(500));
});

test("theta igual a 90 produce alcance cero sin NaN", () => {
  const vertical = { y0: 0, v0: 20, theta: 90, g: 10 };
  const summary = getProjectileSummary(vertical);
  assert.equal(summary.initialVelocity.vx, 0);
  assert.equal(summary.range, 0);
  assert.equal(projectileTrajectoryYAtX(vertical, 0), null);
  assert.ok(Object.values(summary).flatMap((value) =>
    typeof value === "object" ? Object.values(value) : [value]
  ).every(Number.isFinite));
});

test("la trayectoria y(x) coincide con el estado temporal", () => {
  approximate(projectileTrajectoryYAtX(classic, 20), 10);
  approximate(projectileTrajectoryYAtX(classic, 40), 0);
  assert.throws(() => projectileTrajectoryYAtX(classic, 41), RangeError);
});

test("el estado de impacto nunca queda bajo el suelo por redondeo", () => {
  const flightTime = getProjectileFlightTime(classic);
  const state = getProjectileState(classic, flightTime);
  assert.equal(state.position.y, 0);
  assert.equal(state.position.x, 40);
  assert.ok(state.speed > 0);
});

test("rechaza tiempos no finitos o fuera del vuelo", () => {
  assert.throws(() => projectilePositionAt(classic, -0.01), RangeError);
  assert.throws(() => projectileVelocityAt(classic, 3), RangeError);
  assert.throws(() => projectileAccelerationAt(classic, Infinity), TypeError);
});

test("el tiempo del vértice no supone ascenso inicial", () => {
  assert.equal(getProjectilePeakTime(horizontal), 0);
  approximate(getProjectilePeakTime(classic), Math.sqrt(2));
});

test("el muestreo incluye lanzamiento e impacto", () => {
  const samples = sampleProjectile(classic, 17);
  assert.equal(samples.length, 17);
  assert.deepEqual(samples[0].position, { x: 0, y: 0 });
  assert.equal(samples.at(-1).time, getProjectileFlightTime(classic));
  assert.deepEqual(samples.at(-1).position, { x: 40, y: 0 });
});

test("el contacto horizontal inmediato produce un intervalo válido nulo", () => {
  const contact = { y0: 0, v0: 10, theta: 0, g: 9.8 };
  assert.equal(getProjectileFlightTime(contact), 0);
  const samples = sampleProjectile(contact, 50);
  assert.equal(samples.length, 1);
  assert.deepEqual(samples[0].position, { x: 0, y: 0 });
  assert.deepEqual(samples[0].velocity, { x: 10, y: 0 });
});

test("los dominios siempre son finitos y no degenerados", () => {
  for (const parameters of [classic, horizontal, { y0: 0, v0: 1, theta: 0, g: 25 }]) {
    const domains = createProjectileDomains(parameters);
    assert.ok(Object.values(domains).every(([minimum, maximum]) =>
      Number.isFinite(minimum) && Number.isFinite(maximum) && minimum < maximum
    ));
  }
});

test("rechaza cantidades de muestras inválidas", () => {
  assert.throws(() => sampleProjectile(classic, 1), RangeError);
  assert.throws(() => sampleProjectile(classic, 2.5), RangeError);
});
