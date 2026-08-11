import assert from "node:assert/strict";
import test from "node:test";
import { localizeCourseData } from "../src/data/course-localize.js";
import { getLocalizedUnit1Bonuses, localizeUnit1 } from "../src/data/physics/unit-1/localize.js";
import { getLocalizedUnit1BankItems } from "../src/data/physics/unit-1/exercise-localize.js";
import { localizeParticipationData } from "../src/data/participation-localize.js";
import { getVideoContentTypes } from "../src/data/videos.js";
import { getLocalizedPath, getRouteCounterpart, ROUTE_IDS } from "../src/i18n/routes.js";
import { eligiblePoolForBonus } from "../src/utils/bonus.js";

test("las proyecciones públicas conservan los invariantes académicos", () => {
  const es = localizeCourseData("es");
  const en = localizeCourseData("en");
  assert.equal(en.COURSE.code, es.COURSE.code);
  assert.equal(en.COURSE.totalHours, es.COURSE.totalHours);
  assert.deepEqual(en.EVALUATION.map((item) => item.percentage), es.EVALUATION.map((item) => item.percentage));
  assert.deepEqual(en.SCHEDULE.map((item) => [item.session, item.date]), es.SCHEDULE.map((item) => [item.session, item.date]));
  assert.deepEqual(en.SCHEDULE.map((item) => [item.session, item.date, item.type, item.chapter]), es.SCHEDULE.map((item) => [item.session, item.date, item.type, item.chapter]));
  assert.ok(en.SCHEDULE.every((item, index) => item.title !== es.SCHEDULE[index].title && item.topics.every(Boolean) && item.objectives.every(Boolean)));
  assert.equal(en.EVALUATION.reduce((total, item) => total + item.percentage, 0), 100);
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
  assert.deepEqual(
    en.map(({ id, slug, version, unit, modality, purpose, exposure, feedbackPolicy, status, questionCount, estimatedMinutes, topics, blueprint }) => ({ id, slug, version, unit, modality, purpose, exposure, feedbackPolicy, status, questionCount, estimatedMinutes, topics, blueprint })),
    es.map(({ id, slug, version, unit, modality, purpose, exposure, feedbackPolicy, status, questionCount, estimatedMinutes, topics, blueprint }) => ({ id, slug, version, unit, modality, purpose, exposure, feedbackPolicy, status, questionCount, estimatedMinutes, topics, blueprint }))
  );
  en.forEach((bonus, index) => {
    assert.deepEqual(
      eligiblePoolForBonus(bonus, getLocalizedUnit1BankItems("en")).map(({ id }) => id),
      eligiblePoolForBonus(es[index], getLocalizedUnit1BankItems("es")).map(({ id }) => id)
    );
  });
});

test("las rutas profundas de Bonos conservan la identidad al cambiar de idioma", () => {
  const es = "/fisica-basica-1/bonos/cinematica";
  const en = "/en/basic-physics-1/bonuses/cinematica";
  assert.equal(getRouteCounterpart(es, "en"), en);
  assert.equal(getRouteCounterpart(en, "es"), es);
});

test("Participa y Videos declaran presentación completa en ambos locales", () => {
  const es = localizeParticipationData("es");
  const en = localizeParticipationData("en");
  assert.deepEqual(en.topics.map(({ slug }) => slug), es.topics.map(({ slug }) => slug));
  assert.deepEqual(en.activityOptions.map(({ value }) => value), es.activityOptions.map(({ value }) => value));
  assert.ok(en.topics.every((topic, index) => topic.title !== es.topics[index].title));
  assert.equal(getVideoContentTypes("en").length, getVideoContentTypes("es").length);
});
