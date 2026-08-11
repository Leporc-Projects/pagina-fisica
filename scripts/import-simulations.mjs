import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { mergeSimulationExperiencePack } from "../src/utils/simulation-experience.js";

const args = process.argv.slice(2);
const sourceArgument = args[0];
const targetFlagIndex = args.indexOf("--target");
const targetArgument = targetFlagIndex >= 0 ? args[targetFlagIndex + 1] : undefined;

if (!sourceArgument || targetFlagIndex >= 0 && !targetArgument) {
  console.error("Uso: npm run import:simulations -- archivo.json [--target ruta/experiencias.json]");
  process.exit(1);
}

const sourcePath = path.resolve(process.cwd(), sourceArgument);
if (path.extname(sourcePath).toLocaleLowerCase("en") !== ".json") {
  console.error("El importador solo admite paquetes JSON.");
  process.exit(1);
}

let pack;
try {
  pack = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
} catch (error) {
  console.error(`No fue posible leer un JSON válido: ${error.message}`);
  process.exit(1);
}

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const targetPath = targetArgument
  ? path.resolve(process.cwd(), targetArgument)
  : path.join(projectRoot, "src/data/simulation-experiences.json");

if (path.extname(targetPath).toLocaleLowerCase("en") !== ".json") {
  console.error("El almacenamiento editorial debe ser un archivo JSON.");
  process.exit(1);
}

let current;
try {
  current = JSON.parse(fs.readFileSync(targetPath, "utf8"));
} catch (error) {
  console.error(`No fue posible leer el almacenamiento editorial: ${error.message}`);
  process.exit(1);
}

let merge;
try {
  merge = mergeSimulationExperiencePack(pack, current);
} catch (error) {
  console.error(`El paquete fue rechazado: ${error.message}`);
  process.exit(1);
}

const temporaryPath = path.join(
  path.dirname(targetPath),
  `.${path.basename(targetPath)}.${process.pid}.${Date.now()}.tmp`
);
try {
  fs.writeFileSync(temporaryPath, `${JSON.stringify(merge.experiences, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  fs.renameSync(temporaryPath, targetPath);
} catch (error) {
  try {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  } catch {
    // Se conserva el error original, que describe la operación relevante.
  }
  console.error(`No fue posible actualizar el almacenamiento editorial: ${error.message}`);
  process.exit(1);
}

console.log(`Paquete ${merge.packageId} validado.`);
console.log(`${merge.imported.length} experiencia(s) incorporada(s) con estado review.`);
console.log(`Total de experiencias en el archivo: ${merge.experiences.length}.`);
console.log("Ninguna experiencia fue publicada automáticamente.");

