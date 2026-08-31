// Modelo puro de un proyectil puntual en dos dimensiones.
// No conoce p5, Canvas, DOM, Astro ni decisiones de animación.

export const PROJECTILE_EPSILON = 1e-9;

export const PROJECTILE_LIMITS = Object.freeze({
  y0: Object.freeze({ minimum: 0, maximum: 30 }),
  v0: Object.freeze({ minimum: 1, maximum: 50 }),
  theta: Object.freeze({ minimum: 0, maximum: 90 }),
  g: Object.freeze({ minimum: 1, maximum: 25 }),
});

const PARAMETER_LABELS = Object.freeze({
  y0: "La altura inicial",
  v0: "La rapidez inicial",
  theta: "El ángulo de lanzamiento",
  g: "La magnitud de la gravedad",
});

const cleanZero = (value, epsilon = PROJECTILE_EPSILON) =>
  Math.abs(value) <= epsilon ? 0 : value;

export const degreesToRadians = (degrees) => {
  if (!Number.isFinite(degrees)) {
    throw new TypeError("El ángulo en grados debe ser un número finito.");
  }
  return degrees * Math.PI / 180;
};

export const radiansToDegrees = (radians) => {
  if (!Number.isFinite(radians)) {
    throw new TypeError("El ángulo en radianes debe ser un número finito.");
  }
  return radians * 180 / Math.PI;
};

export const validateProjectileParameters = (parameters) => {
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

  const issues = [];
  for (const [field, limits] of Object.entries(PROJECTILE_LIMITS)) {
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

export const assertProjectileParameters = (parameters) => {
  const validation = validateProjectileParameters(parameters);
  if (!validation.valid) {
    throw new RangeError(validation.issues.map((entry) => entry.message).join(" "));
  }
  return {
    y0: parameters.y0,
    v0: parameters.v0,
    theta: parameters.theta,
    g: parameters.g,
  };
};

const initialComponentsUnchecked = ({ v0, theta }) => {
  const radians = degreesToRadians(theta);
  return {
    vx: cleanZero(v0 * Math.cos(radians)),
    vy: cleanZero(v0 * Math.sin(radians)),
  };
};

export const getInitialVelocityComponents = (parameters) =>
  initialComponentsUnchecked(assertProjectileParameters(parameters));

const flightTimeUnchecked = (parameters) => {
  const { vy } = initialComponentsUnchecked(parameters);
  if (parameters.y0 <= PROJECTILE_EPSILON && vy <= PROJECTILE_EPSILON) return 0;
  const discriminant = Math.max(0, vy ** 2 + 2 * parameters.g * parameters.y0);
  const time = (vy + Math.sqrt(discriminant)) / parameters.g;
  return Number.isFinite(time) && time > PROJECTILE_EPSILON ? time : 0;
};

export const getProjectileFlightTime = (parameters) =>
  flightTimeUnchecked(assertProjectileParameters(parameters));

const resolveTime = (parameters, time) => {
  if (!Number.isFinite(time)) throw new TypeError("El tiempo debe ser un número finito.");
  const flightTime = flightTimeUnchecked(parameters);
  if (time < -PROJECTILE_EPSILON || time > flightTime + PROJECTILE_EPSILON) {
    throw new RangeError(`El tiempo debe pertenecer al intervalo [0, ${flightTime}].`);
  }
  if (Math.abs(time) <= PROJECTILE_EPSILON) return 0;
  if (Math.abs(time - flightTime) <= PROJECTILE_EPSILON) return flightTime;
  return time;
};

const positionUnchecked = (parameters, time) => {
  const { vx, vy } = initialComponentsUnchecked(parameters);
  const flightTime = flightTimeUnchecked(parameters);
  const atImpact = Math.abs(time - flightTime) <= PROJECTILE_EPSILON;
  return {
    x: cleanZero(vx * time),
    y: atImpact
      ? 0
      : Math.max(0, cleanZero(parameters.y0 + vy * time - 0.5 * parameters.g * time ** 2)),
  };
};

const velocityUnchecked = (parameters, time) => {
  const { vx, vy } = initialComponentsUnchecked(parameters);
  return {
    x: vx,
    y: cleanZero(vy - parameters.g * time),
  };
};

export const projectilePositionAt = (parameters, time) => {
  const checked = assertProjectileParameters(parameters);
  return positionUnchecked(checked, resolveTime(checked, time));
};

export const projectileVelocityAt = (parameters, time) => {
  const checked = assertProjectileParameters(parameters);
  return velocityUnchecked(checked, resolveTime(checked, time));
};

export const projectileAccelerationAt = (parameters, time) => {
  const checked = assertProjectileParameters(parameters);
  resolveTime(checked, time);
  return { x: 0, y: -checked.g };
};

export const projectileSpeedAt = (parameters, time) => {
  const velocity = projectileVelocityAt(parameters, time);
  return Math.hypot(velocity.x, velocity.y);
};

export const getProjectilePeakTime = (parameters) => {
  const checked = assertProjectileParameters(parameters);
  const { vy } = initialComponentsUnchecked(checked);
  if (vy <= PROJECTILE_EPSILON) return 0;
  return Math.min(flightTimeUnchecked(checked), vy / checked.g);
};

export const getProjectileState = (parameters, time) => {
  const checked = assertProjectileParameters(parameters);
  const checkedTime = resolveTime(checked, time);
  const position = positionUnchecked(checked, checkedTime);
  const velocity = velocityUnchecked(checked, checkedTime);
  return {
    time: checkedTime,
    position,
    velocity,
    acceleration: { x: 0, y: -checked.g },
    speed: Math.hypot(velocity.x, velocity.y),
  };
};

export const getProjectileSummary = (parameters) => {
  const checked = assertProjectileParameters(parameters);
  const initialVelocity = initialComponentsUnchecked(checked);
  const flightTime = flightTimeUnchecked(checked);
  const peakTime = initialVelocity.vy <= PROJECTILE_EPSILON
    ? 0
    : Math.min(flightTime, initialVelocity.vy / checked.g);
  const vertex = positionUnchecked(checked, peakTime);
  const impactVelocity = velocityUnchecked(checked, flightTime);
  return {
    initialVelocity,
    flightTime,
    range: cleanZero(initialVelocity.vx * flightTime),
    peakTime,
    maximumHeight: vertex.y,
    vertex,
    impactVelocity,
    impactSpeed: Math.hypot(impactVelocity.x, impactVelocity.y),
  };
};

export const projectileTrajectoryYAtX = (parameters, x) => {
  const checked = assertProjectileParameters(parameters);
  if (!Number.isFinite(x)) throw new TypeError("La coordenada x debe ser finita.");
  const { vx, vy } = initialComponentsUnchecked(checked);
  const range = cleanZero(vx * flightTimeUnchecked(checked));
  if (vx <= PROJECTILE_EPSILON) return null;
  if (x < -PROJECTILE_EPSILON || x > range + PROJECTILE_EPSILON) {
    throw new RangeError(`La coordenada x debe pertenecer al intervalo [0, ${range}].`);
  }
  const checkedX = Math.max(0, Math.min(range, x));
  const time = checkedX / vx;
  return positionUnchecked(checked, time).y;
};

export const sampleProjectile = (parameters, samples = 121) => {
  const checked = assertProjectileParameters(parameters);
  if (!Number.isInteger(samples) || samples < 2) {
    throw new RangeError("La cantidad de muestras debe ser un entero mayor que uno.");
  }
  const flightTime = flightTimeUnchecked(checked);
  if (flightTime <= PROJECTILE_EPSILON) return [getProjectileState(checked, 0)];
  const step = flightTime / (samples - 1);
  return Array.from({ length: samples }, (_, index) => {
    const time = index === samples - 1 ? flightTime : index * step;
    return getProjectileState(checked, time);
  });
};

export const getProjectileReveal = (parameters, currentTime, samples = 121) => {
  const checked = assertProjectileParameters(parameters);
  if (!Number.isInteger(samples) || samples < 2) {
    throw new RangeError("La cantidad de muestras debe ser un entero mayor que uno.");
  }

  const time = resolveTime(checked, currentTime);
  const summary = getProjectileSummary(checked);
  if (time <= PROJECTILE_EPSILON || summary.flightTime <= PROJECTILE_EPSILON) {
    return {
      samples: [getProjectileState(checked, 0)],
      apexVisible: false,
      impactVisible: false,
    };
  }

  const step = summary.flightTime / (samples - 1);
  const completedSteps = Math.min(samples - 1, Math.floor(time / step));
  const visibleSamples = Array.from({ length: completedSteps + 1 }, (_, index) =>
    getProjectileState(checked, index * step)
  );
  const currentState = getProjectileState(checked, time);
  if (Math.abs(visibleSamples.at(-1).time - time) <= PROJECTILE_EPSILON) {
    visibleSamples[visibleSamples.length - 1] = currentState;
  } else {
    visibleSamples.push(currentState);
  }

  return {
    samples: visibleSamples,
    apexVisible: time + PROJECTILE_EPSILON >= summary.peakTime,
    impactVisible: time + PROJECTILE_EPSILON >= summary.flightTime,
  };
};

const finiteDomain = (values, { minimumSpan = 1, paddingRatio = 0.08 } = {}) => {
  if (!Array.isArray(values) || values.length === 0 || !values.every(Number.isFinite)) {
    throw new RangeError("El dominio requiere valores finitos.");
  }
  let minimum = Math.min(...values);
  let maximum = Math.max(...values);
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

export const createProjectileDomains = (parameters) => {
  const checked = assertProjectileParameters(parameters);
  const summary = getProjectileSummary(checked);
  return {
    time: finiteDomain([0, summary.flightTime], { minimumSpan: 0.1, paddingRatio: 0 }),
    x: finiteDomain([0, summary.range], { minimumSpan: 1 }),
    y: finiteDomain([0, checked.y0, summary.maximumHeight], { minimumSpan: 1 }),
  };
};
