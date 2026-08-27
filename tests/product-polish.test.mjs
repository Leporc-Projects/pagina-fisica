import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { getMiniQuizzesByUnit } from "../src/data/mini-quizzes/index.js";
import { localizeUnit1 } from "../src/data/physics/unit-1/localize.js";
import { getLocalizedPath, ROUTE_IDS } from "../src/i18n/routes.js";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("mini quices tienen identidad canónica bilingüe y Bonos queda como producto futuro", () => {
  assert.equal(getLocalizedPath(ROUTE_IDS.COURSE_MINI_QUIZZES, "es"), "/fisica-basica-1/mini-quices");
  assert.equal(getLocalizedPath(ROUTE_IDS.COURSE_MINI_QUIZZES, "en"), "/en/basic-physics-1/mini-quizzes");
  assert.equal(localizeUnit1("es").miniQuizRoute, "/fisica-basica-1/mini-quices");
  assert.equal(localizeUnit1("en").miniQuizRoute, "/en/basic-physics-1/mini-quizzes");
  assert.equal(localizeUnit1("es").bonusRoute, null);
  assert.equal(getMiniQuizzesByUnit(1).length, 4);
  assert.match(read("docs/BONUSES_PRODUCT_VISION.md"), /producto futuro distinto/);
});

test("las rutas históricas solo redirigen y no renderizan una segunda página canónica", () => {
  assert.match(read("src/pages/fisica-basica-1/bonos/index.astro"), /Astro\.redirect\("\/fisica-basica-1\/mini-quices", 301\)/);
  assert.match(read("src/pages/en/basic-physics-1/bonuses/index.astro"), /Astro\.redirect\("\/en\/basic-physics-1\/mini-quizzes", 301\)/);
  assert.ok(fs.existsSync(fileURLToPath(new URL("../src/pages/fisica-basica-1/mini-quices/index.astro", import.meta.url))));
  assert.ok(fs.existsSync(fileURLToPath(new URL("../src/pages/en/basic-physics-1/mini-quizzes/index.astro", import.meta.url))));
});

test("el catálogo distingue práctica, mini quices y Bonos en cada unidad", () => {
  const catalog = read("src/pages/fisica-basica-1/ejercicios.astro");
  assert.match(catalog, /practice\.product\.practice/);
  assert.match(catalog, /practice\.product\.miniQuizzes/);
  assert.match(catalog, /practice\.product\.bonuses/);
  assert.match(catalog, /miniQuizRoute/);
  assert.doesNotMatch(catalog, /\.bonusRoute/);
});

test("Participa elimina los bloques visuales redundantes y conserva el live region", () => {
  const page = read("src/components/participation/ParticipationPage.astro");
  assert.doesNotMatch(page, /class=["'][^"']*participation-intro/);
  assert.doesNotMatch(page, /class=["'][^"']*participation-status/);
  assert.match(page, /class="sr-only" aria-live="polite" aria-atomic="true" data-participation-status/);
  assert.match(read("src/scripts/participation.js"), /data-participation-status/);
});
