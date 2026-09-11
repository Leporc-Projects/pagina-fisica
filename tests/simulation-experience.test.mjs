import assert from "node:assert/strict";
import test from "node:test";

import { SIMULATION_EXPERIENCES } from "../src/data/simulation-experiences.js";
import {
  getKinematicsState,
  getTurningPoint,
} from "../src/utils/kinematics-1d.js";
import {
  SIMULATION_EXPERIENCE_SCHEMA_VERSION,
  normalizeSimulationExperience,
  validateSimulationExperience,
} from "../src/utils/simulation-experience.js";

const published = SIMULATION_EXPERIENCES[0];
const clone = (value = published) => structuredClone(value);

test("la experiencia publicada satisface el contrato 2.0.0", () => {
  assert.equal(published.schemaVersion, SIMULATION_EXPERIENCE_SCHEMA_VERSION);
  assert.deepEqual(validateSimulationExperience(published), {
    valid: true,
    issues: [],
    errors: [],
  });
});

test("la migración declarativa conserva retorno, final y distancia aprobados", () => {
  const parameters = Object.fromEntries(
    Object.entries(published.parameters).map(([key, config]) => [key, config.default])
  );
  assert.deepEqual(parameters, { x0: -4, v0: 6, a: -2, T: 6 });
  assert.deepEqual(getTurningPoint(parameters), { time: 3, position: 5 });
  const finalState = getKinematicsState(parameters, parameters.T);
  assert.equal(finalState.position, -4);
  assert.equal(finalState.displacement, 0);
  assert.equal(finalState.distance, 18);
  assert.deepEqual(published.presets.map((preset) => preset.id), ["uniform", "rest", "return"]);
});

test("rechaza schemaVersion y estados desconocidos", () => {
  const schema = clone();
  schema.schemaVersion = "1.0.0";
  assert.equal(validateSimulationExperience(schema).issues[0].code, "invalid-schema");
  const status = clone();
  status.status = "approved";
  assert.ok(validateSimulationExperience(status).issues.some((entry) => entry.code === "invalid-status"));
});

test("rechaza modelId inexistente y propiedades desconocidas", () => {
  const model = clone();
  model.modelId = "projectile";
  assert.ok(validateSimulationExperience(model).issues.some((entry) => entry.code === "unknown-model"));
  const unknown = clone();
  unknown.javascript = "alert(1)";
  assert.ok(validateSimulationExperience(unknown).issues.some((entry) => entry.code === "unknown-property"));
});

test("exige los cuatro parámetros completos", () => {
  const missing = clone();
  delete missing.parameters.a;
  assert.ok(validateSimulationExperience(missing).issues.some((entry) =>
    entry.code === "missing-parameter" && entry.path === "parameters.a"
  ));
  const property = clone();
  delete property.parameters.v0.editable;
  assert.ok(validateSimulationExperience(property).issues.some((entry) => entry.code === "missing-property"));
});

test("rechaza default fuera del rango y un rango invertido", () => {
  const defaultOutside = clone();
  defaultOutside.parameters.x0.default = 30;
  defaultOutside.parameters.x0.maximum = 20;
  assert.ok(validateSimulationExperience(defaultOutside).issues.some((entry) => entry.code === "default-out-of-range"));
  const inverted = clone();
  inverted.parameters.T.minimum = 10;
  inverted.parameters.T.maximum = 5;
  assert.ok(validateSimulationExperience(inverted).issues.some((entry) => entry.code === "invalid-range"));
});

test("los rangos pedagógicos no pueden superar límites duros", () => {
  const invalid = clone();
  invalid.parameters.a.minimum = -11;
  assert.ok(validateSimulationExperience(invalid).issues.some((entry) => entry.code === "hard-limit-exceeded"));
});

test("step debe ser positivo y razonable", () => {
  for (const step of [0, -0.5, 200]) {
    const invalid = clone();
    invalid.parameters.x0.step = step;
    assert.ok(validateSimulationExperience(invalid).issues.some((entry) => entry.code === "invalid-step"));
  }
});

test("editable es booleano y admite un parámetro bloqueado válido", () => {
  const invalid = clone();
  invalid.parameters.a.editable = "false";
  assert.ok(validateSimulationExperience(invalid).issues.some((entry) => entry.code === "invalid-editable"));
  const locked = clone();
  locked.parameters.a.editable = false;
  locked.presets = locked.presets.map((preset) => ({
    ...preset,
    parameters: { ...preset.parameters, a: locked.parameters.a.default },
  }));
  assert.equal(validateSimulationExperience(locked).valid, true);
});

test("las vistas requieren booleanos y una representación visual", () => {
  const invalidType = clone();
  invalidType.views.motion = 1;
  assert.ok(validateSimulationExperience(invalidType).issues.some((entry) => entry.code === "invalid-view"));
  const empty = clone();
  Object.keys(empty.views).forEach((key) => { empty.views[key] = false; });
  assert.ok(validateSimulationExperience(empty).issues.some((entry) => entry.code === "empty-visual-experience"));
});

test("admite experiencias sin a(t) y con solo movimiento, lecturas y x(t)", () => {
  const withoutAcceleration = clone();
  withoutAcceleration.views.accelerationGraph = false;
  assert.equal(validateSimulationExperience(withoutAcceleration).valid, true);
  const focused = clone();
  focused.views = {
    motion: true,
    readings: true,
    positionGraph: true,
    velocityGraph: false,
    accelerationGraph: false,
    turningPoint: false,
  };
  assert.equal(validateSimulationExperience(focused).valid, true);
});

test("valida IDs únicos, labels y valores completos de presets", () => {
  const duplicate = clone();
  duplicate.presets[1].id = duplicate.presets[0].id;
  assert.ok(validateSimulationExperience(duplicate).issues.some((entry) => entry.code === "duplicate-preset"));
  const missing = clone();
  delete missing.presets[0].parameters.T;
  assert.ok(validateSimulationExperience(missing).issues.some((entry) => entry.code === "missing-preset-parameter"));
  const html = clone();
  html.presets[0].label = "<img src=x>";
  assert.ok(validateSimulationExperience(html).issues.some((entry) => entry.code === "invalid-preset-label"));
});

test("rechaza presets fuera de rango o incompatibles con un parámetro bloqueado", () => {
  const outside = clone();
  outside.parameters.v0.minimum = -5;
  outside.parameters.v0.maximum = 5;
  assert.ok(validateSimulationExperience(outside).issues.some((entry) => entry.code === "preset-out-of-range"));
  const locked = clone();
  locked.parameters.a.editable = false;
  assert.ok(validateSimulationExperience(locked).issues.some((entry) => entry.code === "locked-preset-mismatch"));
});

test("las observaciones son texto plano y respetan su máximo", () => {
  const html = clone();
  html.observations = ["Observa <script>alert(1)</script> el cambio."];
  assert.ok(validateSimulationExperience(html).issues.some((entry) => entry.code === "invalid-observation"));
  const valid = clone();
  valid.observations = [];
  valid.translations.en.observations = [];
  assert.equal(validateSimulationExperience(valid).valid, true);
});

test("los contextos validan curso, unidad, topics y duplicados", () => {
  const course = clone();
  course.contexts[0].courseId = "curso-inexistente";
  assert.ok(validateSimulationExperience(course).issues.some((entry) => entry.code === "unknown-course"));
  const topic = clone();
  topic.contexts[0].topics = ["tema-inexistente"];
  assert.ok(validateSimulationExperience(topic).issues.some((entry) => entry.code === "unknown-topic"));
  const duplicate = clone();
  duplicate.contexts[0].topics.push("movimiento-1d");
  assert.ok(validateSimulationExperience(duplicate).issues.some((entry) => entry.code === "duplicate-topic"));
  const global = clone();
  global.contexts = [];
  assert.equal(validateSimulationExperience(global).valid, true);
});

test("normalizar conserva la semántica canónica", () => {
  const normalized = normalizeSimulationExperience(clone());
  assert.deepEqual(normalized, published);
  assert.notEqual(normalized, published);
});

test("los cuatro parámetros aceptan rangos pedagógicos restringidos", () => {
  const restricted = clone();
  Object.assign(restricted.parameters.x0, { minimum: -10, maximum: 10, default: 0 });
  Object.assign(restricted.parameters.v0, { minimum: -5, maximum: 8, default: 2 });
  Object.assign(restricted.parameters.a, { minimum: -4, maximum: 4, default: 0 });
  Object.assign(restricted.parameters.T, { minimum: 2, maximum: 10, default: 5 });
  restricted.presets = [];
  restricted.translations.en.presetLabels = {};
  assert.equal(validateSimulationExperience(restricted).valid, true);
});
