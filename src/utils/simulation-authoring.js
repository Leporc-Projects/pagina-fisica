import { getSimulationExperienceByModelId } from "../data/simulation-experiences.js";
import { getSimulationModelById } from "../data/simulation-models.js";

export const createSimulationLabBaseConfiguration = (modelId) => {
  const model = getSimulationModelById(modelId);
  const experience = getSimulationExperienceByModelId(modelId);
  if (!model || !experience) {
    throw new RangeError("El modelo no tiene una experiencia base disponible para autoría.");
  }
  return structuredClone({
    modelId: model.id,
    title: experience.title,
    summary: experience.summary,
    translations: experience.translations,
    parameters: experience.parameters,
    views: experience.views,
    presets: experience.presets,
    observations: experience.observations,
    contexts: experience.contexts,
  });
};
