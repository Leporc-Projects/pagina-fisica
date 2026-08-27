import assert from "node:assert/strict";
import test from "node:test";

import { createForcesFrictionRelationGeometry, createPulleyHistoryGeometry } from "../src/utils/dynamics-charts.js";
import { createForcesFrictionState, stepForcesFriction } from "../src/utils/forces-friction.js";
import { createKinematicsChartGeometry } from "../src/utils/kinematics-svg.js";
import { getKinematicsState, getTurningPoint } from "../src/utils/kinematics-1d.js";
import { createProjectileCanvasTransform } from "../src/utils/projectile-canvas.js";
import { getProjectileState, getProjectileSummary } from "../src/utils/projectile-2d.js";
import { createPulleyState, getPulleyReadings, solvePulleySystem, stepPulleyState } from "../src/utils/pulley-systems.js";

const close = (actual, expected, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test("K1, K2 y K3 coinciden con los oráculos de prepublicación", () => {
  const k1 = { x0: 0, v0: 2, a: 3, T: 4 };
  assert.deepEqual(getKinematicsState(k1, 2), {
    time: 2, position: 10, displacement: 10, distance: 10,
    velocity: 8, speed: 8, acceleration: 3, direction: "hacia +x",
  });
  close(getKinematicsState(k1, 4).position, 32);
  close(getKinematicsState(k1, 4).velocity, 14);
  const k2 = { x0: 0, v0: 4, a: -2, T: 4 };
  assert.deepEqual(getTurningPoint(k2), { time: 2, position: 4 });
  close(getKinematicsState(k2, 4).position, 0);
  close(getKinematicsState(k2, 4).velocity, -4);
  const k3 = { x0: -3, v0: 5, a: 0, T: 4 };
  close(getKinematicsState(k3, 3).position, 12);
  close(getKinematicsState(k3, 3).velocity, 5);
  const chart = createKinematicsChartGeometry(k1, "position");
  const current = chart.transform.point({ x: 2, y: 10 });
  close(current.x, chart.transform.x(2));
  close(current.y, chart.transform.y(10));
  assert.match(chart.linePath, /^M/);
});

test("P1, P2 y P3 coinciden con los oráculos y la proyección conserva +y", () => {
  const cases = [
    [{ y0: 0, v0: 10, theta: 45, g: 10 }, { peakTime: Math.SQRT1_2, maximumHeight: 2.5, flightTime: Math.SQRT2, range: 10 }],
    [{ y0: 5, v0: 10, theta: 0, g: 10 }, { peakTime: 0, maximumHeight: 5, flightTime: 1, range: 10 }],
    [{ y0: 0, v0: 10, theta: 90, g: 10 }, { peakTime: 1, maximumHeight: 5, flightTime: 2, range: 0 }],
  ];
  for (const [parameters, expected] of cases) {
    const summary = getProjectileSummary(parameters);
    Object.entries(expected).forEach(([key, value]) => close(summary[key], value));
    const impact = getProjectileState(parameters, summary.flightTime);
    close(impact.position.y, 0);
  }
  const p1 = getProjectileSummary(cases[0][0]);
  close(p1.initialVelocity.vx, 7.0710678118654755);
  close(p1.initialVelocity.vy, 7.071067811865475);
  close(p1.impactVelocity.y, -7.0710678118654755);
  const transform = createProjectileCanvasTransform({ xDomain: [0, 10], yDomain: [0, 2.5], width: 800, height: 400 });
  assert.ok(transform.y(2.5) < transform.y(0));
  assert.ok(transform.x(10) > transform.x(0));
});

test("F1–F4 protegen régimen, normal, historia y umbrales variables", () => {
  const base = { m: 10, g: 10, beta: 0, alpha: 0, muS: .5, muK: .3, F: 20, v0: 0 };
  const f1 = createForcesFrictionState(base);
  assert.equal(f1.regime, "static");
  close(f1.normal, 100); close(f1.friction, -20); close(f1.maximumStatic, 50); close(f1.a, 0);
  const f2parameters = { ...base, F: 60 };
  const f2 = createForcesFrictionState(f2parameters);
  assert.equal(f2.regime, "kinetic");
  close(f2.friction, -30); close(f2.netParallel, 30); close(f2.a, 3);
  const f2at1 = stepForcesFriction(f2, f2parameters, 1);
  close(f2at1.v, 3); close(f2at1.s, 1.5);
  const f3 = createForcesFrictionState({ ...base, beta: 30, F: 0, muS: .6 });
  assert.equal(f3.regime, "static");
  close(f3.normal, 86.60254037844388); close(f3.friction, 50); close(f3.maximumStatic, 51.96152422706633);
  const f4static = createForcesFrictionState({ ...base, F: 40, alpha: 30 });
  const f4kinetic = createForcesFrictionState({ ...base, F: 50, alpha: 30 });
  close(f4static.normal, 80); assert.equal(f4static.regime, "static");
  close(f4kinetic.normal, 75); assert.equal(f4kinetic.regime, "kinetic");
  const chart = createForcesFrictionRelationGeometry({ ...base, F: 40, alpha: 30 }, [0, 60]);
  close(chart.currentValues[1].y, 40);
  const thresholdAt50 = chart.series[1].points.find((entry) => entry?.x === 50);
  close(thresholdAt50.y, 37.5);
  assert.notEqual(chart.currentValues[1].y, thresholdAt50.y);
});

test("PT, PA, PM y PD coinciden con valores literales y restricciones", () => {
  const cases = [
    ["table-hanging", { m1: 10, m2: 2, muS: .3, muK: .2, g: 10 }, { accelerations: { m1: 0, m2: 0 }, tensions: { T: 20 }, friction: 20 }],
    ["table-hanging", { m1: 10, m2: 5, muS: .3, muK: .2, g: 10 }, { accelerations: { m1: 2, m2: 2 }, tensions: { T: 40 }, friction: 20 }],
    ["atwood", { m1: 2, m2: 3, g: 10 }, { accelerations: { m1: -2, m2: 2 }, tensions: { T: 24 } }],
    ["atwood", { m1: 2, m2: 2, g: 10 }, { accelerations: { m1: 0, m2: 0 }, tensions: { T: 20 } }],
    ["movable-pulley", { mL: 4, mC: 1, g: 10 }, { accelerations: { mL: 2.5, mC: -5 }, tensions: { T: 15 } }],
    ["movable-pulley", { mL: 4, mC: 2, g: 10 }, { accelerations: { mL: 0, mC: 0 }, tensions: { T: 20 } }],
    ["three-pulley-tackle", { mL: 6, mC: 1, g: 10 }, { accelerations: { mL: 2, mC: -6 }, tensions: { T: 16 } }],
    ["three-pulley-tackle", { mL: 6, mC: 2, g: 10 }, { accelerations: { mL: 0, mC: 0 }, tensions: { T: 20 } }],
    ["double-atwood", { m1: 1, m2: 2, m3: 4, g: 10 }, { accelerations: { m1: -6, m2: 2, m3: 2 }, tensions: { TA: 16, TC: 32 } }],
    ["double-atwood", { m1: 2, m2: 2, m3: 4, g: 10 }, { accelerations: { m1: 0, m2: 0, m3: 0 }, tensions: { TA: 20, TC: 40 } }],
  ];
  for (const [scenarioId, parameters, expected] of cases) {
    const result = solvePulleySystem(scenarioId, parameters);
    Object.entries(expected.accelerations).forEach(([key, value]) => close(result.accelerations[key], value));
    Object.entries(expected.tensions).forEach(([key, value]) => close(result.tensions[key], value));
    if (expected.friction !== undefined) close(result.friction, expected.friction);
  }
});

test("los cinco contactos usan el primer límite físico, conservan v/a y marcan el gráfico", () => {
  const cases = [
    ["table-hanging", { m1: 10, m2: 5, muS: .3, muK: .2, g: 10 }, Math.sqrt(10), "m1-bracket", "m1", 10],
    ["atwood", { m1: 2, m2: 3, g: 10 }, 3, "m1-upper-clearance", "m1", -9],
    ["movable-pulley", { mL: 4, mC: 1, g: 10 }, Math.sqrt(18 / 5), "mC-fixed-pulley", "mC", -9],
    ["three-pulley-tackle", { mL: 6, mC: 1, g: 10 }, 3, "mC-fixed-pulley", "mC", -27],
    ["double-atwood", { m1: 1, m2: 2, m3: 4, g: 10 }, Math.sqrt(3.5), "mobile-fixed-clearance", "pulley", -3.5],
  ];
  for (const [scenarioId, parameters, expectedTime, surfaceId, coordinate, position] of cases) {
    let state = createPulleyState(scenarioId, parameters);
    while (!state.stopped) state = stepPulleyState(state, 1 / 120);
    const readings = getPulleyReadings(state);
    close(state.t, expectedTime, 1e-7);
    assert.equal(state.contact.surfaceId, surfaceId);
    close(readings.positions[coordinate], position, 1e-7);
    close(readings.velocities[coordinate], readings.accelerations[coordinate] * expectedTime, 1e-7);
    assert.notEqual(readings.velocities[coordinate], 0);
    assert.notEqual(readings.accelerations[coordinate], 0);
    const history = [
      { t: 0, positions: Object.fromEntries(Object.keys(readings.positions).map((key) => [key, 0])) },
      { t: state.t, positions: readings.positions },
    ];
    const keys = Object.keys(readings.positions).slice(0, 3);
    const chart = createPulleyHistoryGeometry(history, keys, { contactTime: state.t });
    assert.ok(chart.eventX !== null);
    close(chart.eventValue, readings.t);
    keys.forEach((key, index) => {
      assert.ok(chart.currentPoints[index]);
      assert.ok(chart.paths[index].startsWith("M"));
      close(chart.series[index].points.at(-1).y, readings.positions[key]);
    });
  }
});
