import assert from "node:assert/strict";
import test from "node:test";

import readExcelFile from "read-excel-file/node";
import writeExcelFile from "write-excel-file/node";

import {
  createResultsCsvExports,
  createResultsText,
  createResultsWorkbook,
} from "../src/utils/results-export.js";
import {
  consolidateResults,
  normalizeGenericSource,
  normalizeRoster,
  sourceFromTable,
} from "../src/utils/results-organizer.js";

const createModel = () => {
  const roster = normalizeRoster({
    data: [["Nombre", "Email"], ["=HYPERLINK(\"x\")", "ana@example.edu"], ["José", "jose@example.edu"]],
    headerRow: 1,
    mapping: { name: 0, email: 1 },
    fileName: "lista.xlsx",
  });
  const source = sourceFromTable({
    id: "fuente-1",
    label: "Bono – cinemática",
    fileName: "resultados.xlsx",
    format: "xlsx",
    sheet: "Respuestas",
    data: [["Email", "Nota"], ["ana@example.edu", 8], ["jose@example.edu", 9]],
    headerRow: 1,
  });
  source.config = {
    headerRow: 1,
    mapping: { email: 0, score: 1, possible: null, timestamp: null },
    scoreConfiguration: { maximumMode: "fixed", fixedMaximum: 10 },
    duplicatePolicy: "unresolved",
  };
  return consolidateResults({
    roster,
    sources: [normalizeGenericSource(source)],
    missingPolicy: "exclude",
  });
};

test("XLSX exporta tres hojas, Unicode, texto seguro, scores numéricos y resumen", async () => {
  const model = createModel();
  const workbook = createResultsWorkbook(model, "2026-08-08T12:00:00.000Z");
  assert.deepEqual(workbook.map((sheet) => sheet.sheet), ["Consolidado", "Incidencias", "Resumen"]);
  const buffer = await writeExcelFile(workbook, { fontFamily: "Arial", fontSize: 10 }).toBuffer();
  const sheets = await readExcelFile(buffer);
  assert.deepEqual(sheets.map((sheet) => sheet.sheet), ["Consolidado", "Incidencias", "Resumen"]);
  const consolidated = sheets[0].data;
  assert.equal(consolidated[1][0], "'=HYPERLINK(\"x\")");
  assert.equal(consolidated[2][0], "José");
  const percentageColumn = consolidated[0].findIndex((value) => String(value).endsWith("_porcentaje"));
  assert.equal(typeof consolidated[1][percentageColumn], "number");
  assert.equal(consolidated[1][percentageColumn], 80);
  assert.equal(sheets[2].data.some((row) => row.includes("Política de faltantes")), true);
});

test("CSV usa BOM, CRLF y neutraliza fórmula; TXT es resumen humano", () => {
  const model = createModel();
  const csv = createResultsCsvExports(model, "2026-08-08T12:00:00.000Z");
  assert.deepEqual(Object.keys(csv), ["Consolidado.csv", "Incidencias.csv", "Resumen.csv"]);
  assert.equal(csv["Consolidado.csv"].startsWith("\uFEFF"), true);
  assert.match(csv["Consolidado.csv"], /"'=HYPERLINK\(""x""\)"/);
  assert.match(csv["Consolidado.csv"], /\r\n/);
  const text = createResultsText(model, "2026-08-08T12:00:00.000Z");
  assert.match(text, /Faltante no equivale a cero/i);
  assert.match(text, /no constituye una nota oficial/i);
  const englishText = createResultsText(model, "2026-08-08T12:00:00.000Z", "en");
  assert.match(englishText, /missing does not equal zero/i);
  assert.match(englishText, /does not constitute an official course grade/i);
  assert.deepEqual(
    createResultsCsvExports(model, "2026-08-08T12:00:00.000Z"),
    csv,
    "UI locale cannot rename machine-readable CSV keys or values"
  );
});

test("genera y vuelve a leer un XLSX sintético Microsoft-like con varias hojas", async () => {
  const sourceWorkbook = [
    {
      sheet: "Resumen",
      data: [["Archivo sintético"]],
    },
    {
      sheet: "Responses",
      data: [
        ["Respondent ID", "Start time", "Completion time", "Name", "Email", "Score", "Other"],
        [1, "2026-08-08T10:00:00Z", "2026-08-08T10:05:00Z", "Ana", "ana@example.edu", 8, "Ω"],
      ],
    },
  ];
  const buffer = await writeExcelFile(sourceWorkbook).toBuffer();
  const sheets = await readExcelFile(buffer);
  assert.equal(sheets.length, 2);
  assert.equal(sheets[1].sheet, "Responses");
  assert.equal(sheets[1].data[1][4], "ana@example.edu");
  assert.equal(sheets[1].data[1][6], "Ω");
});
