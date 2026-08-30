import { assertSupportedLocale } from "../../i18n/config.js";

const localizeDecimalSeparators = (value, locale) => locale === "es"
  ? value.replace(/(\d)\.(\d)/g, "$1,$2")
  : value.replace(/(\d),(\d)/g, "$1.$2");

export const localizeExercisePresentation = (exercise, locale) => {
  assertSupportedLocale(locale);
  if (!exercise) return exercise;

  const dimensionless = exercise.expectedUnit === "";
  const display = exercise.answer?.display == null
    ? null
    : localizeDecimalSeparators(exercise.answer.display.trim(), locale);

  return {
    ...exercise,
    expectedUnit: dimensionless ? "—" : exercise.expectedUnit,
    answer: display == null
      ? exercise.answer
      : { ...exercise.answer, display: dimensionless ? `${display} —` : display },
    interaction: dimensionless && exercise.interaction?.kind === "number"
      ? { ...exercise.interaction, field: { ...exercise.interaction.field, unit: "—" } }
      : exercise.interaction,
  };
};
