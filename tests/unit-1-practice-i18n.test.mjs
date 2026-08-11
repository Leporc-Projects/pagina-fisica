import assert from "node:assert/strict";
import test from "node:test";
import { UNIT_1_EXERCISES } from "../src/data/physics/unit-1/exercises.js";
import { UNIT_1_EXERCISE_FAMILIES } from "../src/data/physics/unit-1/families.js";
import {
  generateLocalizedUnit1FamilyInstance,
  getLocalizedUnit1BankItems,
  getLocalizedUnit1Exercises,
} from "../src/data/physics/unit-1/exercise-localize.js";
import { selectExerciseBatch } from "../src/utils/exercise-batches.js";
import { gradeExerciseResponse } from "../src/utils/bonus.js";

const seededRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
};

const interactionInvariant = (interaction) => {
  if (!interaction) return null;
  if (interaction.kind === "singleChoice") return {
    kind: interaction.kind,
    optionIds: interaction.options.map(({ id }) => id),
    correctOptionId: interaction.correctOptionId,
  };
  const fields = interaction.kind === "number" ? [interaction.field] : interaction.fields;
  return {
    kind: interaction.kind,
    fields: fields.map(({ id, unit }) => ({ id, unit })),
  };
};

const exerciseInvariant = (exercise) => ({
  id: exercise.id,
  version: exercise.version,
  itemKind: exercise.itemKind,
  topic: exercise.topic,
  subtopic: exercise.subtopic,
  type: exercise.type,
  representation: exercise.representation,
  cognitiveLevel: exercise.cognitiveLevel,
  difficulty: exercise.difficulty,
  modalities: exercise.modalities,
  estimatedMinutes: exercise.estimatedMinutes,
  answer: Object.fromEntries(Object.entries(exercise.answer).filter(([key]) => !["display", "presentation"].includes(key))),
  tolerance: exercise.tolerance,
  expectedUnit: exercise.expectedUnit,
  bonusEligible: exercise.bonusEligible,
  commonErrors: exercise.commonErrors,
  exposure: exercise.exposure,
  status: exercise.status,
  interaction: interactionInvariant(exercise.interaction),
});

const gradeInvariant = ({ answered, correct, pointsEarned, pointsPossible, fieldResults }) => ({
  answered, correct, pointsEarned, pointsPossible, fieldResults,
});

test("all 55 public fixed exercises have complete English presentation and invariant grading data", () => {
  const es = getLocalizedUnit1Exercises("es");
  const en = getLocalizedUnit1Exercises("en");
  assert.equal(es.length, 55);
  assert.equal(en.length, es.length);
  assert.deepEqual(en.map(exerciseInvariant), es.map(exerciseInvariant));
  assert.ok(en.every((exercise, index) =>
    exercise.title && exercise.prompt && exercise.title !== es[index].title &&
    exercise.objectives.length === es[index].objectives.length &&
    exercise.hints.length === es[index].hints.length &&
    exercise.solution.length === es[index].solution.length));
});

test("single-choice localization preserves option IDs and the correct option", () => {
  const es = getLocalizedUnit1Exercises("es").filter(({ interaction }) => interaction?.kind === "singleChoice");
  const enById = new Map(getLocalizedUnit1Exercises("en").map((exercise) => [exercise.id, exercise]));
  for (const source of es) {
    const localized = enById.get(source.id);
    assert.deepEqual(localized.interaction.options.map(({ id }) => id), source.interaction.options.map(({ id }) => id));
    assert.equal(localized.interaction.correctOptionId, source.interaction.correctOptionId);
    assert.ok(localized.interaction.options.every(({ content }) => content.length > 0));
  }
});

test("same family and seed preserve parameters, answers, units, and physical configuration", () => {
  for (const [familyIndex, family] of UNIT_1_EXERCISE_FAMILIES.entries()) {
    for (const seed of [7, 41, 2026, 9001]) {
      const es = generateLocalizedUnit1FamilyInstance(family, "es", { random: seededRandom(seed + familyIndex) });
      const en = generateLocalizedUnit1FamilyInstance(family, "en", { random: seededRandom(seed + familyIndex) });
      assert.equal(en.familyId, es.familyId);
      assert.equal(en.instanceId, es.instanceId);
      assert.deepEqual(en.parameters, es.parameters);
      assert.deepEqual(exerciseInvariant(en), exerciseInvariant(es));
      assert.notEqual(en.title, es.title);
      assert.equal(en.solution.length, es.solution.length);
    }
  }
});

test("grading parity holds for singleChoice, number, and multiNumber in both locales", () => {
  const cases = [
    ["u1-vectors-equal-magnitude", "b"],
    ["u1-units-convert-speed", "20.0"],
    ["u1-vectors-platform-components", ["6.36", "3.97"]],
  ];
  const es = new Map(getLocalizedUnit1Exercises("es").map((exercise) => [exercise.id, exercise]));
  const en = new Map(getLocalizedUnit1Exercises("en").map((exercise) => [exercise.id, exercise]));
  for (const [id, input] of cases) {
    assert.deepEqual(
      gradeInvariant(gradeExerciseResponse(en.get(id), input)),
      gradeInvariant(gradeExerciseResponse(es.get(id), input)),
      id,
    );
  }
});

test("generated family grading is locale-independent for every interaction kind", () => {
  const byKind = new Map();
  for (const family of UNIT_1_EXERCISE_FAMILIES) {
    const es = generateLocalizedUnit1FamilyInstance(family, "es", { random: seededRandom(8181) });
    if (byKind.has(es.interaction.kind)) continue;
    const en = generateLocalizedUnit1FamilyInstance(family, "en", { random: seededRandom(8181) });
    const input = es.interaction.kind === "singleChoice"
      ? es.interaction.correctOptionId
      : es.answer.kind === "number"
        ? String(es.answer.value)
        : es.answer.values.map(({ value }) => String(value));
    assert.deepEqual(gradeInvariant(gradeExerciseResponse(en, input)), gradeInvariant(gradeExerciseResponse(es, input)));
    byKind.set(es.interaction.kind, true);
  }
  assert.deepEqual([...byKind.keys()].sort(), ["multiNumber", "number", "singleChoice"]);
});

test("practice selection uses the same IDs and order in ES and EN", () => {
  const es = getLocalizedUnit1BankItems("es");
  const en = getLocalizedUnit1BankItems("en");
  const options = { filters: { topic: "vectores", difficulty: "2" }, size: 5, rotation: 3 };
  assert.deepEqual(
    selectExerciseBatch({ exercises: en, ...options }).map(({ id }) => id),
    selectExerciseBatch({ exercises: es, ...options }).map(({ id }) => id),
  );
  assert.deepEqual(en.map(({ id }) => id), es.map(({ id }) => id));
});
