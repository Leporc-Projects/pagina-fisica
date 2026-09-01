import { selectQuestionsFromBlueprint } from "../../utils/bonus.js";
import { generateFamilyInstance } from "../../utils/exercise-families.js";

export const MINI_QUIZ_V2_SCHEMA_VERSION = "2.0.0";
export const MINI_QUIZ_V2_SOURCE_KIND = "miniQuizV2";

const localizedText = (value) => value && typeof value.es === "string" && value.es.length > 0 && typeof value.en === "string" && value.en.length > 0;
const stableId = (value) => typeof value === "string" && /^[a-z0-9-]+$/.test(value);

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
  require(Number.isInteger(record?.unit) && record.unit >= 1 && record.unit <= 7, "Unidad V2 inválida.");
  if (record?.itemKind === "parameterizedFamily") {
    require(typeof record.generateParameters === "function" && typeof record.build === "function", "La familia V2 requiere generadores propios.");
    require(typeof record.localizeInstance === "function", "La familia V2 requiere un localizador de instancia propio.");
  } else {
    require(localizedText(record?.title) && localizedText(record?.prompt), "El ítem fijo V2 requiere título y enunciado completos en ES/EN.");
  }
  if (record?.interaction?.kind === "singleChoice") {
    record.interaction.options?.forEach((option, index) => errors.push(...diagnosticErrors(option, `${record.id}.options.${index}`)));
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
  const interaction = record.interaction?.kind === "singleChoice"
    ? {
        ...record.interaction,
        options: record.interaction.options.map((option) => ({
          ...option,
          content: localizedText(option.content) ? option.content[locale] : option.content,
          ...(option.diagnostic ? { diagnostic: { ...option.diagnostic, feedback: option.diagnostic.feedback[locale] } } : {}),
        })),
      }
    : record.interaction;
  return {
    ...record,
    title: localizedText(record.title) ? record.title[locale] : record.title,
    prompt: localizedText(record.prompt) ? record.prompt[locale] : record.prompt,
    feedback: record.feedback ? {
      ...record.feedback,
      correct: localizedText(record.feedback.correct) ? record.feedback.correct[locale] : record.feedback.correct,
      incorrect: localizedText(record.feedback.incorrect) ? record.feedback.incorrect[locale] : record.feedback.incorrect,
    } : record.feedback,
    interaction,
  };
};

export const selectMiniQuizV2Questions = (blueprint, bank, cryptoApi, options = {}) => {
  const { locale = "es", generateInstance, ...selectionOptions } = options;
  return selectQuestionsFromBlueprint(blueprint, [...bank.items, ...bank.families], cryptoApi, {
    ...selectionOptions,
    generateInstance: generateInstance ?? ((family, generationOptions) => {
      const instance = generateFamilyInstance(family, generationOptions);
      return family.localizeInstance({ ...instance, localizeInstance: undefined }, locale);
    }),
    isEligible: (record) => validateMiniQuizV2Record(record).valid,
  });
};

export const getMiniQuizV2BankByUnit = (unit) =>
  MINI_QUIZ_V2_BANKS_BY_UNIT.find((bank) => bank.unit === unit) ?? null;
