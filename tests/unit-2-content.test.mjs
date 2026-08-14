import assert from "node:assert/strict";
import test from "node:test";
import { UNIT_2 } from "../src/data/physics/unit-2/unit.js";
import { UNIT_2_CONTENT } from "../src/data/physics/unit-2/content.js";
import { UNIT_2_FORMULAS } from "../src/data/physics/unit-2/formulas.js";
import { UNIT_2_VISUALIZATIONS } from "../src/data/physics/unit-2/visualizations.js";
import { UNIT_2_COMMON_ERRORS } from "../src/data/physics/unit-2/common-errors.js";
import {
  getLocalizedUnit2ErrorsByTopics,
  getLocalizedUnit2Formula,
  getLocalizedUnit2Visualization,
  getUnit2TopicRouteId,
  localizeUnit2,
  localizeUnit2Content,
} from "../src/data/physics/unit-2/localize.js";

const replaceStrings = (value) => {
  if (typeof value === "string") return "<text>";
  if (Array.isArray(value)) return value.map(replaceStrings);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceStrings(child)]));
  return value;
};
const withoutAria = (mathml) => mathml.replace(/ aria-label="[^"]*"/, "");

test("Unidad 2 conserva siete topics, orden y 24 secciones del blueprint", () => {
  assert.equal(UNIT_2.topics.length, 7);
  assert.deepEqual(UNIT_2.topics.map(({ order }) => order), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(new Set(UNIT_2.topics.map(({ slug }) => slug)).size, 7);
  assert.deepEqual(Object.keys(UNIT_2_CONTENT), UNIT_2.topics.map(({ slug }) => slug));
  assert.deepEqual(Object.values(UNIT_2_CONTENT).map(({ sections }) => sections.length), [4, 3, 4, 3, 3, 4, 3]);
  assert.equal(Object.values(UNIT_2_CONTENT).flatMap(({ sections }) => sections).length, 24);
});

test("cada sección desarrolla el mismo concepto en cuatro capas no vacías", () => {
  const sections = Object.values(UNIT_2_CONTENT).flatMap(({ sections }) => sections);
  for (const section of sections) {
    for (const layer of ["essential", "understand", "deepen", "explore"]) {
      assert.ok(Array.isArray(section[layer]) && section[layer].length > 0, `${section.id}.${layer}`);
      assert.ok(section[layer].every((paragraph) => typeof paragraph === "string" && paragraph.trim()), `${section.id}.${layer}`);
    }
  }
  assert.equal(sections.reduce((sum, section) => sum + (section.checks?.length ?? 0), 0), 16);
});

test("referencias editoriales, errores y rutas de Unidad 2 son resolubles", () => {
  const sections = Object.values(UNIT_2_CONTENT).flatMap(({ sections }) => sections);
  const formulaRefs = sections.flatMap(({ formulas = [] }) => formulas);
  const visualizationRefs = sections.flatMap(({ visualizations = [] }) => visualizations);
  assert.ok(formulaRefs.every((id) => UNIT_2_FORMULAS[id]));
  assert.ok(visualizationRefs.every((id) => UNIT_2_VISUALIZATIONS[id]));
  assert.equal(Object.keys(UNIT_2_FORMULAS).length, 10);
  assert.equal(Object.keys(UNIT_2_VISUALIZATIONS).length, 12);
  assert.equal(UNIT_2_COMMON_ERRORS.length, 16);
  assert.equal(new Set(UNIT_2_COMMON_ERRORS.map(({ id }) => id)).size, 16);
  assert.ok(UNIT_2_COMMON_ERRORS.every((error) => UNIT_2_CONTENT[error.topic]?.sections.some(({ id }) => id === error.subtopic)));
  assert.ok(UNIT_2.topics.every(({ slug, routeId }) => getUnit2TopicRouteId(slug) === routeId));
});

test("contenido ES/EN mantiene estructura, checks y referencias invariantes", () => {
  const enUnit = localizeUnit2("en");
  const en = localizeUnit2Content("en");
  assert.equal(enUnit.title, "Newton's laws");
  for (const [slug, source] of Object.entries(UNIT_2_CONTENT)) {
    const localized = en[slug];
    assert.notEqual(localized.introduction, source.introduction, slug);
    assert.deepEqual(localized.errorTopics, source.errorTopics);
    assert.deepEqual(
      localized.sections.map(({ id, formulas, visualizations, checks }) => ({ id, formulas, visualizations, checks: checks?.length ?? 0 })),
      source.sections.map(({ id, formulas, visualizations, checks }) => ({ id, formulas, visualizations, checks: checks?.length ?? 0 })),
    );
    localized.sections.forEach((section, index) => {
      assert.notEqual(section.title, source.sections[index].title, `${slug}.${section.id}`);
      for (const layer of ["essential", "understand", "deepen", "explore"]) assert.equal(section[layer].length, source.sections[index][layer].length);
    });
  }
});

test("fórmulas preservan matemática e implementan los invariantes físicos", () => {
  for (const [id, source] of Object.entries(UNIT_2_FORMULAS)) {
    const en = getLocalizedUnit2Formula(id, "en");
    assert.equal(withoutAria(en.mathml), withoutAria(source.mathml), id);
    assert.deepEqual(en.variables.map(({ symbol, unit }) => ({ symbol, unit })), source.variables.map(({ symbol, unit }) => ({ symbol, unit })));
    assert.deepEqual(en.related, source.related);
    assert.match(source.mathml, /<math[\s\S]*<semantics>[\s\S]*<annotation encoding="application\/x-tex">/);
  }
  assert.match(UNIT_2_FORMULAS["newton-unit"].mathml, /<mfrac>.*<msup>/s);
  assert.match(UNIT_2_FORMULAS["newton-second-law"].mathml, /ext[\s\S]*<mi>m<\/mi>[\s\S]*<mi>a<\/mi>/);
  assert.match(UNIT_2_FORMULAS["weight-near-surface"].mathml, /<mi>W<\/mi>[\s\S]*<mi>m<\/mi>[\s\S]*<mi>g<\/mi>/);
  assert.match(UNIT_2_FORMULAS["third-law-pair"].mathml, /A→B[\s\S]*−[\s\S]*B→A/);
  assert.match(UNIT_2_FORMULAS["galilean-acceleration"].mathml, /<mi>a<\/mi>[\s\S]*′[\s\S]*=[\s\S]*<mi>a<\/mi>/);
});

test("visualizaciones y common errors localizan presentación sin cambiar geometría ni taxonomía", () => {
  for (const [id, source] of Object.entries(UNIT_2_VISUALIZATIONS)) {
    const en = getLocalizedUnit2Visualization(id, "en");
    assert.notEqual(en.props.title, source.props.title, id);
    assert.deepEqual(replaceStrings(en), replaceStrings(source), id);
  }
  const topics = [...new Set(UNIT_2_COMMON_ERRORS.map(({ topic }) => topic))];
  const localizedErrors = getLocalizedUnit2ErrorsByTopics(topics, "en");
  assert.deepEqual(localizedErrors.map(({ id, topic, subtopic }) => ({ id, topic, subtopic })), UNIT_2_COMMON_ERRORS.map(({ id, topic, subtopic }) => ({ id, topic, subtopic })));
  assert.ok(localizedErrors.every((error, index) => error.description !== UNIT_2_COMMON_ERRORS[index].description && error.feedback));
});
