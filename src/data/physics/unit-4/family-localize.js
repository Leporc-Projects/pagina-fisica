import { assertSupportedLocale } from "../../../i18n/config.js";
import { t } from "../../../i18n/index.js";
import { generateFamilyInstance } from "../../../utils/exercise-families.js";
import { UNIT_4_EXERCISE_FAMILIES } from "./families.js";
import { FAMILY_OBJECTIVES_EN, FAMILY_PRESENTERS_EN } from "./i18n/families.en.js";

const required = (value, context) => {
  if (value == null || value === "") throw new RangeError(`Missing English Unit 4 family translation: ${context}`);
  return value;
};
const parallel = (source, translated, context) => {
  if (!Array.isArray(translated) || source.length !== translated.length) throw new RangeError(`English Unit 4 family translation changed structure: ${context}`);
  return translated;
};

export const localizeUnit4ExerciseFamily = (family, locale) => {
  assertSupportedLocale(locale);
  if (!family || locale === "es") return family;
  return {
    ...family,
    objectives: parallel(family.objectives, required(FAMILY_OBJECTIVES_EN[family.id], `${family.id}.objectives`), `${family.id}.objectives`),
    feedback: { ...family.feedback, correct: t(locale, "exercise.familyFeedback.correct"), incorrect: t(locale, "exercise.familyFeedback.incorrect") },
  };
};

export const getLocalizedUnit4ExerciseFamilies = (locale) => UNIT_4_EXERCISE_FAMILIES.map((family) => localizeUnit4ExerciseFamily(family, locale));

const localizeInstance = (instance, locale) => {
  if (locale === "es") return instance;
  const translated = required(FAMILY_PRESENTERS_EN[instance.familyId], `${instance.familyId}.presenter`)(instance);
  const family = localizeUnit4ExerciseFamily(UNIT_4_EXERCISE_FAMILIES.find((candidate) => candidate.id === instance.familyId), locale);
  const solution = parallel(instance.solution, translated.solution, `${instance.familyId}.solution`);
  const fields = instance.interaction.kind === "number" ? [instance.interaction.field] : instance.interaction.fields;
  const labels = parallel(fields, translated.fields, `${instance.familyId}.fields`);
  const localizedFields = fields.map((field, index) => ({ ...field, label: labels[index] }));
  const interaction = instance.interaction.kind === "number"
    ? { ...instance.interaction, field: localizedFields[0] }
    : { ...instance.interaction, fields: localizedFields };
  return {
    ...instance,
    objectives: family.objectives,
    title: translated.title,
    prompt: translated.prompt,
    hints: parallel(instance.hints, translated.hints, `${instance.familyId}.hints`),
    solution: instance.solution.map((step, index) => ({ ...step, title: ["Model", "Representation", "Calculation", "Interpretation"][index] ?? `Step ${index + 1}`, text: solution[index] })),
    answer: { ...instance.answer, ...(translated.answerDisplay ? { display: translated.answerDisplay } : {}) },
    interaction,
    feedback: family.feedback,
  };
};

export const generateLocalizedUnit4FamilyInstance = (family, locale, options = {}) => {
  assertSupportedLocale(locale);
  return localizeInstance(generateFamilyInstance(family, options), locale);
};
