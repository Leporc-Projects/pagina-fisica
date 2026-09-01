export const PARAMETERIZED_FAMILY_SCHEMA_VERSION = "1.0.0";

const UINT32_RANGE = 0x1_0000_0000;

export const createCryptoRandom = (cryptoApi = globalThis.crypto) => {
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("No está disponible la fuente aleatoria criptográfica.");
  }
  return () => {
    const buffer = new Uint32Array(1);
    cryptoApi.getRandomValues(buffer);
    return buffer[0] / UINT32_RANGE;
  };
};

export const randomIndex = (length, random) => {
  if (!Number.isInteger(length) || length < 1) {
    throw new RangeError("La selección requiere una longitud positiva.");
  }
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new TypeError("El RNG inyectado debe producir valores en [0, 1).");
  }
  return Math.min(length - 1, Math.floor(value * length));
};

export const choose = (values, random) => values[randomIndex(values.length, random)];

export const integerBetween = (minimum, maximum, random) => {
  if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || maximum < minimum) {
    throw new RangeError("El intervalo entero es inválido.");
  }
  return minimum + randomIndex(maximum - minimum + 1, random);
};

export const roundTo = (value, decimals = 3) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const stableParameters = (parameters) => Object.fromEntries(
  Object.entries(parameters).sort(([first], [second]) => first.localeCompare(second))
);

export const parameterKey = (parameters) => JSON.stringify(stableParameters(parameters));

const hashText = (text) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const allFinite = (value, visited = new WeakSet()) => {
  if (typeof value === "number") return Number.isFinite(value);
  if (!value || typeof value !== "object") return true;
  if (visited.has(value)) return true;
  visited.add(value);
  return Object.values(value).every((entry) => allFinite(entry, visited));
};

export const validateFamilyDefinition = (family) => {
  const errors = [];
  const require = (condition, message) => { if (!condition) errors.push(message); };
  const miniQuizV2Family = family?.schemaVersion === "2.0.0" &&
    family?.source?.kind === "miniQuizV2" && family?.modality === "miniQuiz";
  require(family?.schemaVersion === PARAMETERIZED_FAMILY_SCHEMA_VERSION || miniQuizV2Family, "schemaVersion inválida.");
  require(family?.itemKind === "parameterizedFamily", "itemKind inválido.");
  require(typeof family?.id === "string" && /^[a-z0-9-]+$/.test(family.id), "id inválido.");
  require(Number.isInteger(family?.version) && family.version > 0, "version inválida.");
  require(typeof family?.generateParameters === "function", "Falta generateParameters.");
  require(typeof family?.build === "function", "Falta build.");
  require(family?.constraints && typeof family.constraints === "object", "Faltan constraints.");
  return { valid: errors.length === 0, errors };
};

export const generateFamilyInstance = (
  family,
  { random = createCryptoRandom(), recentParameterKeys = new Set(), attempts = 12 } = {}
) => {
  const validation = validateFamilyDefinition(family);
  if (!validation.valid) throw new TypeError(validation.errors.join(" "));

  let parameters;
  let key;
  for (let index = 0; index < attempts; index += 1) {
    parameters = stableParameters(family.generateParameters(random));
    key = parameterKey(parameters);
    if (!recentParameterKeys.has(`${family.id}:${key}`)) break;
  }

  const built = family.build(parameters);
  const rebuilt = family.build(parameters);
  if (JSON.stringify(built) !== JSON.stringify(rebuilt)) {
    throw new TypeError(`${family.id} no deriva una instancia determinista.`);
  }
  if (!allFinite(parameters) || !allFinite(built)) {
    throw new TypeError(`${family.id} produjo NaN o Infinity.`);
  }

  const instanceId = `${family.id}--${hashText(key)}`;
  return {
    ...family,
    ...built,
    id: instanceId,
    itemKind: "parameterizedInstance",
    familyId: family.id,
    familyVersion: family.version,
    instanceId,
    parameters,
    parameterKey: key,
    generator: undefined,
    generateParameters: undefined,
    build: undefined,
  };
};

export const familyPublicDescriptor = (family) => ({
  schemaVersion: family.schemaVersion,
  itemKind: family.itemKind,
  id: family.id,
  version: family.version,
  unit: family.unit,
  topic: family.topic,
  subtopic: family.subtopic,
  type: family.type,
  representation: family.representation,
  cognitiveLevel: family.cognitiveLevel,
  difficulty: family.difficulty,
  modalities: family.modalities,
  objectives: family.objectives,
  constraints: family.constraints,
  purpose: family.purpose,
  exposure: family.exposure,
  status: family.status,
  bonusEligible: family.bonusEligible,
  interaction: family.interaction,
});
