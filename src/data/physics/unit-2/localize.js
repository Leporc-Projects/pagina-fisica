import { assertSupportedLocale } from "../../../i18n/config.js";
import { getLocalizedPath } from "../../../i18n/routes.js";
import { UNIT_2 } from "./unit.js";
import { UNIT_2_CONTENT } from "./content.js";
import { UNIT_2_FORMULAS } from "./formulas.js";
import { UNIT_2_VISUALIZATIONS } from "./visualizations.js";
import { UNIT_2_COMMON_ERRORS } from "./common-errors.js";
import contentEn from "./i18n/content.en.js";
import formulasEn from "./i18n/formulas.en.js";
import commonErrorsEn from "./i18n/common-errors.en.js";
import visualizationTextEn from "./i18n/visualizations.en.js";
import { localizeAcademicUnitLabel } from "../localize-unit-label.js";

const EN_UNIT = Object.freeze({
  title: "Newton's laws",
  shortTitle: "Unit 2",
  chapters: "Chapter 4",
  description: "Foundations of mechanical interactions, Newton's three laws, mass, weight, free-body diagrams, and inertial reference frames.",
  topics: Object.freeze({
    "fuerzas-interacciones": { title: "Forces and interactions", shortTitle: "Forces", summary: "Interactions, system choice, net force, and measurement in newtons." },
    "primera-ley": { title: "Newton's first law", shortTitle: "First law", summary: "Inertia, zero net force, and the role of inertial frames." },
    "segunda-ley": { title: "Newton's second law", shortTitle: "Second law", summary: "Vector relation among external net force, mass, and acceleration." },
    "masa-peso": { title: "Mass and weight", shortTitle: "Mass and weight", summary: "Inertial mass, gravitational force, and changes in weight with field." },
    "tercera-ley": { title: "Newton's third law", shortTitle: "Third law", summary: "Simultaneous interaction pairs acting on different bodies." },
    "diagramas-cuerpo-libre": { title: "Free-body diagrams", shortTitle: "FBDs", summary: "System isolation, force inventory, axes, and dynamical reading." },
    "marcos-inerciales": { title: "Inertial reference frames", shortTitle: "Inertial frames", summary: "Inertial criterion, Galilean transformations, and limits of accelerating frames." },
  }),
});

const requireValue = (value, context) => {
  if (value === undefined || value === null) throw new RangeError(`Missing English Unit 2 translation: ${context}`);
  return value;
};
const parallel = (source, translated, context) => {
  if (!Array.isArray(translated) || source.length !== translated.length) {
    throw new RangeError(`English Unit 2 translation changed structure: ${context}`);
  }
  return translated;
};
const clone = (value) => {
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
  return value;
};

export const localizeUnit2 = (locale) => {
  assertSupportedLocale(locale);
  if (locale === "es") return UNIT_2;
  return {
    ...UNIT_2, ...EN_UNIT,
    route: getLocalizedPath(UNIT_2.routeId, locale),
    practiceRoute: getLocalizedPath(UNIT_2.practiceRouteId, locale),
    topics: UNIT_2.topics.map((topic) => ({
      ...topic, ...EN_UNIT.topics[topic.slug], route: getLocalizedPath(topic.routeId, locale),
    })),
  };
};

export const localizeUnit2Content = (locale) => {
  assertSupportedLocale(locale);
  if (locale === "es") return UNIT_2_CONTENT;
  return Object.fromEntries(Object.entries(UNIT_2_CONTENT).map(([slug, topic]) => {
    const translatedTopic = requireValue(contentEn[slug], slug);
    return [slug, {
      ...topic,
      introduction: translatedTopic.introduction,
      sections: topic.sections.map((section) => {
        const translated = requireValue(translatedTopic.sections[section.id], `${slug}.${section.id}`);
        const localized = {
          ...section, ...translated, id: section.id,
          essential: parallel(section.essential, translated.essential, `${slug}.${section.id}.essential`),
          understand: parallel(section.understand, translated.understand, `${slug}.${section.id}.understand`),
          deepen: parallel(section.deepen, translated.deepen, `${slug}.${section.id}.deepen`),
          explore: parallel(section.explore, translated.explore, `${slug}.${section.id}.explore`),
          formulas: section.formulas, visualizations: section.visualizations,
        };
        if (section.checks) localized.checks = parallel(section.checks, translated.checks, `${slug}.${section.id}.checks`);
        return localized;
      }),
      errorTopics: topic.errorTopics,
    }];
  }));
};

const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
export const getLocalizedUnit2Formula = (id, locale) => {
  assertSupportedLocale(locale);
  const formula = UNIT_2_FORMULAS[id];
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
    interpretation: translated.interpretation, dimensions: translated.dimensions,
    commonErrors: parallel(formula.commonErrors, translated.commonErrors, `formula.${id}.commonErrors`),
  };
};

export const getLocalizedUnit2ErrorsByTopics = (topics, locale) => {
  assertSupportedLocale(locale);
  return UNIT_2_COMMON_ERRORS.filter((error) => topics.includes(error.topic)).map((error) => {
    if (locale === "es") return error;
    const [description, feedback] = requireValue(commonErrorsEn[error.id], `commonError.${error.id}`);
    return { ...error, description, feedback };
  });
};

const replaceVisualizationText = (value, replacements) => {
  if (Array.isArray(value)) return value.map((entry) => replaceVisualizationText(entry, replacements));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceVisualizationText(child, replacements)]));
  return typeof value === "string" && Object.hasOwn(replacements, value) ? replacements[value] : value;
};
export const getLocalizedUnit2Visualization = (id, locale) => {
  assertSupportedLocale(locale);
  const visualization = UNIT_2_VISUALIZATIONS[id];
  if (!visualization || locale === "es") return visualization;
  return replaceVisualizationText(clone(visualization), requireValue(visualizationTextEn[id], `visualization.${id}`));
};

export const getUnit2TopicRouteId = (slug) => UNIT_2.topics.find((topic) => topic.slug === slug)?.routeId ?? null;
