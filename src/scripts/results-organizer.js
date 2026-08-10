import {
  DUPLICATE_POLICIES,
  RESULTS_LIMITS,
  SCORE_MAXIMUM_MODES,
} from "../data/results-organizer.js";
import {
  createResultsCsvExports,
  createResultsText,
  createResultsWorkbook,
  resultsExportBaseName,
} from "../utils/results-export.js";
import { csvWorkbook } from "../utils/results-csv.js";
import {
  consolidateResults,
  normalizeBonusSource,
  normalizeGenericSource,
  normalizeRoster,
  sourceFromBonusDocuments,
  sourceFromTable,
  suggestColumns,
  tableHeaders,
} from "../utils/results-organizer.js";

const createElement = (tag, options = {}) => {
  const element = document.createElement(tag);
  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = String(options.text);
  if (options.attrs) Object.entries(options.attrs).forEach(([name, value]) => {
    if (value !== null && value !== undefined) element.setAttribute(name, String(value));
  });
  return element;
};

const append = (parent, ...children) => {
  children.filter(Boolean).forEach((child) => parent.append(child));
  return parent;
};

const id = () => {
  if (typeof crypto.randomUUID === "function") return `source_${crypto.randomUUID()}`;
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `source_${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
};

const extension = (name) => name.toLocaleLowerCase("en").split(".").at(-1) ?? "";
const baseLabel = (name) => name.replace(/\.[^.]+$/, "").replaceAll(/[_-]+/g, " ").trim();
const formatNumber = (value, digits = 1) => Number.isFinite(value)
  ? new Intl.NumberFormat("es-CO", { maximumFractionDigits: digits }).format(value)
  : "—";

const download = (content, fileName, type) => {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }));
  const link = createElement("a", { attrs: { href: url, download: fileName } });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const labelWrap = (labelText, control) => append(
  createElement("label"),
  createElement("span", { text: labelText }),
  control
);

const selectControl = (options, value, attrs = {}) => {
  const select = createElement("select", { attrs });
  options.forEach(([optionValue, label]) => {
    const option = createElement("option", { text: label, attrs: { value: optionValue } });
    option.selected = String(optionValue) === String(value);
    select.append(option);
  });
  return select;
};

const columnOptions = (headers, optional = false) => [
  ...(optional ? [["", "No usar"]] : [["", "Selecciona una columna"]]),
  ...headers.map((header, index) => [String(index), `${header} · col. ${index + 1}`]),
];

const previewTable = (data, headerRow) => {
  const container = createElement("div", { className: "results-preview" });
  const table = createElement("table");
  const caption = createElement("caption", { text: `Vista previa · encabezado en fila ${headerRow}` });
  const tbody = createElement("tbody");
  const start = Math.max(0, headerRow - 1);
  data.slice(start, start + RESULTS_LIMITS.previewRows).forEach((row, rowIndex) => {
    const tr = createElement("tr");
    append(tr, createElement(rowIndex === 0 ? "th" : "td", {
      text: start + rowIndex + 1,
      attrs: rowIndex === 0 ? { scope: "row" } : {},
    }));
    row.slice(0, 16).forEach((value) => {
      const cell = createElement(rowIndex === 0 ? "th" : "td", {
        text: value instanceof Date ? value.toISOString() : value ?? "",
      });
      if (rowIndex === 0) cell.setAttribute("scope", "col");
      tr.append(cell);
    });
    tbody.append(tr);
  });
  append(table, caption, tbody);
  container.append(table);
  return container;
};

const fileIncident = ({ type, fileName, message, severity = "error" }) => ({
  id: id().replace("source_", "import_"),
  severity,
  type,
  sourceId: null,
  source: "Importación",
  fileName,
  row: null,
  email: "",
  student: "",
  value: "",
  policy: "",
  resolution: "open",
  message,
});

const loadTableWorkbook = async (file) => {
  if (file.size > RESULTS_LIMITS.maxFileBytes) {
    throw new RangeError(`El archivo supera el límite de ${RESULTS_LIMITS.maxFileBytes / 1024 / 1024} MB.`);
  }
  const format = extension(file.name);
  if (format === "xls") {
    throw new TypeError("Este formato antiguo no se procesa directamente. Guarda el archivo como .xlsx o .csv e inténtalo de nuevo.");
  }
  if (format === "csv") return { format, ...(csvWorkbook(await file.text())) };
  if (format === "xlsx") {
    const { readResultsWorkbook } = await import("../utils/results-xlsx-browser.js");
    return { format, ...(await readResultsWorkbook(file)) };
  }
  throw new TypeError("Selecciona un archivo CSV o XLSX.");
};

const validateWorkbookLimits = (workbook) => {
  workbook.sheets.forEach(({ data, sheet }) => {
    if (data.length > RESULTS_LIMITS.maxRows) throw new RangeError(`${sheet} supera ${RESULTS_LIMITS.maxRows} filas.`);
    if (data.some((row) => row.length > RESULTS_LIMITS.maxColumns)) {
      throw new RangeError(`${sheet} supera ${RESULTS_LIMITS.maxColumns} columnas.`);
    }
  });
};

const tableSourceForSheet = (raw, sheetIndex, previous = null) => {
  const selected = raw.workbook.sheets[sheetIndex];
  const source = sourceFromTable({
    id: raw.id,
    label: previous?.label ?? raw.label,
    fileName: raw.fileName,
    format: raw.format,
    sheet: selected.sheet,
    data: selected.data,
    headerRow: previous?.config.headerRow ?? 1,
  });
  source.workbook = raw.workbook;
  source.sheetIndex = sheetIndex;
  return source;
};

const setLive = (root, message) => {
  const live = root.querySelector("[data-results-live]");
  if (live) live.textContent = message;
};

const renderRosterConfiguration = (root, state) => {
  const container = root.querySelector("[data-roster-config]");
  if (!(container instanceof HTMLElement)) return;
  container.replaceChildren();
  if (!state.rosterImport) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  const currentSheet = state.rosterImport.workbook.sheets[state.rosterImport.sheetIndex];
  const headers = tableHeaders(currentSheet.data, state.rosterImport.headerRow);
  const controls = createElement("div", { className: "results-config__grid" });

  const sheetSelect = selectControl(
    state.rosterImport.workbook.sheets.map((sheet, index) => [index, sheet.sheet]),
    state.rosterImport.sheetIndex
  );
  sheetSelect.addEventListener("change", () => {
    state.rosterImport.sheetIndex = Number(sheetSelect.value);
    state.rosterImport.headerRow = 1;
    state.rosterImport.mapping = suggestColumns(
      tableHeaders(state.rosterImport.workbook.sheets[state.rosterImport.sheetIndex].data, 1),
      ["email", "name", "id", "group"]
    );
    renderRosterConfiguration(root, state);
  });

  const headerInput = createElement("input", {
    attrs: { type: "number", min: 1, max: Math.max(1, currentSheet.data.length), value: state.rosterImport.headerRow },
  });
  headerInput.addEventListener("change", () => {
    state.rosterImport.headerRow = Math.max(1, Math.min(currentSheet.data.length, Number(headerInput.value) || 1));
    state.rosterImport.mapping = suggestColumns(
      tableHeaders(currentSheet.data, state.rosterImport.headerRow),
      ["email", "name", "id", "group"]
    );
    renderRosterConfiguration(root, state);
  });

  append(
    controls,
    labelWrap("Hoja", sheetSelect),
    labelWrap("Fila del encabezado", headerInput)
  );
  [
    ["email", "Correo institucional", false],
    ["name", "Nombre", true],
    ["id", "Identificación", true],
    ["group", "Grupo", true],
  ].forEach(([field, label, optional]) => {
    const select = selectControl(columnOptions(headers, optional), state.rosterImport.mapping[field] ?? "");
    select.addEventListener("change", () => {
      state.rosterImport.mapping[field] = select.value === "" ? null : Number(select.value);
    });
    controls.append(labelWrap(label, select));
  });
  const confirm = createElement("button", { text: "Usar este listado", attrs: { type: "button" } });
  confirm.addEventListener("click", () => {
    try {
      state.roster = normalizeRoster({
        data: currentSheet.data,
        headerRow: state.rosterImport.headerRow,
        mapping: state.rosterImport.mapping,
        fileName: state.rosterImport.fileName,
      });
      setLive(root, `Listado preparado: ${state.roster.students.length} filas.`);
      recompute(root, state);
      renderRosterConfiguration(root, state);
    } catch (error) {
      setLive(root, error.message);
    }
  });
  append(
    container,
    createElement("h3", { text: state.rosterImport.fileName }),
    createElement("p", { text: "Las sugerencias son visibles y editables. Comprueba el encabezado y cada columna." }),
    controls,
    previewTable(currentSheet.data, state.rosterImport.headerRow),
    confirm
  );
  if (state.roster) {
    container.append(createElement("p", {
      className: "results-config__success",
      text: `${state.roster.students.length} filas del listado están activas en esta sesión.`,
    }));
  }
};

const normalizeSource = (source) => source.kind === "bonus"
  ? normalizeBonusSource(source)
  : normalizeGenericSource(source);

const updateSourceConfiguration = (root, state, source) => {
  try {
    source.normalized = normalizeSource(source);
    source.configurationError = null;
  } catch (error) {
    source.normalized = null;
    source.configurationError = error.message;
  }
  recompute(root, state);
};

const renderSourceCard = (root, state, source) => {
  const card = createElement("article", { className: "results-source-card" });
  const header = createElement("header");
  const titleGroup = createElement("div");
  const labelInput = createElement("input", { attrs: { type: "text", value: source.label, "aria-label": "Nombre de la fuente" } });
  labelInput.addEventListener("change", () => {
    source.label = labelInput.value.trim() || baseLabel(source.fileName);
    updateSourceConfiguration(root, state, source);
    renderSources(root, state);
  });
  append(titleGroup, labelInput, createElement("small", { text: `${source.fileName} · ${source.format.toUpperCase()}` }));
  const remove = createElement("button", { text: "Eliminar fuente", attrs: { type: "button" }, className: "results-button--quiet" });
  remove.addEventListener("click", () => {
    state.sources = state.sources.filter((item) => item.id !== source.id);
    renderSources(root, state);
    recompute(root, state);
    setLive(root, "Fuente retirada de la sesión.");
  });
  append(header, titleGroup, remove);
  card.append(header);

  if (source.kind === "bonus") {
    const fields = createElement("div", { className: "results-config__grid" });
    const policy = selectControl(DUPLICATE_POLICIES, source.config.duplicatePolicy);
    policy.addEventListener("change", () => {
      source.config.duplicatePolicy = policy.value;
      updateSourceConfiguration(root, state, source);
    });
    append(
      fields,
      labelWrap("Política de duplicados", policy),
      createElement("p", { text: `${source.documents.length} intento(s) de Bono reconocidos. La puntuación proviene del summary validado.` })
    );
    card.append(fields);
  } else {
    const headers = tableHeaders(source.data, source.config.headerRow);
    const fields = createElement("div", { className: "results-config__grid" });
    const sheet = selectControl(source.workbook.sheets.map((item, index) => [index, item.sheet]), source.sheetIndex);
    sheet.addEventListener("change", () => {
      const rebuilt = tableSourceForSheet(source, Number(sheet.value));
      Object.assign(source, rebuilt);
      updateSourceConfiguration(root, state, source);
      renderSources(root, state);
    });
    const headerRow = createElement("input", {
      attrs: { type: "number", min: 1, max: Math.max(1, source.data.length), value: source.config.headerRow },
    });
    headerRow.addEventListener("change", () => {
      source.config.headerRow = Math.max(1, Math.min(source.data.length, Number(headerRow.value) || 1));
      source.config.mapping = suggestColumns(tableHeaders(source.data, source.config.headerRow), ["email", "score", "possible", "timestamp"]);
      updateSourceConfiguration(root, state, source);
      renderSources(root, state);
    });
    append(fields, labelWrap("Hoja", sheet), labelWrap("Fila del encabezado", headerRow));
    [
      ["email", "Correo", false],
      ["score", "Puntuación", false],
      ["possible", "Máximo (si está en columna)", true],
      ["timestamp", "Fecha / hora", true],
    ].forEach(([field, label, optional]) => {
      const control = selectControl(columnOptions(headers, optional), source.config.mapping[field] ?? "");
      control.addEventListener("change", () => {
        source.config.mapping[field] = control.value === "" ? null : Number(control.value);
        updateSourceConfiguration(root, state, source);
      });
      fields.append(labelWrap(label, control));
    });
    const maximumMode = selectControl(SCORE_MAXIMUM_MODES, source.config.scoreConfiguration.maximumMode);
    maximumMode.addEventListener("change", () => {
      source.config.scoreConfiguration.maximumMode = maximumMode.value;
      updateSourceConfiguration(root, state, source);
      renderSources(root, state);
    });
    const maximum = createElement("input", {
      attrs: { type: "text", inputmode: "decimal", value: source.config.scoreConfiguration.fixedMaximum ?? "", placeholder: "Ej. 10" },
    });
    maximum.disabled = source.config.scoreConfiguration.maximumMode !== "fixed";
    maximum.addEventListener("input", () => {
      source.config.scoreConfiguration.fixedMaximum = maximum.value;
      updateSourceConfiguration(root, state, source);
    });
    const policy = selectControl(DUPLICATE_POLICIES, source.config.duplicatePolicy);
    policy.addEventListener("change", () => {
      source.config.duplicatePolicy = policy.value;
      updateSourceConfiguration(root, state, source);
    });
    append(
      fields,
      labelWrap("Cómo conocer el máximo", maximumMode),
      labelWrap("Máximo fijo", maximum),
      labelWrap("Política de duplicados", policy)
    );
    card.append(fields, previewTable(source.data, source.config.headerRow));
  }
  const status = createElement("p", {
    className: source.configurationError ? "results-source-card__error" : "results-source-card__status",
    text: source.configurationError
      ? source.configurationError
      : source.normalized
        ? `${source.normalized.submissions.length} filas preparadas; revisa las incidencias antes de exportar.`
        : "Completa la configuración.",
  });
  card.append(status);
  return card;
};

function renderSources(root, state) {
  const list = root.querySelector("[data-source-list]");
  if (!(list instanceof HTMLElement)) return;
  list.replaceChildren();
  if (state.sources.length === 0) {
    list.append(createElement("p", { className: "results-empty", text: "Todavía no hay fuentes cargadas." }));
    return;
  }
  state.sources.forEach((source) => list.append(renderSourceCard(root, state, source)));
}

const metric = (label, value) => append(
  createElement("div"),
  createElement("dt", { text: label }),
  createElement("dd", { text: value })
);

const buildTable = (captionText, columns, records) => {
  const table = createElement("table");
  const caption = createElement("caption", { text: captionText });
  const thead = createElement("thead");
  const headRow = createElement("tr");
  columns.forEach((column) => headRow.append(createElement("th", { text: column.label, attrs: { scope: "col" } })));
  thead.append(headRow);
  const tbody = createElement("tbody");
  records.forEach((record) => {
    const row = createElement("tr");
    columns.forEach((column, index) => {
      const cell = createElement(index === 0 ? "th" : "td", index === 0 ? { attrs: { scope: "row" } } : {});
      const value = column.render ? column.render(record) : record[column.key];
      if (value instanceof Node) cell.append(value);
      else cell.textContent = value === null || value === undefined || value === "" ? "—" : String(value);
      row.append(cell);
    });
    tbody.append(row);
  });
  append(table, caption, thead, tbody);
  return table;
};

const renderSummary = (root, model) => {
  const metrics = root.querySelector("[data-results-metrics]");
  if (metrics) {
    metrics.replaceChildren(
      metric("Estudiantes", model.summary.students),
      metric("Fuentes", model.summary.sources),
      metric("Resultados válidos", model.summary.validResults),
      metric("Faltantes", model.summary.missing),
      metric("Desconocidos", model.summary.unknown),
      metric("Duplicados", model.summary.duplicates),
      metric("Inválidos", model.summary.invalid),
    );
  }
  const sourceSummary = root.querySelector("[data-source-summary]");
  if (sourceSummary) {
    sourceSummary.replaceChildren(buildTable("Resumen por fuente", [
      { key: "label", label: "Fuente" },
      { key: "participants", label: "Participantes" },
      { key: "missing", label: "Faltantes" },
      { label: "Participación", render: (source) => `${formatNumber(source.participation)} %` },
      { label: "Media", render: (source) => source.stats.n ? `${formatNumber(source.stats.mean)} % (n=${source.stats.n})` : "Sin escala" },
      { label: "Mediana", render: (source) => source.stats.n ? `${formatNumber(source.stats.median)} %` : "—" },
      { label: "Mín.–máx.", render: (source) => source.stats.n ? `${formatNumber(source.stats.min)}–${formatNumber(source.stats.max)} %` : "—" },
    ], model.summary.sourceSummaries));
  }
};

const renderIncidents = (root, model) => {
  const container = root.querySelector("[data-incidents-table]");
  if (!container) return;
  if (model.incidents.length === 0) {
    container.replaceChildren(createElement("p", { className: "results-empty", text: "No hay incidencias abiertas con la configuración actual." }));
    return;
  }
  container.replaceChildren(buildTable(`Incidencias · ${model.incidents.length}`, [
    { label: "Severidad", render: (item) => {
      const value = createElement("span", { className: "results-severity", text: item.severity });
      value.dataset.severity = item.severity;
      return value;
    } },
    { key: "type", label: "Tipo" },
    { key: "source", label: "Fuente" },
    { label: "Referencia", render: (item) => item.row ? `${item.fileName} · fila ${item.row}` : item.fileName },
    { label: "Correo / valor", render: (item) => item.email || item.value },
    { key: "message", label: "Detalle" },
  ], model.incidents.slice(0, 500)));
};

const resultDetail = (entry) => {
  if (!entry || entry.status === "missing") return createElement("span", { text: "Faltante", className: "results-cell-state" });
  if (entry.status !== "resolved") return createElement("span", { text: "Requiere revisión", className: "results-cell-state results-cell-state--attention" });
  const scoreText = entry.score.possiblePoints === null
    ? entry.score.rawScore
    : `${formatNumber(entry.score.earnedPoints, 3)} / ${formatNumber(entry.score.possiblePoints, 3)}`;
  const details = createElement("details", { className: "results-cell-detail" });
  const summary = createElement("summary", { text: entry.score.percentage === null ? scoreText : `${scoreText} · ${formatNumber(entry.score.percentage)} %` });
  const list = createElement("dl");
  const selected = entry.selectedSubmission ?? entry.submissions[0];
  [
    ["Archivo", selected?.fileName],
    ["Fila", selected?.row],
    ["Valor original", selected?.score.rawScore],
    ["Política", entry.policy],
    ["Fecha", selected?.timestamp],
    ["Intentos conservados", entry.submissions.length],
  ].forEach(([term, value]) => {
    if (value === null || value === undefined || value === "") return;
    append(list, createElement("dt", { text: term }), createElement("dd", { text: value }));
  });
  append(details, summary, list);
  return details;
};

const rowHasIncident = (model, row) => model.incidents.some((item) =>
  item.email && item.email === row.student.normalizedEmail && item.severity !== "info"
);

const renderConsolidated = (root, state) => {
  const model = state.model;
  const container = root.querySelector("[data-consolidated-table]");
  if (!container || !model) return;
  const query = state.filters.query.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const filtered = model.rows.filter((row) => {
    const haystack = `${row.student.name} ${row.student.normalizedEmail}`.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
    if (query && !haystack.includes(query)) return false;
    if (state.filters.group && row.student.group !== state.filters.group) return false;
    const entries = Object.values(row.results);
    if (state.filters.status === "complete" && entries.some((entry) => entry.status !== "resolved")) return false;
    if (state.filters.status === "missing" && !entries.some((entry) => entry.status !== "resolved")) return false;
    if (state.filters.status === "incidents" && !rowHasIncident(model, row)) return false;
    return true;
  });
  const columns = [
    { label: "Estudiante", render: (row) => row.student.name || "Sin nombre" },
    { label: "Correo", render: (row) => row.student.normalizedEmail || row.student.rawEmail },
    ...(model.rows.some((row) => row.student.studentId) ? [{ label: "ID", render: (row) => row.student.studentId }] : []),
    ...(model.rows.some((row) => row.student.group) ? [{ label: "Grupo", render: (row) => row.student.group }] : []),
    ...model.sources.map((source) => ({ label: source.label, render: (row) => resultDetail(row.results[source.id]) })),
    { label: "Promedio de resultados", render: (row) => row.mean.value === null ? "Pendiente" : `${formatNumber(row.mean.value)} %` },
  ];
  container.replaceChildren(buildTable(`Consolidado · ${filtered.length} de ${model.rows.length} estudiantes`, columns, filtered));
};

const renderFilters = (root, state) => {
  const groups = [...new Set(state.model.rows.map((row) => row.student.group).filter(Boolean))].sort();
  const groupSelect = root.querySelector("[data-results-group]");
  if (groupSelect instanceof HTMLSelectElement) {
    const current = state.filters.group;
    groupSelect.replaceChildren(createElement("option", { text: "Todos", attrs: { value: "" } }));
    groups.forEach((group) => groupSelect.append(createElement("option", { text: group, attrs: { value: group } })));
    groupSelect.value = current;
  }
};

const renderWorkspace = (root, state) => {
  const workspace = root.querySelector("[data-results-workspace]");
  const clear = root.querySelector("[data-clear-area]");
  if (!state.model || !workspace) {
    if (workspace) workspace.hidden = true;
    return;
  }
  workspace.hidden = false;
  if (clear) clear.hidden = false;
  renderSummary(root, state.model);
  renderIncidents(root, state.model);
  renderFilters(root, state);
  renderConsolidated(root, state);
  root.querySelectorAll("[data-export-xlsx], [data-export-csv], [data-export-txt]").forEach((button) => {
    button.disabled = state.model.sources.length === 0;
  });
  const rosterStatus = root.querySelector("[data-roster-status]");
  if (rosterStatus) {
    rosterStatus.hidden = false;
    rosterStatus.textContent = `${state.model.summary.students} estudiantes en el listado · ${state.model.summary.sources} fuentes configuradas.`;
  }
};

function recompute(root, state) {
  if (!state.roster) {
    state.model = null;
    renderWorkspace(root, state);
    return;
  }
  const sources = state.sources.map((source) => source.normalized).filter(Boolean);
  state.model = consolidateResults({ roster: state.roster, sources, missingPolicy: state.missingPolicy });
  state.model.incidents.unshift(...state.importIncidents);
  state.model.summary.invalid += state.importIncidents.filter((item) => item.severity === "error").length;
  renderWorkspace(root, state);
}

const importRoster = async (root, state, file) => {
  try {
    setLive(root, `Leyendo ${file.name}…`);
    const workbook = await loadTableWorkbook(file);
    validateWorkbookLimits(workbook);
    const headers = tableHeaders(workbook.sheets[0].data, 1);
    state.rosterImport = {
      fileName: file.name,
      workbook,
      sheetIndex: 0,
      headerRow: 1,
      mapping: suggestColumns(headers, ["email", "name", "id", "group"]),
    };
    state.roster = null;
    renderRosterConfiguration(root, state);
    recompute(root, state);
    setLive(root, "Listado leído. Confirma hoja, encabezado y columnas.");
  } catch (error) {
    state.importIncidents.push(fileIncident({
      type: extension(file.name) === "xls" ? "unsupported_format" : "invalid_file",
      fileName: file.name,
      message: error.message,
    }));
    setLive(root, error.message);
  }
};

const importSourceFile = async (root, state, file) => {
  const format = extension(file.name);
  try {
    setLive(root, `Leyendo ${file.name}…`);
    if (file.size > RESULTS_LIMITS.maxFileBytes) throw new RangeError("El archivo supera el límite de 15 MB.");
    if (format === "json") {
      let document;
      try {
        document = JSON.parse(await file.text());
      } catch {
        throw new SyntaxError("El archivo no contiene JSON válido.");
      }
      if (!document || typeof document !== "object" || Array.isArray(document) || !("attemptId" in document || "bonusId" in document)) {
        throw new TypeError("El JSON no corresponde a un intento de Bono de Aula Física.");
      }
      const key = `${document.bonusId ?? "invalid"}:${document.bonusVersion ?? "unknown"}`;
      const existing = state.sources.find((source) => source.kind === "bonus" && source.bonusKey === key);
      if (existing) {
        existing.documents.push(document);
        existing.documentFileNames.push(file.name);
        existing.fileName = `${existing.documents.length} archivos JSON`;
        updateSourceConfiguration(root, state, existing);
      } else {
        const source = sourceFromBonusDocuments({
          id: id(),
          label: document.bonusTitle || baseLabel(file.name),
          fileName: file.name,
          documents: [document],
        });
        source.bonusKey = key;
        source.documentFileNames = [file.name];
        state.sources.push(source);
        updateSourceConfiguration(root, state, source);
      }
      return;
    }
    const workbook = await loadTableWorkbook(file);
    validateWorkbookLimits(workbook);
    const raw = {
      id: id(),
      label: baseLabel(file.name),
      fileName: file.name,
      format: workbook.format,
      workbook,
    };
    const source = tableSourceForSheet(raw, 0);
    state.sources.push(source);
    updateSourceConfiguration(root, state, source);
  } catch (error) {
    state.importIncidents.push(fileIncident({
      type: format === "xls" ? "unsupported_format" : "invalid_file",
      fileName: file.name,
      message: error.message,
    }));
    setLive(root, error.message);
  }
};

const wireActions = (root, state) => {
  const rosterFile = root.querySelector("[data-roster-file]");
  rosterFile?.addEventListener("change", async () => {
    const file = rosterFile.files?.[0];
    if (file) await importRoster(root, state, file);
    rosterFile.value = "";
  });
  const sourceFiles = root.querySelector("[data-source-files]");
  sourceFiles?.addEventListener("change", async () => {
    for (const file of sourceFiles.files ?? []) await importSourceFile(root, state, file);
    sourceFiles.value = "";
    renderSources(root, state);
    recompute(root, state);
    setLive(root, `${state.sources.length} fuente(s) en la sesión.`);
  });

  root.querySelector("[data-results-search]")?.addEventListener("input", (event) => {
    state.filters.query = event.currentTarget.value;
    renderConsolidated(root, state);
  });
  root.querySelector("[data-results-group]")?.addEventListener("change", (event) => {
    state.filters.group = event.currentTarget.value;
    renderConsolidated(root, state);
  });
  root.querySelector("[data-results-status]")?.addEventListener("change", (event) => {
    state.filters.status = event.currentTarget.value;
    renderConsolidated(root, state);
  });
  root.querySelector("[data-missing-policy]")?.addEventListener("change", (event) => {
    state.missingPolicy = event.currentTarget.value;
    const note = root.querySelector("[data-missing-policy-note]");
    if (note) note.textContent = state.missingPolicy === "zero"
      ? "Decisión activa: cada faltante cuenta como 0 % únicamente en el promedio descriptivo."
      : state.missingPolicy === "exclude"
        ? "Decisión activa: los faltantes se excluyen del promedio descriptivo."
        : "Faltante es un estado, no una puntuación. El promedio permanece pendiente hasta resolverlo.";
    recompute(root, state);
  });

  root.querySelector("[data-export-xlsx]")?.addEventListener("click", async () => {
    if (!state.model) return;
    const button = root.querySelector("[data-export-xlsx]");
    button.disabled = true;
    setLive(root, "Preparando XLSX…");
    try {
      const { writeResultsWorkbook } = await import("../utils/results-xlsx-browser.js");
      await writeResultsWorkbook(createResultsWorkbook(state.model), `${resultsExportBaseName()}.xlsx`);
      setLive(root, "XLSX preparado con las hojas Consolidado, Incidencias y Resumen.");
    } catch (error) {
      setLive(root, `No fue posible preparar el XLSX: ${error.message}`);
    } finally {
      button.disabled = false;
    }
  });
  root.querySelectorAll("[data-export-csv]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.model) return;
      const fileName = button.dataset.exportCsv;
      const files = createResultsCsvExports(state.model);
      download(files[fileName], fileName, "text/csv;charset=utf-8");
      setLive(root, `${fileName} preparado.`);
    });
  });
  root.querySelector("[data-export-txt]")?.addEventListener("click", () => {
    if (!state.model) return;
    download(createResultsText(state.model), "aula-fisica-resumen-resultados.txt", "text/plain;charset=utf-8");
    setLive(root, "Resumen TXT preparado.");
  });
  root.querySelector("[data-export-print]")?.addEventListener("click", () => window.print());

  const clearConfirmation = root.querySelector("[data-clear-confirmation]");
  root.querySelector("[data-clear-session]")?.addEventListener("click", () => {
    if (clearConfirmation) clearConfirmation.hidden = false;
  });
  root.querySelector("[data-clear-cancel]")?.addEventListener("click", () => {
    if (clearConfirmation) clearConfirmation.hidden = true;
  });
  root.querySelector("[data-clear-confirm]")?.addEventListener("click", () => {
    state.rosterImport = null;
    state.roster = null;
    state.sources = [];
    state.importIncidents = [];
    state.model = null;
    state.filters = { query: "", group: "", status: "" };
    renderRosterConfiguration(root, state);
    renderSources(root, state);
    const workspace = root.querySelector("[data-results-workspace]");
    const clearArea = root.querySelector("[data-clear-area]");
    const rosterStatus = root.querySelector("[data-roster-status]");
    if (workspace) workspace.hidden = true;
    if (clearArea) clearArea.hidden = true;
    if (rosterStatus) rosterStatus.hidden = true;
    if (clearConfirmation) clearConfirmation.hidden = true;
    setLive(root, "Sesión limpiada. Los archivos dejaron de estar en memoria.");
  });
};

export const initializeResultsOrganizer = () => {
  const root = document.querySelector("[data-results-organizer]");
  if (!(root instanceof HTMLElement) || root.dataset.initialized === "true") return;
  root.dataset.initialized = "true";
  const state = {
    rosterImport: null,
    roster: null,
    sources: [],
    importIncidents: [],
    model: null,
    missingPolicy: "unresolved",
    filters: { query: "", group: "", status: "" },
  };
  wireActions(root, state);
};
