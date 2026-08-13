import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { UNIT_1_CONTENT } from "../src/data/physics/unit-1/content.js";
import { UNIT_1_COMMON_ERRORS } from "../src/data/physics/unit-1/common-errors.js";
import { UNIT_1_FORMULAS } from "../src/data/physics/unit-1/formulas.js";
import { UNIT_1_VISUALIZATIONS } from "../src/data/physics/unit-1/visualizations.js";
import {
  getLocalizedUnit1ErrorsByTopics,
  getLocalizedUnit1Formula,
  getLocalizedUnit1Visualization,
  localizeUnit1Content,
} from "../src/data/physics/unit-1/localize.js";

const withoutMathAriaLabel = (mathml) => mathml.replace(/ aria-label="[^"]*"/, "");
const root = fileURLToPath(new URL("../", import.meta.url));
const replaceStrings = (value) => {
  if (typeof value === "string") return "<text>";
  if (Array.isArray(value)) return value.map(replaceStrings);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceStrings(child)]));
  }
  return value;
};

test("Unit 1 content localizes every topic without changing academic references", () => {
  const en = localizeUnit1Content("en");
  assert.deepEqual(Object.keys(en), Object.keys(UNIT_1_CONTENT));

  for (const [slug, source] of Object.entries(UNIT_1_CONTENT)) {
    const localized = en[slug];
    assert.notEqual(localized.introduction, source.introduction, slug);
    assert.deepEqual(localized.errorTopics, source.errorTopics, slug);
    assert.deepEqual(
      localized.sections.map(({ id, formulas, visualizations }) => ({ id, formulas, visualizations })),
      source.sections.map(({ id, formulas, visualizations }) => ({ id, formulas, visualizations })),
      slug,
    );
    assert.ok(localized.sections.every((section) =>
      section.title &&
      ["essential", "understand", "deepen", "explore"].every((layer) =>
        Array.isArray(section[layer]) && section[layer].length > 0 && section[layer].every(Boolean)
      )
    ));
    assert.deepEqual(
      localized.sections.map((section) =>
        ["essential", "understand", "deepen", "explore"].map((layer) => section[layer].length)
      ),
      source.sections.map((section) =>
        ["essential", "understand", "deepen", "explore"].map((layer) => section[layer].length)
      ),
      slug
    );
  }
});

test("las 24 secciones desarrollan un concepto en cuatro capas completas", () => {
  const sections = Object.values(UNIT_1_CONTENT).flatMap((topic) => topic.sections);
  assert.equal(sections.length, 24);
  assert.ok(sections.every((section) =>
    ["essential", "understand", "deepen", "explore"].every((layer) =>
      Array.isArray(section[layer]) && section[layer].length > 0
    )
  ));
});

test("solo Esencial permanece visible inicialmente y las demás capas usan details", () => {
  const component = fs.readFileSync(
    `${root}/src/components/academic/AcademicSection.astro`,
    "utf8"
  );
  assert.match(component, /academic-layer--essential/);
  assert.match(component, /<details class="academic-details academic-details--understand">/);
  assert.match(component, /<details class="academic-details academic-details--deepen">/);
  assert.match(component, /<details class="academic-details academic-details--explore">/);
  assert.doesNotMatch(component, /<details[^>]*\sopen/);
});

test("Unit 1 formulas share IDs, symbols, equations, units, and relations", () => {
  for (const [id, source] of Object.entries(UNIT_1_FORMULAS)) {
    const localized = getLocalizedUnit1Formula(id, "en");
    assert.equal(localized.id, source.id);
    assert.notEqual(localized.label, source.label, id);
    assert.equal(withoutMathAriaLabel(localized.mathml), withoutMathAriaLabel(source.mathml), id);
    assert.deepEqual(localized.variables.map(({ symbol, unit }) => ({ symbol, unit })), source.variables.map(({ symbol, unit }) => ({ symbol, unit })));
    assert.deepEqual(localized.related, source.related);
  }
});

test("Unit 1 misconception feedback preserves stable taxonomy", () => {
  const topics = [...new Set(UNIT_1_COMMON_ERRORS.map(({ topic }) => topic))];
  const localized = getLocalizedUnit1ErrorsByTopics(topics, "en");
  assert.deepEqual(
    localized.map(({ id, topic, subtopic }) => ({ id, topic, subtopic })),
    UNIT_1_COMMON_ERRORS.map(({ id, topic, subtopic }) => ({ id, topic, subtopic })),
  );
  assert.ok(localized.every(({ description, feedback }, index) =>
    description && feedback && description !== UNIT_1_COMMON_ERRORS[index].description));
});

test("Unit 1 visualizations localize text without changing geometry or data", () => {
  for (const [id, source] of Object.entries(UNIT_1_VISUALIZATIONS)) {
    const localized = getLocalizedUnit1Visualization(id, "en");
    assert.equal(localized.id, source.id);
    assert.equal(localized.kind, source.kind);
    assert.notEqual(localized.props.title, source.props.title, id);
    assert.deepEqual(replaceStrings(localized), replaceStrings(source), id);
  }
});
