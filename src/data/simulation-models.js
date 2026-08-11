// Registro confiable de modelos disponibles para experiencias declarativas.
// Describe capacidades y límites; no contiene funciones, DOM ni configuración
// pedagógica de una experiencia concreta.

import { KINEMATICS_LIMITS } from "../utils/kinematics-1d.js";

export const SIMULATION_RENDERER_IDS = Object.freeze([
  "svg-kinematics-1d",
]);

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

export const SIMULATION_MODELS = Object.freeze([
  Object.freeze({
    id: "kinematics-1d",
    name: "Cinemática 1D con aceleración constante",
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
    views: Object.freeze([
      "motion",
      "readings",
      "positionGraph",
      "velocityGraph",
      "accelerationGraph",
      "turningPoint",
    ]),
  }),
]);

export const getSimulationModelById = (modelId) =>
  SIMULATION_MODELS.find((model) => model.id === modelId);

