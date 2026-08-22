import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { COURSES } from "../src/data/courses.js";
import {
  SIMULATIONS,
  SIMULATION_CATEGORIES,
  SIMULATION_STATUSES,
  getPublishedSimulationCategories,
  getPublishedSimulations,
  getSimulationById,
  getSimulationsByCategory,
  getSimulationsForCourseTopic,
} from "../src/data/simulations.js";
import { UNIT_1 } from "../src/data/physics/unit-1/unit.js";
import { getAcademicUnitForContext } from "../src/data/physics/index.js";

const root = fileURLToPath(new URL("../", import.meta.url));

test("el catálogo contiene solo IDs y rutas únicas", () => {
  assert.equal(new Set(SIMULATIONS.map((item) => item.id)).size, SIMULATIONS.length);
  assert.equal(new Set(SIMULATIONS.map((item) => item.route)).size, SIMULATIONS.length);
});

test("la simulación 1D conserva su identidad pública canónica", () => {
  const simulation = getSimulationById("kinematics-1d");
  assert.equal(simulation.title, "Cinemática en una dimensión");
  assert.equal(simulation.route, "/simulaciones/cinematica-1d");
  assert.equal(simulation.category, "Cinemática");
  assert.equal(simulation.status, "published");
});

test("categorías y estados pertenecen a taxonomías válidas", () => {
  assert.ok(SIMULATIONS.every((item) => SIMULATION_CATEGORIES.includes(item.category)));
  assert.ok(SIMULATIONS.every((item) => SIMULATION_STATUSES.includes(item.status)));
});

test("la consulta pública excluye estados no publicados", () => {
  assert.ok(getPublishedSimulations().every((item) => item.status === "published"));
  assert.equal(getPublishedSimulations().length, 4);
});

test("la consulta por categoría encuentra Cinemática y Dinámica", () => {
  assert.deepEqual(getSimulationsByCategory("Cinemática").map((item) => item.id), [
    "kinematics-1d",
    "projectile-2d",
  ]);
  assert.deepEqual(getSimulationsByCategory("Dinámica").map((item) => item.id), ["forces-friction", "pulley-systems"]);
});

test("las categorías públicas se derivan de recursos publicados", () => {
  const categories = getPublishedSimulationCategories();
  assert.deepEqual(categories, ["Cinemática", "Dinámica"]);
  assert.ok(categories.every((category) => getSimulationsByCategory(category).length > 0));
});

test("el catálogo no muestra categorías vacías ni badges promocionales", () => {
  const page = fs.readFileSync(
    `${root}/src/components/pages/SimulationsCatalogPage.astro`,
    "utf8"
  );
  assert.match(page, /getPublishedSimulationCategories/);
  assert.doesNotMatch(page, /status-label--available|simulations\.available|simulations\.preparing/);
});

test("los contextos apuntan a cursos, unidades y temas reales", () => {
  const courseIds = new Set(COURSES.map((course) => course.id));
  assert.ok(SIMULATIONS.every((simulation) =>
    simulation.contexts.every((context) =>
      courseIds.has(context.courseId) &&
      context.topics.every((topic) =>
        getAcademicUnitForContext(context.courseId, context.unit)?.topics.some(({ slug }) => slug === topic)
      )
    )
  ));
});

test("la consulta contextual aparece solo en los dos temas declarados", () => {
  for (const topic of UNIT_1.topics) {
    const ids = getSimulationsForCourseTopic(
      "fisica-basica-1",
      1,
      topic.slug
    ).map((item) => item.id);
    const expected = topic.slug === "movimiento-2d"
      ? ["projectile-2d"]
      : ["movimiento-1d", "ecuaciones-movimiento"].includes(topic.slug)
        ? ["kinematics-1d"]
        : [];
    assert.deepEqual(ids, expected);
  }
});

test("poleas ocupa los contextos dinámicos y circular queda fuera de la superficie pública", () => {
  assert.equal(getSimulationById("circular-radial-force"), undefined);
  assert.equal(getSimulationById("pulley-systems")?.route, "/simulaciones/poleas");
  assert.deepEqual(
    getSimulationsForCourseTopic("fisica-basica-1", 2, "segunda-ley").map((item) => item.id),
    ["forces-friction", "pulley-systems"]
  );
  assert.deepEqual(
    getSimulationsForCourseTopic("fisica-basica-1", 3, "tension").map((item) => item.id),
    ["pulley-systems"]
  );
  assert.deepEqual(getSimulationsForCourseTopic("fisica-basica-1", 3, "dinamica-circular"), []);
});

test("un curso o una unidad ajenos no reciben la simulación", () => {
  assert.deepEqual(getSimulationsForCourseTopic("otro-curso", 1, "movimiento-1d"), []);
  assert.deepEqual(getSimulationsForCourseTopic("fisica-basica-1", 2, "movimiento-1d"), []);
});
