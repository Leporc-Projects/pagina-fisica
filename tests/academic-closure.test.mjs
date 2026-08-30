import assert from "node:assert/strict";
import test from "node:test";

import {
  ACADEMIC_UNITS,
  getAcademicUnitAdapter,
  getLocalizedAcademicUnit,
} from "../src/data/physics/index.js";
import { generateLocalizedAcademicFamilyInstance } from "../src/data/physics/family-registry.js";
import { localizeAcademicUnitLabel } from "../src/data/physics/localize-unit-label.js";
import { getRouteCounterpart } from "../src/i18n/routes.js";

const EXPECTED = Object.freeze([
  { unit: 1, topics: 7, sections: 24, formulas: 25, visualizations: 26, fixed: 55, families: 15 },
  { unit: 2, topics: 7, sections: 24, formulas: 10, visualizations: 12, fixed: 41, families: 8 },
  { unit: 3, topics: 8, sections: 27, formulas: 13, visualizations: 14, fixed: 36, families: 10 },
  { unit: 4, topics: 8, sections: 32, formulas: 12, visualizations: 12, fixed: 40, families: 10 },
  { unit: 5, topics: 7, sections: 28, formulas: 12, visualizations: 12, fixed: 40, families: 10 },
  { unit: 6, topics: 10, sections: 40, formulas: 14, visualizations: 14, fixed: 40, families: 12 },
  { unit: 7, topics: 10, sections: 40, formulas: 14, visualizations: 14, fixed: 40, families: 12 },
]);

const seededRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
};

const finiteTree = (value, seen = new WeakSet()) => {
  if (typeof value === "number") return Number.isFinite(value);
  if (!value || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  return Object.values(value).every((child) => finiteTree(child, seen));
};

const answerInvariant = (answer) => answer.kind === "number"
  ? { kind: answer.kind, value: answer.value }
  : answer.kind === "values"
    ? { kind: answer.kind, values: answer.values.map(({ id, value }) => ({ id, value })) }
    : { kind: answer.kind, value: answer.value };

test("el inventario de cierre conserva siete unidades y sus totales académicos", () => {
  assert.deepEqual(ACADEMIC_UNITS.map(({ number }) => number), EXPECTED.map(({ unit }) => unit));

  const observed = EXPECTED.map(({ unit }) => {
    const adapter = getAcademicUnitAdapter(unit);
    const content = adapter.getContent("es");
    const sections = Object.values(content).flatMap((topic) => topic.sections);
    const families = adapter.getBankItems("es").filter(({ itemKind }) => itemKind === "parameterizedFamily");
    const formulas = new Set(sections.flatMap((section) => (section.formulas ?? [])
      .map((formula) => typeof formula === "string" ? formula : formula.id)));
    return {
      unit,
      topics: Object.keys(content).length,
      sections: sections.length,
      formulas: formulas.size,
      visualizations: adapter.visualizationIds.length,
      fixed: adapter.getFixedExercises("es").length,
      families: families.length,
    };
  });

  assert.deepEqual(observed, EXPECTED);
  assert.equal(observed.reduce((sum, item) => sum + item.topics, 0), 57);
  assert.equal(observed.reduce((sum, item) => sum + item.sections, 0), 215);
  assert.equal(observed.reduce((sum, item) => sum + item.formulas, 0), 100);
  assert.equal(observed.reduce((sum, item) => sum + item.visualizations, 0), 104);
  assert.equal(observed.reduce((sum, item) => sum + item.fixed, 0), 292);
  assert.equal(observed.reduce((sum, item) => sum + item.families, 0), 77);
});

test("los 292 ejercicios y las 142 rutas académicas conservan identidad ES/EN", () => {
  const exerciseIds = new Set();
  let routeCount = 0;

  for (const { unit } of EXPECTED) {
    const adapter = getAcademicUnitAdapter(unit);
    const esUnit = getLocalizedAcademicUnit(unit, "es");
    const enUnit = getLocalizedAcademicUnit(unit, "en");
    const esExercises = adapter.getFixedExercises("es");
    const enExercises = adapter.getFixedExercises("en");

    assert.equal(getRouteCounterpart(esUnit.route, "en"), enUnit.route);
    assert.equal(getRouteCounterpart(esUnit.practiceRoute, "en"), enUnit.practiceRoute);
    routeCount += 4;

    esUnit.topics.forEach((topic, index) => {
      assert.equal(getRouteCounterpart(topic.route, "en"), enUnit.topics[index].route);
      routeCount += 2;
    });

    assert.equal(enExercises.length, esExercises.length);
    esExercises.forEach((exercise, index) => {
      assert.equal(exerciseIds.has(exercise.id), false, exercise.id);
      exerciseIds.add(exercise.id);
      assert.equal(enExercises[index].id, exercise.id);
      assert.equal(enExercises[index].unit, exercise.unit);
      assert.equal(enExercises[index].topic, exercise.topic);
      assert.equal(enExercises[index].subtopic, exercise.subtopic);
      assert.deepEqual(answerInvariant(enExercises[index].answer), answerInvariant(exercise.answer));
      assert.equal(enExercises[index].tolerance, exercise.tolerance);
      assert.equal(enExercises[index].expectedUnit, localizeAcademicUnitLabel(exercise.expectedUnit, "en"));
    });
  }

  assert.equal(exerciseIds.size, 292);
  assert.equal(routeCount, 142);
});

test("las 77 familias generan 100 semillas finitas, deterministas y bilingües", () => {
  const familyIds = ACADEMIC_UNITS.flatMap(({ number }) => getAcademicUnitAdapter(number)
    .getBankItems("es")
    .filter(({ itemKind }) => itemKind === "parameterizedFamily")
    .map(({ id }) => id));

  assert.equal(familyIds.length, 77);
  assert.equal(new Set(familyIds).size, 77);

  familyIds.forEach((familyId, familyIndex) => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const randomSeed = 1009 + familyIndex * 1009 + seed * 7919;
      const es = generateLocalizedAcademicFamilyInstance(familyId, "es", {
        random: seededRandom(randomSeed),
      });
      const esRepeat = generateLocalizedAcademicFamilyInstance(familyId, "es", {
        random: seededRandom(randomSeed),
      });
      const en = generateLocalizedAcademicFamilyInstance(familyId, "en", {
        random: seededRandom(randomSeed),
      });

      assert.deepEqual(esRepeat.parameters, es.parameters, `${familyId}, seed ${seed}`);
      assert.deepEqual(answerInvariant(esRepeat.answer), answerInvariant(es.answer), `${familyId}, seed ${seed}`);
      assert.deepEqual(en.parameters, es.parameters, `${familyId}, seed ${seed}`);
      assert.deepEqual(answerInvariant(en.answer), answerInvariant(es.answer), `${familyId}, seed ${seed}`);
      assert.equal(en.instanceId, es.instanceId, `${familyId}, seed ${seed}`);
      assert.equal(en.tolerance, es.tolerance, `${familyId}, seed ${seed}`);
      assert.equal(en.expectedUnit, es.expectedUnit, `${familyId}, seed ${seed}`);
      assert.equal(finiteTree(es.parameters) && finiteTree(es.answer), true, `${familyId}, seed ${seed}`);
    }
  });
});
