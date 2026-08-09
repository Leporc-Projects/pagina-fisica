import assert from "node:assert/strict";
import test from "node:test";

import { UNIT_1_BONUSES } from "../src/data/physics/unit-1/bonuses.js";
import { UNIT_1_EXERCISES } from "../src/data/physics/unit-1/exercises.js";
import { REVIEW_FILE_MAX_BYTES } from "../src/data/review.js";
import {
  completeBonusAttempt,
  createBonusAttempt,
} from "../src/utils/bonus.js";
import { createParticipationResponse } from "../src/utils/participation.js";
import {
  addReviewImportEntries,
  aggregateReviewSession,
  createReviewExport,
  createReviewSession,
  filterParticipationRecords,
  getProposalRecords,
  parseReviewImportEntry,
  proposalReviewFor,
  REVIEW_CSV_COLUMNS,
  toReviewCSV,
  toReviewJSON,
  toReviewText,
  updateProposalReview,
  validateImportedDocument,
} from "../src/utils/review.js";

const at = "2026-08-09T01:00:00.000Z";
const reviewedAt = "2026-08-09T02:00:00.000Z";
const ids = {
  difficulty: "resp_00000000000000000000000000000001",
  proposal: "resp_00000000000000000000000000000002",
  improvement: "resp_00000000000000000000000000000003",
};

const difficulty = createParticipationResponse({
  activityType: "concept-difficulty",
  topicSlug: "vectores",
  payload: {
    unclearPoint: "No veo por qué A · B representa una proyección.",
    helpfulSupport: "graph",
  },
}, { responseId: ids.difficulty, createdAt: at });

const proposal = createParticipationResponse({
  activityType: "student-question-proposal",
  topicSlug: "movimiento-1d",
  payload: {
    proposalType: "graph-question",
    statement: "¿Qué significa una pendiente negativa en x(t)?",
    intendedConcept: "Conectar pendiente y velocidad.",
    expectedAnswer: "Velocidad negativa.",
    answerExplanation: "La pendiente es Δx/Δt.",
    studentDifficultyEstimate: "intermediate",
  },
}, { responseId: ids.proposal, createdAt: at });

const improvement = createParticipationResponse({
  activityType: "improvement-feedback",
  topicSlug: "movimiento-2d",
  payload: {
    area: "accessibility",
    improvement: "<strong>Más contraste</strong> y una descripción de la gráfica.",
    helpfulness: "partly-helped",
  },
}, { responseId: ids.improvement, createdAt: at });

const entry = (name, document) => ({
  name,
  size: JSON.stringify(document).length,
  text: JSON.stringify(document),
});

const bonusDefinition = UNIT_1_BONUSES[0];
const exercise = UNIT_1_EXERCISES.find((item) => item.id === "u1-units-convert-speed");
const bonusAttempt = completeBonusAttempt({
  attempt: createBonusAttempt(
    { ...bonusDefinition, questionCount: 1 },
    [{ exercise, slotId: "tools-units" }],
    {
      attemptId: "attempt_00000000000000000000000000000001",
      startedAt: at,
    }
  ),
  exercises: [exercise],
  responses: { [exercise.id]: "20,0" },
  completedAt: reviewedAt,
});

test("acepta una respuesta JSON canónica de Participa", () => {
  const result = validateImportedDocument(difficulty);
  assert.equal(result.status, "valid");
  assert.equal(result.kind, "participation");
  assert.equal(result.id, ids.difficulty);
  assert.equal(Object.isFrozen(result.original), true);
});

test("rechaza JSON inválido sin lanzar stack al flujo de importación", () => {
  const result = parseReviewImportEntry({ name: "roto.json", size: 4, text: "{" });
  assert.equal(result.status, "invalid");
  assert.equal(result.reason, "JSON inválido.");
});

test("rechaza esquemas desconocidos y payloads inválidos", () => {
  assert.match(
    validateImportedDocument({ ...difficulty, schemaVersion: "9.0.0" }).reason,
    /no está soportada/
  );
  assert.match(
    validateImportedDocument({ ...difficulty, payload: {} }).reason,
    /dificultad conceptual/
  );
});

test("reconoce intentos de Bono como consulta anónima", () => {
  const result = validateImportedDocument(bonusAttempt);
  assert.equal(result.status, "valid");
  assert.equal(result.kind, "bonus");
  assert.match(result.reason, /solo para consulta/);
});

test("procesa múltiples archivos y aísla los inválidos", () => {
  const session = addReviewImportEntries(createReviewSession(), [
    entry("dificultad.json", difficulty),
    { name: "roto.json", size: 2, text: "[]" },
    entry("bono.json", bonusAttempt),
  ]);
  assert.equal(session.records.length, 2);
  assert.deepEqual(session.incidents.map((item) => item.status), [
    "valid", "invalid", "valid",
  ]);
});

test("detecta duplicados entre tandas y conserva sus archivos fuente", () => {
  const first = addReviewImportEntries(createReviewSession(), [
    entry("primero.json", difficulty),
  ]);
  const second = addReviewImportEntries(first, [
    entry("copia.json", difficulty),
  ]);
  assert.equal(second.records.length, 1);
  assert.deepEqual(second.records[0].sourceFiles, ["primero.json", "copia.json"]);
  assert.equal(second.incidents[1].status, "warning");
  assert.match(second.incidents[1].reason, /Duplicado detectado/);
});

test("limita archivos individuales absurdamente grandes", () => {
  const result = parseReviewImportEntry({
    name: "gigante.json",
    size: REVIEW_FILE_MAX_BYTES + 1,
    text: "{}",
  });
  assert.equal(result.status, "invalid");
  assert.match(result.reason, /5 MB/);
});

test("conserva Unicode y trata HTML importado como texto", () => {
  const session = addReviewImportEntries(createReviewSession(), [
    entry("mejora.json", improvement),
  ]);
  assert.equal(
    session.records[0].original.payload.improvement,
    "<strong>Más contraste</strong> y una descripción de la gráfica."
  );
});

test("calcula agregados descriptivos separados", () => {
  const session = addReviewImportEntries(createReviewSession(), [
    entry("dificultad.json", difficulty),
    entry("propuesta.json", proposal),
    entry("mejora.json", improvement),
    entry("bono.json", bonusAttempt),
  ]);
  const summary = aggregateReviewSession(session);
  assert.equal(summary.activity["concept-difficulty"], 1);
  assert.equal(summary.activity["student-question-proposal"], 1);
  assert.equal(summary.activity["improvement-feedback"], 1);
  assert.equal(summary.difficultyTopics.vectores, 1);
  assert.equal(summary.requestedSupport.graph, 1);
  assert.equal(summary.improvementAreas.accessibility, 1);
  assert.equal(summary.helpfulness["partly-helped"], 1);
  assert.equal(summary.bonuses, 1);
});

test("filtra respuestas por búsqueda, tema y actividad con paginación", () => {
  const session = addReviewImportEntries(createReviewSession(), [
    entry("dificultad.json", difficulty),
    entry("propuesta.json", proposal),
    entry("mejora.json", improvement),
  ]);
  assert.equal(filterParticipationRecords(session, { query: "PROYECCIÓN" }).total, 1);
  assert.equal(filterParticipationRecords(session, { topic: "movimiento-1d" }).total, 1);
  assert.equal(filterParticipationRecords(session, {
    activityType: "improvement-feedback",
  }).records[0].id, ids.improvement);
});

test("mantiene estado y nota docente separados del original", () => {
  const reviews = updateProposalReview({}, ids.proposal, {
    status: "bank-candidate",
    note: "Revisar distractores y redacción.",
  }, reviewedAt);
  assert.deepEqual(proposalReviewFor(reviews, ids.proposal), {
    status: "bank-candidate",
    note: "Revisar distractores y redacción.",
    reviewedAt,
  });
  assert.equal(proposal.payload.proposal.review.status, "unreviewed");
});

test("exporta JSON de revisión con original y overlay", () => {
  const session = addReviewImportEntries(createReviewSession(), [
    entry("propuesta.json", proposal),
  ]);
  const reviews = updateProposalReview({}, ids.proposal, {
    status: "interesting",
    note: "Conservar la idea física.",
  }, reviewedAt);
  const exported = createReviewExport(session, reviews, reviewedAt);
  const json = JSON.parse(toReviewJSON(exported));
  assert.equal(json.schemaVersion, "1.0.0");
  assert.equal(json.items[0].original.responseId, ids.proposal);
  assert.equal(json.items[0].review.status, "interesting");
  assert.equal(getProposalRecords(session).length, 1);
});

test("CSV crea una fila por respuesta y neutraliza fórmulas", () => {
  const dangerous = {
    ...improvement,
    responseId: "resp_00000000000000000000000000000004",
    payload: { ...improvement.payload, improvement: "=HYPERLINK(\"https://example.test\")" },
  };
  const session = addReviewImportEntries(createReviewSession(), [
    entry("dificultad.json", difficulty),
    entry("formula.json", dangerous),
  ]);
  const csv = toReviewCSV(createReviewExport(session, {}, reviewedAt));
  const lines = csv.replace(/^\uFEFF/, "").split("\r\n").filter(Boolean);
  assert.equal(lines.length, 3);
  assert.equal(lines[0].split(",").length, REVIEW_CSV_COLUMNS.length);
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example\.test""\)"/);
  assert.match(csv, /proyección/);
});

test("TXT resume conteos sin inferir dominio", () => {
  const session = addReviewImportEntries(createReviewSession(), [
    entry("dificultad.json", difficulty),
  ]);
  const text = toReviewText(createReviewExport(session, {}, reviewedAt));
  assert.match(text, /Centro de revisión/);
  assert.match(text, /no estiman dominio ni causalidad/);
});

test("maneja 300 archivos pequeños de forma determinista", () => {
  const entries = Array.from({ length: 300 }, (_, index) => {
    const response = {
      ...difficulty,
      responseId: `resp_${index.toString(16).padStart(32, "0")}`,
    };
    return entry(`respuesta-${index}.json`, response);
  });
  const session = addReviewImportEntries(createReviewSession(), entries);
  assert.equal(session.records.length, 300);
  assert.equal(aggregateReviewSession(session).difficultyTopics.vectores, 300);
  assert.equal(filterParticipationRecords(session, { page: 15 }).records.length, 20);
});

