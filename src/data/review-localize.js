import { assertSupportedLocale } from "../i18n/config.js";
import { localizeParticipationData } from "./participation-localize.js";
import { REVIEW_STATUSES } from "./review.js";

const EN_REVIEW_STATUS_LABELS = Object.freeze([
  "Pending",
  "Interesting",
  "Needs adjustments",
  "Discard",
  "Bank candidate",
]);

const labelMap = (options) => Object.fromEntries(options.map((option) => (
  Array.isArray(option) ? option : [option.value, option.label]
)));

export const localizeReviewData = (locale) => {
  assertSupportedLocale(locale);
  const participation = localizeParticipationData(locale);
  const reviewStatuses = locale === "es"
    ? REVIEW_STATUSES
    : REVIEW_STATUSES.map(([value], index) => [value, EN_REVIEW_STATUS_LABELS[index]]);

  return {
    ...participation,
    reviewStatuses,
    labels: {
      activity: labelMap(participation.activityOptions),
      support: labelMap(participation.supportOptions),
      proposalType: labelMap(participation.proposalTypes),
      studentDifficulty: labelMap(participation.difficultyEstimates),
      improvementArea: labelMap(participation.improvementAreas),
      helpfulness: labelMap(participation.helpfulnessOptions),
      reviewStatus: labelMap(reviewStatuses),
      topic: Object.fromEntries(participation.topics.map((topic) => [topic.slug, topic.title])),
    },
  };
};
