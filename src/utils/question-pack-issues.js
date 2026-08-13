import { t } from "../i18n/index.js";

export const formatQuestionIssue = (issue, locale) => t(
  locale,
  `teacher.question.issue.${issue.code}`,
  issue.params ?? {},
);

export const formatQuestionIssues = (issues, locale) =>
  issues.map((issue) => formatQuestionIssue(issue, locale));
