import assert from "node:assert/strict";
import test from "node:test";

import {
  createForcesFrictionState,
  getForcesFrictionForces,
  stepForcesFriction,
} from "../src/utils/forces-friction.js";

const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);
const base = { m: 10, beta: 0, F: 20, alpha: 0, muS: 0.5, muK: 0.3, g: 9.8, v0: 0 };

test("P1: la fricción estática se ajusta sin igualar siempre su máximo", () => {
  const state = createForcesFrictionState(base);
  assert.equal(state.regime, "static");
  close(state.normal, 98);
  close(state.friction, -20);
  close(state.a, 0);
});

test("P2: superar el umbral inicia deslizamiento con el signo correcto", () => {
  const state = createForcesFrictionState({ ...base, F: 55 });
  assert.equal(state.regime, "kinetic");
  close(state.friction, -29.4);
  close(state.a, 2.56);
});

test("P3 se sostiene y P4 acelera cuesta abajo", () => {
  const held = createForcesFrictionState({ ...base, beta: 20, F: 0, muS: 0.4 });
  assert.equal(held.regime, "static");
  const sliding = createForcesFrictionState({ ...base, beta: 30, F: 0, muS: 0.3, muK: 0.2 });
  assert.equal(sliding.regime, "kinetic");
  assert.ok(sliding.a < 0);
});

test("P5: tirar en ángulo reduce N y supera el umbral", () => {
  const state = createForcesFrictionState({ ...base, F: 50, alpha: 30, muK: 0.25 });
  close(state.normal, 73);
  assert.equal(state.regime, "kinetic");
  assert.ok(Math.abs(state.requiredStatic) > state.maximumStatic);
});

test("la fricción respeta los contratos estático y cinético", () => {
  const stationary = getForcesFrictionForces(base, { v: 0 });
  assert.ok(Math.abs(stationary.friction) <= base.muS * stationary.normal);
  for (const velocity of [-3, 3]) {
    const moving = getForcesFrictionForces(base, { v: velocity });
    close(Math.abs(moving.friction), base.muK * moving.normal);
    assert.ok(moving.friction * velocity < 0);
  }
});

test("el cruce por v=0 se resuelve como evento y se asienta sin chatter", () => {
  const params = { ...base, F: 0, v0: 1 };
  let state = createForcesFrictionState(params);
  state = stepForcesFriction(state, params, 1);
  assert.equal(state.regime, "static");
  assert.equal(state.v, 0);
  const settled = stepForcesFriction(state, params, 1);
  assert.equal(settled.v, 0);
  assert.equal(settled.regime, "static");
  close(settled.s, state.s);
  close(settled.t, state.t + 1);
});

test("N_raw no positivo invalida contacto sin crear una normal negativa", () => {
  const params = { ...base, m: 2, F: 60, alpha: 30, g: 1 };
  const state = createForcesFrictionState(params);
  assert.equal(state.regime, "contact-invalid");
  assert.equal(state.normal, 0);
  assert.equal(state.friction, 0);
  assert.deepEqual(stepForcesFriction(state, params, 1), state);
});

test("el paso es determinista y permanece finito en muestras válidas", () => {
  const original = createForcesFrictionState({ ...base, v0: -2 });
  assert.deepEqual(
    stepForcesFriction(original, base, 1 / 120),
    stepForcesFriction(original, base, 1 / 120)
  );
  let seed = 0x41c6ce57;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
  for (let index = 0; index < 300; index += 1) {
    const sample = {
      m: 2 + random() * 18,
      beta: random() * 35,
      F: random() * 60,
      alpha: -30 + random() * 60,
      muS: random() * 0.8,
      muK: random() * 0.8,
      g: 1 + random() * 14,
      v0: -6 + random() * 12,
    };
    const next = stepForcesFriction(createForcesFrictionState(sample), sample, random());
    assert.ok(Object.values(next).filter((value) => typeof value === "number").every(Number.isFinite));
  }
});
