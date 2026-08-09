import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  absoluteValue,
  magnitude,
  mi,
  mn,
  norm,
  row,
  sub,
  sup,
  vector,
} from "../src/utils/mathml.js";
import { UNIT_1_INLINE_MATH_TOKENS } from "../src/data/physics/unit-1/math-content.js";

test("magnitud crea una pareja de fences simétrica alrededor de contenido compuesto", () => {
  const mathml = magnitude(row(vector("A"), sub(mi("v"), mn("0"))));
  assert.equal((mathml.match(/fence="true"/g) ?? []).length, 2);
  assert.match(mathml, /form="prefix"/);
  assert.match(mathml, /form="postfix"/);
  assert.match(mathml, /stretchy="true"/);
  assert.match(mathml, /symmetric="true"/);
});

test("valor absoluto y norma conservan exponentes y delimitadores propios", () => {
  const absolute = absoluteValue(sup(mi("x"), mn("2")));
  const vectorNorm = norm(vector("u"));
  assert.match(absolute, /<msup>/);
  assert.equal((absolute.match(/>\|<\/mo>/g) ?? []).length, 2);
  assert.equal((vectorNorm.match(/>‖<\/mo>/g) ?? []).length, 2);
});

test("los contenedores MathML conservan el contenido completo", () => {
  const css = fs.readFileSync(
    new URL("../src/styles/global.css", import.meta.url),
    "utf8"
  );
  const block = (selector) => {
    const match = css.match(new RegExp(
      `${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`
    ));
    assert.ok(match, `No se encontró el bloque CSS ${selector}`);
    return match[1];
  };
  const inlineMath = block(".inline-math");
  const formulaBlock = block(".formula-block");
  const solutionSteps = block(".exercise-card__solution ol");
  const topicContent = block(".unit-topic-content");
  const formulaResources = block(".academic-section__resources");

  assert.match(inlineMath, /inline-size:\s*max-content/);
  assert.match(inlineMath, /max-width:\s*calc\(100%/);
  assert.match(inlineMath, /overflow-x:\s*auto/);
  assert.match(inlineMath, /padding-block:\s*(?!0(?:[;\s]|$))/);
  assert.doesNotMatch(inlineMath, /overflow(?:-y)?:\s*(?:hidden|clip)/);
  assert.doesNotMatch(formulaBlock, /overflow:\s*(?:hidden|clip)/);
  assert.match(solutionSteps, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(topicContent, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(formulaResources, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test("las expresiones enlazadas separan el conector textual en MathML", () => {
  const expression = UNIT_1_INLINE_MATH_TOKENS.find(
    ({ literal }) => literal === "A = a i + 2j y B = 3i − j"
  );
  assert.ok(expression);
  assert.match(
    expression.segment.mathml,
    /<mspace width="0\.35em"><\/mspace><mtext>y<\/mtext><mspace width="0\.35em"><\/mspace>/
  );
});
