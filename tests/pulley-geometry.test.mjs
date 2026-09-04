import assert from "node:assert/strict";
import test from "node:test";

import {
  createPulleySceneGeometry,
  getBlockAttachmentPoint,
  getPolylineLength,
} from "../src/utils/pulley-geometry.js";
import { PULLEY_TERMINAL_GEOMETRY } from "../src/utils/pulley-systems.js";

const close = (actual, expected, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const samePoint = (actual, expected) => { close(actual.x, expected.x); close(actual.y, expected.y); };
const viewports = Object.freeze([
  Object.freeze({ width: 390, height: 540 }),
  Object.freeze({ width: 800, height: 624 }),
]);
const layout = (scenarioId, positions, { width = 800, height = 624 } = {}) =>
  createPulleySceneGeometry({ scenarioId, width, height, positions });
const initialPositions = Object.freeze({
  "table-hanging": Object.freeze({ m1: 0, m2: 0 }),
  atwood: Object.freeze({ m1: 0, m2: 0 }),
  "movable-pulley": Object.freeze({ mL: 0, mC: 0 }),
  "three-pulley-tackle": Object.freeze({ mL: 0, mC: 0 }),
  "double-atwood": Object.freeze({ m1: 0, m2: 0, m3: 0, pulley: 0 }),
});
const movedPositions = Object.freeze({
  "table-hanging": Object.freeze({ m1: 1, m2: 1 }),
  atwood: Object.freeze({ m1: -1, m2: 1 }),
  "movable-pulley": Object.freeze({ mL: 1, mC: -2 }),
  "three-pulley-tackle": Object.freeze({ mL: 1, mC: -3 }),
  "double-atwood": Object.freeze({ m1: 1, m2: -.5, m3: -.25, pulley: .25 }),
});
const terminalSamples = Object.freeze({
  "table-hanging": Object.freeze([
    Object.freeze({ m1: 10, m2: 10 }),
    Object.freeze({ m1: -1, m2: -1 }),
  ]),
  atwood: Object.freeze([
    Object.freeze({ m1: 9, m2: -9 }),
    Object.freeze({ m1: -9, m2: 9 }),
  ]),
  "movable-pulley": Object.freeze([
    Object.freeze({ mL: 4.5, mC: -9 }),
    Object.freeze({ mL: -2.75, mC: 5.5 }),
  ]),
  "three-pulley-tackle": Object.freeze([
    Object.freeze({ mL: 9, mC: -27 }),
    Object.freeze({ mL: -3, mC: 9 }),
  ]),
  "double-atwood": Object.freeze([
    Object.freeze({ m1: 11, m2: -5, m3: -3, pulley: 3 }),
    Object.freeze({ m1: -7, m2: 1, m3: 3, pulley: -3 }),
  ]),
});

const circleOverlapsBlock = (wheel, body) => {
  const x = Math.max(body.left, Math.min(wheel.x, body.right));
  const y = Math.max(body.top, Math.min(wheel.y, body.bottom));
  return Math.hypot(wheel.x - x, wheel.y - y) < wheel.radius - 1e-7;
};

const assertPointInBounds = ({ x, y }, width, height, label) => {
  assert.ok(Number.isFinite(x) && Number.isFinite(y), `${label} no es finito`);
  assert.ok(x >= -1e-7 && x <= width + 1e-7, `${label}.x=${x} fuera de ${width}`);
  assert.ok(y >= -1e-7 && y <= height + 1e-7, `${label}.y=${y} fuera de ${height}`);
};

const assertSceneInBounds = (geometry, width, height) => {
  assert.ok(geometry.scale > 0);
  assert.equal("stops" in geometry, false);
  geometry.ropes.forEach((item) => item.points.forEach((value) => assertPointInBounds(value, width, height, `${item.id}:rope`)));
  geometry.pulleys.forEach((wheel) => {
    assertPointInBounds({ x: wheel.x - wheel.radius, y: wheel.y - wheel.radius }, width, height, `${wheel.id}:wheel-min`);
    assertPointInBounds({ x: wheel.x + wheel.radius, y: wheel.y + wheel.radius }, width, height, `${wheel.id}:wheel-max`);
    assert.ok(Number.isFinite(wheel.rotationPhase));
  });
  Object.values(geometry.blocks).forEach((body) => {
    assertPointInBounds({ x: body.left, y: body.top }, width, height, `${body.id}:block-min`);
    assertPointInBounds({ x: body.right, y: body.bottom }, width, height, `${body.id}:block-max`);
  });
  geometry.supports.forEach((support) => {
    assertPointInBounds({ x: support.x - support.width / 2, y: support.y - 5 }, width, height, `${support.id}:support-min`);
    assertPointInBounds({ x: support.x + support.width / 2, y: support.y + 5 }, width, height, `${support.id}:support-max`);
  });
  geometry.anchors.forEach((anchor) => assertPointInBounds(anchor, width, height, `${anchor.id}:anchor`));
  geometry.connectors.forEach((connector) => connector.points.forEach((value) => assertPointInBounds(value, width, height, `${connector.id}:hardware`)));
};

const assertCenteredBlockHooks = (body) => {
  close(body.hooks.top.x, body.x);
  close(body.hooks.top.y, body.top);
  close(body.hooks.right.x, body.right);
  close(body.hooks.right.y, body.y);
  close(body.hooks.bottom.x, body.x);
  close(body.hooks.bottom.y, body.bottom);
  close(body.hooks.left.x, body.left);
  close(body.hooks.left.y, body.y);
};

const assertLineTangentToArc = (line, arc, atStart) => {
  const tangent = atStart ? arc.points[0] : arc.points.at(-1);
  const other = atStart ? line.points[0] : line.points.at(-1);
  const direction = { x: other.x - tangent.x, y: other.y - tangent.y };
  const radial = { x: tangent.x - arc.center.x, y: tangent.y - arc.center.y };
  close(direction.x * radial.x + direction.y * radial.y, 0, 1e-6);
};

const assertMechanicallyContinuousRope = (item) => {
  assert.ok(item.id && item.segments.length >= 3);
  item.segments.forEach((segment) => {
    assert.ok(["line", "arc"].includes(segment.kind));
    assert.ok(segment.points.length >= 2);
    if (segment.kind === "line") assert.equal(segment.points.length, 2, `${item.id}:${segment.id} tiene un giro libre`);
    else segment.points.forEach((value) => close(
      Math.hypot(value.x - segment.center.x, value.y - segment.center.y),
      segment.radius,
      1e-6
    ));
  });
  for (let index = 1; index < item.segments.length; index += 1) {
    const previous = item.segments[index - 1];
    const current = item.segments[index];
    samePoint(previous.points.at(-1), current.points[0]);
    assert.notEqual(previous.kind, current.kind, `${item.id} cambia dirección sin polea entre ${previous.id} y ${current.id}`);
    if (previous.kind === "line") assertLineTangentToArc(previous, current, true);
    else assertLineTangentToArc(current, previous, false);
  }
};

test("la utilidad de anclaje devuelve el centro exacto de cada cara", () => {
  const body = { left: 20, right: 80, top: 30, bottom: 70 };
  samePoint(getBlockAttachmentPoint(body, "top"), { x: 50, y: 30 });
  samePoint(getBlockAttachmentPoint(body, "right"), { x: 80, y: 50 });
  samePoint(getBlockAttachmentPoint(body, "bottom"), { x: 50, y: 70 });
  samePoint(getBlockAttachmentPoint(body, "left"), { x: 20, y: 50 });
  assert.throws(() => getBlockAttachmentPoint(body, "corner"), /Cara de anclaje desconocida/);
});

test("los cinco aparatos iniciales son finitos, deterministas y permanecen dentro de ambos canvas", () => {
  for (const viewport of viewports) {
    for (const [scenarioId, positions] of Object.entries(initialPositions)) {
      const geometry = layout(scenarioId, positions, viewport);
      assert.deepEqual(geometry, layout(scenarioId, positions, viewport));
      assert.deepEqual(geometry.terminalSurfaces, PULLEY_TERMINAL_GEOMETRY[scenarioId]);
      assertSceneInBounds(geometry, viewport.width, viewport.height);
      Object.values(geometry.blocks).forEach(assertCenteredBlockHooks);
      for (const wheel of geometry.pulleys) {
        for (const body of Object.values(geometry.blocks)) assert.equal(circleOverlapsBlock(wheel, body), false);
      }
    }
  }
});

test("cada tramo recto enlaza tangencialmente con arcos de radio exacto y no gira libremente", () => {
  for (const [scenarioId, positions] of Object.entries(initialPositions)) {
    layout(scenarioId, positions).ropes.forEach(assertMechanicallyContinuousRope);
  }
});

test("los estados representativos cercanos a ambos sentidos y contactos no recortan el aparato", () => {
  for (const viewport of viewports) {
    for (const [scenarioId, samples] of Object.entries(terminalSamples)) {
      samples.forEach((positions) => assertSceneInBounds(layout(scenarioId, positions, viewport), viewport.width, viewport.height));
    }
  }
});

test("mesa: la cuerda une ambos hooks, el bloque descansa en la mesa y el mount llega al eje", () => {
  const geometry = layout("table-hanging", initialPositions["table-hanging"]);
  const item = geometry.ropes[0];
  samePoint(item.points[0], geometry.blocks.m1.hooks.right);
  samePoint(item.points.at(-1), geometry.blocks.m2.hooks.top);
  close(item.segments[0].points[0].y, item.segments[0].points[1].y);
  close(geometry.blocks.m1.bottom, geometry.table.y);
  samePoint(geometry.connectors.find(({ id }) => id === "table-pulley-mount").points.at(-1), geometry.pulleys[0].axle);
  const contact = layout("table-hanging", { m1: 10, m2: 10 });
  close(getPolylineLength(item.points), getPolylineLength(contact.ropes[0].points));
  close(contact.table.edgeX - contact.blocks.m1.hooks.right.x, 8);
});

test("Atwood: una sola cuerda une las masas y conserva longitud en ambos sentidos", () => {
  const initial = layout("atwood", initialPositions.atwood);
  const positive = layout("atwood", { m1: -8, m2: 8 });
  const negative = layout("atwood", { m1: 8, m2: -8 });
  samePoint(initial.ropes[0].points[0], initial.blocks.m1.hooks.top);
  samePoint(initial.ropes[0].points.at(-1), initial.blocks.m2.hooks.top);
  close(getPolylineLength(initial.ropes[0].points), getPolylineLength(positive.ropes[0].points));
  close(getPolylineLength(initial.ropes[0].points), getPolylineLength(negative.ropes[0].points));
  samePoint(initial.connectors[0].points.at(-1), initial.pulleys[0].axle);
});

test("polea móvil: anclaje, yoke y hanger forman el conjunto 2:1 continuo", () => {
  const initial = layout("movable-pulley", initialPositions["movable-pulley"]);
  const moved = layout("movable-pulley", { mL: 2, mC: -4 });
  samePoint(initial.ropes[0].points[0], initial.anchors[0]);
  samePoint(initial.ropes[0].points.at(-1), initial.blocks.mC.hooks.top);
  const hanger = initial.connectors.find(({ id }) => id === "load-hanger");
  const leftYoke = initial.connectors.find(({ id }) => id === "mobile-yoke-left");
  const rightYoke = initial.connectors.find(({ id }) => id === "mobile-yoke-right");
  samePoint(hanger.points.at(-1), initial.blocks.mL.hooks.top);
  samePoint(leftYoke.points.at(-1), hanger.points[0]);
  samePoint(rightYoke.points.at(-1), hanger.points[0]);
  close(getPolylineLength(initial.ropes[0].points), getPolylineLength(moved.ropes[0].points));
  close(moved.blocks.mL.y - initial.blocks.mL.y, 2 * initial.scale);
  close(moved.blocks.mC.y - initial.blocks.mC.y, -4 * initial.scale);
});

test("sistema 3:1: una misma cuerda enlaza anclaje móvil, tres poleas y contrapeso", () => {
  const initial = layout("three-pulley-tackle", initialPositions["three-pulley-tackle"]);
  const moved = layout("three-pulley-tackle", { mL: 2, mC: -6 });
  assert.equal(initial.pulleys.length, 3);
  samePoint(initial.ropes[0].points[0], initial.anchors[0]);
  samePoint(initial.ropes[0].points.at(-1), initial.blocks.mC.hooks.top);
  samePoint(initial.connectors.find(({ id }) => id === "load-hanger").points.at(-1), initial.blocks.mL.hooks.top);
  samePoint(initial.connectors.find(({ id }) => id === "moving-anchor-hanger").points[0], initial.anchors[0]);
  close(getPolylineLength(initial.ropes[0].points), getPolylineLength(moved.ropes[0].points), 1e-6);
});

test("Atwood doble separa las cuerdas T_C y T_A y suspende la polea móvil con hardware", () => {
  const initial = layout("double-atwood", initialPositions["double-atwood"]);
  const moved = layout("double-atwood", movedPositions["double-atwood"]);
  const upper = initial.ropes.find(({ id }) => id === "rope-c");
  const lower = initial.ropes.find(({ id }) => id === "rope-a");
  assert.equal(upper.tensionLabel, "T_C");
  assert.equal(lower.tensionLabel, "T_A");
  assert.notEqual(upper.style, lower.style);
  samePoint(upper.points[0], initial.blocks.m3.hooks.top);
  samePoint(lower.points[0], initial.blocks.m1.hooks.top);
  samePoint(lower.points.at(-1), initial.blocks.m2.hooks.top);
  const liftingFrame = initial.connectors.find(({ id }) => id === "upper-lifting-frame");
  samePoint(upper.points.at(-1), initial.anchors.find(({ id }) => id === "upper-moving-hook"));
  samePoint(upper.points.at(-1), liftingFrame.points[0]);
  samePoint(liftingFrame.points.at(-1), initial.pulleys.find(({ id }) => id === "mobile").axle);
  close(getPolylineLength(upper.points), getPolylineLength(moved.ropes.find(({ id }) => id === "rope-c").points));
  close(getPolylineLength(lower.points), getPolylineLength(moved.ropes.find(({ id }) => id === "rope-a").points));
});

test("las fases de rueda son deterministas, reversibles, reiniciables e invariantes al resize", () => {
  const expected = {
    "table-hanging": { fixed: 1 / .55 },
    atwood: { fixed: 1 / .6 },
    "movable-pulley": { mobile: 1 / .55, fixed: -2 / .55 },
    "three-pulley-tackle": { "fixed-a": -1 / .48, mobile: 2 / .48, "fixed-b": -3 / .48 },
    "double-atwood": { fixed: .25 / .55, mobile: -.75 / .7 },
  };
  for (const [scenarioId, positions] of Object.entries(movedPositions)) {
    const initial = layout(scenarioId, initialPositions[scenarioId]);
    const moved = layout(scenarioId, positions);
    const opposite = layout(scenarioId, Object.fromEntries(Object.entries(positions).map(([key, value]) => [key, -value])));
    const compact = layout(scenarioId, positions, viewports[0]);
    initial.pulleys.forEach((wheel) => close(wheel.rotationPhase, 0));
    moved.pulleys.forEach((wheel) => {
      assert.notEqual(wheel.rotationPhase, 0, `${scenarioId}:${wheel.id}`);
      close(wheel.rotationPhase, expected[scenarioId][wheel.id]);
      close(opposite.pulleys.find(({ id }) => id === wheel.id).rotationPhase, -wheel.rotationPhase);
      close(compact.pulleys.find(({ id }) => id === wheel.id).rotationPhase, wheel.rotationPhase);
    });
    assert.deepEqual(layout(scenarioId, initialPositions[scenarioId]).pulleys.map(({ rotationPhase }) => rotationPhase), initial.pulleys.map(({ rotationPhase }) => rotationPhase));
  }
});
