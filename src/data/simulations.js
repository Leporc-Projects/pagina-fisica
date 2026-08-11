// Catálogo canónico de simulaciones propias. La relación con cursos y temas se
// declara como contexto educativo, sin convertir el recurso en contenido local.

export const SIMULATION_CATEGORIES = Object.freeze([
  "Vectores",
  "Cinemática",
  "Dinámica",
  "Trabajo y energía",
  "Momento lineal",
  "Rotación",
  "Gravitación",
  "Oscilaciones",
]);

export const SIMULATION_STATUSES = Object.freeze([
  "draft",
  "review",
  "published",
  "archived",
]);

export const SIMULATIONS = Object.freeze([
  Object.freeze({
    id: "kinematics-1d",
    title: "Cinemática en una dimensión",
    route: "/simulaciones/cinematica-1d",
    category: "Cinemática",
    status: "published",
    description:
      "Explora posición, velocidad y aceleración constante sobre un eje, con gráficas sincronizadas y lectura física del cambio de sentido.",
    contexts: Object.freeze([
      Object.freeze({
        courseId: "fisica-basica-1",
        unit: 1,
        topics: Object.freeze(["movimiento-1d", "ecuaciones-movimiento"]),
      }),
    ]),
  }),
]);

export const KINEMATICS_1D_CONTROLS = Object.freeze([
  Object.freeze({
    key: "x0",
    label: "Posición inicial",
    symbol: "x₀",
    unit: "m",
    minimum: -50,
    maximum: 50,
    step: 1,
  }),
  Object.freeze({
    key: "v0",
    label: "Velocidad inicial",
    symbol: "v₀",
    unit: "m/s",
    minimum: -20,
    maximum: 20,
    step: 0.5,
  }),
  Object.freeze({
    key: "a",
    label: "Aceleración",
    symbol: "a",
    unit: "m/s²",
    minimum: -10,
    maximum: 10,
    step: 0.5,
  }),
  Object.freeze({
    key: "T",
    label: "Duración",
    symbol: "T",
    unit: "s",
    minimum: 1,
    maximum: 20,
    step: 0.5,
  }),
]);

export const KINEMATICS_1D_PRESETS = Object.freeze([
  Object.freeze({
    id: "uniform",
    label: "Movimiento uniforme",
    parameters: Object.freeze({ x0: -6, v0: 2.5, a: 0, T: 6 }),
  }),
  Object.freeze({
    id: "rest",
    label: "Parte del reposo",
    parameters: Object.freeze({ x0: -4, v0: 0, a: 1.5, T: 6 }),
  }),
  Object.freeze({
    id: "return",
    label: "Frena y regresa",
    parameters: Object.freeze({ x0: -4, v0: 6, a: -2, T: 6 }),
  }),
]);

export const getSimulationById = (simulationId) =>
  SIMULATIONS.find((simulation) => simulation.id === simulationId);

export const getPublishedSimulations = () =>
  SIMULATIONS.filter((simulation) => simulation.status === "published");

export const getSimulationsByCategory = (category) =>
  getPublishedSimulations().filter(
    (simulation) => simulation.category === category
  );

export const getSimulationsForCourseTopic = (
  courseId,
  unit,
  topicSlug
) => getPublishedSimulations().filter((simulation) =>
  simulation.contexts.some((context) =>
    context.courseId === courseId &&
    context.unit === unit &&
    context.topics.includes(topicSlug)
  )
);
