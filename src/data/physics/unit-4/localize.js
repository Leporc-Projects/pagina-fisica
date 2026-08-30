import { assertSupportedLocale } from "../../../i18n/config.js";
import { getLocalizedPath } from "../../../i18n/routes.js";
import { UNIT_4 } from "./unit.js";
import { UNIT_4_CONTENT } from "./content.js";
import { UNIT_4_FORMULAS } from "./formulas.js";
import { UNIT_4_VISUALIZATIONS } from "./visualizations.js";
import { UNIT_4_COMMON_ERRORS } from "./common-errors.js";
import { UNIT_4_WORKED_EXAMPLES } from "./examples.js";
import contentEn from "./i18n/content.en.js";
import formulasEn from "./i18n/formulas.en.js";
import commonErrorsEn from "./i18n/common-errors.en.js";
import visualizationTextEn from "./i18n/visualizations.en.js";
import examplesEn from "./i18n/examples.en.js";
import { localizeAcademicUnitLabel } from "../localize-unit-label.js";

const EN_UNIT = Object.freeze({
  title: "Work and energy",
  shortTitle: "Unit 4",
  chapters: "Chapters 6 and 7",
  description: "Work, kinetic and potential energy, power, and energy conservation as tools for relating forces, motion, and physical configurations.",
  topics: Object.freeze({
    trabajo: ["Work by a force", "Work", "Energy transfer, the dot product, and the sign of work."],
    "energia-cinetica": ["Kinetic energy and the work–energy theorem", "Kinetic energy", "Net work, changes in kinetic energy, and speed."],
    "fuerza-variable": ["Work with a variable force", "Variable force", "Line integrals and signed area on a force-versus-position graph."],
    potencia: ["Power", "Power", "Rate of energy transfer and instantaneous power."],
    "energia-potencial": ["Gravitational and elastic potential energy", "Potential energy", "Configuration energy, gravitational reference, and the ideal spring."],
    "conservacion-energia": ["Conservative forces and energy conservation", "Conservation", "Mechanical energy, external work, and conversion into internal energy."],
    "fuerza-potencial": ["Force and potential energy", "Force and potential", "Force as the negative slope of potential and equilibrium classification."],
    "diagramas-energia": ["Energy diagrams", "Energy diagrams", "Allowed regions, turning points, speed, and equilibrium from U(x)."],
  }),
});

const requireValue = (value, context) => {
  if (value == null) throw new RangeError(`Missing English Unit 4 translation: ${context}`);
  return value;
};
const parallel = (source, translated, context) => {
  if (!Array.isArray(translated) || source.length !== translated.length) throw new RangeError(`English Unit 4 translation changed structure: ${context}`);
  return translated;
};
const clone = (value) => Array.isArray(value)
  ? value.map(clone)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]))
    : value;

export const localizeUnit4 = (locale) => {
  assertSupportedLocale(locale);
  if (locale === "es") return UNIT_4;
  return {
    ...UNIT_4,
    ...EN_UNIT,
    route: getLocalizedPath(UNIT_4.routeId, locale),
    practiceRoute: getLocalizedPath(UNIT_4.practiceRouteId, locale),
    topics: UNIT_4.topics.map((topic) => {
      const [title, shortTitle, summary] = EN_UNIT.topics[topic.slug];
      return { ...topic, title, shortTitle, summary, route: getLocalizedPath(topic.routeId, locale) };
    }),
  };
};

export const localizeUnit4Content = (locale) => {
  assertSupportedLocale(locale);
  if (locale === "es") return UNIT_4_CONTENT;
  return Object.fromEntries(Object.entries(UNIT_4_CONTENT).map(([slug, topic]) => {
    const translatedTopic = requireValue(contentEn[slug], slug);
    return [slug, {
      ...topic,
      introduction: translatedTopic.introduction,
      sections: topic.sections.map((section) => {
        const translated = requireValue(translatedTopic.sections[section.id], `${slug}.${section.id}`);
        const localized = {
          ...section,
          ...translated,
          id: section.id,
          essential: parallel(section.essential, translated.essential, `${slug}.${section.id}.essential`),
          understand: parallel(section.understand, translated.understand, `${slug}.${section.id}.understand`),
          deepen: parallel(section.deepen, translated.deepen, `${slug}.${section.id}.deepen`),
          explore: parallel(section.explore, translated.explore, `${slug}.${section.id}.explore`),
          formulas: section.formulas,
          visualizations: section.visualizations,
          examples: section.examples,
        };
        if (section.checks) localized.checks = parallel(section.checks, translated.checks, `${slug}.${section.id}.checks`);
        return localized;
      }),
      errorTopics: topic.errorTopics,
    }];
  }));
};

const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
export const getLocalizedUnit4Formula = (id, locale) => {
  assertSupportedLocale(locale);
  const formula = UNIT_4_FORMULAS[id];
  if (!formula || locale === "es") return formula;
  const translated = requireValue(formulasEn[id], `formula.${id}`);
  const meanings = parallel(formula.variables, translated.meanings, `formula.${id}.variables`);
  return {
    ...formula,
    label: translated.label,
    mathml: formula.mathml.replace(/aria-label="[^"]*"/, `aria-label="${escapeAttribute(translated.label)}"`),
    represents: translated.represents,
    variables: formula.variables.map((variable, index) => ({ ...variable, meaning: meanings[index], unit: localizeAcademicUnitLabel(variable.unit, locale) })),
    conditions: parallel(formula.conditions, translated.conditions, `formula.${id}.conditions`),
    interpretation: translated.interpretation,
    dimensions: translated.dimensions,
    commonErrors: parallel(formula.commonErrors, translated.commonErrors, `formula.${id}.commonErrors`),
  };
};

export const getLocalizedUnit4ErrorsByTopics = (topics, locale) => {
  assertSupportedLocale(locale);
  return UNIT_4_COMMON_ERRORS.filter((error) => topics.includes(error.topic)).map((error) => {
    if (locale === "es") return error;
    const [description, feedback] = requireValue(commonErrorsEn[error.id], `commonError.${error.id}`);
    return { ...error, description, feedback };
  });
};

const replaceVisualizationText = (value, replacements) => Array.isArray(value)
  ? value.map((entry) => replaceVisualizationText(entry, replacements))
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceVisualizationText(child, replacements)]))
    : typeof value === "string" && Object.hasOwn(replacements, value)
      ? replacements[value]
      : value;
export const getLocalizedUnit4Visualization = (id, locale) => {
  assertSupportedLocale(locale);
  const visualization = UNIT_4_VISUALIZATIONS[id];
  if (!visualization || locale === "es") return visualization;
  return replaceVisualizationText(clone(visualization), requireValue(visualizationTextEn[id], `visualization.${id}`));
};

export const getLocalizedUnit4WorkedExample = (id, locale) => {
  assertSupportedLocale(locale);
  const source = UNIT_4_WORKED_EXAMPLES[id];
  if (!source || locale === "es") return source;
  const translated = requireValue(examplesEn[id], `example.${id}`);
  const translatedSteps = parallel(source.steps, translated.steps, `example.${id}.steps`);
  return {
    ...source,
    title: translated.title,
    context: translated.context,
    givens: parallel(source.givens, translated.givens, `example.${id}.givens`),
    target: translated.target,
    steps: source.steps.map((step, index) => ({ ...step, title: translatedSteps[index][0], text: translatedSteps[index][1] })),
    conclusion: translated.conclusion,
  };
};

export const getUnit4TopicRouteId = (slug) => UNIT_4.topics.find((topic) => topic.slug === slug)?.routeId ?? null;
