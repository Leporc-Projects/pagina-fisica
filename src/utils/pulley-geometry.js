// Geometría pura de las cuerdas del laboratorio. Las coordenadas generalizadas
// llegan ya calculadas por el modelo físico; este módulo solo las proyecta a
// tramos rectos y arcos tangentes que conservan las restricciones ideales.

const point = (x, y) => Object.freeze({ x, y });

const sampleArc = ({ x, y, radius, start, end, samples = 16 }) =>
  Object.freeze(Array.from({ length: samples + 1 }, (_, index) => {
    const angle = start + (end - start) * index / samples;
    return point(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
  }));

const join = (...parts) => Object.freeze(parts.flatMap((part, index) =>
  index === 0 ? part : part.slice(1)
));

export const getPolylineLength = (points) => points.slice(1).reduce(
  (length, current, index) => length + Math.hypot(
    current.x - points[index].x,
    current.y - points[index].y
  ),
  0
);

export const createPulleySceneGeometry = ({
  scenarioId,
  width,
  height,
  positions,
  scale,
  compact = width < 620,
}) => {
  if (![width, height, scale, ...Object.values(positions)].every(Number.isFinite)) {
    throw new TypeError("La geometría de poleas requiere dimensiones y posiciones finitas.");
  }

  if (scenarioId === "table-hanging") {
    const edgeX = width * .72;
    const tableY = height * .48;
    const radius = 28;
    const pulley = point(edgeX + 24, tableY - 22);
    const blockWidth = compact ? 64 : 72;
    const blockX = Math.min(pulley.x - (compact ? 44 : 52), width * (compact ? .28 : .34) + positions.m1 * scale);
    const hangingY = height * .58 + positions.m2 * scale;
    const blockAttachment = point(blockX + blockWidth / 2, pulley.y - radius);
    const topTangent = point(pulley.x, pulley.y - radius);
    const rightTangent = point(pulley.x + radius, pulley.y);
    const rope = join(
      [blockAttachment, topTangent],
      sampleArc({ ...pulley, radius, start: -Math.PI / 2, end: 0 }),
      [rightTangent, point(rightTangent.x, hangingY - 30)]
    );
    return Object.freeze({
      ropes: Object.freeze([rope]),
      pulleys: Object.freeze([{ ...pulley, radius }]),
      blocks: Object.freeze({
        m1: Object.freeze({ x: blockX, y: tableY - 25, width: blockWidth, height: 48 }),
        m2: Object.freeze({ x: rightTangent.x, y: hangingY, width: 62, height: 58 }),
      }),
      table: Object.freeze({ edgeX, y: tableY }),
      supports: Object.freeze([]),
    });
  }

  if (scenarioId === "atwood") {
    const radius = 30;
    const pulley = point(width * .5, 105);
    const leftY = height * .58 + positions.m1 * scale;
    const rightY = height * .58 + positions.m2 * scale;
    const leftTangent = point(pulley.x - radius, pulley.y);
    const rightTangent = point(pulley.x + radius, pulley.y);
    const rope = join(
      [point(leftTangent.x, leftY - 30), leftTangent],
      sampleArc({ ...pulley, radius, start: Math.PI, end: 2 * Math.PI }),
      [rightTangent, point(rightTangent.x, rightY - 30)]
    );
    return Object.freeze({
      ropes: Object.freeze([rope]),
      pulleys: Object.freeze([{ ...pulley, radius }]),
      blocks: Object.freeze({
        m1: Object.freeze({ x: leftTangent.x, y: leftY, width: 62, height: 58 }),
        m2: Object.freeze({ x: rightTangent.x, y: rightY, width: 62, height: 58 }),
      }),
      supports: Object.freeze([{ x: pulley.x, y: 38, pulleyTop: pulley.y - radius }]),
    });
  }

  if (scenarioId === "movable-pulley") {
    const top = 52;
    const radius = 30;
    const mobile = point(width * .42, height * .46 + positions.mL * scale);
    const fixed = point(mobile.x + 2 * radius, top + radius);
    const counterY = height * .56 + positions.mC * scale;
    const mobileLeft = point(mobile.x - radius, mobile.y);
    const mobileRight = point(mobile.x + radius, mobile.y);
    const fixedLeft = point(fixed.x - radius, fixed.y);
    const fixedRight = point(fixed.x + radius, fixed.y);
    const rope = join(
      [point(mobileLeft.x, top), mobileLeft],
      sampleArc({ ...mobile, radius, start: Math.PI, end: 0 }),
      [mobileRight, fixedLeft],
      sampleArc({ ...fixed, radius, start: Math.PI, end: 2 * Math.PI }),
      [fixedRight, point(fixedRight.x, counterY - 31)]
    );
    return Object.freeze({
      ropes: Object.freeze([rope]),
      pulleys: Object.freeze([
        { ...mobile, radius, mobile: true },
        { ...fixed, radius },
      ]),
      blocks: Object.freeze({
        mL: Object.freeze({ x: mobile.x, y: mobile.y + 88, width: 72, height: 58 }),
        mC: Object.freeze({ x: fixedRight.x, y: counterY, width: 62, height: 58 }),
      }),
      supports: Object.freeze([
        { x: mobileLeft.x, y: top },
        { x: fixed.x, y: top },
      ]),
    });
  }

  if (scenarioId === "double-atwood") {
    const fixedRadius = 29;
    const mobileRadius = compact ? 34 : 46;
    const fixed = point(width * .42, 92);
    const mobile = point(fixed.x + fixedRadius, height * .42 + positions.pulley * scale);
    const mass3Y = height * .42 + positions.m3 * scale;
    const mass1Y = height * .72 + positions.m1 * scale;
    const mass2Y = height * .72 + positions.m2 * scale;
    const fixedLeft = point(fixed.x - fixedRadius, fixed.y);
    const fixedRight = point(fixed.x + fixedRadius, fixed.y);
    const mobileLeft = point(mobile.x - mobileRadius, mobile.y);
    const mobileRight = point(mobile.x + mobileRadius, mobile.y);
    const upperRope = join(
      [point(fixedLeft.x, mass3Y - 30), fixedLeft],
      sampleArc({ ...fixed, radius: fixedRadius, start: Math.PI, end: 2 * Math.PI }),
      [fixedRight, point(fixedRight.x, mobile.y - mobileRadius - 12)]
    );
    const lowerRope = join(
      [point(mobileLeft.x, mass1Y - 28), mobileLeft],
      sampleArc({ ...mobile, radius: mobileRadius, start: Math.PI, end: 0 }),
      [mobileRight, point(mobileRight.x, mass2Y - 28)]
    );
    return Object.freeze({
      ropes: Object.freeze([upperRope, lowerRope]),
      pulleys: Object.freeze([
        { ...fixed, radius: fixedRadius },
        { ...mobile, radius: mobileRadius, mobile: true },
      ]),
      blocks: Object.freeze({
        m1: Object.freeze({ x: mobileLeft.x, y: mass1Y, width: compact ? 52 : 58, height: 54 }),
        m2: Object.freeze({ x: mobileRight.x, y: mass2Y, width: compact ? 52 : 58, height: 54 }),
        m3: Object.freeze({ x: fixedLeft.x, y: mass3Y, width: 58, height: 55 }),
      }),
      supports: Object.freeze([{ x: fixed.x, y: 34, pulleyTop: fixed.y - fixedRadius }]),
    });
  }

  throw new RangeError(`Escenario de poleas desconocido: ${scenarioId}.`);
};
