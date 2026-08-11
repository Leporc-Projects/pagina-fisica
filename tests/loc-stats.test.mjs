import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { categorizePath, collectLocStats, countPhysicalLines } from "../scripts/loc-stats.mjs";

test("LOC cuenta líneas físicas con y sin salto final", () => {
  assert.equal(countPhysicalLines(""), 0);
  assert.equal(countPhysicalLines("uno"), 1);
  assert.equal(countPhysicalLines("uno\ndos\n"), 2);
});

test("LOC separa código, datos editoriales y documentación", () => {
  assert.equal(categorizePath("src/pages/index.astro"), "application");
  assert.equal(categorizePath("scripts/validate.mjs"), "tooling");
  assert.equal(categorizePath("tests/i18n.test.mjs"), "tests");
  assert.equal(categorizePath("src/data/notices.json"), "editorialData");
  assert.equal(categorizePath("docs/I18N.md"), "documentation");
  assert.equal(categorizePath("package-lock.json"), null);
});

test("LOC mide el worktree y un ref sin cambiar de checkout", () => {
  const worktree = collectLocStats();
  const head = collectLocStats({ ref: "HEAD" });
  assert.equal(worktree.ref, "WORKTREE");
  assert.match(head.ref, /^[0-9a-f]{40}$/);
  assert.ok(worktree.relevantTotal > 0);
  assert.ok(head.relevantTotal > 0);
});

test("LOC informa claramente un ref inválido", () => {
  const script = fileURLToPath(new URL("../scripts/loc-stats.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [script, "--ref", "ref-que-no-existe"], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /No fue posible medir LOC/);
});
