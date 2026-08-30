import { assertSupportedLocale } from "../../../i18n/config.js";
import { t } from "../../../i18n/index.js";
import { UNIT_3_EXERCISES } from "./exercises.js";
import exercisesEn from "./i18n/exercises.en.js";
import { getLocalizedUnit3ExerciseFamilies } from "./family-localize.js";
import { localizeAcademicUnitLabel } from "../localize-unit-label.js";

const required = (value, context) => { if (value == null || value === "") throw new RangeError(`Missing English Unit 3 exercise translation: ${context}`); return value; };
const parallel = (source, translated, context) => { if (!Array.isArray(translated) || source.length !== translated.length) throw new RangeError(`English Unit 3 exercise translation changed structure: ${context}`); return translated; };
const localizeInteraction = (interaction, translated, id) => {
  if (interaction.kind === "singleChoice") { const options = parallel(interaction.options, translated.options, `${id}.options`); return { ...interaction, options: interaction.options.map((option, index) => ({ ...option, content: required(options[index], `${id}.options.${option.id}`) })) }; }
  const fields = interaction.kind === "number" ? [interaction.field] : interaction.fields; const labels = parallel(fields, translated.fields, `${id}.fields`); const localized = fields.map((field, index) => ({ ...field, label: required(labels[index], `${id}.fields.${field.id}`) }));
  return interaction.kind === "number" ? { ...interaction, field: localized[0] } : { ...interaction, fields: localized };
};
export const localizeUnit3Exercise = (exercise, locale) => {
  assertSupportedLocale(locale); if (!exercise || locale === "es") return exercise; const translated = required(exercisesEn[exercise.id], exercise.id); const translatedSolution = parallel(exercise.solution, translated.solution, `${exercise.id}.solution`);
  return { ...exercise, title: translated.title, prompt: translated.prompt, objectives: parallel(exercise.objectives, translated.objectives, `${exercise.id}.objectives`), prerequisites: parallel(exercise.prerequisites, translated.prerequisites, `${exercise.id}.prerequisites`), hints: parallel(exercise.hints, translated.hints, `${exercise.id}.hints`), solution: exercise.solution.map((step, index) => ({ ...step, title: translatedSolution[index].title, text: translatedSolution[index].text })), answer: { ...exercise.answer, ...(exercise.answer.kind === "text" ? { presentation: translated.answerDisplay } : translated.answerDisplay ? { display: translated.answerDisplay } : {}) }, expectedUnit: localizeAcademicUnitLabel(exercise.expectedUnit, locale), interaction: localizeInteraction(exercise.interaction, translated, exercise.id), feedback: { ...exercise.feedback, correct: t(locale, "exercise.feedback.correct"), incorrect: t(locale, "exercise.feedback.incorrect") } };
};
export const getLocalizedUnit3Exercises = (locale) => UNIT_3_EXERCISES.map((exercise) => localizeUnit3Exercise(exercise, locale));
export const getLocalizedUnit3BankItems = (locale) => [...getLocalizedUnit3Exercises(locale), ...getLocalizedUnit3ExerciseFamilies(locale)];
export { generateLocalizedUnit3FamilyInstance } from "./family-localize.js";
