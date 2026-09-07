import { assertSupportedLocale } from "../../i18n/config.js";

const ENGLISH_UNIT_LABELS = Object.freeze({
  "adimensional": "dimensionless",
  "unidades": "units",
  "misma unidad de A": "same unit as A",
  "unidad de A": "unit of A",
  "rad o °": "rad or °",
  "m/s² o N/kg": "m/s² or N/kg",
});

export const localizeAcademicUnitLabel = (label, locale) => {
  assertSupportedLocale(locale);
  if (locale === "es" || typeof label !== "string") return label;
  if (ENGLISH_UNIT_LABELS[label]) return ENGLISH_UNIT_LABELS[label];
  return label
    .replaceAll("sin unidad", "dimensionless")
    .replaceAll("adimensional", "dimensionless")
    .replaceAll("grados", "degrees")
    .replaceAll(" al oeste del norte", " west of north")
    .replaceAll(" y ", " and ")
    .replaceAll(" o ", " or ");
};

export const localizeAcademicExerciseUnitLabels = (exercise, locale) => {
  assertSupportedLocale(locale);
  if (!exercise || locale === "es") return exercise;
  const localizeField = (field) => ({
    ...field,
    unitLabel: localizeAcademicUnitLabel(field.unitLabel ?? field.unit, locale),
  });
  const interaction = exercise.interaction?.kind === "number"
    ? { ...exercise.interaction, field: localizeField(exercise.interaction.field) }
    : exercise.interaction?.kind === "multiNumber"
      ? { ...exercise.interaction, fields: exercise.interaction.fields.map(localizeField) }
      : exercise.interaction;
  return {
    ...exercise,
    interaction,
  };
};
