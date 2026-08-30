import { assertSupportedLocale } from "../../../i18n/config.js";
import { getLocalizedPath } from "../../../i18n/routes.js";
import { UNIT_3 } from "./unit.js";
import { UNIT_3_CONTENT } from "./content.js";
import { UNIT_3_FORMULAS } from "./formulas.js";
import { UNIT_3_VISUALIZATIONS } from "./visualizations.js";
import { UNIT_3_COMMON_ERRORS } from "./common-errors.js";
import { UNIT_3_WORKED_EXAMPLES } from "./examples.js";
import contentEn from "./i18n/content.en.js";
import formulasEn from "./i18n/formulas.en.js";
import commonErrorsEn from "./i18n/common-errors.en.js";
import visualizationTextEn from "./i18n/visualizations.en.js";
import examplesEn from "./i18n/examples.en.js";
import { localizeAcademicUnitLabel } from "../localize-unit-label.js";

const EN_UNIT = Object.freeze({
  title: "Forces and equations of motion", shortTitle: "Unit 3", chapters: "Chapter 5",
  description: "Systematic application of Newton's laws to equilibrium and dynamics, including contact forces, friction, fluid resistance, and circular motion.",
  topics: Object.freeze({
    equilibrio: ["Particles in equilibrium", "Equilibrium", "Vector equilibrium, solution strategy, and inclined forces."],
    "dinamica-particulas": ["Particle dynamics", "Dynamics", "From the FBD to equations, multi-body systems, and motion constraints."],
    "fuerza-normal": ["Normal force", "Normal", "Origin, direction, and dynamical calculation of the normal force."],
    tension: ["Tension", "Tension", "Force transmitted by ropes and conditions for the ideal model."],
    friccion: ["Static and kinetic friction", "Friction", "Direction, regimes, and limits of friction models."],
    "resistencia-fluidos": ["Fluid resistance", "Drag", "Linear and quadratic drag, terminal speed, and model validity."],
    "dinamica-circular": ["Circular-motion dynamics", "Circular dynamics", "Radial resultant, flat and banked curves, and vertical circles."],
    "fuerzas-fundamentales": ["Fundamental forces of nature", "Fundamental forces", "Four fundamental interactions and macroscopic effective forces."],
  }),
});
const requireValue = (value, context) => { if (value == null) throw new RangeError(`Missing English Unit 3 translation: ${context}`); return value; };
const parallel = (source, translated, context) => { if (!Array.isArray(translated) || source.length !== translated.length) throw new RangeError(`English Unit 3 translation changed structure: ${context}`); return translated; };
const clone = (value) => Array.isArray(value) ? value.map(clone) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)])) : value;

export const localizeUnit3 = (locale) => {
  assertSupportedLocale(locale);
  if (locale === "es") return UNIT_3;
  return { ...UNIT_3, ...EN_UNIT, route: getLocalizedPath(UNIT_3.routeId, locale), practiceRoute: getLocalizedPath(UNIT_3.practiceRouteId, locale), topics: UNIT_3.topics.map((topic) => { const [title, shortTitle, summary] = EN_UNIT.topics[topic.slug]; return { ...topic, title, shortTitle, summary, route: getLocalizedPath(topic.routeId, locale) }; }) };
};
export const localizeUnit3Content = (locale) => {
  assertSupportedLocale(locale);
  if (locale === "es") return UNIT_3_CONTENT;
  return Object.fromEntries(Object.entries(UNIT_3_CONTENT).map(([slug, topic]) => {
    const translatedTopic = requireValue(contentEn[slug], slug);
    return [slug, { ...topic, introduction: translatedTopic.introduction, sections: topic.sections.map((section) => {
      const translated = requireValue(translatedTopic.sections[section.id], `${slug}.${section.id}`);
      const localized = { ...section, ...translated, id: section.id, essential: parallel(section.essential, translated.essential, `${slug}.${section.id}.essential`), understand: parallel(section.understand, translated.understand, `${slug}.${section.id}.understand`), deepen: parallel(section.deepen, translated.deepen, `${slug}.${section.id}.deepen`), explore: parallel(section.explore, translated.explore, `${slug}.${section.id}.explore`), formulas: section.formulas, visualizations: section.visualizations, examples: section.examples };
      if (section.checks) localized.checks = parallel(section.checks, translated.checks, `${slug}.${section.id}.checks`);
      return localized;
    }), errorTopics: topic.errorTopics }];
  }));
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
export const getLocalizedUnit3Formula = (id, locale) => {
  assertSupportedLocale(locale); const formula = UNIT_3_FORMULAS[id]; if (!formula || locale === "es") return formula;
  const translated = requireValue(formulasEn[id], `formula.${id}`); const meanings = parallel(formula.variables, translated.meanings, `formula.${id}.variables`);
  return { ...formula, label: translated.label, mathml: formula.mathml.replace(/aria-label="[^"]*"/, `aria-label="${escapeAttribute(translated.label)}"`), represents: translated.represents, variables: formula.variables.map((variable, index) => ({ ...variable, meaning: meanings[index], unit: localizeAcademicUnitLabel(variable.unit, locale) })), conditions: parallel(formula.conditions, translated.conditions, `formula.${id}.conditions`), interpretation: translated.interpretation, dimensions: translated.dimensions, commonErrors: parallel(formula.commonErrors, translated.commonErrors, `formula.${id}.commonErrors`) };
};
export const getLocalizedUnit3ErrorsByTopics = (topics, locale) => { assertSupportedLocale(locale); return UNIT_3_COMMON_ERRORS.filter((error) => topics.includes(error.topic)).map((error) => { if (locale === "es") return error; const [description, feedback] = requireValue(commonErrorsEn[error.id], `commonError.${error.id}`); return { ...error, description, feedback }; }); };
const replaceVisualizationText = (value, replacements) => Array.isArray(value) ? value.map((entry) => replaceVisualizationText(entry, replacements)) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceVisualizationText(child, replacements)])) : typeof value === "string" && Object.hasOwn(replacements, value) ? replacements[value] : value;
export const getLocalizedUnit3Visualization = (id, locale) => { assertSupportedLocale(locale); const visualization = UNIT_3_VISUALIZATIONS[id]; if (!visualization || locale === "es") return visualization; return replaceVisualizationText(clone(visualization), requireValue(visualizationTextEn[id], `visualization.${id}`)); };
export const getLocalizedUnit3WorkedExample = (id, locale) => {
  assertSupportedLocale(locale); const source = UNIT_3_WORKED_EXAMPLES[id]; if (!source || locale === "es") return source;
  const translated = requireValue(examplesEn[id], `example.${id}`); const translatedSteps = parallel(source.steps, translated.steps, `example.${id}.steps`);
  return { ...source, title: translated.title, context: translated.context, givens: parallel(source.givens, translated.givens, `example.${id}.givens`), target: translated.target, steps: source.steps.map((step, index) => ({ ...step, title: translatedSteps[index][0], text: translatedSteps[index][1] })), conclusion: translated.conclusion };
};
export const getUnit3TopicRouteId = (slug) => UNIT_3.topics.find((topic) => topic.slug === slug)?.routeId ?? null;
