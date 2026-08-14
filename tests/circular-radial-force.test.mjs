import assert from "node:assert/strict";
import test from "node:test";

import {
  createCircularRadialState,
  cutCircularString,
  getConnectedCircularState,
  stepCircularRadial,
} from "../src/utils/circular-radial-force.js";

const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);
const magnitude = ({ x, y }) => Math.hypot(x, y);
const dot = (a, b) => a.x * b.x + a.y * b.y;
const base = { m: 1.5, R: 2, v: 4, Tmax: 20 };

test("el estado conectado conserva radio, rapidez y geometría radial", () => {
  for (const t of [0, 0.3, 1.7, 8]) {
    const state = getConnectedCircularState(base, t);
    close(magnitude(state.position), base.R);
    close(magnitude(state.velocity), base.v);
    close(dot(state.acceleration, state.velocity), 0, 1e-8);
    assert.ok(dot(state.acceleration, state.position) < 0);
    close(magnitude(state.acceleration), base.v ** 2 / base.R);
    close(state.tension, base.m * base.v ** 2 / base.R);
  }
});

test("P2 permanece conectada y P3 rompe por sobrecarga al iniciar", () => {
  const near = { m: 2, R: 2, v: 4.8, Tmax: 24 };
  assert.equal(stepCircularRadial(createCircularRadialState(near), near, 0.1).status, "connected");
  const overload = { m: 2, R: 2, v: 6, Tmax: 30 };
  const broken = stepCircularRadial(createCircularRadialState(overload), overload, 0.1);
  assert.equal(broken.status, "broken-overload");
  close(broken.t, 0);
});

test("el corte manual preserva posición y velocidad de forma continua", () => {
  const connected = stepCircularRadial(createCircularRadialState(base), base, 0.75);
  const cut = cutCircularString(connected, base);
  assert.equal(cut.status, "broken-manual");
  assert.deepEqual(cut.position, connected.position);
  assert.deepEqual(cut.velocity, connected.velocity);
  assert.deepEqual(cut.acceleration, { x: 0, y: 0 });
});

test("tras el corte el movimiento es rectilíneo, uniforme y tangente", () => {
  const connected = stepCircularRadial(createCircularRadialState(base), base, Math.PI / 4);
  const cut = cutCircularString(connected, base);
  const free = stepCircularRadial(cut, base, 1.25);
  const displacement = {
    x: free.position.x - cut.position.x,
    y: free.position.y - cut.position.y,
  };
  close(dot(displacement, cut.position), 0, 1e-8);
  close(displacement.x * cut.velocity.y - displacement.y * cut.velocity.x, 0, 1e-8);
  close(magnitude(displacement), base.v * 1.25);
  assert.deepEqual(free.velocity, cut.velocity);
  assert.deepEqual(free.acceleration, { x: 0, y: 0 });
  assert.equal(free.tension, 0);
});

test("masa, rapidez y radio siguen las proporcionalidades exactas", () => {
  const original = getConnectedCircularState(base, 0);
  const doubleMass = getConnectedCircularState({ ...base, m: base.m * 2 }, 0);
  close(doubleMass.radialAcceleration, original.radialAcceleration);
  close(doubleMass.tension, original.tension * 2);
  close(getConnectedCircularState({ ...base, v: base.v * 2 }, 0).tension, original.tension * 4);
  close(getConnectedCircularState({ ...base, R: base.R * 2 }, 0).tension, original.tension / 2);
});

test("el modelo es determinista y finito en todos los límites duros", () => {
  assert.deepEqual(getConnectedCircularState(base, 2.5), getConnectedCircularState(base, 2.5));
  for (const m of [0.5, 5]) for (const R of [0.5, 4]) {
    for (const v of [0.5, 10]) for (const Tmax of [1, 100]) {
      const params = { m, R, v, Tmax };
      const state = stepCircularRadial(createCircularRadialState(params), params, 0.5);
      const numbers = [state.t, state.theta, state.omega, state.position.x, state.position.y,
        state.velocity.x, state.velocity.y, state.acceleration.x, state.acceleration.y,
        state.radialAcceleration, state.tension];
      assert.ok(numbers.every(Number.isFinite));
    }
  }
});
