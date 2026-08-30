import { assertSupportedLocale } from "../../../i18n/config.js";
import { ROUTE_IDS, getLocalizedPath } from "../../../i18n/routes.js";
import { UNIT_1, getUnit1Topic, getUnit1TopicNeighbors } from "./unit.js";
import { UNIT_1_BONUSES } from "./bonuses.js";
import { UNIT_1_CONTENT } from "./content.js";
import { UNIT_1_COMMON_ERRORS } from "./common-errors.js";
import { UNIT_1_FORMULAS } from "./formulas.js";
import { UNIT_1_VISUALIZATIONS } from "./visualizations.js";
import contentEn from "./i18n/content.en.js";
import commonErrorsEn from "./i18n/common-errors.en.js";
import formulasEn from "./i18n/formulas.en.js";
import visualizationsEn from "./i18n/visualizations.en.js";
import { localizeAcademicUnitLabel } from "../localize-unit-label.js";

const EN_UNIT = Object.freeze({
  title: "Vectors and kinematics",
  shortTitle: "Unit 1",
  chapters: "Chapters 1, 2 and 3",
  description: "Measurement tools, vector algebra, and descriptions of motion in one, two, and three dimensions.",
  topics: Object.freeze({
    herramientas: Object.freeze({ title: "Tools for describing physics", shortTitle: "Measurement tools", summary: "Physical quantities, the International System, conversions, significant figures, dimensional analysis, and estimates." }),
    vectores: Object.freeze({ title: "Vectors", shortTitle: "Vectors", summary: "Components, bases, addition and subtraction, dot product, and cross product." }),
    "movimiento-1d": Object.freeze({ title: "One-dimensional motion", shortTitle: "1D motion", summary: "Position, displacement, distance, velocity, speed, acceleration, and graph reading." }),
    "ecuaciones-movimiento": Object.freeze({ title: "Equations of motion", shortTitle: "Equations", summary: "Constant acceleration, change of direction, free fall, and integration for variable acceleration." }),
    "movimiento-2d": Object.freeze({ title: "Motion in two and three dimensions", shortTitle: "2D/3D motion", summary: "Position, velocity, and acceleration vectors, trajectory components, and projectiles." }),
    "circular-relativo": Object.freeze({ title: "Circular motion and relative velocity", shortTitle: "Circular and relative", summary: "Radial acceleration, variable speed, velocity composition, and reference frames." }),
    "coordenadas-polares": Object.freeze({ title: "Polar coordinates", shortTitle: "Polar coordinates", summary: "Radial/transverse basis, velocity, and acceleration in polar coordinates." }),
  }),
});

const TOPIC_ROUTE_IDS = Object.freeze({
  herramientas: ROUTE_IDS.COURSE_UNIT_1_TOPIC_TOOLS,
  vectores: ROUTE_IDS.COURSE_UNIT_1_TOPIC_VECTORS,
  "movimiento-1d": ROUTE_IDS.COURSE_UNIT_1_TOPIC_MOTION_1D,
  "ecuaciones-movimiento": ROUTE_IDS.COURSE_UNIT_1_TOPIC_EQUATIONS,
  "movimiento-2d": ROUTE_IDS.COURSE_UNIT_1_TOPIC_MOTION_2D,
  "circular-relativo": ROUTE_IDS.COURSE_UNIT_1_TOPIC_CIRCULAR_RELATIVE,
  "coordenadas-polares": ROUTE_IDS.COURSE_UNIT_1_TOPIC_POLAR,
});

// IDs, order, priorities, and every numeric or mathematical contract remain in
// the source record. This adapter only projects reviewed presentation by locale.
export const localizeUnit1 = (locale) => {
  assertSupportedLocale(locale);
  if (locale === "es") return UNIT_1;

  return {
    ...UNIT_1,
    ...EN_UNIT,
    route: getLocalizedPath(ROUTE_IDS.COURSE_UNIT_1, locale),
    practiceRoute: getLocalizedPath(ROUTE_IDS.COURSE_UNIT_1_PRACTICE, locale),
    miniQuizRoute: getLocalizedPath(ROUTE_IDS.COURSE_MINI_QUIZZES, locale),
    bonusRoute: null,
    topics: UNIT_1.topics.map((topic) => ({
      ...topic,
      ...EN_UNIT.topics[topic.slug],
      route: getLocalizedPath(TOPIC_ROUTE_IDS[topic.slug], locale),
    })),
  };
};

export const getLocalizedUnit1Topic = (slug, locale) =>
  localizeUnit1(locale).topics.find((topic) => topic.slug === slug) ?? null;

export const getLocalizedUnit1TopicNeighbors = (slug, locale) => {
  assertSupportedLocale(locale);
  if (locale === "es") return getUnit1TopicNeighbors(slug);
  const topics = localizeUnit1(locale).topics;
  const index = topics.findIndex((topic) => topic.slug === slug);
  return index === -1
    ? { previous: null, next: null }
    : { previous: topics[index - 1] ?? null, next: topics[index + 1] ?? null };
};

export const getUnit1TopicInvariant = (slug) => getUnit1Topic(slug);

export const getUnit1TopicRouteId = (slug) => TOPIC_ROUTE_IDS[slug] ?? null;

const requireTranslation = (value, context) => {
  if (value === undefined || value === null) {
    throw new RangeError(`Missing English Unit 1 translation: ${context}`);
  }
  return value;
};

const requireParallelArray = (source, translation, context) => {
  requireTranslation(translation, context);
  if (!Array.isArray(translation) || translation.length !== source.length) {
    throw new RangeError(`English Unit 1 translation changed academic structure: ${context}`);
  }
  return translation;
};

export const localizeUnit1Content = (locale) => {
  assertSupportedLocale(locale);
  if (locale === "es") return UNIT_1_CONTENT;

  return Object.fromEntries(Object.entries(UNIT_1_CONTENT).map(([slug, topic]) => {
    const translation = requireTranslation(contentEn[slug], slug);
    const sections = topic.sections.map((section) => {
      const localized = requireTranslation(translation.sections?.[section.id], `${slug}.${section.id}`);
      const result = {
        ...section,
        ...localized,
        id: section.id,
        essential: requireParallelArray(section.essential, localized.essential, `${slug}.${section.id}.essential`),
        understand: requireParallelArray(section.understand, localized.understand, `${slug}.${section.id}.understand`),
        deepen: requireParallelArray(section.deepen, localized.deepen, `${slug}.${section.id}.deepen`),
        explore: requireParallelArray(section.explore, localized.explore, `${slug}.${section.id}.explore`),
        formulas: section.formulas,
        visualizations: section.visualizations,
      };
      if (section.checks) result.checks = requireParallelArray(section.checks, localized.checks, `${slug}.${section.id}.checks`);
      return result;
    });

    return [slug, {
      ...topic,
      introduction: requireTranslation(translation.introduction, `${slug}.introduction`),
      sections,
      errorTopics: topic.errorTopics,
    }];
  }));
};

const escapeAttribute = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

export const localizeUnit1Formula = (formula, locale) => {
  assertSupportedLocale(locale);
  if (!formula || locale === "es") return formula;
  const translation = requireTranslation(formulasEn[formula.id], `formula.${formula?.id}`);
  const meanings = requireParallelArray(formula.variables, translation.meanings, `formula.${formula.id}.variables`);
  return {
    ...formula,
    label: translation.label,
    mathml: formula.mathml.replace(/aria-label="[^"]*"/, `aria-label="${escapeAttribute(translation.label)}"`),
    represents: translation.represents,
    variables: formula.variables.map((variable, index) => ({ ...variable, meaning: meanings[index], unit: localizeAcademicUnitLabel(variable.unit, locale) })),
    conditions: requireParallelArray(formula.conditions, translation.conditions, `formula.${formula.id}.conditions`),
    interpretation: translation.interpretation,
    dimensions: translation.dimensions,
    commonErrors: requireParallelArray(formula.commonErrors, translation.commonErrors, `formula.${formula.id}.commonErrors`),
    related: formula.related,
  };
};

export const getLocalizedUnit1Formula = (id, locale) =>
  localizeUnit1Formula(UNIT_1_FORMULAS[id], locale);

export const localizeUnit1CommonError = (error, locale) => {
  assertSupportedLocale(locale);
  if (!error || locale === "es") return error;
  const [description, feedback] = requireTranslation(commonErrorsEn[error.id], `commonError.${error?.id}`);
  return { ...error, description, feedback };
};

export const getLocalizedUnit1ErrorsByTopics = (topics, locale) =>
  UNIT_1_COMMON_ERRORS
    .filter((error) => topics.includes(error.topic))
    .map((error) => localizeUnit1CommonError(error, locale));

const cloneAcademicValue = (value) => {
  if (Array.isArray(value)) return value.map(cloneAcademicValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, cloneAcademicValue(child)]));
  }
  return value;
};

export const localizeUnit1Visualization = (visualization, locale) => {
  assertSupportedLocale(locale);
  if (!visualization || locale === "es") return visualization;
  const textPaths = requireTranslation(visualizationsEn[visualization.id], `visualization.${visualization?.id}`);
  const localized = cloneAcademicValue(visualization);

  for (const [path, text] of Object.entries(textPaths)) {
    const segments = path.split(".");
    const finalKey = segments.pop();
    const target = segments.reduce((value, key) => value?.[key], localized);
    if (!target || typeof target[finalKey] !== "string") {
      throw new RangeError(`Invalid English visualization text path: ${visualization.id}.${path}`);
    }
    target[finalKey] = text;
  }
  return localized;
};

export const getLocalizedUnit1Visualization = (id, locale) =>
  localizeUnit1Visualization(UNIT_1_VISUALIZATIONS[id], locale);

const EN_BONUSES = Object.freeze({
  "bonus-u1-tools-vectors": Object.freeze({ title: "Measurement tools and vectors mini quiz", shortTitle: "Measurement tools and vectors", description: "Check units, components, and vector operations in a short set." }),
  "bonus-u1-kinematics": Object.freeze({ title: "Kinematics mini quiz", shortTitle: "Kinematics", description: "Review reference frames, signs, graphs, and one-dimensional motion models." }),
  "bonus-u1-motion-2d-circular-relative": Object.freeze({ title: "2D, circular, and relative motion mini quiz", shortTitle: "2D, circular, and relative motion", description: "Connect projectile motion, circular motion, and velocity composition." }),
  "bonus-u1-review": Object.freeze({ title: "Unit 1 review mini quiz", shortTitle: "Unit 1 review", description: "Review the unit's main ideas with numerical, conceptual, and visual questions." }),
});

const BONUS_ROUTE_IDS = Object.freeze({
  "bonus-u1-tools-vectors": ROUTE_IDS.COURSE_MINI_QUIZ_TOOLS_VECTORS,
  "bonus-u1-kinematics": ROUTE_IDS.COURSE_MINI_QUIZ_KINEMATICS,
  "bonus-u1-motion-2d-circular-relative": ROUTE_IDS.COURSE_MINI_QUIZ_MOTION_2D_CIRCULAR_RELATIVE,
  "bonus-u1-review": ROUTE_IDS.COURSE_MINI_QUIZ_UNIT_1_REVIEW,
});

export const getUnit1BonusRouteId = (bonusId) => BONUS_ROUTE_IDS[bonusId] ?? null;

export const localizeUnit1Bonus = (bonus, locale) => {
  assertSupportedLocale(locale);
  if (!bonus || locale === "es") return bonus;
  const translation = EN_BONUSES[bonus.id];
  if (!translation) throw new RangeError(`Missing English bonus translation: ${String(bonus?.id)}`);
  return { ...bonus, ...translation };
};

export const getLocalizedUnit1Bonuses = (locale) =>
  UNIT_1_BONUSES.map((bonus) => localizeUnit1Bonus(bonus, locale));

export const getUnit1MiniQuizRouteId = getUnit1BonusRouteId;
export const localizeUnit1MiniQuiz = localizeUnit1Bonus;
export const getLocalizedUnit1MiniQuizzes = getLocalizedUnit1Bonuses;
