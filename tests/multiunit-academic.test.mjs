import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { UNITS } from "../src/data/course.js";
import { localizeCourseData } from "../src/data/course-localize.js";
import {
  ACADEMIC_UNITS,
  getAcademicUnit,
  getAcademicUnitAdapter,
  getAcademicUnitForContext,
  getDevelopedAcademicUnits,
  getLocalizedAcademicUnit,
} from "../src/data/physics/index.js";
import { COURSE_IDS } from "../src/data/courses.js";
import { getLocalizedPath, getRouteCounterpart } from "../src/i18n/routes.js";
import { generateLocalizedAcademicFamilyInstance, getAcademicExerciseFamily } from "../src/data/physics/family-registry.js";

const root = fileURLToPath(new URL("../", import.meta.url));

test("el registro académico declara exactamente las Unidades 1 a 7 desarrolladas", () => {
  assert.deepEqual(ACADEMIC_UNITS.map(({ number }) => number), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(new Set(ACADEMIC_UNITS.map(({ number }) => number)).size, 7);
  assert.equal(new Set(ACADEMIC_UNITS.flatMap(({ topics }) => topics.map(({ route }) => route))).size, 57);
  assert.equal(getAcademicUnit(1)?.number, 1);
  assert.equal(getAcademicUnit(2)?.number, 2);
  assert.equal(getAcademicUnit(3)?.number, 3);
  assert.equal(getAcademicUnit(4)?.number, 4);
  assert.equal(getAcademicUnit(5)?.number, 5);
  assert.equal(getAcademicUnit(6)?.number, 6);
  assert.equal(getAcademicUnit(7)?.number, 7);
  assert.equal(getAcademicUnitForContext(COURSE_IDS.PHYSICS_BASIC_1, 2)?.slug, "unidad-2");
});

test("los adapters genéricos resuelven las siete unidades en ambos locales", () => {
  for (const unitNumber of [1, 2, 3, 4, 5, 6, 7]) {
    const adapter = getAcademicUnitAdapter(unitNumber);
    assert.ok(adapter);
    for (const locale of ["es", "en"]) {
      const unit = getLocalizedAcademicUnit(unitNumber, locale);
      assert.equal(unit.number, unitNumber);
      assert.equal(unit.topics.length, [6, 7].includes(unitNumber) ? 10 : [3, 4].includes(unitNumber) ? 8 : 7);
      assert.equal(adapter.getFixedExercises(locale).every((exercise) => exercise.unit === unitNumber), true);
      assert.equal(adapter.visualizationIds.every((id) => adapter.getVisualization(id, locale)), true);
      for (const topic of unit.topics) {
        assert.equal(getLocalizedPath(adapter.getTopicRouteId(topic.slug), locale), topic.route);
      }
    }
  }
  assert.deepEqual(getDevelopedAcademicUnits("en").map(({ shortTitle }) => shortTitle), ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5", "Unit 6", "Unit 7"]);
});

test("cada ruta académica desarrollada tiene contraparte ES/EN reversible", () => {
  for (const unit of ACADEMIC_UNITS) {
    const es = getLocalizedAcademicUnit(unit.number, "es");
    const en = getLocalizedAcademicUnit(unit.number, "en");
    assert.equal(getRouteCounterpart(es.route, "en"), en.route);
    assert.equal(getRouteCounterpart(es.practiceRoute, "en"), en.practiceRoute);
    es.topics.forEach((topic, index) => assert.equal(getRouteCounterpart(topic.route, "en"), en.topics[index].route));
  }
});

test("el catálogo bilingüe conserva las siete unidades y todos sus topics", () => {
  const en = localizeCourseData("en").UNITS;
  assert.equal(en.length, UNITS.length);
  en.forEach((unit, index) => {
    assert.equal(unit.number, UNITS[index].number);
    assert.equal(unit.topics.length, UNITS[index].topics.length);
    assert.notDeepEqual(unit.topics, UNITS[index].topics);
  });
});

test("renderers y catálogos consumen el registro sin imports directos de unidades", () => {
  const renderers = [
    "src/components/academic/AcademicUnitLanding.astro",
    "src/components/academic/AcademicUnitNav.astro",
    "src/components/academic/AcademicUnitPracticePage.astro",
    "src/components/academic/UnitTopicPage.astro",
  ].map((path) => fs.readFileSync(`${root}/${path}`, "utf8")).join("\n");
  assert.doesNotMatch(renderers, /data\/physics\/unit-[123]/);
  assert.match(renderers, /getAcademicUnitAdapter|unit\.topics/);

  const unitsCatalog = fs.readFileSync(`${root}/src/pages/fisica-basica-1/unidades.astro`, "utf8");
  const practiceCatalog = fs.readFileSync(`${root}/src/pages/fisica-basica-1/ejercicios.astro`, "utf8");
  assert.match(unitsCatalog, /getDevelopedAcademicUnits/);
  assert.match(practiceCatalog, /getDevelopedAcademicUnits/);
  assert.doesNotMatch(`${unitsCatalog}\n${practiceCatalog}`, /unit\.number\s*===\s*[123]/);
});

test("el runtime de práctica materializa familias registradas de las siete unidades", () => {
  const ids = ["family-u1-vector-sum", "u2-family-second-law-acceleration", "u3-family-elevator-normal", "u4-family-work-angle", "u5-family-rocket-deltav", "u6-family-slow-precession", "u7-family-driven-response"];
  ids.forEach((id, index) => {
    const family = getAcademicExerciseFamily(id);
    assert.ok(family, id);
    let state = index + 17;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x1_0000_0000;
    };
    const instance = generateLocalizedAcademicFamilyInstance(id, "en", { random });
    assert.equal(instance.familyId, id);
    assert.equal(instance.unit, family.unit);
    assert.ok(instance.title && instance.prompt);
  });
});
