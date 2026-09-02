import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";

import { MINI_QUIZZES_BY_UNIT } from "../src/data/mini-quizzes/index.js";
import {
  MINI_QUIZ_V2_BANKS_BY_UNIT,
  getMiniQuizV2BankByUnit,
  localizeMiniQuizV2Record,
  selectMiniQuizV2Questions,
  validateMiniQuizV2Record,
} from "../src/data/mini-quizzes/v2.js";
import { UNIT_1_CONTENT } from "../src/data/physics/unit-1/content.js";
import { UNIT_1_COMMON_ERRORS } from "../src/data/physics/unit-1/common-errors.js";
import { UNIT_1_EXERCISES } from "../src/data/physics/unit-1/exercises.js";
import { UNIT_1_EXERCISE_FAMILIES } from "../src/data/physics/unit-1/families.js";
import {
  EXERCISE_COGNITIVE_LEVELS,
  EXERCISE_REPRESENTATIONS,
  EXERCISE_TYPES,
} from "../src/data/physics/exercise-schema.js";
import { gradeExerciseResponse, matchesBlueprintCriteria } from "../src/utils/bonus.js";

const bank = getMiniQuizV2BankByUnit(1);
const bySlot = Object.fromEntries(bank.items.map((item) => [item.assessmentSlot, item]));

const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
};

const deterministicCrypto = () => ({
  value: 0,
  getRandomValues(array) {
    for (let index = 0; index < array.length; index += 1) array[index] = this.value++;
    return array;
  },
});

const expectedAnchors = [
  ["hv-1", "mq-v2-u1-hv-dimensional-coefficient-01", "b"],
  ["hv-2", "mq-v2-u1-hv-dimensional-limit-01", "c"],
  ["hv-3", "mq-v2-u1-hv-vector-magnitude-component-01", "b"],
  ["hv-4", "mq-v2-u1-hv-vector-quadrant-01", "b"],
  ["hv-5", "mq-v2-u1-hv-dot-perpendicular-01", "b"],
  ["hv-6", "mq-v2-u1-hv-cross-order-01", "b"],
  ["c1-1", "mq-v2-u1-c1-position-displacement-01", "b"],
  ["c1-2", "mq-v2-u1-c1-distance-displacement-01", "a"],
  ["c1-3", "mq-v2-u1-c1-speed-velocity-average-01", "b"],
  ["c1-4", "mq-v2-u1-c1-negative-position-01", "a"],
  ["c1-5", "mq-v2-u1-c1-position-graph-slope-01", "b"],
  ["c1-6", "mq-v2-u1-c1-signs-speed-change-01", "a"],
  ["c1-7", "mq-v2-u1-c1-graph-integration-01", "b"],
  ["mp-1", "mq-v2-u1-mp-constant-model-01", "a"],
  ["mp-2", "mq-v2-u1-mp-average-velocity-model-01", "b"],
  ["mp-3", "mq-v2-u1-mp-turning-point-01", "b"],
  ["mp-4", "mq-v2-u1-mp-freefall-sign-01", "b"],
  ["mp-5", "mq-v2-u1-mp-freefall-apex-01", "b"],
  ["mp-6", "mq-v2-u1-mp-projectile-shared-time-01", "b"],
  ["mp-7", "mq-v2-u1-mp-projectile-apex-01", "c"],
  ["mc-1", "mq-v2-u1-mc-vector-kinematics-01", "b"],
  ["mc-2", "mq-v2-u1-mc-tangent-normal-01", "a"],
  ["mc-3", "mq-v2-u1-mc-circular-speed-velocity-01", "c"],
  ["mc-4", "mq-v2-u1-mc-circular-variable-speed-01", "c"],
  ["mc-5", "mq-v2-u1-mc-relative-index-01", "b"],
  ["mc-6", "mq-v2-u1-mc-relative-2d-01", "c"],
  ["r-1", "mq-v2-u1-r-dimensional-selection-01", "b"],
  ["r-2", "mq-v2-u1-r-vector-quadrant-01", "b"],
  ["r-3", "mq-v2-u1-r-xva-01", "a"],
  ["r-4", "mq-v2-u1-r-turning-distance-01", "a"],
  ["r-5", "mq-v2-u1-r-projectile-apex-numeric-01", "a"],
  ["r-6", "mq-v2-u1-r-circular-geometry-01", "a"],
  ["r-7", "mq-v2-u1-r-relative-frames-01", "b"],
  ["r-8", "mq-v2-u1-r-vector-derivatives-01", "a"],
  ["r-9", "mq-v2-u1-r-variable-acceleration-01", "a"],
];

const expectedDiagnostics = [
  "hv-2:a:units-dimensional-proof",
  "hv-3:a:vector-magnitude-component",
  "hv-3:c:vector-magnitude-component",
  "hv-3:d:vector-negative-magnitude",
  "hv-4:a:vector-sine-cosine",
  "hv-4:c:vector-wrong-quadrant",
  "hv-4:d:vector-wrong-quadrant",
  "hv-6:a:vector-cross-commutative",
  "c1-1:a:kinematics-position-displacement",
  "c1-1:c:kinematics-position-displacement",
  "c1-1:d:kinematics-position-displacement",
  "c1-2:b:kinematics-distance-displacement",
  "c1-2:c:kinematics-distance-displacement",
  "c1-2:d:kinematics-distance-displacement",
  "c1-3:c:kinematics-distance-average-velocity",
  "c1-3:d:kinematics-speed-velocity",
  "c1-4:b:kinematics-negative-position-motion",
  "c1-5:a:kinematics-slope-value",
  "c1-5:d:kinematics-slope-value",
  "c1-6:b:kinematics-negative-velocity-slowing",
  "c1-6:c:kinematics-negative-acceleration-slowing",
  "c1-7:d:constant-zero-velocity-zero-acceleration",
  "mp-1:c:constant-use-variable-acceleration",
  "mp-3:a:constant-zero-velocity-zero-acceleration",
  "mp-4:c:freefall-g-negative-universal",
  "mp-5:a:freefall-top-zero-acceleration",
  "mp-6:a:projectile-separate-times",
  "mp-6:c:projectile-horizontal-acceleration",
  "mp-7:b:projectile-top-zero-total-velocity",
  "mp-7:d:projectile-top-zero-acceleration",
  "mc-3:a:circular-speed-velocity-constant",
  "mc-3:d:circular-tangent-acceleration",
  "mc-4:b:circular-tangent-acceleration",
  "mc-5:a:relative-index-order",
  "r-2:a:vector-negative-magnitude",
  "r-3:d:kinematics-slope-value",
  "r-4:c:kinematics-distance-displacement",
  "r-5:c:projectile-top-zero-total-velocity",
  "r-5:d:projectile-top-zero-acceleration",
  "r-6:c:circular-tangent-acceleration",
  "r-9:b:constant-use-variable-acceleration",
];

test("U1 registra exactamente 35 anclas, cero familias y cinco blueprints", () => {
  assert.ok(bank);
  assert.equal(bank.items.length, 35);
  assert.equal(bank.families.length, 0);
  assert.equal(bank.blueprints.length, 5);
  assert.deepEqual(bank.blueprints.map(({ id, questionCount }) => [id, questionCount]), [
    ["mq-v2-u1-tools-vectors", 6],
    ["mq-v2-u1-kinematics-1d", 7],
    ["mq-v2-u1-models-projectiles", 7],
    ["mq-v2-u1-motion-2d-circular-relative", 6],
    ["mq-v2-u1-review", 9],
  ]);
  assert.deepEqual(
    MINI_QUIZ_V2_BANKS_BY_UNIT.slice(1).map(({ items, families, blueprints }) => [items.length, families.length, blueprints.length]),
    Array.from({ length: 6 }, () => [0, 0, 0]),
  );
});

test("las identidades, slots y respuestas ancla coinciden con el dossier", () => {
  assert.deepEqual(
    bank.items.map(({ assessmentSlot, id, interaction }) => [assessmentSlot, id, interaction.correctOptionId]),
    expectedAnchors,
  );
  assert.equal(new Set(bank.items.map(({ id }) => id)).size, 35);
  assert.equal(new Set(bank.items.map(({ assessmentSlot }) => assessmentSlot)).size, 35);
  assert.equal(bank.items.every((item) => validateMiniQuizV2Record(item).valid), true);
  assert.equal(bank.items.every((item) => item.topic !== "coordenadas-polares" && item.subtopic !== "base-polar"), true);

  bank.items.forEach((item) => {
    const topic = UNIT_1_CONTENT[item.topic];
    assert.ok(topic, `${item.id} usa un tema U1 inexistente.`);
    assert.ok(topic.sections.some(({ id }) => id === item.subtopic), `${item.id} usa un subtema U1 inexistente.`);
    assert.equal(EXERCISE_TYPES.includes(item.type), true);
    assert.equal(EXERCISE_REPRESENTATIONS.includes(item.representation), true);
    assert.equal(EXERCISE_COGNITIVE_LEVELS.includes(item.cognitiveLevel), true);
    assert.equal(Number.isInteger(item.difficulty) && item.difficulty >= 1 && item.difficulty <= 4, true);
    assert.deepEqual(item.interaction.options.map(({ id }) => id), ["a", "b", "c", "d"]);
    assert.equal(item.answer.value, item.interaction.correctOptionId);
  });
});

test("los blueprints seleccionan por slot, conservan orden y tienen un ancla por requisito", () => {
  for (const blueprint of bank.blueprints) {
    assert.equal(blueprint.blueprint.length, blueprint.questionCount);
    blueprint.blueprint.forEach((requirement) => {
      assert.deepEqual(requirement.criteria, { assessmentSlot: [requirement.id] });
      const candidates = bank.items.filter((item) => matchesBlueprintCriteria(item, requirement.criteria));
      assert.equal(candidates.length, 1, `${blueprint.id}:${requirement.id}`);
    });

    for (const locale of ["es", "en"]) {
      const selected = selectMiniQuizV2Questions(blueprint, bank, deterministicCrypto(), { locale });
      assert.equal(selected.length, blueprint.questionCount);
      assert.deepEqual(selected.map(({ slotId }) => slotId), blueprint.blueprint.map(({ id }) => id));
      assert.deepEqual(selected.map(({ exercise }) => exercise.assessmentSlot), blueprint.blueprint.map(({ id }) => id));
    }
  }
});

test("los 35 ítems localizan ES/EN sin mutar identidad, orden ni grading", () => {
  const sourceSnapshot = JSON.stringify(bank.items);
  bank.items.forEach((source) => {
    const localizedRecords = [localizeMiniQuizV2Record(source, "es"), localizeMiniQuizV2Record(source, "en")];
    localizedRecords.forEach((record) => {
      assert.equal(typeof record.title, "string");
      assert.equal(typeof record.prompt, "string");
      assert.equal(typeof record.feedback.correct, "string");
      assert.equal(typeof record.feedback.incorrect, "string");
      assert.equal(record.solution.every(({ title, text }) => typeof title === "string" && typeof text === "string"), true);
      assert.equal(record.interaction.options.every(({ content }) => typeof content === "string"), true);
      assert.deepEqual(
        record.interaction.options.map(({ id }) => id),
        source.interaction.options.map(({ id }) => id),
      );
      assert.equal(record.id, source.id);
      assert.equal(record.version, source.version);
      assert.equal(record.assessmentSlot, source.assessmentSlot);
      assert.equal(record.topic, source.topic);
      assert.equal(record.subtopic, source.subtopic);
      assert.equal(record.type, source.type);
      assert.equal(record.representation, source.representation);
      assert.equal(record.cognitiveLevel, source.cognitiveLevel);
      assert.equal(record.difficulty, source.difficulty);
      assert.equal(record.interaction.correctOptionId, source.interaction.correctOptionId);
      assert.equal(record.answer, source.answer);
      assert.equal(gradeExerciseResponse(record, record.interaction.correctOptionId).pointsEarned, 1);
      assert.equal(gradeExerciseResponse(record, record.interaction.options.find(({ id }) => id !== record.interaction.correctOptionId).id).pointsEarned, 0);
    });
    assert.deepEqual(
      localizedRecords.map((record) => record.interaction.options.map((entry) => [entry.id, entry.diagnostic?.commonErrorId ?? null])),
      Array.from({ length: 2 }, () => source.interaction.options.map((entry) => [entry.id, entry.diagnostic?.commonErrorId ?? null])),
    );
  });
  assert.equal(JSON.stringify(bank.items), sourceSnapshot);
});

test("la tabla diagnóstica es exacta y todo feedback específico tiene par ES/EN", () => {
  const commonErrorIds = new Set(UNIT_1_COMMON_ERRORS.map(({ id }) => id));
  const actualDiagnostics = [];

  bank.items.forEach((item) => {
    item.interaction.options.forEach((entry) => {
      if (entry.id === item.interaction.correctOptionId) assert.equal(entry.diagnostic, undefined);
      if (!entry.diagnostic) return;
      actualDiagnostics.push(`${item.assessmentSlot}:${entry.id}:${entry.diagnostic.commonErrorId}`);
      assert.equal(commonErrorIds.has(entry.diagnostic.commonErrorId), true);
      assert.equal(typeof entry.diagnostic.feedback.es, "string");
      assert.equal(typeof entry.diagnostic.feedback.en, "string");
    });
  });

  assert.deepEqual(actualDiagnostics, expectedDiagnostics);
  const taggedOptions = new Set(expectedDiagnostics.map((entry) => entry.split(":").slice(0, 2).join(":")));
  bank.items.forEach((item) => item.interaction.options.forEach((entry) => {
    if (entry.id !== item.interaction.correctOptionId && !taggedOptions.has(`${item.assessmentSlot}:${entry.id}`)) {
      assert.equal(entry.diagnostic, undefined, `${item.assessmentSlot}:${entry.id} no debe tener diagnóstico.`);
    }
  }));
});

test("el banco V2 permanece estructuralmente separado de Practice y de V1 público", () => {
  const practiceIds = new Set([
    ...UNIT_1_EXERCISES.map(({ id }) => id),
    ...UNIT_1_EXERCISE_FAMILIES.map(({ id }) => id),
  ]);
  assert.equal(bank.items.some(({ id }) => practiceIds.has(id)), false);
  assert.equal(bank.items.every((item) => item.modality === "miniQuiz" && item.source.kind === "miniQuizV2"), true);
  assert.equal(bank.items.every((item) => item.practiceEligible === false && item.modalities?.includes?.("practice") !== true), true);
  assert.equal(bank.families.length, 0);
  assert.equal(MINI_QUIZZES_BY_UNIT[0].generation, "legacy-v1");

  const moduleSource = fs.readFileSync(new URL("../src/data/mini-quizzes/unit-1.js", import.meta.url), "utf8");
  assert.doesNotMatch(moduleSource, /physics\/unit-1\/(?:exercises|additional-exercises|families|bonuses)\.js/);
});

test("los casos académicos de mayor riesgo conservan respuesta, signos, unidades y lógica", () => {
  assert.equal(bySlot["hv-1"].interaction.options[1].content.es, "m·s");
  assert.equal(bySlot["hv-4"].interaction.options[1].content.es, "Bₓ=B sin 25°, Bᵧ=−B cos 25°");
  assert.match(bySlot["mp-2"].interaction.options[1].content.en, /Acceleration is constant throughout/);
  assert.equal(bySlot["mp-4"].interaction.options[1].content.es, "v₀ᵧ<0, aᵧ=+g");
  assert.equal(bySlot["mp-7"].interaction.options[2].content.es, "vₓ=v₀ₓ≠0, vᵧ=0, a=(0,−g).");
  assert.equal(bySlot["mc-4"].interaction.options[2].content.en, "Up and left.");
  assert.match(bySlot["r-3"].solution[0].text.es, /v=−2 m\/s y a=\+2 m\/s².*\|v\| disminuye/);
  assert.equal(bySlot["r-5"].interaction.options[0].content.es, "t=0.8 s, vₓ=6 m/s, vᵧ=0, aᵧ=−10 m/s².");
  assert.equal(bySlot["r-7"].interaction.options[1].content.en, "(−3i+4j) m/s");
  assert.match(bySlot["r-8"].solution[0].text.en, /v·a=4 m²\/s³>0, so speed increases/);
  assert.match(bySlot["r-9"].interaction.options[0].content.en, /^10 m\/s/);

  for (const slot of ["c1-7", "mp-3", "mc-1", "r-3", "r-4", "r-8", "r-9"]) {
    assert.match(bySlot[slot].prompt.es, /m\/s²|m\/s³/);
    assert.match(bySlot[slot].prompt.en, /m\/s²|m\/s³/);
  }
});

test("la huella del banco ancla U1 V2 conserva los 35 ítems y cinco blueprints auditados", () => {
  const fingerprint = crypto.createHash("sha256")
    .update(JSON.stringify(stable({ items: bank.items, blueprints: bank.blueprints })))
    .digest("hex");
  assert.equal(fingerprint, "86bdda5ff01c413861493132edb63e96cd5ab280c230fdfc0297a372b096d455");
});
