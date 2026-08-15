import { assertSupportedLocale } from "../i18n/config.js";
import { COURSE_IDS } from "./courses.js";
import { getDevelopedAcademicUnitsForCourse } from "./physics/index.js";
import {
  ACTIVITY_OPTIONS,
  HELPFULNESS_OPTIONS,
  IMPROVEMENT_AREAS,
  PROPOSAL_TYPES,
  STUDENT_DIFFICULTY_ESTIMATES,
  SUPPORT_OPTIONS,
} from "./participation.js";

const EN = Object.freeze({
  activities: Object.freeze([
    ["What was least clear?", "Identify a difficulty and, if you wish, what might help."],
    ["Propose a question or problem", "Build an idea to review and discuss through physics."],
    ["Help us improve", "Suggest a useful change to an explanation or the page."],
  ]),
  support: Object.freeze(["Another explanation", "An example", "A graph", "A simulation", "More practice", "Something else"]),
  proposalTypes: Object.freeze(["Conceptual question", "Problem", "Graph-based question", "Challenge"]),
  difficulties: Object.freeze(["Introductory", "Intermediate", "Advanced"]),
  areas: Object.freeze(["Explanation", "Formula", "Graph", "Example", "Exercise", "Navigation", "Design", "Accessibility", "Something else"]),
  helpfulness: Object.freeze(["Helped me", "Partly helped", "Did not help"]),
});

const localizePairs = (source, labels) => {
  if (source.length !== labels.length) throw new RangeError("English participation options changed structure.");
  return source.map(([value], index) => [value, labels[index]]);
};

/**
 * Vocabulario público de Participa: actividades, opciones y el catálogo de
 * unidades/temas de Física Básica I, localizados. Las unidades se derivan del
 * registro académico genérico (`getDevelopedAcademicUnitsForCourse`), así que
 * Unidades 4-7 se incorporan sin editar este módulo. `topics` aplana ese
 * catálogo para los consumidores que solo necesitan slug + título, como el
 * filtro de tema del Centro de revisión.
 */
export const localizeParticipationData = (locale) => {
  assertSupportedLocale(locale);
  const units = getDevelopedAcademicUnitsForCourse(COURSE_IDS.PHYSICS_BASIC_1, locale);
  const topics = units.flatMap((unit) => unit.topics.map((topic) => ({ slug: topic.slug, title: topic.title })));

  if (locale === "es") {
    return {
      units,
      topics,
      activityOptions: ACTIVITY_OPTIONS,
      supportOptions: SUPPORT_OPTIONS,
      proposalTypes: PROPOSAL_TYPES,
      difficultyEstimates: STUDENT_DIFFICULTY_ESTIMATES,
      improvementAreas: IMPROVEMENT_AREAS,
      helpfulnessOptions: HELPFULNESS_OPTIONS,
    };
  }

  return {
    units,
    topics,
    activityOptions: ACTIVITY_OPTIONS.map((option, index) => ({
      ...option,
      label: EN.activities[index][0],
      description: EN.activities[index][1],
    })),
    supportOptions: localizePairs(SUPPORT_OPTIONS, EN.support),
    proposalTypes: localizePairs(PROPOSAL_TYPES, EN.proposalTypes),
    difficultyEstimates: localizePairs(STUDENT_DIFFICULTY_ESTIMATES, EN.difficulties),
    improvementAreas: localizePairs(IMPROVEMENT_AREAS, EN.areas),
    helpfulnessOptions: localizePairs(HELPFULNESS_OPTIONS, EN.helpfulness),
  };
};
