import { assertSupportedLocale } from "../../i18n/config.js";

const ENGLISH_UNIT_LABELS = Object.freeze({
  "adimensional": "dimensionless",
  "misma unidad de A": "same unit as A",
  "unidad de A": "unit of A",
  "rad o °": "rad or °",
  "m/s² o N/kg": "m/s² or N/kg",
});

export const localizeAcademicUnitLabel = (label, locale) => {
  assertSupportedLocale(locale);
  if (locale === "es" || typeof label !== "string") return label;
  if (ENGLISH_UNIT_LABELS[label]) return ENGLISH_UNIT_LABELS[label];
  return label
    .replaceAll("sin unidad", "dimensionless")
    .replaceAll("adimensional", "dimensionless")
    .replaceAll("grados", "degrees")
    .replaceAll(" al oeste del norte", " west of north")
    .replaceAll(" y ", " and ")
    .replaceAll(" o ", " or ");
};
