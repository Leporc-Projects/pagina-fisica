import { COURSE } from "../data/course.js";
import { UNIT_1_CONTENT } from "../data/physics/unit-1/content.js";
import { UNIT_1 } from "../data/physics/unit-1/unit.js";
import { recordsToCsv, sanitizeFilePart } from "./local-export.js";

export const BONUS_ATTEMPT_SCHEMA_VERSION = "1.0.0";
export const BONUS_FEEDBACK_POLICIES = ["afterAttempt"];

const UINT32_RANGE = 0x1_0000_0000;

export const attemptIdFromBytes = (bytes) => {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 16) {
    throw new TypeError("El ID del intento requiere exactamente 16 bytes.");
  }

  return `attempt_${[...bytes]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
};

export const generateAttemptId = (cryptoApi = globalThis.crypto) => {
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("No está disponible la generación criptográfica del ID.");
  }

  return attemptIdFromBytes(cryptoApi.getRandomValues(new Uint8Array(16)));
};

export const isAttemptId = (value) =>
  typeof value === "string" && /^attempt_[0-9a-f]{32}$/.test(value);

export const secureRandomIndex = (length, cryptoApi = globalThis.crypto) => {
  if (!Number.isInteger(length) || length <= 0) {
    throw new TypeError("La selección aleatoria requiere una longitud positiva.");
  }
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("No está disponible la fuente aleatoria criptográfica.");
  }

  const limit = UINT32_RANGE - (UINT32_RANGE % length);
  const buffer = new Uint32Array(1);
  do {
    cryptoApi.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return buffer[0] % length;
};

export const secureShuffle = (values, cryptoApi = globalThis.crypto) => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomIndex(index + 1, cryptoApi);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const parseSimpleNumber = (source) => {
  const pattern = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/;
  if (!pattern.test(source) || (source.includes(".") && source.includes(","))) {
    return null;
  }

  const value = Number(source.replace(",", "."));
  return Number.isFinite(value) ? value : null;
};

export const parseBonusNumber = (input) => {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input !== "string") return null;

  const source = input.trim();
  if (source === "") return null;

  const fraction = source.match(/^([^/]+)\/([^/]+)$/);
  if (fraction) {
    const numerator = parseSimpleNumber(fraction[1].trim());
    const denominator = parseSimpleNumber(fraction[2].trim());
    if (numerator === null || denominator === null || denominator === 0) return null;
    return numerator / denominator;
  }

  return parseSimpleNumber(source);
};

export const isBonusExercise = (exercise) =>
  exercise?.bonusEligible === true &&
  exercise?.purpose === "learning" &&
  exercise?.exposure === "public" &&
  exercise?.modalities?.includes("bonus") &&
  exercise?.interaction !== null;

const matchesOne = (value, allowed) =>
  !allowed || allowed.length === 0 || allowed.includes(value);

export const matchesBlueprintCriteria = (exercise, criteria = {}) =>
  matchesOne(exercise.topic, criteria.topic) &&
  matchesOne(exercise.subtopic, criteria.subtopic) &&
  matchesOne(exercise.type, criteria.type) &&
  matchesOne(exercise.representation, criteria.representation) &&
  matchesOne(exercise.difficulty, criteria.difficulty);

export const eligiblePoolForBonus = (bonus, exercises) =>
  exercises.filter((exercise) =>
    isBonusExercise(exercise) && bonus.topics.includes(exercise.topic)
  );

const expandBlueprint = (blueprint) => blueprint.flatMap((slot, slotIndex) =>
  Array.from({ length: slot.count }, (_, countIndex) => ({
    slotId: slot.id,
    slotIndex,
    countIndex,
    criteria: slot.criteria,
  }))
);

const solveBlueprint = ({ requirements, pool, cryptoApi, selected = [] }) => {
  if (requirements.length === 0) return selected;

  const selectedIds = new Set(selected.map((entry) => entry.exercise.id));
  const ranked = requirements
    .map((requirement, index) => ({
      requirement,
      index,
      candidates: pool.filter((exercise) =>
        !selectedIds.has(exercise.id) &&
        matchesBlueprintCriteria(exercise, requirement.criteria)
      ),
    }))
    .sort((first, second) =>
      first.candidates.length - second.candidates.length ||
      first.requirement.slotIndex - second.requirement.slotIndex ||
      first.requirement.countIndex - second.requirement.countIndex
    );
  const next = ranked[0];
  if (!next || next.candidates.length === 0) return null;

  const remaining = requirements.filter((_, index) => index !== next.index);
  for (const exercise of secureShuffle(next.candidates, cryptoApi)) {
    const solution = solveBlueprint({
      requirements: remaining,
      pool,
      cryptoApi,
      selected: [...selected, { ...next.requirement, exercise }],
    });
    if (solution) return solution;
  }

  return null;
};

export const selectBonusQuestions = (
  bonus,
  exercises,
  cryptoApi = globalThis.crypto
) => {
  const pool = eligiblePoolForBonus(bonus, exercises);
  const requirements = expandBlueprint(bonus.blueprint);
  const solution = solveBlueprint({ requirements, pool, cryptoApi });

  if (!solution || solution.length !== bonus.questionCount) {
    throw new Error(`El blueprint de ${bonus.id} no puede satisfacerse.`);
  }

  return solution
    .sort((first, second) =>
      first.slotIndex - second.slotIndex || first.countIndex - second.countIndex
    )
    .map(({ exercise, slotId }) => ({
      exercise,
      slotId,
      optionOrder: exercise.interaction.kind === "singleChoice"
        ? secureShuffle(
            exercise.interaction.options.map((option) => option.id),
            cryptoApi
          )
        : undefined,
    }));
};

export const canSatisfyBonusBlueprint = (bonus, exercises) => {
  const deterministicCrypto = {
    counter: 0,
    getRandomValues(array) {
      for (let index = 0; index < array.length; index += 1) {
        array[index] = this.counter;
        this.counter = (this.counter + 1) >>> 0;
      }
      return array;
    },
  };

  try {
    return selectBonusQuestions(bonus, exercises, deterministicCrypto).length ===
      bonus.questionCount;
  } catch {
    return false;
  }
};

const isExactIsoDate = (value) => {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value;
};

export const createBonusAttempt = (
  bonus,
  selections,
  environment = {}
) => {
  const startedAt = environment.startedAt ?? new Date().toISOString();
  const attemptId = environment.attemptId ?? generateAttemptId();

  return {
    schemaVersion: BONUS_ATTEMPT_SCHEMA_VERSION,
    attemptId,
    bonusId: bonus.id,
    bonusVersion: bonus.version,
    bonusTitle: bonus.title,
    modality: bonus.modality,
    purpose: bonus.purpose,
    exposure: bonus.exposure,
    feedbackPolicy: bonus.feedbackPolicy,
    course: {
      code: COURSE.code,
      slug: "fisica-basica-1",
      title: COURSE.name,
    },
    unit: {
      number: UNIT_1.number,
      slug: UNIT_1.slug,
      title: UNIT_1.title,
    },
    startedAt,
    completedAt: null,
    questions: selections.map(({ exercise, optionOrder, slotId }, index) => ({
      exerciseId: exercise.id,
      exerciseVersion: exercise.version,
      order: index + 1,
      blueprintSlot: slotId,
      optionOrder: optionOrder ?? null,
      snapshot: {
        title: exercise.title,
        prompt: exercise.prompt,
      },
      topic: exercise.topic,
      subtopic: exercise.subtopic,
      response: null,
      answered: false,
      correct: null,
      pointsEarned: null,
      pointsPossible: 1,
      expectedResponse: null,
      feedback: null,
      fieldResults: null,
    })),
    summary: null,
    privacy: {
      collection: "local",
      identity: "anonymous",
    },
  };
};

const responseRaw = (response) => {
  if (response === null || response === undefined) return "";
  if (typeof response === "string") return response;
  return typeof response.raw === "string" ? response.raw : "";
};

const expectedResponseText = (exercise) => {
  if (exercise.interaction.kind === "singleChoice") {
    return exercise.interaction.options.find(
      (option) => option.id === exercise.interaction.correctOptionId
    )?.content ?? "";
  }
  if (exercise.answer.kind === "number") return exercise.answer.display;
  return exercise.answer.values
    .map((value) => `${value.symbol} = ${value.value}${value.unit ? ` ${value.unit}` : ""}`)
    .join("; ");
};

export const normalizeExerciseResponse = (exercise, input) => {
  if (exercise.interaction.kind === "singleChoice") {
    const optionId = typeof input === "string" ? input : input?.optionId;
    const option = exercise.interaction.options.find(
      (item) => item.id === optionId
    );
    return optionId
      ? { kind: "singleChoice", optionId, content: option?.content ?? "" }
      : null;
  }

  if (exercise.interaction.kind === "number") {
    const raw = responseRaw(input);
    return raw.trim() === ""
      ? null
      : { kind: "number", raw, value: parseBonusNumber(raw) };
  }

  const rawValues = Array.isArray(input) ? input : input?.values;
  if (!Array.isArray(rawValues)) return null;
  const values = exercise.interaction.fields.map((field, index) => {
    const entry = rawValues.find?.((item) => item?.fieldId === field.id) ?? rawValues[index];
    const raw = typeof entry === "string" ? entry : responseRaw(entry);
    return {
      fieldId: field.id,
      label: field.label,
      raw,
      value: raw.trim() === "" ? null : parseBonusNumber(raw),
    };
  });

  return values.every((entry) => entry.raw.trim() === "")
    ? null
    : { kind: "multiNumber", values };
};

const withinTolerance = (actual, expected, tolerance) =>
  actual !== null && Math.abs(actual - expected) <= tolerance;

export const gradeExerciseResponse = (exercise, input) => {
  const response = normalizeExerciseResponse(exercise, input);
  const expectedResponse = expectedResponseText(exercise);

  if (exercise.interaction.kind === "singleChoice") {
    const answered = response !== null;
    const correct = answered &&
      response.optionId === exercise.interaction.correctOptionId;
    return {
      response,
      answered,
      correct,
      pointsEarned: correct ? 1 : 0,
      pointsPossible: 1,
      expectedResponse,
      feedback: correct ? exercise.feedback.correct : exercise.feedback.incorrect,
      fieldResults: null,
    };
  }

  if (exercise.interaction.kind === "number") {
    const answered = response !== null;
    const tolerance = exercise.tolerance ?? 0;
    const correct = answered && withinTolerance(
      response.value,
      exercise.answer.value,
      tolerance
    );
    return {
      response,
      answered,
      correct,
      pointsEarned: correct ? 1 : 0,
      pointsPossible: 1,
      expectedResponse,
      feedback: correct ? exercise.feedback.correct : exercise.feedback.incorrect,
      fieldResults: null,
    };
  }

  const fieldCount = exercise.interaction.fields.length;
  const fieldResults = exercise.interaction.fields.map((field, index) => {
    const responseValue = response?.values.find((item) => item.fieldId === field.id);
    const expected = exercise.answer.values[index];
    const tolerance = expected.tolerance ?? exercise.tolerance ?? 0;
    const correct = withinTolerance(responseValue?.value ?? null, expected.value, tolerance);
    return {
      fieldId: field.id,
      answered: responseValue?.raw.trim() !== "",
      correct,
      pointsEarned: correct ? 1 / fieldCount : 0,
      pointsPossible: 1 / fieldCount,
    };
  });
  const pointsEarned = fieldResults.reduce(
    (total, field) => total + field.pointsEarned,
    0
  );
  const answered = fieldResults.some((field) => field.answered);
  const correct = fieldResults.every((field) => field.correct);

  return {
    response,
    answered,
    correct,
    pointsEarned,
    pointsPossible: 1,
    expectedResponse,
    feedback: correct ? exercise.feedback.correct : exercise.feedback.incorrect,
    fieldResults,
  };
};

const topicMap = new Map(UNIT_1.topics.map((topic) => [topic.slug, topic]));
const subtopicMap = new Map(
  Object.entries(UNIT_1_CONTENT).flatMap(([topicSlug, content]) =>
    content.sections.map((section) => [
      `${topicSlug}:${section.id}`,
      {
        topic: topicSlug,
        subtopic: section.id,
        title: section.title,
        route: `${topicMap.get(topicSlug)?.route ?? UNIT_1.route}#${section.id}`,
      },
    ])
  )
);

const summarizeByTopic = (questions) => {
  const summaries = new Map();
  questions.forEach((question) => {
    const current = summaries.get(question.topic) ?? {
      topic: question.topic,
      title: topicMap.get(question.topic)?.shortTitle ?? question.topic,
      pointsEarned: 0,
      pointsPossible: 0,
    };
    current.pointsEarned += question.pointsEarned;
    current.pointsPossible += question.pointsPossible;
    summaries.set(question.topic, current);
  });
  return [...summaries.values()];
};

const reviewRecommendations = (questions) => {
  const recommendations = new Map();
  questions
    .filter((question) => question.pointsEarned < question.pointsPossible)
    .forEach((question) => {
      const key = `${question.topic}:${question.subtopic}`;
      const reference = subtopicMap.get(key) ?? {
        topic: question.topic,
        subtopic: question.subtopic,
        title: topicMap.get(question.topic)?.title ?? question.topic,
        route: topicMap.get(question.topic)?.route ?? UNIT_1.route,
      };
      recommendations.set(key, reference);
    });
  return [...recommendations.values()];
};

export const completeBonusAttempt = ({
  attempt,
  exercises,
  responses,
  completedAt = new Date().toISOString(),
}) => {
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const questions = attempt.questions.map((question) => {
    const exercise = exerciseMap.get(question.exerciseId);
    if (!exercise) throw new TypeError(`No existe ${question.exerciseId}.`);
    const result = gradeExerciseResponse(
      exercise,
      responses?.[question.exerciseId] ?? null
    );
    return { ...question, ...result };
  });
  const pointsEarned = questions.reduce(
    (total, question) => total + question.pointsEarned,
    0
  );
  const pointsPossible = questions.reduce(
    (total, question) => total + question.pointsPossible,
    0
  );

  return {
    ...attempt,
    completedAt,
    questions,
    summary: {
      pointsEarned,
      pointsPossible,
      percentage: pointsPossible === 0 ? 0 : (pointsEarned / pointsPossible) * 100,
      byTopic: summarizeByTopic(questions),
      reviewRecommendations: reviewRecommendations(questions),
    },
  };
};

export const bonusQuestionResponseText = (question) => {
  if (!question.response) return "Sin respuesta";
  if (question.response.kind === "singleChoice") {
    return question.response.content || question.response.optionId;
  }
  if (question.response.kind === "number") return question.response.raw;
  return question.response.values
    .map((value) => `${value.label}: ${value.raw || "sin respuesta"}`)
    .join("; ");
};

export const formatBonusPoints = (value) => new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 3,
}).format(value);

export const formatBonusPercentage = (value) => new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
}).format(value);

export const bonusCompactSummary = (attempt) => {
  const { summary } = attempt;
  return [
    "Papilla's Physics · Física Básica I",
    attempt.bonusTitle,
    `Resultado: ${formatBonusPoints(summary.pointsEarned)} / ${formatBonusPoints(summary.pointsPossible)} puntos (${formatBonusPercentage(summary.percentage)} %)`,
    `ID del intento: ${attempt.attemptId}`,
    "Resultado calculado localmente; no fue enviado automáticamente.",
  ].join("\n");
};

export const toBonusText = (attempt) => {
  const lines = [
    bonusCompactSummary(attempt),
    `Inicio: ${attempt.startedAt}`,
    `Finalización: ${attempt.completedAt}`,
    "",
    "Resultado por tema en esta tanda",
    ...attempt.summary.byTopic.map((topic) =>
      `${topic.title}: ${formatBonusPoints(topic.pointsEarned)} / ${formatBonusPoints(topic.pointsPossible)}`
    ),
    "",
    "Preguntas",
  ];

  attempt.questions.forEach((question) => {
    lines.push(
      "",
      `${question.order}. ${question.snapshot.title}`,
      question.snapshot.prompt,
      `Respuesta: ${bonusQuestionResponseText(question)}`,
      `Resultado: ${formatBonusPoints(question.pointsEarned)} / ${formatBonusPoints(question.pointsPossible)}`,
      `Respuesta esperada: ${question.expectedResponse}`,
      `Retroalimentación: ${question.feedback}`
    );
  });

  if (attempt.summary.reviewRecommendations.length > 0) {
    lines.push(
      "",
      "Podría convenirte repasar:",
      ...attempt.summary.reviewRecommendations.map((item) => `- ${item.title}`)
    );
  }

  lines.push(
    "",
    "Este resultado describe únicamente las preguntas de esta tanda y no constituye por sí solo una medición completa de tu dominio del tema.",
    "Este archivo fue generado localmente y no fue enviado automáticamente."
  );

  return `${lines.join("\n")}\n`;
};

export const toBonusJSON = (attempt) => `${JSON.stringify(attempt, null, 2)}\n`;

export const BONUS_CSV_COLUMNS = [
  "schema_version",
  "attempt_id",
  "bonus_id",
  "bonus_version",
  "unit",
  "started_at",
  "completed_at",
  "question_order",
  "exercise_id",
  "exercise_version",
  "question_title",
  "question_prompt",
  "topic",
  "subtopic",
  "response",
  "correct",
  "points_earned",
  "points_possible",
  "attempt_points_earned",
  "attempt_points_possible",
  "attempt_percentage",
];

export const toBonusCSV = (attempt, { includeBom = true } = {}) => {
  const records = attempt.questions.map((question) => ({
    schema_version: attempt.schemaVersion,
    attempt_id: attempt.attemptId,
    bonus_id: attempt.bonusId,
    bonus_version: attempt.bonusVersion,
    unit: attempt.unit.number,
    started_at: attempt.startedAt,
    completed_at: attempt.completedAt,
    question_order: question.order,
    exercise_id: question.exerciseId,
    exercise_version: question.exerciseVersion,
    question_title: question.snapshot.title,
    question_prompt: question.snapshot.prompt,
    topic: question.topic,
    subtopic: question.subtopic,
    response: bonusQuestionResponseText(question),
    correct: question.correct,
    points_earned: question.pointsEarned,
    points_possible: question.pointsPossible,
    attempt_points_earned: attempt.summary.pointsEarned,
    attempt_points_possible: attempt.summary.pointsPossible,
    attempt_percentage: attempt.summary.percentage,
  }));

  return recordsToCsv({
    columns: BONUS_CSV_COLUMNS,
    records,
    includeBom,
    formulaSafeColumns: ["response"],
  });
};

export const bonusFilename = (bonus, attempt, extension) => {
  const shortId = attempt.attemptId.replace("attempt_", "").slice(0, 6);
  return `bono-unidad-${attempt.unit.number}-${sanitizeFilePart(bonus.slug)}-${shortId}.${extension}`;
};

export const validateCompletedBonusAttempt = (attempt) => {
  const errors = [];
  const require = (condition, message) => {
    if (!condition) errors.push(message);
  };
  require(attempt?.schemaVersion === BONUS_ATTEMPT_SCHEMA_VERSION, "schemaVersion inválida.");
  require(isAttemptId(attempt?.attemptId), "attemptId inválido.");
  require(Number.isInteger(attempt?.bonusVersion) && attempt.bonusVersion > 0, "bonusVersion inválida.");
  require(attempt?.modality === "bonus", "modality inválida.");
  require(attempt?.purpose === "learning", "purpose inválido.");
  require(attempt?.exposure === "public", "exposure inválida.");
  require(attempt?.feedbackPolicy === "afterAttempt", "feedbackPolicy inválida.");
  require(isExactIsoDate(attempt?.startedAt), "startedAt debe usar ISO 8601.");
  require(isExactIsoDate(attempt?.completedAt), "completedAt debe usar ISO 8601.");
  require(attempt?.privacy?.collection === "local", "collection inválida.");
  require(attempt?.privacy?.identity === "anonymous", "identity inválida.");
  require(Array.isArray(attempt?.questions) && attempt.questions.length > 0, "Faltan preguntas.");
  require(Number.isFinite(attempt?.summary?.pointsEarned), "Falta pointsEarned.");
  require(Number.isFinite(attempt?.summary?.pointsPossible), "Falta pointsPossible.");
  require(Number.isFinite(attempt?.summary?.percentage), "Falta percentage.");
  return { valid: errors.length === 0, errors };
};
