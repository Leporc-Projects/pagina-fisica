import {
  eligiblePoolForBonus,
  matchesBlueprintCriteria,
  selectBonusQuestions,
} from "./bonus.js";

export const recommendedCandidateCount = (requiredCount) => {
  if (requiredCount === 1) return 3;
  if (requiredCount === 2) return 5;
  return requiredCount * 2 + 1;
};

export const auditBonusBlueprint = (bonus, bankItems) => {
  const pool = eligiblePoolForBonus(bonus, bankItems);
  const slots = bonus.blueprint.map((slot) => {
    const candidates = pool.filter((item) =>
      matchesBlueprintCriteria(item, slot.criteria)
    );
    const recommended = recommendedCandidateCount(slot.count);
    return {
      bonusId: bonus.id,
      bonusSlug: bonus.slug,
      slotId: slot.id,
      required: slot.count,
      candidateCount: candidates.length,
      recommended,
      candidateIds: candidates.map((item) => item.id),
      severity: candidates.length < slot.count
        ? "error"
        : candidates.length < recommended
          ? "warning"
          : "ok",
    };
  });
  return {
    bonusId: bonus.id,
    bonusSlug: bonus.slug,
    slots,
    errors: slots.filter((slot) => slot.severity === "error"),
    warnings: slots.filter((slot) => slot.severity === "warning"),
  };
};

export const auditAllBonusBlueprints = (bonuses, bankItems) =>
  bonuses.map((bonus) => auditBonusBlueprint(bonus, bankItems));

export const formatBlueprintAudit = (audits) => audits.flatMap((audit) => [
  `${audit.bonusSlug}`,
  ...audit.slots.map((slot) =>
    `  ${slot.slotId}: requiere ${slot.required}; candidatos ${slot.candidateCount}; ${slot.severity.toUpperCase()}; ${slot.candidateIds.join(", ")}`
  ),
]).join("\n");

export const simulateBonusDiversity = (
  bonus,
  bankItems,
  cryptoFactory,
  attempts = 100
) => {
  const combinations = new Map();
  const frequencies = new Map();
  const slotFrequencies = new Map();
  for (let index = 0; index < attempts; index += 1) {
    const selected = selectBonusQuestions(
      bonus,
      bankItems,
      cryptoFactory(index + 1)
    );
    const sources = selected.map((entry) => entry.sourceItemId);
    const combination = sources.join("|");
    combinations.set(combination, (combinations.get(combination) ?? 0) + 1);
    selected.forEach((entry) => {
      frequencies.set(entry.sourceItemId, (frequencies.get(entry.sourceItemId) ?? 0) + 1);
      const key = `${entry.slotId}:${entry.sourceItemId}`;
      slotFrequencies.set(key, (slotFrequencies.get(key) ?? 0) + 1);
    });
  }
  return {
    bonusId: bonus.id,
    attempts,
    uniqueCombinations: combinations.size,
    combinations: Object.fromEntries(combinations),
    frequencies: Object.fromEntries(frequencies),
    slotFrequencies: Object.fromEntries(slotFrequencies),
  };
};
