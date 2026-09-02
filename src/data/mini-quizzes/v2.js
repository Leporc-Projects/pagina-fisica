import { selectQuestionsFromBlueprint } from "../../utils/bonus.js";
import { generateFamilyInstance } from "../../utils/exercise-families.js";

export const MINI_QUIZ_V2_SCHEMA_VERSION = "2.0.0";
export const MINI_QUIZ_V2_SOURCE_KIND = "miniQuizV2";

const localizedText = (value) => value && typeof value.es === "string" && value.es.length > 0 && typeof value.en === "string" && value.en.length > 0;
const stableId = (value) => typeof value === "string" && /^[a-z0-9-]+$/.test(value);
const textForLocale = (value, locale) => localizedText(value) ? value[locale] : value;

const localizeNumberField = (field, locale) => ({
  ...field,
  label: textForLocale(field.label, locale),
  ...(field.unitLabel !== undefined ? { unitLabel: textForLocale(field.unitLabel, locale) } : {}),
});

const diagnosticErrors = (option, path) => {
  if (option.diagnostic === undefined) return [];
  const errors = [];
  if (!stableId(option.diagnostic?.commonErrorId)) errors.push(`${path}.diagnostic.commonErrorId inválido.`);
  if (!localizedText(option.diagnostic?.feedback)) errors.push(`${path}.diagnostic.feedback debe estar completo en ES/EN.`);
  return errors;
};

export const validateMiniQuizV2Record = (record) => {
  const errors = [];
  const require = (condition, message) => { if (!condition) errors.push(message); };
  require(record?.schemaVersion === MINI_QUIZ_V2_SCHEMA_VERSION, "schemaVersion V2 inválida.");
  require(record?.source?.kind === MINI_QUIZ_V2_SOURCE_KIND, "El registro no declara fuente Mini Quiz V2.");
  require(record?.modality === "miniQuiz", "La modalidad debe ser miniQuiz.");
  require(!record?.modalities?.includes?.("practice") && record?.practiceEligible !== true, "Un registro V2 no puede pertenecer a Practice.");
  require(["fixed", "parameterizedFamily"].includes(record?.itemKind), "itemKind V2 inválido.");
  require(stableId(record?.id), "id V2 inválido.");
  require(Number.isInteger(record?.version) && record.version > 0, "version V2 inválida.");
  require(Number.isInteger(record?.unit) && record.unit >= 1 && record.unit <= 7, "Unidad V2 inválida.");
  if (record?.itemKind === "parameterizedFamily") {
    require(typeof record.generateParameters === "function" && typeof record.build === "function", "La familia V2 requiere generadores propios.");
    require(typeof record.localizeInstance === "function", "La familia V2 requiere un localizador de instancia propio.");
    require(record.constraints && typeof record.constraints === "object" && !Array.isArray(record.constraints), "La familia V2 requiere constraints válidas.");
  } else {
    require(localizedText(record?.title) && localizedText(record?.prompt), "El ítem fijo V2 requiere título y enunciado completos en ES/EN.");
    require(localizedText(record?.feedback?.correct) && localizedText(record?.feedback?.incorrect), "El feedback fijo V2 debe estar completo en ES/EN.");
    if (record?.solution !== undefined) {
      const solution = Array.isArray(record.solution) ? record.solution : [];
      require(Array.isArray(record.solution), "La solución fija V2 debe ser una lista.");
      require(solution.every((step) => localizedText(step?.title) && localizedText(step?.text)), "Los pasos de solución fijos V2 deben estar completos en ES/EN.");
    }
    if (record?.interaction?.kind === "number") {
      require(localizedText(record.interaction.field?.label), "La etiqueta del campo number debe estar completa en ES/EN.");
      require(record.interaction.field?.unitLabel === undefined || localizedText(record.interaction.field.unitLabel), "unitLabel de number debe estar completo en ES/EN.");
    }
    if (record?.interaction?.kind === "multiNumber") {
      const fields = Array.isArray(record.interaction.fields) ? record.interaction.fields : [];
      require(fields.length > 0, "multiNumber requiere campos declarados.");
      require(fields.every((field) => localizedText(field?.label)), "Las etiquetas multiNumber deben estar completas en ES/EN.");
      require(fields.every((field) => field?.unitLabel === undefined || localizedText(field.unitLabel)), "Los unitLabel multiNumber deben estar completos en ES/EN.");
    }
  }
  if (record?.interaction?.kind === "singleChoice") {
    const options = Array.isArray(record.interaction.options) ? record.interaction.options : [];
    const optionIds = options.map((option) => option?.id);
    require(options.length > 0, "singleChoice requiere opciones declaradas.");
    require(optionIds.every(stableId) && new Set(optionIds).size === optionIds.length, "singleChoice requiere IDs de opción estables y únicos.");
    require(options.every((option) => localizedText(option?.content)), "Las opciones singleChoice deben estar completas en ES/EN.");
    require(optionIds.filter((id) => id === record.interaction.correctOptionId).length === 1, "correctOptionId debe identificar exactamente una opción declarada.");
    options.forEach((option, index) => errors.push(...diagnosticErrors(option, `${record.id}.options.${index}`)));
  }
  return { valid: errors.length === 0, errors };
};

const assertRecord = (record) => {
  const validation = validateMiniQuizV2Record(record);
  if (!validation.valid) throw new TypeError(validation.errors.join(" "));
  return record;
};

export const createMiniQuizV2Bank = ({ unit, items = [], families = [], blueprints = [] }) => {
  if (!Number.isInteger(unit) || unit < 1 || unit > 7) throw new RangeError("La unidad del banco V2 debe estar entre 1 y 7.");
  const records = [...items, ...families].map(assertRecord);
  if (records.some((record) => record.unit !== unit)) throw new TypeError("Todo registro V2 debe pertenecer a la unidad de su banco.");
  if (items.some((record) => record.itemKind !== "fixed") || families.some((record) => record.itemKind !== "parameterizedFamily")) {
    throw new TypeError("El banco V2 debe mantener separados items fijos y families parametrizadas.");
  }
  if (blueprints.some((blueprint) => !stableId(blueprint?.id))) throw new TypeError("Todo blueprint V2 requiere un ID estable.");
  const ids = [...records.map((record) => record.id), ...blueprints.map((blueprint) => blueprint.id)];
  if (new Set(ids).size !== ids.length) throw new TypeError("Los IDs del banco Mini Quiz V2 deben ser únicos.");
  return Object.freeze({
    schemaVersion: MINI_QUIZ_V2_SCHEMA_VERSION,
    sourceKind: MINI_QUIZ_V2_SOURCE_KIND,
    unit,
    items: Object.freeze([...items]),
    families: Object.freeze([...families]),
    blueprints: Object.freeze([...blueprints]),
  });
};

export const MINI_QUIZ_V2_BANKS_BY_UNIT = Object.freeze(
  Array.from({ length: 7 }, (_, index) => createMiniQuizV2Bank({ unit: index + 1 })),
);

export const localizeMiniQuizV2Record = (record, locale) => {
  assertRecord(record);
  if (!["es", "en"].includes(locale)) throw new RangeError("Locale V2 inválido.");
  let interaction = record.interaction;
  if (record.itemKind === "fixed" && record.interaction?.kind === "singleChoice") {
    interaction = {
      ...record.interaction,
      options: record.interaction.options.map((option) => ({
        ...option,
        content: textForLocale(option.content, locale),
        ...(option.diagnostic ? { diagnostic: { ...option.diagnostic, feedback: option.diagnostic.feedback[locale] } } : {}),
      })),
    };
  } else if (record.itemKind === "fixed" && record.interaction?.kind === "number") {
    interaction = { ...record.interaction, field: localizeNumberField(record.interaction.field, locale) };
  } else if (record.itemKind === "fixed" && record.interaction?.kind === "multiNumber") {
    interaction = { ...record.interaction, fields: record.interaction.fields.map((field) => localizeNumberField(field, locale)) };
  }
  return {
    ...record,
    title: textForLocale(record.title, locale),
    prompt: textForLocale(record.prompt, locale),
    feedback: record.feedback ? {
      ...record.feedback,
      correct: textForLocale(record.feedback.correct, locale),
      incorrect: textForLocale(record.feedback.incorrect, locale),
    } : record.feedback,
    solution: Array.isArray(record.solution) ? record.solution.map((step) => ({
      ...step,
      title: textForLocale(step.title, locale),
      text: textForLocale(step.text, locale),
    })) : record.solution,
    interaction,
  };
};

export const selectMiniQuizV2Questions = (blueprint, bank, cryptoApi, options = {}) => {
  const { locale = "es", generateInstance, ...selectionOptions } = options;
  const selections = selectQuestionsFromBlueprint(blueprint, [...bank.items, ...bank.families], cryptoApi, {
    ...selectionOptions,
    generateInstance: generateInstance ?? ((family, generationOptions) => {
      const instance = generateFamilyInstance(family, generationOptions);
      return family.localizeInstance({ ...instance, localizeInstance: undefined }, locale);
    }),
    isEligible: (record) => validateMiniQuizV2Record(record).valid,
  });
  return selections.map((selection) => selection.exercise.itemKind === "fixed"
    ? { ...selection, exercise: localizeMiniQuizV2Record(selection.exercise, locale) }
    : selection);
};

export const getMiniQuizV2BankByUnit = (unit) =>
  MINI_QUIZ_V2_BANKS_BY_UNIT.find((bank) => bank.unit === unit) ?? null;
