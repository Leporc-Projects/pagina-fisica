// Contrato del catálogo audiovisual consumido por /fisica-basica-1/videos.
// El repositorio almacena metadatos y enlaces aprobados, no archivos de video
// pesados ni títulos, fechas o URL provisionales.

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
 * @property {"es" | "en"} language
 * @property {string} [thumbnail]
 * @property {VideoStatus} status
 */

export const VIDEO_CONTENT_TYPES = [
  "Explicaciones conceptuales",
  "Demostraciones y análisis",
  "Orientaciones de estudio",
  "Resolución de problemas seleccionados por el docente",
];

const VIDEO_CONTENT_TYPES_EN = Object.freeze([
  "Conceptual explanations",
  "Demonstrations and analysis",
  "Study guidance",
  "Problems selected by the instructor",
]);

export const getVideoContentTypes = (locale) =>
  locale === "en" ? [...VIDEO_CONTENT_TYPES_EN] : [...VIDEO_CONTENT_TYPES];

/**
 * Publicaciones audiovisuales aprobadas. Mantener vacío mientras no existan
 * recursos reales; validate.mjs verifica la unicidad de sus identificadores.
 * @type {CourseVideo[]}
 */
export const VIDEOS = [];

export const getVideos = () => [...VIDEOS];

export const getVideosByUnit = (unit) =>
  getVideos().filter((video) => video.unit === unit);
