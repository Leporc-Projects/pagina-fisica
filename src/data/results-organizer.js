export const RESULTS_ORGANIZER_SCHEMA_VERSION = "1.0.0";

export const RESULTS_LIMITS = Object.freeze({
  maxFileBytes: 15 * 1024 * 1024,
  maxRows: 10_000,
  maxColumns: 250,
  previewRows: 6,
});

export const SUPPORTED_RESULT_FORMATS = Object.freeze(["csv", "xlsx", "json"]);

export const DUPLICATE_POLICIES = Object.freeze([
  ["unresolved", "Requiere revisión"],
  ["first", "Primer intento"],
  ["last", "Último intento"],
  ["highest", "Mayor resultado"],
  ["average", "Promedio"],
]);

export const MISSING_POLICIES = Object.freeze([
  ["unresolved", "No calcular hasta resolver faltantes"],
  ["exclude", "Excluir faltantes"],
  ["zero", "Tratar faltantes como cero"],
]);

export const INCIDENT_TYPES = Object.freeze([
  "invalid_file",
  "unsupported_format",
  "invalid_email",
  "duplicate_roster_identity",
  "unknown_student",
  "missing_submission",
  "duplicate_submission",
  "invalid_score",
  "missing_scale",
  "score_out_of_range",
  "scale_conflict",
  "anonymous_attempt",
  "invalid_timestamp",
  "unresolved_duplicate",
  "bonus_summary_mismatch",
]);

export const INCIDENT_SEVERITIES = Object.freeze(["error", "warning", "info"]);

export const SCORE_MAXIMUM_MODES = Object.freeze([
  ["cell", "La puntuación incluye el máximo (8/10)"],
  ["fixed", "Máximo fijo para esta fuente"],
  ["column", "Máximo en otra columna"],
  ["unknown", "Escala todavía desconocida"],
]);
