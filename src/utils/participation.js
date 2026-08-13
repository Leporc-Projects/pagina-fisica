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
import { localizeParticipationData } from "../data/participation-localize.js";
import { t } from "../i18n/index.js";
import { recordsToCsv } from "./local-export.js";

export { escapeCsvField } from "./local-export.js";

export const PARTICIPATION_SCHEMA_VERSION = "1.1.0";
export const LEGACY_PARTICIPATION_SCHEMA_VERSION = "1.0.0";
export const SUPPORTED_PARTICIPATION_SCHEMA_VERSIONS = Object.freeze([
  LEGACY_PARTICIPATION_SCHEMA_VERSION,
  PARTICIPATION_SCHEMA_VERSION,
]);
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

const cleanRequiredText = (value, label, locale) => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(t(locale, "participation.validation.required", { label }));
  }

  return value.trim();
};

const cleanOptionalText = (value) => {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim();
  return cleaned === "" ? undefined : cleaned;
};

const assertEnum = (value, allowed, label, locale) => {
  if (!allowed.includes(value)) {
    throw new TypeError(t(locale, "participation.validation.invalid", { label }));
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

const normalizePayload = (activityType, payload = {}, locale = "es") => {
  if (activityType === "concept-difficulty") {
    const normalized = {
      unclearPoint: cleanRequiredText(
        payload.unclearPoint,
        t(locale, "participation.unclear"),
        locale
      ),
    };

    if (payload.helpfulSupport) {
      normalized.helpfulSupport = assertEnum(
        payload.helpfulSupport,
        SUPPORT_VALUES,
        t(locale, "participation.field.support"),
        locale
      );
      if (normalized.helpfulSupport === "other") {
        normalized.helpfulSupportOther = cleanRequiredText(
          payload.helpfulSupportOther,
          t(locale, "participation.supportOther"),
          locale
        );
      }
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
        t(locale, "participation.proposalType"),
        locale
      ),
      statement: cleanRequiredText(payload.statement, t(locale, "participation.statement"), locale),
      intendedConcept: cleanRequiredText(
        payload.intendedConcept,
        t(locale, "participation.conceptTested"),
        locale
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
          t(locale, "participation.field.difficulty"),
          locale
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
        t(locale, "participation.area"),
        locale
      ),
      improvement: cleanRequiredText(
        payload.improvement,
        t(locale, "participation.improvement"),
        locale
      ),
    };

    if (payload.helpfulness) {
      normalized.helpfulness = assertEnum(
        payload.helpfulness,
        HELPFULNESS_VALUES,
        t(locale, "participation.field.rating"),
        locale
      );
    }

    return normalized;
  }

  throw new TypeError("El tipo de actividad no pertenece al contrato.");
};

export const createParticipationResponse = (input, environment = {}) => {
  const locale = environment.locale ?? "es";
  const activityType = assertEnum(
    input?.activityType,
    ACTIVITY_TYPES,
    t(locale, "participation.field.activity"),
    locale
  );
  const topicSlug = assertEnum(
    input?.topicSlug,
    TOPIC_SLUGS,
    t(locale, "participation.field.topic"),
    locale
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
    payload: normalizePayload(activityType, input.payload, locale),
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

  require(
    SUPPORTED_PARTICIPATION_SCHEMA_VERSIONS.includes(response?.schemaVersion),
    "schemaVersion inválida."
  );
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
    if (response?.schemaVersion === PARTICIPATION_SCHEMA_VERSION) {
      require(
        response?.payload?.helpfulSupport !== "other" ||
          hasText(response?.payload?.helpfulSupportOther),
        "Falta el detalle de la otra ayuda sugerida."
      );
      require(
        response?.payload?.helpfulSupport === "other" ||
          response?.payload?.helpfulSupportOther === undefined,
        "El detalle de otra ayuda solo corresponde a helpfulSupport other."
      );
    } else {
      require(
        response?.payload?.helpfulSupportOther === undefined,
        "El esquema 1.0.0 no admite el detalle de otra ayuda."
      );
    }
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

export const participationSummary = (response, locale = "es") => {
  const result = validateParticipationResponse(response);
  if (!result.valid) throw new TypeError(result.errors.join(" "));

  const presentation = localizeParticipationData(locale);
  const labels = {
    activity: Object.fromEntries(presentation.activityOptions.map(({ value, label }) => [value, label])),
    support: Object.fromEntries(presentation.supportOptions),
    proposalType: Object.fromEntries(presentation.proposalTypes),
    difficulty: Object.fromEntries(presentation.difficultyEstimates),
    area: Object.fromEntries(presentation.improvementAreas),
    helpfulness: Object.fromEntries(presentation.helpfulnessOptions),
  };

  const common = {
    type: labels.activity[response.activityType],
    topic: presentation.topics.find((topic) => topic.slug === response.topic.slug)?.title ?? response.topic.title,
  };

  if (response.activityType === "concept-difficulty") {
    return {
      ...common,
      response: response.payload.unclearPoint,
      optional: response.payload.helpfulSupport
        ? [
          [t(locale, "participation.couldHelp"), labels.support[response.payload.helpfulSupport]],
          response.payload.helpfulSupportOther && [
            t(locale, "participation.supportOtherDetail"),
            response.payload.helpfulSupportOther,
          ],
        ].filter(Boolean)
        : [],
    };
  }

  if (response.activityType === "student-question-proposal") {
    const proposal = response.payload.proposal;
    const optional = [
      proposal.expectedAnswer && [t(locale, "participation.expectedAnswer"), proposal.expectedAnswer],
      proposal.answerExplanation && [t(locale, "participation.answerExplanation"), proposal.answerExplanation],
      proposal.studentDifficultyEstimate && [
        t(locale, "participation.studentDifficulty"),
        labels.difficulty[proposal.studentDifficultyEstimate.value],
      ],
    ].filter(Boolean);

    return {
      ...common,
      response: proposal.statement,
      details: [
        [t(locale, "participation.proposalType"), labels.proposalType[proposal.kind]],
        [t(locale, "participation.conceptTested"), proposal.intendedConcept],
      ],
      optional,
    };
  }

  return {
    ...common,
    response: response.payload.improvement,
    details: [[t(locale, "participation.aspect"), labels.area[response.payload.area]]],
    optional: response.payload.helpfulness
      ? [[t(locale, "participation.optionalRating"), labels.helpfulness[response.payload.helpfulness]]]
      : [],
  };
};

export const toParticipationText = (response, locale = "es") => {
  const summary = participationSummary(response, locale);
  const lines = [
    "Aula Física",
    t(locale, "participation.exportHeading"),
    "",
    `${t(locale, "participation.type")}: ${summary.type}`,
    `${t(locale, "participation.topicShort")}: ${summary.topic}`,
    `${t(locale, "participation.response")}: ${summary.response}`,
  ];

  [...(summary.details ?? []), ...summary.optional].forEach(([label, value]) => {
    lines.push(`${label}: ${value}`);
  });

  lines.push(
    "",
    `${t(locale, "participation.responseId")}: ${response.responseId}`,
    `${t(locale, "participation.date")} ISO: ${response.createdAt}`,
    `${t(locale, "participation.exportPurpose")}: ${response.purpose}`,
    t(locale, "participation.exportPrivacy"),
    t(locale, "participation.exportCollection"),
    "",
    t(locale, "participation.exportNoSend")
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
  "helpful_support_other",
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
    helpful_support_other: response.payload.helpfulSupportOther,
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
