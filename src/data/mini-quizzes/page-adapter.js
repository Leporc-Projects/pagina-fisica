import { getAcademicUnitAdapter } from "../physics/index.js";
import { eligiblePoolForBonus } from "../../utils/bonus.js";
import { createAcademicMiniQuizRuntime } from "./academic-adapter.js";
import { getMiniQuizGroupByUnit } from "./index.js";
import { getMiniQuizV2BankByUnit, localizeMiniQuizV2Record } from "./v2.js";
import {
  attachUnit1MiniQuizV2Presentation,
  getUnit1MiniQuizV2Visualizations,
  presentUnit1MiniQuizV2RichText,
} from "./unit-1-presentation.js";

export const createMiniQuizPageData = ({ unitNumber, sourceMiniQuiz, locale }) => {
  const group = getMiniQuizGroupByUnit(unitNumber);
  const academic = getAcademicUnitAdapter(unitNumber);
  if (!group || !academic) throw new RangeError(`No existe configuración de Mini Quiz para la Unidad ${unitNumber}.`);
  const miniQuiz = group.localizeMiniQuiz(sourceMiniQuiz, locale);
  const unit = academic.localizeUnit(locale);
  const runtime = createAcademicMiniQuizRuntime(unitNumber, locale, {
    familyAdapterId: group.familyAdapterId,
    supportsRetake: group.supportsRetake ?? true,
  });
  const v2Bank = group.generation === "v2" ? getMiniQuizV2BankByUnit(unitNumber) : null;
  const exercises = v2Bank
    ? v2Bank.items.map((record) => attachUnit1MiniQuizV2Presentation(
        localizeMiniQuizV2Record(record, locale),
        locale,
      ))
    : eligiblePoolForBonus(miniQuiz, academic.getBankItems(locale));
  const visualizations = v2Bank
    ? getUnit1MiniQuizV2Visualizations(locale)
    : Object.fromEntries(
        academic.visualizationIds.map((id) => [id, academic.getVisualization(id, locale)]),
      );

  return {
    generation: group.generation,
    miniQuiz,
    unit,
    runtime,
    exercises,
    visualizations,
    presentRichText: v2Bank ? presentUnit1MiniQuizV2RichText : academic.presentRichText,
    routeId: group.getRouteId(miniQuiz.id),
  };
};
