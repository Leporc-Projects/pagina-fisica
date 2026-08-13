import {
  EXERCISE_COGNITIVE_LEVELS,
  EXERCISE_INTERACTION_KINDS,
  EXERCISE_MODALITIES,
  EXERCISE_REPRESENTATIONS,
  EXERCISE_TYPES,
} from "../data/physics/unit-1/exercise-schema.js";
import { UNIT_1_COMMON_ERRORS } from "../data/physics/unit-1/common-errors.js";
import { UNIT_1 } from "../data/physics/unit-1/unit.js";
import { formatQuestionIssues } from "./question-pack-issues.js";

export const QUESTION_PACK_SCHEMA_VERSION = "2.0.0";
export const TEACHER_QUESTION_SCHEMA_VERSION = "2.0.0";
export const TEACHER_MODALITIES = ["practice", "selfAssessment", "bonus"];

const PRESENTATION_LOCALES = ["es", "en"];
const topicIds = new Set(UNIT_1.topics.map((topic) => topic.slug));
const commonErrorIds = new Set(UNIT_1_COMMON_ERRORS.map((error) => error.id));
const validString = (value) => typeof value === "string" && value.trim().length > 0;
const uniqueStrings = (values) => [...new Set(
  (Array.isArray(values) ? values : []).map((value) => String(value).trim()).filter(Boolean)
)];
const bytesToHex = (bytes) => [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

const DEFAULT_FEEDBACK = Object.freeze({
  es: Object.freeze({
    correct: "La respuesta coincide con el resultado esperado.",
    incorrect: "Revisa el planteamiento y compara con la solución.",
  }),
  en: Object.freeze({
    correct: "The answer matches the expected result.",
    incorrect: "Review your setup and compare it with the solution.",
  }),
});

export const createTeacherQuestionId = (topic, cryptoApi = globalThis.crypto, now = Date.now()) => {
  if (!topicIds.has(topic)) throw new TypeError("El tema no pertenece a la Unidad 1.");
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("No está disponible la generación criptográfica del ID.");
  }
  return `teacher-u1-${topic}-${Number(now).toString(36)}-${bytesToHex(cryptoApi.getRandomValues(new Uint8Array(6)))}`;
};

export const isTeacherQuestionId = (value) =>
  typeof value === "string" && /^teacher-u1-[a-z0-9-]+-[a-z0-9]+-[0-9a-f]{12}$/.test(value);

const normalizeSolution = (solution) => (Array.isArray(solution) ? solution : [])
  .map((step, index) => ({
    step: index + 1,
    title: String(step?.title ?? "").trim(),
    text: String(step?.text ?? "").trim(),
  }))
  .filter((step) => step.title || step.text);

const normalizePresentation = (presentation, locale) => ({
  title: String(presentation?.title ?? "").trim(),
  prompt: String(presentation?.prompt ?? "").trim(),
  objectives: uniqueStrings(presentation?.objectives),
  hints: uniqueStrings(presentation?.hints),
  solution: normalizeSolution(presentation?.solution),
  options: (Array.isArray(presentation?.options) ? presentation.options : []).map((option) => ({
    id: String(option?.id ?? "").trim(),
    content: String(option?.content ?? "").trim(),
  })),
  fields: (Array.isArray(presentation?.fields) ? presentation.fields : []).map((field) => ({
    id: String(field?.id ?? "").trim(),
    label: String(field?.label ?? "").trim(),
  })),
  feedback: {
    correct: String(presentation?.feedback?.correct ?? DEFAULT_FEEDBACK[locale].correct).trim(),
    incorrect: String(presentation?.feedback?.incorrect ?? DEFAULT_FEEDBACK[locale].incorrect).trim(),
    commonErrors: Object.fromEntries(Object.entries(presentation?.feedback?.commonErrors ?? {})
      .map(([id, text]) => [id, String(text).trim()])),
  },
  ...(validString(presentation?.answerDisplay)
    ? { answerDisplay: String(presentation.answerDisplay).trim() }
    : {}),
});

// Teacher Question 2.0 stores machine interaction/grading once and keeps both
// authored presentations beside that single invariant identity.
export const normalizeTeacherQuestion = (question) => {
  const requiresEditorialMath = question?.requiresEditorialMath === true;
  const modalities = uniqueStrings(question?.modalities).filter((mode) => TEACHER_MODALITIES.includes(mode));
  return {
    schemaVersion: TEACHER_QUESTION_SCHEMA_VERSION,
    itemKind: "fixed",
    id: String(question?.id ?? "").trim(),
    version: Number.isInteger(question?.version) ? question.version : 1,
    unit: 1,
    topic: String(question?.topic ?? "").trim(),
    subtopic: String(question?.subtopic ?? "").trim(),
    type: question?.type,
    representation: question?.representation,
    cognitiveLevel: question?.cognitiveLevel,
    difficulty: Number(question?.difficulty),
    modalities,
    commonErrors: uniqueStrings(question?.commonErrors),
    interaction: question?.interaction,
    answer: question?.answer,
    tolerance: question?.tolerance ?? null,
    expectedUnit: String(question?.expectedUnit ?? "").trim(),
    presentations: Object.fromEntries(PRESENTATION_LOCALES.map((locale) => [
      locale,
      normalizePresentation(question?.presentations?.[locale], locale),
    ])),
    requiresEditorialMath,
    bonusEligible: !requiresEditorialMath && modalities.includes("bonus"),
    parameterizable: false,
    estimatedMinutes: Number.isInteger(question?.estimatedMinutes) ? question.estimatedMinutes : 5,
    prerequisites: uniqueStrings(question?.prerequisites),
    purpose: "learning",
    exposure: "public",
    authorSource: "teacher",
    status: "draft",
  };
};

const addIssue = (issues, code, path, params = {}) => issues.push({ code, path, params });
const sameArray = (first, second) => first.length === second.length && first.every((value, index) => value === second[index]);

const validatePresentations = (question, issues) => {
  PRESENTATION_LOCALES.forEach((locale) => {
    const entry = question?.presentations?.[locale];
    if (!entry) return addIssue(issues, "missing-presentation", `presentations.${locale}`, { locale });
    if (!validString(entry.title)) addIssue(issues, "missing-title", `presentations.${locale}.title`, { locale });
    if (!validString(entry.prompt)) addIssue(issues, "missing-prompt", `presentations.${locale}.prompt`, { locale });
    if (!Array.isArray(entry.objectives) || entry.objectives.length === 0) addIssue(issues, "missing-objectives", `presentations.${locale}.objectives`, { locale });
    if (!Array.isArray(entry.solution) || entry.solution.length === 0) addIssue(issues, "missing-solution", `presentations.${locale}.solution`, { locale });
    if (entry.solution?.some((step) => !validString(step.title) || !validString(step.text))) addIssue(issues, "invalid-solution-step", `presentations.${locale}.solution`, { locale });
    if (!validString(entry.feedback?.correct) || !validString(entry.feedback?.incorrect)) addIssue(issues, "missing-feedback", `presentations.${locale}.feedback`, { locale });
  });
  const es = question?.presentations?.es;
  const en = question?.presentations?.en;
  if (!es || !en) return;
  if (es.objectives?.length !== en.objectives?.length) addIssue(issues, "objective-structure", "presentations", {});
  if (es.solution?.length !== en.solution?.length) addIssue(issues, "solution-structure", "presentations", {});
};

const validateInteraction = (question, issues) => {
  const interaction = question?.interaction;
  if (!EXERCISE_INTERACTION_KINDS.includes(interaction?.kind)) {
    addIssue(issues, "invalid-interaction-kind", "interaction.kind");
    return;
  }
  if (interaction.kind === "singleChoice") {
    const optionIds = interaction.options?.map((option) => option.id) ?? [];
    if (!Array.isArray(interaction.options) || interaction.options.length < 2) addIssue(issues, "choice-minimum", "interaction.options");
    if (new Set(optionIds).size !== optionIds.length) addIssue(issues, "duplicate-option-id", "interaction.options");
    if (!interaction.options?.every((option) => validString(option.id) && Object.keys(option).every((key) => key === "id"))) addIssue(issues, "invalid-option-identity", "interaction.options");
    if (!optionIds.includes(interaction.correctOptionId)) addIssue(issues, "invalid-correct-option", "interaction.correctOptionId");
    if (question?.answer?.kind !== "choice" || !validString(question.answer.optionId)) addIssue(issues, "invalid-choice-answer", "answer");
    if (question?.answer?.optionId !== interaction.correctOptionId) addIssue(issues, "choice-answer-mismatch", "answer.optionId");
    PRESENTATION_LOCALES.forEach((locale) => {
      const presentationIds = question?.presentations?.[locale]?.options?.map((option) => option.id) ?? [];
      if (!sameArray(optionIds, presentationIds)) addIssue(issues, "option-presentation-structure", `presentations.${locale}.options`, { locale });
      if (!question?.presentations?.[locale]?.options?.every((option) => validString(option.content))) addIssue(issues, "missing-option-content", `presentations.${locale}.options`, { locale });
    });
  }
  if (interaction.kind === "number") {
    if (!validString(interaction?.field?.id) || !validString(interaction?.field?.unit)) addIssue(issues, "invalid-number-field", "interaction.field");
    if (question?.answer?.kind !== "number" || !Number.isFinite(question.answer.value)) addIssue(issues, "invalid-number-answer", "answer");
    if (!Number.isFinite(question?.tolerance) || question.tolerance < 0) addIssue(issues, "invalid-tolerance", "tolerance");
    PRESENTATION_LOCALES.forEach((locale) => {
      const fields = question?.presentations?.[locale]?.fields ?? [];
      if (fields.length !== 1 || fields[0]?.id !== interaction.field?.id || !validString(fields[0]?.label)) addIssue(issues, "number-field-presentation", `presentations.${locale}.fields`, { locale });
    });
  }
  if (interaction.kind === "multiNumber") {
    const fieldIds = interaction.fields?.map((field) => field.id) ?? [];
    if (!Array.isArray(interaction.fields) || interaction.fields.length < 2) addIssue(issues, "multi-field-minimum", "interaction.fields");
    if (!interaction.fields?.every((field) => validString(field.id) && validString(field.unit))) addIssue(issues, "invalid-multi-field", "interaction.fields");
    if (new Set(fieldIds).size !== fieldIds.length) addIssue(issues, "duplicate-field-id", "interaction.fields");
    if (question?.answer?.kind !== "values") addIssue(issues, "invalid-values-answer", "answer");
    const answers = question?.answer?.values ?? [];
    if (!sameArray(fieldIds, answers.map((entry) => entry.fieldId))) addIssue(issues, "answer-field-structure", "answer.values");
    if (!answers.every((entry) => Number.isFinite(entry.value) && Number.isFinite(entry.tolerance) && entry.tolerance >= 0)) addIssue(issues, "invalid-multi-answer", "answer.values");
    PRESENTATION_LOCALES.forEach((locale) => {
      const fields = question?.presentations?.[locale]?.fields ?? [];
      if (!sameArray(fieldIds, fields.map((field) => field.id)) || !fields.every((field) => validString(field.label))) addIssue(issues, "multi-field-presentation", `presentations.${locale}.fields`, { locale });
    });
  }
};

export const validateTeacherQuestion = (question, { existingIds = [] } = {}) => {
  const issues = [];
  if (question?.schemaVersion !== TEACHER_QUESTION_SCHEMA_VERSION) addIssue(issues, /^1(?:\.|$)/.test(question?.schemaVersion ?? "") ? "legacy-question-schema" : "invalid-question-schema", "schemaVersion");
  if (question?.itemKind !== "fixed") addIssue(issues, "invalid-item-kind", "itemKind");
  if (question?.version !== 1) addIssue(issues, "invalid-version", "version");
  if (!isTeacherQuestionId(question?.id)) addIssue(issues, "invalid-id", "id");
  if (new Set(existingIds).has(question?.id)) addIssue(issues, "duplicate-id", "id");
  if (question?.unit !== 1) addIssue(issues, "invalid-unit", "unit");
  if (!topicIds.has(question?.topic)) addIssue(issues, "invalid-topic", "topic");
  if (!validString(question?.subtopic)) addIssue(issues, "missing-subtopic", "subtopic");
  if (!EXERCISE_TYPES.includes(question?.type)) addIssue(issues, "invalid-type", "type");
  if (!EXERCISE_REPRESENTATIONS.includes(question?.representation)) addIssue(issues, "invalid-representation", "representation");
  if (!EXERCISE_COGNITIVE_LEVELS.includes(question?.cognitiveLevel)) addIssue(issues, "invalid-cognitive-level", "cognitiveLevel");
  if (!Number.isInteger(question?.difficulty) || question.difficulty < 1 || question.difficulty > 5) addIssue(issues, "invalid-difficulty", "difficulty");
  if (!Array.isArray(question?.modalities) || question.modalities.length === 0) addIssue(issues, "missing-modalities", "modalities");
  if (!question?.modalities?.every((mode) => TEACHER_MODALITIES.includes(mode) && EXERCISE_MODALITIES.includes(mode))) addIssue(issues, "invalid-modality", "modalities");
  if (!question?.commonErrors?.every((id) => commonErrorIds.has(id))) addIssue(issues, "invalid-common-error", "commonErrors");
  if (question?.authorSource !== "teacher") addIssue(issues, "invalid-author-source", "authorSource");
  if (question?.status !== "draft") addIssue(issues, "invalid-status", "status");
  if (question?.purpose !== "learning") addIssue(issues, "invalid-purpose", "purpose");
  if (question?.exposure !== "public") addIssue(issues, "invalid-exposure", "exposure");
  if (question?.requiresEditorialMath === true && question?.bonusEligible !== false) addIssue(issues, "editorial-math-bonus", "bonusEligible");
  if (question?.bonusEligible !== (question?.requiresEditorialMath !== true && question?.modalities?.includes("bonus"))) addIssue(issues, "invalid-bonus-eligibility", "bonusEligible");
  if (question?.parameterizable !== false) addIssue(issues, "invalid-parameterizable", "parameterizable");
  validatePresentations(question, issues);
  validateInteraction(question, issues);
  return { valid: issues.length === 0, issues, errors: formatQuestionIssues(issues, "es") };
};

export const createQuestionPack = (questions, { cryptoApi = globalThis.crypto, createdAt = new Date().toISOString() } = {}) => {
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") throw new Error("No está disponible la generación criptográfica del paquete.");
  return {
    schemaVersion: QUESTION_PACK_SCHEMA_VERSION,
    packageId: `question-pack-${bytesToHex(cryptoApi.getRandomValues(new Uint8Array(8)))}`,
    createdAt,
    metadata: { course: "fisica-basica-1", unit: 1, authorSource: "teacher", intendedStatus: "draft", collection: "local" },
    questions: questions.map(normalizeTeacherQuestion),
  };
};

export const validateQuestionPack = (pack, { existingIds = [] } = {}) => {
  const issues = [];
  if (pack?.schemaVersion !== QUESTION_PACK_SCHEMA_VERSION) addIssue(issues, /^1(?:\.|$)/.test(pack?.schemaVersion ?? "") ? "legacy-pack-schema" : "invalid-pack-schema", "schemaVersion");
  if (!/^question-pack-[0-9a-f]{16}$/.test(pack?.packageId ?? "")) addIssue(issues, "invalid-package-id", "packageId");
  const createdDate = new Date(pack?.createdAt);
  if (!validString(pack?.createdAt) || Number.isNaN(createdDate.valueOf()) || createdDate.toISOString() !== pack.createdAt) addIssue(issues, "invalid-created-at", "createdAt");
  if (pack?.metadata?.course !== "fisica-basica-1") addIssue(issues, "invalid-course", "metadata.course");
  if (pack?.metadata?.unit !== 1) addIssue(issues, "invalid-unit", "metadata.unit");
  if (pack?.metadata?.authorSource !== "teacher") addIssue(issues, "invalid-author-source", "metadata.authorSource");
  if (pack?.metadata?.intendedStatus !== "draft") addIssue(issues, "invalid-intended-status", "metadata.intendedStatus");
  if (!Array.isArray(pack?.questions) || pack.questions.length === 0) addIssue(issues, "empty-pack", "questions");
  const ids = pack?.questions?.map((question) => question.id) ?? [];
  if (new Set(ids).size !== ids.length) addIssue(issues, "duplicate-pack-ids", "questions");
  pack?.questions?.forEach((question, index) => {
    validateTeacherQuestion(question, { existingIds }).issues.forEach((entry) => issues.push({ ...entry, path: `questions.${index}.${entry.path}`, params: { ...entry.params, number: index + 1 } }));
  });
  return { valid: issues.length === 0, issues, errors: formatQuestionIssues(issues, "es") };
};

export const questionPackFilename = (pack) => `aula-fisica-question-pack-${pack.createdAt.slice(0, 10)}-${pack.packageId.slice(-8)}.json`;
export const toQuestionPackJSON = (pack) => `${JSON.stringify(pack, null, 2)}\n`;

export const mergeQuestionPack = (pack, currentQuestions, { repositoryIds = [] } = {}) => {
  if (!Array.isArray(currentQuestions)) throw new TypeError("El banco docente debe ser una lista.");
  const existingIds = [...repositoryIds, ...currentQuestions.map((question) => question.id)];
  const validation = validateQuestionPack(pack, { existingIds });
  if (!validation.valid) throw new TypeError(validation.errors.join(" "));
  const imported = pack.questions.map((question) => ({ ...normalizeTeacherQuestion(question), status: "draft" }));
  return { questions: [...currentQuestions, ...imported], imported, packageId: pack.packageId };
};
