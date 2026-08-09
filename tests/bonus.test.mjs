import assert from "node:assert/strict";
import test from "node:test";

import { UNIT_1_BONUSES } from "../src/data/physics/unit-1/bonuses.js";
import { UNIT_1_EXERCISES } from "../src/data/physics/unit-1/exercises.js";
import {
  attemptIdFromBytes,
  BONUS_CSV_COLUMNS,
  bonusFilename,
  canSatisfyBonusBlueprint,
  completeBonusAttempt,
  createBonusAttempt,
  eligiblePoolForBonus,
  gradeExerciseResponse,
  isAttemptId,
  parseBonusNumber,
  selectBonusQuestions,
  toBonusCSV,
  toBonusJSON,
  toBonusText,
  validateCompletedBonusAttempt,
} from "../src/utils/bonus.js";

const exerciseMap = new Map(UNIT_1_EXERCISES.map((exercise) => [exercise.id, exercise]));
const bonus = UNIT_1_BONUSES[0];
const fixedAttemptId = "attempt_00112233445566778899aabbccddeeff";
const fixedStartedAt = "2026-08-08T12:00:00.000Z";
const fixedCompletedAt = "2026-08-08T12:10:00.000Z";
const deterministicCrypto = (seed = 1) => ({
  value: seed >>> 0,
  getRandomValues(array) {
    for (let index = 0; index < array.length; index += 1) {
      this.value = (Math.imul(this.value, 1664525) + 1013904223) >>> 0;
      array[index] = this.value;
    }
    return array;
  },
});
const selectionsFor = (...ids) => ids.map((id, index) => ({
  exercise: exerciseMap.get(id),
  slotId: `slot-${index + 1}`,
  optionOrder: exerciseMap.get(id).interaction.kind === "singleChoice"
    ? exerciseMap.get(id).interaction.options.map((option) => option.id)
    : undefined,
}));
const createAttemptFor = (...ids) => createBonusAttempt(
  { ...bonus, questionCount: ids.length },
  selectionsFor(...ids),
  { attemptId: fixedAttemptId, startedAt: fixedStartedAt }
);

test("genera IDs de intento de 128 bits sin identidad ni dispositivo", () => {
  const id = attemptIdFromBytes(Uint8Array.from({ length: 16 }, (_, index) => index));
  assert.equal(id, "attempt_000102030405060708090a0b0c0d0e0f");
  assert.equal(isAttemptId(id), true);
  assert.equal(isAttemptId("attempt_1234"), false);
});

test("el parser acepta coma, punto, negativos, científica y fracciones simples", () => {
  assert.equal(parseBonusNumber("6.36"), 6.36);
  assert.equal(parseBonusNumber("6,36"), 6.36);
  assert.equal(parseBonusNumber("-6,0"), -6);
  assert.equal(parseBonusNumber("1e3"), 1000);
  assert.equal(parseBonusNumber("1E3"), 1000);
  assert.equal(parseBonusNumber("2/3"), 2 / 3);
  assert.equal(parseBonusNumber("1.000,5"), null);
  assert.equal(parseBonusNumber("1,000.5"), null);
  assert.equal(parseBonusNumber("1/0"), null);
  assert.equal(parseBonusNumber("2+2"), null);
});

test("singleChoice distingue respuesta correcta e incorrecta", () => {
  const exercise = exerciseMap.get("u1-vectors-equal-magnitude");
  const correct = gradeExerciseResponse(exercise, "b");
  const incorrect = gradeExerciseResponse(exercise, "a");
  assert.equal(correct.correct, true);
  assert.equal(correct.pointsEarned, 1);
  assert.equal(incorrect.correct, false);
  assert.equal(incorrect.pointsEarned, 0);
});

test("number aplica tolerancia absoluta y no compara strings", () => {
  const exercise = exerciseMap.get("u1-units-convert-speed");
  assert.equal(gradeExerciseResponse(exercise, "20,04").correct, true);
  assert.equal(gradeExerciseResponse(exercise, "20.06").correct, false);
  assert.equal(gradeExerciseResponse(exercise, "").answered, false);
});

test("multiNumber reparte crédito entre campos", () => {
  const exercise = exerciseMap.get("u1-vectors-platform-components");
  const result = gradeExerciseResponse(exercise, ["6,36", "0"]);
  assert.equal(result.correct, false);
  assert.equal(result.pointsEarned, 0.5);
  assert.deepEqual(result.fieldResults.map((field) => field.correct), [true, false]);
});

test("tolera configuración por campo antes de la tolerancia general", () => {
  const source = exerciseMap.get("u1-constant-direct-motion");
  const exercise = {
    ...source,
    answer: {
      ...source.answer,
      values: source.answer.values.map((value, index) => ({
        ...value,
        tolerance: index === 0 ? 0.2 : 0,
      })),
    },
  };
  const result = gradeExerciseResponse(exercise, ["1,15", "7,5"]);
  assert.equal(result.pointsEarned, 1);
});

test("los ejercicios numéricos requeridos aceptan sus respuestas previstas", () => {
  const cases = [
    ["u1-units-convert-speed", ["20,0"]],
    ["u1-vectors-platform-components", ["6,36", "3,97"]],
    ["u1-vectors-perpendicular-lambda", ["1"]],
    ["u1-vectors-equal-sum-difference", ["2/3"]],
    ["u1-kinematics-distance-displacement", ["16", "+4"]],
    ["u1-kinematics-graph-slope", ["-2"]],
    ["u1-constant-direct-motion", ["1,0", "7,5"]],
    ["u1-constant-turning-point", ["4", "-6"]],
    ["u1-projectile-balcony-time", ["1,5", "9,0"]],
    ["u1-circular-radial-acceleration", ["6,0"]],
  ];
  cases.forEach(([id, answers]) => {
    const exercise = exerciseMap.get(id);
    const input = exercise.interaction.kind === "multiNumber" ? answers : answers[0];
    assert.equal(gradeExerciseResponse(exercise, input).correct, true, id);
  });
});

test("cada blueprint es satisfacible sin IDs repetidos", () => {
  UNIT_1_BONUSES.forEach((definition, index) => {
    assert.equal(canSatisfyBonusBlueprint(definition, UNIT_1_EXERCISES), true);
    const selected = selectBonusQuestions(
      definition,
      UNIT_1_EXERCISES,
      deterministicCrypto(index + 3)
    );
    assert.equal(selected.length, definition.questionCount);
    assert.equal(new Set(selected.map((item) => item.exercise.id)).size, selected.length);
    assert.equal(selected.every((item) => definition.topics.includes(item.exercise.topic)), true);
  });
});

test("la selección varía y conserva el orden concreto de opciones", () => {
  const first = selectBonusQuestions(bonus, UNIT_1_EXERCISES, deterministicCrypto(7));
  const second = selectBonusQuestions(bonus, UNIT_1_EXERCISES, deterministicCrypto(8));
  assert.notDeepEqual(first.map((item) => item.exercise.id), second.map((item) => item.exercise.id));
  first.filter((item) => item.optionOrder).forEach((item) => {
    assert.deepEqual(
      [...item.optionOrder].sort(),
      item.exercise.interaction.options.map((option) => option.id).sort()
    );
  });
});

test("los Bonos solo usan learning, public, bonusEligible y nunca polares", () => {
  UNIT_1_BONUSES.forEach((definition) => {
    assert.equal(definition.modality, "bonus");
    assert.equal(definition.purpose, "learning");
    assert.equal(definition.exposure, "public");
    assert.equal(definition.topics.includes("coordenadas-polares"), false);
    assert.equal(
      eligiblePoolForBonus(definition, UNIT_1_EXERCISES).every((exercise) =>
        exercise.bonusEligible &&
        exercise.purpose === "learning" &&
        exercise.exposure === "public"
      ),
      true
    );
  });
});

test("los blueprints incluyen preguntas visuales cuando corresponde", () => {
  const review = UNIT_1_BONUSES.find((item) => item.slug === "repaso-unidad-1");
  const selected = selectBonusQuestions(review, UNIT_1_EXERCISES, deterministicCrypto(13));
  const visualCount = selected.filter((item) =>
    ["graphical", "visual"].includes(item.exercise.representation)
  ).length;
  assert.ok(visualCount >= 2);
  assert.equal(
    selected.filter((item) => item.exercise.visualizationId).every((item) =>
      typeof item.exercise.visualizationId === "string"
    ),
    true
  );
});

test("el intento guarda snapshots, versiones, privacidad y orden", () => {
  const attempt = createAttemptFor(
    "u1-vectors-equal-magnitude",
    "u1-units-convert-speed"
  );
  assert.equal(attempt.schemaVersion, "1.0.0");
  assert.equal(attempt.privacy.collection, "local");
  assert.equal(attempt.privacy.identity, "anonymous");
  assert.deepEqual(attempt.questions.map((question) => question.order), [1, 2]);
  assert.equal(attempt.questions[0].exerciseVersion, exerciseMap.get("u1-vectors-equal-magnitude").version);
  assert.equal(attempt.questions[0].snapshot.title, "Igual magnitud");
  assert.equal(attempt.questions[0].optionOrder.length, 4);
});

test("calcula porcentaje y resultado por tema sin extrapolar", () => {
  const attempt = createAttemptFor(
    "u1-vectors-equal-magnitude",
    "u1-units-convert-speed",
    "u1-vectors-platform-components"
  );
  const completed = completeBonusAttempt({
    attempt,
    exercises: UNIT_1_EXERCISES,
    responses: {
      "u1-vectors-equal-magnitude": "b",
      "u1-units-convert-speed": "0",
      "u1-vectors-platform-components": ["6,36", "0"],
    },
    completedAt: fixedCompletedAt,
  });
  assert.equal(completed.summary.pointsEarned, 1.5);
  assert.equal(completed.summary.pointsPossible, 3);
  assert.equal(completed.summary.percentage, 50);
  assert.deepEqual(
    completed.summary.byTopic.map((topic) => [topic.topic, topic.pointsEarned, topic.pointsPossible]),
    [["vectores", 1.5, 2], ["herramientas", 0, 1]]
  );
  assert.equal(completed.summary.reviewRecommendations.length, 2);
  assert.equal(validateCompletedBonusAttempt(completed).valid, true);
});

test("una respuesta ausente recibe cero puntos", () => {
  const exercise = exerciseMap.get("u1-circular-radial-acceleration");
  const result = gradeExerciseResponse(exercise, null);
  assert.equal(result.answered, false);
  assert.equal(result.pointsEarned, 0);
});

test("TXT y JSON conservan Unicode y el contrato completo", () => {
  const attempt = createAttemptFor("u1-vectors-platform-components");
  const completed = completeBonusAttempt({
    attempt,
    exercises: UNIT_1_EXERCISES,
    responses: { "u1-vectors-platform-components": ["6,36", "3,97"] },
    completedAt: fixedCompletedAt,
  });
  const text = toBonusText(completed);
  const json = JSON.parse(toBonusJSON(completed));
  assert.match(text, /Δx/);
  assert.match(text, /Resultado por tema en esta tanda/);
  assert.equal(json.questions[0].snapshot.prompt.includes("32,0°"), true);
  assert.equal(json.attemptId, fixedAttemptId);
});

test("CSV genera una fila por pregunta y protege fórmulas", () => {
  const attempt = createAttemptFor(
    "u1-kinematics-graph-slope",
    "u1-units-convert-speed"
  );
  const completed = completeBonusAttempt({
    attempt,
    exercises: UNIT_1_EXERCISES,
    responses: {
      "u1-kinematics-graph-slope": "-2",
      "u1-units-convert-speed": "20,0",
    },
    completedAt: fixedCompletedAt,
  });
  completed.questions[1].response.raw = "=HYPERLINK(\"https://example.test\")";
  const csv = toBonusCSV(completed);
  const lines = csv.replace(/^\uFEFF/, "").split("\r\n").filter(Boolean);
  assert.equal(lines.length, 3);
  assert.equal(lines[0].split(",").length, BONUS_CSV_COLUMNS.length);
  assert.match(csv, /"'-2"/);
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example\.test""\)"/);
  assert.match(csv, /Componentes|Conversión|Pendiente|Recta/);
});

test("los nombres de archivo son predecibles y no contienen identidad", () => {
  const attempt = createAttemptFor("u1-units-convert-speed");
  assert.equal(
    bonusFilename(bonus, attempt, "json"),
    "bono-unidad-1-herramientas-vectores-001122.json"
  );
});
