import assert from "node:assert/strict";
import test from "node:test";

import {
  createCircularRelationshipGeometries,
  createForcesFrictionRelationGeometry,
  createForcesHistoryGeometry,
} from "../src/utils/dynamics-charts.js";
import { getForcesFrictionForces } from "../src/utils/forces-friction.js";
import { getRequiredCircularTension } from "../src/utils/circular-radial-force.js";

const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);

test("la relación de fricción coincide con el modelo puro en F actual", () => {
  const params = { m: 10, beta: 12, F: 27, alpha: 18, muS: 0.48, muK: 0.26, g: 9.8, v0: 0 };
  const forces = getForcesFrictionForces(params, { v: 0 });
  const geometry = createForcesFrictionRelationGeometry(params, [0, 60]);
  close(geometry.currentValues[0].y, Math.abs(forces.requiredStatic));
  close(geometry.currentValues[1].y, forces.maximumStatic);
  close(geometry.currentValues[2].y, params.muK * forces.normal);
  assert.equal(geometry.cursorValue, params.F);
});

test("las curvas de fricción se cortan donde N deja de ser positiva", () => {
  const params = { m: 2, beta: 0, F: 20, alpha: 30, muS: 0.5, muK: 0.3, g: 1, v0: 0 };
  const geometry = createForcesFrictionRelationGeometry(params, [0, 60]);
  geometry.series.forEach(({ points }) => assert.ok(points.some((point) => point === null)));
});

test("la geometría de fricción permanece finita en límites duros", () => {
  for (const m of [2, 20]) for (const beta of [0, 35]) for (const alpha of [-30, 30]) {
    const geometry = createForcesFrictionRelationGeometry({ m, beta, alpha, F: 60, muS: 0.8, muK: 0.8, g: 15, v0: 0 }, [0, 60]);
    geometry.series.flatMap(({ points }) => points.filter(Boolean)).forEach(({ x, y }) => assert.ok(Number.isFinite(x) && Number.isFinite(y)));
    assert.ok(geometry.xTicks.every(Number.isFinite));
    assert.ok(geometry.yTicks.every(Number.isFinite));
  }
});

test("history acepta una muestra y conserva signos de v y fuerza neta", () => {
  const single = createForcesHistoryGeometry([{ t: 0, v: -2, net: -7 }], "v");
  assert.equal(single.series[0].points.length, 1);
  assert.equal(single.series[0].points[0].y, -2);
  const net = createForcesHistoryGeometry([{ t: 0, v: -2, net: -7 }, { t: 1, v: 1, net: 5 }], "net");
  assert.deepEqual(net.series[0].points.map(({ y }) => y), [-7, 5]);
});

test("T(v) y T(R) usan la ecuación radial y conservan Tmax", () => {
  const params = { m: 2, R: 2, v: 4, Tmax: 24 };
  const geometry = createCircularRelationshipGeometries(params, { vDomain: [0.5, 10], RDomain: [0.5, 4] });
  close(geometry.speed.currentValue.y, getRequiredCircularTension(params));
  close(geometry.radius.currentValue.y, getRequiredCircularTension(params));
  close(getRequiredCircularTension({ ...params, v: params.v * 2 }), geometry.speed.currentValue.y * 4);
  close(getRequiredCircularTension({ ...params, R: params.R * 2 }), geometry.radius.currentValue.y / 2);
  assert.equal(geometry.speed.referenceValue, params.Tmax);
  assert.equal(geometry.radius.referenceValue, params.Tmax);
});

test("las relaciones circulares producen geometría finita en límites duros", () => {
  for (const m of [0.5, 5]) for (const R of [0.5, 4]) for (const v of [0.5, 10]) {
    const geometry = createCircularRelationshipGeometries({ m, R, v, Tmax: 100 }, { vDomain: [0.5, 10], RDomain: [0.5, 4] });
    for (const chart of [geometry.speed, geometry.radius]) {
      chart.series[0].points.forEach(({ x, y }) => assert.ok(Number.isFinite(x) && Number.isFinite(y)));
      assert.ok(chart.paths.every((path) => typeof path === "string"));
    }
  }
});
