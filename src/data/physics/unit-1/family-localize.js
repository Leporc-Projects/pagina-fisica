import { assertSupportedLocale } from "../../../i18n/config.js";
import { t } from "../../../i18n/index.js";
import { generateFamilyInstance } from "../../../utils/exercise-families.js";
import { localizeAcademicExerciseUnitLabels } from "../localize-unit-label.js";
import { UNIT_1_EXERCISE_FAMILIES } from "./families.js";
import { FAMILY_OBJECTIVES_EN, FAMILY_PRESENTERS_EN } from "./i18n/families.en.js";

const requireTranslation = (value, context) => {
  if (value === undefined || value === null || value === "") {
    throw new RangeError(`Missing English Unit 1 family translation: ${context}`);
  }
  return value;
};

const requireParallelArray = (source, translation, context) => {
  if (!Array.isArray(translation) || translation.length !== source.length) {
    throw new RangeError(`English Unit 1 family translation changed structure: ${context}`);
  }
  return translation;
};

export const localizeUnit1ExerciseFamily = (family, locale) => {
  assertSupportedLocale(locale);
  if (!family || locale === "es") return family;
  return {
    ...family,
    objectives: requireParallelArray(family.objectives, requireTranslation(FAMILY_OBJECTIVES_EN[family.id], `${family.id}.objectives`), `${family.id}.objectives`),
    feedback: { ...family.feedback, correct: t(locale, "exercise.familyFeedback.correct"), incorrect: t(locale, "exercise.familyFeedback.incorrect") },
  };
};

export const getLocalizedUnit1ExerciseFamilies = (locale) =>
  UNIT_1_EXERCISE_FAMILIES.map((family) => localizeUnit1ExerciseFamily(family, locale));

const localizeFamilyInstancePresentation = (instance, locale) => {
  if (locale === "es") return instance;
  const unitLocalized = localizeAcademicExerciseUnitLabels(instance, locale);
  const presenter = requireTranslation(FAMILY_PRESENTERS_EN[instance.familyId], `${instance.familyId}.presenter`);
  const translation = presenter(unitLocalized);
  const translatedFamily = localizeUnit1ExerciseFamily(UNIT_1_EXERCISE_FAMILIES.find((family) => family.id === instance.familyId), locale);
  const hints = requireParallelArray(unitLocalized.hints, translation.hints, `${instance.familyId}.hints`);
  const solutionTexts = requireParallelArray(unitLocalized.solution, translation.solution, `${instance.familyId}.solution`);
  const interaction = unitLocalized.interaction.kind === "singleChoice"
    ? {
        ...unitLocalized.interaction,
        options: unitLocalized.interaction.options.map((option, index) => ({ ...option, content: requireTranslation(translation.options?.[index], `${instance.familyId}.options.${option.id}`) })),
        correctOptionId: unitLocalized.interaction.correctOptionId,
      }
    : (() => {
        const fields = unitLocalized.interaction.kind === "number" ? [unitLocalized.interaction.field] : unitLocalized.interaction.fields;
        const labels = requireParallelArray(fields, translation.fields, `${instance.familyId}.fields`);
        const localizedFields = fields.map((field, index) => ({ ...field, label: requireTranslation(labels[index], `${instance.familyId}.fields.${field.id}`) }));
        return unitLocalized.interaction.kind === "number" ? { ...unitLocalized.interaction, field: localizedFields[0] } : { ...unitLocalized.interaction, fields: localizedFields };
      })();

  return {
    ...unitLocalized,
    objectives: translatedFamily.objectives,
    title: requireTranslation(translation.title, `${instance.familyId}.title`),
    prompt: requireTranslation(translation.prompt, `${instance.familyId}.prompt`),
    hints,
    solution: unitLocalized.solution.map((step, index) => ({ ...step, title: ["Model", "Calculation", "Result", "Check"][index] ?? `Step ${index + 1}`, text: requireTranslation(solutionTexts[index], `${instance.familyId}.solution.${index}`) })),
    answer: { ...unitLocalized.answer, ...(unitLocalized.answer.kind === "text" ? { presentation: requireTranslation(translation.answerDisplay, `${instance.familyId}.answerDisplay`) } : translation.answerDisplay ? { display: translation.answerDisplay } : {}) },
    interaction,
    feedback: translatedFamily.feedback,
  };
};

// Generation always runs once against the invariant family; locale is applied
// only after parameters, answers, units, and grading metadata have been fixed.
export const generateLocalizedUnit1FamilyInstance = (family, locale, options = {}) => {
  assertSupportedLocale(locale);
  return localizeFamilyInstancePresentation(generateFamilyInstance(family, options), locale);
};
