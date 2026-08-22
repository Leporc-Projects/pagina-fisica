// Registro cerrado de implementaciones de presentación disponibles.
// Las experiencias solo pueden seleccionar un modelo; nunca suministran un
// renderer arbitrario, una URL o un módulo ejecutable.

export const SIMULATION_RENDERERS = Object.freeze([
  Object.freeze({
    id: "svg-kinematics-1d",
    modelId: "kinematics-1d",
    technology: "SVG",
  }),
  Object.freeze({
    id: "p5-projectile-2d",
    modelId: "projectile-2d",
    technology: "p5.js Canvas 2D",
  }),
  Object.freeze({
    id: "p5-forces-friction",
    modelId: "forces-friction",
    technology: "p5.js Canvas 2D",
  }),
  Object.freeze({
    id: "p5-circular-radial-force",
    modelId: "circular-radial-force",
    technology: "p5.js Canvas 2D",
  }),
  Object.freeze({
    id: "p5-pulley-systems",
    modelId: "pulley-systems",
    technology: "p5.js Canvas 2D",
  }),
]);

export const SIMULATION_RENDERER_IDS = Object.freeze(
  SIMULATION_RENDERERS.map((renderer) => renderer.id)
);

export const getSimulationRendererById = (rendererId) =>
  SIMULATION_RENDERERS.find((renderer) => renderer.id === rendererId);
