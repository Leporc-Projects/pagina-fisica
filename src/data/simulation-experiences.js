// Adaptador editorial. Los consumidores no dependen del almacenamiento JSON.
import storedExperiences from "./simulation-experiences.json" with { type: "json" };

export const SIMULATION_EXPERIENCES = storedExperiences;

export const getSimulationExperienceById = (
  experienceId,
  experiences = SIMULATION_EXPERIENCES
) => experiences.find((experience) => experience.id === experienceId);

export const getSimulationExperienceByModelId = (
  modelId,
  experiences = SIMULATION_EXPERIENCES
) => experiences.find((experience) => experience.modelId === modelId);

export const getPublishedSimulationExperiences = (
  experiences = SIMULATION_EXPERIENCES
) => experiences.filter((experience) => experience.status === "published");
