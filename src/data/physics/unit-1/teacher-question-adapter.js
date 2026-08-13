import { assertSupportedLocale } from "../../../i18n/config.js";
import { validateTeacherQuestion } from "../../../utils/question-pack.js";

// This projection is the only bridge from Teacher Question 2.0 to the public
// exercise contract. It derives localized display fields without copying or
// changing machine answers, field IDs, option IDs, tolerances, or grading.
export const teacherQuestionToExercise = (question, locale) => {
  assertSupportedLocale(locale);
  const validation = validateTeacherQuestion(question);
  if (!validation.valid) throw new TypeError(validation.errors.join(" "));
  const presentation = question.presentations[locale];
  const fieldLabels = new Map(presentation.fields.map((field) => [field.id, field.label]));
  const optionContent = new Map(presentation.options.map((option) => [option.id, option.content]));

  let interaction;
  let answer;
  if (question.interaction.kind === "singleChoice") {
    interaction = {
      ...question.interaction,
      options: question.interaction.options.map(({ id }) => ({ id, content: optionContent.get(id) })),
    };
    answer = {
      kind: "text",
      value: optionContent.get(question.answer.optionId),
      presentation: presentation.answerDisplay ?? optionContent.get(question.answer.optionId),
    };
  } else if (question.interaction.kind === "number") {
    interaction = {
      ...question.interaction,
      field: {
        ...question.interaction.field,
        label: fieldLabels.get(question.interaction.field.id),
      },
    };
    answer = {
      ...question.answer,
      display: presentation.answerDisplay ?? `${question.answer.value}${question.interaction.field.unit ? ` ${question.interaction.field.unit}` : ""}`,
    };
  } else {
    interaction = {
      ...question.interaction,
      fields: question.interaction.fields.map((field) => ({ ...field, label: fieldLabels.get(field.id) })),
    };
    answer = {
      kind: "values",
      values: question.answer.values.map((entry) => {
        const field = question.interaction.fields.find((candidate) => candidate.id === entry.fieldId);
        return {
          symbol: fieldLabels.get(entry.fieldId),
          value: entry.value,
          tolerance: entry.tolerance,
          unit: field?.unit ?? "",
        };
      }),
    };
  }

  return {
    ...question,
    title: presentation.title,
    prompt: presentation.prompt,
    objectives: presentation.objectives,
    hints: presentation.hints,
    solution: presentation.solution,
    interaction,
    answer,
    feedback: presentation.feedback,
  };
};
