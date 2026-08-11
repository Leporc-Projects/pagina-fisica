import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  NOTICES,
  getCourseNotices,
  getGlobalNotices,
  getHomepageNotices,
  getPublishedNotices,
} from "../src/data/notices.js";
import {
  NOTICE_CATEGORIES,
  NOTICE_PACK_SCHEMA_VERSION,
  NOTICE_SCHEMA_VERSION,
  NOTICE_STATUSES,
  createNoticeDraft,
  createNoticeId,
  createNoticePack,
  mergeNoticePack,
  noticePackFilename,
  selectHomepageNotices,
  sortNoticesByDate,
  validateNotice,
  validateNoticeHref,
  validateNoticePack,
} from "../src/utils/notices.js";

const deterministicCrypto = (seed = 1) => ({
  state: seed >>> 0,
  getRandomValues(array) {
    for (let index = 0; index < array.length; index += 1) {
      this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
      array[index] = this.state;
    }
    return array;
  },
});

const notice = (overrides = {}) => ({
  ...createNoticeDraft({
    scope: { type: "course", courseId: "fisica-basica-1" },
    title: "Cambio de aula para el taller",
    summary: "La sesión del viernes se realizará en el laboratorio de Física.",
    content: "Consulta el cronograma del curso antes de asistir. Unicode: Δ, θ y ñ.",
    category: "Horario",
    publishedAt: overrides.publishedAt ?? "2026-08-14",
    featured: false,
    href: "/fisica-basica-1/cronograma",
  }, {
    cryptoApi: deterministicCrypto(12),
    id: overrides.id ?? "notice-2026-08-14-001122334455",
  }),
  ...overrides,
});

test("el contrato declara categorías pequeñas y estados editoriales explícitos", () => {
  assert.deepEqual(NOTICE_STATUSES, ["draft", "review", "published", "archived"]);
  assert.deepEqual(NOTICE_CATEGORIES, ["Curso", "Evaluación", "Material", "Horario", "General"]);
  assert.equal(NOTICE_STATUSES.includes("new"), false);
});

test("genera ID y metadatos sin pedirlos al editor", () => {
  const first = createNoticeId("2026-08-14", deterministicCrypto(1));
  const second = createNoticeId("2026-08-14", deterministicCrypto(2));
  assert.match(first, /^notice-2026-08-14-[0-9a-f]{12}$/);
  assert.notEqual(first, second);
  const draft = notice();
  assert.equal(draft.version, 1);
  assert.equal(draft.schemaVersion, "3.0.0");
  assert.equal(NOTICE_SCHEMA_VERSION, "3.0.0");
  assert.equal(NOTICE_PACK_SCHEMA_VERSION, "3.0.0");
  assert.equal(draft.status, "draft");
  assert.equal(validateNotice(draft).valid, true);
});

test("valida fechas reales, IDs únicos, estado y campos obligatorios", () => {
  const valid = notice();
  assert.equal(validateNotice(valid, { existingIds: [valid.id] }).valid, false);
  assert.equal(validateNotice(notice({ publishedAt: "2026-02-30" })).valid, false);
  assert.equal(validateNotice(notice({ status: "new" })).valid, false);
  assert.equal(validateNotice(notice({ title: "" })).valid, false);
  assert.equal(validateNotice(notice({ category: "Sitio" })).valid, false);
  assert.equal(validateNotice(notice({ scope: { type: "global", courseId: "fisica-basica-1" } })).valid, false);
  assert.equal(validateNotice(notice({ scope: { type: "course", courseId: "otro" } })).valid, false);
});

test("solo published es público y el archivo se ordena por fecha", () => {
  const fixtures = [
    notice({ id: "notice-2026-08-10-000000000001", publishedAt: "2026-08-10", status: "draft" }),
    notice({ id: "notice-2026-08-11-000000000002", publishedAt: "2026-08-11", status: "review" }),
    notice({ id: "notice-2026-08-12-000000000003", publishedAt: "2026-08-12", status: "published" }),
    notice({ id: "notice-2026-08-13-000000000004", publishedAt: "2026-08-13", status: "archived" }),
    notice({ id: "notice-2026-08-14-000000000005", publishedAt: "2026-08-14", status: "published" }),
  ];
  assert.deepEqual(getPublishedNotices(fixtures).map((entry) => entry.id), [
    "notice-2026-08-14-000000000005",
    "notice-2026-08-12-000000000003",
  ]);
  assert.deepEqual(sortNoticesByDate(fixtures).map((entry) => entry.publishedAt), [
    "2026-08-14", "2026-08-13", "2026-08-12", "2026-08-11", "2026-08-10",
  ]);
});

test("la portada prioriza featured sin duplicar y respeta el límite", () => {
  const fixtures = [
    notice({ id: "notice-2026-08-15-000000000001", publishedAt: "2026-08-15", status: "published" }),
    notice({ id: "notice-2026-08-12-000000000002", publishedAt: "2026-08-12", status: "published", featured: true }),
    notice({ id: "notice-2026-08-14-000000000003", publishedAt: "2026-08-14", status: "published" }),
    notice({ id: "notice-2026-08-14-000000000003", publishedAt: "2026-08-14", status: "published" }),
  ];
  assert.deepEqual(selectHomepageNotices(fixtures, 2).map((entry) => entry.id), [
    "notice-2026-08-12-000000000002",
    "notice-2026-08-15-000000000001",
  ]);
  assert.deepEqual(getHomepageNotices(2, fixtures).map((entry) => entry.id), [
    "notice-2026-08-12-000000000002",
    "notice-2026-08-15-000000000001",
  ]);
  assert.equal(getHomepageNotices(20, fixtures).length, 3);
});

test("las consultas públicas separan global y curso sin filtrar estados privados", () => {
  const fixtures = [
    notice({ id: "notice-2026-08-10-000000000001", status: "published", scope: { type: "global" } }),
    notice({ id: "notice-2026-08-11-000000000002", status: "draft", scope: { type: "global" } }),
    notice({ id: "notice-2026-08-12-000000000003", status: "published" }),
    notice({ id: "notice-2026-08-13-000000000004", status: "review" }),
    notice({ id: "notice-2026-08-14-000000000005", status: "archived" }),
  ];
  assert.deepEqual(getGlobalNotices(fixtures).map((entry) => entry.id), [
    "notice-2026-08-10-000000000001",
  ]);
  assert.deepEqual(getCourseNotices("fisica-basica-1", fixtures).map((entry) => entry.id), [
    "notice-2026-08-12-000000000003",
  ]);
  assert.throws(() => getCourseNotices("curso-inventado", fixtures), /no registrado/);
  assert.equal(getHomepageNotices(3, fixtures).every((entry) => entry.status === "published"), true);
});

test("acepta rutas internas y HTTPS, y rechaza protocolos maliciosos", () => {
  assert.deepEqual(validateNoticeHref("/fisica-basica-1"), {
    valid: true, kind: "internal", value: "/fisica-basica-1",
  });
  assert.equal(validateNoticeHref("https://example.edu/material").valid, true);
  ["javascript:alert(1)", "data:text/html,test", "http://example.edu", "//example.edu"]
    .forEach((href) => assert.equal(validateNoticeHref(href).valid, false));
});

test("rechaza HTML y conserva Unicode como texto editorial", () => {
  assert.equal(validateNotice(notice({ content: "Usa Δx y θ; javascript: aquí es solo texto." })).valid, true);
  assert.equal(validateNotice(notice({ content: "<img src=x onerror=alert(1)>" })).valid, false);
  assert.equal(validateNotice(notice({ title: "<script>alert(1)</script>" })).valid, false);
});

test("valida el notice pack y fuerza review durante la importación", () => {
  const draft = notice();
  const pack = createNoticePack([draft], {
    cryptoApi: deterministicCrypto(4),
    createdAt: "2026-08-14T16:00:00.000Z",
  });
  assert.equal(validateNoticePack(pack).valid, true);
  assert.equal(pack.source, "teacher");
  assert.match(noticePackFilename(pack), /^aula-fisica-notice-pack-2026-08-14-[0-9a-f]{8}\.json$/);
  const merge = mergeNoticePack(pack, []);
  assert.equal(merge.imported[0].status, "review");
  assert.equal(merge.imported[0].content.includes("Δ"), true);
  assert.deepEqual(merge.imported[0].scope, { type: "course", courseId: "fisica-basica-1" });
  assert.equal(merge.notices.some((entry) => entry.status === "published"), false);
});

test("rechaza paquetes inválidos y duplicados dentro o fuera del paquete", () => {
  const draft = notice();
  const duplicatePack = createNoticePack([draft, draft], { cryptoApi: deterministicCrypto(5) });
  assert.equal(validateNoticePack(duplicatePack).valid, false);
  const pack = createNoticePack([draft], { cryptoApi: deterministicCrypto(6) });
  assert.throws(() => mergeNoticePack(pack, [draft]), /ya existe/);
  assert.equal(validateNoticePack({ ...pack, source: "unknown" }).valid, false);
  assert.equal(validateNoticePack({ ...pack, createdAt: "hoy" }).valid, false);
  const legacy = { ...pack, schemaVersion: "1.0.0" };
  assert.equal(validateNoticePack(legacy).valid, false);
  assert.throws(() => mergeNoticePack(legacy, []), /anteriores a 3\.x/);
});

test("los avisos reales conservan sus datos y tienen el ámbito editorial esperado", () => {
  assert.equal(NOTICES.length, 2);
  assert.equal(NOTICES.every((entry) => validateNotice(entry).valid), true);
  const globalNotice = NOTICES.find((entry) => entry.title === "¿Cómo sabemos cuanto mide un segundo?");
  const courseNotice = NOTICES.find((entry) => entry.title === "Universo Mecánico: la caída de los cuerpos");
  assert.deepEqual(globalNotice?.scope, { type: "global" });
  assert.equal(globalNotice?.href, "https://www.youtube.com/watch?v=GGDMi7za85s");
  assert.deepEqual(courseNotice?.scope, { type: "course", courseId: "fisica-basica-1" });
  assert.equal(courseNotice?.featured, true);
  assert.equal(courseNotice?.status, "published");
  assert.match(courseNotice?.href ?? "", /^https:\/\/www\.youtube\.com\//);
});

test("import:notices procesa un fixture temporal y nunca publica", (context) => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "aula-fisica-notices-"));
  context.after(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));
  const source = path.join(temporaryDirectory, "pack.json");
  const target = path.join(temporaryDirectory, "notices.json");
  const legacySource = path.join(temporaryDirectory, "legacy-pack.json");
  const legacyTarget = path.join(temporaryDirectory, "legacy-notices.json");
  const pack = createNoticePack([notice()], {
    cryptoApi: deterministicCrypto(7),
    createdAt: "2026-08-14T17:00:00.000Z",
  });
  fs.writeFileSync(source, JSON.stringify(pack), "utf8");
  fs.writeFileSync(target, "[]\n", "utf8");
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL("../scripts/import-notices.mjs", import.meta.url)),
    source,
    "--target",
    target,
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /estado review/);
  const stored = JSON.parse(fs.readFileSync(target, "utf8"));
  assert.equal(stored.length, 1);
  assert.equal(stored[0].status, "review");

  const repeated = spawnSync(process.execPath, [
    fileURLToPath(new URL("../scripts/import-notices.mjs", import.meta.url)), source, "--target", target,
  ], { encoding: "utf8" });
  assert.notEqual(repeated.status, 0);
  assert.match(repeated.stderr, /ya existe/);

  fs.writeFileSync(legacySource, JSON.stringify({ ...pack, schemaVersion: "1.0.0" }), "utf8");
  fs.writeFileSync(legacyTarget, "[]\n", "utf8");
  const legacy = spawnSync(process.execPath, [
    fileURLToPath(new URL("../scripts/import-notices.mjs", import.meta.url)),
    legacySource,
    "--target",
    legacyTarget,
  ], { encoding: "utf8" });
  assert.notEqual(legacy.status, 0);
  assert.match(legacy.stderr, /paquetes 1\.x no declaran ámbito/);
  assert.deepEqual(JSON.parse(fs.readFileSync(legacyTarget, "utf8")), []);
});

test("el editor exige campos, previsualiza, exporta y usa APIs de texto seguras", () => {
  const component = fs.readFileSync(new URL("../src/components/notices/NoticeEditor.astro", import.meta.url), "utf8");
  const client = fs.readFileSync(new URL("../src/scripts/notice-editor.js", import.meta.url), "utf8");
  assert.match(component, /name="title"[^>]*required/);
  assert.match(component, /name="summary"/);
  assert.match(component, /name="content"/);
  assert.match(component, /name="featured"/);
  assert.match(component, /name="href"/);
  assert.match(component, /name="scope"[^>]*required/);
  assert.match(component, /COURSES\.map/);
  assert.match(component, /data-notice-preview/);
  assert.match(client, /createNoticePack/);
  assert.match(client, /textContent/);
  assert.doesNotMatch(client, /innerHTML|insertAdjacentHTML|eval\s*\(/);
  assert.doesNotMatch(client, /localStorage|sessionStorage|fetch\s*\(/);
  assert.match(client, /contentScopeLabel/);
});

test("las rutas públicas y la tarjeta compacta conservan enlaces seguros y ámbitos separados", () => {
  const generalPage = fs.readFileSync(new URL("../src/pages/avisos.astro", import.meta.url), "utf8");
  const coursePage = fs.readFileSync(new URL("../src/pages/fisica-basica-1/avisos.astro", import.meta.url), "utf8");
  const homepage = fs.readFileSync(new URL("../src/components/pages/HomePage.astro", import.meta.url), "utf8");
  const card = fs.readFileSync(new URL("../src/components/NoticeCard.astro", import.meta.url), "utf8");
  assert.match(generalPage, /getGlobalNotices/);
  assert.doesNotMatch(generalPage, /getPublishedNotices/);
  assert.match(coursePage, /getCourseNotices\(COURSE\.id\)/);
  assert.match(coursePage, /\/avisos/);
  assert.match(homepage, /showScope/);
  assert.match(homepage, /getHomepageNotices\(3/);
  assert.match(card, /href &&/);
  assert.match(card, /target=\{external \? "_blank"/);
  assert.match(card, /rel=\{external \? "noopener noreferrer"/);
  assert.doesNotMatch(card, /compact && href|!compact && href/);
});
