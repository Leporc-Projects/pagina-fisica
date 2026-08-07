// Selector puro para Práctica abierta. Filtra y compone tandas diversas sin
// aleatoriedad opaca, persistencia ni conocimiento del DOM.

const matchesFilter = (exercise, filters) =>
  (!filters.topic || filters.topic === "all" || exercise.topic === filters.topic) &&
  (!filters.difficulty || filters.difficulty === "all" || String(exercise.difficulty) === String(filters.difficulty)) &&
  (!filters.type || filters.type === "all" || exercise.type === filters.type);

export const filterExercises = (exercises, filters = {}) =>
  exercises.filter((exercise) => matchesFilter(exercise, filters));

/**
 * Prioriza IDs no vistos y después categorías todavía ausentes en la tanda.
 * La rotación solo desempata de forma reproducible para que “Otros 5” cambie
 * la selección sin convertir el banco en un shuffle ciego.
 */
export const selectExerciseBatch = ({
  exercises,
  filters = {},
  seenIds = new Set(),
  size = 5,
  rotation = 0,
  includeId = null,
}) => {
  if (!Array.isArray(exercises)) {
    throw new TypeError("exercises debe ser una lista.");
  }
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError("size debe ser un entero positivo.");
  }

  const eligible = filterExercises(exercises, filters);
  if (eligible.length === 0) return [];
  const offset = ((rotation % eligible.length) + eligible.length) % eligible.length;
  const ordered = [...eligible.slice(offset), ...eligible.slice(0, offset)];
  const selected = [];
  const included = includeId
    ? eligible.find((exercise) => exercise.id === includeId)
    : null;

  if (included) selected.push(included);

  while (selected.length < Math.min(size, eligible.length)) {
    const topics = new Set(selected.map((item) => item.topic));
    const types = new Set(selected.map((item) => item.type));
    const representations = new Set(selected.map((item) => item.representation));
    const difficulties = new Set(selected.map((item) => item.difficulty));
    let best = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const candidate of ordered) {
      if (selected.some((item) => item.id === candidate.id)) continue;
      const score =
        (seenIds.has(candidate.id) ? 0 : 100) +
        (topics.has(candidate.topic) ? 0 : 16) +
        (types.has(candidate.type) ? 0 : 8) +
        (representations.has(candidate.representation) ? 0 : 4) +
        (difficulties.has(candidate.difficulty) ? 0 : 2);

      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }

    if (!best) break;
    selected.push(best);
  }

  return selected;
};
