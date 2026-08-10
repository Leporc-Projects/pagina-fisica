import {
  EXERCISE_COGNITIVE_LEVELS,
  EXERCISE_INTERACTION_KINDS,
  EXERCISE_MODALITIES,
  EXERCISE_REPRESENTATIONS,
  EXERCISE_TYPES,
} from "../data/physics/unit-1/exercise-schema.js";
import { UNIT_1_COMMON_ERRORS } from "../data/physics/unit-1/common-errors.js";
import { UNIT_1 } from "../data/physics/unit-1/unit.js";

export const QUESTION_PACK_SCHEMA_VERSION = "1.0.0";
export const TEACHER_QUESTION_SCHEMA_VERSION = "1.0.0";
export const TEACHER_MODALITIES = ["practice", "selfAssessment", "bonus"];

const topicIds = new Set(UNIT_1.topics.map((topic) => topic.slug));
const commonErrorIds = new Set(UNIT_1_COMMON_ERRORS.map((error) => error.id));
const validString = (value) => typeof value === "string" && value.trim().length > 0;
const uniqueStrings = (values) => [...new Set(
  (Array.isArray(values) ? values : []).map((value) => String(value).trim()).filter(Boolean)
)];

const bytesToHex = (bytes) => [...bytes]
  .map((byte) => byte.toString(16).padStart(2, "0"))
  .join("");

export const createTeacherQuestionId = (
  topic,
  cryptoApi = globalThis.crypto,
  now = Date.now()
) => {
  if (!topicIds.has(topic)) throw new TypeError("El tema no pertenece a la Unidad 1.");
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("No está disponible la generación criptográfica del ID.");
  }
  const suffix = bytesToHex(cryptoApi.getRandomValues(new Uint8Array(6)));
  return `teacher-u1-${topic}-${Number(now).toString(36)}-${suffix}`;
};

export const isTeacherQuestionId = (value) =>
  typeof value === "string" && /^teacher-u1-[a-z0-9-]+-[a-z0-9]+-[0-9a-f]{12}$/.test(value);

const normalizeSolution = (solution) => (Array.isArray(solution) ? solution : [])
  .map((step, index) => ({
    step: index + 1,
    title: String(step?.title ?? "").trim(),
    text: String(step?.text ?? "").trim(),
  }))
  .filter((step) => step.title && step.text);

export const normalizeTeacherQuestion = (question) => {
  const requiresEditorialMath = question?.requiresEditorialMath === true;
  const modalities = uniqueStrings(question?.modalities)
    .filter((mode) => TEACHER_MODALITIES.includes(mode));
  return {
    schemaVersion: TEACHER_QUESTION_SCHEMA_VERSION,
    itemKind: "fixed",
    id: String(question?.id ?? "").trim(),
    version: 1,
    unit: 1,
    topic: String(question?.topic ?? "").trim(),
    subtopic: String(question?.subtopic ?? "").trim(),
    title: String(question?.title ?? "").trim(),
    prompt: String(question?.prompt ?? "").trim(),
    type: question?.type,
    representation: question?.representation,
    cognitiveLevel: question?.cognitiveLevel,
    difficulty: Number(question?.difficulty),
    modalities,
    objectives: uniqueStrings(question?.objectives),
    hints: uniqueStrings(question?.hints),
    solution: normalizeSolution(question?.solution),
    commonErrors: uniqueStrings(question?.commonErrors),
    interaction: question?.interaction,
    answer: question?.answer,
    tolerance: question?.tolerance ?? null,
    expectedUnit: String(question?.expectedUnit ?? "").trim(),
    feedback: {
      correct: String(question?.feedback?.correct ?? "La respuesta coincide con el resultado esperado.").trim(),
      incorrect: String(question?.feedback?.incorrect ?? "Revisa el planteamiento y compara con la solución.").trim(),
      commonErrors: {},
    },
    requiresEditorialMath,
    bonusEligible: !requiresEditorialMath && modalities.includes("bonus"),
    parameterizable: false,
    estimatedMinutes: Number.isInteger(question?.estimatedMinutes)
      ? question.estimatedMinutes
      : 5,
    prerequisites: [],
    purpose: "learning",
    exposure: "public",
    authorSource: "teacher",
    status: "draft",
  };
};

const validateInteraction = (question, errors) => {
  const interaction = question?.interaction;
  const require = (condition, message) => { if (!condition) errors.push(message); };
  require(EXERCISE_INTERACTION_KINDS.includes(interaction?.kind), "interaction.kind inválido.");
  if (interaction?.kind === "singleChoice") {
    require(Array.isArray(interaction.options) && interaction.options.length >= 2, "singleChoice requiere al menos dos opciones.");
    const optionIds = interaction?.options?.map((option) => option.id) ?? [];
    require(new Set(optionIds).size === optionIds.length, "Las opciones deben tener IDs únicos.");
    require(interaction.options?.every((option) => validString(option.id) && validString(option.content)), "Cada opción requiere ID y contenido.");
    require(optionIds.includes(interaction.correctOptionId), "La opción correcta no pertenece a las opciones.");
    require(question?.answer?.kind === "text" && validString(question.answer.value), "singleChoice requiere una respuesta textual.");
    const correctOption = interaction.options?.find((option) =>
      option.id === interaction.correctOptionId
    );
    require(
      question?.answer?.value === correctOption?.content,
      "La respuesta textual debe coincidir con la opción correcta."
    );
  }
  if (interaction?.kind === "number") {
    require(question?.answer?.kind === "number" && Number.isFinite(question.answer.value), "number requiere una respuesta numérica finita.");
    require(Number.isFinite(question?.tolerance) && question.tolerance >= 0, "number requiere tolerancia no negativa.");
    require(validString(interaction?.field?.id) && validString(interaction?.field?.label), "number requiere un campo válido.");
  }
  if (interaction?.kind === "multiNumber") {
    require(Array.isArray(interaction.fields) && interaction.fields.length >= 2, "multiNumber requiere al menos dos campos.");
    require(question?.answer?.kind === "values", "multiNumber requiere answer.kind values.");
    require(interaction.fields?.every((field) => validString(field.id) && validString(field.label)), "Cada campo numérico requiere ID y etiqueta.");
    const fieldIds = interaction?.fields?.map((field) => field.id) ?? [];
    require(new Set(fieldIds).size === fieldIds.length, "Los campos numéricos deben tener IDs únicos.");
    require(question?.answer?.values?.length === interaction?.fields?.length, "Debe existir una respuesta por campo.");
    require(question?.answer?.values?.every((value) => Number.isFinite(value.value) && Number.isFinite(value.tolerance) && value.tolerance >= 0), "Las respuestas múltiples deben ser finitas y tener tolerancia no negativa.");
  }
};

export const validateTeacherQuestion = (question, { existingIds = [] } = {}) => {
  const errors = [];
  const require = (condition, message) => { if (!condition) errors.push(message); };
  require(question?.schemaVersion === TEACHER_QUESTION_SCHEMA_VERSION, "schemaVersion de pregunta inválida.");
  require(question?.itemKind === "fixed", "El editor solo admite ítems fijos.");
  require(question?.version === 1, "La versión inicial de la pregunta debe ser 1.");
  require(isTeacherQuestionId(question?.id), "ID docente inválido.");
  require(!new Set(existingIds).has(question?.id), "El ID ya existe en el banco.");
  require(question?.unit === 1, "La unidad debe ser 1.");
  require(topicIds.has(question?.topic), "El tema no pertenece a la Unidad 1.");
  require(validString(question?.subtopic), "Falta el subtema.");
  require(validString(question?.title), "Falta el título.");
  require(validString(question?.prompt), "Falta el enunciado.");
  require(EXERCISE_TYPES.includes(question?.type), "Tipo inválido.");
  require(EXERCISE_REPRESENTATIONS.includes(question?.representation), "Representación inválida.");
  require(EXERCISE_COGNITIVE_LEVELS.includes(question?.cognitiveLevel), "Nivel cognitivo inválido.");
  require(Number.isInteger(question?.difficulty) && question.difficulty >= 1 && question.difficulty <= 5, "La dificultad debe estar entre 1 y 5.");
  require(Array.isArray(question?.modalities) && question.modalities.length > 0, "Selecciona al menos una modalidad.");
  require(question?.modalities?.every((mode) => TEACHER_MODALITIES.includes(mode) && EXERCISE_MODALITIES.includes(mode)), "Modalidad inválida.");
  require(Array.isArray(question?.objectives) && question.objectives.length > 0, "Añade al menos un objetivo.");
  require(Array.isArray(question?.solution) && question.solution.length > 0, "Añade al menos un paso de solución.");
  require(question?.commonErrors?.every((id) => commonErrorIds.has(id)), "Hay errores frecuentes desconocidos.");
  require(question?.authorSource === "teacher", "authorSource debe ser teacher.");
  require(question?.status === "draft", "El paquete docente solo produce borradores.");
  require(question?.purpose === "learning", "purpose debe ser learning.");
  require(question?.exposure === "public", "exposure inválida.");
  require(question?.requiresEditorialMath !== true || question?.bonusEligible === false, "Un borrador con composición matemática pendiente no puede ser elegible para Bono.");
  require(
    question?.bonusEligible === (
      question?.requiresEditorialMath !== true && question?.modalities?.includes("bonus")
    ),
    "bonusEligible debe corresponder a las modalidades y revisión matemática."
  );
  require(question?.parameterizable === false, "El editor no crea familias parametrizadas.");
  validateInteraction(question, errors);
  return { valid: errors.length === 0, errors };
};

export const createQuestionPack = (
  questions,
  { cryptoApi = globalThis.crypto, createdAt = new Date().toISOString() } = {}
) => {
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("No está disponible la generación criptográfica del paquete.");
  }
  const packageId = `question-pack-${bytesToHex(cryptoApi.getRandomValues(new Uint8Array(8)))}`;
  return {
    schemaVersion: QUESTION_PACK_SCHEMA_VERSION,
    packageId,
    createdAt,
    metadata: {
      course: "fisica-basica-1",
      unit: 1,
      authorSource: "teacher",
      intendedStatus: "draft",
      collection: "local",
    },
    questions: questions.map(normalizeTeacherQuestion),
  };
};

export const validateQuestionPack = (pack, { existingIds = [] } = {}) => {
  const errors = [];
  const require = (condition, message) => { if (!condition) errors.push(message); };
  require(pack?.schemaVersion === QUESTION_PACK_SCHEMA_VERSION, "schemaVersion de paquete inválida.");
  require(/^question-pack-[0-9a-f]{16}$/.test(pack?.packageId ?? ""), "packageId inválido.");
  const createdDate = new Date(pack?.createdAt);
  require(
    validString(pack?.createdAt) &&
      !Number.isNaN(createdDate.valueOf()) &&
      createdDate.toISOString() === pack.createdAt,
    "createdAt debe usar ISO 8601."
  );
  require(pack?.metadata?.course === "fisica-basica-1", "Curso inválido.");
  require(pack?.metadata?.unit === 1, "Unidad inválida.");
  require(pack?.metadata?.authorSource === "teacher", "Fuente de autoría inválida.");
  require(pack?.metadata?.intendedStatus === "draft", "El paquete debe conservar estado draft.");
  require(Array.isArray(pack?.questions) && pack.questions.length > 0, "El paquete no contiene preguntas.");
  const ids = pack?.questions?.map((question) => question.id) ?? [];
  require(new Set(ids).size === ids.length, "El paquete contiene IDs duplicados.");
  pack?.questions?.forEach((question, index) => {
    const validation = validateTeacherQuestion(question, { existingIds });
    validation.errors.forEach((error) => errors.push(`Pregunta ${index + 1}: ${error}`));
  });
  return { valid: errors.length === 0, errors };
};

export const questionPackFilename = (pack) =>
  `aula-fisica-question-pack-${pack.createdAt.slice(0, 10)}-${pack.packageId.slice(-8)}.json`;

export const toQuestionPackJSON = (pack) => `${JSON.stringify(pack, null, 2)}\n`;

export const mergeQuestionPack = (
  pack,
  currentQuestions,
  { repositoryIds = [] } = {}
) => {
  if (!Array.isArray(currentQuestions)) throw new TypeError("El banco docente debe ser una lista.");
  const existingIds = [
    ...repositoryIds,
    ...currentQuestions.map((question) => question.id),
  ];
  const validation = validateQuestionPack(pack, { existingIds });
  if (!validation.valid) throw new TypeError(validation.errors.join(" "));
  const imported = pack.questions.map((question) => ({
    ...normalizeTeacherQuestion(question),
    status: "draft",
  }));
  return {
    questions: [...currentQuestions, ...imported],
    imported,
    packageId: pack.packageId,
  };
};
