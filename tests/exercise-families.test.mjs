import assert from "node:assert/strict";
import test from "node:test";

import { UNIT_1_EXERCISE_FAMILIES } from "../src/data/physics/unit-1/families.js";
import {
  familyPublicDescriptor,
  generateFamilyInstance,
  validateFamilyDefinition,
} from "../src/utils/exercise-families.js";

const seededRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
};

const allFinite = (value) => {
  if (typeof value === "number") return Number.isFinite(value);
  if (!value || typeof value !== "object") return true;
  return Object.values(value).every(allFinite);
};

const answerNumbers = (answer) => answer.kind === "number"
  ? [answer.value]
  : answer.kind === "values"
    ? answer.values.map((entry) => entry.value)
    : [];

test("declara quince familias separadas de los ítems fijos", () => {
  assert.equal(UNIT_1_EXERCISE_FAMILIES.length, 15);
  assert.equal(new Set(UNIT_1_EXERCISE_FAMILIES.map((family) => family.id)).size, 15);
  UNIT_1_EXERCISE_FAMILIES.forEach((family) => {
    assert.equal(validateFamilyDefinition(family).valid, true, family.id);
    assert.equal(family.itemKind, "parameterizedFamily");
    assert.equal(family.purpose, "learning");
    assert.equal(family.exposure, "public");
    assert.equal(familyPublicDescriptor(family).build, undefined);
  });
});

test("genera 300 instancias deterministas por familia sin NaN ni Infinity", () => {
  UNIT_1_EXERCISE_FAMILIES.forEach((family, familyIndex) => {
    const random = seededRandom(1009 + familyIndex);
    for (let index = 0; index < 300; index += 1) {
      const instance = generateFamilyInstance(family, { random });
      assert.equal(allFinite(instance.parameters), true, `${family.id}: parámetros`);
      assert.equal(allFinite(instance.answer), true, `${family.id}: respuesta`);
      assert.equal(instance.familyId, family.id);
      assert.match(instance.instanceId, new RegExp(`^${family.id}--[0-9a-f]{8}$`));
      assert.deepEqual(family.build(instance.parameters), {
        title: instance.title,
        prompt: instance.prompt,
        answer: instance.answer,
        tolerance: instance.tolerance,
        expectedUnit: instance.expectedUnit,
        interaction: instance.interaction,
        hints: instance.hints,
        solution: instance.solution,
        commonErrors: instance.commonErrors,
      });
      if (instance.answer.kind !== "text") {
        assert.equal(answerNumbers(instance.answer).every(Number.isFinite), true, family.id);
      }
    }
  });
});

test("las ecuaciones independientes reproducen las respuestas numéricas", () => {
  const random = seededRandom(8181);
  const instances = Object.fromEntries(UNIT_1_EXERCISE_FAMILIES.map((family) => [
    family.id,
    generateFamilyInstance(family, { random }),
  ]));
  const close = (actual, expected, tolerance = 0.011) =>
    assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);

  let item = instances["family-u1-vector-components-direction"];
  close(item.answer.values[0].value, item.parameters.magnitude * Math.cos(item.parameters.angleDeg * Math.PI / 180));
  close(item.answer.values[1].value, item.parameters.magnitude * Math.sin(item.parameters.angleDeg * Math.PI / 180));
  item = instances["family-u1-vector-magnitude-components"];
  close(item.answer.value, Math.hypot(item.parameters.x, item.parameters.y));
  item = instances["family-u1-vector-sum"];
  assert.equal(item.answer.values[0].value, item.parameters.ax + item.parameters.bx);
  assert.equal(item.answer.values[1].value, item.parameters.ay + item.parameters.by);
  item = instances["family-u1-vector-perpendicular-lambda"];
  close(item.parameters.a1 * item.parameters.b1 + item.answer.value * item.parameters.b2 + item.parameters.a3 * item.parameters.b3, 0, 1e-9);
  item = instances["family-u1-distance-displacement"];
  assert.equal(item.answer.values[0].value, Math.abs(item.parameters.middle - item.parameters.start) + Math.abs(item.parameters.final - item.parameters.middle));
  assert.equal(item.answer.values[1].value, item.parameters.final - item.parameters.start);
  item = instances["family-u1-average-velocity"];
  close(item.answer.value, (item.parameters.xf - item.parameters.xi) / (item.parameters.tf - item.parameters.ti), 1e-9);
  item = instances["family-u1-constant-velocity"];
  close(item.answer.value, item.parameters.v0 + item.parameters.a * item.parameters.t, 1e-9);
  item = instances["family-u1-constant-displacement"];
  close(item.answer.value, item.parameters.v0 * item.parameters.t + 0.5 * item.parameters.a * item.parameters.t ** 2, 1e-9);
  item = instances["family-u1-turning-point"];
  close(item.answer.values[0].value, item.parameters.v0 / item.parameters.deceleration);
  close(item.answer.values[1].value, item.parameters.v0 ** 2 / (2 * item.parameters.deceleration));
  item = instances["family-u1-no-time"];
  close(item.answer.value ** 2, item.parameters.v0 ** 2 + 2 * item.parameters.a * item.parameters.dx, 0.25);
  item = instances["family-u1-horizontal-projectile"];
  close(item.answer.values[0].value, Math.sqrt(2 * item.parameters.height / item.parameters.g));
  close(item.answer.values[1].value, item.parameters.vx * Math.sqrt(2 * item.parameters.height / item.parameters.g));
  item = instances["family-u1-circular-acceleration"];
  close(item.answer.value, item.parameters.speed ** 2 / item.parameters.radius);
  item = instances["family-u1-relative-velocity-1d"];
  close(item.answer.value, item.parameters.relative + item.parameters.frame, 1e-9);
});

test("evita repetir una combinación reciente cuando la familia ofrece otra", () => {
  const family = UNIT_1_EXERCISE_FAMILIES.find((item) => item.id === "family-u1-vector-magnitude-components");
  const first = generateFamilyInstance(family, { random: seededRandom(2) });
  const recent = new Set([`${family.id}:${first.parameterKey}`]);
  const second = generateFamilyInstance(family, { random: seededRandom(2), recentParameterKeys: recent });
  assert.notEqual(second.parameterKey, first.parameterKey);
});
