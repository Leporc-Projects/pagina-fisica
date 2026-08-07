import assert from "node:assert/strict";
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
