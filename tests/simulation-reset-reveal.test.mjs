import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { createAnalyticsOneShot } from "../src/utils/analytics.js";
import {
  createForcesFrictionInitialSnapshot,
  createForcesFrictionState,
  getForcesFrictionReadings,
  stepForcesFriction,
} from "../src/utils/forces-friction.js";
import { getKinematicsState } from "../src/utils/kinematics-1d.js";
import {
  PROJECTILE_EPSILON,
  getProjectileReveal,
  getProjectileState,
  getProjectileSummary,
} from "../src/utils/projectile-2d.js";

const source = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const close = (actual, expected, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);

const assertRevealEndsAt = (parameters, time, reveal) => {
  const current = getProjectileState(parameters, time);
  const endpoint = reveal.samples.at(-1);
  close(endpoint.time, current.time);
  close(endpoint.position.x, current.position.x);
  close(endpoint.position.y, current.position.y);
  assert.ok(reveal.samples.every((sample) => sample.time <= current.time + PROJECTILE_EPSILON));
};

test("cinemática reinicia el tiempo y el estado sin reemplazar parámetros", () => {
  const parameters = { x0: -7, v0: 9, a: -3, T: 12 };
  const snapshot = structuredClone(parameters);
  assert.notDeepEqual(getKinematicsState(parameters, 4), getKinematicsState(parameters, 0));
  assert.deepEqual(getKinematicsState(parameters, 0), {
    time: 0,
    position: -7,
    displacement: 0,
    distance: 0,
    velocity: 9,
    speed: 9,
    acceleration: -3,
    direction: "hacia +x",
  });
  assert.deepEqual(parameters, snapshot);

  const runtime = source("src/scripts/kinematics-1d.js");
  const resetBody = runtime.match(/const resetPlayback = \(\) => \{([\s\S]*?)\n  \};/)?.[1] ?? "";
  assert.match(resetBody, /pause\(\)/);
  assert.match(resetBody, /state\.time = 0/);
  assert.match(resetBody, /updateFrame\(\)/);
  assert.doesNotMatch(resetBody, /state\.parameters|defaultsFromExperience/);
});

test("proyectil reinicia en el lanzamiento con parámetros intactos y sin futuro visible", () => {
  const parameters = { y0: 8, v0: 24, theta: 37, g: 9.8 };
  const snapshot = structuredClone(parameters);
  const summary = getProjectileSummary(parameters);
  assert.ok(getProjectileState(parameters, summary.flightTime / 2).time > 0);

  const resetState = getProjectileState(parameters, 0);
  const reveal = getProjectileReveal(parameters, 0, 161);
  assert.deepEqual(resetState.position, { x: 0, y: 8 });
  assert.equal(reveal.samples.length, 1);
  assert.equal(reveal.samples[0].time, 0);
  assert.equal(reveal.apexVisible, false);
  assert.equal(reveal.impactVisible, false);
  assert.deepEqual(parameters, snapshot);

  const runtime = source("src/scripts/projectile-2d.js");
  const resetBody = runtime.match(/const resetPlayback = \(\) => \{([\s\S]*?)\n  \};/)?.[1] ?? "";
  assert.match(resetBody, /pause\(\)/);
  assert.match(resetBody, /state\.time = 0/);
  assert.match(resetBody, /updateFrame\(\)/);
  assert.doesNotMatch(resetBody, /state\.parameters|defaultsFromExperience/);
});

test("el revelado del proyectil respeta vértice, impacto y extremo temporal", () => {
  const parameters = { y0: 0, v0: 20, theta: 45, g: 10 };
  const summary = getProjectileSummary(parameters);
  const beforeApexTime = summary.peakTime / 2;
  const afterApexTime = (summary.peakTime + summary.flightTime) / 2;
  const beforeImpactTime = summary.flightTime - 1e-4;

  const initial = getProjectileReveal(parameters, 0, 161);
  assert.equal(initial.samples.length, 1);
  assert.equal(initial.apexVisible, false);
  assert.equal(initial.impactVisible, false);

  const beforeApex = getProjectileReveal(parameters, beforeApexTime, 161);
  assert.equal(beforeApex.apexVisible, false);
  assert.equal(beforeApex.impactVisible, false);
  assertRevealEndsAt(parameters, beforeApexTime, beforeApex);

  const atApex = getProjectileReveal(parameters, summary.peakTime, 161);
  assert.equal(atApex.apexVisible, true);
  assert.equal(atApex.impactVisible, false);
  assertRevealEndsAt(parameters, summary.peakTime, atApex);

  const afterApex = getProjectileReveal(parameters, afterApexTime, 161);
  assert.equal(afterApex.apexVisible, true);
  assert.equal(afterApex.impactVisible, false);
  assertRevealEndsAt(parameters, afterApexTime, afterApex);

  const beforeImpact = getProjectileReveal(parameters, beforeImpactTime, 161);
  assert.equal(beforeImpact.impactVisible, false);
  assertRevealEndsAt(parameters, beforeImpactTime, beforeImpact);

  const impact = getProjectileReveal(parameters, summary.flightTime, 161);
  assert.equal(impact.apexVisible, true);
  assert.equal(impact.impactVisible, true);
  assertRevealEndsAt(parameters, summary.flightTime, impact);
});

test("el scrubber puede avanzar y retroceder el revelado determinísticamente", () => {
  const parameters = { y0: 4, v0: 22, theta: 55, g: 9.8 };
  const summary = getProjectileSummary(parameters);
  const forwardTime = Math.min(summary.flightTime * 0.8, summary.peakTime + 0.2);
  const backwardTime = summary.peakTime / 3;
  const forward = getProjectileReveal(parameters, forwardTime, 161);
  const backward = getProjectileReveal(parameters, backwardTime, 161);
  const repeated = getProjectileReveal(parameters, backwardTime, 161);

  assert.equal(forward.apexVisible, true);
  assert.equal(backward.apexVisible, false);
  assert.equal(backward.impactVisible, false);
  assert.ok(backward.samples.length < forward.samples.length);
  assert.deepEqual(backward, repeated);
  assertRevealEndsAt(parameters, backwardTime, backward);
});

test("fuerzas reinicia dominio, historial y análisis con el objeto completo vigente", () => {
  const parameters = { m: 7, beta: 18, F: 52, alpha: 23, muS: 0.44, muK: 0.27, g: 9.7, v0: -2.5 };
  const snapshot = structuredClone(parameters);
  const advanced = stepForcesFriction(createForcesFrictionState(parameters), parameters, 0.75);
  assert.ok(advanced.t > 0);

  const initial = createForcesFrictionInitialSnapshot(parameters);
  assert.deepEqual(parameters, snapshot);
  assert.equal(initial.state.t, 0);
  assert.equal(initial.state.s, 0);
  assert.equal(initial.state.v, parameters.v0);
  assert.deepEqual(initial.readings, getForcesFrictionReadings(initial.state, parameters));
  assert.deepEqual(initial.history, [{ t: 0, v: parameters.v0, net: initial.readings.netParallel }]);

  const runtime = source("src/scripts/forces-friction.js");
  const resetBody = runtime.match(/const reset = \(message[\s\S]*?=> \{([\s\S]*?)\n  \};/)?.[1] ?? "";
  assert.match(resetBody, /pause\(\)/);
  assert.match(resetBody, /resetDomain\(\)/);
  assert.match(resetBody, /syncControls\(\)/);
  assert.match(resetBody, /updateDom\(\)/);
  assert.match(resetBody, /updateRelationChart\(\)/);
  assert.doesNotMatch(resetBody, /runtime\.parameters\s*=|defaults\(\)/);
});

test("reset y replay conservan simulation_start como one-shot", () => {
  let starts = 0;
  const trackFirstStart = createAnalyticsOneShot(() => { starts += 1; });
  trackFirstStart();
  trackFirstStart();
  assert.equal(starts, 1);

  for (const path of [
    "src/scripts/kinematics-1d.js",
    "src/scripts/projectile-2d.js",
    "src/scripts/forces-friction.js",
  ]) {
    const runtime = source(path);
    assert.equal(runtime.match(/trackFirstStart\(\)/g)?.length, 1, path);
    const resetSection = runtime.match(/const reset(?:Playback)? = [\s\S]*?\n  \};/)?.[0] ?? "";
    assert.doesNotMatch(resetSection, /trackFirstStart/, path);
  }
});
