import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const readRepositoryFile = (relativePath) => fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");

test("AGENTS referencia rutas canónicas existentes", () => {
  const agents = readRepositoryFile("AGENTS.md");
  const references = new Set(
    [...agents.matchAll(/`(docs\/[^`]+\.md)`/gu)].map((match) => match[1]),
  );

  assert.ok(references.size >= 10);
  for (const reference of references) {
    assert.equal(fs.existsSync(path.join(repositoryRoot, reference)), true, reference);
  }
});

test("package.json conserva los comandos estándar del workflow", () => {
  const { scripts } = JSON.parse(readRepositoryFile("package.json"));

  for (const command of ["test", "test:charts", "validate", "verify", "build", "stats:loc"]) {
    assert.equal(typeof scripts[command], "string", command);
    assert.ok(scripts[command].trim(), command);
  }
});

test("la plantilla es reusable y no fija un SHA de producción", () => {
  const template = readRepositoryFile("docs/CODEX_BLOCK_TEMPLATE.md");
  const permanentRulesNotice = [
    "Read and obey the repository root `AGENTS.md` and the canonical documents it references.",
    "Do not duplicate those permanent rules here.",
  ].join(" ");

  for (const placeholder of [
    "<BLOCK_NAME>",
    "<BASELINE_SHA>",
    "<BRANCH>",
    "<OBJECTIVE>",
    "<FILES_TO_INSPECT>",
    "<FOCUSED_TESTS>",
    "<HUMAN_QA>",
  ]) {
    assert.match(template, new RegExp(placeholder, "u"), placeholder);
  }
  assert.ok(template.includes(permanentRulesNotice));
  assert.doesNotMatch(template, /\b[0-9a-f]{40}\b/iu);
});
