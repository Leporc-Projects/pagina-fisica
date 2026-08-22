export const PULLEY_SCENARIO_IDS = Object.freeze([
  "table-hanging",
  "atwood",
  "movable-pulley",
  "double-atwood",
]);

export const PULLEY_LIMITS = Object.freeze({
  mass: Object.freeze({ minimum: 0.5, maximum: 20 }),
  g: Object.freeze({ minimum: 1, maximum: 15 }),
  friction: Object.freeze({ minimum: 0, maximum: 0.8 }),
  travel: 2.4,
});

const REQUIRED_PARAMETERS = Object.freeze({
  "table-hanging": Object.freeze(["m1", "m2", "muS", "muK", "g"]),
  atwood: Object.freeze(["m1", "m2", "g"]),
  "movable-pulley": Object.freeze(["mL", "mC", "g"]),
  "double-atwood": Object.freeze(["m1", "m2", "m3", "g"]),
});

const MASS_KEYS = new Set(["m1", "m2", "m3", "mL", "mC"]);
const EPSILON = 1e-10;

const finiteInRange = (value, limits) =>
  Number.isFinite(value) && value >= limits.minimum && value <= limits.maximum;

export const validatePulleyConfig = (scenarioId, suppliedConfig) => {
  const errors = [];
  if (!PULLEY_SCENARIO_IDS.includes(scenarioId)) {
    errors.push(`Unknown pulley scenario: ${String(scenarioId)}.`);
    return { valid: false, errors };
  }
  if (!suppliedConfig || typeof suppliedConfig !== "object" || Array.isArray(suppliedConfig)) {
    return { valid: false, errors: ["Pulley configuration must be an object."] };
  }
  for (const key of REQUIRED_PARAMETERS[scenarioId]) {
    const limits = MASS_KEYS.has(key)
      ? PULLEY_LIMITS.mass
      : key === "g"
        ? PULLEY_LIMITS.g
        : PULLEY_LIMITS.friction;
    if (!finiteInRange(suppliedConfig[key], limits)) {
      errors.push(`${key} must be finite and between ${limits.minimum} and ${limits.maximum}.`);
    }
  }
  if (scenarioId === "table-hanging" &&
      Number.isFinite(suppliedConfig.muK) && Number.isFinite(suppliedConfig.muS) &&
      suppliedConfig.muK > suppliedConfig.muS) {
    errors.push("muK must be less than or equal to muS.");
  }
  return { valid: errors.length === 0, errors };
};

const normalizeConfig = (scenarioId, suppliedConfig) => {
  const validation = validatePulleyConfig(scenarioId, suppliedConfig);
  if (!validation.valid) throw new RangeError(validation.errors.join(" "));
  return Object.fromEntries(REQUIRED_PARAMETERS[scenarioId].map((key) => [key, suppliedConfig[key]]));
};

export const solvePulleySystem = (scenarioId, suppliedConfig) => {
  const config = normalizeConfig(scenarioId, suppliedConfig);
  if (scenarioId === "table-hanging") {
    const { m1, m2, muS, muK, g } = config;
    const normal = m1 * g;
    const requiredStatic = m2 * g;
    const maximumStatic = muS * normal;
    if (requiredStatic <= maximumStatic + EPSILON) {
      return {
        scenarioId,
        config,
        regime: "static",
        accelerations: { m1: 0, m2: 0 },
        tensions: { T: requiredStatic },
        friction: requiredStatic,
        normal,
        maximumStatic,
      };
    }
    const friction = muK * normal;
    const a = (m2 * g - friction) / (m1 + m2);
    const tension = m1 * a + friction;
    return {
      scenarioId,
      config,
      regime: "kinetic",
      accelerations: { m1: a, m2: a },
      tensions: { T: tension },
      friction,
      normal,
      maximumStatic,
    };
  }

  if (scenarioId === "atwood") {
    const { m1, m2, g } = config;
    const a = (m2 - m1) * g / (m1 + m2);
    const tension = 2 * m1 * m2 * g / (m1 + m2);
    return {
      scenarioId,
      config,
      regime: Math.abs(a) <= EPSILON ? "equilibrium" : "moving",
      accelerations: { m1: -a, m2: a },
      tensions: { T: tension },
      friction: 0,
    };
  }

  if (scenarioId === "movable-pulley") {
    const { mL, mC, g } = config;
    const aL = (mL - 2 * mC) * g / (mL + 4 * mC);
    const aC = -2 * aL;
    const tension = 3 * mL * mC * g / (mL + 4 * mC);
    return {
      scenarioId,
      config,
      regime: Math.abs(aL) <= EPSILON ? "equilibrium" : "moving",
      accelerations: { mL: aL, mC: aC },
      tensions: { T: tension },
      friction: 0,
    };
  }

  const { m1, m2, m3, g } = config;
  const tensionA = 4 * g / (1 / m1 + 1 / m2 + 4 / m3);
  const tensionC = 2 * tensionA;
  const a1 = g - tensionA / m1;
  const a2 = g - tensionA / m2;
  const a3 = g - tensionC / m3;
  return {
    scenarioId,
    config,
    regime: Math.max(Math.abs(a1), Math.abs(a2), Math.abs(a3)) <= EPSILON ? "equilibrium" : "moving",
    accelerations: { m1: a1, m2: a2, m3: a3, pulley: -a3 },
    tensions: { TA: tensionA, TC: tensionC },
    friction: 0,
  };
};
const zeroCoordinates = (solution) => Object.fromEntries(
  Object.keys(solution.accelerations).map((key) => [key, 0])
);

export const createPulleyState = (scenarioId, config) => {
  const solution = solvePulleySystem(scenarioId, config);
  return {
    scenarioId,
    config: solution.config,
    t: 0,
    positions: zeroCoordinates(solution),
    velocities: zeroCoordinates(solution),
    stopped: false,
    stopReason: null,
  };
};

const integrate = (state, accelerations, dt) => ({
  ...state,
  t: state.t + dt,
  positions: Object.fromEntries(Object.keys(accelerations).map((key) => [
    key,
    state.positions[key] + state.velocities[key] * dt + 0.5 * accelerations[key] * dt ** 2,
  ])),
  velocities: Object.fromEntries(Object.keys(accelerations).map((key) => [
    key,
    state.velocities[key] + accelerations[key] * dt,
  ])),
});

const reachesTravelLimit = (state) =>
  Object.values(state.positions).some((position) => Math.abs(position) > PULLEY_LIMITS.travel + EPSILON);

export const stepPulleyState = (state, dt) => {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError("dt must be finite and non-negative.");
  if (dt === 0 || state.stopped) return structuredClone(state);
  const solution = solvePulleySystem(state.scenarioId, state.config);
  if (solution.regime === "static" || solution.regime === "equilibrium") {
    return { ...structuredClone(state), t: state.t + dt };
  }
  const candidate = integrate(state, solution.accelerations, dt);
  if (!reachesTravelLimit(candidate)) return candidate;

  let low = 0;
  let high = dt;
  for (let iteration = 0; iteration < 56; iteration += 1) {
    const middle = (low + high) / 2;
    if (reachesTravelLimit(integrate(state, solution.accelerations, middle))) high = middle;
    else low = middle;
  }
  const boundary = integrate(state, solution.accelerations, low);
  return {
    ...boundary,
    velocities: Object.fromEntries(Object.keys(boundary.velocities).map((key) => [key, 0])),
    stopped: true,
    stopReason: "travel-limit",
  };
};

export const resetPulleyState = (state) => createPulleyState(state.scenarioId, state.config);

export const getPulleyReadings = (state) => {
  const solution = solvePulleySystem(state.scenarioId, state.config);
  const status = state.stopped ? "travel-limit" : solution.regime;
  return {
    scenarioId: state.scenarioId,
    t: state.t,
    status,
    positions: { ...state.positions },
    velocities: { ...state.velocities },
    accelerations: state.stopped
      ? Object.fromEntries(Object.keys(solution.accelerations).map((key) => [key, 0]))
      : { ...solution.accelerations },
    tensions: { ...solution.tensions },
    friction: solution.friction,
    normal: solution.normal ?? 0,
    maximumStatic: solution.maximumStatic ?? 0,
    stopped: state.stopped,
    stopReason: state.stopReason,
  };
};
