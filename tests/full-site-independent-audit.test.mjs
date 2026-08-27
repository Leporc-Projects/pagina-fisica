import assert from "node:assert/strict";
import test from "node:test";

import { MINI_QUIZZES } from "../src/data/mini-quizzes/index.js";
import {
  ACADEMIC_UNITS,
  getAcademicUnitAdapter,
  getLocalizedAcademicUnit,
} from "../src/data/physics/index.js";
import { getAcademicExerciseFamily } from "../src/data/physics/family-registry.js";
import { SIMULATION_EXPERIENCES } from "../src/data/simulation-experiences.js";
import { SIMULATION_MODELS } from "../src/data/simulation-models.js";
import {
  getPublishedSimulationsForLocale,
  SIMULATION_CATALOG,
} from "../src/data/simulations.js";
import { LOCALIZED_ROUTES, getRouteCounterpart } from "../src/i18n/routes.js";
import { getForcesFrictionForces } from "../src/utils/forces-friction.js";
import { getKinematicsState } from "../src/utils/kinematics-1d.js";
import { getProjectileState, getProjectileSummary } from "../src/utils/projectile-2d.js";
import { PULLEY_SCENARIO_IDS, solvePulleySystem } from "../src/utils/pulley-systems.js";

const EXPECTED_BY_UNIT = Object.freeze([
  { unit: 1, topics: 7, sections: 24, formulas: 25, visuals: 26, checks: 7, errors: 36, examples: 0, exercises: 55, families: 15, routes: 18 },
  { unit: 2, topics: 7, sections: 24, formulas: 10, visuals: 12, checks: 16, errors: 16, examples: 0, exercises: 41, families: 8, routes: 18 },
  { unit: 3, topics: 8, sections: 27, formulas: 13, visuals: 14, checks: 18, errors: 20, examples: 8, exercises: 36, families: 10, routes: 20 },
  { unit: 4, topics: 8, sections: 32, formulas: 12, visuals: 12, checks: 16, errors: 16, examples: 8, exercises: 40, families: 10, routes: 20 },
  { unit: 5, topics: 7, sections: 28, formulas: 12, visuals: 12, checks: 16, errors: 16, examples: 8, exercises: 40, families: 10, routes: 18 },
  { unit: 6, topics: 10, sections: 40, formulas: 14, visuals: 14, checks: 20, errors: 20, examples: 10, exercises: 40, families: 12, routes: 24 },
  { unit: 7, topics: 10, sections: 40, formulas: 14, visuals: 14, checks: 20, errors: 20, examples: 10, exercises: 40, families: 12, routes: 24 },
]);

const unique = (values, label) => {
  assert.equal(new Set(values).size, values.length, `${label}: duplicate identity`);
};

const close = (actual, expected, tolerance = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
};

const answerInvariant = (answer) => answer.kind === "values"
  ? { kind: answer.kind, values: answer.values.map(({ id, value }) => ({ id, value })) }
  : { kind: answer.kind, value: answer.value };

const manifestForUnit = (unitNumber) => {
  const adapter = getAcademicUnitAdapter(unitNumber);
  const esUnit = getLocalizedAcademicUnit(unitNumber, "es");
  const enUnit = getLocalizedAcademicUnit(unitNumber, "en");
  const esContent = adapter.getContent("es");
  const enContent = adapter.getContent("en");
  const topicIds = Object.keys(esContent);
  const sections = Object.entries(esContent).flatMap(([topicId, topic]) =>
    topic.sections.map((section) => ({ ...section, topicId }))
  );
  const enSections = Object.entries(enContent).flatMap(([topicId, topic]) =>
    topic.sections.map((section) => ({ ...section, topicId }))
  );
  const formulaIds = [...new Set(sections.flatMap(({ formulas = [] }) =>
    formulas.map((formula) => typeof formula === "string" ? formula : formula.id)
  ))];
  const visualIds = [...new Set(sections.flatMap(({ visualizations = [] }) => visualizations))];
  const exampleIds = [...new Set(sections.flatMap(({ examples = [] }) => examples))];
  const errorTopics = [...new Set(Object.values(esContent).flatMap(({ errorTopics = [] }) => errorTopics))];
  const esErrors = adapter.getErrors(errorTopics, "es");
  const enErrors = adapter.getErrors(errorTopics, "en");
  const esExercises = adapter.getFixedExercises("es");
  const enExercises = adapter.getFixedExercises("en");
  const familyIds = adapter.getBankItems("es")
    .filter(({ itemKind }) => itemKind === "parameterizedFamily")
    .map(({ id }) => id);
  const routes = [esUnit.route, enUnit.route, esUnit.practiceRoute, enUnit.practiceRoute];

  esUnit.topics.forEach((topic, index) => {
    const counterpart = enUnit.topics[index];
    assert.ok(counterpart, `U${unitNumber}:${topic.slug}: missing EN topic`);
    assert.equal(getRouteCounterpart(topic.route, "en"), counterpart.route, `U${unitNumber}:${topic.slug}: route counterpart`);
    routes.push(topic.route, counterpart.route);
  });

  assert.deepEqual(Object.keys(enContent), topicIds, `U${unitNumber}: locale topic identity`);
  assert.equal(enSections.length, sections.length, `U${unitNumber}: locale section count`);
  sections.forEach((section, index) => {
    const localized = enSections[index];
    assert.equal(localized.id, section.id, `U${unitNumber}:${section.id}: locale section identity`);
    assert.equal(localized.topicId, section.topicId, `U${unitNumber}:${section.id}: locale topic reference`);
    for (const layer of ["essential", "understand", "deepen", "explore"]) {
      assert.ok(section[layer]?.length, `U${unitNumber}:${section.id}:${layer}: missing ES content`);
      assert.equal(localized[layer]?.length, section[layer].length, `U${unitNumber}:${section.id}:${layer}: locale parity`);
    }
    assert.equal(localized.checks?.length ?? 0, section.checks?.length ?? 0, `U${unitNumber}:${section.id}: check parity`);
  });

  unique(topicIds, `U${unitNumber}:topics`);
  unique(sections.map(({ id }) => id), `U${unitNumber}:sections`);
  unique(formulaIds, `U${unitNumber}:formulas`);
  unique(adapter.visualizationIds, `U${unitNumber}:visualizations`);
  unique(exampleIds, `U${unitNumber}:examples`);
  unique(esErrors.map(({ id }) => id), `U${unitNumber}:errors`);
  unique(esExercises.map(({ id }) => id), `U${unitNumber}:exercises`);
  unique(familyIds, `U${unitNumber}:families`);
  unique(routes, `U${unitNumber}:routes`);

  formulaIds.forEach((id) => {
    assert.ok(adapter.getFormula(id, "es"), `U${unitNumber}:${id}: broken formula reference`);
    assert.ok(adapter.getFormula(id, "en"), `U${unitNumber}:${id}: missing EN formula`);
  });
  visualIds.forEach((id) => {
    assert.ok(adapter.getVisualization(id, "es"), `U${unitNumber}:${id}: broken visualization reference`);
    assert.ok(adapter.getVisualization(id, "en"), `U${unitNumber}:${id}: missing EN visualization`);
  });
  exampleIds.forEach((id) => {
    assert.ok(adapter.getExample?.(id, "es"), `U${unitNumber}:${id}: broken example reference`);
    assert.ok(adapter.getExample?.(id, "en"), `U${unitNumber}:${id}: missing EN example`);
  });

  assert.deepEqual(enErrors.map(({ id }) => id), esErrors.map(({ id }) => id), `U${unitNumber}: locale error identity`);
  assert.equal(enExercises.length, esExercises.length, `U${unitNumber}: locale exercise count`);
  const errorIds = new Set(esErrors.map(({ id }) => id));
  esExercises.forEach((exercise, index) => {
    const localized = enExercises[index];
    assert.ok(esContent[exercise.topic], `${exercise.id}: unreachable topic`);
    assert.ok(esContent[exercise.topic].sections.some(({ id }) => id === exercise.subtopic), `${exercise.id}: unreachable section`);
    exercise.commonErrors.forEach((id) => assert.ok(errorIds.has(id), `${exercise.id}: broken common-error reference ${id}`));
    assert.equal(localized.id, exercise.id, `${exercise.id}: missing locale counterpart`);
    assert.deepEqual(answerInvariant(localized.answer), answerInvariant(exercise.answer), `${exercise.id}: localized grading drift`);
  });
  familyIds.forEach((id) => assert.ok(getAcademicExerciseFamily(id), `${id}: family absent from runtime registry`));

  return {
    unit: unitNumber,
    topics: topicIds.length,
    sections: sections.length,
    formulas: formulaIds.length,
    visuals: adapter.visualizationIds.length,
    checks: sections.reduce((sum, { checks = [] }) => sum + checks.length, 0),
    errors: esErrors.length,
    examples: exampleIds.length,
    exercises: esExercises.length,
    families: familyIds.length,
    routes: routes.length,
    ids: { exercises: esExercises.map(({ id }) => id), families: familyIds, routes },
  };
};

test("el manifest independiente enumera todo el corpus sin pérdidas, duplicados ni referencias rotas", () => {
  assert.deepEqual(ACADEMIC_UNITS.map(({ number }) => number), [1, 2, 3, 4, 5, 6, 7]);
  const manifest = ACADEMIC_UNITS.map(({ number }) => manifestForUnit(number));
  const counts = manifest.map(({ ids: _ids, ...entry }) => entry);
  assert.deepEqual(counts, EXPECTED_BY_UNIT);

  const totals = counts.reduce((sum, entry) => {
    Object.entries(entry).forEach(([key, value]) => {
      if (key !== "unit") sum[key] = (sum[key] ?? 0) + value;
    });
    return sum;
  }, {});
  assert.deepEqual(totals, {
    topics: 57,
    sections: 215,
    formulas: 100,
    visuals: 104,
    checks: 113,
    errors: 144,
    examples: 44,
    exercises: 292,
    families: 77,
    routes: 142,
  });
  unique(manifest.flatMap(({ ids }) => ids.exercises), "all fixed exercises");
  unique(manifest.flatMap(({ ids }) => ids.families), "all parameterized families");
  unique(manifest.flatMap(({ ids }) => ids.routes), "all academic routes");
});

test("el manifest de producto conserva cuatro simulaciones públicas, cinco escenarios y circular archivada", () => {
  const es = getPublishedSimulationsForLocale("es");
  const en = getPublishedSimulationsForLocale("en");
  const expectedPublicIds = ["kinematics-1d", "projectile-2d", "forces-friction", "pulley-systems"];

  assert.deepEqual(es.map(({ id }) => id), expectedPublicIds);
  assert.deepEqual(en.map(({ id }) => id), expectedPublicIds);
  assert.deepEqual(SIMULATION_CATALOG.map(({ experienceId }) => experienceId), expectedPublicIds);
  unique(SIMULATION_CATALOG.map(({ route }) => route), "public simulation ES routes");
  unique(en.map(({ route }) => route), "public simulation EN routes");
  es.forEach((simulation, index) => {
    assert.equal(getRouteCounterpart(simulation.route, "en"), en[index].route, `${simulation.id}: route counterpart`);
    assert.equal(en[index].modelId, simulation.modelId, `${simulation.id}: localized model drift`);
  });

  assert.deepEqual(PULLEY_SCENARIO_IDS, [
    "table-hanging",
    "atwood",
    "movable-pulley",
    "three-pulley-tackle",
    "double-atwood",
  ]);
  assert.equal(SIMULATION_EXPERIENCES.find(({ id }) => id === "circular-radial-force")?.status, "archived");
  assert.equal(SIMULATION_CATALOG.some(({ experienceId }) => experienceId === "circular-radial-force"), false);
  assert.equal(SIMULATION_MODELS.length, 5, "the archived model remains available only to internal authoring");
});

test("mini quices y rutas localizadas conservan identidad publicada sin reactivar herramientas ocultas", () => {
  assert.equal(MINI_QUIZZES.length, 4);
  unique(MINI_QUIZZES.map(({ id }) => id), "mini quizzes");
  unique(MINI_QUIZZES.map(({ slug }) => slug), "mini quiz slugs");

  for (const [routeId, routes] of Object.entries(LOCALIZED_ROUTES)) {
    if (routes.es && routes.en) {
      assert.equal(getRouteCounterpart(routes.es, "en"), routes.en, `${routeId}: EN counterpart`);
      assert.equal(getRouteCounterpart(routes.en, "es"), routes.es, `${routeId}: ES counterpart`);
    }
  }
});

test("oráculos algebraicos separados cubren casos adversariales de las cuatro simulaciones públicas", () => {
  const kinematicsCases = [
    { x0: -20, v0: -12, a: 0, T: 1 },
    { x0: -7, v0: 0, a: 5, T: 12 },
    { x0: 13, v0: 11, a: -6, T: 8 },
    { x0: 20, v0: -10, a: 6, T: 20 },
  ];
  for (const parameters of kinematicsCases) {
    for (const t of [0, parameters.T / 3, parameters.T]) {
      const state = getKinematicsState(parameters, t);
      close(state.position, parameters.x0 + parameters.v0 * t + parameters.a * t ** 2 / 2);
      close(state.velocity, parameters.v0 + parameters.a * t);
      close(state.acceleration, parameters.a);
    }
  }

  const projectileCases = [
    { y0: 0, v0: 1, theta: 0, g: 15 },
    { y0: 25, v0: 8, theta: 0, g: 9.8 },
    { y0: 0, v0: 30, theta: 90, g: 1 },
    { y0: 7, v0: 42, theta: 12, g: 11.3 },
    { y0: 14, v0: 21, theta: 78, g: 4.2 },
  ];
  for (const parameters of projectileCases) {
    const angle = parameters.theta * Math.PI / 180;
    const vx = parameters.v0 * Math.cos(angle);
    const vy = parameters.v0 * Math.sin(angle);
    const discriminant = vy ** 2 + 2 * parameters.g * parameters.y0;
    const expectedFlight = (vy + Math.sqrt(discriminant)) / parameters.g;
    const summary = getProjectileSummary(parameters);
    close(summary.flightTime, expectedFlight, 1e-8);
    for (const t of [0, expectedFlight / 2, expectedFlight]) {
      const state = getProjectileState(parameters, t);
      close(state.position.x, vx * t, 1e-8);
      close(state.position.y, Math.max(0, parameters.y0 + vy * t - parameters.g * t ** 2 / 2), 1e-8);
      close(state.velocity.x, vx, 1e-8);
      close(state.velocity.y, vy - parameters.g * t, 1e-8);
    }
  }

  const frictionCases = [
    { m: 2, g: 15, beta: 35, F: 0, alpha: -30, muS: 0, muK: 0, v0: 0 },
    { m: 20, g: 1, beta: 0, F: 60, alpha: 30, muS: 0.8, muK: 0.4, v0: 0 },
    { m: 9, g: 9.8, beta: 17, F: 23, alpha: -19, muS: 0.55, muK: 0.31, v0: -4 },
    { m: 12, g: 10, beta: 26, F: 41, alpha: 13, muS: 0.44, muK: 0.28, v0: 3 },
  ];
  for (const parameters of frictionCases) {
    const beta = parameters.beta * Math.PI / 180;
    const alpha = parameters.alpha * Math.PI / 180;
    const normalRaw = parameters.m * parameters.g * Math.cos(beta) - parameters.F * Math.sin(alpha);
    const drive = parameters.F * Math.cos(alpha) - parameters.m * parameters.g * Math.sin(beta);
    const forces = getForcesFrictionForces(parameters, { v: parameters.v0 });
    close(forces.drive, drive);
    if (normalRaw <= 0) {
      assert.equal(forces.regime, "contact-invalid");
      assert.equal(forces.normal, 0);
      continue;
    }
    close(forces.normal, normalRaw);
    const staticPossible = parameters.v0 === 0 && Math.abs(drive) <= parameters.muS * normalRaw + 1e-9;
    if (staticPossible) {
      assert.equal(forces.regime, "static");
      close(forces.friction, -drive);
      close(forces.netParallel, 0);
    } else {
      const motionSign = parameters.v0 === 0 ? Math.sign(drive) : Math.sign(parameters.v0);
      assert.equal(forces.regime, "kinetic");
      close(forces.friction, -motionSign * parameters.muK * normalRaw);
      close(forces.netParallel, drive + forces.friction);
    }
  }

  const pulleyCases = [
    ["table-hanging", { m1: 7, m2: 4, muS: 0.2, muK: 0.1, g: 9.8 }],
    ["atwood", { m1: 2.5, m2: 7, g: 9.8 }],
    ["movable-pulley", { mL: 5, mC: 1.3, g: 9.8 }],
    ["three-pulley-tackle", { mL: 8, mC: 1.7, g: 9.8 }],
    ["double-atwood", { m1: 1.5, m2: 3.2, m3: 5.7, g: 9.8 }],
  ];
  for (const [scenarioId, parameters] of pulleyCases) {
    const { accelerations: a, tensions, friction } = solvePulleySystem(scenarioId, parameters);
    if (scenarioId === "table-hanging") {
      close(tensions.T - friction, parameters.m1 * a.m1);
      close(parameters.m2 * parameters.g - tensions.T, parameters.m2 * a.m2);
      close(a.m1, a.m2);
    } else if (scenarioId === "atwood") {
      close(parameters.m1 * parameters.g - tensions.T, parameters.m1 * a.m1);
      close(parameters.m2 * parameters.g - tensions.T, parameters.m2 * a.m2);
      close(a.m1 + a.m2, 0);
    } else if (scenarioId === "movable-pulley") {
      close(parameters.mL * parameters.g - 2 * tensions.T, parameters.mL * a.mL);
      close(parameters.mC * parameters.g - tensions.T, parameters.mC * a.mC);
      close(2 * a.mL + a.mC, 0);
    } else if (scenarioId === "three-pulley-tackle") {
      close(parameters.mL * parameters.g - 3 * tensions.T, parameters.mL * a.mL);
      close(parameters.mC * parameters.g - tensions.T, parameters.mC * a.mC);
      close(3 * a.mL + a.mC, 0);
    } else {
      close(parameters.m1 * parameters.g - tensions.TA, parameters.m1 * a.m1);
      close(parameters.m2 * parameters.g - tensions.TA, parameters.m2 * a.m2);
      close(parameters.m3 * parameters.g - tensions.TC, parameters.m3 * a.m3);
      close(tensions.TC, 2 * tensions.TA);
      close(a.pulley + a.m3, 0);
      close(a.m1 + a.m2 - 2 * a.pulley, 0);
    }
  }
});
