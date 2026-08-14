export const FORCES_FRICTION_EPSILON = 1e-9;

export const FORCES_FRICTION_LIMITS = Object.freeze({
  m: Object.freeze({ minimum: 2, maximum: 20, default: 10 }),
  beta: Object.freeze({ minimum: 0, maximum: 35, default: 0 }),
  F: Object.freeze({ minimum: 0, maximum: 60, default: 20 }),
  alpha: Object.freeze({ minimum: -30, maximum: 30, default: 0 }),
  muS: Object.freeze({ minimum: 0, maximum: 0.8, default: 0.5 }),
  muK: Object.freeze({ minimum: 0, maximum: 0.8, default: 0.3 }),
  g: Object.freeze({ minimum: 1, maximum: 15, default: 9.8 }),
  v0: Object.freeze({ minimum: -6, maximum: 6, default: 0 }),
});

const radians = (degrees) => degrees * Math.PI / 180;
const direction = (value) => value < 0 ? -1 : value > 0 ? 1 : 0;

export const getForcesFrictionForces = (params, state = { v: params.v0 ?? 0 }) => {
  const beta = radians(params.beta);
  const alpha = radians(params.alpha);
  const normalRaw = params.m * params.g * Math.cos(beta) - params.F * Math.sin(alpha);
  const drive = params.F * Math.cos(alpha) - params.m * params.g * Math.sin(beta);

  if (normalRaw <= 0) {
    return Object.freeze({
      regime: "contact-invalid",
      normal: 0,
      friction: 0,
      drive,
      requiredStatic: -drive,
      maximumStatic: 0,
      netParallel: 0,
      acceleration: 0,
    });
  }

  const normal = normalRaw;
  const requiredStatic = -drive;
  const maximumStatic = params.muS * normal;
  if (Math.abs(state.v) <= FORCES_FRICTION_EPSILON &&
      Math.abs(requiredStatic) <= maximumStatic + FORCES_FRICTION_EPSILON) {
    return Object.freeze({
      regime: "static",
      normal,
      friction: requiredStatic,
      drive,
      requiredStatic,
      maximumStatic,
      netParallel: 0,
      acceleration: 0,
    });
  }

  const motionDirection = Math.abs(state.v) > FORCES_FRICTION_EPSILON
    ? direction(state.v)
    : direction(drive);
  const friction = -motionDirection * params.muK * normal;
  const netParallel = drive + friction;
  return Object.freeze({
    regime: "kinetic",
    normal,
    friction,
    drive,
    requiredStatic,
    maximumStatic,
    netParallel,
    acceleration: netParallel / params.m,
  });
};

const stateWithForces = (state, forces) => Object.freeze({
  ...state,
  v: Math.abs(state.v) <= FORCES_FRICTION_EPSILON ? 0 : state.v,
  a: forces.acceleration,
  regime: forces.regime,
  normal: forces.normal,
  friction: forces.friction,
  netParallel: forces.netParallel,
  requiredStatic: forces.requiredStatic,
  maximumStatic: forces.maximumStatic,
});

export const createForcesFrictionState = (params) => {
  const base = { t: 0, s: 0, v: params.v0, a: 0 };
  return stateWithForces(base, getForcesFrictionForces(params, base));
};

const integrate = (state, acceleration, dt) => ({
  t: state.t + dt,
  s: state.s + state.v * dt + 0.5 * acceleration * dt * dt,
  v: state.v + acceleration * dt,
  a: acceleration,
});

export const stepForcesFriction = (state, params, dt) => {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError("dt debe ser finito y no negativo.");
  const forces = getForcesFrictionForces(params, state);
  if (dt === 0 || forces.regime === "contact-invalid" || forces.regime === "static") {
    const next = forces.regime === "static" ? { ...state, t: state.t + dt, v: 0, a: 0 } : state;
    return stateWithForces(next, forces);
  }

  const crossesZero = Math.abs(state.v) > FORCES_FRICTION_EPSILON &&
    state.v * forces.acceleration < 0 &&
    -state.v / forces.acceleration <= dt;
  if (!crossesZero) {
    const integrated = integrate(state, forces.acceleration, dt);
    return stateWithForces(integrated, getForcesFrictionForces(params, integrated));
  }

  const stopTime = Math.max(0, -state.v / forces.acceleration);
  const stopped = integrate(state, forces.acceleration, stopTime);
  stopped.v = 0;
  const atRestForces = getForcesFrictionForces(params, stopped);
  const remaining = dt - stopTime;
  if (remaining <= FORCES_FRICTION_EPSILON || atRestForces.regime !== "kinetic") {
    const settled = atRestForces.regime === "static" ? { ...stopped, t: stopped.t + remaining } : stopped;
    return stateWithForces(settled, atRestForces);
  }
  const resumed = integrate(stopped, atRestForces.acceleration, remaining);
  return stateWithForces(resumed, getForcesFrictionForces(params, resumed));
};

export const getForcesFrictionReadings = (state, params) => {
  const forces = getForcesFrictionForces(params, state);
  return Object.freeze({
    t: state.t,
    s: state.s,
    v: state.v,
    a: forces.acceleration,
    normal: forces.normal,
    friction: forces.friction,
    netParallel: forces.netParallel,
    requiredStatic: forces.requiredStatic,
    maximumStatic: forces.maximumStatic,
    regime: forces.regime,
  });
};
