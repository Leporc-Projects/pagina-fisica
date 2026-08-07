// Metadatos editoriales de la Unidad 1. Las rutas, el orden y la clasificación
// de profundidad se consumen en índices, navegación, páginas y validaciones.

const unitRoute = "/fisica-basica-1/unidades/unidad-1";

export const UNIT_1 = {
  number: 1,
  slug: "unidad-1",
  title: "Vectores y cinemática",
  shortTitle: "Unidad 1",
  chapters: "Capítulos 1, 2 y 3",
  status: "published",
  route: unitRoute,
  practiceRoute: "/fisica-basica-1/ejercicios/unidad-1",
  description:
    "Herramientas de medición, álgebra vectorial y descripción del movimiento en una, dos y tres dimensiones.",
  sourceScope: {
    stable: "Programa oficial 0302270 de Física Básica I",
    semester: "Programa clase a clase de Física Básica I 2026-2",
  },
  topics: [
    {
      order: 1,
      slug: "herramientas",
      title: "Herramientas para describir la física",
      shortTitle: "Herramientas",
      route: `${unitRoute}/herramientas`,
      priority: "core",
      summary:
        "Magnitudes, Sistema Internacional, conversiones, cifras significativas, análisis dimensional y estimaciones.",
    },
    {
      order: 2,
      slug: "vectores",
      title: "Vectores",
      shortTitle: "Vectores",
      route: `${unitRoute}/vectores`,
      priority: "core",
      summary:
        "Componentes, bases, suma y resta, producto escalar y producto vectorial.",
    },
    {
      order: 3,
      slug: "movimiento-1d",
      title: "Movimiento en una dimensión",
      shortTitle: "Movimiento 1D",
      route: `${unitRoute}/movimiento-1d`,
      priority: "core",
      summary:
        "Posición, desplazamiento, distancia, velocidad, rapidez, aceleración y lectura de gráficas.",
    },
    {
      order: 4,
      slug: "ecuaciones-movimiento",
      title: "Ecuaciones del movimiento",
      shortTitle: "Ecuaciones",
      route: `${unitRoute}/ecuaciones-movimiento`,
      priority: "core",
      summary:
        "Aceleración constante, cambio de sentido, caída libre e integración para aceleración variable.",
    },
    {
      order: 5,
      slug: "movimiento-2d",
      title: "Movimiento en dos y tres dimensiones",
      shortTitle: "Movimiento 2D/3D",
      route: `${unitRoute}/movimiento-2d`,
      priority: "core",
      summary:
        "Vectores de posición, velocidad y aceleración, componentes de trayectoria y proyectiles.",
    },
    {
      order: 6,
      slug: "circular-relativo",
      title: "Movimiento circular y velocidad relativa",
      shortTitle: "Circular y relativo",
      route: `${unitRoute}/circular-relativo`,
      priority: "core",
      summary:
        "Aceleración radial, rapidez variable, composición de velocidades y marcos de referencia.",
    },
    {
      order: 7,
      slug: "coordenadas-polares",
      title: "Ampliación: coordenadas polares",
      shortTitle: "Coordenadas polares",
      route: `${unitRoute}/coordenadas-polares`,
      priority: "extension",
      summary:
        "Base radial/transversal, velocidad y aceleración en coordenadas polares.",
    },
  ],
};

export const getUnit1Topic = (slug) =>
  UNIT_1.topics.find((topic) => topic.slug === slug);

export const getUnit1TopicNeighbors = (slug) => {
  const index = UNIT_1.topics.findIndex((topic) => topic.slug === slug);

  if (index === -1) return { previous: null, next: null };

  return {
    previous: UNIT_1.topics[index - 1] ?? null,
    next: UNIT_1.topics[index + 1] ?? null,
  };
};
