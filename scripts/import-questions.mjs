import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { UNIT_1_EXERCISES } from "../src/data/physics/unit-1/exercises.js";
import { mergeQuestionPack } from "../src/utils/question-pack.js";

const sourceArgument = process.argv[2];
if (!sourceArgument) {
  console.error("Uso: npm run import:questions -- ruta/al/paquete.json");
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
const targetPath = path.join(projectRoot, "src/data/physics/unit-1/teacher-questions.json");
const current = JSON.parse(fs.readFileSync(targetPath, "utf8"));
let merge;
try {
  merge = mergeQuestionPack(pack, current, {
    repositoryIds: UNIT_1_EXERCISES.map((exercise) => exercise.id),
  });
} catch (error) {
  console.error(`El paquete fue rechazado: ${error.message}`);
  process.exit(1);
}
const next = merge.questions;
const temporaryPath = `${targetPath}.tmp`;
fs.writeFileSync(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
fs.renameSync(temporaryPath, targetPath);

console.log(`Paquete ${pack.packageId} validado.`);
console.log(`${merge.imported.length} pregunta(s) incorporada(s) como borrador.`);
console.log(`Total de preguntas docentes en el archivo: ${next.length}.`);
console.log("Ninguna pregunta fue publicada automáticamente.");
