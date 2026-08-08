import assert from "node:assert/strict";
import test from "node:test";

import {
  PARTICIPATION_CSV_COLUMNS,
  PARTICIPATION_COLLECTIONS,
  PARTICIPATION_PRIVACY_LEVELS,
  PARTICIPATION_PURPOSES,
  createParticipationResponse,
  escapeCsvField,
  isResponseId,
  participationFilename,
  responseIdFromBytes,
  toParticipationCSV,
  toParticipationJSON,
  toParticipationText,
  validateParticipationResponse,
} from "../src/utils/participation.js";

const ENVIRONMENT = {
  responseId: "resp_00112233445566778899aabbccddeeff",
  createdAt: "2026-08-08T20:15:30.000Z",
};

const conceptResponse = (payload = {}) => createParticipationResponse({
  activityType: "concept-difficulty",
  topicSlug: "movimiento-1d",
  payload: {
    unclearPoint: "No conecto la pendiente de x(t)\ncon el signo de v.",
    ...payload,
  },
}, ENVIRONMENT);

// Parser mínimo de prueba: comprueba comillas duplicadas, comas y saltos de
// línea sin depender de una librería CSV adicional.
const parseCsv = (source) => {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const text = source.replace(/^\uFEFF/, "");

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (quoted && character === '"' && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (!quoted && character === ",") {
      row.push(field);
      field = "";
    } else if (!quoted && character === "\r" && next === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      index += 1;
    } else {
      field += character;
    }
  }

  return rows;
};

test("genera IDs de 128 bits sin datos del dispositivo", () => {
  const bytes = Uint8Array.from({ length: 16 }, (_, index) => index);
  const responseId = responseIdFromBytes(bytes);

  assert.equal(responseId, "resp_000102030405060708090a0b0c0d0e0f");
  assert.equal(isResponseId(responseId), true);
  assert.equal(isResponseId("resp_1234"), false);
  assert.throws(() => responseIdFromBytes(new Uint8Array(15)), /16 bytes/);
});

test("crea una reflexión local, anónima y de aprendizaje", () => {
  const response = conceptResponse({ helpfulSupport: "graph" });

  assert.equal(validateParticipationResponse(response).valid, true);
  assert.equal(response.schemaVersion, "1.0.0");
  assert.equal(response.purpose, "learning");
  assert.equal(response.collection, "local");
  assert.equal(response.privacy, "anonymous");
  assert.equal(response.submissionTarget, null);
  assert.equal(response.payload.helpfulSupport, "graph");
  assert.equal(response.createdAt, ENVIRONMENT.createdAt);
});

test("mantiene las propuestas estudiantiles fuera del banco académico", () => {
  const response = createParticipationResponse({
    activityType: "student-question-proposal",
    topicSlug: "vectores",
    payload: {
      proposalType: "graph-question",
      statement: "Una curva incluye los puntos \"A, B\".\n¿Qué representa su pendiente?",
      intendedConcept: "Interpretación de una gráfica y Unicode: Δx, ángulo θ.",
      expectedAnswer: "La razón de cambio.",
      answerExplanation: "Debe justificarse, no solo calcularse.",
      studentDifficultyEstimate: "advanced",
    },
  }, ENVIRONMENT);

  assert.equal(response.purpose, "contribution");
  assert.equal(response.payload.proposal.source, "student");
  assert.equal(response.payload.proposal.review.status, "unreviewed");
  assert.equal(response.payload.proposal.review.academicExerciseId, null);
  assert.equal(response.payload.proposal.review.editorialDifficulty, null);
  assert.deepEqual(response.payload.proposal.studentDifficultyEstimate, {
    scale: "student-self-estimate-v1",
    value: "advanced",
  });
});

test("crea feedback sin valoración artificial obligatoria", () => {
  const response = createParticipationResponse({
    activityType: "improvement-feedback",
    topicSlug: "herramientas",
    payload: {
      area: "accessibility",
      improvement: "Añadir una descripción más clara a la gráfica.",
    },
  }, ENVIRONMENT);

  assert.equal(response.purpose, "feedback");
  assert.equal("helpfulness" in response.payload, false);
  assert.equal(validateParticipationResponse(response).valid, true);
});

test("omite campos opcionales vacíos", () => {
  const concept = conceptResponse({ helpfulSupport: "" });
  const proposal = createParticipationResponse({
    activityType: "student-question-proposal",
    topicSlug: "movimiento-2d",
    payload: {
      proposalType: "problem",
      statement: "Construye un modelo para la trayectoria.",
      intendedConcept: "Separación de componentes.",
      expectedAnswer: "  ",
      answerExplanation: "",
      studentDifficultyEstimate: "",
    },
  }, ENVIRONMENT);

  assert.equal("helpfulSupport" in concept.payload, false);
  assert.equal("expectedAnswer" in proposal.payload.proposal, false);
  assert.equal("answerExplanation" in proposal.payload.proposal, false);
  assert.equal("studentDifficultyEstimate" in proposal.payload.proposal, false);
});

test("rechaza campos requeridos y enums fuera del contrato", () => {
  assert.throws(
    () => conceptResponse({ unclearPoint: "   " }),
    /obligatorio/
  );
  assert.throws(
    () => conceptResponse({ helpfulSupport: "stars" }),
    /contrato permitido/
  );
  assert.throws(
    () => createParticipationResponse({
      activityType: "research",
      topicSlug: "vectores",
      payload: {},
    }, ENVIRONMENT),
    /tipo de actividad/
  );
  assert.throws(
    () => createParticipationResponse({
      activityType: "concept-difficulty",
      topicSlug: "unidad-inventada",
      payload: { unclearPoint: "Texto" },
    }, ENVIRONMENT),
    /tema/
  );
});

test("los enums públicos excluyen research y measurement", () => {
  assert.deepEqual(PARTICIPATION_COLLECTIONS, ["local"]);
  assert.deepEqual(PARTICIPATION_PRIVACY_LEVELS, ["anonymous"]);
  assert.equal(PARTICIPATION_PURPOSES.includes("research"), false);
  assert.equal(PARTICIPATION_PURPOSES.includes("measurement"), false);
});

test("la validación exige que propósito y actividad permanezcan alineados", () => {
  const modified = structuredClone(conceptResponse());
  modified.purpose = "feedback";

  const result = validateParticipationResponse(modified);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /purpose/);
});

test("JSON conserva el contrato completo, Unicode y saltos de línea", () => {
  const response = conceptResponse({ helpfulSupport: "simulation" });
  const json = toParticipationJSON(response);
  const parsed = JSON.parse(json);

  assert.deepEqual(parsed, response);
  assert.match(parsed.payload.unclearPoint, /\n/);
  assert.match(json, /"submissionTarget": null/);
  assert.equal(/name|email|document|userAgent|timezone|ipAddress/.test(json), false);
});

test("TXT produce una representación legible de la misma respuesta", () => {
  const response = conceptResponse({ helpfulSupport: "graph" });
  const text = toParticipationText(response);

  assert.match(text, /Papilla's Physics/);
  assert.match(text, /Tema: Movimiento en una dimensión/);
  assert.match(text, /Podría ayudar: Una gráfica/);
  assert.match(text, new RegExp(response.responseId));
  assert.match(text, /no envía ni guarda/i);
});

test("CSV escapa comillas, comas, Unicode, saltos de línea y textos largos", () => {
  const longText = `Inicio, con \"comillas\" y Δx.\n${"texto largo ".repeat(80)}`;
  const response = conceptResponse({ unclearPoint: longText });
  const csv = toParticipationCSV(response);
  const rows = parseCsv(csv);

  assert.equal(csv.startsWith("\uFEFF"), true);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], PARTICIPATION_CSV_COLUMNS);
  assert.equal(rows[1].length, PARTICIPATION_CSV_COLUMNS.length);
  assert.equal(
    rows[1][PARTICIPATION_CSV_COLUMNS.indexOf("unclear_point")],
    longText.trim()
  );
  assert.match(csv, /""comillas""/);
  assert.equal(escapeCsvField("a,b\n\"c\""), '"a,b\n""c"""');
});

test("los nombres de archivo derivan solo de la respuesta, no del estudiante", () => {
  const filename = participationFilename(conceptResponse(), "json");
  assert.equal(
    filename,
    "participacion-concept-difficulty-resp_00112233445566778899aabbccddeeff.json"
  );
});
