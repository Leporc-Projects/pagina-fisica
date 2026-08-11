import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { SIMULATION_EXPERIENCES } from "../src/data/simulation-experiences.js";
import {
  getKinematicsState,
  getTurningPoint,
} from "../src/utils/kinematics-1d.js";
import {
  SIMULATION_EXPERIENCE_PACK_SCHEMA_VERSION,
  SIMULATION_EXPERIENCE_SCHEMA_VERSION,
  createSimulationExperienceDraft,
  createSimulationExperiencePack,
  mergeSimulationExperiencePack,
  normalizeSimulationExperience,
  simulationExperiencePackFilename,
  toSimulationExperiencePackJSON,
  validateSimulationExperience,
  validateSimulationExperiencePack,
} from "../src/utils/simulation-experience.js";

const published = SIMULATION_EXPERIENCES[0];
const clone = (value = published) => structuredClone(value);
const fixedCrypto = {
  getRandomValues(bytes) {
    bytes.fill(0xab);
    return bytes;
  },
};
const validDraft = () => ({ ...clone(), id: "teacher-kinematics-draft", status: "draft" });

test("la experiencia publicada satisface el contrato 1.0.0", () => {
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
  schema.schemaVersion = "2.0.0";
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

test("crea un borrador con ID seguro sin identidad personal", () => {
  const source = clone();
  delete source.id;
  const draft = createSimulationExperienceDraft(source, { cryptoApi: fixedCrypto });
  assert.match(draft.id, /^kinematics-1d-cinematica-en-una-dimension-[0-9a-f]{12}$/);
  assert.equal(draft.status, "draft");
  assert.equal("author" in draft, false);
});

test("crea y valida un paquete docente 1.0.0", () => {
  const pack = createSimulationExperiencePack([validDraft()], {
    cryptoApi: fixedCrypto,
    createdAt: "2026-08-11T12:00:00.000Z",
  });
  assert.equal(pack.schemaVersion, SIMULATION_EXPERIENCE_PACK_SCHEMA_VERSION);
  assert.equal(pack.source, "teacher");
  assert.equal(validateSimulationExperiencePack(pack).valid, true);
  assert.equal(
    simulationExperiencePackFilename(pack),
    "aula-fisica-simulation-pack-2026-08-11-abababab.json"
  );
});

test("rechaza paquetes inválidos, propiedades y experiencias no draft", () => {
  const pack = createSimulationExperiencePack([validDraft()], { cryptoApi: fixedCrypto });
  pack.extra = true;
  assert.ok(validateSimulationExperiencePack(pack).issues.some((entry) => entry.code === "unknown-property"));
  delete pack.extra;
  pack.experiences[0].status = "published";
  assert.ok(validateSimulationExperiencePack(pack).issues.some((entry) => entry.code === "non-draft-pack"));
});

test("la importación fuerza review y rechaza duplicados", () => {
  const pack = createSimulationExperiencePack([validDraft()], { cryptoApi: fixedCrypto });
  const merged = mergeSimulationExperiencePack(pack, [published]);
  assert.equal(merged.imported[0].status, "review");
  assert.equal(merged.experiences.length, 2);
  const duplicatePack = createSimulationExperiencePack([
    { ...validDraft(), id: published.id },
  ], { cryptoApi: fixedCrypto });
  assert.throws(() => mergeSimulationExperiencePack(duplicatePack, [published]), /ya existe/);
});

test("el JSON exportado es estable, legible y termina en salto de línea", () => {
  const pack = createSimulationExperiencePack([validDraft()], {
    cryptoApi: fixedCrypto,
    createdAt: "2026-08-11T12:00:00.000Z",
  });
  const first = toSimulationExperiencePackJSON(pack);
  const second = toSimulationExperiencePackJSON(pack);
  assert.equal(first, second);
  assert.ok(first.endsWith("\n"));
  assert.deepEqual(JSON.parse(first), pack);
});

test("import:simulations procesa JSON, fuerza review y no sobrescribe", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aula-fisica-simulations-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const source = path.join(directory, "pack.json");
  const target = path.join(directory, "experiences.json");
  const pack = createSimulationExperiencePack([validDraft()], {
    cryptoApi: fixedCrypto,
    createdAt: "2026-08-11T12:00:00.000Z",
  });
  fs.writeFileSync(source, JSON.stringify(pack), "utf8");
  fs.writeFileSync(target, "[]\n", "utf8");

  const importer = fileURLToPath(new URL("../scripts/import-simulations.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [importer, source, "--target", target], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /estado review/);
  const stored = JSON.parse(fs.readFileSync(target, "utf8"));
  assert.equal(stored[0].status, "review");

  const repeated = spawnSync(process.execPath, [importer, source, "--target", target], {
    encoding: "utf8",
  });
  assert.notEqual(repeated.status, 0);
  assert.match(repeated.stderr, /ya existe/);
});

test("los cuatro parámetros aceptan rangos pedagógicos restringidos", () => {
  const restricted = clone();
  Object.assign(restricted.parameters.x0, { minimum: -10, maximum: 10, default: 0 });
  Object.assign(restricted.parameters.v0, { minimum: -5, maximum: 8, default: 2 });
  Object.assign(restricted.parameters.a, { minimum: -4, maximum: 4, default: 0 });
  Object.assign(restricted.parameters.T, { minimum: 2, maximum: 10, default: 5 });
  restricted.presets = [];
  assert.equal(validateSimulationExperience(restricted).valid, true);
});
