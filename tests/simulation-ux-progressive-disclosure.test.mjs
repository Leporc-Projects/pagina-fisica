import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { UNITS } from "../src/data/course.js";
import { getDevelopedAcademicUnits } from "../src/data/physics/index.js";
import {
  getPublishedSimulationNavigationGroups,
  getPublishedSimulations,
} from "../src/data/simulations.js";
import { getNavigation } from "../src/data/site.js";

const source = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("las cuatro simulaciones muestran parámetros antes del disclosure de casos", () => {
  const components = [
    "KinematicsSimulation.astro",
    "ProjectileSimulation.astro",
    "ForcesFrictionSimulation.astro",
    "PulleySystemsSimulation.astro",
  ];

  for (const component of components) {
    const contents = source(`src/components/simulations/${component}`);
    const form = contents.indexOf("data-parameter-form");
    const cases = contents.indexOf("data-study-cases-disclosure");
    assert.ok(form !== -1 && cases !== -1, `${component} conserva formulario y casos`);
    assert.ok(form < cases, `${component} prioriza los parámetros`);
    assert.doesNotMatch(
      contents.slice(Math.max(0, cases - 100), cases + 140),
      /<details[^>]*\sopen(?:\s|=|>)/,
      `${component} inicia los casos cerrados`
    );
  }
});

test("las gráficas existentes comparten un disclosure cerrado y permanecen montadas", () => {
  const disclosure = source("src/components/simulations/SimulationGraphsDisclosure.astro");
  assert.match(disclosure, /<details class="simulation-graphs-disclosure" data-graphs-disclosure>/);
  assert.doesNotMatch(disclosure, /<details[^>]*\sopen(?:\s|=|>)/);
  assert.match(disclosure, /<slot \/>/);

  const kinematics = source("src/components/simulations/KinematicsSimulation.astro");
  const forces = source("src/components/simulations/ForcesFrictionAnalysis.astro");
  const pulleys = source("src/components/simulations/PulleySystemsAnalysis.astro");
  const projectile = source("src/components/simulations/ProjectileSimulation.astro");
  for (const contents of [kinematics, forces, pulleys]) {
    assert.match(contents, /SimulationGraphsDisclosure/);
    assert.match(contents, /(?:KinematicsChart|SimulationLinkedChart)/);
  }
  assert.doesNotMatch(projectile, /SimulationGraphsDisclosure|data-graphs-disclosure/);
});

test("las actualizaciones de history no dependen de que el disclosure esté abierto", () => {
  const forces = source("src/scripts/forces-friction.js");
  const pulleys = source("src/scripts/pulley-systems.js");
  assert.match(forces, /updateHistoryCharts\(\);/);
  assert.match(pulleys, /appendHistory\(\);[\s\S]*?updateDom\(\);/);
  for (const runtime of [forces, pulleys]) {
    assert.doesNotMatch(runtime, /data-graphs-disclosure|\.open\b/);
  }
});

test("el menú agrupa exactamente las simulaciones publicadas desde el catálogo", () => {
  for (const locale of ["es", "en"]) {
    const published = getPublishedSimulations(locale);
    const groups = getPublishedSimulationNavigationGroups(locale);
    const children = groups.flatMap((group) => group.children);
    const simulationsItem = getNavigation(locale).find((item) => item.labelKey === "nav.simulations");

    assert.deepEqual(groups.map((group) => group.key), ["Cinemática", "Dinámica"]);
    assert.deepEqual(children.map((child) => child.simulationId), published.map((item) => item.id));
    assert.equal(children.length, 4);
    assert.ok(!children.some((child) => child.simulationId === "circular-radial-force"));
    assert.equal(simulationsItem.children[0].labelKey, "nav.simulationsViewAll");
    assert.equal(simulationsItem.groups.length, 2);
  }

  const header = source("src/components/Header.astro");
  assert.match(header, /item\.groups\?\.map/);
  assert.match(header, /isExactCurrent\(child\.href\)/);
  assert.match(header, /<details open=\{active\}>/);
});

test("materiales mantiene siete unidades y usa acciones genéricas sin conteos", () => {
  const catalog = source("src/pages/fisica-basica-1/ejercicios.astro");
  assert.equal(UNITS.length, 7);
  assert.equal(getDevelopedAcademicUnits("es").length, 7);
  assert.ok(getDevelopedAcademicUnits("es").find((unit) => unit.number === 1)?.miniQuizRoute);
  assert.doesNotMatch(catalog, /practice\.exerciseCount|getAcademicUnitAdapter|status-label--featured/);
  assert.doesNotMatch(catalog, /practice\.openPractice|practice\.openMiniQuizzes/);
  assert.match(catalog, /practice\.openMaterial/);
  assert.match(catalog, /practice\.comingSoon/);
});
