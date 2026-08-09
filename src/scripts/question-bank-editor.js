import {
  createQuestionPack,
  createTeacherQuestionId,
  normalizeTeacherQuestion,
  questionPackFilename,
  toQuestionPackJSON,
  validateQuestionPack,
  validateTeacherQuestion,
} from "../utils/question-pack.js";
import { downloadLocalFile } from "./local-export.js";

const lines = (value) => String(value ?? "").split(/\r?\n/)
  .map((line) => line.trim()).filter(Boolean);
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
const TYPE_LABELS = {
  conceptual: "Conceptual",
  numerical: "Numérico",
  graphical: "Gráfico",
  symbolic: "Simbólico",
  estimation: "Estimación",
  application: "Aplicación",
  integrative: "Integrador",
};

const buildInteraction = (form) => {
  const kind = value(form, "interactionKind");
  if (kind === "singleChoice") {
    const options = ["a", "b", "c", "d"]
      .map((id) => ({ id, content: value(form, `option-${id}`) }))
      .filter((option) => option.content);
    const correctOptionId = value(form, "correctOption");
    return {
      interaction: { kind, options, correctOptionId },
      answer: {
        kind: "text",
        value: options.find((option) => option.id === correctOptionId)?.content ?? "",
      },
      tolerance: null,
      expectedUnit: "",
    };
  }
  if (kind === "number") {
    const unit = value(form, "numberUnit");
    const answerValue = numericValue(form, "numberValue");
    return {
      interaction: { kind, field: { id: "value", label: "Respuesta", unit } },
      answer: { kind: "number", value: answerValue, display: `${answerValue}${unit ? ` ${unit}` : ""}` },
      tolerance: numericValue(form, "numberTolerance"),
      expectedUnit: unit,
    };
  }

  const rows = [1, 2, 3].map((index) => ({
    id: `value-${index}`,
    label: value(form, `multiLabel-${index}`),
    value: numericValue(form, `multiValue-${index}`),
    unit: value(form, `multiUnit-${index}`),
    tolerance: numericValue(form, `multiTolerance-${index}`),
  })).filter((row) => row.label || Number.isFinite(row.value) || row.unit);
  return {
    interaction: { kind, fields: rows.map(({ id, label, unit }) => ({ id, label, unit })) },
    answer: { kind: "values", values: rows.map(({ label, value: answerValue, unit, tolerance }) => ({ symbol: label, value: answerValue, unit, tolerance })) },
    tolerance: 0,
    expectedUnit: "",
  };
};

const readQuestion = (form, id) => {
  const interaction = buildInteraction(form);
  const selectedErrors = form.elements.namedItem("commonErrors");
  return normalizeTeacherQuestion({
    id,
    topic: value(form, "topic"),
    subtopic: value(form, "subtopic"),
    title: value(form, "title"),
    prompt: value(form, "prompt"),
    type: value(form, "type"),
    representation: value(form, "representation"),
    cognitiveLevel: value(form, "cognitiveLevel"),
    difficulty: numericValue(form, "difficulty"),
    modalities: [...form.querySelectorAll('[name="modalities"]:checked')]
      .map((control) => control.value),
    objectives: lines(value(form, "objectives")),
    hints: lines(value(form, "hints")),
    commonErrors: selectedErrors instanceof HTMLSelectElement
      ? [...selectedErrors.selectedOptions].map((option) => option.value)
      : [],
    solution: [1, 2, 3].map((index) => ({
      title: value(form, `solutionTitle-${index}`),
      text: value(form, `solutionText-${index}`),
    })),
    requiresEditorialMath: form.elements.namedItem("requiresEditorialMath")?.checked === true,
    feedback: {
      correct: value(form, "feedbackCorrect") || undefined,
      incorrect: value(form, "feedbackIncorrect") || undefined,
    },
    ...interaction,
  });
};

const renderErrors = (target, errors) => {
  target.replaceChildren();
  if (errors.length === 0) return;
  target.append(create("strong", "Revisa estos campos:"));
  const list = create("ul");
  errors.forEach((error) => list.append(create("li", error)));
  target.append(list);
};

const renderPreview = (panel, question) => {
  const card = panel.querySelector("[data-preview-card]");
  if (!(card instanceof HTMLElement)) return;
  card.replaceChildren();
  const header = create("header", undefined, "exercise-card__header");
  const heading = create("div");
  heading.append(create("p", "Ejercicio para explorar", "academic-label"));
  const title = create("h3", question.title);
  title.id = "teacher-question-preview-title";
  heading.append(title);
  const meta = create("dl", undefined, "exercise-card__meta");
  [["Tipo", TYPE_LABELS[question.type] ?? question.type], ["Dificultad", `${question.difficulty}/5`], ["Estado", "Borrador"]]
    .forEach(([label, entry]) => {
      const group = create("div");
      group.append(create("dt", label), create("dd", entry));
      meta.append(group);
    });
  header.append(heading, meta);
  card.append(header, create("p", question.prompt, "exercise-card__prompt"));

  const answer = create("fieldset", undefined, "bank-preview__answer");
  answer.append(create("legend", "Respuesta"));
  if (question.interaction.kind === "singleChoice") {
    question.interaction.options.forEach((option) => {
      const label = create("label");
      const input = create("input");
      input.type = "radio"; input.disabled = true;
      label.append(input, create("span", option.content));
      answer.append(label);
    });
  } else {
    const fields = question.interaction.kind === "number"
      ? [question.interaction.field]
      : question.interaction.fields;
    fields.forEach((field) => {
      const label = create("label");
      label.append(create("span", field.label));
      const input = create("input");
      input.type = "text"; input.disabled = true;
      label.append(input);
      if (field.unit) label.append(create("small", field.unit));
      answer.append(label);
    });
  }
  card.append(answer);

  if (question.hints.length > 0) {
    const hints = create("details", undefined, "exercise-card__hint");
    hints.append(create("summary", "Solicitar una pista"));
    const list = create("ul");
    question.hints.forEach((hint) => list.append(create("li", hint)));
    hints.append(list); card.append(hints);
  }
  const solution = create("details", undefined, "exercise-card__solution");
  solution.open = true;
  solution.append(create("summary", "Revisar solución"));
  const steps = create("ol");
  question.solution.forEach((step) => {
    const item = create("li");
    item.append(create("strong", step.title), create("p", step.text));
    steps.append(item);
  });
  solution.append(steps); card.append(solution);
  panel.hidden = false;
  panel.querySelector("h2")?.focus({ preventScroll: true });
};

export const initializeQuestionBankEditor = () => {
  const root = document.querySelector("[data-bank-editor]");
  if (!(root instanceof HTMLElement) || root.dataset.initialized === "true") return;
  root.dataset.initialized = "true";
  const form = root.querySelector("[data-question-form]");
  const errors = root.querySelector("[data-editor-errors]");
  const preview = root.querySelector("[data-bank-preview]");
  const list = root.querySelector("[data-pack-list]");
  const empty = root.querySelector("[data-pack-empty]");
  const exportButton = root.querySelector("[data-export-pack]");
  const status = root.querySelector("[data-editor-status]");
  if (!(form instanceof HTMLFormElement) || !(errors instanceof HTMLElement) ||
      !(preview instanceof HTMLElement) || !(list instanceof HTMLElement)) return;

  let questions = [];
  let currentId = createTeacherQuestionId(value(form, "topic"));
  let currentQuestion = null;

  const updatePanels = () => {
    const selected = value(form, "interactionKind");
    root.querySelectorAll("[data-interaction-panel]").forEach((panel) => {
      if (panel instanceof HTMLElement) panel.hidden = panel.dataset.interactionPanel !== selected;
    });
  };

  const validateCurrent = () => {
    currentQuestion = readQuestion(form, currentId);
    const validation = validateTeacherQuestion(currentQuestion, {
      existingIds: questions.map((question) => question.id),
    });
    renderErrors(errors, validation.errors);
    return validation;
  };

  const renderPack = () => {
    list.replaceChildren();
    questions.forEach((question, index) => {
      const item = create("li");
      const text = create("span", `${question.title} · ${question.topic}`);
      const remove = create("button", "Quitar");
      remove.type = "button";
      remove.addEventListener("click", () => {
        questions = questions.filter((_, questionIndex) => questionIndex !== index);
        renderPack();
      });
      item.append(text, remove); list.append(item);
    });
    if (empty instanceof HTMLElement) empty.hidden = questions.length > 0;
    if (exportButton instanceof HTMLButtonElement) exportButton.disabled = questions.length === 0;
  };

  root.querySelector("[data-interaction-kind]")?.addEventListener("change", updatePanels);
  root.querySelector("[data-preview-question]")?.addEventListener("click", () => {
    const validation = validateCurrent();
    if (!validation.valid) return;
    renderPreview(preview, currentQuestion);
  });
  root.querySelector("[data-add-question]")?.addEventListener("click", () => {
    const validation = validateCurrent();
    if (!validation.valid) return;
    renderPreview(preview, currentQuestion);
    questions = [...questions, currentQuestion];
    renderPack();
    if (status) status.textContent = "Pregunta añadida al paquete local como borrador.";
    currentId = createTeacherQuestionId(value(form, "topic"));
  });
  form.elements.namedItem("topic")?.addEventListener("change", () => {
    if (!currentQuestion || !questions.some((question) => question.id === currentId)) {
      currentId = createTeacherQuestionId(value(form, "topic"));
    }
  });
  exportButton?.addEventListener("click", () => {
    const pack = createQuestionPack(questions);
    const validation = validateQuestionPack(pack);
    if (!validation.valid) {
      renderErrors(errors, validation.errors);
      return;
    }
    downloadLocalFile({
      contents: toQuestionPackJSON(pack),
      mimeType: "application/json;charset=utf-8",
      filename: questionPackFilename(pack),
    });
    if (status) status.textContent = "Paquete docente preparado para descargar. No se publicó ni se envió.";
  });
  updatePanels();
  renderPack();
};
