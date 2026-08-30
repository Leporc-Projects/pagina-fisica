import assert from "node:assert/strict";
import test from "node:test";

import { getAcademicUnitAdapter } from "../src/data/physics/index.js";

test("English academic unit labels do not leak Spanish connectors", () => {
  const unit1 = getAcademicUnitAdapter(1);
  const unit2 = getAcademicUnitAdapter(2);
  const unit3 = getAcademicUnitAdapter(3);

  assert.equal(unit1.getFormula("vector-components", "en").variables[0].unit, "unit of A");
  assert.equal(unit1.getFormula("vector-magnitude", "en").variables[0].unit, "same unit as A");
  assert.equal(unit1.getFormula("dot-product", "en").variables[0].unit, "rad or °");
  assert.equal(unit2.getFormula("weight-near-surface", "en").variables[1].unit, "m/s² or N/kg");
  assert.equal(unit3.getFormula("static-friction-range", "en").variables[1].unit, "dimensionless");
  assert.equal(unit3.getFixedExercises("en").find(({ id }) => id === "u3-circular-banked-angle").expectedUnit, "dimensionless and °");

  for (let unit = 1; unit <= 7; unit += 1) {
    const adapter = getAcademicUnitAdapter(unit);
    const formulaIds = new Set(Object.values(adapter.getContent("es")).flatMap(({ sections }) => sections.flatMap(({ formulas = [] }) => formulas)));
    for (const formulaId of formulaIds) {
      for (const variable of adapter.getFormula(formulaId, "en").variables) {
        assert.doesNotMatch(variable.unit, /adimensional|misma unidad|unidad de| rad o |m\/s² o N\/kg/);
      }
    }
    for (const exercise of adapter.getFixedExercises("en")) {
      if (exercise.expectedUnit) {
        assert.doesNotMatch(exercise.expectedUnit, /sin unidad|adimensional|grados|\sy\s|\so\s/, exercise.id);
      }
    }
  }
});

test("fixed numerical exercises expose localized answers, unknown labels, and decimal separators", () => {
  for (let unit = 4; unit <= 7; unit += 1) {
    const adapter = getAcademicUnitAdapter(unit);
    for (const locale of ["es", "en"]) {
      for (const exercise of adapter.getFixedExercises(locale)) {
        if (exercise.interaction.kind === "number") {
          assert.notEqual(exercise.interaction.field.label, exercise.interaction.field.unit, exercise.id);
          assert.notEqual(exercise.interaction.field.label, "", exercise.id);
        }
        if (exercise.answer.display) {
          const wrongSeparator = locale === "es" ? /\d\.\d/ : /\d,\d/;
          assert.doesNotMatch(exercise.answer.display, wrongSeparator, exercise.id);
        }
      }
    }
  }

  const keplerRatio = getAcademicUnitAdapter(7).getFixedExercises("es").find(({ id }) => id === "u7-kepler-period-ratio");
  assert.equal(keplerRatio.expectedUnit, "—");
  assert.equal(keplerRatio.answer.display, "8 —");
});

test("lossless-drop solution uses an unambiguous square-root expression in both locales", () => {
  const adapter = getAcademicUnitAdapter(4);
  for (const locale of ["es", "en"]) {
    const exercise = adapter.getFixedExercises(locale).find(({ id }) => id === "u4-frictionless-drop");
    assert.match(exercise.solution[2].text, /sqrt\(2·/);
    assert.doesNotMatch(exercise.solution[2].text, /sqrt\[2/);
  }
});

test("localized constant-acceleration graph uses the English decimal separator", () => {
  const visualization = getAcademicUnitAdapter(1).getVisualization("constant-acceleration", "en");
  assert.equal(visualization.props.functions[0].label, "v(t)=4−1.2t");
});

test("incline weight-component guide is perpendicular to the plane", () => {
  const { props } = getAcademicUnitAdapter(3).getVisualization("normal-incline", "es");
  const plane = props.segments[0];
  const guide = props.segments[1];
  const planeVector = {
    x: plane.end.x - plane.start.x,
    y: plane.end.y - plane.start.y,
  };
  const guideVector = {
    x: guide.end.x - guide.start.x,
    y: guide.end.y - guide.start.y,
  };
  const dot = planeVector.x * guideVector.x + planeVector.y * guideVector.y;

  assert.ok(Math.abs(dot) < 1e-9, `guide must be perpendicular to the incline; dot=${dot}`);
  assert.ok(guideVector.x > 0 && guideVector.y < 0, "mg cosθ must point into the plane");
});

const vector = ({ start, end }) => ({ x: end.x - start.x, y: end.y - start.y });
const dot = (a, b) => a.x * b.x + a.y * b.y;

test("Unit 6 lever arms are perpendicular to their lines of action", () => {
  const adapter = getAcademicUnitAdapter(6);
  for (const [id, leverLabel, lineLabel] of [
    ["torque-lever-arm", "ℓ", "línea de acción"],
    ["angular-momentum-particle", "ℓ", "línea de movimiento"],
  ]) {
    const props = adapter.getVisualization(id, "es").props;
    const lever = props.segments.find(({ label }) => label === leverLabel);
    const line = props.segments.find(({ label }) => label === lineLabel);
    assert.ok(Math.abs(dot(vector(lever), vector(line))) < 0.01, `${id} lever arm must be perpendicular`);
  }
});

test("gyroscope torque is shown normal to the drawing plane", () => {
  const props = getAcademicUnitAdapter(6).getVisualization("gyroscope-precession", "es").props;
  assert.equal(props.vectors.some(({ label }) => label === "τ"), false);
  assert.equal(props.annotations.some(({ label }) => label === "τ ⊗"), true);
});

test("gravitational-superposition resultant equals the two drawn contributions", () => {
  const vectors = getAcademicUnitAdapter(7).getVisualization("gravitational-superposition", "es").props.vectors;
  const [first, second, resultant] = vectors.map(vector);
  assert.ok(Math.abs(resultant.x - first.x - second.x) < 1e-9);
  assert.ok(Math.abs(resultant.y - first.y - second.y) < 1e-9);
});
