import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  SIMULATION_EXPERIENCES,
  getSimulationExperienceByModelId,
} from "../src/data/simulation-experiences.js";
import {
  SIMULATION_MODELS,
  getSimulationModelById,
} from "../src/data/simulation-models.js";
import {
  SIMULATION_RENDERERS,
  getSimulationRendererById,
} from "../src/data/simulation-renderers.js";
import {
  getPublishedSimulations,
  getSimulationsForCourseTopic,
} from "../src/data/simulations.js";
import { createProjectileCanvasTransform } from "../src/utils/projectile-canvas.js";
import {
  createSimulationExperiencePack,
  mergeSimulationExperiencePack,
  validateSimulationExperience,
  validateSimulationExperiencePack,
} from "../src/utils/simulation-experience.js";
import { createSimulationLabBaseConfiguration } from "../src/utils/simulation-authoring.js";
import { getKinematicsState, getTurningPoint } from "../src/utils/kinematics-1d.js";
import {
  getSimulationRendererClient,
  getSimulationRendererClientIds,
} from "../src/scripts/simulation-renderer-runtime.js";

const clone = (value) => structuredClone(value);
const fixedCrypto = { getRandomValues(bytes) { bytes.fill(0xcd); return bytes; } };

test("registra dos modelos y dos renderers con relaciones únicas", () => {
  assert.deepEqual(SIMULATION_MODELS.map((model) => model.id), ["kinematics-1d", "projectile-2d"]);
  assert.deepEqual(SIMULATION_RENDERERS.map((renderer) => renderer.id), [
    "svg-kinematics-1d",
    "p5-projectile-2d",
  ]);
  assert.equal(new Set(SIMULATION_MODELS.map((model) => model.rendererId)).size, 2);
  SIMULATION_MODELS.forEach((model) => {
    assert.equal(getSimulationRendererById(model.rendererId).modelId, model.id);
  });
});

test("cada vista declara label docente y condición visual", () => {
  SIMULATION_MODELS.forEach((model) => {
    assert.ok(Object.keys(model.views).length > 0);
    assert.ok(Object.values(model.views).every((view) =>
      typeof view.label === "string" && view.label.length > 0 && typeof view.visual === "boolean"
    ));
    assert.ok(Object.values(model.views).some((view) => view.visual));
  });
});

test("las dos experiencias publicadas cumplen el contrato 1.0.0", () => {
  assert.deepEqual(SIMULATION_EXPERIENCES.map((experience) => experience.id), [
    "kinematics-1d",
    "projectile-2d",
  ]);
  assert.ok(SIMULATION_EXPERIENCES.every((experience) => validateSimulationExperience(experience).valid));
});

test("parámetros y vistas de un modelo no son aceptados por el otro", () => {
  const kinematics = getSimulationExperienceByModelId("kinematics-1d");
  const projectile = clone(getSimulationExperienceByModelId("projectile-2d"));
  projectile.parameters = clone(kinematics.parameters);
  assert.equal(validateSimulationExperience(projectile).valid, false);
  const projectileViews = clone(getSimulationExperienceByModelId("projectile-2d"));
  projectileViews.views = clone(kinematics.views);
  assert.equal(validateSimulationExperience(projectileViews).valid, false);
});

test("la regla de visualización se deriva de metadata del modelo", () => {
  for (const model of SIMULATION_MODELS) {
    const experience = clone(getSimulationExperienceByModelId(model.id));
    Object.keys(experience.views).forEach((key) => { experience.views[key] = false; });
    assert.ok(validateSimulationExperience(experience).issues.some((entry) =>
      entry.code === "empty-visual-experience"
    ));
    const firstVisual = Object.entries(model.views).find(([, definition]) => definition.visual)[0];
    experience.views[firstVisual] = true;
    assert.equal(validateSimulationExperience(experience).valid, true);
  }
});

test("el catálogo recupera ambas simulaciones y el contexto 2D correcto", () => {
  assert.deepEqual(getPublishedSimulations().map((simulation) => simulation.id), [
    "kinematics-1d",
    "projectile-2d",
  ]);
  assert.deepEqual(
    getSimulationsForCourseTopic("fisica-basica-1", 1, "movimiento-2d").map((item) => item.id),
    ["projectile-2d"]
  );
  assert.deepEqual(
    getSimulationsForCourseTopic("fisica-basica-1", 1, "movimiento-1d").map((item) => item.id),
    ["kinematics-1d"]
  );
});

test("el Laboratorio construye configuraciones base independientes", () => {
  const kinematics = createSimulationLabBaseConfiguration("kinematics-1d");
  const projectile = createSimulationLabBaseConfiguration("projectile-2d");
  assert.deepEqual(Object.keys(kinematics.parameters), ["x0", "v0", "a", "T"]);
  assert.deepEqual(Object.keys(projectile.parameters), ["y0", "v0", "theta", "g"]);
  kinematics.parameters.v0.default = -20;
  assert.equal(projectile.parameters.v0.default, 20);
  assert.throws(() => createSimulationLabBaseConfiguration("future-model"), RangeError);
});

test("un pack de proyectil es válido y la importación fuerza review", () => {
  const source = clone(getSimulationExperienceByModelId("projectile-2d"));
  source.id = "teacher-projectile-draft";
  source.status = "draft";
  const pack = createSimulationExperiencePack([source], { cryptoApi: fixedCrypto });
  assert.equal(validateSimulationExperiencePack(pack).valid, true);
  const merged = mergeSimulationExperiencePack(pack, SIMULATION_EXPERIENCES);
  assert.equal(merged.imported[0].modelId, "projectile-2d");
  assert.equal(merged.imported[0].status, "review");
});

test("el importador CLI acepta proyectil y conserva revisión", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aula-projectile-import-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const sourceExperience = clone(getSimulationExperienceByModelId("projectile-2d"));
  sourceExperience.id = "teacher-projectile-cli";
  sourceExperience.status = "draft";
  const pack = createSimulationExperiencePack([sourceExperience], { cryptoApi: fixedCrypto });
  const source = path.join(directory, "pack.json");
  const target = path.join(directory, "experiences.json");
  fs.writeFileSync(source, JSON.stringify(pack), "utf8");
  fs.writeFileSync(target, "[]\n", "utf8");
  const importer = fileURLToPath(new URL("../scripts/import-simulations.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [importer, source, "--target", target], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const imported = JSON.parse(fs.readFileSync(target, "utf8"));
  assert.equal(imported[0].modelId, "projectile-2d");
  assert.equal(imported[0].status, "review");
});

test("el lookup cliente solo reconoce renderers registrados", () => {
  assert.deepEqual(getSimulationRendererClientIds(), ["svg-kinematics-1d", "p5-projectile-2d"]);
  assert.ok(getSimulationRendererClient("svg-kinematics-1d"));
  assert.ok(getSimulationRendererClient("p5-projectile-2d"));
  assert.equal(getSimulationRendererClient("arbitrary-renderer"), undefined);
  assert.equal(getSimulationModelById("projectile-2d").rendererId, "p5-projectile-2d");
});

test("la transformación Canvas preserva +y física hacia arriba", () => {
  const transform = createProjectileCanvasTransform({
    xDomain: [0, 40],
    yDomain: [0, 10],
    width: 800,
    height: 400,
  });
  assert.ok(transform.x(40) > transform.x(0));
  assert.ok(transform.y(10) < transform.y(0));
  assert.ok(transform.scale > 0);
});

test("Cinemática 1D conserva el caso aprobado", () => {
  const parameters = { x0: -4, v0: 6, a: -2, T: 6 };
  assert.deepEqual(getTurningPoint(parameters), { time: 3, position: 5 });
  const finalState = getKinematicsState(parameters, 6);
  assert.equal(finalState.position, -4);
  assert.equal(finalState.displacement, 0);
  assert.equal(finalState.distance, 18);
});
