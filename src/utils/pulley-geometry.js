import { PULLEY_TERMINAL_GEOMETRY } from "./pulley-systems.js";

// El aparato se define en coordenadas puras. El modelo aporta desplazamientos
// en metros; el viewport decide la escala y nunca modifica límites físicos.
const point = (x, y) => Object.freeze({ x, y });
const path = (id, points, type = "hardware") => Object.freeze({ id, type, points: Object.freeze(points) });
const lineSegment = (id, start, end) => Object.freeze({ id, kind: "line", points: Object.freeze([start, end]) });
const sampleArc = ({ x, y, radius, start, end, samples = 24 }) => Object.freeze(
  Array.from({ length: samples + 1 }, (_, index) => {
    const angle = start + (end - start) * index / samples;
    return point(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
  })
);
const arcSegment = (id, wheel, start, end) => Object.freeze({
  id,
  kind: "arc",
  pulleyId: wheel.id,
  center: point(wheel.x, wheel.y),
  radius: wheel.radius,
  points: sampleArc({ ...wheel, start, end }),
});
const joinSegments = (segments) => Object.freeze(segments.flatMap(
  (segment, index) => index === 0 ? segment.points : segment.points.slice(1)
));
const rope = (id, segments, { tensionLabel = null, style = "primary", labelPoint = null } = {}) => Object.freeze({
  id,
  style,
  tensionLabel,
  labelPoint,
  segments: Object.freeze(segments),
  points: joinSegments(segments),
});
const beam = (id, x, y, width) => Object.freeze({ id, type: "beam", x, y, width });

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

// rotationPhase is presentation-only. The ideal model has no pulley radius,
// inertia, torque, or angular state, so a fixed visual radius in metres keeps
// phase deterministic across resize while preserving the direction of rope travel.
const pulley = (id, x, y, radius, {
  mobile = false,
  ropeTravel = 0,
  visualRadiusMetres = .55,
} = {}) => Object.freeze({
  id,
  x,
  y,
  radius,
  mobile,
  axle: point(x, y),
  rotationPhase: ropeTravel / visualRadiusMetres,
  visualRadiusMetres,
});

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
  terminalSurfaces: PULLEY_TERMINAL_GEOMETRY[scene.scenarioId],
});

export const createPulleySceneGeometry = ({ scenarioId, width, height, positions, compact = width < 620 }) => {
  if (![width, height, ...Object.values(positions)].every(Number.isFinite)) {
    throw new TypeError("La geometría de poleas requiere dimensiones y posiciones finitas.");
  }

  if (scenarioId === "table-hanging") {
    const radius = compact ? 23 : 28;
    const blockWidth = compact ? 54 : 70;
    const blockHeight = compact ? 50 : 58;
    const tableY = height * (compact ? .52 : .5);
    const ropeY = tableY - blockHeight / 2;
    const wheelX = width - (compact ? 61 : 84);
    const edgeX = wheelX - radius - (compact ? 12 : 16);
    const tableX = compact ? 20 : 30;
    const hangingHook0 = ropeY + 2 * radius + (compact ? 26 : 32);
    const horizontalScale = (edgeX - tableX - blockWidth - 10) / 10;
    const verticalScale = (height - 20 - blockHeight - hangingHook0) / 10;
    const scale = Math.min(compact ? 20 : 30, horizontalScale, verticalScale);
    const wheel = pulley("fixed", wheelX, ropeY + radius, radius, { ropeTravel: positions.m1 });
    const topTangent = point(wheel.x, wheel.y - radius);
    const rightTangent = point(wheel.x + radius, wheel.y);
    const m1HookX = edgeX - 8 - (10 - positions.m1) * scale;
    const m1 = block("m1", m1HookX - blockWidth / 2, tableY - blockHeight / 2, blockWidth, blockHeight);
    const m2Hook = point(rightTangent.x, hangingHook0 + positions.m2 * scale);
    const m2 = block("m2", m2Hook.x, m2Hook.y + blockHeight / 2, compact ? 54 : 62, blockHeight);
    const tableBracketY = tableY + (compact ? 14 : 17);
    return freezeScene({
      scenarioId,
      scale,
      ropes: [rope("rope-t", [
        lineSegment("m1-to-fixed", m1.hooks.right, topTangent),
        arcSegment("fixed-wrap", wheel, -Math.PI / 2, 0),
        lineSegment("fixed-to-m2", rightTangent, m2.hooks.top),
      ])],
      pulleys: [wheel],
      blocks: { m1, m2 },
      table: Object.freeze({ x: tableX, edgeX, y: tableY, thickness: compact ? 9 : 11, legX: edgeX - 12 }),
      supports: [],
      anchors: [],
      connectors: [path("table-pulley-mount", [
        point(edgeX - 3, tableBracketY), point(wheel.x, tableBracketY), wheel.axle,
      ], "mount")],
    });
  }

  if (scenarioId === "atwood") {
    const radius = compact ? 31 : 37;
    const blockWidth = compact ? 52 : 62;
    const blockHeight = compact ? 50 : 58;
    const beamY = compact ? 38 : 42;
    const wheel = pulley("fixed", width * .5, compact ? 96 : 112, radius, { ropeTravel: positions.m2, visualRadiusMetres: .6 });
    const topContact = wheel.y + radius + (compact ? 14 : 18);
    const bottomHook = height - 20 - blockHeight;
    const scale = (bottomHook - topContact) / 18;
    const hook0 = topContact + 9 * scale;
    const leftTangent = point(wheel.x - radius, wheel.y);
    const rightTangent = point(wheel.x + radius, wheel.y);
    const m1Hook = point(leftTangent.x, hook0 + positions.m1 * scale);
    const m2Hook = point(rightTangent.x, hook0 + positions.m2 * scale);
    const m1 = block("m1", m1Hook.x, m1Hook.y + blockHeight / 2, blockWidth, blockHeight);
    const m2 = block("m2", m2Hook.x, m2Hook.y + blockHeight / 2, blockWidth, blockHeight);
    return freezeScene({
      scenarioId,
      scale,
      ropes: [rope("rope-t", [
        lineSegment("m1-to-fixed", m1.hooks.top, leftTangent),
        arcSegment("fixed-wrap", wheel, Math.PI, 2 * Math.PI),
        lineSegment("fixed-to-m2", rightTangent, m2.hooks.top),
      ])],
      pulleys: [wheel],
      blocks: { m1, m2 },
      supports: [beam("ceiling-beam", wheel.x, beamY, compact ? 104 : 126)],
      anchors: [],
      connectors: [path("fixed-axle-hanger", [point(wheel.x, beamY + 5), wheel.axle], "axle")],
    });
  }

  if (scenarioId === "movable-pulley") {
    const radius = compact ? 29 : 36;
    const blockHeight = compact ? 50 : 58;
    const beamY = compact ? 36 : 40;
    const fixedX = width * (compact ? .64 : .62);
    const fixedY = compact ? 98 : 116;
    const topContact = fixedY + radius + (compact ? 14 : 18);
    const counterScale = (height - 20 - blockHeight - topContact) / 14.5;
    const loadConstant = fixedY + 3 * radius + 20 + 14 + (compact ? 22 : 28) + blockHeight;
    const loadScale = (height - 20 - loadConstant) / 8.4;
    const scale = Math.min(compact ? 18 : 24, counterScale, loadScale);
    const fixed = pulley("fixed", fixedX, fixedY, radius, { ropeTravel: positions.mC });
    const mobileX = fixed.x - 2 * radius;
    const mobileY0 = fixed.y + 2 * radius + 20 + 3.2 * scale;
    const mobile = pulley("mobile", mobileX, mobileY0 + positions.mL * scale, radius, {
      mobile: true,
      ropeTravel: positions.mL,
    });
    const fixedLeft = point(fixed.x - radius, fixed.y);
    const fixedRight = point(fixed.x + radius, fixed.y);
    const mobileLeft = point(mobile.x - radius, mobile.y);
    const mobileRight = point(mobile.x + radius, mobile.y);
    const anchor = point(mobileLeft.x, beamY + 5);
    const mCHook = point(fixedRight.x, topContact + (9 + positions.mC) * scale);
    const mC = block("mC", mCHook.x, mCHook.y + blockHeight / 2, compact ? 52 : 60, blockHeight);
    const yokeBottom = point(mobile.x, mobile.y + radius + 14);
    const loadHook = point(mobile.x, yokeBottom.y + (compact ? 22 : 28));
    const mL = block("mL", loadHook.x, loadHook.y + blockHeight / 2, compact ? 66 : 78, blockHeight);
    return freezeScene({
      scenarioId,
      scale,
      ropes: [rope("rope-t", [
        lineSegment("anchor-to-mobile", anchor, mobileLeft),
        arcSegment("mobile-wrap", mobile, Math.PI, 0),
        lineSegment("mobile-to-fixed", mobileRight, fixedLeft),
        arcSegment("fixed-wrap", fixed, Math.PI, 2 * Math.PI),
        lineSegment("fixed-to-counterweight", fixedRight, mC.hooks.top),
      ])],
      pulleys: [mobile, fixed],
      blocks: { mL, mC },
      supports: [beam("ceiling-beam", (anchor.x + fixed.x) / 2, beamY, fixed.x - anchor.x + (compact ? 72 : 92))],
      anchors: [Object.freeze({ id: "fixed-rope-anchor", type: "fixed", ...anchor })],
      connectors: [
        path("fixed-axle-hanger", [point(fixed.x, beamY + 5), fixed.axle], "axle"),
        path("mobile-yoke-left", [point(mobile.x - radius * .58, mobile.y), point(mobile.x - radius * .58, yokeBottom.y), yokeBottom], "yoke"),
        path("mobile-yoke-right", [point(mobile.x + radius * .58, mobile.y), point(mobile.x + radius * .58, yokeBottom.y), yokeBottom], "yoke"),
        path("load-hanger", [yokeBottom, mL.hooks.top], "hanger"),
      ],
    });
  }

  if (scenarioId === "three-pulley-tackle") {
    const radius = compact ? 23 : 29;
    const blockHeight = compact ? 48 : 56;
    const beamY = compact ? 34 : 40;
    const fixedY = compact ? 92 : 112;
    const mobileX = width * (compact ? .48 : .5);
    const topContact = fixedY + radius + (compact ? 14 : 18);
    const counterScale = (height - 20 - blockHeight - topContact) / 36;
    const scale = Math.min(compact ? 9 : 12, counterScale);
    const fixedA = pulley("fixed-a", mobileX - 2 * radius, fixedY, radius, {
      ropeTravel: -positions.mL,
      visualRadiusMetres: .48,
    });
    const fixedB = pulley("fixed-b", mobileX + 2 * radius, fixedY, radius, {
      ropeTravel: positions.mC,
      visualRadiusMetres: .48,
    });
    const mobileY0 = fixedY + 2 * radius + (compact ? 16 : 20) + 3 * scale;
    const mobile = pulley("mobile", mobileX, mobileY0 + positions.mL * scale, radius, {
      mobile: true,
      ropeTravel: 2 * positions.mL,
      visualRadiusMetres: .48,
    });
    const aLeft = point(fixedA.x - radius, fixedA.y);
    const aRight = point(fixedA.x + radius, fixedA.y);
    const bLeft = point(fixedB.x - radius, fixedB.y);
    const bRight = point(fixedB.x + radius, fixedB.y);
    const mobileLeft = point(mobile.x - radius, mobile.y);
    const mobileRight = point(mobile.x + radius, mobile.y);
    const carriageY = mobile.y + radius + 14;
    const movingAnchor = point(aLeft.x, carriageY);
    const carriageHub = point(mobile.x, carriageY);
    const mCHook = point(bRight.x, topContact + (27 + positions.mC) * scale);
    const mC = block("mC", mCHook.x, mCHook.y + blockHeight / 2, compact ? 50 : 58, blockHeight);
    const loadHook = point(mobile.x, carriageHub.y + (compact ? 22 : 28));
    const mL = block("mL", loadHook.x, loadHook.y + blockHeight / 2, compact ? 66 : 78, blockHeight);
    return freezeScene({
      scenarioId,
      scale,
      ropes: [rope("rope-t", [
        lineSegment("moving-anchor-to-fixed-a", movingAnchor, aLeft),
        arcSegment("fixed-a-wrap", fixedA, Math.PI, 2 * Math.PI),
        lineSegment("fixed-a-to-mobile", aRight, mobileLeft),
        arcSegment("mobile-wrap", mobile, Math.PI, 0),
        lineSegment("mobile-to-fixed-b", mobileRight, bLeft),
        arcSegment("fixed-b-wrap", fixedB, Math.PI, 2 * Math.PI),
        lineSegment("fixed-b-to-counterweight", bRight, mC.hooks.top),
      ])],
      pulleys: [fixedA, mobile, fixedB],
      blocks: { mL, mC },
      supports: [
        beam("fixed-mount-a", fixedA.x, beamY, compact ? 58 : 72),
        beam("fixed-mount-b", fixedB.x, beamY, compact ? 58 : 72),
      ],
      anchors: [Object.freeze({ id: "moving-rope-anchor", type: "moving", ...movingAnchor })],
      connectors: [
        path("fixed-axle-a", [point(fixedA.x, beamY + 5), fixedA.axle], "axle"),
        path("fixed-axle-b", [point(fixedB.x, beamY + 5), fixedB.axle], "axle"),
        path("moving-carriage", [movingAnchor, carriageHub, mobile.axle], "carriage"),
        path("load-hanger", [carriageHub, mL.hooks.top], "hanger"),
      ],
    });
  }

  if (scenarioId === "double-atwood") {
    const fixedRadius = compact ? 39 : 46;
    const mobileRadius = compact ? 29 : 34;
    const blockHeight = compact ? 48 : 56;
    const beamY = compact ? 34 : 40;
    const fixedY = compact ? 100 : 116;
    const fixedX = width * (compact ? .34 : .38);
    const mobileX = fixedX + fixedRadius;
    const topContact = fixedY + fixedRadius + (compact ? 12 : 16);
    const bottomConstant = fixedY + fixedRadius + 2 * mobileRadius + (compact ? 40 : 52) + blockHeight;
    const scale = Math.min(compact ? 8 : 11.5, (height - 20 - bottomConstant) / 25);
    const fixed = pulley("fixed", fixedX, fixedY, fixedRadius, {
      ropeTravel: -positions.m3,
      visualRadiusMetres: .55,
    });
    const mobileY0 = topContact + mobileRadius + (compact ? 16 : 20) + 3.5 * scale;
    const mobile = pulley("mobile", mobileX, mobileY0 + positions.pulley * scale, mobileRadius, {
      mobile: true,
      ropeTravel: positions.pulley - positions.m1,
      visualRadiusMetres: .7,
    });
    const fixedLeft = point(fixed.x - fixedRadius, fixed.y);
    const fixedRight = point(fixed.x + fixedRadius, fixed.y);
    const mobileLeft = point(mobile.x - mobileRadius, mobile.y);
    const mobileRight = point(mobile.x + mobileRadius, mobile.y);
    const m3Hook = point(fixedLeft.x, topContact + (9 + positions.m3) * scale);
    const relative1 = positions.m1 - positions.pulley;
    const relative2 = positions.m2 - positions.pulley;
    const lowerContact = mobile.y + mobileRadius + (compact ? 12 : 16);
    const m1Hook = point(mobileLeft.x, lowerContact + (8 + relative1) * scale);
    const m2Hook = point(mobileRight.x, lowerContact + (8 + relative2) * scale);
    const m1 = block("m1", m1Hook.x, m1Hook.y + blockHeight / 2, compact ? 48 : 56, blockHeight);
    const m2 = block("m2", m2Hook.x, m2Hook.y + blockHeight / 2, compact ? 48 : 56, blockHeight);
    const m3 = block("m3", m3Hook.x, m3Hook.y + blockHeight / 2, compact ? 48 : 56, blockHeight);
    const upperHook = point(mobile.x, mobile.y - mobileRadius - (compact ? 10 : 12));
    return freezeScene({
      scenarioId,
      scale,
      ropes: [
        rope("rope-c", [
          lineSegment("m3-to-fixed", m3.hooks.top, fixedLeft),
          arcSegment("fixed-wrap", fixed, Math.PI, 2 * Math.PI),
          lineSegment("fixed-to-moving-hook", fixedRight, upperHook),
        ], {
          tensionLabel: "T_C",
          style: "secondary",
          labelPoint: point(fixedRight.x + (compact ? 14 : 18), (fixedRight.y + upperHook.y) / 2),
        }),
        rope("rope-a", [
          lineSegment("m1-to-mobile", m1.hooks.top, mobileLeft),
          arcSegment("mobile-wrap", mobile, Math.PI, 2 * Math.PI),
          lineSegment("mobile-to-m2", mobileRight, m2.hooks.top),
        ], {
          tensionLabel: "T_A",
          style: "primary",
          labelPoint: point(mobileRight.x + (compact ? 14 : 18), mobile.y + mobileRadius + (compact ? 24 : 30)),
        }),
      ],
      pulleys: [fixed, mobile],
      blocks: { m1, m2, m3 },
      supports: [beam("upper-fixed-mount", fixed.x, beamY, compact ? 104 : 132)],
      anchors: [Object.freeze({ id: "upper-moving-hook", type: "moving", ...upperHook })],
      connectors: [
        path("fixed-axle-hanger", [point(fixed.x, beamY + 5), fixed.axle], "axle"),
        path("upper-pulley-hanger", [upperHook, mobile.axle], "lifting-hanger"),
      ],
    });
  }

  throw new RangeError(`Escenario de poleas desconocido: ${scenarioId}.`);
};
