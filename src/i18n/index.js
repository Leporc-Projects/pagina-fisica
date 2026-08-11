import { assertSupportedLocale } from "./config.js";
import es from "./ui/es.js";
import en from "./ui/en.js";

export const UI_DICTIONARIES = Object.freeze({ es, en });

export const getDictionaryKeys = (locale) =>
  Object.keys(UI_DICTIONARIES[assertSupportedLocale(locale)]).sort();

export const t = (locale, key, params = {}) => {
  const dictionary = UI_DICTIONARIES[assertSupportedLocale(locale)];
  if (!Object.hasOwn(dictionary, key)) {
    throw new RangeError(`Missing translation key “${String(key)}” for ${locale}.`);
  }
  const value = dictionary[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`Translation key “${key}” for ${locale} must be a non-empty string.`);
  }
  return value.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, name) => {
    if (!Object.hasOwn(params, name)) {
      throw new RangeError(`Missing interpolation parameter “${name}” for “${key}”.`);
    }
    const replacement = params[name];
    if (!["string", "number", "boolean"].includes(typeof replacement)) {
      throw new TypeError(`Interpolation parameter “${name}” must be primitive.`);
    }
    const text = String(replacement);
    if (/[<>]/.test(text)) {
      throw new TypeError(`Interpolation parameter “${name}” cannot contain markup delimiters.`);
    }
    return text;
  });
};

export const formatNumber = (locale, value, options = {}) => {
  if (!Number.isFinite(value)) throw new TypeError("Only finite numbers can be formatted.");
  return new Intl.NumberFormat(assertSupportedLocale(locale) === "es" ? "es-CO" : "en-US", {
    maximumFractionDigits: 2,
    ...options,
  }).format(Object.is(value, -0) ? 0 : value);
};
