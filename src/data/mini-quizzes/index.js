// Fachada canónica del producto actual. El registro histórico V1 permanece en
// physics/unit-1 para interpretar intentos 1.x, pero ya no alimenta estas rutas.
import {
  UNIT_1_MINI_QUIZ_V2_ACTIVITIES,
  localizeUnit1MiniQuizV2Activity,
} from "./unit-1-catalog.js";

export const MINI_QUIZZES_BY_UNIT = Object.freeze([
  Object.freeze({
    unit: 1,
    generation: "v2",
    familyAdapterId: "v2-u1",
    supportsRetake: false,
    miniQuizzes: UNIT_1_MINI_QUIZ_V2_ACTIVITIES,
    localizeMiniQuiz: localizeUnit1MiniQuizV2Activity,
    getRouteId: (miniQuizId) => UNIT_1_MINI_QUIZ_V2_ACTIVITIES
      .find(({ id }) => id === miniQuizId)?.routeId ?? null,
  }),
]);

export const MINI_QUIZZES = Object.freeze(
  MINI_QUIZZES_BY_UNIT.flatMap(({ miniQuizzes }) => miniQuizzes)
);

export const getMiniQuizzesByUnit = (unit) =>
  MINI_QUIZZES_BY_UNIT.find((group) => group.unit === unit)?.miniQuizzes ?? [];

export const getLocalizedMiniQuizzesByUnit = (unit, locale) => {
  const group = getMiniQuizGroupByUnit(unit);
  return group?.miniQuizzes.map((miniQuiz) => group.localizeMiniQuiz(miniQuiz, locale)) ?? [];
};

export const getMiniQuizGroupByUnit = (unit) =>
  MINI_QUIZZES_BY_UNIT.find((group) => group.unit === unit) ?? null;

export const getMiniQuizBySlug = (slug) =>
  MINI_QUIZZES.find((miniQuiz) => miniQuiz.slug === slug) ?? null;
