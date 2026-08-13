import { assertSupportedLocale } from "../i18n/config.js";
import {
  DUPLICATE_POLICIES,
  MISSING_POLICIES,
  SCORE_MAXIMUM_MODES,
} from "./results-organizer.js";

const EN = Object.freeze({
  duplicatePolicies: Object.freeze([
    "Requires review",
    "First attempt",
    "Last attempt",
    "Highest result",
    "Average",
  ]),
  missingPolicies: Object.freeze([
    "Do not calculate until missing results are resolved",
    "Exclude missing results",
    "Treat missing results as zero",
  ]),
  scoreMaximumModes: Object.freeze([
    "Score includes maximum (8/10)",
    "Fixed maximum for this source",
    "Maximum in another column",
    "Scale still unknown",
  ]),
});

const project = (source, labels) => source.map(([value, label], index) => [
  value,
  labels?.[index] ?? label,
]);

export const localizeResultsOrganizerData = (locale) => {
  assertSupportedLocale(locale);
  const labels = locale === "en" ? EN : {};
  return {
    duplicatePolicies: project(DUPLICATE_POLICIES, labels.duplicatePolicies),
    missingPolicies: project(MISSING_POLICIES, labels.missingPolicies),
    scoreMaximumModes: project(SCORE_MAXIMUM_MODES, labels.scoreMaximumModes),
  };
};
