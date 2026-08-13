import { BONUSES } from "../data/bonuses/index.js";
import {
  ACTIVITY_OPTIONS,
  HELPFULNESS_OPTIONS,
  IMPROVEMENT_AREAS,
  PARTICIPATION_CONTEXT,
  PARTICIPATION_TOPICS,
  PROPOSAL_TYPES,
  STUDENT_DIFFICULTY_ESTIMATES,
  SUPPORT_OPTIONS,
} from "../data/participation.js";
import {
  REVIEW_FILE_MAX_BYTES,
  REVIEW_PAGE_SIZE,
  REVIEW_SESSION_SCHEMA_VERSION,
  REVIEW_STATUSES,
} from "../data/review.js";
import {
  BONUS_ATTEMPT_SCHEMA_VERSION,
  LEGACY_BONUS_ATTEMPT_SCHEMA_VERSION,
  attemptIdentity,
  isAttemptId,
  validateCompletedBonusAttempt,
} from "./bonus.js";
import { recordsToCsv, sanitizeFilePart } from "./local-export.js";
import {
  isResponseId,
  SUPPORTED_PARTICIPATION_SCHEMA_VERSIONS,
  validateParticipationResponse,
} from "./participation.js";
import { localizeParticipationData } from "../data/participation-localize.js";

const labelMap = (options) => Object.fromEntries(options);

export const REVIEW_LABELS = {
  activity: Object.fromEntries(
    ACTIVITY_OPTIONS.map((option) => [option.value, option.label])
  ),
  support: labelMap(SUPPORT_OPTIONS),
  proposalType: labelMap(PROPOSAL_TYPES),
  studentDifficulty: labelMap(STUDENT_DIFFICULTY_ESTIMATES),
  improvementArea: labelMap(IMPROVEMENT_AREAS),
  helpfulness: labelMap(HELPFULNESS_OPTIONS),
  reviewStatus: labelMap(REVIEW_STATUSES),
};

const topicMap = new Map(PARTICIPATION_TOPICS.map((topic) => [topic.slug, topic]));
const bonusMap = new Map(BONUSES.map((bonus) => [bonus.id, bonus]));

const isExactIsoDate = (value) => {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value;
};

const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};

const cloneRecord = (record) => ({
  ...record,
  sourceFiles: [...record.sourceFiles],
});

export const createReviewSession = () => ({
  records: [],
  incidents: [],
});

const invalidResult = (reasonCode, reason) => ({ status: "invalid", reasonCode, reason });

export const validateImportedDocument = (document) => {
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    return invalidResult("invalid-object", "El JSON no contiene un objeto de respuesta reconocido.");
  }

  if ("responseId" in document || "activityType" in document) {
    if (!SUPPORTED_PARTICIPATION_SCHEMA_VERSIONS.includes(document.schemaVersion)) {
      return invalidResult("unsupported-participation-schema", "La versión del esquema de Participa no está soportada.");
    }
    const validation = validateParticipationResponse(document);
    if (!validation.valid) return invalidResult("invalid-participation", validation.errors.join(" "));
    return {
      status: "valid",
      reason: "Respuesta de Participa válida.",
      reasonCode: "valid-participation",
      kind: "participation",
      id: document.responseId,
      original: deepFreeze(document),
    };
  }

  if ("attemptId" in document || "bonusId" in document) {
    if (![BONUS_ATTEMPT_SCHEMA_VERSION, LEGACY_BONUS_ATTEMPT_SCHEMA_VERSION]
      .includes(document.schemaVersion)) {
      return invalidResult("unsupported-bonus-schema", "La versión del esquema de Bono no está soportada.");
    }
    const validation = validateCompletedBonusAttempt(document);
    if (!validation.valid) return invalidResult("invalid-bonus", validation.errors.join(" "));
    if (!isAttemptId(document.attemptId)) return invalidResult("invalid-attempt-id", "attemptId inválido.");
    const bonus = bonusMap.get(document.bonusId);
    if (!bonus) return invalidResult("unknown-bonus", "El Bono indicado no pertenece al registro conocido.");
    if (bonus.version !== document.bonusVersion) {
      return invalidResult("bonus-version-mismatch", "La versión del Bono no coincide con el registro conocido.");
    }
    return {
      status: "valid",
      reason: "Intento de Bono válido; disponible solo para consulta.",
      reasonCode: "valid-bonus",
      kind: "bonus",
      id: document.attemptId,
      original: deepFreeze(document),
    };
  }

  return invalidResult("unknown-contract", "El tipo de archivo JSON no pertenece a un contrato reconocido.");
};

export const parseReviewImportEntry = (entry) => {
  const name = typeof entry?.name === "string" && entry.name.trim()
    ? entry.name.trim()
    : "archivo-sin-nombre.json";
  const size = Number.isFinite(entry?.size) ? entry.size : 0;

  if (!name.toLocaleLowerCase("es").endsWith(".json")) {
    return { file: name, status: "invalid", reasonCode: "json-only", reason: "El formato de importación debe ser JSON." };
  }

  if (size > REVIEW_FILE_MAX_BYTES) {
    return {
      file: name,
      status: "invalid",
      reasonCode: "file-too-large",
      reason: `El archivo supera el límite de ${REVIEW_FILE_MAX_BYTES / 1024 / 1024} MB.`,
    };
  }
  if (typeof entry?.text !== "string") {
    return { file: name, status: "invalid", reasonCode: "unreadable-file", reason: "No fue posible leer el archivo." };
  }

  let document;
  try {
    document = JSON.parse(entry.text);
  } catch {
    return { file: name, status: "invalid", reasonCode: "invalid-json", reason: "JSON inválido." };
  }

  return { file: name, ...validateImportedDocument(document) };
};

export const addReviewImportEntries = (session, entries) => {
  const records = (session?.records ?? []).map(cloneRecord);
  const incidents = [...(session?.incidents ?? [])];
  const recordsByKey = new Map(records.map((record) => [record.key, record]));

  entries.forEach((entry) => {
    const result = parseReviewImportEntry(entry);
    if (result.status === "invalid") {
      incidents.push({ file: result.file, status: "invalid", reasonCode: result.reasonCode, reason: result.reason });
      return;
    }

    const key = `${result.kind}:${result.id}`;
    const existing = recordsByKey.get(key);
    if (existing) {
      if (!existing.sourceFiles.includes(result.file)) existing.sourceFiles.push(result.file);
      incidents.push({
        file: result.file,
        status: "warning",
        reason: "Duplicado detectado; los agregados conservan la primera instancia.",
        reasonCode: "duplicate-record",
        key,
      });
      return;
    }

    const record = {
      key,
      kind: result.kind,
      id: result.id,
      original: result.original,
      sourceFiles: [result.file],
    };
    records.push(record);
    recordsByKey.set(key, record);
    incidents.push({
      file: result.file,
      status: "valid",
      reason: result.reason,
      reasonCode: result.reasonCode,
      key,
    });
  });

  return { records, incidents };
};

const increment = (target, key) => {
  if (!key) return;
  target[key] = (target[key] ?? 0) + 1;
};

export const aggregateReviewSession = (session) => {
  const activity = {};
  const difficultyTopics = {};
  const requestedSupport = {};
  const improvementAreas = {};
  const helpfulness = {};
  let participation = 0;
  let bonuses = 0;
  const bonusIdentity = { anonymous: 0, institutionalEmail: 0 };
  let withoutTopic = 0;

  session.records.forEach((record) => {
    if (record.kind === "bonus") {
      bonuses += 1;
      increment(bonusIdentity, attemptIdentity(record.original).mode);
      return;
    }
    participation += 1;
    const response = record.original;
    increment(activity, response.activityType);
    if (!response.topic?.slug) withoutTopic += 1;

    if (response.activityType === "concept-difficulty") {
      increment(difficultyTopics, response.topic?.slug);
      increment(requestedSupport, response.payload.helpfulSupport);
    }
    if (response.activityType === "improvement-feedback") {
      increment(improvementAreas, response.payload.area);
      increment(helpfulness, response.payload.helpfulness);
    }
  });

  const incidentCounts = session.incidents.reduce(
    (counts, incident) => ({
      ...counts,
      [incident.status]: counts[incident.status] + 1,
    }),
    { valid: 0, warning: 0, invalid: 0 }
  );

  return {
    files: session.incidents.length,
    uniqueRecords: session.records.length,
    participation,
    bonuses,
    bonusIdentity,
    duplicates: incidentCounts.warning,
    incidents: incidentCounts,
    activity,
    difficultyTopics,
    requestedSupport,
    improvementAreas,
    helpfulness,
    withoutTopic,
  };
};

const normalizeSearch = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("es");

export const participationMainText = (response) => {
  if (response.activityType === "concept-difficulty") return response.payload.unclearPoint;
  if (response.activityType === "student-question-proposal") {
    return response.payload.proposal.statement;
  }
  return response.payload.improvement;
};

const searchableParticipationText = (response) => {
  const proposal = response.payload.proposal;
  return [
    response.topic?.title,
    participationMainText(response),
    proposal?.intendedConcept,
    proposal?.expectedAnswer,
    proposal?.answerExplanation,
    response.payload.helpfulSupportOther,
  ].filter(Boolean).join(" ");
};

export const filterParticipationRecords = (session, filters = {}) => {
  const query = normalizeSearch(filters.query).trim();
  const filtered = session.records.filter((record) => {
    if (record.kind !== "participation") return false;
    const response = record.original;
    if (filters.activityType && response.activityType !== filters.activityType) return false;
    if (filters.topic && response.topic?.slug !== filters.topic) return false;
    return !query || normalizeSearch(searchableParticipationText(response)).includes(query);
  });
  const pageSize = Number.isInteger(filters.pageSize) && filters.pageSize > 0
    ? filters.pageSize
    : REVIEW_PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Number.isInteger(filters.page) ? filters.page : 1;
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const start = (page - 1) * pageSize;

  return {
    records: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageCount,
    pageSize,
  };
};

export const getProposalRecords = (session) => session.records.filter(
  (record) => record.kind === "participation" &&
    record.original.activityType === "student-question-proposal"
);

export const updateProposalReview = (
  reviews,
  responseId,
  input,
  reviewedAt = new Date().toISOString()
) => {
  const allowedStatuses = REVIEW_STATUSES.map(([value]) => value);
  if (!isResponseId(responseId)) throw new TypeError("responseId inválido.");
  if (!allowedStatuses.includes(input.status)) throw new TypeError("Estado de revisión inválido.");
  if (!isExactIsoDate(reviewedAt)) throw new TypeError("reviewedAt debe usar ISO 8601.");
  const note = typeof input.note === "string" ? input.note.trim() : "";
  return {
    ...reviews,
    [responseId]: {
      status: input.status,
      note: note || null,
      reviewedAt,
    },
  };
};

export const proposalReviewFor = (reviews, responseId) => reviews[responseId] ?? {
  status: "pending",
  note: null,
  reviewedAt: null,
};

export const createReviewExport = (
  session,
  reviews = {},
  generatedAt = new Date().toISOString()
) => {
  if (!isExactIsoDate(generatedAt)) throw new TypeError("generatedAt debe usar ISO 8601.");
  return {
    schemaVersion: REVIEW_SESSION_SCHEMA_VERSION,
    generatedAt,
    course: { ...PARTICIPATION_CONTEXT.course },
    unit: { ...PARTICIPATION_CONTEXT.unit },
    summary: aggregateReviewSession(session),
    items: session.records.map((record) => ({
      kind: record.kind,
      id: record.id,
      sourceFiles: [...record.sourceFiles],
      original: record.original,
      review: record.kind === "participation" &&
        record.original.activityType === "student-question-proposal"
        ? proposalReviewFor(reviews, record.id)
        : null,
    })),
    incidents: session.incidents.map((incident) => ({ ...incident })),
    authenticity: "local-editable-file",
  };
};

export const REVIEW_CSV_COLUMNS = [
  "schema_version",
  "response_id",
  "activity_type",
  "unit",
  "topic",
  "created_at",
  "purpose",
  "privacy",
  "category",
  "main_text",
  "optional_text",
  "student_difficulty_estimate",
  "review_status",
  "review_note",
  "reviewed_at",
];

const participationCsvRow = (item) => {
  const response = item.original;
  const proposal = response.payload.proposal;
  let category = "";
  let optionalText = "";
  if (response.activityType === "concept-difficulty") {
    category = response.payload.helpfulSupport ?? "";
    optionalText = response.payload.helpfulSupportOther ?? "";
  } else if (response.activityType === "student-question-proposal") {
    category = proposal.kind;
    optionalText = [
      proposal.intendedConcept,
      proposal.expectedAnswer,
      proposal.answerExplanation,
    ].filter(Boolean).join("\n");
  } else {
    category = response.payload.area;
    optionalText = response.payload.helpfulness ?? "";
  }

  return {
    schema_version: response.schemaVersion,
    response_id: response.responseId,
    activity_type: response.activityType,
    unit: response.unit.number,
    topic: response.topic.slug,
    created_at: response.createdAt,
    purpose: response.purpose,
    privacy: response.privacy,
    category,
    main_text: participationMainText(response),
    optional_text: optionalText,
    student_difficulty_estimate: proposal?.studentDifficultyEstimate?.value ?? "",
    review_status: item.review?.status ?? "",
    review_note: item.review?.note ?? "",
    reviewed_at: item.review?.reviewedAt ?? "",
  };
};

export const toReviewCSV = (reviewExport, { includeBom = true } = {}) => recordsToCsv({
  columns: REVIEW_CSV_COLUMNS,
  records: reviewExport.items
    .filter((item) => item.kind === "participation")
    .map(participationCsvRow),
  includeBom,
  formulaSafeColumns: [
    "response_id",
    "category",
    "main_text",
    "optional_text",
    "review_note",
  ],
});

export const toReviewJSON = (reviewExport) => `${JSON.stringify(reviewExport, null, 2)}\n`;

const countLines = (record, labels) => Object.entries(record)
  .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
  .map(([key, count]) => `- ${labels[key] ?? key}: ${count}`);

export const toReviewText = (reviewExport, locale = "es") => {
  const participation = localizeParticipationData(locale);
  const localizedLabels = {
    activity: Object.fromEntries(participation.activityOptions.map((option) => [option.value, option.label])),
    improvementArea: Object.fromEntries(participation.improvementAreas),
    topic: Object.fromEntries(participation.topics.map((topic) => [topic.slug, topic.title])),
  };
  const summary = reviewExport.summary;
  const copy = locale === "es" ? {
    course: "Aula Física · Física Básica I",
    title: "Centro de revisión",
    date: "Fecha",
    files: "Archivos procesados",
    valid: "Válidos",
    warnings: "Advertencias",
    invalid: "Inválidos",
    duplicates: "Duplicados",
    unique: "Registros únicos",
    activity: "Participación por actividad",
    topics: "Dificultades mencionadas por tema",
    improvements: "Áreas de mejora",
    bonuses: "Intentos de Bono reconocidos",
    anonymous: "Anónimos",
    identified: "Identificados",
    caveat: "Los conteos describen los archivos importados; no estiman dominio ni causalidad.",
    local: "Los archivos se procesaron localmente y no fueron enviados automáticamente.",
  } : {
    course: "Aula Física · Basic Physics I",
    title: "Review center",
    date: "Date",
    files: "Files processed",
    valid: "Valid",
    warnings: "Warnings",
    invalid: "Invalid",
    duplicates: "Duplicates",
    unique: "Unique records",
    activity: "Participation by activity",
    topics: "Reported difficulties by topic",
    improvements: "Improvement areas",
    bonuses: "Recognized Bonus attempts",
    anonymous: "Anonymous",
    identified: "Identified",
    caveat: "Counts describe the imported files; they do not estimate mastery or causality.",
    local: "Files were processed locally and were not sent automatically.",
  };
  return [
    copy.course,
    copy.title,
    `${copy.date}: ${reviewExport.generatedAt}`,
    "",
    `${copy.files}: ${summary.files}`,
    `${copy.valid}: ${summary.incidents.valid}`,
    `${copy.warnings}: ${summary.incidents.warning}`,
    `${copy.invalid}: ${summary.incidents.invalid}`,
    `${copy.duplicates}: ${summary.duplicates}`,
    `${copy.unique}: ${summary.uniqueRecords}`,
    "",
    copy.activity,
    ...countLines(summary.activity, localizedLabels.activity),
    "",
    copy.topics,
    ...countLines(summary.difficultyTopics, localizedLabels.topic),
    "",
    copy.improvements,
    ...countLines(summary.improvementAreas, localizedLabels.improvementArea),
    "",
    `${copy.bonuses}: ${summary.bonuses}`,
    `- ${copy.anonymous}: ${summary.bonusIdentity.anonymous}`,
    `- ${copy.identified}: ${summary.bonusIdentity.institutionalEmail}`,
    copy.caveat,
    copy.local,
  ].join("\n") + "\n";
};

export const reviewFilename = (reviewExport, extension) => {
  const date = reviewExport.generatedAt.slice(0, 10);
  return `revision-${sanitizeFilePart(reviewExport.course.slug)}-${date}.${extension}`;
};

export const reviewTopicTitle = (slug) => topicMap.get(slug)?.title ?? slug;
