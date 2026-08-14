// Registro explícito de unidades desarrolladas. Los consumidores dependen de
// este contrato y no de rutas, nombres de carpetas ni condicionales por unidad.
import { COURSE_IDS } from "../courses.js";
import { UNIT_1 } from "./unit-1/unit.js";
import {
  getLocalizedUnit1ErrorsByTopics,
  getLocalizedUnit1Formula,
  getLocalizedUnit1Visualization,
  getUnit1TopicRouteId,
  localizeUnit1,
  localizeUnit1Content,
} from "./unit-1/localize.js";
import { getLocalizedUnit1BankItems, getLocalizedUnit1Exercises } from "./unit-1/exercise-localize.js";
import { UNIT_1_VISUALIZATIONS } from "./unit-1/visualizations.js";
import { presentUnit1RichText } from "./unit-1/math-content.js";
import { UNIT_2 } from "./unit-2/unit.js";
import {
  getLocalizedUnit2ErrorsByTopics,
  getLocalizedUnit2Formula,
  getLocalizedUnit2Visualization,
  getUnit2TopicRouteId,
  localizeUnit2,
  localizeUnit2Content,
} from "./unit-2/localize.js";
import { getLocalizedUnit2BankItems, getLocalizedUnit2Exercises } from "./unit-2/exercise-localize.js";
import { UNIT_2_VISUALIZATIONS } from "./unit-2/visualizations.js";
import { presentUnit2RichText } from "./unit-2/math-content.js";

export const ACADEMIC_UNITS = Object.freeze([UNIT_1, UNIT_2]);

const ACADEMIC_UNIT_ADAPTERS = new Map([
  [1, Object.freeze({
    unit: UNIT_1,
    localizeUnit: localizeUnit1,
    getContent: localizeUnit1Content,
    getFormula: getLocalizedUnit1Formula,
    getVisualization: getLocalizedUnit1Visualization,
    getErrors: getLocalizedUnit1ErrorsByTopics,
    getTopicRouteId: getUnit1TopicRouteId,
    getFixedExercises: getLocalizedUnit1Exercises,
    getBankItems: getLocalizedUnit1BankItems,
    visualizationIds: Object.freeze(Object.keys(UNIT_1_VISUALIZATIONS)),
    presentRichText: presentUnit1RichText,
  })],
  [2, Object.freeze({
    unit: UNIT_2,
    localizeUnit: localizeUnit2,
    getContent: localizeUnit2Content,
    getFormula: getLocalizedUnit2Formula,
    getVisualization: getLocalizedUnit2Visualization,
    getErrors: getLocalizedUnit2ErrorsByTopics,
    getTopicRouteId: getUnit2TopicRouteId,
    getFixedExercises: getLocalizedUnit2Exercises,
    getBankItems: getLocalizedUnit2BankItems,
    visualizationIds: Object.freeze(Object.keys(UNIT_2_VISUALIZATIONS)),
    presentRichText: presentUnit2RichText,
  })],
]);

export const ACADEMIC_CONTEXTS = Object.freeze([
  Object.freeze({ courseId: COURSE_IDS.PHYSICS_BASIC_1, units: ACADEMIC_UNITS }),
]);

export const getAcademicUnit = (unitNumber) => ACADEMIC_UNIT_ADAPTERS.get(unitNumber)?.unit ?? null;
export const getAcademicUnitAdapter = (unitNumber) => ACADEMIC_UNIT_ADAPTERS.get(unitNumber) ?? null;
export const getLocalizedAcademicUnit = (unitNumber, locale) => ACADEMIC_UNIT_ADAPTERS.get(unitNumber)?.localizeUnit(locale) ?? null;
export const getDevelopedAcademicUnits = (locale) => ACADEMIC_UNITS.map((unit) => getLocalizedAcademicUnit(unit.number, locale));
export const getAcademicUnitForContext = (courseId, unitNumber) =>
  ACADEMIC_CONTEXTS.find((context) => context.courseId === courseId)?.units.find((unit) => unit.number === unitNumber) ?? null;
