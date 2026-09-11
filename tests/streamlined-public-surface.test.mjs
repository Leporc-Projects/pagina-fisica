import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { COURSE, COURSE_NAV } from "../src/data/course.js";
import { getActiveCourses } from "../src/data/courses.js";
import { NOTICES, getHomepageNotices, getPublishedNotices } from "../src/data/notices.js";
import { getPublishedSimulations } from "../src/data/simulations.js";
import { LOCALIZED_ROUTES, ROUTE_IDS, getLocalizedPath } from "../src/i18n/routes.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const source = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const removedPages = [
  "src/pages/fisica-basica-1/index.astro",
  "src/pages/en/basic-physics-1/index.astro",
  "src/pages/fisica-basica-1/avisos.astro",
  "src/pages/en/basic-physics-1/notices.astro",
  "src/pages/fisica-basica-1/cronograma.astro",
  "src/pages/en/basic-physics-1/schedule.astro",
  "src/pages/fisica-basica-1/evaluacion.astro",
  "src/pages/en/basic-physics-1/assessment.astro",
  "src/pages/fisica-basica-1/herramientas/index.astro",
  "src/pages/en/basic-physics-1/tools/index.astro",
  "src/pages/fisica-basica-1/herramientas/avisos.astro",
  "src/pages/en/basic-physics-1/tools/notices.astro",
  "src/pages/fisica-basica-1/herramientas/notas.astro",
  "src/pages/en/basic-physics-1/tools/results.astro",
];

const removedRouteIds = [
  "COURSE",
  "COURSE_NOTICES",
  "COURSE_SCHEDULE",
  "COURSE_ASSESSMENT",
  "COURSE_TOOLS",
  "COURSE_TOOL_QUESTION_BANK",
  "COURSE_TOOL_NOTICES",
  "COURSE_TOOL_SIMULATION_LAB",
  "COURSE_TOOL_REVIEW",
  "COURSE_TOOL_RESULTS",
];

test("las catorce páginas administrativas fueron retiradas sin alias", () => {
  assert.equal(removedPages.length, 14);
  removedPages.forEach((page) => assert.equal(exists(page), false, page));
  removedRouteIds.forEach((id) => assert.equal(Object.hasOwn(ROUTE_IDS, id), false, id));
  assert.equal(Object.keys(LOCALIZED_ROUTES).some((id) => /course\.(notices|schedule|assessment|tools?)/.test(id)), false);
});

test("las rutas académicas retenidas conservan sus paths ES/EN", () => {
  const retained = [
    [ROUTE_IDS.COURSE_UNITS, "/fisica-basica-1/unidades", "/en/basic-physics-1/units"],
    [ROUTE_IDS.COURSE_PRACTICE, "/fisica-basica-1/ejercicios", "/en/basic-physics-1/practice"],
    [ROUTE_IDS.COURSE_MINI_QUIZZES, "/fisica-basica-1/mini-quices", "/en/basic-physics-1/mini-quizzes"],
    [ROUTE_IDS.COURSE_MINI_QUIZ_TOOLS_VECTORS, "/fisica-basica-1/mini-quices/herramientas-vectores", "/en/basic-physics-1/mini-quizzes/herramientas-vectores"],
    [ROUTE_IDS.COURSE_VIDEOS, "/fisica-basica-1/videos", "/en/basic-physics-1/videos"],
    [ROUTE_IDS.COURSE_RESOURCES, "/fisica-basica-1/recursos", "/en/basic-physics-1/resources"],
    [ROUTE_IDS.COURSE_PARTICIPATE, "/fisica-basica-1/participa", "/en/basic-physics-1/participate"],
    [ROUTE_IDS.PULLEY_SYSTEMS, "/simulaciones/poleas", "/en/simulations/pulleys"],
    [ROUTE_IDS.NOTICES, "/avisos", "/en/notices"],
    [ROUTE_IDS.PARTICIPATE, "/participa", "/en/participate"],
  ];
  retained.forEach(([id, es, en]) => {
    assert.equal(getLocalizedPath(id, "es"), es);
    assert.equal(getLocalizedPath(id, "en"), en);
  });
});

test("el curso activo entra por Unidades y CourseNav contiene exactamente seis destinos", () => {
  assert.equal(COURSE.href, "/fisica-basica-1/unidades");
  assert.deepEqual(getActiveCourses().map(({ id, href }) => ({ id, href })), [
    { id: "fisica-basica-1", href: "/fisica-basica-1/unidades" },
  ]);
  assert.deepEqual(COURSE_NAV.map(({ label, href }) => [label, href]), [
    ["Unidades y apuntes", "/fisica-basica-1/unidades"],
    ["Ejercicios y tutorías", "/fisica-basica-1/ejercicios"],
    ["Mini quices", "/fisica-basica-1/mini-quices"],
    ["Videos", "/fisica-basica-1/videos"],
    ["Recursos", "/fisica-basica-1/recursos"],
    ["Participa", "/fisica-basica-1/participa"],
  ]);
  const home = source("src/components/pages/HomePage.astro");
  assert.match(home, /ROUTE_IDS\.COURSE_UNITS/);
  assert.doesNotMatch(home, /ROUTE_IDS\.COURSE\b|COURSE_NOTICES|courseNotices/);
});

test("Avisos reúne todos los publicados y el editor solo produce ámbito global", () => {
  assert.equal(NOTICES.every((notice) => notice.scope.type === "global"), true);
  for (const locale of ["es", "en"]) {
    assert.equal(getPublishedNotices(undefined, locale).length, 2);
    assert.ok(getHomepageNotices(3, undefined, locale).length > 0);
  }
  const noticesPage = source("src/pages/avisos.astro");
  const editor = source("src/components/notices/NoticeEditor.astro");
  const editorClient = source("src/scripts/notice-editor.js");
  assert.match(noticesPage, /getPublishedNotices/);
  assert.ok(noticesPage.indexOf("notice-list--archive") < noticesPage.indexOf("<NoticeEditor"));
  assert.doesNotMatch(editor, /name="scope"|COURSES\.map/);
  assert.match(editorClient, /scope: \{ type: "global" \}/);
  assert.doesNotMatch(editorClient, /fieldValue\(form, "scope"\)|courseId:/);
});

test("no queda superficie docente ni metadato administrativo visible", () => {
  [
    "src/components/bank/QuestionBankEditor.astro",
    "src/scripts/results-organizer.js",
    "src/scripts/review-center.js",
    "src/scripts/simulation-lab.js",
    "src/data/teacher-tools.js",
  ].forEach((target) => assert.equal(exists(target), false, target));
  for (const directory of ["src/components/teacher", "src/components/review", "src/components/results"]) {
    assert.equal(!exists(directory) || fs.readdirSync(path.join(root, directory)).length === 0, true, directory);
  }

  const courseData = source("src/data/course.js");
  assert.doesNotMatch(courseData, /\b(semester|group|credits|modality|interactionHours|independentHours|totalHours):|export const (EVALUATION|SCHEDULE|SCHEDULE_TYPES)/);
  const publicChrome = [
    source("src/components/Header.astro"),
    source("src/components/course/CoursePageHeader.astro"),
    source("src/components/course/CourseNav.astro"),
    source("src/components/pages/HomePage.astro"),
  ].join("\n");
  assert.doesNotMatch(publicChrome, /2026-2|0302270|Presencial|Semester|Semestre|Cronograma|Schedule|Evaluación y notas|Assessment and grades|Teacher tools|Herramientas docentes/);
});

test("las cuatro simulaciones públicas siguen publicadas", () => {
  assert.deepEqual(getPublishedSimulations().map(({ id }) => id), [
    "kinematics-1d",
    "projectile-2d",
    "forces-friction",
    "pulley-systems",
  ]);
});
