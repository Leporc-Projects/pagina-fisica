// Modelo puro de cinemática unidimensional con aceleración constante.
// No conoce el DOM, SVG ni decisiones de presentación.

export const KINEMATICS_EPSILON = 1e-9;

export const KINEMATICS_LIMITS = Object.freeze({
  x0: Object.freeze({ minimum: -50, maximum: 50 }),
  v0: Object.freeze({ minimum: -20, maximum: 20 }),
  a: Object.freeze({ minimum: -10, maximum: 10 }),
  T: Object.freeze({ minimum: 1, maximum: 20 }),
});

const PARAMETER_LABELS = Object.freeze({
  x0: "La posición inicial",
  v0: "La velocidad inicial",
  a: "La aceleración",
  T: "La duración",
});

const cleanZero = (value, epsilon = KINEMATICS_EPSILON) =>
  Math.abs(value) <= epsilon ? 0 : value;

/**
 * Devuelve todos los problemas del conjunto de parámetros sin lanzar errores.
 * Esta forma permite que la interfaz marque cada control de manera accesible.
 */
export const validateKinematicsParameters = (parameters) => {
  const issues = [];

  if (!parameters || typeof parameters !== "object" || Array.isArray(parameters)) {
    return {
      valid: false,
      issues: [{
        field: "parameters",
        code: "invalid-object",
        message: "Los parámetros deben entregarse como un objeto.",
      }],
    };
  }

  for (const [field, limits] of Object.entries(KINEMATICS_LIMITS)) {
    const value = parameters[field];

    if (!Number.isFinite(value)) {
      issues.push({
        field,
        code: "not-finite",
        message: `${PARAMETER_LABELS[field]} debe ser un número finito.`,
      });
      continue;
    }

    if (value < limits.minimum || value > limits.maximum) {
      issues.push({
        field,
        code: "out-of-range",
        message: `${PARAMETER_LABELS[field]} debe estar entre ${limits.minimum} y ${limits.maximum}.`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
};

export const assertKinematicsParameters = (parameters) => {
  const result = validateKinematicsParameters(parameters);

  if (!result.valid) {
    throw new RangeError(result.issues.map((issue) => issue.message).join(" "));
  }

  return {
    x0: parameters.x0,
    v0: parameters.v0,
    a: parameters.a,
    T: parameters.T,
  };
};

const resolveTime = (parameters, time) => {
  if (!Number.isFinite(time)) {
    throw new TypeError("El tiempo debe ser un número finito.");
  }

  if (time < -KINEMATICS_EPSILON || time > parameters.T + KINEMATICS_EPSILON) {
    throw new RangeError(`El tiempo debe pertenecer al intervalo [0, ${parameters.T}].`);
  }

  if (Math.abs(time) <= KINEMATICS_EPSILON) return 0;
  if (Math.abs(time - parameters.T) <= KINEMATICS_EPSILON) return parameters.T;
  return time;
};

const evaluatePosition = ({ x0, v0, a }, time) =>
  cleanZero(x0 + v0 * time + 0.5 * a * time ** 2);

const evaluateVelocity = ({ v0, a }, time) =>
  cleanZero(v0 + a * time);

export const positionAt = (parameters, time) => {
  const checked = assertKinematicsParameters(parameters);
  return evaluatePosition(checked, resolveTime(checked, time));
};

export const velocityAt = (parameters, time) => {
  const checked = assertKinematicsParameters(parameters);
  return evaluateVelocity(checked, resolveTime(checked, time));
};

export const accelerationAt = (parameters, time) => {
  const checked = assertKinematicsParameters(parameters);
  resolveTime(checked, time);
  return cleanZero(checked.a);
};

export const displacementAt = (parameters, time) => {
  const checked = assertKinematicsParameters(parameters);
  const checkedTime = resolveTime(checked, time);
  return cleanZero(evaluatePosition(checked, checkedTime) - checked.x0);
};

export const speedAt = (parameters, time) =>
  Math.abs(velocityAt(parameters, time));

/** El retorno solo existe si v cambia de signo dentro del intervalo abierto. */
export const getTurningPoint = (parameters) => {
  const checked = assertKinematicsParameters(parameters);

  if (Math.abs(checked.a) <= KINEMATICS_EPSILON) return null;

  const time = -checked.v0 / checked.a;
  if (
    time <= KINEMATICS_EPSILON ||
    time >= checked.T - KINEMATICS_EPSILON
  ) {
    return null;
  }

  return {
    time: cleanZero(time),
    position: evaluatePosition(checked, time),
  };
};

export const distanceAt = (parameters, time) => {
  const checked = assertKinematicsParameters(parameters);
  const checkedTime = resolveTime(checked, time);
  const currentPosition = evaluatePosition(checked, checkedTime);
  const turningPoint = getTurningPoint(checked);

  if (!turningPoint || turningPoint.time >= checkedTime - KINEMATICS_EPSILON) {
    return Math.abs(currentPosition - checked.x0);
  }

  return cleanZero(
    Math.abs(turningPoint.position - checked.x0) +
    Math.abs(currentPosition - turningPoint.position)
  );
};

export const describeDirection = (velocity) => {
  if (!Number.isFinite(velocity)) {
    throw new TypeError("La velocidad debe ser finita para describir el sentido.");
  }

  if (Math.abs(velocity) <= KINEMATICS_EPSILON) return "reposo instantáneo";
  return velocity > 0 ? "hacia +x" : "hacia −x";
};

export const getKinematicsState = (parameters, time) => {
  const checked = assertKinematicsParameters(parameters);
  const checkedTime = resolveTime(checked, time);
  const position = evaluatePosition(checked, checkedTime);
  const velocity = evaluateVelocity(checked, checkedTime);

  return {
    time: checkedTime,
    position,
    displacement: cleanZero(position - checked.x0),
    distance: distanceAt(checked, checkedTime),
    velocity,
    speed: Math.abs(velocity),
    acceleration: cleanZero(checked.a),
    direction: describeDirection(velocity),
  };
};

export const sampleKinematics = (parameters, samples = 121) => {
  const checked = assertKinematicsParameters(parameters);

  if (!Number.isInteger(samples) || samples < 2) {
    throw new RangeError("La cantidad de muestras debe ser un entero mayor que uno.");
  }

  const step = checked.T / (samples - 1);
  return Array.from({ length: samples }, (_, index) => {
    const time = index === samples - 1 ? checked.T : index * step;
    return {
      time,
      position: evaluatePosition(checked, time),
      velocity: evaluateVelocity(checked, time),
      acceleration: cleanZero(checked.a),
    };
  });
};

export const getPositionExtrema = (parameters) => {
  const checked = assertKinematicsParameters(parameters);
  const candidates = [
    { time: 0, position: checked.x0 },
    { time: checked.T, position: evaluatePosition(checked, checked.T) },
  ];
  const turningPoint = getTurningPoint(checked);

  if (turningPoint) candidates.push(turningPoint);

  return {
    minimum: candidates.reduce((best, item) =>
      item.position < best.position ? item : best),
    maximum: candidates.reduce((best, item) =>
      item.position > best.position ? item : best),
    points: candidates,
  };
};

/**
 * Amplía valores físicos a un dominio creciente. Los casos constantes reciben
 * un ancho mínimo para impedir escalas degeneradas y SVG no finito.
 */
export const createFiniteDomain = (
  values,
  { paddingRatio = 0.08, minimumSpan = 1, includeZero = false } = {}
) => {
  if (
    !Array.isArray(values) ||
    values.length === 0 ||
    !values.every(Number.isFinite) ||
    !Number.isFinite(paddingRatio) ||
    paddingRatio < 0 ||
    !Number.isFinite(minimumSpan) ||
    minimumSpan <= 0
  ) {
    throw new RangeError("El dominio requiere valores finitos y márgenes válidos.");
  }

  const domainValues = includeZero ? [...values, 0] : [...values];
  let minimum = Math.min(...domainValues);
  let maximum = Math.max(...domainValues);
  let span = maximum - minimum;

  if (span < minimumSpan) {
    const center = (minimum + maximum) / 2;
    minimum = center - minimumSpan / 2;
    maximum = center + minimumSpan / 2;
    span = minimumSpan;
  }

  const padding = span * paddingRatio;
  return [cleanZero(minimum - padding), cleanZero(maximum + padding)];
};

export const createKinematicsDomains = (parameters) => {
  const checked = assertKinematicsParameters(parameters);
  const extrema = getPositionExtrema(checked);
  const finalVelocity = evaluateVelocity(checked, checked.T);

  return {
    time: [0, checked.T],
    position: createFiniteDomain(
      extrema.points.map((point) => point.position),
      { minimumSpan: 2 }
    ),
    velocity: createFiniteDomain(
      [checked.v0, finalVelocity],
      { minimumSpan: 2, includeZero: true }
    ),
    acceleration: createFiniteDomain(
      [checked.a],
      { minimumSpan: 2, includeZero: true }
    ),
  };
};
