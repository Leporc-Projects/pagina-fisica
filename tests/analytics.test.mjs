import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  ANALYTICS_EVENT_CONTRACTS,
  createAnalyticsOneShot,
  trackLanguageChange,
  trackMiniQuizComplete,
  trackMiniQuizStart,
  trackPracticeNewBatch,
  trackSimulationStart,
  validateAnalyticsEvent,
} from "../src/utils/analytics.js";
import { getPublishedSimulations } from "../src/data/simulations.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => fs.readFileSync(`${root}/${path}`, "utf8");

test("el tracker global aparece exactamente una vez y conserva el contrato privado", () => {
  const sourceFiles = [
    ...fs.readdirSync(`${root}/src/layouts`).map((name) => `src/layouts/${name}`),
    ...fs.readdirSync(`${root}/src/components`).filter((name) => name.endsWith(".astro")).map((name) => `src/components/${name}`),
  ];
  const trackerOccurrences = sourceFiles.reduce(
    (count, path) => count + (read(path).match(/cloud\.umami\.is\/script\.js/g)?.length ?? 0),
    0
  );
  assert.equal(trackerOccurrences, 1);

  const layout = read("src/layouts/BaseLayout.astro");
  assert.match(layout, /<script\s+[\s\S]*?defer[\s\S]*?src="https:\/\/cloud\.umami\.is\/script\.js"/);
  assert.match(layout, /data-website-id="c79206e3-4e9e-4f10-92e0-574e57121bb4"/);
  assert.match(layout, /data-domains="aulafisica\.com,www\.aulafisica\.com"/);
  assert.match(layout, /data-exclude-search="true"/);
  assert.match(layout, /data-exclude-hash="true"/);
  assert.match(layout, /data-do-not-track="true"/);
  assert.doesNotMatch(layout, /data-performance|data-auto-track="false"/);
});

test("la allowlist contiene solo cinco eventos y propiedades académicas mínimas", () => {
  assert.deepEqual(Object.keys(ANALYTICS_EVENT_CONTRACTS), [
    "simulation_start",
    "practice_new_batch",
    "mini_quiz_start",
    "mini_quiz_complete",
    "language_change",
  ]);
  assert.deepEqual(ANALYTICS_EVENT_CONTRACTS.simulation_start, ["simulation", "locale"]);
  assert.deepEqual(ANALYTICS_EVENT_CONTRACTS.practice_new_batch, ["unit", "locale"]);
  assert.deepEqual(ANALYTICS_EVENT_CONTRACTS.mini_quiz_start, ["quiz", "locale"]);
  assert.deepEqual(ANALYTICS_EVENT_CONTRACTS.mini_quiz_complete, ["quiz", "locale"]);
  assert.deepEqual(ANALYTICS_EVENT_CONTRACTS.language_change, ["from_locale", "to_locale", "route_id?"]);

  const serialized = JSON.stringify(ANALYTICS_EVENT_CONTRACTS);
  for (const forbidden of ["score", "answer", "email", "name", "studentId", "freeText", "url", "query", "hash"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("la validación rechaza eventos desconocidos, locales, unidades y payloads extra", () => {
  assert.equal(validateAnalyticsEvent("simulation_start", { simulation: "kinematics-1d", locale: "es" }), true);
  assert.equal(validateAnalyticsEvent("unknown", {}), false);
  assert.equal(validateAnalyticsEvent("simulation_start", { simulation: "kinematics-1d", locale: "fr" }), false);
  assert.equal(validateAnalyticsEvent("simulation_start", { simulation: "circular-radial-force", locale: "es" }), false);
  assert.equal(validateAnalyticsEvent("practice_new_batch", { unit: 0, locale: "es" }), false);
  assert.equal(validateAnalyticsEvent("practice_new_batch", { unit: 7.5, locale: "en" }), false);
  assert.equal(validateAnalyticsEvent("practice_new_batch", { unit: 7, locale: "en", score: 10 }), false);
  assert.equal(validateAnalyticsEvent("language_change", { from_locale: "es", to_locale: "es" }), false);
  assert.equal(validateAnalyticsEvent("language_change", { from_locale: "es", to_locale: "en", route_id: "/path?x=1" }), false);
});

test("el wrapper es no-op sin Umami y contiene fallos del tracker", () => {
  const previousWindow = globalThis.window;
  try {
    delete globalThis.window;
    assert.equal(trackSimulationStart("kinematics-1d", "es"), false);
    globalThis.window = {};
    assert.equal(trackPracticeNewBatch(1, "en"), false);
    globalThis.window = { umami: { track: () => { throw new Error("blocked"); } } };
    assert.equal(trackMiniQuizStart("bonus-u1-review", "es"), false);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("las funciones semánticas envían únicamente los payloads autorizados", () => {
  const previousWindow = globalThis.window;
  const calls = [];
  try {
    globalThis.window = { umami: { track: (...args) => calls.push(args) } };
    assert.equal(trackSimulationStart("forces-friction", "en"), true);
    assert.equal(trackPracticeNewBatch(6, "es"), true);
    assert.equal(trackMiniQuizStart("bonus-u1-review", "en"), true);
    assert.equal(trackMiniQuizComplete("bonus-u1-review", "en"), true);
    assert.equal(trackLanguageChange("es", "en", "course.unit1"), true);
    assert.deepEqual(calls, [
      ["simulation_start", { simulation: "forces-friction", locale: "en" }],
      ["practice_new_batch", { unit: 6, locale: "es" }],
      ["mini_quiz_start", { quiz: "bonus-u1-review", locale: "en" }],
      ["mini_quiz_complete", { quiz: "bonus-u1-review", locale: "en" }],
      ["language_change", { from_locale: "es", to_locale: "en", route_id: "course.unit1" }],
    ]);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("el one-shot consume el primer inicio aunque el proveedor esté bloqueado", () => {
  let count = 0;
  const firstStart = createAnalyticsOneShot(() => { count += 1; });
  assert.equal(firstStart(), true);
  assert.equal(firstStart(), false);
  assert.equal(firstStart(), false);
  assert.equal(count, 1);
  assert.throws(() => createAnalyticsOneShot(null), /requires a function/);
});

test("solo las cuatro simulaciones públicas instrumentan un primer start", () => {
  const publicIds = getPublishedSimulations("es").map(({ id }) => id).sort();
  assert.deepEqual(publicIds, ["forces-friction", "kinematics-1d", "projectile-2d", "pulley-systems"]);
  const sources = {
    "forces-friction": read("src/scripts/forces-friction.js"),
    "kinematics-1d": read("src/scripts/kinematics-1d.js"),
    "projectile-2d": read("src/scripts/projectile-2d.js"),
    "pulley-systems": read("src/scripts/pulley-systems.js"),
  };
  for (const [id, source] of Object.entries(sources)) {
    assert.match(source, new RegExp(`trackSimulationStart\\("${id}", locale\\)`));
    assert.equal(source.match(/trackFirstStart\(\)/g)?.length, 1);
    assert.match(source, /createAnalyticsOneShot/);
  }
  assert.doesNotMatch(read("src/scripts/circular-radial-force.js"), /trackSimulationStart|createAnalyticsOneShot/);
});

test("práctica, mini quiz e idioma disparan solo desde acciones explícitas", () => {
  const practice = read("src/scripts/open-practice.js");
  assert.equal(practice.match(/trackPracticeNewBatch\(/g)?.length, 1);
  assert.match(practice, /newBatch\.addEventListener\("click", \(\) => \{[\s\S]*trackPracticeNewBatch\(unit, locale\)/);
  assert.doesNotMatch(practice.match(/const initialId[\s\S]*$/)?.[0] ?? "", /trackPracticeNewBatch/);

  const quiz = read("src/scripts/bonus.js");
  assert.equal(quiz.match(/trackMiniQuizStart\(/g)?.length, 1);
  assert.equal(quiz.match(/trackMiniQuizComplete\(/g)?.length, 1);
  assert.match(quiz, /const startAttempt[\s\S]*trackMiniQuizStart\(bonus\.id, locale\)/);
  assert.match(quiz, /const finishAttempt[\s\S]*trackMiniQuizComplete\(bonus\.id, locale\)/);
  assert.doesNotMatch(quiz.split("const startAttempt")[0], /trackMiniQuizStart\(/);

  const language = read("src/scripts/language-analytics.js");
  assert.match(language, /addEventListener\("click"/);
  assert.doesNotMatch(language, /location|href|search|hash/);
});

test("la implementación no identifica, persiste ni introduce credenciales", () => {
  const analyticsModules = [
    "src/utils/analytics.js",
    "src/scripts/language-analytics.js",
    "src/scripts/open-practice.js",
    "src/scripts/bonus.js",
    "src/scripts/kinematics-1d.js",
    "src/scripts/projectile-2d.js",
    "src/scripts/forces-friction.js",
    "src/scripts/pulley-systems.js",
  ].map(read).join("\n");
  const implementation = `${read("src/layouts/BaseLayout.astro")}\n${analyticsModules}`;
  assert.doesNotMatch(implementation, /umami\s*\.\s*identify\s*\(/);
  assert.doesNotMatch(analyticsModules, /localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(implementation, /api[_-]?key|authorization\s*:/i);
  assert.doesNotMatch(implementation, /data-performance|session.?replay|heatmap/i);
});

test("la transparencia y su enlace de footer existen en ES y EN", () => {
  assert.equal(fs.existsSync(`${root}/src/pages/privacidad-analitica.astro`), true);
  assert.equal(fs.existsSync(`${root}/src/pages/en/analytics-privacy.astro`), true);
  const footer = read("src/components/Footer.astro");
  assert.match(footer, /ROUTE_IDS\.ANALYTICS_PRIVACY/);
  assert.match(footer, /analytics\.footerLink/);
});
