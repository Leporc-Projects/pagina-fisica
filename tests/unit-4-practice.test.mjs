import assert from "node:assert/strict";
import test from "node:test";
import { UNIT_1_EXERCISES } from "../src/data/physics/unit-1/exercises.js";
import { UNIT_2_EXERCISES } from "../src/data/physics/unit-2/exercises.js";
import { UNIT_3_EXERCISES } from "../src/data/physics/unit-3/exercises.js";
import { UNIT_4_CONTENT } from "../src/data/physics/unit-4/content.js";
import { UNIT_4_COMMON_ERRORS } from "../src/data/physics/unit-4/common-errors.js";
import { UNIT_4_VISUALIZATIONS } from "../src/data/physics/unit-4/visualizations.js";
import { UNIT_4_EXERCISES } from "../src/data/physics/unit-4/exercises.js";
import { UNIT_4_EXERCISE_FAMILIES } from "../src/data/physics/unit-4/families.js";
import { generateLocalizedUnit4FamilyInstance, getLocalizedUnit4Exercises } from "../src/data/physics/unit-4/exercise-localize.js";
import { gradeExerciseResponse } from "../src/utils/bonus.js";
import { generateFamilyInstance, validateFamilyDefinition } from "../src/utils/exercise-families.js";

const seededRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
};
const finite = (value, seen = new WeakSet()) => {
  if (typeof value === "number") return Number.isFinite(value);
  if (!value || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  return Object.values(value).every((child) => finite(child, seen));
};
const interactionInvariant = (interaction) => interaction.kind === "singleChoice"
  ? { kind: interaction.kind, optionIds: interaction.options.map(({ id }) => id), correctOptionId: interaction.correctOptionId }
  : { kind: interaction.kind, fields: (interaction.kind === "number" ? [interaction.field] : interaction.fields).map(({ id, unit }) => ({ id, unit })) };
const invariant = (exercise) => ({
  id: exercise.id,
  unit: exercise.unit,
  topic: exercise.topic,
  subtopic: exercise.subtopic,
  type: exercise.type,
  representation: exercise.representation,
  cognitiveLevel: exercise.cognitiveLevel,
  difficulty: exercise.difficulty,
  modalities: exercise.modalities,
  answer: Object.fromEntries(Object.entries(exercise.answer).filter(([key]) => !["display", "presentation"].includes(key))),
  tolerance: exercise.tolerance,
  expectedUnit: exercise.expectedUnit,
  bonusEligible: exercise.bonusEligible,
  commonErrors: exercise.commonErrors,
  purpose: exercise.purpose,
  exposure: exercise.exposure,
  status: exercise.status,
  interaction: interactionInvariant(exercise.interaction),
});
const gradeSummary = ({ answered, correct, pointsEarned, pointsPossible, fieldResults }) => ({ answered, correct, pointsEarned, pointsPossible, fieldResults });

test("el banco fijo contiene 40 ejercicios, cinco por tema y sin Bonos", () => {
  assert.equal(UNIT_4_EXERCISES.length, 40);
  assert.equal(new Set(UNIT_4_EXERCISES.map(({ id }) => id)).size, 40);
  assert.ok(UNIT_4_EXERCISES.every(({ id, unit, bonusEligible, modalities }) => id.startsWith("u4-") && unit === 4 && bonusEligible === false && !modalities.includes("bonus")));
  assert.deepEqual(Object.fromEntries(Object.keys(UNIT_4_CONTENT).map((topic) => [topic, UNIT_4_EXERCISES.filter((exercise) => exercise.topic === topic).length])), Object.fromEntries(Object.keys(UNIT_4_CONTENT).map((topic) => [topic, 5])));
});

test("los ejercicios cumplen taxonomía, referencias, interacción y grading", () => {
  const errors = new Set(UNIT_4_COMMON_ERRORS.map(({ id }) => id));
  for (const exercise of UNIT_4_EXERCISES) {
    assert.ok(UNIT_4_CONTENT[exercise.topic]?.sections.some(({ id }) => id === exercise.subtopic), exercise.id);
    assert.ok(exercise.title && exercise.prompt && exercise.objectives.length && exercise.hints.length && exercise.solution.length, exercise.id);
    assert.ok(exercise.commonErrors.every((id) => errors.has(id)), exercise.id);
    if (exercise.visualizationId) assert.ok(UNIT_4_VISUALIZATIONS[exercise.visualizationId], exercise.id);
    if (exercise.interaction.kind === "singleChoice") {
      assert.deepEqual(exercise.interaction.options.map(({ id }) => id), ["a", "b", "c", "d"], exercise.id);
      assert.equal(exercise.answer.value, exercise.interaction.options.find(({ id }) => id === exercise.interaction.correctOptionId)?.content, exercise.id);
    } else {
      assert.ok(exercise.expectedUnit, exercise.id);
      const tolerances = typeof exercise.tolerance === "object" ? Object.values(exercise.tolerance) : [exercise.tolerance];
      assert.ok(tolerances.every((value) => Number.isFinite(value) && value >= 0), exercise.id);
      const input = exercise.answer.kind === "number" ? String(exercise.answer.value) : exercise.answer.values.map(({ value }) => String(value));
      assert.equal(gradeExerciseResponse(exercise, input).correct, true, exercise.id);
    }
  }
});

test("los 40 ejercicios tienen presentación inglesa completa y estado/grading invariantes", () => {
  const es = getLocalizedUnit4Exercises("es");
  const en = getLocalizedUnit4Exercises("en");
  assert.deepEqual(en.map(invariant), es.map(invariant));
  en.forEach((exercise, index) => {
    assert.notEqual(exercise.title, es[index].title, exercise.id);
    assert.notEqual(exercise.prompt, es[index].prompt, exercise.id);
    assert.equal(exercise.solution.length, es[index].solution.length, exercise.id);
    const input = exercise.interaction.kind === "singleChoice"
      ? exercise.interaction.correctOptionId
      : exercise.answer.kind === "number"
        ? String(exercise.answer.value)
        : exercise.answer.values.map(({ value }) => String(value));
    assert.deepEqual(gradeSummary(gradeExerciseResponse(exercise, input)), gradeSummary(gradeExerciseResponse(es[index], input)), exercise.id);
  });
});

test("las diez familias generan mil estados deterministas, finitos y físicamente válidos", () => {
  assert.equal(UNIT_4_EXERCISE_FAMILIES.length, 10);
  assert.equal(new Set(UNIT_4_EXERCISE_FAMILIES.map(({ id }) => id)).size, 10);
  for (const [familyIndex, family] of UNIT_4_EXERCISE_FAMILIES.entries()) {
    assert.equal(validateFamilyDefinition(family).valid, true, family.id);
    assert.match(family.id, /^u4-family-/);
    assert.equal(family.unit, 4);
    assert.equal(family.bonusEligible, false);
    for (let seed = 1; seed <= 100; seed += 1) {
      const randomSeed = seed * 101 + familyIndex;
      const first = generateFamilyInstance(family, { random: seededRandom(randomSeed) });
      const second = generateFamilyInstance(family, { random: seededRandom(randomSeed) });
      assert.equal(finite(first.parameters) && finite(first.answer), true, `${family.id}:${seed}`);
      assert.deepEqual(first.parameters, second.parameters, `${family.id}:${seed}`);
      assert.deepEqual(first.answer, second.answer, `${family.id}:${seed}`);
      assert.deepEqual(interactionInvariant(first.interaction), interactionInvariant(second.interaction), `${family.id}:${seed}`);
      const p = first.parameters;
      const answer = first.answer.value;
      if (family.id === "u4-family-work-angle") assert.ok(Math.abs(answer - Math.round(p.F * p.d * Math.cos(p.theta * Math.PI / 180) * 1000) / 1000) < 0.001);
      if (family.id === "u4-family-work-energy-speed") assert.ok(0.5 * p.m * p.vi ** 2 + p.Wnet >= 0 && answer >= 0);
      if (family.id === "u4-family-linear-force-work") assert.ok(Math.abs(answer - (p.a * (p.xf - p.xi) + p.b / 2 * (p.xf ** 2 - p.xi ** 2))) < 0.02);
      if (family.id === "u4-family-power-angle") assert.ok(Math.abs(answer - Math.round(p.F * p.v * Math.cos(p.theta * Math.PI / 180) * 1000) / 1000) < 0.001);
      if (family.id === "u4-family-gravity-delta-u") assert.ok(Math.abs(answer - Math.round(p.m * p.g * (p.yf - p.yi) * 1000) / 1000) < 0.001);
      if (family.id === "u4-family-energy-with-friction") assert.ok(p.Wf < 0 && p.m * p.g * p.h + p.Wf > 0 && answer >= 0);
      if (family.id === "u4-family-force-from-potential") assert.equal(answer, -(2 * p.a * p.x + p.b));
      if (family.id === "u4-family-parabolic-energy-diagram") assert.ok(p.E - p.a * p.x ** 2 >= 0);
    }
  }
});

test("la misma seed conserva estado físico y grading entre ES y EN", () => {
  for (const [index, family] of UNIT_4_EXERCISE_FAMILIES.entries()) {
    for (const seed of [7, 41, 2026, 9001]) {
      const es = generateLocalizedUnit4FamilyInstance(family, "es", { random: seededRandom(seed + index) });
      const en = generateLocalizedUnit4FamilyInstance(family, "en", { random: seededRandom(seed + index) });
      assert.deepEqual(en.parameters, es.parameters, family.id);
      assert.deepEqual(invariant(en), invariant(es), family.id);
      assert.notEqual(en.title, es.title, family.id);
      const input = String(es.answer.value);
      assert.deepEqual(gradeSummary(gradeExerciseResponse(en, input)), gradeSummary(gradeExerciseResponse(es, input)), family.id);
    }
  }
});

test("Unidad 4 no altera bancos anteriores y la Unidad 1 sigue siendo la única con Bonos", () => {
  assert.equal(UNIT_1_EXERCISES.length, 55);
  assert.equal(UNIT_2_EXERCISES.length, 41);
  assert.equal(UNIT_3_EXERCISES.length, 36);
  assert.ok(UNIT_4_EXERCISES.every(({ modalities }) => !modalities.includes("bonus")));
});
