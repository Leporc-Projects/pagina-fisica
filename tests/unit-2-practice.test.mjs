import assert from "node:assert/strict";
import test from "node:test";
import { EXERCISE_COGNITIVE_LEVELS, EXERCISE_EXPOSURES, EXERCISE_INTERACTION_KINDS, EXERCISE_MODALITIES, EXERCISE_PURPOSES, EXERCISE_REPRESENTATIONS, EXERCISE_STATUSES, EXERCISE_TYPES } from "../src/data/physics/exercise-schema.js";
import { UNIT_2_CONTENT } from "../src/data/physics/unit-2/content.js";
import { UNIT_2_COMMON_ERRORS } from "../src/data/physics/unit-2/common-errors.js";
import { UNIT_2_EXERCISES } from "../src/data/physics/unit-2/exercises.js";
import { UNIT_2_EXERCISE_FAMILIES } from "../src/data/physics/unit-2/families.js";
import { generateLocalizedUnit2FamilyInstance, getLocalizedUnit2Exercises } from "../src/data/physics/unit-2/exercise-localize.js";
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
  id: exercise.id, unit: exercise.unit, topic: exercise.topic, subtopic: exercise.subtopic,
  type: exercise.type, representation: exercise.representation, cognitiveLevel: exercise.cognitiveLevel,
  difficulty: exercise.difficulty, modalities: exercise.modalities, answer: Object.fromEntries(Object.entries(exercise.answer).filter(([key]) => !["display", "presentation"].includes(key))),
  tolerance: exercise.tolerance, expectedUnit: exercise.expectedUnit, bonusEligible: exercise.bonusEligible,
  commonErrors: exercise.commonErrors, purpose: exercise.purpose, exposure: exercise.exposure, status: exercise.status,
  interaction: interactionInvariant(exercise.interaction),
});

test("el banco fijo contiene 41 ejercicios con la distribución temática acordada", () => {
  assert.equal(UNIT_2_EXERCISES.length, 41);
  assert.equal(new Set(UNIT_2_EXERCISES.map(({ id }) => id)).size, 41);
  assert.ok(UNIT_2_EXERCISES.every(({ id }) => id.startsWith("u2-")));
  const counts = Object.fromEntries(Object.keys(UNIT_2_CONTENT).map((topic) => [topic, UNIT_2_EXERCISES.filter((exercise) => exercise.topic === topic).length]));
  assert.deepEqual(counts, { "fuerzas-interacciones": 5, "primera-ley": 5, "segunda-ley": 8, "masa-peso": 5, "tercera-ley": 6, "diagramas-cuerpo-libre": 7, "marcos-inerciales": 5 });
  for (const required of ["conceptual", "numerical", "symbolic", "graphical", "application", "integrative"]) assert.ok(UNIT_2_EXERCISES.some(({ type }) => type === required), required);
  for (const required of ["verbal", "numerical", "symbolic", "graphical", "vectorial", "visual"]) assert.ok(UNIT_2_EXERCISES.some(({ representation }) => representation === required), required);
});

test("todos los ejercicios cumplen taxonomía, contenido, interacción y grading", () => {
  const errorIds = new Set(UNIT_2_COMMON_ERRORS.map(({ id }) => id));
  for (const exercise of UNIT_2_EXERCISES) {
    assert.equal(exercise.unit, 2, exercise.id);
    assert.ok(UNIT_2_CONTENT[exercise.topic]?.sections.some(({ id }) => id === exercise.subtopic), exercise.id);
    assert.ok(EXERCISE_TYPES.includes(exercise.type), exercise.id);
    assert.ok(EXERCISE_REPRESENTATIONS.includes(exercise.representation), exercise.id);
    assert.ok(EXERCISE_COGNITIVE_LEVELS.includes(exercise.cognitiveLevel), exercise.id);
    assert.ok(EXERCISE_STATUSES.includes(exercise.status), exercise.id);
    assert.ok(EXERCISE_PURPOSES.includes(exercise.purpose), exercise.id);
    assert.ok(EXERCISE_EXPOSURES.includes(exercise.exposure), exercise.id);
    assert.ok(exercise.modalities.every((value) => EXERCISE_MODALITIES.includes(value)), exercise.id);
    assert.ok(EXERCISE_INTERACTION_KINDS.includes(exercise.interaction.kind), exercise.id);
    assert.ok(exercise.objectives.length && exercise.hints.length && exercise.solution.length >= 3, exercise.id);
    assert.ok(exercise.commonErrors.every((id) => errorIds.has(id)), exercise.id);
    assert.equal(exercise.bonusEligible, false, exercise.id);
    if (exercise.interaction.kind === "singleChoice") {
      assert.ok(exercise.interaction.options.some(({ id }) => id === exercise.interaction.correctOptionId), exercise.id);
    } else {
      assert.ok(exercise.expectedUnit && Number.isFinite(exercise.tolerance) && exercise.tolerance >= 0, exercise.id);
      const input = exercise.answer.kind === "number" ? String(exercise.answer.value) : exercise.answer.values.map(({ value }) => String(value));
      assert.equal(gradeExerciseResponse(exercise, input).correct, true, exercise.id);
    }
  }
});

test("los 41 ejercicios tienen presentación inglesa completa y grading invariante", () => {
  const es = getLocalizedUnit2Exercises("es");
  const en = getLocalizedUnit2Exercises("en");
  assert.deepEqual(en.map(invariant), es.map(invariant));
  en.forEach((exercise, index) => {
    assert.notEqual(exercise.title, es[index].title, exercise.id);
    assert.notEqual(exercise.prompt, es[index].prompt, exercise.id);
    assert.equal(exercise.solution.length, es[index].solution.length, exercise.id);
    const input = exercise.interaction.kind === "singleChoice" ? exercise.interaction.correctOptionId : exercise.answer.kind === "number" ? String(exercise.answer.value) : exercise.answer.values.map(({ value }) => String(value));
    const grade = ({ answered, correct, pointsEarned, pointsPossible, fieldResults }) => ({ answered, correct, pointsEarned, pointsPossible, fieldResults });
    assert.deepEqual(grade(gradeExerciseResponse(exercise, input)), grade(gradeExerciseResponse(es[index], input)), exercise.id);
  });
});

test("las ocho familias generan cientos de estados finitos, deterministas y físicamente válidos", () => {
  assert.equal(UNIT_2_EXERCISE_FAMILIES.length, 8);
  assert.equal(new Set(UNIT_2_EXERCISE_FAMILIES.map(({ id }) => id)).size, 8);
  for (const [familyIndex, family] of UNIT_2_EXERCISE_FAMILIES.entries()) {
    assert.equal(validateFamilyDefinition(family).valid, true, family.id);
    assert.match(family.id, /^u2-family-/);
    assert.equal(family.unit, 2);
    assert.equal(family.bonusEligible, false);
    for (let seed = 1; seed <= 200; seed += 1) {
      const first = generateFamilyInstance(family, { random: seededRandom(seed * 101 + familyIndex) });
      const second = generateFamilyInstance(family, { random: seededRandom(seed * 101 + familyIndex) });
      assert.equal(finite(first.parameters) && finite(first.answer), true, `${family.id}:${seed}`);
      assert.deepEqual(first.parameters, second.parameters, `${family.id}:${seed}`);
      assert.deepEqual(first.answer, second.answer, `${family.id}:${seed}`);
      assert.deepEqual(interactionInvariant(first.interaction), interactionInvariant(second.interaction), `${family.id}:${seed}`);
      for (const [key, value] of Object.entries(first.parameters)) if (/mass/i.test(key)) assert.ok(value > 0, `${family.id}:${key}`);
      if (family.id === "u2-family-third-law") assert.notEqual(first.parameters.massA, first.parameters.massB);
    }
  }
});

test("la misma seed conserva estado físico y grading entre ES y EN", () => {
  for (const [familyIndex, family] of UNIT_2_EXERCISE_FAMILIES.entries()) {
    for (const seed of [7, 41, 2026, 9001]) {
      const es = generateLocalizedUnit2FamilyInstance(family, "es", { random: seededRandom(seed + familyIndex) });
      const en = generateLocalizedUnit2FamilyInstance(family, "en", { random: seededRandom(seed + familyIndex) });
      assert.deepEqual(en.parameters, es.parameters, family.id);
      assert.deepEqual(invariant(en), invariant(es), family.id);
      assert.notEqual(en.title, es.title, family.id);
      const input = es.answer.kind === "number" ? String(es.answer.value) : es.answer.values.map(({ value }) => String(value));
      const grade = ({ answered, correct, pointsEarned, pointsPossible, fieldResults }) => ({ answered, correct, pointsEarned, pointsPossible, fieldResults });
      assert.deepEqual(grade(gradeExerciseResponse(en, input)), grade(gradeExerciseResponse(es, input)), family.id);
    }
  }
});
