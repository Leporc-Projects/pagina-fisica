import assert from "node:assert/strict";
import test from "node:test";

import {
  createKinematicsChartGeometry,
  createKinematicsMotionGeometry,
  formatKinematicsNumber,
} from "../src/utils/kinematics-svg.js";

const parameters = { x0: -4, v0: 6, a: -2, T: 6 };

test("proyecta las tres curvas a paths SVG finitos", () => {
  for (const quantity of ["position", "velocity", "acceleration"]) {
    const geometry = createKinematicsChartGeometry(parameters, quantity);
    assert.match(geometry.linePath, /^M /);
    assert.doesNotMatch(geometry.linePath, /NaN|Infinity|undefined/);
    assert.ok(geometry.xTicks.every(Number.isFinite));
    assert.ok(geometry.yTicks.every(Number.isFinite));
  }
});

test("el eje de movimiento contiene inicio, retorno y final", () => {
  const geometry = createKinematicsMotionGeometry(parameters);
  assert.ok(geometry.xDomain[0] < -4);
  assert.ok(geometry.xDomain[1] > 5);
  assert.ok(Number.isFinite(geometry.initialX));
  assert.ok(Number.isFinite(geometry.originX));
});

test("el formato español limpia cero negativo y evita valores no finitos", () => {
  assert.equal(formatKinematicsNumber(-1e-12), "0");
  assert.equal(formatKinematicsNumber(1.25), "1,25");
  assert.equal(formatKinematicsNumber(Number.NaN), "—");
});
