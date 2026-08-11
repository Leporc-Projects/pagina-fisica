import { getCourseById } from "../data/courses.js";
import { getAcademicUnitForContext } from "../data/physics/index.js";
import { getSimulationModelById } from "../data/simulation-models.js";

export const SIMULATION_EXPERIENCE_SCHEMA_VERSION = "1.0.0";
export const SIMULATION_EXPERIENCE_PACK_SCHEMA_VERSION = "1.0.0";
export const SIMULATION_EXPERIENCE_STATUSES = Object.freeze([
  "draft",
  "review",
  "published",
  "archived",
]);
export const SIMULATION_EXPERIENCE_LIMITS = Object.freeze({
  maximumPresets: 5,
  maximumObservations: 6,
  maximumTitleLength: 120,
  maximumSummaryLength: 360,
  maximumPresetLabelLength: 80,
  maximumObservationLength: 320,
});

const EXPERIENCE_KEYS = [
  "schemaVersion",
  "id",
  "version",
  "modelId",
  "title",
  "summary",
  "status",
  "parameters",
  "views",
  "presets",
  "observations",
  "contexts",
];
const PARAMETER_KEYS = ["default", "minimum", "maximum", "step", "editable"];
const PRESET_KEYS = ["id", "label", "parameters"];
const CONTEXT_KEYS = ["courseId", "unit", "topics"];
const ID_PATTERN = /^[a-z][a-z0-9-]{1,95}$/;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;
const HTML_MARKUP = /<\s*\/?\s*[a-z][^>]*>|<!--|-->/iu;

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const bytesToHex = (bytes) => [...bytes]
  .map((byte) => byte.toString(16).padStart(2, "0"))
  .join("");
const unique = (values) => new Set(values).size === values.length;
const validText = (value, maximumLength) =>
  typeof value === "string" &&
  value === value.trim() &&
  value.length > 0 &&
  value.length <= maximumLength &&
  !CONTROL_CHARACTERS.test(value) &&
  !HTML_MARKUP.test(value);
const issue = (issues, path, code, message) => {
  issues.push({ path, code, message });
};

const validateKeys = (value, allowedKeys, path, issues) => {
  if (!isPlainObject(value)) {
    issue(issues, path, "invalid-object", `${path} debe ser un objeto.`);
    return false;
  }
  const unknownKeys = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  unknownKeys.forEach((key) => issue(
    issues,
    `${path}.${key}`,
    "unknown-property",
    `${path} contiene la propiedad desconocida “${key}”.`
  ));
  return true;
};

const validateAcademicContext = (context, index, issues) => {
  const path = `contexts[${index}]`;
  if (!validateKeys(context, CONTEXT_KEYS, path, issues)) return;
  const course = getCourseById(context.courseId);
  if (!course) {
    issue(issues, `${path}.courseId`, "unknown-course", "El contexto referencia un curso inexistente.");
  }
  const academicUnit = getAcademicUnitForContext(context.courseId, context.unit);
  if (!academicUnit) {
    issue(issues, `${path}.unit`, "unknown-unit", "La unidad no pertenece al registro académico disponible.");
  }
  const topics = Array.isArray(context.topics) ? context.topics : [];
  if (!Array.isArray(context.topics) || topics.length === 0) {
    issue(issues, `${path}.topics`, "invalid-topics", "El contexto requiere al menos un tema.");
    return;
  }
  const topicIds = new Set((academicUnit?.topics ?? []).map((topic) => topic.slug));
  topics.forEach((topic, topicIndex) => {
    if (!topicIds.has(topic)) {
      issue(issues, `${path}.topics[${topicIndex}]`, "unknown-topic", `El tema “${String(topic)}” no existe.`);
    }
  });
  if (!unique(topics)) {
    issue(issues, `${path}.topics`, "duplicate-topic", "El contexto contiene temas duplicados.");
  }
};

export const validateSimulationExperience = (
  experience,
  { existingIds = [] } = {}
) => {
  const issues = [];
  if (!validateKeys(experience, EXPERIENCE_KEYS, "experience", issues)) {
    return { valid: false, issues, errors: issues.map((entry) => entry.message) };
  }

  if (experience.schemaVersion !== SIMULATION_EXPERIENCE_SCHEMA_VERSION) {
    issue(issues, "schemaVersion", "invalid-schema", "schemaVersion de experiencia inválida.");
  }
  if (!ID_PATTERN.test(experience.id ?? "")) {
    issue(issues, "id", "invalid-id", "El ID de la experiencia no es seguro.");
  }
  if (new Set(existingIds).has(experience.id)) {
    issue(issues, "id", "duplicate-id", "El ID de la experiencia ya existe.");
  }
  if (!Number.isInteger(experience.version) || experience.version < 1) {
    issue(issues, "version", "invalid-version", "La versión debe ser un entero positivo.");
  }
  const model = getSimulationModelById(experience.modelId);
  if (!model) {
    issue(issues, "modelId", "unknown-model", "El modelId no pertenece al registro de modelos.");
  }
  if (!validText(experience.title, SIMULATION_EXPERIENCE_LIMITS.maximumTitleLength)) {
    issue(issues, "title", "invalid-title", "El título es obligatorio, debe ser texto plano y no superar 120 caracteres.");
  }
  if (!validText(experience.summary, SIMULATION_EXPERIENCE_LIMITS.maximumSummaryLength)) {
    issue(issues, "summary", "invalid-summary", "El resumen es obligatorio, debe ser texto plano y no superar 360 caracteres.");
  }
  if (!SIMULATION_EXPERIENCE_STATUSES.includes(experience.status)) {
    issue(issues, "status", "invalid-status", "El estado editorial no está permitido.");
  }

  const parameterDefinitions = model?.parameters ?? {};
  const parameterKeys = Object.keys(parameterDefinitions);
  if (validateKeys(experience.parameters, parameterKeys, "parameters", issues)) {
    parameterKeys.forEach((key) => {
      const definition = parameterDefinitions[key];
      const config = experience.parameters[key];
      const path = `parameters.${key}`;
      if (!validateKeys(config, PARAMETER_KEYS, path, issues)) return;
      PARAMETER_KEYS.forEach((property) => {
        if (!(property in config)) {
          issue(issues, `${path}.${property}`, "missing-property", `${path} requiere ${property}.`);
        }
      });
      for (const property of ["default", "minimum", "maximum", "step"]) {
        if (!Number.isFinite(config[property])) {
          issue(issues, `${path}.${property}`, "invalid-number", `${path}.${property} debe ser un número finito.`);
        }
      }
      if (Number.isFinite(config.minimum) && Number.isFinite(config.maximum)) {
        if (config.minimum >= config.maximum) {
          issue(issues, path, "invalid-range", `${path} requiere minimum menor que maximum.`);
        }
        if (config.minimum < definition.hardMinimum || config.maximum > definition.hardMaximum) {
          issue(issues, path, "hard-limit-exceeded", `${path} supera los límites duros del modelo.`);
        }
      }
      if (Number.isFinite(config.default) && Number.isFinite(config.minimum) &&
          Number.isFinite(config.maximum) &&
          (config.default < config.minimum || config.default > config.maximum)) {
        issue(issues, `${path}.default`, "default-out-of-range", `${path}.default debe pertenecer al rango de la experiencia.`);
      }
      if (!Number.isFinite(config.step) || config.step <= 0 ||
          Number.isFinite(config.maximum - config.minimum) && config.step > config.maximum - config.minimum) {
        issue(issues, `${path}.step`, "invalid-step", `${path}.step debe ser positivo y no superar el ancho del rango.`);
      }
      if (typeof config.editable !== "boolean") {
        issue(issues, `${path}.editable`, "invalid-editable", `${path}.editable debe ser booleano.`);
      }
    });
    Object.keys(experience.parameters).forEach((key) => {
      if (!parameterKeys.includes(key)) return;
    });
    parameterKeys.forEach((key) => {
      if (!(key in experience.parameters)) {
        issue(issues, `parameters.${key}`, "missing-parameter", `Falta el parámetro ${key}.`);
      }
    });
  }

  const viewDefinitions = model?.views ?? {};
  const viewKeys = Object.keys(viewDefinitions);
  if (validateKeys(experience.views, viewKeys, "views", issues)) {
    viewKeys.forEach((key) => {
      if (!(key in experience.views)) {
        issue(issues, `views.${key}`, "missing-view", `Falta la vista ${key}.`);
      } else if (typeof experience.views[key] !== "boolean") {
        issue(issues, `views.${key}`, "invalid-view", `La vista ${key} debe ser booleana.`);
      }
    });
    const visualViews = viewKeys.filter((key) => viewDefinitions[key].visual === true);
    if (!visualViews.some((key) => experience.views[key] === true)) {
      issue(issues, "views", "empty-visual-experience", "Activa al menos una representación visual principal del modelo.");
    }
  }

  if (!Array.isArray(experience.presets) ||
      experience.presets.length > SIMULATION_EXPERIENCE_LIMITS.maximumPresets) {
    issue(issues, "presets", "invalid-presets", "Los casos de estudio deben ser una lista de máximo cinco entradas.");
  } else {
    const presetIds = experience.presets.map((preset) => preset?.id);
    if (!unique(presetIds)) {
      issue(issues, "presets", "duplicate-preset", "Los casos de estudio deben tener IDs únicos.");
    }
    experience.presets.forEach((preset, index) => {
      const path = `presets[${index}]`;
      if (!validateKeys(preset, PRESET_KEYS, path, issues)) return;
      if (!ID_PATTERN.test(preset.id ?? "")) {
        issue(issues, `${path}.id`, "invalid-preset-id", "El ID del caso de estudio no es seguro.");
      }
      if (!validText(preset.label, SIMULATION_EXPERIENCE_LIMITS.maximumPresetLabelLength)) {
        issue(issues, `${path}.label`, "invalid-preset-label", "El nombre del caso debe ser texto plano y no superar 80 caracteres.");
      }
      if (!validateKeys(preset.parameters, parameterKeys, `${path}.parameters`, issues)) return;
      parameterKeys.forEach((key) => {
        const value = preset.parameters[key];
        const config = experience.parameters?.[key];
        if (!(key in preset.parameters)) {
          issue(issues, `${path}.parameters.${key}`, "missing-preset-parameter", `El caso requiere el parámetro ${key}.`);
        } else if (!Number.isFinite(value) || !config || value < config.minimum || value > config.maximum) {
          issue(issues, `${path}.parameters.${key}`, "preset-out-of-range", `El valor ${key} del caso está fuera del rango de la experiencia.`);
        } else if (config.editable === false && value !== config.default) {
          issue(issues, `${path}.parameters.${key}`, "locked-preset-mismatch", `El caso no puede cambiar el parámetro bloqueado ${key}.`);
        }
      });
    });
  }

  if (!Array.isArray(experience.observations) ||
      experience.observations.length > SIMULATION_EXPERIENCE_LIMITS.maximumObservations) {
    issue(issues, "observations", "invalid-observations", "La guía debe ser una lista de máximo seis observaciones.");
  } else {
    experience.observations.forEach((observation, index) => {
      if (!validText(observation, SIMULATION_EXPERIENCE_LIMITS.maximumObservationLength)) {
        issue(issues, `observations[${index}]`, "invalid-observation", "Cada observación debe ser texto plano y no superar 320 caracteres.");
      }
    });
  }

  if (!Array.isArray(experience.contexts)) {
    issue(issues, "contexts", "invalid-contexts", "contexts debe ser una lista.");
  } else {
    experience.contexts.forEach((context, index) => validateAcademicContext(context, index, issues));
    const contextIds = experience.contexts.map((context) =>
      `${context?.courseId}:${context?.unit}`
    );
    if (!unique(contextIds)) {
      issue(issues, "contexts", "duplicate-context", "No repitas un contexto de curso y unidad.");
    }
  }

  return { valid: issues.length === 0, issues, errors: issues.map((entry) => entry.message) };
};

const normalizeParameters = (parameters, model) => Object.fromEntries(
  Object.keys(model?.parameters ?? {}).map((key) => [key, {
    default: Number(parameters?.[key]?.default),
    minimum: Number(parameters?.[key]?.minimum),
    maximum: Number(parameters?.[key]?.maximum),
    step: Number(parameters?.[key]?.step),
    editable: parameters?.[key]?.editable === true,
  }])
);

export const normalizeSimulationExperience = (
  experience,
  { status = experience?.status ?? "draft" } = {}
) => {
  const modelId = String(experience?.modelId ?? "").trim();
  const model = getSimulationModelById(modelId);
  const parameterKeys = Object.keys(model?.parameters ?? {});
  return {
    schemaVersion: SIMULATION_EXPERIENCE_SCHEMA_VERSION,
    id: String(experience?.id ?? "").trim(),
    version: Number.isInteger(experience?.version) ? experience.version : 1,
    modelId,
    title: String(experience?.title ?? "").trim(),
    summary: String(experience?.summary ?? "").trim(),
    status,
    parameters: normalizeParameters(experience?.parameters, model),
    views: Object.fromEntries(Object.keys(model?.views ?? {}).map((key) => [key, experience?.views?.[key] === true])),
    presets: (Array.isArray(experience?.presets) ? experience.presets : []).map((preset) => ({
      id: String(preset?.id ?? "").trim(),
      label: String(preset?.label ?? "").trim(),
      parameters: Object.fromEntries(parameterKeys.map((key) => [key, Number(preset?.parameters?.[key])])),
    })),
    observations: (Array.isArray(experience?.observations) ? experience.observations : [])
      .map((observation) => String(observation).trim()),
    contexts: (Array.isArray(experience?.contexts) ? experience.contexts : []).map((context) => ({
      courseId: String(context?.courseId ?? "").trim(),
      unit: Number(context?.unit),
      topics: (Array.isArray(context?.topics) ? context.topics : [])
        .map((topic) => String(topic).trim()),
    })),
  };
};

const slugify = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 40) || "experiencia";

export const createSimulationExperienceId = (
  modelId,
  title,
  cryptoApi = globalThis.crypto
) => {
  if (!getSimulationModelById(modelId)) throw new TypeError("El modelo no existe.");
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("No está disponible la generación criptográfica del ID.");
  }
  return `${modelId}-${slugify(title)}-${bytesToHex(cryptoApi.getRandomValues(new Uint8Array(6)))}`;
};

export const createSimulationExperienceDraft = (
  fields,
  { id, cryptoApi = globalThis.crypto } = {}
) => normalizeSimulationExperience({
  ...fields,
  id: id ?? createSimulationExperienceId(fields?.modelId, fields?.title, cryptoApi),
  version: 1,
  status: "draft",
});

export const createSimulationExperiencePack = (
  experiences,
  { cryptoApi = globalThis.crypto, createdAt = new Date().toISOString() } = {}
) => {
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("No está disponible la generación criptográfica del paquete.");
  }
  return {
    schemaVersion: SIMULATION_EXPERIENCE_PACK_SCHEMA_VERSION,
    packageId: `simulation-pack-${bytesToHex(cryptoApi.getRandomValues(new Uint8Array(8)))}`,
    createdAt,
    source: "teacher",
    experiences: experiences.map((experience) =>
      normalizeSimulationExperience(experience, { status: "draft" })
    ),
  };
};

export const validateSimulationExperiencePack = (
  pack,
  { existingIds = [] } = {}
) => {
  const issues = [];
  const PACK_KEYS = ["schemaVersion", "packageId", "createdAt", "source", "experiences"];
  if (!validateKeys(pack, PACK_KEYS, "pack", issues)) {
    return { valid: false, issues, errors: issues.map((entry) => entry.message) };
  }
  if (pack.schemaVersion !== SIMULATION_EXPERIENCE_PACK_SCHEMA_VERSION) {
    issue(issues, "schemaVersion", "invalid-pack-schema", "schemaVersion de paquete inválida.");
  }
  if (!/^simulation-pack-[0-9a-f]{16}$/.test(pack.packageId ?? "")) {
    issue(issues, "packageId", "invalid-package-id", "packageId inválido.");
  }
  const createdAt = new Date(pack.createdAt);
  if (typeof pack.createdAt !== "string" || Number.isNaN(createdAt.valueOf()) ||
      createdAt.toISOString() !== pack.createdAt) {
    issue(issues, "createdAt", "invalid-created-at", "createdAt debe usar ISO 8601.");
  }
  if (pack.source !== "teacher") {
    issue(issues, "source", "invalid-source", "La fuente del paquete debe ser teacher.");
  }
  if (!Array.isArray(pack.experiences) || pack.experiences.length === 0) {
    issue(issues, "experiences", "empty-pack", "El paquete no contiene experiencias.");
  } else {
    const ids = pack.experiences.map((experience) => experience?.id);
    if (!unique(ids)) issue(issues, "experiences", "duplicate-pack-id", "El paquete contiene IDs duplicados.");
    pack.experiences.forEach((experience, index) => {
      const validation = validateSimulationExperience(experience, { existingIds });
      validation.issues.forEach((entry) => issue(
        issues,
        `experiences[${index}].${entry.path}`,
        entry.code,
        `Experiencia ${index + 1}: ${entry.message}`
      ));
      if (experience?.status !== "draft") {
        issue(issues, `experiences[${index}].status`, "non-draft-pack", `Experiencia ${index + 1}: el paquete solo admite estado draft.`);
      }
    });
  }
  return { valid: issues.length === 0, issues, errors: issues.map((entry) => entry.message) };
};

export const mergeSimulationExperiencePack = (pack, currentExperiences) => {
  if (!Array.isArray(currentExperiences)) {
    throw new TypeError("El almacenamiento de experiencias debe ser una lista.");
  }
  const validation = validateSimulationExperiencePack(pack, {
    existingIds: currentExperiences.map((experience) => experience.id),
  });
  if (!validation.valid) throw new TypeError(validation.errors.join(" "));
  const imported = pack.experiences.map((experience) =>
    normalizeSimulationExperience(experience, { status: "review" })
  );
  return {
    experiences: [...currentExperiences, ...imported],
    imported,
    packageId: pack.packageId,
  };
};

export const simulationExperiencePackFilename = (pack) =>
  `aula-fisica-simulation-pack-${pack.createdAt.slice(0, 10)}-${pack.packageId.slice(-8)}.json`;

export const toSimulationExperiencePackJSON = (pack) =>
  `${JSON.stringify(pack, null, 2)}\n`;
