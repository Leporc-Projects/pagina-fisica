// Avisos públicos del sitio.
// Esta es la única fuente consumida por la portada y por /avisos.

/**
 * @typedef {Object} PublicNotice
 * @property {string} id
 * @property {string} date
 * @property {string} category
 * @property {string} title
 * @property {string} summary
 * @property {string} [content]
 * @property {boolean} [featured]
 * @property {string} [href]
 */

/** @type {PublicNotice[]} */
export const NOTICES = [
  {
    id: "sitio-primera-etapa",
    date: "2026-08-06",
    category: "Sitio",
    title: "Primera etapa de desarrollo",
    summary:
      "El sitio se encuentra en construcción. Los contenidos del curso se incorporarán y revisarán progresivamente.",
    content:
      "Las páginas pueden cambiar mientras se completa la estructura académica y se revisan los materiales antes de publicarlos.",
    featured: true,
  },
];

export const getNoticesByDate = () =>
  [...NOTICES].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
