// Registro confiable de modelos disponibles para experiencias declarativas.
// Describe capacidades y límites; no contiene funciones, DOM ni configuración
// pedagógica de una experiencia concreta.

import { KINEMATICS_LIMITS } from "../utils/kinematics-1d.js";
import { PROJECTILE_LIMITS } from "../utils/projectile-2d.js";
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
  }),
]);

export const getSimulationModelById = (modelId) =>
  SIMULATION_MODELS.find((model) => model.id === modelId);
