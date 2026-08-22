// Registro cliente deliberadamente pequeño: permite materializar familias sin
// cargar teoría, fórmulas ni figuras y sin acoplar la práctica a una unidad.
import { UNIT_1_EXERCISE_FAMILIES } from "./unit-1/families.js";
import { generateLocalizedUnit1FamilyInstance } from "./unit-1/family-localize.js";
import { UNIT_2_EXERCISE_FAMILIES } from "./unit-2/families.js";
import { generateLocalizedUnit2FamilyInstance } from "./unit-2/family-localize.js";
import { UNIT_3_EXERCISE_FAMILIES } from "./unit-3/families.js";
import { generateLocalizedUnit3FamilyInstance } from "./unit-3/family-localize.js";
import { UNIT_4_EXERCISE_FAMILIES } from "./unit-4/families.js";
import { generateLocalizedUnit4FamilyInstance } from "./unit-4/family-localize.js";
import { UNIT_5_EXERCISE_FAMILIES } from "./unit-5/families.js";
import { generateLocalizedUnit5FamilyInstance } from "./unit-5/family-localize.js";
import { UNIT_6_EXERCISE_FAMILIES } from "./unit-6/families.js";
import { generateLocalizedUnit6FamilyInstance } from "./unit-6/family-localize.js";

const FAMILY_REGISTRY = new Map([
  ...UNIT_1_EXERCISE_FAMILIES.map((family) => [family.id, { family, generate: generateLocalizedUnit1FamilyInstance }]),
  ...UNIT_2_EXERCISE_FAMILIES.map((family) => [family.id, { family, generate: generateLocalizedUnit2FamilyInstance }]),
  ...UNIT_3_EXERCISE_FAMILIES.map((family) => [family.id, { family, generate: generateLocalizedUnit3FamilyInstance }]),
  ...UNIT_4_EXERCISE_FAMILIES.map((family) => [family.id, { family, generate: generateLocalizedUnit4FamilyInstance }]),
  ...UNIT_5_EXERCISE_FAMILIES.map((family) => [family.id, { family, generate: generateLocalizedUnit5FamilyInstance }]),
  ...UNIT_6_EXERCISE_FAMILIES.map((family) => [family.id, { family, generate: generateLocalizedUnit6FamilyInstance }]),
]);

export const getAcademicExerciseFamily = (id) => FAMILY_REGISTRY.get(id)?.family ?? null;

export const generateLocalizedAcademicFamilyInstance = (id, locale, options = {}) => {
  const entry = FAMILY_REGISTRY.get(id);
  if (!entry) throw new RangeError(`Unknown academic exercise family: ${String(id)}`);
  return entry.generate(entry.family, locale, options);
};
