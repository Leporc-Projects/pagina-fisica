const LOCALES = new Set(["es", "en"]);
const SIMULATION_IDS = new Set([
  "kinematics-1d",
  "projectile-2d",
  "forces-friction",
  "pulley-systems",
]);
const STABLE_ID = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export const ANALYTICS_EVENT_CONTRACTS = Object.freeze({
  simulation_start: Object.freeze(["simulation", "locale"]),
  practice_new_batch: Object.freeze(["unit", "locale"]),
  mini_quiz_start: Object.freeze(["quiz", "locale"]),
  mini_quiz_complete: Object.freeze(["quiz", "locale"]),
  language_change: Object.freeze(["from_locale", "to_locale", "route_id?"]),
});

const isLocale = (value) => typeof value === "string" && LOCALES.has(value);
const isStableId = (value) =>
  typeof value === "string" && value.length <= 96 && STABLE_ID.test(value);

const validators = Object.freeze({
  simulation_start: (data) =>
    SIMULATION_IDS.has(data.simulation) && isLocale(data.locale),
  practice_new_batch: (data) =>
    Number.isInteger(data.unit) && data.unit >= 1 && data.unit <= 7 && isLocale(data.locale),
  mini_quiz_start: (data) => isStableId(data.quiz) && isLocale(data.locale),
  mini_quiz_complete: (data) => isStableId(data.quiz) && isLocale(data.locale),
  language_change: (data) =>
    isLocale(data.from_locale) &&
    isLocale(data.to_locale) &&
    data.from_locale !== data.to_locale &&
    (data.route_id === undefined || isStableId(data.route_id)),
});

const hasExactProperties = (eventName, data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const contract = ANALYTICS_EVENT_CONTRACTS[eventName];
  if (!contract) return false;
  const required = contract.filter((key) => !key.endsWith("?"));
  const allowed = new Set(contract.map((key) => key.replace(/\?$/, "")));
  const keys = Object.keys(data);
  return required.every((key) => Object.hasOwn(data, key)) &&
    keys.every((key) => allowed.has(key));
};

export const validateAnalyticsEvent = (eventName, data) =>
  hasExactProperties(eventName, data) && validators[eventName](data);

const trackAllowedEvent = (eventName, data) => {
  if (!validateAnalyticsEvent(eventName, data)) return false;
  if (typeof window === "undefined" || typeof window.umami?.track !== "function") return false;
  try {
    window.umami.track(eventName, data);
    return true;
  } catch {
    return false;
  }
};

export const createAnalyticsOneShot = (track) => {
  if (typeof track !== "function") throw new TypeError("Analytics one-shot requires a function.");
  let handled = false;
  return () => {
    if (handled) return false;
    handled = true;
    track();
    return true;
  };
};

export const trackSimulationStart = (simulation, locale) =>
  trackAllowedEvent("simulation_start", { simulation, locale });

export const trackPracticeNewBatch = (unit, locale) =>
  trackAllowedEvent("practice_new_batch", { unit, locale });

export const trackMiniQuizStart = (quiz, locale) =>
  trackAllowedEvent("mini_quiz_start", { quiz, locale });

export const trackMiniQuizComplete = (quiz, locale) =>
  trackAllowedEvent("mini_quiz_complete", { quiz, locale });

export const trackLanguageChange = (fromLocale, toLocale, routeId) =>
  trackAllowedEvent("language_change", {
    from_locale: fromLocale,
    to_locale: toLocale,
    ...(routeId ? { route_id: routeId } : {}),
  });
