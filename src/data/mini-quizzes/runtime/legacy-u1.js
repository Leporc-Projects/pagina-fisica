import { generateLocalizedUnit1FamilyInstance } from "../../physics/unit-1/family-localize.js";
import { UNIT_1_EXERCISE_FAMILIES } from "../../physics/unit-1/families.js";

const familyMap = new Map(UNIT_1_EXERCISE_FAMILIES.map((family) => [family.id, family]));

export const hydrateMiniQuizPool = (serializedItems) => serializedItems.map((item) =>
  item.itemKind === "parameterizedFamily" ? familyMap.get(item.id) ?? item : item,
);

export const generateMiniQuizFamilyInstance = (family, locale, options) =>
  generateLocalizedUnit1FamilyInstance(family, locale, options);
