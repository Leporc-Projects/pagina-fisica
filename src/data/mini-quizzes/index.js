// Fachada canónica del producto actual. El registro histórico conserva nombres
// `bonus-*` dentro del esquema 1.x para no invalidar intentos exportados.
import { UNIT_1_BONUSES } from "../physics/unit-1/bonuses.js";
import { getUnit1MiniQuizRouteId, localizeUnit1MiniQuiz } from "../physics/unit-1/localize.js";

export const MINI_QUIZZES_BY_UNIT = Object.freeze([
  Object.freeze({
    unit: 1,
    generation: "legacy-v1",
    familyAdapterId: "legacy-u1",
    miniQuizzes: UNIT_1_BONUSES,
    localizeMiniQuiz: localizeUnit1MiniQuiz,
    getRouteId: getUnit1MiniQuizRouteId,
  }),
]);

export const MINI_QUIZZES = Object.freeze(
  MINI_QUIZZES_BY_UNIT.flatMap(({ miniQuizzes }) => miniQuizzes)
);

export const getMiniQuizzesByUnit = (unit) =>
  MINI_QUIZZES_BY_UNIT.find((group) => group.unit === unit)?.miniQuizzes ?? [];

export const getMiniQuizGroupByUnit = (unit) =>
  MINI_QUIZZES_BY_UNIT.find((group) => group.unit === unit) ?? null;

export const getMiniQuizBySlug = (slug) =>
  MINI_QUIZZES.find((miniQuiz) => miniQuiz.slug === slug) ?? null;
