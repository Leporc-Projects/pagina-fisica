// Fachada canónica del producto actual. El registro histórico conserva nombres
// `bonus-*` dentro del esquema 1.x para no invalidar intentos exportados.
import { UNIT_1_BONUSES } from "../physics/unit-1/bonuses.js";

export const MINI_QUIZZES_BY_UNIT = Object.freeze([
  Object.freeze({ unit: 1, miniQuizzes: UNIT_1_BONUSES }),
]);

export const MINI_QUIZZES = Object.freeze(
  MINI_QUIZZES_BY_UNIT.flatMap(({ miniQuizzes }) => miniQuizzes)
);

export const getMiniQuizzesByUnit = (unit) =>
  MINI_QUIZZES_BY_UNIT.find((group) => group.unit === unit)?.miniQuizzes ?? [];

export const getMiniQuizBySlug = (slug) =>
  MINI_QUIZZES.find((miniQuiz) => miniQuiz.slug === slug) ?? null;
