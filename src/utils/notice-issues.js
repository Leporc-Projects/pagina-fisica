import { t } from "../i18n/index.js";

export const formatNoticeIssues = (issues, locale) =>
  issues.map((issue) => t(locale, `teacher.notice.issue.${issue.code}`, issue.params ?? {}));
