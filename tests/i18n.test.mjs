import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { DEFAULT_LOCALE, LOCALES, SUPPORTED_LOCALES, assertSupportedLocale, getLocaleFromPath } from "../src/i18n/config.js";
import { UI_DICTIONARIES, formatNumber, getDictionaryKeys, t } from "../src/i18n/index.js";
import { getLanguageMetadata } from "../src/i18n/metadata.js";
import { LOCALIZED_ROUTES, ROUTE_IDS, getLocalizedPath, getRouteCounterpart, getRouteIdFromPath } from "../src/i18n/routes.js";
import { SITE } from "../src/data/site.js";
import { SIMULATION_EXPERIENCES, localizeSimulationExperience } from "../src/data/simulation-experiences.js";
import { SIMULATION_CATEGORIES, SIMULATION_CATEGORY_KEYS } from "../src/data/simulations.js";

const root = fileURLToPath(new URL("../", import.meta.url));

test("el registro declara español por defecto e inglés como locale secundario", () => {
  assert.equal(DEFAULT_LOCALE, "es");
  assert.deepEqual(SUPPORTED_LOCALES, ["es", "en"]);
  assert.deepEqual(LOCALES.en, { id: "en", htmlLang: "en", intlLocale: "en-US", label: "English", short: "EN" });
  assert.equal(getLocaleFromPath("/en/simulations"), "en");
  assert.equal(getLocaleFromPath("/simulaciones"), "es");
  assert.throws(() => assertSupportedLocale("fr"), /Unsupported locale/);
});

test("los diccionarios tienen paridad exacta y valores no vacíos", () => {
  assert.deepEqual(getDictionaryKeys("es"), getDictionaryKeys("en"));
  Object.values(UI_DICTIONARIES).forEach((dictionary) => {
    assert.ok(Object.values(dictionary).every((value) => typeof value === "string" && value.length > 0));
  });
});

test("todas las categorías del catálogo tienen etiqueta bilingüe", () => {
  for (const category of SIMULATION_CATEGORIES) {
    const key = SIMULATION_CATEGORY_KEYS[category];
    assert.ok(key);
    assert.notEqual(t("es", key), t("en", key));
  }
});

test("t exige claves y parámetros conocidos y no interpola markup", () => {
  assert.equal(t("en", "shell.semester", { semester: "2026-2" }), "Semester 2026-2");
  assert.throws(() => t("en", "missing.key"), /Missing translation key/);
  assert.throws(() => t("en", "shell.semester"), /Missing interpolation parameter/);
  assert.throws(() => t("en", "shell.semester", { semester: "<b>bad</b>" }), /markup/);
});

test("los errores visibles de simulación se localizan sin cambiar sus valores", () => {
  const params = { label: "Initial position", minimum: -50, maximum: 50, unit: "m" };
  assert.equal(
    t("en", "simulation.valueOutOfRange", params),
    "Initial position must be between -50 and 50 m."
  );
  assert.match(t("es", "simulation.valueOutOfRange", params), /debe estar entre -50 y 50 m/);
});

test("los controles flotantes conservan labels accesibles bilingües", () => {
  assert.equal(t("es", "simulation.playSimulation"), "Reproducir simulación");
  assert.equal(t("en", "simulation.pauseSimulation"), "Pause simulation");
  assert.equal(t("en", "simulation.resetSimulation"), "Reset simulation");
  assert.equal(t("es", "simulation.currentTime", { time: "1,25 s" }), "Tiempo actual: 1,25 s");
});

test("el formato numérico usa Intl sin alterar los inputs computacionales", () => {
  assert.equal(formatNumber("es", 9.8), "9,8");
  assert.equal(formatNumber("en", 9.8), "9.8");
  assert.equal(String(9.8), "9.8");
});

test("las rutas bilingües son humanas, reversibles y no crean prefijo /es", () => {
  assert.equal(getLocalizedPath(ROUTE_IDS.HOME, "es"), "/");
  assert.equal(getLocalizedPath(ROUTE_IDS.KINEMATICS_1D, "en"), "/en/simulations/kinematics-1d");
  assert.equal(getRouteIdFromPath("/en/simulations/projectile-2d/"), ROUTE_IDS.PROJECTILE_2D);
  assert.equal(getRouteCounterpart("/simulaciones/proyectil-2d", "en"), "/en/simulations/projectile-2d");
  assert.equal(getRouteCounterpart("/en/simulations/projectile-2d", "es"), "/simulaciones/proyectil-2d");
  assert.equal(getRouteCounterpart("/fisica-basica-1", "en"), null);
  assert.ok(Object.values(LOCALIZED_ROUTES).every((routes) => !String(routes.es).startsWith("/es")));
});

test("metadata produce canonical, alternates y x-default correctos", () => {
  assert.deepEqual(getLanguageMetadata("en", ROUTE_IDS.SIMULATIONS), {
    htmlLang: "en",
    canonicalPath: "/en/simulations",
    alternates: [
      { hreflang: "es", path: "/simulaciones" },
      { hreflang: "en", path: "/en/simulations" },
    ],
    xDefaultPath: "/simulaciones",
  });
});

test("la marca y la física son invariantes mientras el texto editorial cambia", () => {
  assert.equal(SITE.name, "Aula Física");
  for (const canonical of SIMULATION_EXPERIENCES) {
    const es = localizeSimulationExperience(canonical, "es");
    const en = localizeSimulationExperience(canonical, "en");
    assert.equal(es.modelId, en.modelId);
    assert.deepEqual(es.parameters, en.parameters);
    assert.deepEqual(es.views, en.views);
    assert.notEqual(es.title, en.title);
    assert.ok(en.presets.every((preset) => /^[\x00-\x7F–“”]+$/.test(preset.label)));
  }
});

test("las rutas publicadas usan shell localizado y no crean páginas académicas inglesas", () => {
  const englishRoutes = [
    "src/pages/en/index.astro",
    "src/pages/en/simulations/index.astro",
    "src/pages/en/simulations/kinematics-1d.astro",
    "src/pages/en/simulations/projectile-2d.astro",
  ];
  englishRoutes.forEach((relativePath) => assert.equal(fs.existsSync(`${root}/${relativePath}`), true));
  assert.equal(fs.existsSync(`${root}/src/pages/en/fisica-basica-1`), false);
  assert.match(fs.readFileSync(`${root}/src/components/Header.astro`, "utf8"), /t\(locale/);
  assert.match(fs.readFileSync(`${root}/src/scripts/projectile-2d.js`, "utf8"), /projectile\.rendererError/);
});

test("agregar otro locale queda limitado al registro, diccionario, rutas y contenido", () => {
  Object.values(LOCALES).forEach((locale) => {
    assert.ok(locale.htmlLang && locale.intlLocale && locale.label && locale.short);
  });
  assert.deepEqual(Object.keys(UI_DICTIONARIES), SUPPORTED_LOCALES);
  Object.values(LOCALIZED_ROUTES).forEach((routes) => {
    assert.deepEqual(Object.keys(routes), SUPPORTED_LOCALES);
  });
});
