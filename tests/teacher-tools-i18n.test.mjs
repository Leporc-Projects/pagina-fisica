import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { noticeCategoryLabel } from "../src/data/notice-localize.js";
import { localizeResultsOrganizerData } from "../src/data/results-organizer-localize.js";
import { localizeReviewData } from "../src/data/review-localize.js";
import { TEACHER_TOOLS, getPublishedTeacherTools, getTeacherToolById } from "../src/data/teacher-tools.js";
import { getDictionaryKeys, t } from "../src/i18n/index.js";
import {
  ROUTE_IDS,
  getLocalizedPath,
  getRouteCounterpart,
} from "../src/i18n/routes.js";

const root = fileURLToPath(new URL("../", import.meta.url));

const allRoutes = [
  [ROUTE_IDS.COURSE_TOOLS, "/fisica-basica-1/herramientas", "/en/basic-physics-1/tools"],
  [ROUTE_IDS.COURSE_TOOL_QUESTION_BANK, "/fisica-basica-1/herramientas/banco", "/en/basic-physics-1/tools/question-bank"],
  [ROUTE_IDS.COURSE_TOOL_NOTICES, "/fisica-basica-1/herramientas/avisos", "/en/basic-physics-1/tools/notices"],
  [ROUTE_IDS.COURSE_TOOL_SIMULATION_LAB, "/fisica-basica-1/herramientas/simulaciones", "/en/basic-physics-1/tools/simulation-lab"],
  [ROUTE_IDS.COURSE_TOOL_REVIEW, "/fisica-basica-1/herramientas/revision", "/en/basic-physics-1/tools/review"],
  [ROUTE_IDS.COURSE_TOOL_RESULTS, "/fisica-basica-1/herramientas/notas", "/en/basic-physics-1/tools/results"],
];

test("el registro conserva las cinco herramientas y publica solo avisos y resultados", () => {
  assert.equal(TEACHER_TOOLS.length, 5);
  assert.deepEqual(
    getPublishedTeacherTools().map((tool) => tool.id),
    ["notices", "results"]
  );
  assert.deepEqual(
    TEACHER_TOOLS.filter((tool) => !tool.published).map((tool) => tool.id).sort(),
    ["bank", "review", "simulations"]
  );
  assert.equal(getTeacherToolById("bank")?.published, false);
  assert.equal(getTeacherToolById("results")?.published, true);
  assert.equal(getTeacherToolById("curso-inventado"), null);
});

test("las seis rutas registradas siguen siendo ES/EN exactas y reversibles", () => {
  allRoutes.forEach(([routeId, es, en]) => {
    assert.equal(getLocalizedPath(routeId, "es"), es);
    assert.equal(getLocalizedPath(routeId, "en"), en);
    assert.equal(getRouteCounterpart(es, "en"), en);
    assert.equal(getRouteCounterpart(en, "es"), es);
  });
});

test("solo las páginas de herramientas publicadas existen en el árbol de páginas", () => {
  const published = ["index", "avisos", "notas"];
  const hidden = ["banco", "simulaciones", "revision"];
  published.forEach((page) => {
    assert.equal(
      fs.existsSync(`${root}/src/pages/fisica-basica-1/herramientas/${page}.astro`),
      true,
      `falta ${page}.astro`
    );
  });
  hidden.forEach((page) => {
    assert.equal(
      fs.existsSync(`${root}/src/pages/fisica-basica-1/herramientas/${page}.astro`),
      false,
      `${page}.astro no debería existir`
    );
  });

  const publishedEn = ["index", "notices", "results"];
  const hiddenEn = ["question-bank", "simulation-lab", "review"];
  publishedEn.forEach((page) => {
    const source = fs.readFileSync(`${root}/src/pages/en/basic-physics-1/tools/${page}.astro`, "utf8");
    assert.match(source, /locale="en"/);
    assert.doesNotMatch(source, /<BaseLayout/);
  });
  hiddenEn.forEach((page) => {
    assert.equal(
      fs.existsSync(`${root}/src/pages/en/basic-physics-1/tools/${page}.astro`),
      false,
      `${page}.astro no debería existir`
    );
  });
});

test("la implementación de las herramientas ocultas permanece intacta", () => {
  const implementationFiles = [
    "src/components/teacher/QuestionBankPage.astro",
    "src/components/teacher/SimulationLabPage.astro",
    "src/components/teacher/ReviewCenterPage.astro",
    "src/components/bank/QuestionBankEditor.astro",
    "src/components/simulations/SimulationLab.astro",
    "src/components/review/ReviewCenter.astro",
  ];
  implementationFiles.forEach((file) => {
    assert.equal(fs.existsSync(`${root}/${file}`), true, `falta ${file}`);
  });
});

test("la navegación docente deriva del registro y muestra solo herramientas publicadas", () => {
  const source = fs.readFileSync(`${root}/src/components/teacher/TeacherToolsNav.astro`, "utf8");
  assert.match(source, /getPublishedTeacherTools/);
  assert.match(source, /getLocalizedPath\(tool\.routeId, locale\)/);
  assert.doesNotMatch(source, /href="\/fisica-basica-1/);
  assert.doesNotMatch(source, /ROUTE_IDS\.COURSE_TOOL_QUESTION_BANK/);
  assert.doesNotMatch(source, /ROUTE_IDS\.COURSE_TOOL_SIMULATION_LAB/);
  assert.doesNotMatch(source, /ROUTE_IDS\.COURSE_TOOL_REVIEW/);
});

test("el hub deriva su lista del registro y no del array local anterior", () => {
  const source = fs.readFileSync(`${root}/src/components/teacher/TeacherToolsHubPage.astro`, "utf8");
  assert.match(source, /getPublishedTeacherTools/);
  assert.doesNotMatch(source, /\["bank", ROUTE_IDS/);
});

test("la superficie legacy /herramientas fue retirada sin crear un equivalente /en/tools", () => {
  assert.equal(fs.existsSync(`${root}/src/pages/herramientas.astro`), false);
  assert.equal(fs.existsSync(`${root}/src/pages/en/tools.astro`), false);
  assert.equal(fs.existsSync(`${root}/src/pages/en/tools`), false);
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
