// Vocabulario editorial público de la participación local. El ámbito, el
// curso, la unidad y el tema se resuelven en utils/participation.js contra el
// registro académico genérico; este módulo no importa una unidad concreta.
export const ACTIVITY_TYPES = [
  "concept-difficulty",
  "student-question-proposal",
  "improvement-feedback",
];

export const ACTIVITY_OPTIONS = [
  {
    value: "concept-difficulty",
    label: "¿Qué te quedó menos claro?",
    description: "Identifica una dificultad y, si quieres, qué podría ayudarte.",
  },
  {
    value: "student-question-proposal",
    label: "Propón una pregunta o problema",
    description: "Construye una idea para revisarla y conversar sobre física.",
  },
  {
    value: "improvement-feedback",
    label: "Ayúdanos a mejorar",
    description: "Señala un cambio útil en una explicación o en la página.",
  },
];

export const SUPPORT_OPTIONS = [
  ["another-explanation", "Otra explicación"],
  ["example", "Un ejemplo"],
  ["graph", "Una gráfica"],
  ["simulation", "Una simulación"],
  ["more-practice", "Más práctica"],
  ["other", "Otra cosa"],
];

export const PROPOSAL_TYPES = [
  ["conceptual-question", "Pregunta conceptual"],
  ["problem", "Problema"],
  ["graph-question", "Pregunta basada en una gráfica"],
  ["challenge", "Reto"],
];

export const STUDENT_DIFFICULTY_ESTIMATES = [
  ["introductory", "Inicial"],
  ["intermediate", "Intermedia"],
  ["advanced", "Avanzada"],
];

export const IMPROVEMENT_AREAS = [
  ["explanation", "Explicación"],
  ["formula", "Fórmula"],
  ["graph", "Gráfica"],
  ["example", "Ejemplo"],
  ["exercise", "Ejercicio"],
  ["navigation", "Navegación"],
  ["design", "Diseño"],
  ["accessibility", "Accesibilidad"],
  ["other", "Otra cosa"],
];

export const HELPFULNESS_OPTIONS = [
  ["helped", "Me ayudó"],
  ["partly-helped", "Parcialmente"],
  ["did-not-help", "No me ayudó"],
];
