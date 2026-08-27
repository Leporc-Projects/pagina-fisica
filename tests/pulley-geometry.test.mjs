import assert from "node:assert/strict";
import test from "node:test";

import { createPulleySceneGeometry, getPolylineLength } from "../src/utils/pulley-geometry.js";
import { PULLEY_TERMINAL_GEOMETRY } from "../src/utils/pulley-systems.js";

const close = (actual, expected, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const samePoint = (actual, expected) => { close(actual.x, expected.x); close(actual.y, expected.y); };
const layout = (scenarioId, positions, width = 800, height = width < 620 ? 480 : 576) =>
  createPulleySceneGeometry({ scenarioId, width, height, positions });
const initialPositions = {
  "table-hanging": { m1: 0, m2: 0 },
  atwood: { m1: 0, m2: 0 },
  "movable-pulley": { mL: 0, mC: 0 },
  "three-pulley-tackle": { mL: 0, mC: 0 },
  "double-atwood": { m1: 0, m2: 0, m3: 0, pulley: 0 },
};

const assertTangent = (rope, tangentIndex, wheel, adjacentIndex) => {
  const tangent = rope[tangentIndex];
  const adjacent = rope[adjacentIndex];
  close(
    (adjacent.x - tangent.x) * (tangent.x - wheel.x) +
      (adjacent.y - tangent.y) * (tangent.y - wheel.y),
    0,
    1e-6
  );
};

const circleOverlapsBlock = (wheel, body) => {
  const x = Math.max(body.left, Math.min(wheel.x, body.right));
  const y = Math.max(body.top, Math.min(wheel.y, body.bottom));
  return Math.hypot(wheel.x - x, wheel.y - y) < wheel.radius - 1e-7;
};

test("los cinco aparatos son finitos, deterministas e invariantes de idioma", () => {
  for (const width of [390, 800]) {
    for (const [scenarioId, positions] of Object.entries(initialPositions)) {
      const geometry = layout(scenarioId, positions, width);
      assert.deepEqual(geometry, layout(scenarioId, positions, width));
      assert.deepEqual(geometry.terminalSurfaces, PULLEY_TERMINAL_GEOMETRY[scenarioId]);
      assert.ok(geometry.scale > 0);
      assert.ok(geometry.ropes.flat().every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)));
      assert.ok(Object.values(geometry.blocks).every(({ left, right, top, bottom }) =>
        left >= 0 && right <= width && top >= 0 && bottom <= (width < 620 ? 480 : 576)
      ));
      for (const wheel of geometry.pulleys) {
        for (const body of Object.values(geometry.blocks)) assert.equal(circleOverlapsBlock(wheel, body), false);
      }
    }
  }
});

test("mesa: bloque apoyado, cuerda horizontal, cuarto de arco tangente y bracket unido al eje", () => {
  const geometry = layout("table-hanging", { m1: 0, m2: 0 });
  const rope = geometry.ropes[0];
  const wheel = geometry.pulleys[0];
  const m1 = geometry.blocks.m1;
  const m2 = geometry.blocks.m2;
  samePoint(rope[0], m1.hooks.upperRight);
  samePoint(rope.at(-1), m2.hooks.top);
  close(rope[0].y, rope[1].y);
  close(rope.at(-1).x, rope.at(-2).x);
  close(m1.bottom, geometry.table.y);
  assert.ok(wheel.y + wheel.radius <= geometry.table.y);
  samePoint(geometry.supports[0].points.at(-1), wheel.axle);
  assertTangent(rope, 1, wheel, 0);
  assertTangent(rope, rope.length - 2, wheel, rope.length - 1);
});

test("mesa conserva cuerda y se detiene con clearance antes del bracket", () => {
  const initial = layout("table-hanging", { m1: 0, m2: 0 });
  const contact = layout("table-hanging", { m1: 10, m2: 10 });
  close(getPolylineLength(initial.ropes[0]), getPolylineLength(contact.ropes[0]));
  close(contact.table.edgeX - contact.blocks.m1.hooks.upperRight.x, 6);
  assert.ok(contact.blocks.m1.right < contact.pulleys[0].x - contact.pulleys[0].radius);
});

test("Atwood conecta ambos hooks, conserva cuerda y respeta clearance superior", () => {
  const initial = layout("atwood", { m1: 0, m2: 0 });
  const contact = layout("atwood", { m1: 9, m2: -9 });
  samePoint(initial.ropes[0][0], initial.blocks.m1.hooks.top);
  samePoint(initial.ropes[0].at(-1), initial.blocks.m2.hooks.top);
  close(getPolylineLength(initial.ropes[0]), getPolylineLength(contact.ropes[0]));
  close(contact.blocks.m2.hooks.top.y, contact.pulleys[0].y + contact.pulleys[0].radius + 12);
  assertTangent(initial.ropes[0], 1, initial.pulleys[0], 0);
  assertTangent(initial.ropes[0], initial.ropes[0].length - 2, initial.pulleys[0], initial.ropes[0].length - 1);
});

test("polea móvil: anclaje, yoke y hanger forman conexiones continuas y muestran 2:1", () => {
  const initial = layout("movable-pulley", { mL: 0, mC: 0 });
  const moved = layout("movable-pulley", { mL: 2, mC: -4 });
  samePoint(initial.ropes[0][0], initial.anchors[0]);
  samePoint(initial.ropes[0].at(-1), initial.blocks.mC.hooks.top);
  const hanger = initial.connectors.find(({ id }) => id === "load-hanger");
  const leftYoke = initial.connectors.find(({ id }) => id === "mobile-yoke-left");
  const rightYoke = initial.connectors.find(({ id }) => id === "mobile-yoke-right");
  samePoint(hanger.points.at(-1), initial.blocks.mL.hooks.top);
  samePoint(leftYoke.points.at(-1), hanger.points[0]);
  samePoint(rightYoke.points.at(-1), hanger.points[0]);
  close(getPolylineLength(initial.ropes[0]), getPolylineLength(moved.ropes[0]));
  close(moved.blocks.mL.y - initial.blocks.mL.y, 2 * initial.scale);
  close(moved.blocks.mC.y - initial.blocks.mC.y, -4 * initial.scale);
});

test("polea móvil alcanza el hardware fijo sin gap ni penetración", () => {
  const contact = layout("movable-pulley", { mL: 4.5, mC: -9 }, 390);
  const fixed = contact.pulleys.find(({ id }) => id === "fixed");
  close(contact.blocks.mC.hooks.top.y, fixed.y + fixed.radius + 12);
  samePoint(contact.connectors.find(({ id }) => id === "load-hanger").points.at(-1), contact.blocks.mL.hooks.top);
  assert.equal(circleOverlapsBlock(fixed, contact.blocks.mC), false);
});

test("polipasto 3:1 conecta el anclaje móvil, tres poleas y conserva la cuerda", () => {
  const initial = layout("three-pulley-tackle", { mL: 0, mC: 0 });
  const moved = layout("three-pulley-tackle", { mL: 2, mC: -6 });
  assert.equal(initial.pulleys.length, 3);
  samePoint(initial.ropes[0][0], initial.anchors[0]);
  samePoint(initial.ropes[0].at(-1), initial.blocks.mC.hooks.top);
  samePoint(initial.connectors.find(({ id }) => id === "load-hanger").points.at(-1), initial.blocks.mL.hooks.top);
  samePoint(initial.connectors.find(({ id }) => id === "moving-anchor-hanger").points[0], initial.anchors[0]);
  close(getPolylineLength(initial.ropes[0]), getPolylineLength(moved.ropes[0]), 1e-6);
  close(moved.blocks.mL.y - initial.blocks.mL.y, 2 * initial.scale);
  close(moved.blocks.mC.y - initial.blocks.mC.y, -6 * initial.scale);
});

test("Atwood doble separa niveles, une la cuerda superior al conjunto móvil y conserva ambas cuerdas", () => {
  const initial = layout("double-atwood", initialPositions["double-atwood"]);
  const moved = layout("double-atwood", { m1: -1.5, m2: .5, m3: .5, pulley: -.5 });
  samePoint(initial.ropes[0][0], initial.blocks.m3.hooks.top);
  samePoint(initial.ropes[1][0], initial.blocks.m1.hooks.top);
  samePoint(initial.ropes[1].at(-1), initial.blocks.m2.hooks.top);
  const upperHanger = initial.connectors.find(({ id }) => id === "upper-hanger");
  samePoint(initial.ropes[0].at(-1), upperHanger.points[0]);
  samePoint(upperHanger.points.at(-1), initial.pulleys.find(({ id }) => id === "mobile").axle);
  close(getPolylineLength(initial.ropes[0]), getPolylineLength(moved.ropes[0]));
  close(getPolylineLength(initial.ropes[1]), getPolylineLength(moved.ropes[1]));
});

test("Atwood doble llega a contacto superior relativo sin solapar bloque y polea", () => {
  const contact = layout("double-atwood", { m1: 11, m2: -5, m3: -3, pulley: 3 }, 390);
  const mobile = contact.pulleys.find(({ id }) => id === "mobile");
  close(contact.blocks.m2.hooks.top.y, mobile.y + mobile.radius + 12);
  assert.equal(circleOverlapsBlock(mobile, contact.blocks.m2), false);
  assert.equal(circleOverlapsBlock(mobile, contact.blocks.m3), false);
});
