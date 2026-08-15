import assert from "node:assert/strict";
import test from "node:test";

import {
  PARTICIPATION_CSV_COLUMNS,
  PARTICIPATION_COLLECTIONS,
  LEGACY_PARTICIPATION_SCHEMA_VERSION,
  PARTICIPATION_SCHEMA_VERSION,
  PARTICIPATION_SCHEMA_VERSION_1_1_0,
  PARTICIPATION_PRIVACY_LEVELS,
  PARTICIPATION_PURPOSES,
  SUPPORTED_PARTICIPATION_SCHEMA_VERSIONS,
  createParticipationResponse,
  escapeCsvField,
  isResponseId,
  participationContextLabel,
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
// La mayoría de los ejemplos usan Física Básica I, Unidad 1, para poder
// reutilizar temas reales sin repetir la resolución en cada prueba.
const unit1Context = { scope: { type: "course", courseId: "fisica-basica-1" }, unitNumber: 1 };

const conceptResponse = (payload = {}) => createParticipationResponse({
  ...unit1Context,
  topicSlug: "movimiento-1d",
  activityType: "concept-difficulty",
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
  assert.equal(response.schemaVersion, "1.2.0");
  assert.equal(response.schemaVersion, PARTICIPATION_SCHEMA_VERSION);
  assert.equal(response.purpose, "learning");
  assert.equal(response.collection, "local");
  assert.equal(response.privacy, "anonymous");
  assert.equal(response.submissionTarget, null);
  assert.equal(response.payload.helpfulSupport, "graph");
  assert.equal(response.createdAt, ENVIRONMENT.createdAt);
});

test("mantiene las propuestas estudiantiles fuera del banco académico", () => {
  const response = createParticipationResponse({
    ...unit1Context,
    topicSlug: "vectores",
    activityType: "student-question-proposal",
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
    ...unit1Context,
    topicSlug: "herramientas",
    activityType: "improvement-feedback",
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
    ...unit1Context,
    topicSlug: "movimiento-2d",
    activityType: "student-question-proposal",
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

test("otra ayuda exige y conserva una explicación libre", () => {
  const response = conceptResponse({
    helpfulSupport: "other",
    helpfulSupportOther: "Una comparación paso a paso con un caso real.",
  });

  assert.equal(validateParticipationResponse(response).valid, true);
  assert.equal(
    response.payload.helpfulSupportOther,
    "Una comparación paso a paso con un caso real."
  );
  assert.throws(
    () => conceptResponse({ helpfulSupport: "other", helpfulSupportOther: "  " }),
    /obligatorio/
  );
});

test("normaliza fuera el detalle cuando la ayuda seleccionada no es other", () => {
  const response = conceptResponse({
    helpfulSupport: "graph",
    helpfulSupportOther: "Texto que ya no corresponde",
  });

  assert.equal("helpfulSupportOther" in response.payload, false);
  const invalid = structuredClone(response);
  invalid.payload.helpfulSupportOther = "Texto inesperado";
  assert.equal(validateParticipationResponse(invalid).valid, false);
});

// Las formas 1.0.0 y 1.1.0 se escriben literalmente, tal como las produjo el
// sitio antes de este bloque: sin `scope`, con course/unit fijos de Física
// Básica I y Unidad 1. No se derivan clonando una respuesta 1.2.0, porque esa
// migración nunca ocurrió en los archivos que ya existen en disco.
const legacyBase = (schemaVersion, extraPayload = {}) => ({
  schemaVersion,
  responseId: "resp_00000000000000000000000000000010",
  activityType: "concept-difficulty",
  course: { code: "0302270", slug: "fisica-basica-1", title: "Física Básica I" },
  unit: { number: 1, slug: "unidad-1", title: "Vectores y cinemática" },
  topic: { slug: "movimiento-1d", title: "Movimiento en una dimensión" },
  createdAt: "2026-01-10T12:00:00.000Z",
  purpose: "learning",
  collection: "local",
  privacy: "anonymous",
  submissionTarget: null,
  payload: { unclearPoint: "No distingo velocidad de rapidez.", ...extraPayload },
});

test("acepta respuestas históricas válidas del esquema 1.0.0", () => {
  const legacy = legacyBase(LEGACY_PARTICIPATION_SCHEMA_VERSION);

  assert.equal(validateParticipationResponse(legacy).valid, true);
  // 1.0.0 no admite el detalle de "otra ayuda": su presencia invalida el archivo.
  const withOtherDetail = legacyBase(LEGACY_PARTICIPATION_SCHEMA_VERSION, {
    helpfulSupport: "other",
    helpfulSupportOther: "Detalle que 1.0.0 no puede llevar.",
  });
  assert.equal(validateParticipationResponse(withOtherDetail).valid, false);
});

test("acepta respuestas históricas válidas del esquema 1.1.0 con helpfulSupportOther", () => {
  const legacy = legacyBase(PARTICIPATION_SCHEMA_VERSION_1_1_0, {
    helpfulSupport: "other",
    helpfulSupportOther: "Una comparación con un ejemplo resuelto.",
  });

  assert.equal(validateParticipationResponse(legacy).valid, true);
  // helpfulSupportOther solo es válido cuando helpfulSupport vale "other".
  const mismatched = legacyBase(PARTICIPATION_SCHEMA_VERSION_1_1_0, {
    helpfulSupport: "graph",
    helpfulSupportOther: "Texto que no debería estar.",
  });
  assert.equal(validateParticipationResponse(mismatched).valid, false);
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
      ...unit1Context,
      topicSlug: "vectores",
      activityType: "research",
      payload: {},
    }, ENVIRONMENT),
    /tipo de actividad/
  );
  assert.throws(
    () => createParticipationResponse({
      ...unit1Context,
      topicSlug: "unidad-inventada",
      activityType: "concept-difficulty",
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
  // "course.name" es el nombre editorial del curso (Física Básica I), no un
  // dato personal: se excluye explícitamente antes de buscar señales de PII.
  const withoutCourseName = json.replace(`"name": ${JSON.stringify(response.course.name)}`, "");
  assert.equal(/name|email|document|userAgent|timezone|ipAddress/.test(withoutCourseName), false);
});

test("JSON, TXT y CSV conservan el detalle de otra ayuda", () => {
  const detail = "Una animación que compare Δx con distancia.";
  const response = conceptResponse({
    helpfulSupport: "other",
    helpfulSupportOther: detail,
  });
  const json = JSON.parse(toParticipationJSON(response));
  const text = toParticipationText(response);
  const rows = parseCsv(toParticipationCSV(response));

  assert.equal(json.payload.helpfulSupportOther, detail);
  assert.match(text, /Una animación que compare Δx con distancia\./);
  assert.equal(
    rows[1][PARTICIPATION_CSV_COLUMNS.indexOf("helpful_support_other")],
    detail
  );
});

test("TXT produce una representación legible de la misma respuesta", () => {
  const response = conceptResponse({ helpfulSupport: "graph" });
  const text = toParticipationText(response);

  assert.match(text, /Aula Física/);
  assert.match(text, /Contexto: Movimiento en una dimensión/);
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

// --- Esquema 1.2.0: ámbito, curso, unidad y tema opcionales -----------------

test("1.2.0 global: sin curso, sin unidad, sin tema", () => {
  const response = createParticipationResponse({
    scope: { type: "global" },
    activityType: "improvement-feedback",
    payload: { area: "design", improvement: "El contraste podría mejorar." },
  }, ENVIRONMENT);

  assert.equal(response.schemaVersion, "1.2.0");
  assert.deepEqual(response.scope, { type: "global" });
  assert.equal(response.course, null);
  assert.equal(response.unit, null);
  assert.equal(response.topic, null);
  assert.equal(validateParticipationResponse(response).valid, true);
});

test("1.2.0 de curso sin tema: el feedback de curso es válido sin unidad", () => {
  const response = createParticipationResponse({
    scope: { type: "course", courseId: "fisica-basica-1" },
    activityType: "improvement-feedback",
    payload: { area: "navigation", improvement: "El menú del curso podría ser más claro." },
  }, ENVIRONMENT);

  assert.equal(response.scope.courseId, "fisica-basica-1");
  assert.equal(response.course.id, "fisica-basica-1");
  assert.equal(response.unit, null);
  assert.equal(response.topic, null);
  assert.equal(validateParticipationResponse(response).valid, true);
});

test("1.2.0 de curso con unidad y sin tema: unidad completa", () => {
  const response = createParticipationResponse({
    scope: { type: "course", courseId: "fisica-basica-1" },
    unitNumber: 2,
    activityType: "improvement-feedback",
    payload: { area: "example", improvement: "Un ejemplo más de la segunda ley." },
  }, ENVIRONMENT);

  assert.equal(response.unit.number, 2);
  assert.equal(response.unit.slug, "unidad-2");
  assert.equal(response.topic, null);
  assert.equal(validateParticipationResponse(response).valid, true);
});

test("1.2.0 de curso con Unidad 1 y tema", () => {
  const response = createParticipationResponse({
    ...unit1Context,
    topicSlug: "vectores",
    activityType: "concept-difficulty",
    payload: { unclearPoint: "No distingo componente de proyección." },
  }, ENVIRONMENT);

  assert.equal(response.unit.number, 1);
  assert.equal(response.topic.slug, "vectores");
  assert.equal(validateParticipationResponse(response).valid, true);
});

test("1.2.0 de curso con Unidad 2 y tema", () => {
  const response = createParticipationResponse({
    scope: { type: "course", courseId: "fisica-basica-1" },
    unitNumber: 2,
    topicSlug: "tercera-ley",
    activityType: "concept-difficulty",
    payload: { unclearPoint: "No veo por qué el par actúa sobre cuerpos distintos." },
  }, ENVIRONMENT);

  assert.equal(response.unit.number, 2);
  assert.equal(response.topic.slug, "tercera-ley");
  assert.equal(validateParticipationResponse(response).valid, true);
});

test("1.2.0 de curso con Unidad 3 y tema", () => {
  const response = createParticipationResponse({
    scope: { type: "course", courseId: "fisica-basica-1" },
    unitNumber: 3,
    topicSlug: "friccion",
    activityType: "concept-difficulty",
    payload: { unclearPoint: "No sé cuándo usar fricción estática o cinética." },
  }, ENVIRONMENT);

  assert.equal(response.unit.number, 3);
  assert.equal(response.topic.slug, "friccion");
  assert.equal(validateParticipationResponse(response).valid, true);
});

test("rechaza un scope inválido", () => {
  assert.throws(
    () => createParticipationResponse({
      scope: { type: "site" },
      activityType: "improvement-feedback",
      payload: { area: "design", improvement: "x" },
    }, ENVIRONMENT),
    /ámbito/
  );
});

test("rechaza un courseId no registrado", () => {
  assert.throws(
    () => createParticipationResponse({
      scope: { type: "course", courseId: "curso-inventado" },
      activityType: "improvement-feedback",
      payload: { area: "design", improvement: "x" },
    }, ENVIRONMENT),
    /ámbito/
  );
});

test("ignora/rechaza combinaciones de unidad y tema fuera del invariante", () => {
  // scope global no admite unidad ni tema.
  assert.throws(
    () => createParticipationResponse({
      scope: { type: "global" },
      unitNumber: 1,
      activityType: "improvement-feedback",
      payload: { area: "design", improvement: "x" },
    }, ENVIRONMENT),
    /contexto académico/
  );
  // topic requiere unit.
  assert.throws(
    () => createParticipationResponse({
      scope: { type: "course", courseId: "fisica-basica-1" },
      topicSlug: "vectores",
      activityType: "improvement-feedback",
      payload: { area: "design", improvement: "x" },
    }, ENVIRONMENT),
    /contexto académico/
  );
  // unidad inexistente en el curso.
  assert.throws(
    () => createParticipationResponse({
      scope: { type: "course", courseId: "fisica-basica-1" },
      unitNumber: 99,
      activityType: "improvement-feedback",
      payload: { area: "design", improvement: "x" },
    }, ENVIRONMENT),
    /unidad/
  );
});

test("la validación 1.2.0 rechaza course/unit/topic ajenos al invariante", () => {
  const global = createParticipationResponse({
    scope: { type: "global" },
    activityType: "improvement-feedback",
    payload: { area: "design", improvement: "x" },
  }, ENVIRONMENT);
  const withCourse = structuredClone(global);
  withCourse.course = { id: "fisica-basica-1", name: "Física Básica I" };
  assert.equal(validateParticipationResponse(withCourse).valid, false);

  const withTopicNoUnit = createParticipationResponse({
    scope: { type: "course", courseId: "fisica-basica-1" },
    unitNumber: 1,
    topicSlug: "vectores",
    activityType: "concept-difficulty",
    payload: { unclearPoint: "x" },
  }, ENVIRONMENT);
  const broken = structuredClone(withTopicNoUnit);
  broken.unit = null;
  assert.equal(validateParticipationResponse(broken).valid, false);
});

test("participationContextLabel resuelve del más específico al más general", () => {
  const topicResponse = createParticipationResponse({
    ...unit1Context,
    topicSlug: "vectores",
    activityType: "concept-difficulty",
    payload: { unclearPoint: "x" },
  }, ENVIRONMENT);
  const unitResponse = createParticipationResponse({
    scope: { type: "course", courseId: "fisica-basica-1" },
    unitNumber: 2,
    activityType: "improvement-feedback",
    payload: { area: "design", improvement: "x" },
  }, ENVIRONMENT);
  const courseResponse = createParticipationResponse({
    scope: { type: "course", courseId: "fisica-basica-1" },
    activityType: "improvement-feedback",
    payload: { area: "design", improvement: "x" },
  }, ENVIRONMENT);
  const globalResponse = createParticipationResponse({
    scope: { type: "global" },
    activityType: "improvement-feedback",
    payload: { area: "design", improvement: "x" },
  }, ENVIRONMENT);

  assert.equal(participationContextLabel(topicResponse, "es"), "Vectores");
  assert.equal(participationContextLabel(unitResponse, "es"), "Leyes de Newton");
  assert.equal(participationContextLabel(courseResponse, "es"), "Física Básica I");
  assert.equal(participationContextLabel(globalResponse, "es"), "Aula Física en general");
  assert.equal(participationContextLabel(globalResponse, "en"), "Aula Física overall");
});

test("el CSV 1.2.0 añade scope_type, course_id y course_name al final sin reordenar", () => {
  const response = createParticipationResponse({
    ...unit1Context,
    topicSlug: "vectores",
    activityType: "concept-difficulty",
    payload: { unclearPoint: "x" },
  }, ENVIRONMENT);
  const rows = parseCsv(toParticipationCSV(response));

  assert.deepEqual(
    PARTICIPATION_CSV_COLUMNS.slice(-3),
    ["scope_type", "course_id", "course_name"]
  );
  assert.equal(rows[1][PARTICIPATION_CSV_COLUMNS.indexOf("scope_type")], "course");
  assert.equal(rows[1][PARTICIPATION_CSV_COLUMNS.indexOf("course_id")], "fisica-basica-1");
  assert.equal(rows[1][PARTICIPATION_CSV_COLUMNS.indexOf("course_name")], "Física Básica I");
  // Las columnas históricas conservan su posición y contenido habitual.
  assert.equal(rows[1][PARTICIPATION_CSV_COLUMNS.indexOf("unit_number")], "1");
  assert.equal(rows[1][PARTICIPATION_CSV_COLUMNS.indexOf("topic_slug")], "vectores");
});

test("el esquema soportado incluye 1.0.0, 1.1.0 y 1.2.0 en orden", () => {
  assert.deepEqual(SUPPORTED_PARTICIPATION_SCHEMA_VERSIONS, ["1.0.0", "1.1.0", "1.2.0"]);
});
