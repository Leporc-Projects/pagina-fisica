const recordById = (records, label) => Object.fromEntries(records.map((record) => {
  if (!record || typeof record.id !== "string" || record.id.length === 0) {
    throw new TypeError(`${label} requiere un id estable.`);
  }
  return [record.id, Object.freeze({ ...record })];
}));

export const createMiniQuizRuntimeConfig = ({
  locale,
  course,
  unit,
  familyAdapterId,
  capabilities = { retake: true },
  topics = [],
  subtopics = [],
  commonErrors = [],
}) => {
  if (!["es", "en"].includes(locale)) throw new RangeError("Locale de Mini Quiz inválido.");
  if (!course || typeof course.code !== "string" || typeof course.slug !== "string" || typeof course.title !== "string") {
    throw new TypeError("La configuración de Mini Quiz requiere un curso localizado.");
  }
  if (!unit || !Number.isInteger(unit.number) || unit.number < 1 || unit.number > 7 || typeof unit.slug !== "string" || typeof unit.title !== "string" || typeof unit.route !== "string") {
    throw new TypeError("La configuración de Mini Quiz requiere una unidad válida entre 1 y 7.");
  }
  if (typeof familyAdapterId !== "string" || familyAdapterId.length === 0) {
    throw new TypeError("La configuración de Mini Quiz requiere un adaptador de familias.");
  }
  if (typeof capabilities?.retake !== "boolean") {
    throw new TypeError("La capacidad de reintento de Mini Quiz debe ser booleana.");
  }

  return Object.freeze({
    locale,
    course: Object.freeze({ ...course }),
    unit: Object.freeze({ ...unit }),
    familyAdapterId,
    capabilities: Object.freeze({ retake: capabilities.retake }),
    topics: Object.freeze(recordById(topics, "El tema")),
    subtopics: Object.freeze(recordById(subtopics, "El subtema")),
    commonErrors: Object.freeze(recordById(commonErrors, "El error común")),
  });
};

export const assertMiniQuizRuntimeConfig = (runtime) =>
  createMiniQuizRuntimeConfig({
    locale: runtime?.locale,
    course: runtime?.course,
    unit: runtime?.unit,
    familyAdapterId: runtime?.familyAdapterId,
    capabilities: runtime?.capabilities,
    topics: Object.values(runtime?.topics ?? {}),
    subtopics: Object.values(runtime?.subtopics ?? {}),
    commonErrors: Object.values(runtime?.commonErrors ?? {}),
  });
