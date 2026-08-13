import { assertSupportedLocale } from "../i18n/config.js";
import { t } from "../i18n/index.js";

export const noticeCategoryLabel = (category, locale) => {
  assertSupportedLocale(locale);
  return t(locale, `teacher.notice.category.${category}`);
};
