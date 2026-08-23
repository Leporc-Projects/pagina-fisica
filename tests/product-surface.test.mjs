// Cubre la superficie de producto del Bloque B: Participa global en la
// navegación principal, contrapartes de ruta, el CTA genérico de cierre de
// tema (simulación/práctica/participación) y la presentación pública de
// Coordenadas polares. No repite la cobertura ya existente de participación,
// registro docente o figuras académicas.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { getNavigation, NAV } from "../src/data/site.js";
import { getAcademicUnitAdapter, getLocalizedAcademicUnit } from "../src/data/physics/index.js";
import { getSimulationsForCourseTopic, SIMULATIONS } from "../src/data/simulations.js";
import {
  ROUTE_IDS,
  getLocalizedPath,
  getRouteAlternates,
  getRouteCounterpart,
  getXDefaultPath,
} from "../src/i18n/routes.js";
import { resolveParticipationPrecontext } from "../src/utils/participation-precontext.js";

const root = fileURLToPath(new URL("../", import.meta.url));

test("Participa es la quinta sección de la navegación global, en ES y EN", () => {
  const es = getNavigation("es");
  const en = getNavigation("en");
  assert.equal(es.length, 5);
  assert.equal(en.length, 5);
  assert.equal(es.at(-1).href, "/participa");
  assert.equal(en.at(-1).href, "/en/participate");
  assert.equal(NAV.at(-1).label, "Participa");
});

test("la ruta global y la ruta de curso de Participa son independientes y reversibles", () => {
  assert.equal(getLocalizedPath(ROUTE_IDS.PARTICIPATE, "es"), "/participa");
  assert.equal(getLocalizedPath(ROUTE_IDS.PARTICIPATE, "en"), "/en/participate");
  assert.equal(getLocalizedPath(ROUTE_IDS.COURSE_PARTICIPATE, "es"), "/fisica-basica-1/participa");
  assert.equal(getLocalizedPath(ROUTE_IDS.COURSE_PARTICIPATE, "en"), "/en/basic-physics-1/participate");
  assert.equal(getRouteCounterpart("/participa", "en"), "/en/participate");
  assert.equal(getRouteCounterpart("/fisica-basica-1/participa", "en"), "/en/basic-physics-1/participate");
  // Las dos rutas no se confunden entre sí.
  assert.notEqual(
    getRouteCounterpart("/participa", "en"),
    getRouteCounterpart("/fisica-basica-1/participa", "en")
  );
});

test("cada ruta de Participa produce canonical, alternates y x-default propios", () => {
  const globalAlternates = getRouteAlternates(ROUTE_IDS.PARTICIPATE);
  const courseAlternates = getRouteAlternates(ROUTE_IDS.COURSE_PARTICIPATE);
  assert.deepEqual(
    globalAlternates.map((entry) => entry.path),
    ["/participa", "/en/participate"]
  );
  assert.deepEqual(
    courseAlternates.map((entry) => entry.path),
    ["/fisica-basica-1/participa", "/en/basic-physics-1/participate"]
  );
  assert.equal(getXDefaultPath(ROUTE_IDS.PARTICIPATE), "/participa");
  assert.equal(getXDefaultPath(ROUTE_IDS.COURSE_PARTICIPATE), "/fisica-basica-1/participa");
});

test("las dos páginas de Participa existen como archivos independientes", () => {
  assert.equal(fs.existsSync(`${root}/src/pages/participa.astro`), true);
  assert.equal(fs.existsSync(`${root}/src/pages/en/participate.astro`), true);
  assert.equal(fs.existsSync(`${root}/src/pages/fisica-basica-1/participa.astro`), true);
  assert.equal(fs.existsSync(`${root}/src/pages/en/basic-physics-1/participate.astro`), true);
});

test("la precontextualización se resuelve en el navegador, no en el prerender estático", () => {
  // El sitio no tiene servidor: Astro.url.searchParams en el frontmatter solo
  // vería la petición real bajo un backend que este proyecto no tiene, así
  // que leerlo ahí produciría siempre el mismo HTML sin importar el query
  // string real del visitante.
  const globalPage = fs.readFileSync(`${root}/src/pages/participa.astro`, "utf8");
  const coursePage = fs.readFileSync(`${root}/src/pages/fisica-basica-1/participa.astro`, "utf8");
  assert.doesNotMatch(globalPage, /resolveParticipationPrecontext/);
  assert.doesNotMatch(coursePage, /resolveParticipationPrecontext/);
  assert.doesNotMatch(globalPage, /Astro\.url\.searchParams\.get/);
  assert.doesNotMatch(coursePage, /Astro\.url\.searchParams\.get/);

  const contextComponent = fs.readFileSync(
    `${root}/src/components/participation/ParticipationContext.astro`,
    "utf8"
  );
  assert.match(contextComponent, /import \{ resolveParticipationPrecontext \} from "\.\.\/\.\.\/utils\/participation-precontext\.js"/);
  assert.match(contextComponent, /window\.location\.search/);
  assert.match(contextComponent, /data-force-course-id/);
});

test("la precontextualización valida contra el registro y nunca confía ciegamente en el query", () => {
  const valid = new URLSearchParams("scope=course&courseId=fisica-basica-1&unit=unidad-2&topic=masa-peso");
  assert.deepEqual(resolveParticipationPrecontext(valid, "es"), {
    scope: "course",
    courseId: "fisica-basica-1",
    unitNumber: 2,
    topicSlug: "masa-peso",
  });

  const invalidCourse = new URLSearchParams("scope=course&courseId=curso-inventado&unit=unidad-2");
  assert.deepEqual(resolveParticipationPrecontext(invalidCourse, "es"), {
    scope: "global",
    courseId: null,
    unitNumber: null,
    topicSlug: null,
  });

  const invalidUnit = new URLSearchParams("scope=course&courseId=fisica-basica-1&unit=unidad-inventada");
  assert.deepEqual(resolveParticipationPrecontext(invalidUnit, "es"), {
    scope: "course",
    courseId: "fisica-basica-1",
    unitNumber: null,
    topicSlug: null,
  });

  const invalidTopic = new URLSearchParams("scope=course&courseId=fisica-basica-1&unit=unidad-2&topic=inventado");
  assert.deepEqual(resolveParticipationPrecontext(invalidTopic, "es"), {
    scope: "course",
    courseId: "fisica-basica-1",
    unitNumber: 2,
    topicSlug: null,
  });

  const noParams = new URLSearchParams("");
  assert.deepEqual(resolveParticipationPrecontext(noParams, "es"), {
    scope: "global",
    courseId: null,
    unitNumber: null,
    topicSlug: null,
  });

  // El curso fijo de la ruta de curso ignora el parámetro scope del query.
  const forced = resolveParticipationPrecontext(
    new URLSearchParams("unit=unidad-1&topic=vectores"),
    "es",
    { forceCourseId: "fisica-basica-1" }
  );
  assert.equal(forced.scope, "course");
  assert.equal(forced.unitNumber, 1);
  assert.equal(forced.topicSlug, "vectores");
});

test("TopicCta es genérico: UnitTopicPage lo usa para simulación, práctica y participación en ese orden", () => {
  const source = fs.readFileSync(`${root}/src/components/academic/UnitTopicPage.astro`, "utf8");
  const simulationIndex = source.indexOf('variant="simulation"');
  const practiceIndex = source.indexOf('eyebrow={t(locale, "unitTopic.practice")}');
  const participateIndex = source.indexOf("participateHref");
  const lastParticipateUse = source.lastIndexOf("href={participateHref}");

  assert.ok(simulationIndex !== -1 && practiceIndex !== -1 && participateIndex !== -1);
  assert.ok(simulationIndex < practiceIndex, "la simulación debe preceder a la práctica");
  assert.ok(practiceIndex < lastParticipateUse, "la práctica debe preceder a Participa");
  assert.match(source, /import TopicCta from ".\/TopicCta.astro"/);
  // El componente no decide rutas: solo tres props de contenido y href/linkLabel.
  const ctaSource = fs.readFileSync(`${root}/src/components/academic/TopicCta.astro`, "utf8");
  assert.match(ctaSource, /eyebrow/);
  assert.match(ctaSource, /linkLabel/);
  assert.doesNotMatch(ctaSource, /getLocalizedPath/);
});

test("el CTA de Participa enlaza a la ruta global, no a la de curso", () => {
  const source = fs.readFileSync(`${root}/src/components/academic/UnitTopicPage.astro`, "utf8");
  assert.match(source, /ROUTE_IDS\.PARTICIPATE/);
  assert.doesNotMatch(source, /ROUTE_IDS\.COURSE_PARTICIPATE/);
});

test("cada topic con simulación relacionada sigue resolviendo su experiencia real", () => {
  const withSimulation = SIMULATIONS.find((simulation) =>
    simulation.contexts?.some((context) => context.unit === 1)
  );
  assert.ok(withSimulation, "debe existir al menos una simulación contextual en Unidad 1");
  const context = withSimulation.contexts.find((entry) => entry.unit === 1);
  const found = getSimulationsForCourseTopic(context.courseId, 1, context.topics[0], "es");
  assert.ok(found.some((simulation) => simulation.id === withSimulation.id));
});

test("Coordenadas polares se presenta como un tema normal en ES y EN", () => {
  const es = getLocalizedAcademicUnit(1, "es").topics.find((topic) => topic.slug === "coordenadas-polares");
  const en = getLocalizedAcademicUnit(1, "en").topics.find((topic) => topic.slug === "coordenadas-polares");

  assert.equal(es.title, "Coordenadas polares");
  assert.equal(en.title, "Polar coordinates");
  assert.doesNotMatch(es.title, /ampliaci[oó]n/i);
  assert.doesNotMatch(en.title, /extension/i);
  // La metadata editorial interna se conserva; solo deja de proyectarse.
  assert.equal(es.priority, "extension");

  // La introducción del tema (el texto que sí se lee en la página pública) no
  // debe delatar en prosa lo que ya no se marca con una insignia.
  const adapter = getAcademicUnitAdapter(1);
  const introEs = adapter.getContent("es")["coordenadas-polares"].introduction;
  const introEn = adapter.getContent("en")["coordenadas-polares"].introduction;
  assert.doesNotMatch(introEs, /ampliaci[oó]n/i);
  assert.doesNotMatch(introEn, /extension/i);

  const route = getLocalizedPath(ROUTE_IDS.COURSE_UNIT_1_TOPIC_POLAR, "es");
  const routeEn = getLocalizedPath(ROUTE_IDS.COURSE_UNIT_1_TOPIC_POLAR, "en");
  assert.equal(route, "/fisica-basica-1/unidades/unidad-1/coordenadas-polares");
  assert.equal(routeEn, "/en/basic-physics-1/units/unit-1/polar-coordinates");
  assert.equal(fs.existsSync(`${root}/src/pages${route}.astro`), true);
});

test("ninguna superficie pública del estudiante proyecta la prioridad editorial", () => {
  const files = [
    "src/components/academic/AcademicUnitNav.astro",
    "src/components/academic/UnitLearningMap.astro",
    "src/components/academic/UnitTopicPage.astro",
  ];
  files.forEach((file) => {
    const source = fs.readFileSync(`${root}/${file}`, "utf8");
    assert.doesNotMatch(source, /priority === "extension"/, `${file} no debe ramificar por prioridad`);
  });
});

test("regresión: las cuatro simulaciones y las siete unidades siguen registradas", () => {
  assert.equal(SIMULATIONS.length, 4);
  assert.ok(getLocalizedAcademicUnit(1, "es"));
  assert.ok(getLocalizedAcademicUnit(2, "es"));
  assert.ok(getLocalizedAcademicUnit(3, "es"));
  assert.ok(getLocalizedAcademicUnit(4, "es"));
  assert.ok(getLocalizedAcademicUnit(5, "es"));
  assert.ok(getLocalizedAcademicUnit(6, "es"));
  assert.ok(getLocalizedAcademicUnit(7, "es"));
});
