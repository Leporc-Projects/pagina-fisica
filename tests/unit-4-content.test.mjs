import assert from "node:assert/strict";
import test from "node:test";
import { UNIT_4 } from "../src/data/physics/unit-4/unit.js";
import { UNIT_4_CONTENT } from "../src/data/physics/unit-4/content.js";
import { UNIT_4_FORMULAS } from "../src/data/physics/unit-4/formulas.js";
import { UNIT_4_VISUALIZATIONS } from "../src/data/physics/unit-4/visualizations.js";
import { UNIT_4_COMMON_ERRORS } from "../src/data/physics/unit-4/common-errors.js";
import { UNIT_4_WORKED_EXAMPLES } from "../src/data/physics/unit-4/examples.js";
import {
  getLocalizedUnit4ErrorsByTopics,
  getLocalizedUnit4Formula,
  getLocalizedUnit4Visualization,
  getLocalizedUnit4WorkedExample,
  getUnit4TopicRouteId,
  localizeUnit4,
  localizeUnit4Content,
} from "../src/data/physics/unit-4/localize.js";
import { ACADEMIC_UNITS, getAcademicUnitAdapter } from "../src/data/physics/index.js";
import { getLocalizedPath } from "../src/i18n/routes.js";
import { presentUnit4RichText } from "../src/data/physics/unit-4/math-content.js";

const sections = () => Object.values(UNIT_4_CONTENT).flatMap(({ sections: entries }) => entries);
const withoutAria = (mathml) => mathml.replace(/ aria-label="[^"]*"/, "");
const replaceStrings = (value) => typeof value === "string"
  ? "<text>"
  : Array.isArray(value)
    ? value.map(replaceStrings)
    : value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceStrings(child)]))
      : value;
const finite = (value, seen = new WeakSet()) => {
  if (typeof value === "number") return Number.isFinite(value);
  if (!value || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  return Object.values(value).every((child) => finite(child, seen));
};

test("Unidad 4 está registrada explícitamente con ocho temas y rutas bilingües", () => {
  assert.equal(UNIT_4.number, 4);
  assert.equal(UNIT_4.bonusRoute, null);
  assert.deepEqual(ACADEMIC_UNITS.map(({ number }) => number), [1, 2, 3, 4]);
  assert.deepEqual(UNIT_4.topics.map(({ order }) => order), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(new Set(UNIT_4.topics.map(({ slug }) => slug)).size, 8);
  assert.equal(new Set(UNIT_4.topics.map(({ routeId }) => routeId)).size, 8);
  assert.deepEqual(Object.keys(UNIT_4_CONTENT), UNIT_4.topics.map(({ slug }) => slug));
  assert.ok(UNIT_4.topics.every(({ slug, routeId }) => getUnit4TopicRouteId(slug) === routeId));
  const adapter = getAcademicUnitAdapter(4);
  assert.equal(typeof adapter?.getExample, "function");
  for (const locale of ["es", "en"]) {
    const unit = localizeUnit4(locale);
    assert.equal(getLocalizedPath(unit.routeId, locale), unit.route);
    assert.equal(getLocalizedPath(unit.practiceRouteId, locale), unit.practiceRoute);
    unit.topics.forEach((topic) => assert.equal(getLocalizedPath(topic.routeId, locale), topic.route));
  }
});

test("el contenido contiene 32 secciones, cuatro capas por sección y 16 checks", () => {
  assert.deepEqual(Object.values(UNIT_4_CONTENT).map(({ sections: entries }) => entries.length), Array(8).fill(4));
  assert.equal(sections().length, 32);
  for (const section of sections()) {
    for (const layer of ["essential", "understand", "deepen", "explore"]) {
      assert.ok(Array.isArray(section[layer]) && section[layer].length > 0, `${section.id}.${layer}`);
      assert.ok(section[layer].every((text) => typeof text === "string" && text.trim()), `${section.id}.${layer}`);
    }
  }
  assert.equal(sections().reduce((sum, section) => sum + (section.checks?.length ?? 0), 0), 16);
});

test("12 fórmulas, 12 visualizaciones y 8 ejemplos conservan referencias resolubles", () => {
  assert.equal(Object.keys(UNIT_4_FORMULAS).length, 12);
  assert.equal(Object.keys(UNIT_4_VISUALIZATIONS).length, 12);
  assert.equal(Object.keys(UNIT_4_WORKED_EXAMPLES).length, 8);
  for (const section of sections()) {
    for (const id of section.formulas ?? []) assert.ok(UNIT_4_FORMULAS[id], `${section.id}:${id}`);
    for (const id of section.visualizations ?? []) assert.ok(UNIT_4_VISUALIZATIONS[id], `${section.id}:${id}`);
    for (const id of section.examples ?? []) assert.ok(UNIT_4_WORKED_EXAMPLES[id], `${section.id}:${id}`);
  }
  for (const [id, source] of Object.entries(UNIT_4_FORMULAS)) {
    const en = getLocalizedUnit4Formula(id, "en");
    assert.match(source.mathml, /<math[\s\S]*<semantics>/, id);
    assert.equal(withoutAria(en.mathml), withoutAria(source.mathml), id);
    assert.deepEqual(en.variables.map(({ symbol, unit }) => ({ symbol, unit })), source.variables.map(({ symbol, unit }) => ({ symbol, unit })), id);
  }
  for (const [id, source] of Object.entries(UNIT_4_VISUALIZATIONS)) {
    const en = getLocalizedUnit4Visualization(id, "en");
    assert.ok(source.props.title && source.props.description, id);
    assert.deepEqual(replaceStrings(en), replaceStrings(source), id);
    assert.equal(finite(source), true, id);
  }
  for (const [id, source] of Object.entries(UNIT_4_WORKED_EXAMPLES)) {
    const en = getLocalizedUnit4WorkedExample(id, "en");
    assert.notEqual(en.title, source.title, id);
    assert.equal(en.steps.length, source.steps.length, id);
    assert.equal("interaction" in source || "answer" in source || "feedback" in source, false, id);
    for (const step of source.steps) {
      if (step.formulaId) assert.ok(UNIT_4_FORMULAS[step.formulaId], `${id}:${step.formulaId}`);
      if (step.visualizationId) assert.ok(UNIT_4_VISUALIZATIONS[step.visualizationId], `${id}:${step.visualizationId}`);
    }
  }
});

test("16 errores y todo el contenido inglés conservan estructura sin fallback", () => {
  assert.equal(UNIT_4_COMMON_ERRORS.length, 16);
  assert.equal(new Set(UNIT_4_COMMON_ERRORS.map(({ id }) => id)).size, 16);
  assert.ok(UNIT_4_COMMON_ERRORS.every((error) => UNIT_4_CONTENT[error.topic]?.sections.some(({ id }) => id === error.subtopic)));
  const localizedErrors = getLocalizedUnit4ErrorsByTopics(UNIT_4.topics.map(({ slug }) => slug), "en");
  assert.ok(localizedErrors.every((error, index) => error.description !== UNIT_4_COMMON_ERRORS[index].description && error.feedback));
  const en = localizeUnit4Content("en");
  for (const [slug, source] of Object.entries(UNIT_4_CONTENT)) {
    assert.notEqual(en[slug].introduction, source.introduction, slug);
    assert.deepEqual(
      en[slug].sections.map(({ id, formulas, visualizations, examples, checks }) => ({ id, formulas, visualizations, examples, checks: checks?.length ?? 0 })),
      source.sections.map(({ id, formulas, visualizations, examples, checks }) => ({ id, formulas, visualizations, examples, checks: checks?.length ?? 0 })),
    );
    en[slug].sections.forEach((section, index) => assert.notEqual(section.title, source.sections[index].title, `${slug}.${section.id}`));
  }
});

test("el contenido protege los invariantes físicos de trabajo y energía", () => {
  const corpus = JSON.stringify({ UNIT_4_CONTENT, UNIT_4_FORMULAS, UNIT_4_WORKED_EXAMPLES, UNIT_4_COMMON_ERRORS });
  assert.match(corpus, /W_net=ΔK/);
  assert.match(corpus, /área (algebraica|con signo)/);
  assert.match(corpus, /kilowatt-hora[^.]*energía/);
  assert.match(corpus, /F_x=-dU\/dx/);
  assert.match(corpus, /U≤E/);
  assert.match(corpus, /aproximadamente uniforme/);
  assert.match(corpus, /energía interna/);
  assert.doesNotMatch(corpus, /-GMm\/r/);
  assert.match(corpus, /fricción puede reducir energía mecánica sin destruir energía total/i);
});

test("el MathML inline localiza su nombre accesible sin cambiar la ecuación", () => {
  const es = presentUnit4RichText("Se usa K=E-U.", "es");
  const en = presentUnit4RichText("Use K=E-U.", "en");
  const esMath = es.find(({ type }) => type === "math").mathml;
  const enMath = en.find(({ type }) => type === "math").mathml;
  assert.match(esMath, /aria-label="energía cinética igual a energía mecánica menos energía potencial"/);
  assert.match(enMath, /aria-label="kinetic energy equals mechanical energy minus potential energy"/);
  assert.equal(withoutAria(esMath), withoutAria(enMath));
});
