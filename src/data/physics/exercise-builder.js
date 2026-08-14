import { t } from "../../i18n/index.js";

const numericInteraction = (exercise, locale) => {
  if (exercise.answer?.kind === "number") {
    return {
      kind: "number",
      field: { id: "value", label: t(locale, "exercise.answer"), unit: exercise.expectedUnit },
    };
  }
  if (exercise.answer?.kind === "values") {
    return {
      kind: "multiNumber",
      fields: exercise.answer.values.map((value, index) => ({
        id: `value-${index + 1}`,
        label: value.symbol,
        unit: value.unit ?? exercise.expectedUnit,
      })),
    };
  }
  return null;
};

export const singleChoiceInteraction = (options, correctOptionId) => ({
  kind: "singleChoice",
  options: options.map((option) =>
    Array.isArray(option) ? { id: option[0], content: option[1] } : option
  ),
  correctOptionId,
});

export const numberInteraction = (label, unit) => ({
  kind: "number",
  field: { id: "value", label, unit },
});

export const multiNumberInteraction = (fields) => ({
  kind: "multiNumber",
  fields: fields.map((field) =>
    Array.isArray(field) ? { id: field[0], label: field[1], unit: field[2] } : field
  ),
});

export const createAcademicExercise = (
  exercise,
  { unit, locale = "es", bonusByDefault = false } = {}
) => {
  if (!Number.isInteger(unit) || unit < 1) {
    throw new TypeError("Cada ejercicio académico requiere una unidad positiva.");
  }
  const automaticallyEligible = ["number", "values"].includes(exercise.answer?.kind);
  const bonusEligible = exercise.bonusEligible ?? (bonusByDefault && automaticallyEligible);
  const interaction = exercise.interaction ?? (
    bonusEligible ? numericInteraction(exercise, locale) : null
  );
  const baseModalities = exercise.modalities ?? ["practice", "selfAssessment"];
  const modalities = bonusEligible
    ? [...new Set([...baseModalities, "bonus"])]
    : baseModalities;
  const defaultFeedback = {
    correct: t(locale, "exercise.feedback.correct"),
    incorrect: t(locale, "exercise.feedback.incorrect"),
    commonErrors: {},
  };

  const built = {
    itemKind: "fixed",
    authorSource: "editorial",
    unit,
    modalities,
    prerequisites: [],
    objectives: [],
    estimatedMinutes: 5,
    tolerance: null,
    expectedUnit: null,
    hints: [],
    commonErrors: [],
    parameterizable: false,
    purpose: "learning",
    exposure: "public",
    status: "review",
    version: 1,
    ...exercise,
    unit,
    modalities,
    bonusEligible,
    interaction,
    feedback: {
      ...defaultFeedback,
      ...exercise.feedback,
      commonErrors: {
        ...defaultFeedback.commonErrors,
        ...exercise.feedback?.commonErrors,
      },
    },
  };
  return Object.fromEntries(Object.entries(built).filter(([, value]) => value !== undefined));
};
