import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("fuerzas expone reproducción flotante, análisis externo y medidor completo", () => {
  const component = source("src/components/simulations/ForcesFrictionSimulation.astro");
  const analysis = source("src/components/simulations/ForcesFrictionAnalysis.astro");
  const runtime = source("src/scripts/forces-friction.js");
  assert.match(component, /data-action="toggle"/);
  assert.match(component, /data-action="reset"/);
  assert.match(component, /data-force-toggle="fbd"/);
  assert.match(component, /SimulationFloatingPlayback/);
  assert.match(component, /data-playback-section/);
  assert.match(component, /data-friction-progress/);
  assert.match(component, /data-meter-current/);
  assert.match(component, /data-meter-ratio/);
  assert.match(component, /data-contact-warning/);
  assert.match(analysis, /data-forces-fbd/);
  assert.match(analysis, /data-resolve-weight/);
  assert.match(analysis, /forces-friction-relation/);
  assert.match(runtime, /FIXED_STEP = 1 \/ 120/);
  assert.match(runtime, /HISTORY_LIMIT = 301/);
  assert.match(runtime, /initializeSimulationFloatingPlayback/);
  assert.match(runtime, /static.*kinetic.*contactInvalid/s);
});

test("circular expone corte, tres vectores y auto-pausa del vuelo libre", () => {
  const component = source("src/components/simulations/CircularRadialSimulation.astro");
  const analysis = source("src/components/simulations/CircularRadialAnalysis.astro");
  const runtime = source("src/scripts/circular-radial-force.js");
  assert.match(component, /data-action="cut"/);
  assert.match(component, /data-vector-toggle="velocity"/);
  assert.match(component, /data-vector-toggle="acceleration"/);
  assert.match(component, /data-vector-toggle="tension"/);
  assert.match(component, /data-tension-progress/);
  assert.match(component, /SimulationFloatingPlayback/);
  assert.match(component, /data-playback-section/);
  assert.match(analysis, /data-circular-fbd/);
  assert.match(analysis, /circular-tension-speed/);
  assert.match(analysis, /circular-tension-radius/);
  assert.match(runtime, /cutCircularString/);
  assert.match(runtime, /initializeSimulationFloatingPlayback/);
  assert.match(runtime, /breakTime >= 3/);
});

test("p5 solo presenta estado calculado por modelos puros", () => {
  for (const renderer of ["p5-forces-friction-renderer.js", "p5-circular-radial-renderer.js"]) {
    const code = source(`src/scripts/${renderer}`);
    assert.doesNotMatch(code, /utils\/(forces-friction|circular-radial-force)/);
    assert.match(code, /new p5\(sketch\)/);
    assert.match(code, /p\.noLoop\(\)/);
    assert.match(code, /ResizeObserver/);
  }
  const forces = source("src/scripts/p5-forces-friction-renderer.js");
  const circular = source("src/scripts/p5-circular-radial-renderer.js");
  assert.doesNotMatch(forces, /drawFbd|drawHistory|freeBodyDiagram|historyGraph/);
  assert.doesNotMatch(circular, /fbdShort|freeBodyDiagram|noHorizontalForce/);
});

test("las cuatro simulaciones públicas comparten playback flotante y los previews no lo renderizan", () => {
  for (const componentPath of ["KinematicsSimulation.astro", "ProjectileSimulation.astro", "ForcesFrictionSimulation.astro", "CircularRadialSimulation.astro"]) {
    const component = source(`src/components/simulations/${componentPath}`);
    assert.match(component, /SimulationFloatingPlayback/);
    assert.match(component, /data-playback-section/);
    assert.match(component, /!preview/);
  }
  const helper = source("src/scripts/simulation-floating-playback.js");
  assert.match(helper, /root\.dataset\.preview === "true"/);
});

test("el dispatcher conserva cuatro slots y no inicializa los ocultos", () => {
  const component = source("src/components/simulations/SimulationExperienceRenderer.astro");
  const runtime = source("src/scripts/simulation-renderer-runtime.js");
  for (const rendererId of ["svg-kinematics-1d", "p5-projectile-2d", "p5-forces-friction", "p5-circular-radial-force"]) {
    assert.match(component, new RegExp(`data-renderer-slot="${rendererId}"`));
  }
  assert.match(runtime, /slots\.forEach\(\(slot\) => \{ slot\.hidden = slot !== activeSlot; \}\)/);
  assert.match(runtime, /activeSlot\.querySelector\(client\.selector\)/);
  const labRuntime = source("src/scripts/simulation-lab.js");
  assert.match(labRuntime, /mountedPreviewLocale !== previewLocale/);
  assert.match(labRuntime, /destroySimulationExperienceRenderer\(rendererRoot\)/);
});

test("las páginas bilingües usan el registro confiable y wrappers estáticos", () => {
  const page = source("src/components/pages/SimulationPage.astro");
  const registry = source("src/data/simulation-pages.js");
  assert.doesNotMatch(page, /kinematics \?/);
  assert.match(page, /getSimulationPageDefinition/);
  assert.match(registry, /ROUTE_IDS\.FORCES_FRICTION/);
  assert.match(registry, /ROUTE_IDS\.CIRCULAR_RADIAL_FORCE/);
  for (const route of [
    "src/pages/simulaciones/fuerzas-friccion.astro",
    "src/pages/simulaciones/dinamica-circular.astro",
    "src/pages/en/simulations/forces-friction.astro",
    "src/pages/en/simulations/circular-dynamics.astro",
  ]) assert.ok(fs.existsSync(new URL(`../${route}`, import.meta.url)));
});
