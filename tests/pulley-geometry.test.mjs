import assert from "node:assert/strict";
import test from "node:test";

import {
  createPulleySceneGeometry,
  getPolylineLength,
} from "../src/utils/pulley-geometry.js";
import { PULLEY_LIMITS } from "../src/utils/pulley-systems.js";

const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const layout = (scenarioId, positions, width = 800) => createPulleySceneGeometry({
  scenarioId,
  width,
  height: width < 620 ? 390 : 500,
  positions,
  scale: width < 620 ? 21 : 28,
});

test("mesa-colgante dibuja tensión horizontal, caída vertical y tangencias", () => {
  const geometry = layout("table-hanging", { m1: 0, m2: 0 });
  const rope = geometry.ropes[0];
  const pulley = geometry.pulleys[0];
  const topTangent = rope[1];
  const rightTangent = rope.at(-2);
  close(rope[0].y, topTangent.y);
  close(rightTangent.x, rope.at(-1).x);
  close(topTangent.x, pulley.x);
  close(topTangent.y, pulley.y - pulley.radius);
  close(rightTangent.x, pulley.x + pulley.radius);
  close(rightTangent.y, pulley.y);
  close(
    (topTangent.x - rope[0].x) * (topTangent.x - pulley.x) +
      (topTangent.y - rope[0].y) * (topTangent.y - pulley.y),
    0
  );
  close(
    (rope.at(-1).x - rightTangent.x) * (rightTangent.x - pulley.x) +
      (rope.at(-1).y - rightTangent.y) * (rightTangent.y - pulley.y),
    0
  );
});

test("mesa-colgante conserva longitud cuando q1=q2", () => {
  const initial = layout("table-hanging", { m1: 0, m2: 0 });
  const moved = layout("table-hanging", { m1: PULLEY_LIMITS.travel, m2: PULLEY_LIMITS.travel });
  close(getPolylineLength(initial.ropes[0]), getPolylineLength(moved.ropes[0]));
  assert.ok(moved.blocks.m1.x > initial.blocks.m1.x + 80);
});

test("Atwood conserva cuerda para q1+q2=0", () => {
  const initial = layout("atwood", { m1: 0, m2: 0 });
  const moved = layout("atwood", { m1: -1.1, m2: 1.1 });
  close(getPolylineLength(initial.ropes[0]), getPolylineLength(moved.ropes[0]));
  close(moved.ropes[0][0].x, moved.ropes[0][1].x);
  close(moved.ropes[0].at(-1).x, moved.ropes[0].at(-2).x);
});

test("polea móvil conserva cuerda para 2qL+qC=0 y usa apoyos verticales", () => {
  const initial = layout("movable-pulley", { mL: 0, mC: 0 });
  const moved = layout("movable-pulley", { mL: .8, mC: -1.6 });
  close(getPolylineLength(initial.ropes[0]), getPolylineLength(moved.ropes[0]));
  const rope = moved.ropes[0];
  close(rope[0].x, rope[1].x);
  close(rope.at(-1).x, rope.at(-2).x);
});

test("Atwood doble conserva independientemente sus dos cuerdas", () => {
  const initial = layout("double-atwood", { m1: 0, m2: 0, m3: 0, pulley: 0 });
  const moved = layout("double-atwood", { m1: -1.5, m2: .5, m3: .5, pulley: -.5 });
  close(getPolylineLength(initial.ropes[0]), getPolylineLength(moved.ropes[0]));
  close(getPolylineLength(initial.ropes[1]), getPolylineLength(moved.ropes[1]));
  for (const rope of moved.ropes) {
    close(rope[0].x, rope[1].x);
    close(rope.at(-1).x, rope.at(-2).x);
  }
});

test("las cuatro geometrías permanecen finitas en móvil", () => {
  for (const [scenarioId, positions] of [
    ["table-hanging", { m1: 3.2, m2: 3.2 }],
    ["atwood", { m1: -3.2, m2: 3.2 }],
    ["movable-pulley", { mL: 1.6, mC: -3.2 }],
    ["double-atwood", { m1: -3.2, m2: 3.2 / 3, m3: 3.2 / 3, pulley: -3.2 / 3 }],
  ]) {
    const geometry = layout(scenarioId, positions, 390);
    assert.ok(geometry.ropes.flat().every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)));
    assert.ok(Object.values(geometry.blocks).every(({ x, y, width, height }) =>
      x - width / 2 >= 0 && x + width / 2 <= 390 && y - height / 2 >= 0 && y + height / 2 <= 390
    ));
  }
});
