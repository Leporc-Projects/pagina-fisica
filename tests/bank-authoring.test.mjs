import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { UNIT_1_BONUSES } from "../src/data/physics/unit-1/bonuses.js";
import { UNIT_1_BANK_ITEMS } from "../src/data/physics/unit-1/bank.js";
import { UNIT_1_EXERCISES } from "../src/data/physics/unit-1/exercises.js";
import {
  BONUS_ATTEMPT_SCHEMA_VERSION,
  completeBonusAttempt,
  createBonusAttempt,
  prepareDeliveryAttempt,
  selectBonusQuestions,
  toBonusCSV,
  toBonusJSON,
  toBonusText,
  validateCompletedBonusAttempt,
  validateInstitutionalEmail,
} from "../src/utils/bonus.js";
import {
  auditAllBonusBlueprints,
  simulateBonusDiversity,
} from "../src/utils/bonus-audit.js";
import {
  createQuestionPack,
  createTeacherQuestionId,
  mergeQuestionPack,
  normalizeTeacherQuestion,
  validateQuestionPack,
  validateTeacherQuestion,
} from "../src/utils/question-pack.js";
import { validateImportedDocument } from "../src/utils/review.js";

const deterministicCrypto = (seed = 1) => ({
  state: seed >>> 0,
  getRandomValues(array) {
    for (let index = 0; index < array.length; index += 1) {
      this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
      array[index] = this.state;
    }
    return array;
  },
});

const baseTeacherQuestion = (overrides = {}) => normalizeTeacherQuestion({
  id: createTeacherQuestionId("vectores", deterministicCrypto(12), 1786200000000),
  topic: "vectores",
  subtopic: "componentes-y-base",
  title: "Componentes con Unicode Δ",
  prompt: "Determina Aₓ. <img src=x onerror=alert(1)>",
  type: "numerical",
  representation: "vectorial",
  cognitiveLevel: "apply",
  difficulty: 2,
  modalities: ["practice", "selfAssessment", "bonus"],
  objectives: ["Descomponer un vector."],
  hints: ["Revisa el signo."],
  solution: [{ title: "Componentes", text: "Aₓ = A cos θ." }],
  commonErrors: ["vector-sine-cosine"],
  interaction: { kind: "number", field: { id: "value", label: "Aₓ", unit: "m" } },
  answer: { kind: "number", value: -3.5, display: "−3,5 m" },
  tolerance: 0.01,
  expectedUnit: "m",
  ...overrides,
});

test("los blueprints ampliados no tienen slots imposibles ni débiles", () => {
  const audits = auditAllBonusBlueprints(UNIT_1_BONUSES, UNIT_1_BANK_ITEMS);
  assert.equal(audits.flatMap((audit) => audit.errors).length, 0);
  assert.equal(audits.flatMap((audit) => audit.warnings).length, 0);
});

test("cien intentos por Bono producen tandas válidas y combinaciones diferentes", () => {
  UNIT_1_BONUSES.forEach((bonus, index) => {
    const simulation = simulateBonusDiversity(
      bonus,
      UNIT_1_BANK_ITEMS,
      (attempt) => deterministicCrypto((index + 1) * 10_000 + attempt),
      100
    );
    assert.equal(simulation.attempts, 100);
    assert.ok(simulation.uniqueCombinations >= 20, `${bonus.slug}: ${simulation.uniqueCombinations}`);
  });
});

test("el snapshot de Bono conserva la instancia parametrizada exacta", () => {
  const bonus = UNIT_1_BONUSES[0];
  const selections = selectBonusQuestions(bonus, UNIT_1_BANK_ITEMS, deterministicCrypto(991));
  const attempt = createBonusAttempt(bonus, selections, {
    attemptId: "attempt_11223344556677889900aabbccddeeff",
    startedAt: "2026-08-08T10:00:00.000Z",
  });
  selections.filter((selection) => selection.exercise.itemKind === "parameterizedInstance")
    .forEach((selection) => {
      const snapshot = attempt.questions.find((question) => question.exerciseId === selection.exercise.id);
      assert.deepEqual(snapshot.parameters, selection.exercise.parameters);
      assert.deepEqual(snapshot.snapshot.answer, selection.exercise.answer);
      assert.deepEqual(snapshot.snapshot.interaction, selection.exercise.interaction);
      assert.deepEqual(snapshot.snapshot.solution, selection.exercise.solution);
      assert.equal(snapshot.familyId, selection.exercise.familyId);
    });
});

test("valida y conserva un paquete docente como borrador", () => {
  const question = baseTeacherQuestion();
  assert.equal(validateTeacherQuestion(question).valid, true);
  const pack = createQuestionPack([question], {
    cryptoApi: deterministicCrypto(4),
    createdAt: "2026-08-08T11:00:00.000Z",
  });
  assert.equal(validateQuestionPack(pack).valid, true);
  assert.equal(pack.questions[0].authorSource, "teacher");
  assert.equal(pack.questions[0].status, "draft");
  assert.match(JSON.stringify(pack), /Unicode Δ/);
  assert.match(pack.questions[0].prompt, /<img/);
  const imported = mergeQuestionPack(pack, [], {
    repositoryIds: UNIT_1_EXERCISES.map((item) => item.id),
  });
  assert.equal(imported.imported.length, 1);
  assert.equal(imported.questions[0].status, "draft");
});

test("rechaza IDs duplicados, topics inexistentes e interacciones mal formadas", () => {
  const question = baseTeacherQuestion();
  assert.equal(validateTeacherQuestion(question, { existingIds: [question.id] }).valid, false);
  assert.equal(validateTeacherQuestion(baseTeacherQuestion({ topic: "tema-inexistente" })).valid, false);
  const brokenChoice = baseTeacherQuestion({
    interaction: { kind: "singleChoice", options: [{ id: "a", content: "Una" }], correctOptionId: "b" },
    answer: { kind: "text", value: "Dos" },
  });
  assert.equal(validateTeacherQuestion(brokenChoice).valid, false);
  const mismatchedAnswer = baseTeacherQuestion({
    interaction: {
      kind: "singleChoice",
      options: [{ id: "a", content: "Una" }, { id: "b", content: "Dos" }],
      correctOptionId: "b",
    },
    answer: { kind: "text", value: "Una" },
  });
  assert.equal(validateTeacherQuestion(mismatchedAnswer).valid, false);
  const duplicateFields = baseTeacherQuestion({
    interaction: { kind: "multiNumber", fields: [
      { id: "x", label: "x", unit: "m" }, { id: "x", label: "y", unit: "m" },
    ] },
    answer: { kind: "values", values: [
      { symbol: "x", value: 1, unit: "m", tolerance: 0 },
      { symbol: "y", value: 2, unit: "m", tolerance: 0 },
    ] },
  });
  assert.equal(validateTeacherQuestion(duplicateFields).valid, false);
  const pack = createQuestionPack([question, question], { cryptoApi: deterministicCrypto(5) });
  assert.equal(validateQuestionPack(pack).valid, false);
});

test("acepta number y multiNumber; la matemática pendiente desactiva Bono", () => {
  assert.equal(validateTeacherQuestion(baseTeacherQuestion()).valid, true);
  const multi = baseTeacherQuestion({
    id: createTeacherQuestionId("vectores", deterministicCrypto(15), 1786200000001),
    interaction: { kind: "multiNumber", fields: [
      { id: "x", label: "x", unit: "m" }, { id: "y", label: "y", unit: "m" },
    ] },
    answer: { kind: "values", values: [
      { symbol: "x", value: 2, unit: "m", tolerance: 0.01 },
      { symbol: "y", value: -1, unit: "m", tolerance: 0.01 },
    ] },
  });
  assert.equal(validateTeacherQuestion(multi).valid, true);
  const editorial = baseTeacherQuestion({ requiresEditorialMath: true });
  assert.equal(editorial.status, "draft");
  assert.equal(editorial.bonusEligible, false);
  assert.equal(validateTeacherQuestion(editorial).valid, true);
});

test("el importador está limitado a JSON y mantiene el archivo docente separado", () => {
  const source = fs.readFileSync(new URL("../scripts/import-questions.mjs", import.meta.url), "utf8");
  assert.match(source, /\.json/);
  assert.doesNotMatch(source, /\beval\s*\(/);
  assert.doesNotMatch(source, /import\s*\(\s*source/);
  assert.deepEqual(JSON.parse(fs.readFileSync(new URL("../src/data/physics/unit-1/teacher-questions.json", import.meta.url), "utf8")), []);
  assert.equal(UNIT_1_EXERCISES.every((item) => item.itemKind === "fixed"), true);
});

const completedAnonymousAttempt = () => {
  const bonus = UNIT_1_BONUSES[0];
  const selections = selectBonusQuestions(bonus, UNIT_1_BANK_ITEMS, deterministicCrypto(77));
  const attempt = createBonusAttempt(bonus, selections, {
    attemptId: "attempt_ffeeddccbbaa00998877665544332211",
    startedAt: "2026-08-08T12:00:00.000Z",
  });
  return completeBonusAttempt({
    attempt,
    exercises: selections.map((selection) => selection.exercise),
    responses: {},
    completedAt: "2026-08-08T12:10:00.000Z",
  });
};

test("el intento anónimo sigue válido y preparar entrega crea una copia identificada", () => {
  const anonymous = completedAnonymousAttempt();
  assert.equal(anonymous.schemaVersion, BONUS_ATTEMPT_SCHEMA_VERSION);
  assert.deepEqual(anonymous.privacy.identity, { mode: "anonymous" });
  assert.equal(validateCompletedBonusAttempt(anonymous).valid, true);
  const identified = prepareDeliveryAttempt(
    anonymous,
    " Estudiante@Universidad.EDU ",
    { acceptedDomains: [] },
    "2026-08-08T12:12:00.000Z"
  );
  assert.deepEqual(identified.privacy.identity, {
    mode: "institutionalEmail",
    email: "estudiante@universidad.edu",
  });
  assert.deepEqual(anonymous.privacy.identity, { mode: "anonymous" });
  assert.equal(validateCompletedBonusAttempt(identified).valid, true);
  assert.equal(validateImportedDocument(identified).status, "valid");
  assert.match(toBonusText(identified), /estudiante@universidad\.edu/);
  assert.match(toBonusCSV(identified, { includeBom: false }), /estudiante@universidad\.edu/);
  assert.equal(JSON.parse(toBonusJSON(identified)).privacy.identity.mode, "institutionalEmail");
});

test("valida sintaxis y dominios configurables sin asumir una institución", () => {
  assert.equal(validateInstitutionalEmail("a@b.co").valid, true);
  assert.equal(validateInstitutionalEmail("sin-arroba").valid, false);
  assert.equal(validateInstitutionalEmail("a@otra.edu", { acceptedDomains: ["campus.edu"] }).valid, false);
  assert.equal(validateInstitutionalEmail("A@CAMPUS.EDU", { acceptedDomains: ["campus.edu"] }).valid, true);
});

test("los clientes del editor y Bono no persisten preguntas ni correos", () => {
  const sources = [
    "../src/scripts/question-bank-editor.js",
    "../src/scripts/bonus.js",
  ].map((path) => fs.readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
  assert.doesNotMatch(sources, /localStorage|sessionStorage|document\.cookie/);
  assert.match(fs.readFileSync(new URL("../src/components/bonus/BonusAttempt.astro", import.meta.url), "utf8"), /data-export-mode="identified"[^>]*>Imprimir \/ PDF/);
});
