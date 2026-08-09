import { UNIT_1_BONUSES } from "../physics/unit-1/bonuses.js";

export const BONUSES_BY_UNIT = [
  {
    unit: 1,
    bonuses: UNIT_1_BONUSES,
  },
];

export const BONUSES = BONUSES_BY_UNIT.flatMap((group) => group.bonuses);

export const getBonuses = () => [...BONUSES];

export const getBonusesByUnit = (unit) =>
  BONUSES_BY_UNIT.find((group) => group.unit === unit)?.bonuses ?? [];

export const getBonusBySlug = (slug) =>
  BONUSES.find((bonus) => bonus.slug === slug);
