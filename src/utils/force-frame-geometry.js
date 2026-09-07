const radians = (degrees) => degrees * Math.PI / 180;

export const createInclinedForceFrame = (betaDegrees, alphaDegrees = 0) => {
  if (![betaDegrees, alphaDegrees].every(Number.isFinite)) {
    throw new TypeError("Los ángulos del marco de fuerzas deben ser finitos.");
  }
  const beta = radians(betaDegrees);
  const alpha = radians(alphaDegrees);
  const tangent = Object.freeze({ x: Math.cos(beta), y: -Math.sin(beta) });
  const outward = Object.freeze({ x: -Math.sin(beta), y: -Math.cos(beta) });
  const applied = Object.freeze({
    x: tangent.x * Math.cos(alpha) + outward.x * Math.sin(alpha),
    y: tangent.y * Math.cos(alpha) + outward.y * Math.sin(alpha),
  });
  return Object.freeze({ beta, alpha, tangent, outward, applied });
};

export const resolveWeightInInclinedFrame = (mass, gravity, betaDegrees) => {
  if (![mass, gravity].every(Number.isFinite)) {
    throw new TypeError("La masa y la gravedad deben ser finitas.");
  }
  const frame = createInclinedForceFrame(betaDegrees);
  const magnitude = mass * gravity;
  return Object.freeze({
    parallel: Object.freeze({
      x: -frame.tangent.x * magnitude * Math.sin(frame.beta),
      y: -frame.tangent.y * magnitude * Math.sin(frame.beta),
    }),
    perpendicular: Object.freeze({
      x: -frame.outward.x * magnitude * Math.cos(frame.beta),
      y: -frame.outward.y * magnitude * Math.cos(frame.beta),
    }),
  });
};

export const createRightAngleMarker = (origin, betaDegrees, size = 13) => {
  const { tangent, outward } = createInclinedForceFrame(betaDegrees);
  const corner = {
    x: origin.x + tangent.x * size + outward.x * size,
    y: origin.y + tangent.y * size + outward.y * size,
  };
  return Object.freeze([
    Object.freeze({ x: origin.x + tangent.x * size, y: origin.y + tangent.y * size }),
    Object.freeze(corner),
    Object.freeze({ x: origin.x + outward.x * size, y: origin.y + outward.y * size }),
  ]);
};

export const createForcesFrictionFbdGeometry = ({ m, g, beta, alpha, F, normal, friction }, maximumLength = 82) => {
  if (![m, g, beta, alpha, F, normal, friction, maximumLength].every(Number.isFinite) || maximumLength <= 0) {
    throw new TypeError("La geometría del DCL requiere magnitudes finitas y una longitud máxima positiva.");
  }
  const { tangent, outward, applied } = createInclinedForceFrame(beta, alpha);
  const weight = resolveWeightInInclinedFrame(m, g, beta);
  const vectors = Object.freeze({
    applied: Object.freeze({ x: applied.x * F, y: applied.y * F }),
    normal: Object.freeze({ x: outward.x * normal, y: outward.y * normal }),
    friction: Object.freeze({ x: tangent.x * friction, y: tangent.y * friction }),
    weight: Object.freeze({ x: 0, y: m * g }),
    weightParallel: weight.parallel,
    weightPerpendicular: weight.perpendicular,
  });
  const maximumMagnitude = Math.max(...Object.values(vectors).map(({ x, y }) => Math.hypot(x, y)));
  const pixelsPerNewton = maximumMagnitude > 0 ? maximumLength / maximumMagnitude : 1;
  const displayVectors = Object.freeze(Object.fromEntries(Object.entries(vectors).map(([key, vector]) => [
    key,
    Object.freeze({ x: vector.x * pixelsPerNewton, y: vector.y * pixelsPerNewton }),
  ])));
  return Object.freeze({ vectors, displayVectors, maximumMagnitude, maximumLength, pixelsPerNewton });
};
