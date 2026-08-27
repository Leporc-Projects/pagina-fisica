export const PULLEY_SCENARIOS = Object.freeze([
  Object.freeze({ id: "table-hanging", parameterKeys: Object.freeze(["m1", "m2", "muS", "muK", "g"]) }),
  Object.freeze({ id: "atwood", parameterKeys: Object.freeze(["m1", "m2", "g"]) }),
  Object.freeze({ id: "movable-pulley", parameterKeys: Object.freeze(["mL", "mC", "g"]) }),
  Object.freeze({ id: "three-pulley-tackle", parameterKeys: Object.freeze(["mL", "mC", "g"]) }),
  Object.freeze({ id: "double-atwood", parameterKeys: Object.freeze(["m1", "m2", "m3", "g"]) }),
]);

export const PULLEY_PRESETS = Object.freeze([
  Object.freeze({ id: "table-frictionless", scenarioId: "table-hanging", parameters: Object.freeze({ m1: 6, m2: 4, muS: 0, muK: 0, g: 9.8 }) }),
  Object.freeze({ id: "table-static", scenarioId: "table-hanging", parameters: Object.freeze({ m1: 10, m2: 3, muS: 0.5, muK: 0.3, g: 9.8 }) }),
  Object.freeze({ id: "atwood-balanced", scenarioId: "atwood", parameters: Object.freeze({ m1: 5, m2: 5, g: 9.8 }) }),
  Object.freeze({ id: "movable-balanced", scenarioId: "movable-pulley", parameters: Object.freeze({ mL: 8, mC: 4, g: 9.8 }) }),
  Object.freeze({ id: "three-pulley-moving", scenarioId: "three-pulley-tackle", parameters: Object.freeze({ mL: 6, mC: 1, g: 10 }) }),
  Object.freeze({ id: "three-pulley-balanced", scenarioId: "three-pulley-tackle", parameters: Object.freeze({ mL: 6, mC: 2, g: 10 }) }),
  Object.freeze({ id: "double-asymmetric", scenarioId: "double-atwood", parameters: Object.freeze({ m1: 3, m2: 5, m3: 7, g: 9.8 }) }),
]);

export const getPulleyScenario = (scenarioId) =>
  PULLEY_SCENARIOS.find(({ id }) => id === scenarioId) ?? null;
