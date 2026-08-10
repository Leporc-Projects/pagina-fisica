import { neutralizeSpreadsheetFormula, recordsToCsv, sanitizeFilePart } from "./local-export.js";

const text = (value) => neutralizeSpreadsheetFormula(value ?? "");
const rounded = (value, digits = 2) => Number.isFinite(value)
  ? Number(value.toFixed(digits))
  : "";

const displayScore = (entry) => {
  if (!entry || entry.status === "missing") return "Faltante";
  if (entry.status !== "resolved") return "Requiere revisión";
  const { score } = entry;
  if (score.earnedPoints !== null && score.possiblePoints !== null) {
    return `${rounded(score.earnedPoints, 4)} / ${rounded(score.possiblePoints, 4)}`;
  }
  return text(score.rawScore);
};

export const buildConsolidatedRecords = (model) => model.rows.map((row) => {
  const record = {
    nombre: text(row.student.name),
    correo_institucional: text(row.student.normalizedEmail || row.student.rawEmail),
    identificacion: text(row.student.studentId),
    grupo: text(row.student.group),
  };
  model.sources.forEach((source, sourceIndex) => {
    const entry = row.results[source.id];
    const labelPart = sanitizeFilePart(source.label, source.id).replaceAll("-", "_");
    const prefix = `fuente_${String(sourceIndex + 1).padStart(2, "0")}_${labelPart}`;
    record[`${prefix}_resultado`] = displayScore(entry);
    record[`${prefix}_porcentaje`] = entry?.status === "resolved"
      ? rounded(entry.score.percentage, 4)
      : "";
    record[`${prefix}_estado`] = entry?.status ?? "missing";
  });
  record.promedio_resultados_porcentaje = rounded(row.mean.value, 4);
  record.estado_promedio = row.mean.reason ?? "calculado";
  return record;
});

export const buildIncidentRecords = (model) => model.incidents.map((item) => ({
  tipo: item.type,
  severidad: item.severity,
  fuente: text(item.source),
  archivo: text(item.fileName),
  fila: item.row ?? "",
  correo: text(item.email),
  estudiante: text(item.student),
  valor: text(item.value),
  detalle: text(item.message),
  resolucion_politica: text(item.policy || item.resolution),
}));

export const buildSummaryRecords = (model, generatedAt = new Date().toISOString()) => {
  const records = [
    { seccion: "general", metrica: "Fecha de generación", valor: generatedAt, detalle: "ISO 8601" },
    { seccion: "general", metrica: "Estudiantes en lista", valor: model.summary.students, detalle: "" },
    { seccion: "general", metrica: "Fuentes", valor: model.summary.sources, detalle: "" },
    { seccion: "general", metrica: "Resultados válidos", valor: model.summary.validResults, detalle: "" },
    { seccion: "general", metrica: "Faltantes", valor: model.summary.missing, detalle: "Faltante no equivale a cero" },
    { seccion: "general", metrica: "Desconocidos", valor: model.summary.unknown, detalle: "" },
    { seccion: "general", metrica: "Duplicados", valor: model.summary.duplicates, detalle: "" },
    { seccion: "general", metrica: "Inválidos", valor: model.summary.invalid, detalle: "" },
    { seccion: "configuración", metrica: "Política de faltantes", valor: model.missingPolicy, detalle: "Promedio descriptivo" },
  ];
  model.summary.sourceSummaries.forEach((source) => {
    const detail = [
      `archivo=${source.fileName}`,
      `escala=${source.scale}`,
      `duplicados=${source.duplicatePolicy}`,
      `faltantes=${source.missing}`,
      `desconocidos=${source.unknown}`,
      `inválidos=${source.invalid}`,
    ].join("; ");
    records.push(
      { seccion: source.label, metrica: "Participantes", valor: source.participants, detalle: detail },
      { seccion: source.label, metrica: "Participación (%)", valor: rounded(source.participation, 4), detalle: "" },
      { seccion: source.label, metrica: "Media (%)", valor: rounded(source.stats.mean, 4), detalle: `n=${source.stats.n}` },
      { seccion: source.label, metrica: "Mediana (%)", valor: rounded(source.stats.median, 4), detalle: `n=${source.stats.n}` },
      { seccion: source.label, metrica: "Mínimo (%)", valor: rounded(source.stats.min, 4), detalle: `n=${source.stats.n}` },
      { seccion: source.label, metrica: "Máximo (%)", valor: rounded(source.stats.max, 4), detalle: `n=${source.stats.n}` },
    );
  });
  return records;
};

const safeCell = (value) => typeof value === "number"
  ? { value, type: Number }
  : { value: text(value), type: String, wrap: true };

const rowsToSheet = (records, columns) => [
  columns.map((column) => ({
    value: column,
    type: String,
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#23434f",
    wrap: true,
  })),
  ...records.map((record) => columns.map((column) => safeCell(record[column]))),
];

export const createResultsWorkbook = (model, generatedAt = new Date().toISOString()) => {
  const consolidated = buildConsolidatedRecords(model);
  const incidents = buildIncidentRecords(model);
  const summary = buildSummaryRecords(model, generatedAt);
  const consolidatedColumns = consolidated.length
    ? Object.keys(consolidated[0])
    : ["nombre", "correo_institucional", "identificacion", "grupo"];
  const incidentColumns = [
    "tipo", "severidad", "fuente", "archivo", "fila", "correo",
    "estudiante", "valor", "detalle", "resolucion_politica",
  ];
  const summaryColumns = ["seccion", "metrica", "valor", "detalle"];

  return [
    {
      sheet: "Consolidado",
      data: rowsToSheet(consolidated, consolidatedColumns),
      columns: consolidatedColumns.map((column) => ({ width: column.includes("correo") ? 30 : 20 })),
      stickyRowsCount: 1,
      stickyColumnsCount: 2,
    },
    {
      sheet: "Incidencias",
      data: rowsToSheet(incidents, incidentColumns),
      columns: incidentColumns.map((column) => ({ width: ["detalle", "valor"].includes(column) ? 42 : 20 })),
      stickyRowsCount: 1,
    },
    {
      sheet: "Resumen",
      data: rowsToSheet(summary, summaryColumns),
      columns: [{ width: 24 }, { width: 27 }, { width: 22 }, { width: 62 }],
      stickyRowsCount: 1,
    },
  ];
};

const csvFor = (records, fallbackColumns = []) => {
  const columns = records.length ? Object.keys(records[0]) : fallbackColumns;
  return recordsToCsv({ columns, records, formulaSafeColumns: columns });
};

export const createResultsCsvExports = (model, generatedAt = new Date().toISOString()) => ({
  "Consolidado.csv": csvFor(buildConsolidatedRecords(model)),
  "Incidencias.csv": csvFor(buildIncidentRecords(model), [
    "tipo", "severidad", "fuente", "archivo", "fila", "correo",
    "estudiante", "valor", "detalle", "resolucion_politica",
  ]),
  "Resumen.csv": csvFor(buildSummaryRecords(model, generatedAt)),
});

export const createResultsText = (model, generatedAt = new Date().toISOString()) => {
  const lines = [
    "Aula Física · Física Básica I",
    "Resumen de resultados",
    `Generado: ${generatedAt}`,
    "",
    `Estudiantes en lista: ${model.summary.students}`,
    `Fuentes: ${model.summary.sources}`,
    `Resultados válidos: ${model.summary.validResults}`,
    `Faltantes: ${model.summary.missing} (faltante no equivale a cero)`,
    `Desconocidos: ${model.summary.unknown}`,
    `Duplicados: ${model.summary.duplicates}`,
    `Inválidos: ${model.summary.invalid}`,
    `Política de faltantes: ${model.missingPolicy}`,
    "",
    "Fuentes",
  ];
  model.summary.sourceSummaries.forEach((source) => {
    lines.push(
      `${source.label}: ${source.participants} participantes; ${source.missing} faltantes; ` +
      `participación ${rounded(source.participation)} %; media ${rounded(source.stats.mean)} % (n=${source.stats.n}); ` +
      `duplicados: ${source.duplicatePolicy}; escala: ${source.scale}.`
    );
  });
  lines.push(
    "",
    "Este resumen es descriptivo y no constituye una nota oficial del curso.",
    "Los archivos se procesaron localmente en el navegador."
  );
  return `${lines.join("\n")}\n`;
};

export const resultsExportBaseName = (date = new Date()) => {
  const day = date.toISOString().slice(0, 10);
  return `aula-fisica-resultados-${day}`;
};
