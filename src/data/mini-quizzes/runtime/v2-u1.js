import { getMiniQuizV2BankByUnit, selectMiniQuizV2Questions } from "../v2.js";

export const hydrateMiniQuizPool = (records) => records;

export const selectMiniQuizQuestions = ({
  miniQuiz,
  pool,
  cryptoApi,
  locale,
  seenItemIds,
  recentParameterKeys,
}) => {
  const bank = getMiniQuizV2BankByUnit(1);
  if (!bank) throw new RangeError("No existe el banco Mini Quiz V2 de Unidad 1.");
  const localizedById = new Map(pool.map((record) => [record.id, record]));
  const selections = selectMiniQuizV2Questions(miniQuiz, bank, cryptoApi, {
    locale,
    seenItemIds,
    recentParameterKeys,
  });
  return selections.map((selection) => {
    const presented = localizedById.get(selection.exercise.id);
    if (!presented) throw new RangeError(`No existe presentación pública para ${selection.exercise.id}.`);
    return { ...selection, exercise: presented };
  });
};
