import { ROUTE_IDS } from "../i18n/routes.js";

export const SIMULATION_PAGE_REGISTRY = Object.freeze({
  "kinematics-1d": Object.freeze({ routeId: ROUTE_IDS.KINEMATICS_1D, prefix: "kinematics" }),
  "projectile-2d": Object.freeze({ routeId: ROUTE_IDS.PROJECTILE_2D, prefix: "projectile" }),
  "forces-friction": Object.freeze({ routeId: ROUTE_IDS.FORCES_FRICTION, prefix: "forcesFriction", className: "forces-friction" }),
  "circular-radial-force": Object.freeze({ routeId: ROUTE_IDS.CIRCULAR_RADIAL_FORCE, prefix: "circularDynamics", className: "circular-dynamics" }),
});

export const getSimulationPageDefinition = (experienceId) => {
  const definition = SIMULATION_PAGE_REGISTRY[experienceId];
  if (!definition) throw new RangeError(`Unknown simulation page: ${String(experienceId)}`);
  return { className: definition.className ?? definition.prefix, ...definition };
};
