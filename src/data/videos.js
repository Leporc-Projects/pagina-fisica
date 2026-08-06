// Catálogo audiovisual del curso.
// Los registros se añadirán únicamente cuando exista material aprobado.

/**
 * @typedef {"en-preparacion" | "disponible"} VideoStatus
 *
 * @typedef {Object} CourseVideo
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {number} unit
 * @property {string} duration
 * @property {string} date
 * @property {string} url
 * @property {string} [thumbnail]
 * @property {VideoStatus} status
 */

export const VIDEO_CONTENT_TYPES = [
  "Explicaciones conceptuales",
  "Demostraciones y análisis",
  "Orientaciones de estudio",
  "Resolución de problemas seleccionados por el docente",
];

/** @type {CourseVideo[]} */
export const VIDEOS = [];
