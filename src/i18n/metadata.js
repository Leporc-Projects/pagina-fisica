import { getLocaleConfig } from "./config.js";
import { getRouteAlternates, getXDefaultPath } from "./routes.js";

export const getLanguageMetadata = (locale, routeId) => {
  const localeConfig = getLocaleConfig(locale);
  const alternates = getRouteAlternates(routeId);
  const canonicalPath = alternates.find((entry) => entry.locale === locale)?.path ?? null;
  return {
    htmlLang: localeConfig.htmlLang,
    canonicalPath,
    alternates: alternates.map((entry) => ({
      hreflang: getLocaleConfig(entry.locale).htmlLang,
      path: entry.path,
    })),
    xDefaultPath: getXDefaultPath(routeId),
  };
};
