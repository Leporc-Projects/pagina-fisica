import assert from "node:assert/strict";
import test from "node:test";
import {
  PULLEY_SCENARIO_IDS,
  PULLEY_TERMINAL_GEOMETRY,
  createPulleyState,
  getPulleyContactCandidates,
  getPulleyReadings,
  resetPulleyState,
  solvePulleySystem,
  stepPulleyState,
  validatePulleyConfig,
} from "../src/utils/pulley-systems.js";

const close = (actual, expected, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test("mesa sin fricción reproduce el sistema de dos masas", () => {
  const s = solvePulleySystem("table-hanging", { m1: 4, m2: 2, muS: 0, muK: 0, g: 9.8 });
  close(s.accelerations.m1, 2 * 9.8 / 6);
  close(s.tensions.T, 4 * s.accelerations.m1);
  close(s.tensions.T, 2 * (9.8 - s.accelerations.m2));
});

test("la fricción estática se ajusta y sostiene inclusive en el umbral", () => {
  const s = solvePulleySystem("table-hanging", { m1: 10, m2: 4, muS: 0.4, muK: 0.2, g: 9.8 });
  assert.equal(s.regime, "static");
  close(s.friction, 4 * 9.8);
  close(s.maximumStatic, 0.4 * 10 * 9.8);
  assert.ok(s.friction <= s.maximumStatic);
});

test("el régimen cinético usa muK N y ambas tensiones coinciden", () => {
  const s = solvePulleySystem("table-hanging", { m1: 6, m2: 5, muS: 0.4, muK: 0.25, g: 9.8 });
  assert.equal(s.regime, "kinetic");
  close(s.friction, 0.25 * 6 * 9.8);
  close(s.tensions.T, 6 * s.accelerations.m1 + s.friction);
  close(s.tensions.T, 5 * (9.8 - s.accelerations.m2));
});

test("muK mayor que muS se rechaza explícitamente", () => {
  const config = { m1: 6, m2: 5, muS: 0.2, muK: 0.3, g: 9.8 };
  assert.equal(validatePulleyConfig("table-hanging", config).valid, false);
  assert.throws(() => solvePulleySystem("table-hanging", config), /muK/);
});

test("Atwood admite equilibrio, signos opuestos y tensión entre pesos", () => {
  const balanced = solvePulleySystem("atwood", { m1: 3, m2: 3, g: 9.8 });
  close(balanced.accelerations.m1, 0);
  close(balanced.tensions.T, 3 * 9.8);
  const forward = solvePulleySystem("atwood", { m1: 2, m2: 5, g: 9.8 });
  const swapped = solvePulleySystem("atwood", { m1: 5, m2: 2, g: 9.8 });
  close(forward.accelerations.m2, -swapped.accelerations.m2);
  close(Math.abs(forward.accelerations.m2), Math.abs(swapped.accelerations.m2));
  assert.ok(forward.tensions.T > 2 * 9.8 && forward.tensions.T < 5 * 9.8);
});

test("la cuerda de Atwood conserva posición, velocidad y aceleración", () => {
  let state = createPulleyState("atwood", { m1: 2, m2: 5, g: 9.8 });
  for (let i = 0; i < 30; i += 1) state = stepPulleyState(state, 0.01);
  const r = getPulleyReadings(state);
  close(r.positions.m1 + r.positions.m2, 0);
  close(r.velocities.m1 + r.velocities.m2, 0);
  close(r.accelerations.m1 + r.accelerations.m2, 0);
});

test("polea móvil conserva 2:1 y satisface ambas ecuaciones de Newton", () => {
  const config = { mL: 8, mC: 3, g: 9.8 };
  const s = solvePulleySystem("movable-pulley", config);
  close(2 * s.accelerations.mL + s.accelerations.mC, 0);
  close(config.mL * config.g - 2 * s.tensions.T, config.mL * s.accelerations.mL);
  close(config.mC * config.g - s.tensions.T, config.mC * s.accelerations.mC);
  let state = createPulleyState("movable-pulley", config);
  for (let i = 0; i < 80; i += 1) state = stepPulleyState(state, 0.005);
  const r = getPulleyReadings(state);
  close(2 * r.positions.mL + r.positions.mC, 0);
  close(2 * r.velocities.mL + r.velocities.mC, 0);
});

test("mL=2mC produce equilibrio en polea móvil", () => {
  const s = solvePulleySystem("movable-pulley", { mL: 8, mC: 4, g: 9.8 });
  assert.equal(s.regime, "equilibrium");
  close(s.accelerations.mL, 0);
  close(s.tensions.T, 4 * 9.8);
});

test("Atwood doble cumple restricciones, tensiones y tres ecuaciones", () => {
  const config = { m1: 3, m2: 5, m3: 7, g: 9.8 };
  const s = solvePulleySystem("double-atwood", config);
  close(s.accelerations.m1 + s.accelerations.m2 + 2 * s.accelerations.m3, 0);
  close(s.tensions.TC, 2 * s.tensions.TA);
  close(config.m1 * s.accelerations.m1, config.m1 * config.g - s.tensions.TA);
  close(config.m2 * s.accelerations.m2, config.m2 * config.g - s.tensions.TA);
  close(config.m3 * s.accelerations.m3, config.m3 * config.g - s.tensions.TC);
});

test("Atwood doble equilibrada y swapping m1/m2 son exactos", () => {
  const balanced = solvePulleySystem("double-atwood", { m1: 3, m2: 3, m3: 6, g: 9.8 });
  close(balanced.tensions.TA, 3 * 9.8);
  close(balanced.tensions.TC, 6 * 9.8);
  Object.values(balanced.accelerations).forEach((a) => close(a, 0));
  const a = solvePulleySystem("double-atwood", { m1: 3, m2: 5, m3: 7, g: 9.8 });
  const b = solvePulleySystem("double-atwood", { m1: 5, m2: 3, m3: 7, g: 9.8 });
  close(a.tensions.TA, b.tensions.TA);
  close(a.accelerations.m1, b.accelerations.m2);
  close(a.accelerations.m2, b.accelerations.m1);
});

test("todos los escenarios permanecen finitos en límites permitidos", () => {
  const configs = {
    "table-hanging": { m1: 0.5, m2: 20, muS: 0.8, muK: 0.8, g: 15 },
    atwood: { m1: 0.5, m2: 20, g: 15 },
    "movable-pulley": { mL: 0.5, mC: 20, g: 15 },
    "double-atwood": { m1: 0.5, m2: 20, m3: 0.5, g: 15 },
  };
  for (const id of PULLEY_SCENARIO_IDS) {
    const values = JSON.stringify(solvePulleySystem(id, configs[id]));
    assert.doesNotMatch(values, /null|NaN|Infinity/);
  }
});

test("integración temporal es determinista, rechaza dt negativo y dt=0 no muta", () => {
  const initial = createPulleyState("atwood", { m1: 2, m2: 5, g: 9.8 });
  assert.deepEqual(stepPulleyState(initial, 0), initial);
  assert.throws(() => stepPulleyState(initial, -0.1), /dt/);
  const run = () => Array.from({ length: 200 }).reduce((state) => stepPulleyState(state, 1 / 120), initial);
  assert.deepEqual(run(), run());
});

test("el contacto geométrico detiene establemente sin inventar reposo y reset restaura", () => {
  const initial = createPulleyState("atwood", { m1: 0.5, m2: 20, g: 15 });
  let state = initial;
  for (let i = 0; i < 1000 && !state.stopped; i += 1) state = stepPulleyState(state, 1 / 120);
  assert.equal(state.stopped, true);
  assert.equal(state.stopReason, "geometry-contact");
  assert.ok(state.contact?.body);
  assert.ok(Object.values(state.velocities).some((value) => Math.abs(value) > 0));
  assert.ok(Object.values(getPulleyReadings(state).accelerations).some((value) => Math.abs(value) > 0));
  assert.deepEqual(stepPulleyState(state, 1), state);
  assert.deepEqual(resetPulleyState(state), initial);
});

test("los candidatos terminales son superficies físicas identificables", () => {
  const cases = {
    "table-hanging": { m1: 6, m2: 4, muS: 0, muK: 0, g: 9.8 },
    atwood: { m1: 6, m2: 4, g: 9.8 },
    "movable-pulley": { mL: 8, mC: 3, g: 9.8 },
    "double-atwood": { m1: 6, m2: 4, m3: 8, g: 9.8 },
  };
  for (const [scenarioId, config] of Object.entries(cases)) {
    const state = createPulleyState(scenarioId, config);
    const solution = solvePulleySystem(scenarioId, config);
    const candidates = getPulleyContactCandidates(state, solution.accelerations);
    assert.ok(candidates.length > 0);
    assert.ok(candidates.every(({ id, body, target, time }) =>
      PULLEY_TERMINAL_GEOMETRY[scenarioId].some((entry) => entry.id === id) && body && target && time > 0
    ));
  }
});
