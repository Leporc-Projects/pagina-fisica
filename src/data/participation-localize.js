import { assertSupportedLocale } from "../i18n/config.js";
import { localizeCourseData } from "./course-localize.js";
import {
  ACTIVITY_OPTIONS,
  HELPFULNESS_OPTIONS,
  IMPROVEMENT_AREAS,
  PARTICIPATION_CONTEXT,
  PARTICIPATION_TOPICS,
  PROPOSAL_TYPES,
  STUDENT_DIFFICULTY_ESTIMATES,
  SUPPORT_OPTIONS,
} from "./participation.js";
import { localizeUnit1 } from "./physics/unit-1/localize.js";

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

export const localizeParticipationData = (locale) => {
  assertSupportedLocale(locale);
  if (locale === "es") {
    return {
      context: PARTICIPATION_CONTEXT,
      topics: PARTICIPATION_TOPICS,
      activityOptions: ACTIVITY_OPTIONS,
      supportOptions: SUPPORT_OPTIONS,
      proposalTypes: PROPOSAL_TYPES,
      difficultyEstimates: STUDENT_DIFFICULTY_ESTIMATES,
      improvementAreas: IMPROVEMENT_AREAS,
      helpfulnessOptions: HELPFULNESS_OPTIONS,
    };
  }

  const { COURSE } = localizeCourseData(locale);
  const unit = localizeUnit1(locale);
  return {
    context: {
      course: { ...PARTICIPATION_CONTEXT.course, title: COURSE.name },
      unit: { ...PARTICIPATION_CONTEXT.unit, title: unit.title },
    },
    topics: PARTICIPATION_TOPICS.map((topic) => ({
      ...topic,
      title: unit.topics.find((candidate) => candidate.slug === topic.slug)?.title
        ?? (() => { throw new RangeError(`Missing English participation topic: ${topic.slug}`); })(),
    })),
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
