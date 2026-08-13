// Adaptador del catálogo público. La experiencia es fuente de verdad para su
// identidad, texto, estado y contextos; aquí solo viven ruta y categoría.

import {
  getSimulationExperienceById,
  localizeSimulationExperience,
} from "./simulation-experiences.js";
import { getSimulationModelById } from "./simulation-models.js";
import {
  SIMULATION_EXPERIENCE_STATUSES,
} from "../utils/simulation-experience.js";

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

export const SIMULATION_CATEGORY_KEYS = Object.freeze({
  Vectores: "simulation.category.vectors",
  Cinemática: "simulation.category.kinematics",
  Dinámica: "simulation.category.dynamics",
  "Trabajo y energía": "simulation.category.workEnergy",
  "Momento lineal": "simulation.category.momentum",
  Rotación: "simulation.category.rotation",
  Gravitación: "simulation.category.gravitation",
  Oscilaciones: "simulation.category.oscillations",
});

export const SIMULATION_CATALOG = Object.freeze([
  Object.freeze({
    experienceId: "kinematics-1d",
    route: "/simulaciones/cinematica-1d",
    category: "Cinemática",
  }),
  Object.freeze({
    experienceId: "projectile-2d",
    route: "/simulaciones/proyectil-2d",
    category: "Cinemática",
  }),
]);

export const SIMULATIONS = Object.freeze(SIMULATION_CATALOG.map((catalogEntry) => {
  const canonicalExperience = getSimulationExperienceById(catalogEntry.experienceId);
  const experience = localizeSimulationExperience(canonicalExperience, "es");
  if (!experience) {
    throw new Error(`Experiencia de catálogo inexistente: ${catalogEntry.experienceId}.`);
  }
  return Object.freeze({
    id: experience.id,
    modelId: experience.modelId,
    title: experience.title,
    route: catalogEntry.route,
    category: catalogEntry.category,
    status: experience.status,
    description: experience.summary,
    contexts: experience.contexts,
    experience,
  });
}));

// Adaptadores de compatibilidad para consumidores del Bloque 2. Se derivan de
// las fuentes nuevas y no vuelven a almacenar la configuración de Cinemática.
export const SIMULATION_STATUSES = SIMULATION_EXPERIENCE_STATUSES;
const kinematicsExperience = getSimulationExperienceById("kinematics-1d");
const kinematicsModel = getSimulationModelById("kinematics-1d");
export const KINEMATICS_1D_CONTROLS = Object.freeze(
  Object.entries(kinematicsModel.parameters).map(([key, definition]) => Object.freeze({
    key,
    label: definition.label,
    symbol: definition.symbol,
    unit: definition.unit,
    minimum: kinematicsExperience.parameters[key].minimum,
    maximum: kinematicsExperience.parameters[key].maximum,
    step: kinematicsExperience.parameters[key].step,
    editable: kinematicsExperience.parameters[key].editable,
  }))
);
export const KINEMATICS_1D_PRESETS = kinematicsExperience.presets;

export const getSimulationById = (simulationId) =>
  SIMULATIONS.find((simulation) => simulation.id === simulationId);

export const getPublishedSimulations = (locale = "es") =>
  getPublishedSimulationsForLocale(locale);

export const getPublishedSimulationsForLocale = (locale = "es") =>
  SIMULATION_CATALOG.map((catalogEntry) => {
    const experience = localizeSimulationExperience(
      getSimulationExperienceById(catalogEntry.experienceId),
      locale
    );
    const model = getSimulationModelById(experience.modelId);
    const route = locale === "en"
      ? `/en/simulations/${experience.id}`
      : catalogEntry.route;
    return {
      id: experience.id,
      modelId: experience.modelId,
      title: experience.title,
      route,
      category: locale === "en" ? model.translations.en.category : catalogEntry.category,
      status: experience.status,
      description: experience.summary,
      contexts: experience.contexts,
      experience,
    };
  }).filter((simulation) => simulation.status === "published");

export const getPublishedSimulationCategories = () => {
  const publishedIds = new Set(getPublishedSimulationsForLocale("es").map(({ id }) => id));
  return SIMULATION_CATEGORIES.filter((category) =>
    SIMULATION_CATALOG.some(
      ({ experienceId, category: entryCategory }) =>
        entryCategory === category && publishedIds.has(experienceId)
    )
  );
};

export const getSimulationsByCategory = (category, locale = "es") =>
  getPublishedSimulationsForLocale(locale).filter(
    (simulation) => SIMULATION_CATALOG.some(
      (catalogEntry) => catalogEntry.experienceId === simulation.id && catalogEntry.category === category
    )
  );

export const getSimulationsForCourseTopic = (
  courseId,
  unit,
  topicSlug,
  locale = "es"
) => getPublishedSimulations(locale).filter((simulation) =>
  simulation.contexts.some((context) =>
    context.courseId === courseId &&
    context.unit === unit &&
    context.topics.includes(topicSlug)
  )
);
