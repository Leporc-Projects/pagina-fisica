import assert from "node:assert/strict";
import test from "node:test";

import { UNIT_1_BONUSES } from "../src/data/physics/unit-1/bonuses.js";
import { UNIT_1_EXERCISES } from "../src/data/physics/unit-1/exercises.js";
import {
  completeBonusAttempt,
  createBonusAttempt,
  prepareDeliveryAttempt,
} from "../src/utils/bonus.js";
import { parseCsv } from "../src/utils/results-csv.js";
import {
  calculateResultMean,
  consolidateResults,
  descriptiveStats,
  normalizeBonusSource,
  normalizeEmail,
  normalizeGenericSource,
  normalizeRoster,
  parseScore,
  resolveDuplicateSubmissions,
  sourceFromBonusDocuments,
  sourceFromTable,
  suggestColumns,
  tableHeaders,
} from "../src/utils/results-organizer.js";

test("CSV maneja BOM, comillas, comas, CRLF, multiline, Unicode y vacíos", () => {
  const parsed = parseCsv('\uFEFFNombre,Correo,Nota,Comentario\r\n"Ana, María",ANA@EXAMPLE.EDU,"8/10","Línea 1\nLínea 2"\r\nLuis,luis@example.edu,,"Dijo ""sí"""\r\n');
  assert.deepEqual(parsed, [
    ["Nombre", "Correo", "Nota", "Comentario"],
    ["Ana, María", "ANA@EXAMPLE.EDU", "8/10", "Línea 1\nLínea 2"],
    ["Luis", "luis@example.edu", "", 'Dijo "sí"'],
  ]);
  assert.deepEqual(parseCsv("a,b\n1,2"), [["a", "b"], ["1", "2"]]);
});

test("CSV rechaza estructuras malformadas", () => {
  assert.throws(() => parseCsv('a,"sin cerrar'), /sin cerrar/);
  assert.throws(() => parseCsv('a,"cerrado"x'), /después de comillas/);
  assert.throws(() => parseCsv('a,mal"ubicada'), /comillas dentro/);
});

test("normaliza correo con trim, lowercase y Unicode sin alterar aliases", () => {
  assert.deepEqual(normalizeEmail("  Estudiante+Grupo@UDEA.EDU.CO "), {
    rawEmail: "  Estudiante+Grupo@UDEA.EDU.CO ",
    normalizedEmail: "estudiante+grupo@udea.edu.co",
    valid: true,
    empty: false,
  });
  assert.equal(normalizeEmail("sin-arroba").valid, false);
  assert.equal(normalizeEmail("").empty, true);
});

test("sugiere mappings por semántica y deja ambiguos sin decidir", () => {
  const headers = ["Timestamp", "Email Address", "Total points", "Name"];
  assert.deepEqual(suggestColumns(headers, ["email", "score", "timestamp", "name"]), {
    email: 1,
    score: 2,
    timestamp: 0,
    name: 3,
  });
  assert.equal(suggestColumns(["Score value", "Score result"], ["score"]).score, null);
  assert.deepEqual(
    suggestColumns(["Respondent ID", "Start time", "Completion time", "Email", "Score"], ["email", "timestamp"]),
    { email: 3, timestamp: null }
  );
});

test("score parser acepta números y fracciones sin inferir escalas", () => {
  for (const value of [8, "8", "8.0", "8,0", "8.5", "8,5"]) {
    const parsed = parseScore(value, { maximumMode: "unknown" });
    assert.equal(parsed.valid, true, String(value));
    assert.equal(parsed.earnedPoints, 8 + (String(value).includes("5") ? 0.5 : 0));
    assert.equal(parsed.possiblePoints, null);
    assert.equal(parsed.percentage, null);
  }
  assert.deepEqual(
    ["8/10", "8 / 10", "15/20"].map((value) => parseScore(value, { maximumMode: "cell" }).percentage),
    [80, 80, 75]
  );
});

test("score parser rechaza vacíos, texto, Infinity, NaN y rangos inválidos", () => {
  assert.equal(parseScore("", { maximumMode: "unknown" }).valid, false);
  assert.equal(parseScore("ocho de diez", { maximumMode: "unknown" }).valid, false);
  assert.equal(parseScore(Infinity, { maximumMode: "unknown" }).valid, false);
  assert.equal(parseScore(NaN, { maximumMode: "unknown" }).valid, false);
  assert.equal(parseScore("11/10", { maximumMode: "cell" }).reason, "out_of_range");
  assert.equal(parseScore("8/0", { maximumMode: "cell" }).reason, "invalid_maximum");
  assert.equal(parseScore("8/10", { maximumMode: "fixed", fixedMaximum: 20 }).reason, "scale_conflict");
});

test("máximo fijo o por columna calcula porcentaje explícitamente", () => {
  assert.equal(parseScore(8, { maximumMode: "fixed", fixedMaximum: 10 }).percentage, 80);
  assert.equal(parseScore("15", { maximumMode: "column" }, "20").percentage, 75);
});

const rosterData = [
  ["Nombre", "Correo", "ID", "Grupo"],
  ["Ana", " ANA@EXAMPLE.EDU ", "A-1", "G1"],
  ["Luis", "luis@example.edu", "L-2", "G1"],
  ["Correo roto", "no-es-correo", "X-3", "G2"],
];

const roster = () => normalizeRoster({
  data: rosterData,
  headerRow: 1,
  mapping: { name: 0, email: 1, id: 2, group: 3 },
  fileName: "estudiantes.csv",
});

test("roster conserva email raw, detecta inválidos y duplicados", () => {
  const normalized = roster();
  assert.equal(normalized.students[0].normalizedEmail, "ana@example.edu");
  assert.equal(normalized.students[0].rawEmail, " ANA@EXAMPLE.EDU ");
  assert.equal(normalized.incidents.some((item) => item.type === "invalid_email"), true);

  const duplicate = normalizeRoster({
    data: [["email"], ["A@example.edu"], [" a@EXAMPLE.edu "]],
    headerRow: 1,
    mapping: { email: 0 },
  });
  assert.equal(duplicate.incidents.filter((item) => item.type === "duplicate_roster_identity").length, 2);
});

const genericSource = (data, overrides = {}) => normalizeGenericSource({
  ...sourceFromTable({
    id: overrides.id ?? "source-a",
    label: overrides.label ?? "Formulario A",
    fileName: "formulario.csv",
    format: "csv",
    sheet: "CSV",
    data,
    headerRow: 1,
  }),
  config: {
    headerRow: 1,
    mapping: { email: 0, score: 1, timestamp: 2 },
    scoreConfiguration: { maximumMode: "fixed", fixedMaximum: 10 },
    duplicatePolicy: overrides.duplicatePolicy ?? "unresolved",
  },
});

test("normalización genérica conserva filas inválidas e incidencias", () => {
  const source = genericSource([
    ["Email", "Score", "Timestamp"],
    ["ana@example.edu", "8", "2026-08-08T10:00:00.000Z"],
    ["desconocido@example.edu", "texto", "fecha rota"],
    ["email roto", "5", ""],
  ]);
  assert.equal(source.submissions.length, 3);
  assert.equal(source.incidents.some((item) => item.type === "invalid_score"), true);
  assert.equal(source.incidents.some((item) => item.type === "invalid_timestamp"), true);
  assert.equal(source.incidents.some((item) => item.type === "invalid_email"), true);
});

const submission = (score, timestamp = null) => ({
  score,
  timestamp,
  submissionId: `${score.rawScore}:${timestamp}`,
});
const scaled = (raw, percentage, possiblePoints = 10) => ({
  valid: true,
  rawScore: raw,
  earnedPoints: (percentage / 100) * possiblePoints,
  possiblePoints,
  percentage,
});

test("políticas de duplicados cubren unresolved, first, last, highest y average", () => {
  const attempts = [
    submission(scaled("6", 60), "2026-08-08T10:00:00.000Z"),
    submission(scaled("9", 90), "2026-08-08T11:00:00.000Z"),
  ];
  assert.equal(resolveDuplicateSubmissions(attempts, "unresolved").resolved, false);
  assert.equal(resolveDuplicateSubmissions(attempts, "first").score.percentage, 60);
  assert.equal(resolveDuplicateSubmissions(attempts, "last").score.percentage, 90);
  assert.equal(resolveDuplicateSubmissions(attempts, "highest").score.percentage, 90);
  assert.equal(resolveDuplicateSubmissions(attempts, "average").score.percentage, 75);
});

test("last sin timestamps y highest sin escala comparable se bloquean", () => {
  const noTime = [submission(scaled("6", 60)), submission(scaled("8", 80))];
  assert.equal(resolveDuplicateSubmissions(noTime, "last").reason, "timestamp_required");
  const unknownScale = [
    submission({ valid: true, rawScore: "6", earnedPoints: 6, possiblePoints: null, percentage: null }),
    submission({ valid: true, rawScore: "8", earnedPoints: 8, possiblePoints: null, percentage: null }),
  ];
  assert.equal(resolveDuplicateSubmissions(unknownScale, "highest").reason, "comparable_scale_required");
});

test("reconciliación distingue matched, missing, unknown, invalid y duplicate", () => {
  const source = genericSource([
    ["Email", "Score", "Timestamp"],
    ["ana@example.edu", "8", "2026-08-08T10:00:00.000Z"],
    ["ana@example.edu", "9", "2026-08-08T11:00:00.000Z"],
    ["otro@example.edu", "7", "2026-08-08T10:00:00.000Z"],
    ["roto", "6", "2026-08-08T10:00:00.000Z"],
  ]);
  const model = consolidateResults({ roster: roster(), sources: [source] });
  assert.equal(model.rows[0].results[source.id].status, "unresolved");
  assert.equal(model.rows[1].results[source.id].status, "missing");
  assert.equal(model.incidents.some((item) => item.type === "unknown_student"), true);
  assert.equal(model.incidents.some((item) => item.type === "invalid_email"), true);
  assert.equal(model.incidents.some((item) => item.type === "duplicate_submission"), true);
  assert.equal(model.incidents.some((item) => item.type === "unresolved_duplicate"), true);
});

test("faltantes no son cero salvo política explícita", () => {
  const entries = [
    { status: "resolved", score: scaled("8", 80) },
    { status: "missing", score: null },
  ];
  assert.equal(calculateResultMean(entries, "unresolved").value, null);
  assert.equal(calculateResultMean(entries, "exclude").value, 80);
  assert.equal(calculateResultMean(entries, "zero").value, 40);
});

test("agregados porcentuales calculan media, mediana, min y max con N", () => {
  assert.deepEqual(descriptiveStats([100, 80, 60, null]), {
    n: 3,
    mean: 80,
    median: 80,
    min: 60,
    max: 100,
  });
});

const makeIdentifiedBonus = () => {
  const bonus = UNIT_1_BONUSES[0];
  const exercise = UNIT_1_EXERCISES.find((item) => item.id === "u1-units-convert-speed");
  const attempt = createBonusAttempt(
    { ...bonus, questionCount: 1 },
    [{ exercise, sourceItemId: exercise.id, slotId: "test" }],
    {
      attemptId: "attempt_00112233445566778899aabbccddeeff",
      startedAt: "2026-08-08T10:00:00.000Z",
    }
  );
  const completed = completeBonusAttempt({
    attempt,
    exercises: UNIT_1_EXERCISES,
    responses: { [exercise.id]: "20" },
    completedAt: "2026-08-08T10:05:00.000Z",
  });
  return prepareDeliveryAttempt(
    completed,
    "ana@example.edu",
    {},
    "2026-08-08T10:06:00.000Z"
  );
};

test("Bono identificado usa summary validado y anónimo queda sin conciliar", () => {
  const identified = makeIdentifiedBonus();
  const anonymous = {
    ...identified,
    attemptId: "attempt_ffeeddccbbaa99887766554433221100",
    privacy: { collection: "local", identity: { mode: "anonymous" } },
  };
  const source = normalizeBonusSource(sourceFromBonusDocuments({
    id: "bonus-a",
    label: "Bono sintético",
    fileName: "bonos.json",
    documents: [identified, anonymous],
  }));
  assert.equal(source.submissions[0].score.percentage, identified.summary.percentage);
  assert.equal(source.incidents.some((item) => item.type === "anonymous_attempt"), true);
  const model = consolidateResults({ roster: roster(), sources: [source] });
  assert.equal(model.rows[0].results[source.id].status, "resolved");
});

test("detecta discrepancia entre preguntas y summary de Bono", () => {
  const identified = makeIdentifiedBonus();
  identified.summary = { ...identified.summary, pointsEarned: 0.5 };
  const source = normalizeBonusSource(sourceFromBonusDocuments({
    id: "bonus-a",
    label: "Bono sintético",
    fileName: "bono.json",
    documents: [identified],
  }));
  assert.equal(source.incidents.some((item) => item.type === "bonus_summary_mismatch"), true);
});

test("header row puede configurarse fuera de la primera fila", () => {
  const data = [["Reporte generado"], ["Nombre", "Correo"], ["Ana", "ana@example.edu"]];
  assert.deepEqual(tableHeaders(data, 2), ["Nombre", "Correo"]);
});

test("QA sintético 500 estudiantes × 20 fuentes conserva 10 000 resultados", () => {
  const rosterRows = [["Nombre", "Email", "Grupo"]];
  for (let index = 0; index < 500; index += 1) {
    rosterRows.push([`Estudiante ${index + 1}`, `e${index + 1}@example.edu`, `G${index % 5}`]);
  }
  const largeRoster = normalizeRoster({
    data: rosterRows,
    headerRow: 1,
    mapping: { name: 0, email: 1, group: 2 },
  });
  const sources = Array.from({ length: 20 }, (_, sourceIndex) => genericSource([
    ["Email", "Score", "Timestamp"],
    ...Array.from({ length: 500 }, (_, studentIndex) => [
      `e${studentIndex + 1}@example.edu`,
      String((studentIndex + sourceIndex) % 11),
      `2026-08-08T${String(sourceIndex % 24).padStart(2, "0")}:00:00.000Z`,
    ]),
  ], { id: `source-${sourceIndex}`, label: `Fuente ${sourceIndex + 1}` }));
  const start = performance.now();
  const model = consolidateResults({ roster: largeRoster, sources, missingPolicy: "unresolved" });
  const durationMs = performance.now() - start;
  assert.equal(model.rows.length, 500);
  assert.equal(model.summary.validResults, 10_000);
  assert.equal(model.summary.missing, 0);
  assert.ok(durationMs < 5_000, `La consolidación tardó ${durationMs.toFixed(1)} ms`);
});
