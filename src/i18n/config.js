export const DEFAULT_LOCALE = "es";

export const LOCALES = Object.freeze({
  es: Object.freeze({
    id: "es",
    htmlLang: "es",
    intlLocale: "es-CO",
    label: "Español",
    short: "ES",
  }),
  en: Object.freeze({
    id: "en",
    htmlLang: "en",
    intlLocale: "en-US",
    label: "English",
    short: "EN",
  }),
});

export const SUPPORTED_LOCALES = Object.freeze(Object.keys(LOCALES));

export const isSupportedLocale = (locale) =>
  typeof locale === "string" && SUPPORTED_LOCALES.includes(locale);

export const assertSupportedLocale = (locale) => {
  if (!isSupportedLocale(locale)) {
    throw new RangeError(`Unsupported locale: ${String(locale)}`);
  }
  return locale;
};

export const getLocaleConfig = (locale) => LOCALES[assertSupportedLocale(locale)];

export const getLocaleFromPath = (pathname) => {
  const normalized = String(pathname ?? "/").replace(/^\/+/, "");
  const firstSegment = normalized.split("/", 1)[0];
  return isSupportedLocale(firstSegment) && firstSegment !== DEFAULT_LOCALE
    ? firstSegment
    : DEFAULT_LOCALE;
};
