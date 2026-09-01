import { getAcademicUnitAdapter } from "../physics/index.js";
import { eligiblePoolForBonus } from "../../utils/bonus.js";
import { createAcademicMiniQuizRuntime } from "./academic-adapter.js";
import { getMiniQuizGroupByUnit } from "./index.js";

export const createMiniQuizPageData = ({ unitNumber, sourceMiniQuiz, locale }) => {
  const group = getMiniQuizGroupByUnit(unitNumber);
  const academic = getAcademicUnitAdapter(unitNumber);
  if (!group || !academic) throw new RangeError(`No existe configuración de Mini Quiz para la Unidad ${unitNumber}.`);
  const miniQuiz = group.localizeMiniQuiz(sourceMiniQuiz, locale);
  const unit = academic.localizeUnit(locale);
  const runtime = createAcademicMiniQuizRuntime(unitNumber, locale, {
    familyAdapterId: group.familyAdapterId,
  });
  const exercises = eligiblePoolForBonus(miniQuiz, academic.getBankItems(locale));
  const visualizations = Object.fromEntries(
    academic.visualizationIds.map((id) => [id, academic.getVisualization(id, locale)]),
  );

  return {
    generation: group.generation,
    miniQuiz,
    unit,
    runtime,
    exercises,
    visualizations,
    presentRichText: academic.presentRichText,
    routeId: group.getRouteId(miniQuiz.id),
  };
};
