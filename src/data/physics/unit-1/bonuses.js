const publicLearningBonus = (definition) => ({
  version: 1,
  unit: 1,
  modality: "bonus",
  purpose: "learning",
  exposure: "public",
  feedbackPolicy: "afterAttempt",
  status: "published",
  ...definition,
});

export const UNIT_1_BONUSES = [
  publicLearningBonus({
    id: "bonus-u1-tools-vectors",
    slug: "herramientas-vectores",
    title: "Mini quiz de herramientas y vectores",
    shortTitle: "Herramientas y vectores",
    description:
      "Comprueba unidades, componentes y operaciones vectoriales con una tanda breve.",
    topics: ["herramientas", "vectores"],
    questionCount: 5,
    estimatedMinutes: 12,
    blueprint: [
      {
        id: "tools-units",
        label: "Herramientas y unidades",
        count: 1,
        criteria: { topic: ["herramientas"] },
      },
      {
        id: "vector-direct",
        label: "Aplicación directa de vectores",
        count: 2,
        criteria: {
          topic: ["vectores"],
          type: ["conceptual", "numerical", "symbolic"],
          difficulty: [1, 2, 3],
        },
      },
      {
        id: "vector-visual",
        label: "Representación vectorial visual",
        count: 1,
        criteria: {
          topic: ["vectores"],
          representation: ["graphical", "visual"],
        },
      },
      {
        id: "vector-reasoning",
        label: "Razonamiento vectorial",
        count: 1,
        criteria: {
          topic: ["vectores"],
          difficulty: [3, 4],
          type: ["symbolic", "graphical", "integrative"],
        },
      },
    ],
  }),
  publicLearningBonus({
    id: "bonus-u1-kinematics",
    slug: "cinematica",
    title: "Mini quiz de cinemática",
    shortTitle: "Cinemática",
    description:
      "Revisa referencias, signos, gráficas y modelos de movimiento en una dimensión.",
    topics: ["movimiento-1d", "ecuaciones-movimiento"],
    questionCount: 6,
    estimatedMinutes: 15,
    blueprint: [
      {
        id: "reference-position",
        label: "Posición, desplazamiento y referencia",
        count: 1,
        criteria: {
          topic: ["movimiento-1d"],
          subtopic: ["referencia-y-posicion"],
        },
      },
      {
        id: "velocity-acceleration-signs",
        label: "Signos de velocidad y aceleración",
        count: 1,
        criteria: {
          topic: ["movimiento-1d"],
          subtopic: ["aceleracion-y-signos"],
        },
      },
      {
        id: "kinematics-graphs",
        label: "Gráficas de movimiento",
        count: 2,
        criteria: {
          topic: ["movimiento-1d", "ecuaciones-movimiento"],
          representation: ["graphical", "visual"],
        },
      },
      {
        id: "constant-or-freefall",
        label: "Aceleración constante o caída libre",
        count: 1,
        criteria: {
          topic: ["ecuaciones-movimiento"],
          subtopic: ["aceleracion-constante", "caida-libre"],
        },
      },
      {
        id: "turning-or-integration",
        label: "Cambio de sentido o integración",
        count: 1,
        criteria: {
          topic: ["ecuaciones-movimiento"],
          subtopic: ["cambio-de-sentido", "integracion"],
        },
      },
    ],
  }),
  publicLearningBonus({
    id: "bonus-u1-motion-2d-circular-relative",
    slug: "movimiento-2d-circular-relativo",
    title: "Mini quiz de movimiento en 2D, circular y relativo",
    shortTitle: "Movimiento 2D, circular y relativo",
    description:
      "Conecta proyectiles, movimiento circular y composición de velocidades.",
    topics: ["movimiento-2d", "circular-relativo"],
    questionCount: 5,
    estimatedMinutes: 14,
    blueprint: [
      {
        id: "projectiles",
        label: "Movimiento en 2D y proyectiles",
        count: 2,
        criteria: {
          topic: ["movimiento-2d"],
          subtopic: ["proyectiles"],
        },
      },
      {
        id: "circular-motion",
        label: "Movimiento circular",
        count: 1,
        criteria: {
          topic: ["circular-relativo"],
          subtopic: ["movimiento-circular"],
        },
      },
      {
        id: "relative-velocity",
        label: "Velocidad relativa",
        count: 1,
        criteria: {
          topic: ["circular-relativo"],
          subtopic: ["velocidad-relativa"],
        },
      },
      {
        id: "visual-integration",
        label: "Representación visual integradora",
        count: 1,
        criteria: {
          topic: ["movimiento-2d", "circular-relativo"],
          representation: ["graphical", "visual"],
        },
      },
    ],
  }),
  publicLearningBonus({
    id: "bonus-u1-review",
    slug: "repaso-unidad-1",
    title: "Mini quiz de repaso de Unidad 1",
    shortTitle: "Repaso de Unidad 1",
    description:
      "Recorre las ideas principales de la unidad con preguntas numéricas, conceptuales y visuales.",
    topics: [
      "herramientas",
      "vectores",
      "movimiento-1d",
      "ecuaciones-movimiento",
      "movimiento-2d",
      "circular-relativo",
    ],
    questionCount: 8,
    estimatedMinutes: 20,
    blueprint: [
      {
        id: "review-tools-simple",
        label: "Herramientas",
        count: 1,
        criteria: { topic: ["herramientas"], difficulty: [1, 2] },
      },
      {
        id: "review-vector-direct-simple",
        label: "Vectores: aplicación directa",
        count: 1,
        criteria: {
          topic: ["vectores"],
          difficulty: [1, 2],
          representation: ["verbal", "numerical", "vectorial"],
        },
      },
      {
        id: "review-vector-visual",
        label: "Vectores: representación visual",
        count: 1,
        criteria: {
          topic: ["vectores"],
          representation: ["graphical", "visual"],
          difficulty: [3],
        },
      },
      {
        id: "review-kinematics",
        label: "Cinemática en una dimensión",
        count: 1,
        criteria: { topic: ["movimiento-1d"], difficulty: [2, 3] },
      },
      {
        id: "review-kinematics-analysis",
        label: "Análisis de una gráfica cinemática",
        count: 1,
        criteria: {
          topic: ["movimiento-1d"],
          representation: ["graphical"],
          difficulty: [4],
        },
      },
      {
        id: "review-constant-motion",
        label: "Aceleración constante o caída libre",
        count: 1,
        criteria: {
          topic: ["ecuaciones-movimiento"],
          subtopic: ["aceleracion-constante", "caida-libre"],
          difficulty: [2, 3],
        },
      },
      {
        id: "review-projectiles",
        label: "Movimiento en 2D y proyectiles",
        count: 1,
        criteria: {
          topic: ["movimiento-2d"],
          subtopic: ["proyectiles"],
          difficulty: [2, 3],
        },
      },
      {
        id: "review-circular-relative-analysis",
        label: "Movimiento circular o velocidad relativa",
        count: 1,
        criteria: {
          topic: ["circular-relativo"],
          difficulty: [4],
        },
      },
    ],
  }),
];

export const getUnit1Bonus = (slug) =>
  UNIT_1_BONUSES.find((bonus) => bonus.slug === slug);
