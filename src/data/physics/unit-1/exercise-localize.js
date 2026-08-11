import { assertSupportedLocale } from "../../../i18n/config.js";
import { t } from "../../../i18n/index.js";
import { UNIT_1_EXERCISES } from "./exercises.js";
import exercisesEn from "./i18n/exercises.en.js";
import { getLocalizedUnit1ExerciseFamilies } from "./family-localize.js";

const requireTranslation = (value, context) => {
  if (value === undefined || value === null || value === "") {
    throw new RangeError(`Missing English Unit 1 exercise translation: ${context}`);
  }
  return value;
};

const requireParallelArray = (source, translation, context) => {
  if (!Array.isArray(translation) || translation.length !== source.length) {
    throw new RangeError(`English Unit 1 exercise translation changed structure: ${context}`);
  }
  return translation;
};

const localizeInteraction = (interaction, translation, exerciseId) => {
  if (!interaction) return interaction;
  if (interaction.kind === "singleChoice") {
    const contents = requireParallelArray(
      interaction.options,
      translation.options,
      `${exerciseId}.options`,
    );
    return {
      ...interaction,
      options: interaction.options.map((option, index) => ({
        ...option,
        content: requireTranslation(contents[index], `${exerciseId}.options.${option.id}`),
      })),
      correctOptionId: interaction.correctOptionId,
    };
  }

  const fields = interaction.kind === "number" ? [interaction.field] : interaction.fields;
  const labels = requireParallelArray(fields, translation.fields, `${exerciseId}.fields`);
  const localized = fields.map((field, index) => ({
    ...field,
    label: requireTranslation(labels[index], `${exerciseId}.fields.${field.id}`),
    unitLabel: field.unit === "sin unidad" || field.unit === "adimensional"
      ? "dimensionless"
      : field.unit === "unidades"
        ? "units"
        : field.unit === "s y m"
          ? "s and m"
          : field.unit === "° al oeste del norte"
            ? "° west of north"
          : field.unit,
  }));
  return interaction.kind === "number"
    ? { ...interaction, field: localized[0] }
    : { ...interaction, fields: localized };
};

// The projection replaces presentation only. Machine answers, option identity,
// units, tolerance, and every grading field remain sourced from the ES record.
export const localizeUnit1Exercise = (exercise, locale) => {
  assertSupportedLocale(locale);
  if (!exercise || locale === "es") return exercise;
  const translation = requireTranslation(exercisesEn[exercise.id], exercise?.id);
  const objectives = requireParallelArray(exercise.objectives, translation.objectives, `${exercise.id}.objectives`);
  const prerequisites = requireParallelArray(exercise.prerequisites, translation.prerequisites ?? [], `${exercise.id}.prerequisites`);
  const hints = requireParallelArray(exercise.hints, translation.hints, `${exercise.id}.hints`);
  const solution = requireParallelArray(exercise.solution, translation.solution, `${exercise.id}.solution`)
    .map((step, index) => ({
      ...exercise.solution[index],
      title: requireTranslation(step.title, `${exercise.id}.solution.${index}.title`),
      text: requireTranslation(step.text, `${exercise.id}.solution.${index}.text`),
    }));
  const answerDisplay = translation.answerDisplay;

  return {
    ...exercise,
    title: requireTranslation(translation.title, `${exercise.id}.title`),
    prompt: requireTranslation(translation.prompt, `${exercise.id}.prompt`),
    objectives,
    prerequisites,
    hints,
    solution,
    answer: {
      ...exercise.answer,
      ...(exercise.answer.kind === "text"
        ? { presentation: requireTranslation(answerDisplay, `${exercise.id}.answerDisplay`) }
        : answerDisplay
          ? { display: answerDisplay }
          : {}),
    },
    interaction: localizeInteraction(exercise.interaction, translation, exercise.id),
    feedback: {
      ...exercise.feedback,
      correct: t(locale, "exercise.feedback.correct"),
      incorrect: translation.incorrect ?? t(locale, "exercise.feedback.incorrect"),
      commonErrors: Object.fromEntries(Object.keys(exercise.feedback.commonErrors).map((errorId) => [
        errorId,
        requireTranslation(translation.commonErrorFeedback?.[errorId], `${exercise.id}.feedback.${errorId}`),
      ])),
    },
  };
};

export const getLocalizedUnit1Exercises = (locale) =>
  UNIT_1_EXERCISES.map((exercise) => localizeUnit1Exercise(exercise, locale));

export const getLocalizedUnit1BankItems = (locale) => [
  ...getLocalizedUnit1Exercises(locale),
  ...getLocalizedUnit1ExerciseFamilies(locale),
];

export {
  generateLocalizedUnit1FamilyInstance,
  getLocalizedUnit1ExerciseFamilies,
  localizeUnit1ExerciseFamily,
} from "./family-localize.js";
