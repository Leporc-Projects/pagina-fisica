import { PULLEY_TERMINAL_GEOMETRY } from "./pulley-systems.js";

// El aparato se define en coordenadas puras. El modelo aporta q en metros;
// cada viewport elige una escala, nunca un límite físico.
const point = (x, y) => Object.freeze({ x, y });
const path = (id, points, type = "connector") => Object.freeze({ id, type, points: Object.freeze(points) });
const sampleArc = ({ x, y, radius, start, end, samples = 20 }) => Object.freeze(
  Array.from({ length: samples + 1 }, (_, index) => {
    const angle = start + (end - start) * index / samples;
    return point(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
  })
);
const join = (...parts) => Object.freeze(parts.flatMap((part, index) => index === 0 ? part : part.slice(1)));

export const getBlockAttachmentPoint = (body, face) => {
  if (!body || ![body.left, body.right, body.top, body.bottom].every(Number.isFinite)) {
    throw new TypeError("El bloque requiere límites finitos para ubicar su anclaje.");
  }
  const centerX = (body.left + body.right) / 2;
  const centerY = (body.top + body.bottom) / 2;
  const attachments = {
    top: point(centerX, body.top),
    right: point(body.right, centerY),
    bottom: point(centerX, body.bottom),
    left: point(body.left, centerY),
  };
  if (!Object.hasOwn(attachments, face)) {
    throw new RangeError(`Cara de anclaje desconocida: ${String(face)}.`);
  }
  return attachments[face];
};

const block = (id, x, y, width, height) => {
  const body = {
    id, x, y, width, height,
    left: x - width / 2, right: x + width / 2,
    top: y - height / 2, bottom: y + height / 2,
  };
  return Object.freeze({
    ...body,
    hooks: Object.freeze({
      top: getBlockAttachmentPoint(body, "top"),
      right: getBlockAttachmentPoint(body, "right"),
      bottom: getBlockAttachmentPoint(body, "bottom"),
      left: getBlockAttachmentPoint(body, "left"),
    }),
  });
};
const pulley = (id, x, y, radius, mobile = false) => Object.freeze({ id, x, y, radius, mobile, axle: point(x, y) });

export const getPolylineLength = (points) => points.slice(1).reduce(
  (length, current, index) => length + Math.hypot(current.x - points[index].x, current.y - points[index].y), 0
);

const freezeScene = (scene) => Object.freeze({
  ...scene,
  ropes: Object.freeze(scene.ropes),
  pulleys: Object.freeze(scene.pulleys),
  blocks: Object.freeze(scene.blocks),
  supports: Object.freeze(scene.supports),
  anchors: Object.freeze(scene.anchors),
  connectors: Object.freeze(scene.connectors),
  stops: Object.freeze(scene.stops),
  terminalSurfaces: PULLEY_TERMINAL_GEOMETRY[scene.scenarioId],
});

export const createPulleySceneGeometry = ({ scenarioId, width, height, positions, compact = width < 620 }) => {
  if (![width, height, ...Object.values(positions)].every(Number.isFinite)) {
    throw new TypeError("La geometría de poleas requiere dimensiones y posiciones finitas.");
  }

  if (scenarioId === "table-hanging") {
    const radius = compact ? 22 : 26;
    const blockWidth = compact ? 54 : 68;
    const blockHeight = compact ? 50 : 56;
    const tableY = height * (compact ? .54 : .52);
    const ropeY = tableY - blockHeight / 2;
    const wheel = pulley("fixed", width - (compact ? 60 : 78), ropeY + radius, radius);
    const topTangent = point(wheel.x, wheel.y - radius);
    const rightTangent = point(wheel.x + radius, wheel.y);
    const edgeX = wheel.x - radius - 10;
    const hangingHook0 = wheel.y + radius + (compact ? 20 : 24);
    const horizontalRoom = edgeX - 6 - blockWidth / 2 - (compact ? 28 : 44);
    const verticalRoom = height - 18 - blockHeight - hangingHook0;
    const scale = Math.min(compact ? 18 : 26, horizontalRoom / 10, verticalRoom / 10);
    const m1HookX = edgeX - 6 - (10 - positions.m1) * scale;
    const m1 = block("m1", m1HookX - blockWidth / 2, tableY - blockHeight / 2, blockWidth, blockHeight);
    const m2Hook = point(rightTangent.x, hangingHook0 + positions.m2 * scale);
    const m2 = block("m2", m2Hook.x, m2Hook.y + blockHeight / 2, compact ? 54 : 62, blockHeight);
    return freezeScene({
      scenarioId, scale,
      ropes: [join([m1.hooks.right, topTangent], sampleArc({ ...wheel, radius, start: -Math.PI / 2, end: 0 }), [rightTangent, m2.hooks.top])],
      pulleys: [wheel], blocks: { m1, m2 },
      table: Object.freeze({ x: compact ? 22 : 34, edgeX, y: tableY, legX: edgeX - 3 }),
      supports: [Object.freeze({ id: "edge-bracket", type: "bracket", points: Object.freeze([
        point(edgeX - 8, tableY + 5), point(edgeX + 8, tableY + 18), wheel.axle,
      ]) })],
      anchors: [], connectors: [],
      stops: [Object.freeze({ id: "m2-lower-stop", x: m2Hook.x, y: hangingHook0 + 11 * scale + blockHeight })],
    });
  }

  if (scenarioId === "atwood") {
    const radius = compact ? 30 : 34;
    const blockWidth = compact ? 52 : 62;
    const blockHeight = compact ? 50 : 56;
    const wheel = pulley("fixed", width * .5, compact ? 82 : 96, radius);
    const topContact = wheel.y + radius + 12;
    const bottomHook = height - 18 - blockHeight;
    const scale = (bottomHook - topContact) / 19;
    const hook0 = topContact + 9 * scale;
    const leftTangent = point(wheel.x - radius, wheel.y);
    const rightTangent = point(wheel.x + radius, wheel.y);
    const m1Hook = point(leftTangent.x, hook0 + positions.m1 * scale);
    const m2Hook = point(rightTangent.x, hook0 + positions.m2 * scale);
    const m1 = block("m1", m1Hook.x, m1Hook.y + blockHeight / 2, blockWidth, blockHeight);
    const m2 = block("m2", m2Hook.x, m2Hook.y + blockHeight / 2, blockWidth, blockHeight);
    return freezeScene({
      scenarioId, scale,
      ropes: [join([m1.hooks.top, leftTangent], sampleArc({ ...wheel, radius, start: Math.PI, end: 2 * Math.PI }), [rightTangent, m2.hooks.top])],
      pulleys: [wheel], blocks: { m1, m2 },
      supports: [Object.freeze({ id: "ceiling", type: "ceiling", x: wheel.x, y: 34, width: compact ? 66 : 78 })],
      anchors: [], connectors: [path("fixed-axle", [point(wheel.x, 34), wheel.axle], "axle")],
      stops: [
        Object.freeze({ id: "m1-lower-stop", x: m1Hook.x, y: bottomHook + blockHeight }),
        Object.freeze({ id: "m2-lower-stop", x: m2Hook.x, y: bottomHook + blockHeight }),
      ],
    });
  }

  if (scenarioId === "movable-pulley") {
    const radius = compact ? 28 : 34;
    const blockHeight = compact ? 50 : 56;
    const fixed = pulley("fixed", width * (compact ? .62 : .58), compact ? 80 : 94, radius);
    const mobileX = fixed.x - 2 * radius;
    const topContact = fixed.y + radius + 12;
    const bottomHook = height - 18 - blockHeight;
    const scale = (bottomHook - topContact) / 14.5;
    const mobileY0 = height - 18 - blockHeight - radius - 26 - 4.5 * scale;
    const mobile = pulley("mobile", mobileX, mobileY0 + positions.mL * scale, radius, true);
    const fixedLeft = point(fixed.x - radius, fixed.y);
    const fixedRight = point(fixed.x + radius, fixed.y);
    const mobileLeft = point(mobile.x - radius, mobile.y);
    const mobileRight = point(mobile.x + radius, mobile.y);
    const anchor = point(mobileLeft.x, compact ? 34 : 38);
    const mCHook = point(fixedRight.x, topContact + (9 + positions.mC) * scale);
    const mC = block("mC", mCHook.x, mCHook.y + blockHeight / 2, compact ? 52 : 60, blockHeight);
    const loadHook = point(mobile.x, mobile.y + radius + 26);
    const mL = block("mL", loadHook.x, loadHook.y + blockHeight / 2, compact ? 66 : 76, blockHeight);
    const yokeBottom = point(mobile.x, mobile.y + radius + 12);
    return freezeScene({
      scenarioId, scale,
      ropes: [join([anchor, mobileLeft], sampleArc({ ...mobile, radius, start: Math.PI, end: 0 }), [mobileRight, fixedLeft], sampleArc({ ...fixed, radius, start: Math.PI, end: 2 * Math.PI }), [fixedRight, mC.hooks.top])],
      pulleys: [mobile, fixed], blocks: { mL, mC },
      supports: [Object.freeze({ id: "fixed-ceiling", type: "ceiling", x: fixed.x, y: 34, width: compact ? 64 : 76 })],
      anchors: [Object.freeze({ id: "fixed-rope-anchor", type: "rope", ...anchor })],
      connectors: [
        path("fixed-axle", [point(fixed.x, 34), fixed.axle], "axle"),
        path("mobile-yoke-left", [point(mobile.x - radius * .58, mobile.y), point(mobile.x - radius * .58, yokeBottom.y), yokeBottom], "yoke"),
        path("mobile-yoke-right", [point(mobile.x + radius * .58, mobile.y), point(mobile.x + radius * .58, yokeBottom.y), yokeBottom], "yoke"),
        path("load-hanger", [yokeBottom, mL.hooks.top], "hanger"),
      ],
      stops: [Object.freeze({ id: "mC-lower-stop", x: mC.x, y: bottomHook + blockHeight })],
    });
  }

  if (scenarioId === "three-pulley-tackle") {
    const radius = compact ? 22 : 27;
    const blockHeight = compact ? 48 : 54;
    const fixedY = compact ? 76 : 90;
    const mobileX = width * .52;
    const fixedA = pulley("fixed-a", mobileX - 2 * radius, fixedY, radius);
    const fixedB = pulley("fixed-b", mobileX + 2 * radius, fixedY, radius);
    const scale = compact ? 6 : 7.4;
    const mobileY0 = compact ? 260 : 320;
    const mobile = pulley("mobile", mobileX, mobileY0 + positions.mL * scale, radius, true);
    const aLeft = point(fixedA.x - radius, fixedA.y);
    const aRight = point(fixedA.x + radius, fixedA.y);
    const bLeft = point(fixedB.x - radius, fixedB.y);
    const bRight = point(fixedB.x + radius, fixedB.y);
    const mobileLeft = point(mobile.x - radius, mobile.y);
    const mobileRight = point(mobile.x + radius, mobile.y);
    const movingAnchor = point(aLeft.x, mobile.y + radius * .25);
    const counterHook0 = fixedB.y + radius + (compact ? 32 : 38);
    const mCHook = point(bRight.x, counterHook0 + positions.mC * scale);
    const mC = block("mC", mCHook.x, mCHook.y + blockHeight / 2, compact ? 50 : 58, blockHeight);
    const yokeBottom = point(mobile.x, mobile.y + radius + 12);
    const loadHook = point(mobile.x, yokeBottom.y + (compact ? 20 : 24));
    const mL = block("mL", loadHook.x, loadHook.y + blockHeight / 2, compact ? 64 : 74, blockHeight);
    return freezeScene({
      scenarioId, scale,
      ropes: [join(
        [movingAnchor, aLeft],
        sampleArc({ ...fixedA, radius, start: Math.PI, end: 2 * Math.PI }),
        [aRight, mobileLeft],
        sampleArc({ ...mobile, radius, start: Math.PI, end: 0 }),
        [mobileRight, bLeft],
        sampleArc({ ...fixedB, radius, start: Math.PI, end: 2 * Math.PI }),
        [bRight, mC.hooks.top]
      )],
      pulleys: [fixedA, mobile, fixedB],
      blocks: { mL, mC },
      supports: [
        Object.freeze({ id: "ceiling-a", type: "ceiling", x: fixedA.x, y: compact ? 30 : 34, width: compact ? 58 : 70 }),
        Object.freeze({ id: "ceiling-b", type: "ceiling", x: fixedB.x, y: compact ? 30 : 34, width: compact ? 58 : 70 }),
      ],
      anchors: [Object.freeze({ id: "moving-rope-anchor", type: "rope", ...movingAnchor })],
      connectors: [
        path("fixed-axle-a", [point(fixedA.x, compact ? 30 : 34), fixedA.axle], "axle"),
        path("fixed-axle-b", [point(fixedB.x, compact ? 30 : 34), fixedB.axle], "axle"),
        path("mobile-yoke-left", [point(mobile.x - radius * .58, mobile.y), point(mobile.x - radius * .58, yokeBottom.y), yokeBottom], "yoke"),
        path("mobile-yoke-right", [point(mobile.x + radius * .58, mobile.y), point(mobile.x + radius * .58, yokeBottom.y), yokeBottom], "yoke"),
        path("moving-anchor-hanger", [movingAnchor, point(movingAnchor.x, yokeBottom.y), yokeBottom], "hanger"),
        path("load-hanger", [yokeBottom, mL.hooks.top], "hanger"),
      ],
      stops: [
        Object.freeze({ id: "mC-lower-stop", x: mC.x, y: counterHook0 + 9 * scale + blockHeight }),
        Object.freeze({ id: "mL-lower-stop", x: mL.x, y: mobileY0 + 9 * scale + radius + 12 + (compact ? 20 : 24) + blockHeight }),
      ],
    });
  }

  if (scenarioId === "double-atwood") {
    const fixedRadius = compact ? 26 : 30;
    const mobileRadius = compact ? 34 : 42;
    const blockHeight = compact ? 48 : 54;
    const fixed = pulley("fixed", width * (compact ? .30 : .34), compact ? 78 : 92, fixedRadius);
    const scale = Math.min(
      compact ? 14 : 20,
      (height - 18 - blockHeight - 2 * mobileRadius - 26 - (fixed.y + fixedRadius + 28)) / 16.5
    );
    const mobileY0 = height - 18 - blockHeight - mobileRadius - 12 - 16.5 * scale;
    const mobile = pulley("mobile", width * (compact ? .57 : .58), mobileY0 + positions.pulley * scale, mobileRadius, true);
    const fixedLeft = point(fixed.x - fixedRadius, fixed.y);
    const fixedRight = point(fixed.x + fixedRadius, fixed.y);
    const mobileLeft = point(mobile.x - mobileRadius, mobile.y);
    const mobileRight = point(mobile.x + mobileRadius, mobile.y);
    const m3TopContact = fixed.y + fixedRadius + 10;
    const m3Hook = point(fixedLeft.x, m3TopContact + (9 + positions.m3) * scale);
    const relative1 = positions.m1 - positions.pulley;
    const relative2 = positions.m2 - positions.pulley;
    const lowerTopContact = mobile.y + mobileRadius + 12;
    const m1Hook = point(mobileLeft.x, lowerTopContact + (8 + relative1) * scale);
    const m2Hook = point(mobileRight.x, lowerTopContact + (8 + relative2) * scale);
    const m1 = block("m1", m1Hook.x, m1Hook.y + blockHeight / 2, compact ? 48 : 56, blockHeight);
    const m2 = block("m2", m2Hook.x, m2Hook.y + blockHeight / 2, compact ? 48 : 56, blockHeight);
    const m3 = block("m3", m3Hook.x, m3Hook.y + blockHeight / 2, compact ? 48 : 56, blockHeight);
    const upperHook = point(fixedRight.x, mobile.y - mobileRadius - 14);
    const yokeTop = point(mobile.x, upperHook.y);
    return freezeScene({
      scenarioId, scale,
      ropes: [
        join([m3.hooks.top, fixedLeft], sampleArc({ ...fixed, radius: fixedRadius, start: Math.PI, end: 2 * Math.PI }), [fixedRight, upperHook]),
        join([m1.hooks.top, mobileLeft], sampleArc({ ...mobile, radius: mobileRadius, start: Math.PI, end: 2 * Math.PI }), [mobileRight, m2.hooks.top]),
      ],
      pulleys: [fixed, mobile], blocks: { m1, m2, m3 },
      supports: [Object.freeze({ id: "fixed-ceiling", type: "ceiling", x: fixed.x, y: 32, width: compact ? 62 : 74 })],
      anchors: [],
      connectors: [
        path("fixed-axle", [point(fixed.x, 32), fixed.axle], "axle"),
        path("upper-hanger", [upperHook, point(upperHook.x, yokeTop.y), yokeTop, mobile.axle], "hanger"),
        path("mobile-yoke-left", [point(mobile.x - mobileRadius * .58, mobile.y), point(mobile.x - mobileRadius * .58, yokeTop.y), yokeTop], "yoke"),
        path("mobile-yoke-right", [point(mobile.x + mobileRadius * .58, mobile.y), point(mobile.x + mobileRadius * .58, yokeTop.y), yokeTop], "yoke"),
      ],
      stops: [
        Object.freeze({ id: "m3-lower-stop", x: m3.x, y: m3TopContact + 18.5 * scale + blockHeight }),
        Object.freeze({ id: "m1-lower-stop", x: m1.x, y: lowerTopContact + 16.5 * scale + blockHeight }),
        Object.freeze({ id: "m2-lower-stop", x: m2.x, y: lowerTopContact + 16.5 * scale + blockHeight }),
      ],
    });
  }

  throw new RangeError(`Escenario de poleas desconocido: ${scenarioId}.`);
};
