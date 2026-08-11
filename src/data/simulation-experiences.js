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

export const localizeSimulationExperience = (experience, locale = "es") => {
  if (!experience) return undefined;
  if (locale === "es") return { ...experience, locale };
  const localized = experience.translations?.[locale];
  if (!localized) throw new RangeError(`La experiencia ${experience.id} no tiene traducción ${locale}.`);
  return {
    ...experience,
    locale,
    title: localized.title,
    summary: localized.summary,
    presets: experience.presets.map((preset) => ({
      ...preset,
      label: localized.presetLabels[preset.id],
    })),
    observations: [...localized.observations],
  };
};

export const getLocalizedSimulationExperienceById = (experienceId, locale = "es") =>
  localizeSimulationExperience(getSimulationExperienceById(experienceId), locale);
