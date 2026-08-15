// 1.1.0: el export deja de fijar una sola `unit`, porque Participa 1.2.0
// admite respuestas de cualquier unidad desarrollada o sin unidad. `course`
// se conserva como identidad fija del curso que sirve el Centro de revisión.
export const REVIEW_SESSION_SCHEMA_VERSION = "1.1.0";

export const REVIEW_STATUSES = [
  ["pending", "Pendiente"],
  ["interesting", "Interesante"],
  ["needs-adjustments", "Necesita ajustes"],
  ["discard", "Descartar"],
  ["bank-candidate", "Candidata al banco"],
];

export const REVIEW_FILE_MAX_BYTES = 5 * 1024 * 1024;
export const REVIEW_PAGE_SIZE = 20;

