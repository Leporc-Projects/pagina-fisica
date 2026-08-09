import {
  ACTIVITY_TYPES,
  HELPFULNESS_OPTIONS,
  IMPROVEMENT_AREAS,
  PARTICIPATION_CONTEXT,
  PARTICIPATION_TOPICS,
  PROPOSAL_TYPES,
  STUDENT_DIFFICULTY_ESTIMATES,
  SUPPORT_OPTIONS,
} from "../data/participation.js";
import { recordsToCsv } from "./local-export.js";

export { escapeCsvField } from "./local-export.js";

export const PARTICIPATION_SCHEMA_VERSION = "1.0.0";
export const STUDENT_PROPOSAL_SCHEMA_VERSION = "1.0.0";
export const PARTICIPATION_PURPOSES = ["feedback", "learning", "contribution"];
export const PARTICIPATION_COLLECTIONS = ["local"];
export const PARTICIPATION_PRIVACY_LEVELS = ["anonymous"];
export const PROPOSAL_REVIEW_STATUSES = [
  "unreviewed",
  "in-review",
  "correction-requested",
  "approved",
];

const ACTIVITY_PURPOSE = {
  "concept-difficulty": "learning",
  "student-question-proposal": "contribution",
  "improvement-feedback": "feedback",
};

const optionValues = (options) => options.map(([value]) => value);
const SUPPORT_VALUES = optionValues(SUPPORT_OPTIONS);
const PROPOSAL_TYPE_VALUES = optionValues(PROPOSAL_TYPES);
const DIFFICULTY_VALUES = optionValues(STUDENT_DIFFICULTY_ESTIMATES);
const IMPROVEMENT_AREA_VALUES = optionValues(IMPROVEMENT_AREAS);
const HELPFULNESS_VALUES = optionValues(HELPFULNESS_OPTIONS);
const TOPIC_SLUGS = PARTICIPATION_TOPICS.map((topic) => topic.slug);

const cleanRequiredText = (value, label) => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} es obligatorio.`);
  }

  return value.trim();
};

const cleanOptionalText = (value) => {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim();
  return cleaned === "" ? undefined : cleaned;
};

const assertEnum = (value, allowed, label) => {
  if (!allowed.includes(value)) {
    throw new TypeError(`${label} no pertenece al contrato permitido.`);
  }

  return value;
};

const addOptional = (target, key, value) => {
  if (value !== undefined) target[key] = value;
};

export const responseIdFromBytes = (bytes) => {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 16) {
    throw new TypeError("El ID requiere exactamente 16 bytes aleatorios.");
  }

  return `resp_${[...bytes]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
};

export const generateResponseId = (cryptoApi = globalThis.crypto) => {
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("El navegador no ofrece generación criptográfica de IDs.");
  }

  return responseIdFromBytes(cryptoApi.getRandomValues(new Uint8Array(16)));
};

export const isResponseId = (value) =>
  typeof value === "string" && /^resp_[0-9a-f]{32}$/.test(value);

const normalizePayload = (activityType, payload = {}) => {
  if (activityType === "concept-difficulty") {
    const normalized = {
      unclearPoint: cleanRequiredText(
        payload.unclearPoint,
        "¿Qué te quedó menos claro?"
      ),
    };

    if (payload.helpfulSupport) {
      normalized.helpfulSupport = assertEnum(
        payload.helpfulSupport,
        SUPPORT_VALUES,
        "La ayuda sugerida"
      );
    }

    return normalized;
  }

  if (activityType === "student-question-proposal") {
    const proposal = {
      schemaVersion: STUDENT_PROPOSAL_SCHEMA_VERSION,
      source: "student",
      kind: assertEnum(
        payload.proposalType,
        PROPOSAL_TYPE_VALUES,
        "El tipo de propuesta"
      ),
      statement: cleanRequiredText(payload.statement, "El enunciado"),
      intendedConcept: cleanRequiredText(
        payload.intendedConcept,
        "El concepto que intenta poner a prueba"
      ),
      review: {
        status: "unreviewed",
        academicExerciseId: null,
        editorialDifficulty: null,
      },
    };

    addOptional(
      proposal,
      "expectedAnswer",
      cleanOptionalText(payload.expectedAnswer)
    );
    addOptional(
      proposal,
      "answerExplanation",
      cleanOptionalText(payload.answerExplanation)
    );

    if (payload.studentDifficultyEstimate) {
      proposal.studentDifficultyEstimate = {
        scale: "student-self-estimate-v1",
        value: assertEnum(
          payload.studentDifficultyEstimate,
          DIFFICULTY_VALUES,
          "La dificultad estimada"
        ),
      };
    }

    return { proposal };
  }

  if (activityType === "improvement-feedback") {
    const normalized = {
      area: assertEnum(
        payload.area,
        IMPROVEMENT_AREA_VALUES,
        "El aspecto por mejorar"
      ),
      improvement: cleanRequiredText(
        payload.improvement,
        "¿Qué cambiarías o mejorarías?"
      ),
    };

    if (payload.helpfulness) {
      normalized.helpfulness = assertEnum(
        payload.helpfulness,
        HELPFULNESS_VALUES,
        "La valoración"
      );
    }

    return normalized;
  }

  throw new TypeError("El tipo de actividad no pertenece al contrato.");
};

export const createParticipationResponse = (input, environment = {}) => {
  const activityType = assertEnum(
    input?.activityType,
    ACTIVITY_TYPES,
    "El tipo de actividad"
  );
  const topicSlug = assertEnum(
    input?.topicSlug,
    TOPIC_SLUGS,
    "El tema"
  );
  const topic = PARTICIPATION_TOPICS.find((item) => item.slug === topicSlug);
  const createdAt = environment.createdAt ?? new Date().toISOString();
  const responseId = environment.responseId ?? generateResponseId();

  const response = {
    schemaVersion: PARTICIPATION_SCHEMA_VERSION,
    responseId,
    activityType,
    course: { ...PARTICIPATION_CONTEXT.course },
    unit: { ...PARTICIPATION_CONTEXT.unit },
    topic: { ...topic },
    createdAt,
    purpose: ACTIVITY_PURPOSE[activityType],
    collection: "local",
    privacy: "anonymous",
    // Punto de extensión deliberadamente vacío hasta definir entrega,
    // consentimiento, privacidad y flujo docente.
    submissionTarget: null,
    payload: normalizePayload(activityType, input.payload),
  };

  const result = validateParticipationResponse(response);
  if (!result.valid) throw new TypeError(result.errors.join(" "));

  return response;
};

const isExactIsoDate = (value) => {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value;
};

const hasText = (value) => typeof value === "string" && value.trim() !== "";

export const validateParticipationResponse = (response) => {
  const errors = [];
  const require = (condition, message) => {
    if (!condition) errors.push(message);
  };

  require(response?.schemaVersion === PARTICIPATION_SCHEMA_VERSION, "schemaVersion inválida.");
  require(isResponseId(response?.responseId), "responseId inválido.");
  require(ACTIVITY_TYPES.includes(response?.activityType), "activityType inválido.");
  require(
    response?.course?.code === PARTICIPATION_CONTEXT.course.code &&
      response?.course?.slug === PARTICIPATION_CONTEXT.course.slug &&
      response?.course?.title === PARTICIPATION_CONTEXT.course.title,
    "course inválido."
  );
  require(
    response?.unit?.number === PARTICIPATION_CONTEXT.unit.number &&
      response?.unit?.slug === PARTICIPATION_CONTEXT.unit.slug &&
      response?.unit?.title === PARTICIPATION_CONTEXT.unit.title,
    "unit inválida."
  );
  const expectedTopic = PARTICIPATION_TOPICS.find(
    (topic) => topic.slug === response?.topic?.slug
  );
  require(
    expectedTopic !== undefined && response?.topic?.title === expectedTopic.title,
    "topic inválido."
  );
  require(isExactIsoDate(response?.createdAt), "createdAt debe usar ISO 8601.");
  require(
    PARTICIPATION_PURPOSES.includes(response?.purpose) &&
      response?.purpose === ACTIVITY_PURPOSE[response?.activityType],
    "purpose inválido."
  );
  require(PARTICIPATION_COLLECTIONS.includes(response?.collection), "collection inválida.");
  require(PARTICIPATION_PRIVACY_LEVELS.includes(response?.privacy), "privacy inválida.");
  require(response?.submissionTarget === null, "submissionTarget debe permanecer vacío.");

  if (response?.activityType === "concept-difficulty") {
    require(hasText(response?.payload?.unclearPoint), "Falta la dificultad conceptual.");
    require(
      response?.payload?.helpfulSupport === undefined ||
        SUPPORT_VALUES.includes(response.payload.helpfulSupport),
      "La ayuda sugerida es inválida."
    );
  }

  if (response?.activityType === "student-question-proposal") {
    const proposal = response?.payload?.proposal;
    require(proposal?.schemaVersion === STUDENT_PROPOSAL_SCHEMA_VERSION, "Contrato de propuesta inválido.");
    require(proposal?.source === "student", "La fuente de la propuesta es inválida.");
    require(PROPOSAL_TYPE_VALUES.includes(proposal?.kind), "El tipo de propuesta es inválido.");
    require(hasText(proposal?.statement), "Falta el enunciado propuesto.");
    require(hasText(proposal?.intendedConcept), "Falta el concepto evaluado.");
    require(proposal?.review?.status === "unreviewed", "La propuesta pública debe estar sin revisar.");
    require(proposal?.review?.academicExerciseId === null, "La propuesta no puede enlazar un ejercicio académico.");
    require(proposal?.review?.editorialDifficulty === null, "La dificultad editorial debe permanecer vacía.");
    require(
      proposal?.studentDifficultyEstimate === undefined ||
        DIFFICULTY_VALUES.includes(proposal.studentDifficultyEstimate?.value),
      "La dificultad estimada por el estudiante es inválida."
    );
  }

  if (response?.activityType === "improvement-feedback") {
    require(IMPROVEMENT_AREA_VALUES.includes(response?.payload?.area), "El área por mejorar es inválida.");
    require(hasText(response?.payload?.improvement), "Falta la mejora propuesta.");
    require(
      response?.payload?.helpfulness === undefined ||
        HELPFULNESS_VALUES.includes(response.payload.helpfulness),
      "La valoración es inválida."
    );
  }

  return { valid: errors.length === 0, errors };
};

const labels = {
  activity: Object.fromEntries([
    ["concept-difficulty", "¿Qué te quedó menos claro?"],
    ["student-question-proposal", "Propuesta de pregunta o problema"],
    ["improvement-feedback", "Ayúdanos a mejorar"],
  ]),
  support: Object.fromEntries(SUPPORT_OPTIONS),
  proposalType: Object.fromEntries(PROPOSAL_TYPES),
  difficulty: Object.fromEntries(STUDENT_DIFFICULTY_ESTIMATES),
  area: Object.fromEntries(IMPROVEMENT_AREAS),
  helpfulness: Object.fromEntries(HELPFULNESS_OPTIONS),
};

export const participationSummary = (response) => {
  const result = validateParticipationResponse(response);
  if (!result.valid) throw new TypeError(result.errors.join(" "));

  const common = {
    type: labels.activity[response.activityType],
    topic: response.topic.title,
  };

  if (response.activityType === "concept-difficulty") {
    return {
      ...common,
      response: response.payload.unclearPoint,
      optional: response.payload.helpfulSupport
        ? [["Podría ayudar", labels.support[response.payload.helpfulSupport]]]
        : [],
    };
  }

  if (response.activityType === "student-question-proposal") {
    const proposal = response.payload.proposal;
    const optional = [
      proposal.expectedAnswer && ["Respuesta esperada", proposal.expectedAnswer],
      proposal.answerExplanation && ["Explicación", proposal.answerExplanation],
      proposal.studentDifficultyEstimate && [
        "Dificultad estimada por el estudiante",
        labels.difficulty[proposal.studentDifficultyEstimate.value],
      ],
    ].filter(Boolean);

    return {
      ...common,
      response: proposal.statement,
      details: [
        ["Tipo de propuesta", labels.proposalType[proposal.kind]],
        ["Concepto que intenta poner a prueba", proposal.intendedConcept],
      ],
      optional,
    };
  }

  return {
    ...common,
    response: response.payload.improvement,
    details: [["Aspecto", labels.area[response.payload.area]]],
    optional: response.payload.helpfulness
      ? [["Valoración opcional", labels.helpfulness[response.payload.helpfulness]]]
      : [],
  };
};

export const toParticipationText = (response) => {
  const summary = participationSummary(response);
  const lines = [
    "Papilla's Physics",
    "Respuesta de participación preparada localmente",
    "",
    `Tipo: ${summary.type}`,
    `Tema: ${summary.topic}`,
    `Respuesta: ${summary.response}`,
  ];

  [...(summary.details ?? []), ...summary.optional].forEach(([label, value]) => {
    lines.push(`${label}: ${value}`);
  });

  lines.push(
    "",
    `ID de respuesta: ${response.responseId}`,
    `Fecha ISO: ${response.createdAt}`,
    `Propósito: ${response.purpose}`,
    "Privacidad: anónima",
    "Recopilación: local",
    "",
    "Esta versión no envía ni guarda tu respuesta automáticamente."
  );

  return `${lines.join("\n")}\n`;
};

export const toParticipationJSON = (response) => {
  const result = validateParticipationResponse(response);
  if (!result.valid) throw new TypeError(result.errors.join(" "));
  return `${JSON.stringify(response, null, 2)}\n`;
};

export const PARTICIPATION_CSV_COLUMNS = [
  "schema_version",
  "response_id",
  "activity_type",
  "course_code",
  "course_slug",
  "unit_number",
  "unit_slug",
  "topic_slug",
  "topic_title",
  "created_at",
  "purpose",
  "collection",
  "privacy",
  "submission_target",
  "unclear_point",
  "helpful_support",
  "proposal_schema_version",
  "proposal_type",
  "proposal_statement",
  "proposal_intended_concept",
  "proposal_expected_answer",
  "proposal_answer_explanation",
  "proposal_student_difficulty_scale",
  "proposal_student_difficulty_value",
  "proposal_review_status",
  "proposal_academic_exercise_id",
  "proposal_editorial_difficulty",
  "improvement_area",
  "improvement_text",
  "helpfulness",
  "payload_json",
];

const participationCsvRecord = (response) => {
  const proposal = response.payload.proposal;
  return {
    schema_version: response.schemaVersion,
    response_id: response.responseId,
    activity_type: response.activityType,
    course_code: response.course.code,
    course_slug: response.course.slug,
    unit_number: response.unit.number,
    unit_slug: response.unit.slug,
    topic_slug: response.topic.slug,
    topic_title: response.topic.title,
    created_at: response.createdAt,
    purpose: response.purpose,
    collection: response.collection,
    privacy: response.privacy,
    submission_target: response.submissionTarget,
    unclear_point: response.payload.unclearPoint,
    helpful_support: response.payload.helpfulSupport,
    proposal_schema_version: proposal?.schemaVersion,
    proposal_type: proposal?.kind,
    proposal_statement: proposal?.statement,
    proposal_intended_concept: proposal?.intendedConcept,
    proposal_expected_answer: proposal?.expectedAnswer,
    proposal_answer_explanation: proposal?.answerExplanation,
    proposal_student_difficulty_scale: proposal?.studentDifficultyEstimate?.scale,
    proposal_student_difficulty_value: proposal?.studentDifficultyEstimate?.value,
    proposal_review_status: proposal?.review?.status,
    proposal_academic_exercise_id: proposal?.review?.academicExerciseId,
    proposal_editorial_difficulty: proposal?.review?.editorialDifficulty,
    improvement_area: response.payload.area,
    improvement_text: response.payload.improvement,
    helpfulness: response.payload.helpfulness,
    payload_json: JSON.stringify(response.payload),
  };
};

export const toParticipationCSV = (response, { includeBom = true } = {}) => {
  const result = validateParticipationResponse(response);
  if (!result.valid) throw new TypeError(result.errors.join(" "));

  return recordsToCsv({
    columns: PARTICIPATION_CSV_COLUMNS,
    records: [participationCsvRecord(response)],
    includeBom,
  });
};

export const participationFilename = (response, extension) => {
  const result = validateParticipationResponse(response);
  if (!result.valid) throw new TypeError(result.errors.join(" "));
  return `participacion-${response.activityType}-${response.responseId}.${extension}`;
};
