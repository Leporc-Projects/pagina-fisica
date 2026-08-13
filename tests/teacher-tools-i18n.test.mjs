import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { noticeCategoryLabel } from "../src/data/notice-localize.js";
import { localizeResultsOrganizerData } from "../src/data/results-organizer-localize.js";
import { localizeReviewData } from "../src/data/review-localize.js";
import { getDictionaryKeys, t } from "../src/i18n/index.js";
import {
  ROUTE_IDS,
  getLocalizedPath,
  getRouteCounterpart,
} from "../src/i18n/routes.js";

const root = fileURLToPath(new URL("../", import.meta.url));

const routes = [
  [ROUTE_IDS.COURSE_TOOLS, "/fisica-basica-1/herramientas", "/en/basic-physics-1/tools"],
  [ROUTE_IDS.COURSE_TOOL_QUESTION_BANK, "/fisica-basica-1/herramientas/banco", "/en/basic-physics-1/tools/question-bank"],
  [ROUTE_IDS.COURSE_TOOL_NOTICES, "/fisica-basica-1/herramientas/avisos", "/en/basic-physics-1/tools/notices"],
  [ROUTE_IDS.COURSE_TOOL_SIMULATION_LAB, "/fisica-basica-1/herramientas/simulaciones", "/en/basic-physics-1/tools/simulation-lab"],
  [ROUTE_IDS.COURSE_TOOL_REVIEW, "/fisica-basica-1/herramientas/revision", "/en/basic-physics-1/tools/review"],
  [ROUTE_IDS.COURSE_TOOL_RESULTS, "/fisica-basica-1/herramientas/notas", "/en/basic-physics-1/tools/results"],
];

test("las seis herramientas docentes tienen rutas ES/EN exactas y reversibles", () => {
  routes.forEach(([routeId, es, en]) => {
    assert.equal(getLocalizedPath(routeId, "es"), es);
    assert.equal(getLocalizedPath(routeId, "en"), en);
    assert.equal(getRouteCounterpart(es, "en"), en);
    assert.equal(getRouteCounterpart(en, "es"), es);
  });
});

test("cada ruta inglesa existe y declara locale en sin duplicar la implementación", () => {
  const pages = ["index", "question-bank", "notices", "simulation-lab", "review", "results"];
  pages.forEach((page) => {
    const source = fs.readFileSync(`${root}/src/pages/en/basic-physics-1/tools/${page}.astro`, "utf8");
    assert.match(source, /locale="en"/);
    assert.doesNotMatch(source, /<BaseLayout/);
  });
});

test("la navegación docente usa el registro de rutas y el locale recibido", () => {
  const source = fs.readFileSync(`${root}/src/components/teacher/TeacherToolsNav.astro`, "utf8");
  routes.forEach(([routeId]) => assert.match(source, new RegExp(`ROUTE_IDS\\.${Object.entries(ROUTE_IDS).find(([, value]) => value === routeId)[0]}`)));
  assert.match(source, /getLocalizedPath\(tool\.routeId, locale\)/);
  assert.doesNotMatch(source, /href="\/fisica-basica-1/);
});

test("las claves docentes tienen paridad completa y no usan fallback silencioso", () => {
  assert.deepEqual(getDictionaryKeys("es"), getDictionaryKeys("en"));
  assert.notEqual(t("es", "teacher.page.resultsTitle"), t("en", "teacher.page.resultsTitle"));
  assert.throws(() => t("fr", "teacher.page.resultsTitle"), /Unsupported locale/);
  assert.throws(() => t("en", "teacher.missing"), /Missing translation key/);
});

test("las proyecciones docentes traducen etiquetas sin cambiar valores canónicos", () => {
  const reviewEs = localizeReviewData("es");
  const reviewEn = localizeReviewData("en");
  assert.deepEqual(reviewEs.reviewStatuses.map(([value]) => value), reviewEn.reviewStatuses.map(([value]) => value));
  assert.notEqual(reviewEs.reviewStatuses[0][1], reviewEn.reviewStatuses[0][1]);

  const resultsEs = localizeResultsOrganizerData("es");
  const resultsEn = localizeResultsOrganizerData("en");
  assert.deepEqual(resultsEs.duplicatePolicies.map(([value]) => value), resultsEn.duplicatePolicies.map(([value]) => value));
  assert.notEqual(resultsEs.duplicatePolicies[0][1], resultsEn.duplicatePolicies[0][1]);

  assert.equal(noticeCategoryLabel("Curso", "es"), "Curso");
  assert.equal(noticeCategoryLabel("Curso", "en"), "Course");
});
