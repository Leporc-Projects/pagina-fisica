// Registro confiable de modelos disponibles para experiencias declarativas.
// Describe capacidades y límites; no contiene funciones, DOM ni configuración
// pedagógica de una experiencia concreta.

import { KINEMATICS_LIMITS } from "../utils/kinematics-1d.js";
import { PROJECTILE_LIMITS } from "../utils/projectile-2d.js";
import { FORCES_FRICTION_LIMITS } from "../utils/forces-friction.js";
import { CIRCULAR_RADIAL_LIMITS } from "../utils/circular-radial-force.js";
import { PULLEY_LIMITS } from "../utils/pulley-systems.js";
export { SIMULATION_RENDERER_IDS } from "./simulation-renderers.js";

const parameter = ({ label, symbol, unit, limits, defaultStep }) =>
  Object.freeze({
    type: "number",
    label,
    symbol,
    unit,
    hardMinimum: limits.minimum,
    hardMaximum: limits.maximum,
    defaultStep,
  });

const view = (label, visual = false) => Object.freeze({ label, visual });

const translations = (name, category, parameters, views) => Object.freeze({
  en: Object.freeze({ name, category, parameters: Object.freeze(parameters), views: Object.freeze(views) }),
});

export const SIMULATION_MODELS = Object.freeze([
  Object.freeze({
    id: "kinematics-1d",
    name: "Cinemática 1D con aceleración constante",
    category: "Cinemática",
    rendererId: "svg-kinematics-1d",
    parameters: Object.freeze({
      x0: parameter({
        label: "Posición inicial",
        symbol: "x₀",
        unit: "m",
        limits: KINEMATICS_LIMITS.x0,
        defaultStep: 1,
      }),
      v0: parameter({
        label: "Velocidad inicial",
        symbol: "v₀",
        unit: "m/s",
        limits: KINEMATICS_LIMITS.v0,
        defaultStep: 0.5,
      }),
      a: parameter({
        label: "Aceleración",
        symbol: "a",
        unit: "m/s²",
        limits: KINEMATICS_LIMITS.a,
        defaultStep: 0.5,
      }),
      T: parameter({
        label: "Duración",
        symbol: "T",
        unit: "s",
        limits: KINEMATICS_LIMITS.T,
        defaultStep: 0.5,
      }),
    }),
    views: Object.freeze({
      motion: view("Movimiento sobre el eje", true),
      readings: view("Lecturas instantáneas"),
      positionGraph: view("Gráfica x(t)", true),
      velocityGraph: view("Gráfica v(t)", true),
      accelerationGraph: view("Gráfica a(t)", true),
      turningPoint: view("Información del cambio de sentido"),
    }),
    translations: translations(
      "One-dimensional kinematics with constant acceleration",
      "Kinematics",
      { x0: "Initial position", v0: "Initial velocity", a: "Acceleration", T: "Duration" },
      {
        motion: "Motion along the axis",
        readings: "Instantaneous readings",
        positionGraph: "x(t) graph",
        velocityGraph: "v(t) graph",
        accelerationGraph: "a(t) graph",
        turningPoint: "Change-of-direction information",
      }
    ),
  }),
  Object.freeze({
    id: "projectile-2d",
    name: "Movimiento de proyectil 2D",
    category: "Cinemática",
    rendererId: "p5-projectile-2d",
    parameters: Object.freeze({
      y0: parameter({
        label: "Altura inicial",
        symbol: "y₀",
        unit: "m",
        limits: PROJECTILE_LIMITS.y0,
        defaultStep: 1,
      }),
      v0: parameter({
        label: "Rapidez inicial",
        symbol: "v₀",
        unit: "m/s",
        limits: PROJECTILE_LIMITS.v0,
        defaultStep: 1,
      }),
      theta: parameter({
        label: "Ángulo de lanzamiento",
        symbol: "θ",
        unit: "°",
        limits: PROJECTILE_LIMITS.theta,
        defaultStep: 1,
      }),
      g: parameter({
        label: "Magnitud de la gravedad",
        symbol: "g",
        unit: "m/s²",
        limits: PROJECTILE_LIMITS.g,
        defaultStep: 0.1,
      }),
    }),
    views: Object.freeze({
      scene: view("Escena cartesiana", true),
      readings: view("Lecturas instantáneas"),
      trajectory: view("Trayectoria completa", true),
      velocityVector: view("Vector velocidad"),
      accelerationVector: view("Vector aceleración"),
      velocityComponents: view("Componentes de velocidad"),
      keyPoints: view("Puntos de lanzamiento, vértice e impacto"),
    }),
    translations: translations(
      "Two-dimensional projectile motion",
      "Kinematics",
      { y0: "Initial height", v0: "Initial speed", theta: "Launch angle", g: "Gravity magnitude" },
      {
        scene: "Cartesian scene",
        readings: "Instantaneous readings",
        trajectory: "Complete trajectory",
        velocityVector: "Velocity vector",
        accelerationVector: "Acceleration vector",
        velocityComponents: "Velocity components",
        keyPoints: "Launch, apex, and impact points",
      }
    ),
  }),
  Object.freeze({
    id: "forces-friction",
    name: "Fuerzas, fricción y movimiento",
    category: "Dinámica",
    rendererId: "p5-forces-friction",
    parameters: Object.freeze({
      F: parameter({ label: "Fuerza aplicada", symbol: "F", unit: "N", limits: FORCES_FRICTION_LIMITS.F, defaultStep: 1 }),
      beta: parameter({ label: "Inclinación de la superficie", symbol: "β", unit: "°", limits: FORCES_FRICTION_LIMITS.beta, defaultStep: 1 }),
      muS: parameter({ label: "Coeficiente de fricción estática", symbol: "μ_s", unit: "", limits: FORCES_FRICTION_LIMITS.muS, defaultStep: 0.05 }),
      muK: parameter({ label: "Coeficiente de fricción cinética", symbol: "μ_k", unit: "", limits: FORCES_FRICTION_LIMITS.muK, defaultStep: 0.05 }),
      m: parameter({ label: "Masa", symbol: "m", unit: "kg", limits: FORCES_FRICTION_LIMITS.m, defaultStep: 0.5 }),
      alpha: parameter({ label: "Ángulo de la fuerza respecto a la superficie", symbol: "α", unit: "°", limits: FORCES_FRICTION_LIMITS.alpha, defaultStep: 1 }),
      g: parameter({ label: "Gravedad", symbol: "g", unit: "m/s²", limits: FORCES_FRICTION_LIMITS.g, defaultStep: 0.1 }),
      v0: parameter({ label: "Velocidad inicial sobre la superficie", symbol: "v₀", unit: "m/s", limits: FORCES_FRICTION_LIMITS.v0, defaultStep: 0.5 }),
    }),
    views: Object.freeze({
      scene: view("Escena sobre la superficie", true),
      readings: view("Lecturas instantáneas"),
      vectors: view("Vectores físicos"),
      freeBodyDiagram: view("Diagrama de cuerpo libre", true),
      frictionMeter: view("Medidor del umbral de fricción", true),
      historyGraph: view("Historia de velocidad y fuerza neta", true),
      frictionRelationGraph: view("Relación entre fricción, umbral y fuerza aplicada", true),
    }),
    translations: translations(
      "Forces, friction, and motion",
      "Dynamics",
      { F: "Applied force", beta: "Surface angle", muS: "Static-friction coefficient", muK: "Kinetic-friction coefficient", m: "Mass", alpha: "Force angle relative to the surface", g: "Gravity", v0: "Initial velocity along the surface" },
      { scene: "Scene along the surface", readings: "Live readings", vectors: "Physical vectors", freeBodyDiagram: "Free-body diagram", frictionMeter: "Friction-threshold meter", historyGraph: "Velocity and net-force history", frictionRelationGraph: "Friction, threshold, and applied-force relationship" }
    ),
  }),
  Object.freeze({
    id: "pulley-systems",
    name: "Laboratorio de poleas y cuerdas",
    category: "Dinámica",
    rendererId: "p5-pulley-systems",
    parameters: Object.freeze({
      m1: parameter({ label: "Masa 1", symbol: "m₁", unit: "kg", limits: PULLEY_LIMITS.mass, defaultStep: 0.5 }),
      m2: parameter({ label: "Masa 2", symbol: "m₂", unit: "kg", limits: PULLEY_LIMITS.mass, defaultStep: 0.5 }),
      m3: parameter({ label: "Masa 3", symbol: "m₃", unit: "kg", limits: PULLEY_LIMITS.mass, defaultStep: 0.5 }),
      mL: parameter({ label: "Masa de la carga", symbol: "mL", unit: "kg", limits: PULLEY_LIMITS.mass, defaultStep: 0.5 }),
      mC: parameter({ label: "Masa del contrapeso", symbol: "mC", unit: "kg", limits: PULLEY_LIMITS.mass, defaultStep: 0.5 }),
      muS: parameter({ label: "Coeficiente de fricción estática", symbol: "μ_s", unit: "", limits: PULLEY_LIMITS.friction, defaultStep: 0.05 }),
      muK: parameter({ label: "Coeficiente de fricción cinética", symbol: "μ_k", unit: "", limits: PULLEY_LIMITS.friction, defaultStep: 0.05 }),
      g: parameter({ label: "Gravedad", symbol: "g", unit: "m/s²", limits: PULLEY_LIMITS.g, defaultStep: 0.1 }),
    }),
    views: Object.freeze({
      scene: view("Escena mecánica", true),
      readings: view("Lecturas en vivo"),
      freeBodyDiagrams: view("Diagramas de cuerpo libre", true),
      equations: view("Ecuaciones en vivo"),
      ropeConstraint: view("Restricción de cuerda", true),
      historyGraph: view("Historia temporal", true),
    }),
    translations: translations(
      "Pulley and rope laboratory",
      "Dynamics",
      { m1: "Mass 1", m2: "Mass 2", m3: "Mass 3", mL: "Load mass", mC: "Counterweight mass", muS: "Static-friction coefficient", muK: "Kinetic-friction coefficient", g: "Gravity" },
      { scene: "Mechanical scene", readings: "Live readings", freeBodyDiagrams: "Free-body diagrams", equations: "Live equations", ropeConstraint: "Rope constraint", historyGraph: "Time history" }
    ),
  }),
  Object.freeze({
    id: "circular-radial-force",
    name: "Movimiento circular y fuerza radial",
    category: "Dinámica",
    rendererId: "p5-circular-radial-force",
    parameters: Object.freeze({
      v: parameter({ label: "Rapidez", symbol: "v", unit: "m/s", limits: CIRCULAR_RADIAL_LIMITS.v, defaultStep: 0.1 }),
      R: parameter({ label: "Radio", symbol: "R", unit: "m", limits: CIRCULAR_RADIAL_LIMITS.R, defaultStep: 0.1 }),
      Tmax: parameter({ label: "Tensión máxima de la cuerda", symbol: "T_max", unit: "N", limits: CIRCULAR_RADIAL_LIMITS.Tmax, defaultStep: 1 }),
      m: parameter({ label: "Masa", symbol: "m", unit: "kg", limits: CIRCULAR_RADIAL_LIMITS.m, defaultStep: 0.1 }),
    }),
    views: Object.freeze({
      scene: view("Escena circular", true),
      readings: view("Lecturas instantáneas"),
      vectors: view("Vectores físicos"),
      freeBodyDiagram: view("Diagrama de cuerpo libre", true),
      tensionMeter: view("Medidor del límite de tensión", true),
      trail: view("Rastro y círculo de referencia", true),
      relationshipGraphs: view("Relaciones de tensión con rapidez y radio", true),
    }),
    translations: translations(
      "Circular motion and radial force",
      "Dynamics",
      { v: "Speed", R: "Radius", Tmax: "Maximum string tension", m: "Mass" },
      { scene: "Circular scene", readings: "Live readings", vectors: "Physical vectors", freeBodyDiagram: "Free-body diagram", tensionMeter: "Tension-limit meter", trail: "Trail and reference circle", relationshipGraphs: "Tension relationships with speed and radius" }
    ),
  }),
]);

export const getSimulationModelById = (modelId) =>
  SIMULATION_MODELS.find((model) => model.id === modelId);

export const localizeSimulationModel = (model, locale = "es") => {
  if (!model) return undefined;
  if (locale === "es") return model;
  const localized = model.translations?.[locale];
  if (!localized) throw new RangeError(`El modelo ${model.id} no tiene traducción ${locale}.`);
  return {
    ...model,
    name: localized.name,
    category: localized.category,
    parameters: Object.fromEntries(Object.entries(model.parameters).map(([key, definition]) => [
      key,
      { ...definition, label: localized.parameters[key] },
    ])),
    views: Object.fromEntries(Object.entries(model.views).map(([key, definition]) => [
      key,
      { ...definition, label: localized.views[key] },
    ])),
  };
};

export const getLocalizedSimulationModelById = (modelId, locale = "es") =>
  localizeSimulationModel(getSimulationModelById(modelId), locale);
