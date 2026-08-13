import { teacherQuestionToExercise } from "../data/physics/unit-1/teacher-question-adapter.js";
import { t } from "../i18n/index.js";
import {
  createQuestionPack,
  createTeacherQuestionId,
  normalizeTeacherQuestion,
  questionPackFilename,
  toQuestionPackJSON,
  validateQuestionPack,
  validateTeacherQuestion,
} from "../utils/question-pack.js";
import { formatQuestionIssues } from "../utils/question-pack-issues.js";
import { downloadLocalFile } from "./local-export.js";

const PRESENTATION_LOCALES = ["es", "en"];
const lines = (entry) => String(entry ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const value = (form, name) => String(form.elements.namedItem(name)?.value ?? "").trim();
const numericValue = (form, name) => {
  const raw = value(form, name);
  return raw === "" ? Number.NaN : Number(raw);
};
const create = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};

const readSolution = (form, locale) => [1, 2, 3].map((index) => ({
  title: value(form, `solutionTitle-${locale}-${index}`),
  text: value(form, `solutionText-${locale}-${index}`),
})).filter((step) => step.title || step.text);

const buildInteraction = (form) => {
  const kind = value(form, "interactionKind");
  if (kind === "singleChoice") {
    const options = ["a", "b", "c", "d"].map((id) => ({ id }));
    const correctOptionId = value(form, "correctOption");
    return {
      interaction: { kind, options, correctOptionId },
      answer: { kind: "choice", optionId: correctOptionId },
      tolerance: null,
      expectedUnit: "",
      presentationFields: Object.fromEntries(PRESENTATION_LOCALES.map((locale) => [locale, {
        options: options.map(({ id }) => ({ id, content: value(form, `option-${locale}-${id}`) })),
        fields: [],
      }])),
    };
  }
  if (kind === "number") {
    const unit = value(form, "numberUnit");
    return {
      interaction: { kind, field: { id: "value", unit } },
      answer: { kind: "number", value: numericValue(form, "numberValue") },
      tolerance: numericValue(form, "numberTolerance"),
      expectedUnit: unit,
      presentationFields: Object.fromEntries(PRESENTATION_LOCALES.map((locale) => [locale, {
        options: [],
        fields: [{ id: "value", label: value(form, `numberLabel-${locale}`) }],
      }])),
    };
  }

  const rows = [1, 2, 3].map((index) => ({
    id: `value-${index}`,
    labels: Object.fromEntries(PRESENTATION_LOCALES.map((locale) => [locale, value(form, `multiLabel-${locale}-${index}`)])),
    value: numericValue(form, `multiValue-${index}`),
    unit: value(form, `multiUnit-${index}`),
    tolerance: numericValue(form, `multiTolerance-${index}`),
  })).filter((row) => Object.values(row.labels).some(Boolean) || Number.isFinite(row.value) || row.unit);
  return {
    interaction: { kind, fields: rows.map(({ id, unit }) => ({ id, unit })) },
    answer: { kind: "values", values: rows.map(({ id, value: answerValue, tolerance }) => ({ fieldId: id, value: answerValue, tolerance })) },
    tolerance: null,
    expectedUnit: "",
    presentationFields: Object.fromEntries(PRESENTATION_LOCALES.map((locale) => [locale, {
      options: [],
      fields: rows.map(({ id, labels }) => ({ id, label: labels[locale] })),
    }])),
  };
};

const readQuestion = (form, id) => {
  const structure = buildInteraction(form);
  const selectedErrors = form.elements.namedItem("commonErrors");
  const presentations = Object.fromEntries(PRESENTATION_LOCALES.map((locale) => [locale, {
    title: value(form, `title-${locale}`),
    prompt: value(form, `prompt-${locale}`),
    objectives: lines(value(form, `objectives-${locale}`)),
    hints: lines(value(form, `hints-${locale}`)),
    solution: readSolution(form, locale),
    feedback: {
      correct: value(form, `feedbackCorrect-${locale}`) || undefined,
      incorrect: value(form, `feedbackIncorrect-${locale}`) || undefined,
    },
    ...structure.presentationFields[locale],
  }]));
  return normalizeTeacherQuestion({
    id,
    topic: value(form, "topic"),
    subtopic: value(form, "subtopic"),
    type: value(form, "type"),
    representation: value(form, "representation"),
    cognitiveLevel: value(form, "cognitiveLevel"),
    difficulty: numericValue(form, "difficulty"),
    modalities: [...form.querySelectorAll('[name="modalities"]:checked')].map((control) => control.value),
    commonErrors: selectedErrors instanceof HTMLSelectElement ? [...selectedErrors.selectedOptions].map((option) => option.value) : [],
    requiresEditorialMath: form.elements.namedItem("requiresEditorialMath")?.checked === true,
    presentations,
    ...structure,
  });
};

const renderErrors = (target, issues, locale) => {
  target.replaceChildren();
  if (issues.length === 0) return;
  target.append(create("strong", t(locale, "teacher.bank.reviewFields")));
  const list = create("ul");
  formatQuestionIssues(issues, locale).forEach((error) => list.append(create("li", error)));
  target.append(list);
};

const renderPreview = (panel, question, previewLocale, uiLocale) => {
  const card = panel.querySelector("[data-preview-card]");
  if (!(card instanceof HTMLElement)) return;
  const exercise = teacherQuestionToExercise(question, previewLocale);
  card.replaceChildren();
  const header = create("header", undefined, "exercise-card__header");
  const heading = create("div");
  heading.append(create("p", t(uiLocale, "teacher.bank.exercise"), "academic-label"));
  const title = create("h3", exercise.title);
  title.id = "teacher-question-preview-title";
  heading.append(title);
  const meta = create("dl", undefined, "exercise-card__meta");
  [
    [t(uiLocale, "teacher.bank.metaType"), t(uiLocale, `teacher.bank.type.${question.type}`)],
    [t(uiLocale, "teacher.bank.metaDifficulty"), `${question.difficulty}/5`],
    [t(uiLocale, "teacher.bank.metaStatus"), t(uiLocale, "teacher.bank.draft")],
  ].forEach(([label, entry]) => {
    const group = create("div");
    group.append(create("dt", label), create("dd", entry));
    meta.append(group);
  });
  header.append(heading, meta);
  card.append(header, create("p", exercise.prompt, "exercise-card__prompt"));
  const answer = create("fieldset", undefined, "bank-preview__answer");
  answer.append(create("legend", t(uiLocale, "teacher.bank.response")));
  if (exercise.interaction.kind === "singleChoice") {
    exercise.interaction.options.forEach((option) => {
      const label = create("label");
      const input = create("input");
      input.type = "radio";
      input.disabled = true;
      label.append(input, create("span", option.content));
      answer.append(label);
    });
  } else {
    const fields = exercise.interaction.kind === "number" ? [exercise.interaction.field] : exercise.interaction.fields;
    fields.forEach((field) => {
      const label = create("label");
      label.append(create("span", field.label));
      const input = create("input");
      input.type = "text";
      input.disabled = true;
      label.append(input);
      if (field.unit) label.append(create("small", field.unit));
      answer.append(label);
    });
  }
  card.append(answer);
  if (exercise.hints.length > 0) {
    const hints = create("details", undefined, "exercise-card__hint");
    hints.append(create("summary", t(uiLocale, "teacher.bank.requestHint")));
    const list = create("ul");
    exercise.hints.forEach((hint) => list.append(create("li", hint)));
    hints.append(list);
    card.append(hints);
  }
  const solution = create("details", undefined, "exercise-card__solution");
  solution.open = true;
  solution.append(create("summary", t(uiLocale, "teacher.bank.reviewSolution")));
  const steps = create("ol");
  exercise.solution.forEach((step) => {
    const item = create("li");
    item.append(create("strong", step.title), create("p", step.text));
    steps.append(item);
  });
  solution.append(steps);
  card.append(solution);
  panel.hidden = false;
  panel.querySelector("h2")?.focus({ preventScroll: true });
};

export const initializeQuestionBankEditor = () => {
  const root = document.querySelector("[data-bank-editor]");
  if (!(root instanceof HTMLElement) || root.dataset.initialized === "true") return;
  root.dataset.initialized = "true";
  const locale = root.dataset.locale === "en" ? "en" : "es";
  const form = root.querySelector("[data-question-form]");
  const errors = root.querySelector("[data-editor-errors]");
  const preview = root.querySelector("[data-bank-preview]");
  const list = root.querySelector("[data-pack-list]");
  const empty = root.querySelector("[data-pack-empty]");
  const exportButton = root.querySelector("[data-export-pack]");
  const status = root.querySelector("[data-editor-status]");
  if (!(form instanceof HTMLFormElement) || !(errors instanceof HTMLElement) || !(preview instanceof HTMLElement) || !(list instanceof HTMLElement)) return;

  let questions = [];
  let currentId = createTeacherQuestionId(value(form, "topic"));
  let currentQuestion = null;
  let previewLocale = "es";

  const updatePanels = () => {
    const selected = value(form, "interactionKind");
    root.querySelectorAll("[data-interaction-panel]").forEach((panel) => {
      if (panel instanceof HTMLElement) panel.hidden = panel.dataset.interactionPanel !== selected;
    });
  };
  const validateCurrent = () => {
    currentQuestion = readQuestion(form, currentId);
    const validation = validateTeacherQuestion(currentQuestion, { existingIds: questions.map((question) => question.id) });
    renderErrors(errors, validation.issues, locale);
    return validation;
  };
  const renderPack = () => {
    list.replaceChildren();
    questions.forEach((question, index) => {
      const item = create("li");
      item.append(create("span", `${question.presentations[locale].title} · ${question.topic}`));
      const remove = create("button", t(locale, "teacher.bank.remove"));
      remove.type = "button";
      remove.addEventListener("click", () => { questions = questions.filter((_, questionIndex) => questionIndex !== index); renderPack(); });
      item.append(remove);
      list.append(item);
    });
    if (empty instanceof HTMLElement) empty.hidden = questions.length > 0;
    if (exportButton instanceof HTMLButtonElement) exportButton.disabled = questions.length === 0;
  };

  root.querySelector("[data-interaction-kind]")?.addEventListener("change", updatePanels);
  root.querySelectorAll('[name="previewLocale"]').forEach((control) => control.addEventListener("change", () => {
    previewLocale = control.value === "en" ? "en" : "es";
    if (currentQuestion && !preview.hidden) renderPreview(preview, currentQuestion, previewLocale, locale);
  }));
  root.querySelector("[data-preview-question]")?.addEventListener("click", () => {
    if (validateCurrent().valid) renderPreview(preview, currentQuestion, previewLocale, locale);
  });
  root.querySelector("[data-add-question]")?.addEventListener("click", () => {
    if (!validateCurrent().valid) return;
    renderPreview(preview, currentQuestion, previewLocale, locale);
    questions = [...questions, currentQuestion];
    renderPack();
    if (status) status.textContent = t(locale, "teacher.bank.added");
    currentId = createTeacherQuestionId(value(form, "topic"));
  });
  form.elements.namedItem("topic")?.addEventListener("change", () => { currentId = createTeacherQuestionId(value(form, "topic")); });
  exportButton?.addEventListener("click", () => {
    const pack = createQuestionPack(questions);
    const validation = validateQuestionPack(pack);
    if (!validation.valid) return renderErrors(errors, validation.issues, locale);
    downloadLocalFile({ contents: toQuestionPackJSON(pack), mimeType: "application/json;charset=utf-8", filename: questionPackFilename(pack) });
    if (status) status.textContent = t(locale, "teacher.bank.exported");
  });
  updatePanels();
  renderPack();
};
