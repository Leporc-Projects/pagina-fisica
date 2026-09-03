const FAMILY_ADAPTER_LOADERS = Object.freeze({
  "legacy-u1": () => import("./runtime/legacy-u1.js"),
  "v2-u1": () => import("./runtime/v2-u1.js"),
});

export const loadMiniQuizFamilyAdapter = async (adapterId) => {
  const load = FAMILY_ADAPTER_LOADERS[adapterId];
  if (!load) throw new RangeError(`No existe el adaptador de familias ${String(adapterId)}.`);
  return load();
};
