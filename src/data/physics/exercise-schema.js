// Taxonomía compartida por todos los bancos académicos. Las unidades aportan
// contenido y grading; estos enums definen el contrato común.
export const EXERCISE_MODALITIES = [
  "review", "practice", "selfAssessment", "tutoring", "bonus",
];
export const EXERCISE_INTERACTION_KINDS = ["singleChoice", "number", "multiNumber"];
export const EXERCISE_TYPES = [
  "conceptual", "numerical", "graphical", "symbolic", "estimation", "application", "integrative",
];
export const EXERCISE_REPRESENTATIONS = [
  "verbal", "numerical", "symbolic", "graphical", "vectorial", "visual",
];
export const EXERCISE_COGNITIVE_LEVELS = [
  "recognize", "understand", "apply", "analyze", "integrate",
];
export const EXERCISE_STATUSES = ["draft", "review", "published"];
export const EXERCISE_PURPOSES = ["learning", "measurement"];
export const EXERCISE_EXPOSURES = ["public", "restricted"];
