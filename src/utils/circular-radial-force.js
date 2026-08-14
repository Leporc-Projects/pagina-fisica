export const CIRCULAR_RADIAL_LIMITS = Object.freeze({
  m: Object.freeze({ minimum: 0.5, maximum: 5, default: 1.5 }),
  R: Object.freeze({ minimum: 0.5, maximum: 4, default: 2 }),
  v: Object.freeze({ minimum: 0.5, maximum: 10, default: 4 }),
  Tmax: Object.freeze({ minimum: 1, maximum: 100, default: 20 }),
});

const vectorMagnitude = ({ x, y }) => Math.hypot(x, y);

export const getConnectedCircularState = (params, t, theta0 = 0) => {
  const omega = params.v / params.R;
  const theta = theta0 + omega * t;
  const cosine = Math.cos(theta);
  const sine = Math.sin(theta);
  const radialAcceleration = params.v ** 2 / params.R;
  const tension = params.m * radialAcceleration;
  return Object.freeze({
    t,
    theta,
    omega,
    position: Object.freeze({ x: params.R * cosine, y: params.R * sine }),
    velocity: Object.freeze({ x: -params.v * sine, y: params.v * cosine }),
    acceleration: Object.freeze({ x: -radialAcceleration * cosine, y: -radialAcceleration * sine }),
    radialAcceleration,
    tension,
  });
};

export const createCircularRadialState = (params) => {
  const connected = getConnectedCircularState(params, 0);
  return Object.freeze({
    ...connected,
    status: "connected",
    theta0: 0,
    breakPosition: null,
    breakVelocity: null,
    breakTime: null,
  });
};

const breakCircularString = (state, params, status) => {
  if (state.status !== "connected") return state;
  const connected = getConnectedCircularState(params, state.t, state.theta0);
  return Object.freeze({
    ...state,
    ...connected,
    status,
    acceleration: Object.freeze({ x: 0, y: 0 }),
    radialAcceleration: 0,
    tension: 0,
    breakPosition: connected.position,
    breakVelocity: connected.velocity,
    breakTime: connected.t,
  });
};

export const cutCircularString = (state, params) =>
  breakCircularString(state, params, "broken-manual");

export const stepCircularRadial = (state, params, dt) => {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError("dt debe ser finito y no negativo.");
  if (state.status === "connected") {
    const requiredTension = params.m * params.v ** 2 / params.R;
    if (requiredTension > params.Tmax) {
      return breakCircularString(state, params, "broken-overload");
    }
    const connected = getConnectedCircularState(params, state.t + dt, state.theta0);
    return Object.freeze({ ...state, ...connected });
  }

  const time = state.t + dt;
  const tau = time - state.breakTime;
  return Object.freeze({
    ...state,
    t: time,
    position: Object.freeze({
      x: state.breakPosition.x + state.breakVelocity.x * tau,
      y: state.breakPosition.y + state.breakVelocity.y * tau,
    }),
    velocity: state.breakVelocity,
    acceleration: Object.freeze({ x: 0, y: 0 }),
    radialAcceleration: 0,
    tension: 0,
  });
};

export const getCircularRadialReadings = (state, params) => Object.freeze({
  t: state.t,
  theta: state.theta,
  omega: params.v / params.R,
  radius: params.R,
  speed: vectorMagnitude(state.velocity),
  radialAcceleration: state.status === "connected" ? params.v ** 2 / params.R : 0,
  requiredTension: params.m * params.v ** 2 / params.R,
  tension: state.status === "connected" ? params.m * params.v ** 2 / params.R : 0,
  maximumTension: params.Tmax,
  status: state.status,
  position: state.position,
  velocity: state.velocity,
  acceleration: state.acceleration,
});
