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
});

const surface = (id, coefficients, boundary, body, target) => Object.freeze({
  id,
  coefficients: Object.freeze({ ...coefficients }),
  ...boundary,
  body,
  target,
});

// Distancias del aparato en espacio del modelo. La proyección visual puede usar
// otra escala en móvil y escritorio, pero el contacto físico es siempre el mismo.
export const PULLEY_TERMINAL_GEOMETRY = Object.freeze({
  "table-hanging": Object.freeze([
    surface("m1-bracket", { m1: 1 }, { maximum: 10 }, "m1", "pulley-bracket"),
    surface("m2-lower-stop", { m2: 1 }, { maximum: 11 }, "m2", "lower-stop"),
  ]),
  atwood: Object.freeze([
    surface("m1-upper-clearance", { m1: 1 }, { minimum: -9 }, "m1", "fixed-pulley"),
    surface("m1-lower-stop", { m1: 1 }, { maximum: 10 }, "m1", "lower-stop"),
    surface("m2-upper-clearance", { m2: 1 }, { minimum: -9 }, "m2", "fixed-pulley"),
    surface("m2-lower-stop", { m2: 1 }, { maximum: 10 }, "m2", "lower-stop"),
  ]),
  "movable-pulley": Object.freeze([
    surface("mC-fixed-pulley", { mC: 1 }, { minimum: -9 }, "mC", "fixed-pulley"),
    surface("mC-lower-stop", { mC: 1 }, { maximum: 5.5 }, "mC", "lower-stop"),
    surface("mL-lower-stop", { mL: 1 }, { maximum: 5.2 }, "mL", "lower-stop"),
    surface("mobile-upper-clearance", { mL: 1 }, { minimum: -3.2 }, "mobile-assembly", "upper-support"),
  ]),
  "double-atwood": Object.freeze([
    surface("m3-fixed-pulley", { m3: 1 }, { minimum: -9 }, "m3", "fixed-pulley"),
    surface("m3-lower-stop", { m3: 1 }, { maximum: 9.5 }, "m3", "lower-stop"),
    surface("mobile-fixed-clearance", { pulley: 1 }, { minimum: -3.5 }, "mobile-assembly", "upper-apparatus"),
    surface("mobile-lower-stop", { pulley: 1 }, { maximum: 5 }, "mobile-assembly", "lower-stop"),
    surface("m1-mobile-clearance", { m1: 1, pulley: -1 }, { minimum: -8 }, "m1", "mobile-pulley"),
    surface("m1-lower-stop", { m1: 1, pulley: -1 }, { maximum: 8.5 }, "m1", "lower-stop"),
    surface("m2-mobile-clearance", { m2: 1, pulley: -1 }, { minimum: -8 }, "m2", "mobile-pulley"),
    surface("m2-lower-stop", { m2: 1, pulley: -1 }, { maximum: 8.5 }, "m2", "lower-stop"),
  ]),
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
    contact: null,
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

const projectCoordinate = (values, coefficients) => Object.entries(coefficients).reduce(
  (total, [key, coefficient]) => total + coefficient * values[key],
  0
);

const crossingTime = ({ value, velocity, acceleration, minimum, maximum }) => {
  const limit = minimum ?? maximum;
  const direction = minimum === undefined ? 1 : -1;
  const offset = value - limit;
  const candidates = [];
  if (Math.abs(acceleration) <= EPSILON) {
    if (Math.abs(velocity) > EPSILON) candidates.push(-offset / velocity);
  } else {
    const discriminant = velocity ** 2 - 2 * acceleration * offset;
    if (discriminant >= -EPSILON) {
      const root = Math.sqrt(Math.max(0, discriminant));
      candidates.push((-velocity - root) / acceleration, (-velocity + root) / acceleration);
    }
  }
  return candidates
    .filter((time) => time >= -EPSILON)
    .map((time) => Math.max(0, time))
    .filter((time) => direction * (velocity + acceleration * time) > EPSILON)
    .sort((a, b) => a - b)[0] ?? null;
};

export const getPulleyContactCandidates = (state, accelerations) => PULLEY_TERMINAL_GEOMETRY[
  state.scenarioId
].flatMap((terminalSurface) => {
  const value = projectCoordinate(state.positions, terminalSurface.coefficients);
  const velocity = projectCoordinate(state.velocities, terminalSurface.coefficients);
  const acceleration = projectCoordinate(accelerations, terminalSurface.coefficients);
  const time = crossingTime({ value, velocity, acceleration, ...terminalSurface });
  return time === null ? [] : [{ ...terminalSurface, time, value, velocity, acceleration }];
}).sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));

export const stepPulleyState = (state, dt) => {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError("dt must be finite and non-negative.");
  if (dt === 0 || state.stopped) return structuredClone(state);
  const solution = solvePulleySystem(state.scenarioId, state.config);
  if (solution.regime === "static" || solution.regime === "equilibrium") {
    return { ...structuredClone(state), t: state.t + dt };
  }
  const contact = getPulleyContactCandidates(state, solution.accelerations)
    .find(({ time }) => time <= dt + EPSILON);
  if (!contact) return integrate(state, solution.accelerations, dt);
  const boundary = integrate(state, solution.accelerations, Math.min(dt, contact.time));
  return {
    ...boundary,
    stopped: true,
    stopReason: "geometry-contact",
    contact: Object.freeze({
      surfaceId: contact.id,
      body: contact.body,
      target: contact.target,
    }),
  };
};

export const resetPulleyState = (state) => createPulleyState(state.scenarioId, state.config);

export const getPulleyReadings = (state) => {
  const solution = solvePulleySystem(state.scenarioId, state.config);
  const status = state.stopped ? "geometry-contact" : solution.regime;
  return {
    scenarioId: state.scenarioId,
    t: state.t,
    status,
    positions: { ...state.positions },
    velocities: { ...state.velocities },
    accelerations: { ...solution.accelerations },
    tensions: { ...solution.tensions },
    friction: solution.friction,
    normal: solution.normal ?? 0,
    maximumStatic: solution.maximumStatic ?? 0,
    stopped: state.stopped,
    stopReason: state.stopReason,
    contact: state.contact ? { ...state.contact } : null,
  };
};
