import assert from "node:assert/strict";
import test from "node:test";
import { localizeCourseData } from "../src/data/course-localize.js";
import { getLocalizedUnit1Bonuses, localizeUnit1 } from "../src/data/physics/unit-1/localize.js";
import { getLocalizedPath, ROUTE_IDS } from "../src/i18n/routes.js";

test("las proyecciones públicas conservan los invariantes académicos", () => {
  const es = localizeCourseData("es");
  const en = localizeCourseData("en");
  assert.equal(en.COURSE.code, es.COURSE.code);
  assert.equal(en.COURSE.totalHours, es.COURSE.totalHours);
  assert.deepEqual(en.EVALUATION.map((item) => item.percentage), es.EVALUATION.map((item) => item.percentage));
  assert.deepEqual(en.SCHEDULE.map((item) => [item.session, item.date]), es.SCHEDULE.map((item) => [item.session, item.date]));
});

test("Unidad 1 conserva IDs, orden y rutas profundas localizadas", () => {
  const es = localizeUnit1("es");
  const en = localizeUnit1("en");
  assert.deepEqual(en.topics.map((topic) => [topic.slug, topic.order, topic.priority]), es.topics.map((topic) => [topic.slug, topic.order, topic.priority]));
  assert.equal(en.route, getLocalizedPath(ROUTE_IDS.COURSE_UNIT_1, "en"));
  assert.ok(en.topics.every((topic) => topic.route.startsWith("/en/basic-physics-1/units/unit-1/")));
});

test("Bonos ingleses proyectan los mismos contratos de selección", () => {
  const es = getLocalizedUnit1Bonuses("es");
  const en = getLocalizedUnit1Bonuses("en");
  assert.deepEqual(en.map((bonus) => [bonus.id, bonus.slug, bonus.questionCount, bonus.blueprint]), es.map((bonus) => [bonus.id, bonus.slug, bonus.questionCount, bonus.blueprint]));
});
