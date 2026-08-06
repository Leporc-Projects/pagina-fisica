// Fuente editorial única de avisos públicos.
// La portada muestra una selección y /avisos presenta el archivo completo.

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

/**
 * Los avisos pueden describir publicaciones o el estado real del sitio, pero no
 * deben inventar eventos académicos. Los identificadores son estables y únicos.
 * @type {PublicNotice[]}
 */
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

// sort() modifica el arreglo; se ordena una copia para mantener NOTICES como fuente inmutable.
export const getNoticesByDate = () =>
  [...NOTICES].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
