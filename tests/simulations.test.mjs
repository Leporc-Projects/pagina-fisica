import assert from "node:assert/strict";
import test from "node:test";

import { COURSES } from "../src/data/courses.js";
import {
  SIMULATIONS,
  SIMULATION_CATEGORIES,
  SIMULATION_STATUSES,
  getPublishedSimulations,
  getSimulationById,
  getSimulationsByCategory,
  getSimulationsForCourseTopic,
} from "../src/data/simulations.js";
import { UNIT_1 } from "../src/data/physics/unit-1/unit.js";

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
  assert.equal(getPublishedSimulations().length, 1);
});

test("la consulta por categoría encuentra Cinemática y no inventa recursos", () => {
  assert.deepEqual(getSimulationsByCategory("Cinemática").map((item) => item.id), [
    "kinematics-1d",
  ]);
  assert.deepEqual(getSimulationsByCategory("Dinámica"), []);
});

test("los contextos apuntan a cursos, unidades y temas reales", () => {
  const courseIds = new Set(COURSES.map((course) => course.id));
  const topicSlugs = new Set(UNIT_1.topics.map((topic) => topic.slug));

  assert.ok(SIMULATIONS.every((simulation) =>
    simulation.contexts.every((context) =>
      courseIds.has(context.courseId) &&
      context.unit === UNIT_1.number &&
      context.topics.every((topic) => topicSlugs.has(topic))
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
    const expected = ["movimiento-1d", "ecuaciones-movimiento"].includes(topic.slug)
      ? ["kinematics-1d"]
      : [];
    assert.deepEqual(ids, expected);
  }
});

test("un curso o una unidad ajenos no reciben la simulación", () => {
  assert.deepEqual(getSimulationsForCourseTopic("otro-curso", 1, "movimiento-1d"), []);
  assert.deepEqual(getSimulationsForCourseTopic("fisica-basica-1", 2, "movimiento-1d"), []);
});
