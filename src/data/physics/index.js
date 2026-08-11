// Registro académico extensible. Las futuras unidades se incorporan aquí para
// que navegación y validaciones no descubran contenido mediante convenciones.
import { UNIT_1 } from "./unit-1/unit.js";
import { COURSE_IDS } from "../courses.js";

export const ACADEMIC_UNITS = [UNIT_1];

export const ACADEMIC_CONTEXTS = Object.freeze([
  Object.freeze({
    courseId: COURSE_IDS.PHYSICS_BASIC_1,
    units: ACADEMIC_UNITS,
  }),
]);

export const getAcademicUnitForContext = (courseId, unitNumber) =>
  ACADEMIC_CONTEXTS
    .find((context) => context.courseId === courseId)
    ?.units.find((unit) => unit.number === unitNumber);
