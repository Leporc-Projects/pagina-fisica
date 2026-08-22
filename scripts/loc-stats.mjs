import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const codeExtensions = new Set([".astro", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".css", ".scss", ".html"]);
const excludedSegments = new Set(["node_modules", "dist", ".git", ".cache", "coverage"]);
const binaryExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".pdf", ".zip", ".woff", ".woff2", ".ttf", ".mp4", ".mp3"]);

export const countPhysicalLines = (source) => {
  if (source.length === 0) return 0;
  const lineBreaks = source.match(/\n/g)?.length ?? 0;
  return lineBreaks + (source.endsWith("\n") ? 0 : 1);
};

// Git almacena un symlink como el texto de su destino. Replicar esa lectura en
// el worktree evita que el mismo ref cambie de LOC según el modo de medición.
export const readWorktreeBytes = (filePath) => fs.lstatSync(filePath).isSymbolicLink()
  ? Buffer.from(fs.readlinkSync(filePath))
  : fs.readFileSync(filePath);

export const categorizePath = (relativePath) => {
  const normalized = relativePath.replaceAll("\\", "/");
  const segments = normalized.split("/");
  if (segments.some((segment) => excludedSegments.has(segment)) || normalized === "package-lock.json") return null;
  const extension = path.posix.extname(normalized).toLowerCase();
  if (binaryExtensions.has(extension)) return null;
  if (normalized === "README.md" || normalized === "AGENTS.md" || normalized.startsWith("docs/") || extension === ".md") return "documentation";
  if (normalized.startsWith("tests/")) return codeExtensions.has(extension) ? "tests" : null;
  if (normalized.startsWith("src/data/") && [".json", ".csv", ".tsv"].includes(extension)) return "editorialData";
  if (normalized.startsWith("src/")) return codeExtensions.has(extension) ? "application" : null;
  if (normalized.startsWith("scripts/") || normalized.startsWith(".github/workflows/") || /^(astro|vite|eslint|prettier)\.config\./.test(normalized)) {
    return [".json", ".yml", ".yaml"].includes(extension) || codeExtensions.has(extension) ? "tooling" : null;
  }
  if (normalized === "package.json") return "tooling";
  return null;
};

const runGit = (args, { encoding = "utf8" } = {}) => {
  const result = spawnSync("git", args, { cwd: projectRoot, encoding, maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(String(result.stderr || result.stdout || "git command failed").trim());
  return result.stdout;
};

const currentFiles = () => String(runGit(["ls-files", "--cached", "--others", "--exclude-standard", "-z"]))
  .split("\0")
  .filter(Boolean)
  // `git ls-files --cached` conserva rutas eliminadas hasta el próximo commit.
  // Excluirlas permite medir honestamente el worktree durante una migración.
  .filter((relativePath) => fs.existsSync(path.join(projectRoot, relativePath)))
  .sort();

const refFiles = (ref) => String(runGit(["ls-tree", "-r", "--name-only", "-z", ref]))
  .split("\0").filter(Boolean).sort();

const readAtRef = (ref, relativePath) => runGit(["show", `${ref}:${relativePath}`], { encoding: "buffer" });

export const collectLocStats = ({ ref } = {}) => {
  let resolvedRef = "WORKTREE";
  if (ref) {
    resolvedRef = String(runGit(["rev-parse", "--verify", `${ref}^{commit}`])).trim();
  }
  const files = ref ? refFiles(resolvedRef) : currentFiles();
  const totals = { application: 0, tooling: 0, tests: 0, editorialData: 0, documentation: 0 };
  for (const relativePath of files) {
    const category = categorizePath(relativePath);
    if (!category) continue;
    const bytes = ref
      ? readAtRef(resolvedRef, relativePath)
      : readWorktreeBytes(path.join(projectRoot, relativePath));
    if (bytes.includes(0)) continue;
    totals[category] += countPhysicalLines(bytes.toString("utf8"));
  }
  const codeTotal = totals.application + totals.tooling + totals.tests;
  return {
    ref: resolvedRef,
    ...totals,
    codeTotal,
    relevantTotal: codeTotal + totals.editorialData + totals.documentation,
  };
};

const render = (stats) => [
  `Ref: ${stats.ref}`,
  `Application: ${stats.application}`,
  `Tooling: ${stats.tooling}`,
  `Tests: ${stats.tests}`,
  `CODE TOTAL: ${stats.codeTotal}`,
  `Editorial data: ${stats.editorialData}`,
  `Documentation: ${stats.documentation}`,
  `RELEVANT TOTAL: ${stats.relevantTotal}`,
].join("\n");

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const refIndex = args.indexOf("--ref");
  if (args.some((argument, index) => argument.startsWith("--") && !(argument === "--ref" || index === refIndex + 1)) || (refIndex !== -1 && !args[refIndex + 1])) {
    console.error("Uso: npm run stats:loc -- [--ref <git-ref>]");
    process.exitCode = 2;
  } else {
    try {
      console.log(render(collectLocStats({ ref: refIndex === -1 ? undefined : args[refIndex + 1] })));
    } catch (error) {
      console.error(`No fue posible medir LOC: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }
}
