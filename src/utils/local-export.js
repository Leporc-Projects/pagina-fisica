export const sanitizeFilePart = (value, fallback = "archivo") => {
  const sanitized = String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return sanitized || fallback;
};

export const neutralizeSpreadsheetFormula = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

export const escapeCsvField = (
  value,
  { protectFormula = false } = {}
) => {
  const raw = value === null || value === undefined ? "" : String(value);
  const text = protectFormula ? neutralizeSpreadsheetFormula(raw) : raw;
  return `"${text.replaceAll('"', '""')}"`;
};

export const recordsToCsv = ({
  columns,
  records,
  includeBom = true,
  formulaSafeColumns = [],
}) => {
  const protectedColumns = new Set(formulaSafeColumns);
  const header = columns.map((column) => escapeCsvField(column)).join(",");
  const rows = records.map((record) => columns
    .map((column) => escapeCsvField(record[column], {
      protectFormula: protectedColumns.has(column),
    }))
    .join(","));

  return `${includeBom ? "\uFEFF" : ""}${[header, ...rows].join("\r\n")}\r\n`;
};
