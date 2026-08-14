// Registro cliente deliberadamente pequeño: permite materializar familias sin
// cargar teoría, fórmulas ni figuras y sin acoplar la práctica a una unidad.
import { UNIT_1_EXERCISE_FAMILIES } from "./unit-1/families.js";
import { generateLocalizedUnit1FamilyInstance } from "./unit-1/family-localize.js";
import { UNIT_2_EXERCISE_FAMILIES } from "./unit-2/families.js";
import { generateLocalizedUnit2FamilyInstance } from "./unit-2/family-localize.js";

const FAMILY_REGISTRY = new Map([
  ...UNIT_1_EXERCISE_FAMILIES.map((family) => [family.id, { family, generate: generateLocalizedUnit1FamilyInstance }]),
  ...UNIT_2_EXERCISE_FAMILIES.map((family) => [family.id, { family, generate: generateLocalizedUnit2FamilyInstance }]),
]);

export const getAcademicExerciseFamily = (id) => FAMILY_REGISTRY.get(id)?.family ?? null;

export const generateLocalizedAcademicFamilyInstance = (id, locale, options = {}) => {
  const entry = FAMILY_REGISTRY.get(id);
  if (!entry) throw new RangeError(`Unknown academic exercise family: ${String(id)}`);
  return entry.generate(entry.family, locale, options);
};
