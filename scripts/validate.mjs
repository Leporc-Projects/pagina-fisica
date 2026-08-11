// Validación estructural sin dependencias externas.
// Compara los contratos de datos con el enrutamiento por archivos de Astro y
// acumula todos los problemas para corregirlos en una sola ejecución.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  COURSE,
  COURSE_NAV,
  EVALUATION,
  SCHEDULE,
  UNITS,
} from "../src/data/course.js";
import {
  COURSES,
  COURSE_IDS,
  getActiveCourses,
  getCourseById,
} from "../src/data/courses.js";
import { HOME_LINKS, NAV, SITE } from "../src/data/site.js";
import {
  KINEMATICS_1D_CONTROLS,
  KINEMATICS_1D_PRESETS,
  SIMULATIONS,
  SIMULATION_CATEGORIES,
  SIMULATION_STATUSES,
  getPublishedSimulations,
  getSimulationsForCourseTopic,
} from "../src/data/simulations.js";
import {
  SIMULATION_MODELS,
  SIMULATION_RENDERER_IDS,
  getSimulationModelById,
} from "../src/data/simulation-models.js";
import {
  SIMULATION_RENDERERS,
  getSimulationRendererById,
} from "../src/data/simulation-renderers.js";
import {
  SIMULATION_EXPERIENCES,
  getSimulationExperienceById,
} from "../src/data/simulation-experiences.js";
import {
  SIMULATION_EXPERIENCE_PACK_SCHEMA_VERSION,
  SIMULATION_EXPERIENCE_SCHEMA_VERSION,
  validateSimulationExperience,
} from "../src/utils/simulation-experience.js";
import {
  getKinematicsState,
  getTurningPoint,
} from "../src/utils/kinematics-1d.js";
import { createKinematicsChartGeometry } from "../src/utils/kinematics-svg.js";
import { getProjectileSummary } from "../src/utils/projectile-2d.js";
import {
  NOTICES,
  getCourseNotices,
  getGlobalNotices,
  getHomepageNotices,
  getPublishedNotices,
} from "../src/data/notices.js";
import { BONUSES } from "../src/data/bonuses/index.js";
import { VIDEOS } from "../src/data/videos.js";
import {
  THEME_COLORS,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
} from "../src/data/theme.js";
import { resolveBasePath } from "../src/utils/paths.js";
import { DEFAULT_LOCALE, LOCALES, SUPPORTED_LOCALES } from "../src/i18n/config.js";
import { UI_DICTIONARIES, getDictionaryKeys, t } from "../src/i18n/index.js";
import { LOCALIZED_ROUTES, ROUTE_IDS, getRouteCounterpart } from "../src/i18n/routes.js";
import { getLanguageMetadata } from "../src/i18n/metadata.js";
import { ACADEMIC_UNITS } from "../src/data/physics/index.js";
import { UNIT_1_CONTENT } from "../src/data/physics/unit-1/content.js";
import { UNIT_1_COMMON_ERRORS } from "../src/data/physics/unit-1/common-errors.js";
import {
  EXERCISE_COGNITIVE_LEVELS,
  EXERCISE_EXPOSURES,
  EXERCISE_INTERACTION_KINDS,
  EXERCISE_MODALITIES,
  EXERCISE_PURPOSES,
  EXERCISE_REPRESENTATIONS,
  EXERCISE_STATUSES,
  EXERCISE_TYPES,
  UNIT_1_EXERCISES,
} from "../src/data/physics/unit-1/exercises.js";
import { UNIT_1_FORMULAS } from "../src/data/physics/unit-1/formulas.js";
import {
  presentUnit1RichText,
  UNIT_1_INLINE_MATH_TOKENS,
} from "../src/data/physics/unit-1/math-content.js";
import { UNIT_1 } from "../src/data/physics/unit-1/unit.js";
import { UNIT_1_VISUALIZATIONS } from "../src/data/physics/unit-1/visualizations.js";
import { UNIT_1_EXERCISE_FAMILIES } from "../src/data/physics/unit-1/families.js";
import { UNIT_1_BANK_ITEMS } from "../src/data/physics/unit-1/bank.js";
import {
  ACTIVITY_TYPES,
  PARTICIPATION_TOPICS,
} from "../src/data/participation.js";
import {
  REVIEW_FILE_MAX_BYTES,
  REVIEW_SESSION_SCHEMA_VERSION,
  REVIEW_STATUSES,
} from "../src/data/review.js";
import {
  DUPLICATE_POLICIES,
  INCIDENT_TYPES,
  MISSING_POLICIES,
  RESULTS_LIMITS,
  SUPPORTED_RESULT_FORMATS,
} from "../src/data/results-organizer.js";
import {
  BONUS_FEEDBACK_POLICIES,
  canSatisfyBonusBlueprint,
  eligiblePoolForBonus,
} from "../src/utils/bonus.js";
import {
  PARTICIPATION_PURPOSES,
  createParticipationResponse,
  validateParticipationResponse,
} from "../src/utils/participation.js";
import {
  addReviewImportEntries,
  aggregateReviewSession,
  createReviewExport,
  createReviewSession,
  validateImportedDocument,
} from "../src/utils/review.js";
import { auditAllBonusBlueprints } from "../src/utils/bonus-audit.js";
import { validateFamilyDefinition } from "../src/utils/exercise-families.js";
import {
  NOTICE_CATEGORIES,
  NOTICE_PACK_SCHEMA_VERSION,
  NOTICE_SCHEMA_VERSION,
  NOTICE_STATUSES,
  validateNotice,
} from "../src/utils/notices.js";
import { validateContentScope } from "../src/utils/content-scope.js";

const projectRoot = fileURLToPath(
  new URL("../", import.meta.url)
);

const failures = [];

// Registra cada contrato sin interrumpir la ejecución en el primer error.
const check = (condition, message) => {
  if (condition) {
    console.log(`[ok] ${message}`);
  } else {
    failures.push(message);
    console.error(`[error] ${message}`);
  }
};

// Devuelve cada valor repetido una sola vez para producir mensajes legibles.
const duplicates = (values) =>
  [...new Set(
    values.filter(
      (value, index) => values.indexOf(value) !== index
    )
  )];

// Recorre directorios porque Astro puede representar rutas mediante carpetas.
const walkFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory()
        ? walkFiles(target)
        : [target];
    });

// Extrae un bloque plano de CSS para validar tokens sin incorporar un parser.
const extractCssBlock = (source, selector) => {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) return "";

  const contentStart = source.indexOf("{", start) + 1;
  const end = source.indexOf("\n}", contentStart);
  return end === -1 ? "" : source.slice(contentStart, end);
};

const cssHexTokens = (block) =>
  Object.fromEntries(
    [...block.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)]
      .map((match) => [match[1], match[2]])
  );

// WCAG compara luminancias relativas; 4.5:1 cubre texto normal y 3:1 foco.
const relativeLuminance = (hex) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
    );

  return (
    0.2126 * channels[0] +
    0.7152 * channels[1] +
    0.0722 * channels[2]
  );
};

const contrastRatio = (first, second) => {
  const lighter = Math.max(
    relativeLuminance(first),
    relativeLuminance(second)
  );
  const darker = Math.min(
    relativeLuminance(first),
    relativeLuminance(second)
  );

  return (lighter + 0.05) / (darker + 0.05);
};

// Unifica rutas con slash final, query o hash antes de compararlas.
const normalizeRoute = (route) => {
  const cleanRoute = route.split(/[?#]/, 1)[0];

  if (cleanRoute === "/") return cleanRoute;
  return cleanRoute.replace(/\/$/, "");
};

const pageRoot = path.join(projectRoot, "src/pages");
const pageFiles = walkFiles(pageRoot)
  .filter((file) => file.endsWith(".astro"));

// Reproduce la convención de Astro: index.astro representa la carpeta que lo contiene.
const routes = new Set(
  pageFiles.map((file) => {
    let route = path.relative(pageRoot, file)
      .split(path.sep)
      .join("/")
      .replace(/\.astro$/, "")
      .replace(/\/index$/, "");

    if (route === "index") route = "";
    return normalizeRoute(`/${route}`);
  })
);

const evaluationTotal = EVALUATION.reduce(
  (total, item) => total + item.percentage,
  0
);

check(
  evaluationTotal === 100,
  "La evaluación suma 100 %."
);

check(
  SCHEDULE.every(
    (entry, index) => entry.session === index + 1
  ),
  "Las sesiones tienen numeración consecutiva."
);

check(
  SCHEDULE.every(
    (entry, index) =>
      index === 0 ||
      SCHEDULE[index - 1].date <= entry.date
  ),
  "Las fechas del cronograma están ordenadas."
);

check(
  duplicates(SCHEDULE.map((entry) => entry.session)).length === 0,
  "No hay identificadores de sesión duplicados."
);

check(
  duplicates(COURSE_NAV.map((item) => item.href)).length === 0,
  "COURSE_NAV no contiene rutas duplicadas."
);

check(
  duplicates(COURSES.map((course) => course.id)).length === 0 &&
    duplicates(COURSES.map((course) => course.href)).length === 0 &&
    COURSE_IDS.PHYSICS_BASIC_1 === "fisica-basica-1" &&
    getCourseById(COURSE.id)?.name === COURSE.name &&
    getCourseById(COURSE.id)?.href === COURSE.href &&
    getActiveCourses().some((course) => course.id === COURSE.id),
  "El registro de cursos conserva IDs, rutas e identidad canónica sin duplicados."
);

check(
  NAV.map((item) => item.label).join("|") ===
    ["Inicio", COURSE.name, "Simulaciones", "Avisos"].join("|"),
  "La navegación global contiene solo las cuatro secciones vigentes."
);

check(
  COURSE_NAV.map((item) => item.label).join("|") ===
    [
      "Curso",
      "Avisos",
      "Cronograma",
      "Unidades y apuntes",
      "Ejercicios y tutorías",
      "Bonos",
      "Videos",
      "Evaluación y notas",
      "Recursos",
      "Participa",
    ].join("|") &&
    COURSE_NAV.at(-1)?.href === "/fisica-basica-1/participa" &&
    COURSE_NAV.at(-1)?.includeInGlobalMenu === false,
  "La navegación interna incluye Avisos tras la raíz y mantiene Participa fuera del menú global."
);

check(
  !NAV.flatMap((item) => item.children ?? [])
    .some((item) => item.href === "/fisica-basica-1/participa"),
  "Participa no aparece en la navegación global."
);

check(
  ACTIVITY_TYPES.join(",") === [
    "concept-difficulty",
    "student-question-proposal",
    "improvement-feedback",
  ].join(","),
  "Participación ofrece exactamente los tres modos iniciales."
);

check(
  PARTICIPATION_TOPICS.map((topic) => topic.slug).join(",") ===
    UNIT_1.topics.map((topic) => topic.slug).join(","),
  "Participación deriva sus temas de la Unidad 1 real."
);

const validationParticipationResponse = createParticipationResponse({
  activityType: "concept-difficulty",
  topicSlug: UNIT_1.topics[0].slug,
  payload: { unclearPoint: "Respuesta determinista de validación." },
}, {
  responseId: "resp_00112233445566778899aabbccddeeff",
  createdAt: "2026-08-08T00:00:00.000Z",
});

check(
  validateParticipationResponse(validationParticipationResponse).valid &&
    validationParticipationResponse.collection === "local" &&
    validationParticipationResponse.privacy === "anonymous" &&
    validationParticipationResponse.submissionTarget === null,
  "El contrato de participación es local, anónimo y no tiene destino de envío."
);

check(
  !PARTICIPATION_PURPOSES.includes("research") &&
    !PARTICIPATION_PURPOSES.includes("measurement"),
  "Participación mantiene research y measurement fuera del flujo público."
);

const reviewRoute = "/fisica-basica-1/herramientas/revision";
const reviewStatuses = [
  "pending",
  "interesting",
  "needs-adjustments",
  "discard",
  "bank-candidate",
];

check(
  routes.has(reviewRoute) &&
    !COURSE_NAV.some((item) => item.href === reviewRoute) &&
    !NAV.flatMap((item) => item.children ?? []).some((item) => item.href === reviewRoute),
  "El Centro de revisión existe sin convertirse en navegación estudiantil prominente."
);

check(
  REVIEW_SESSION_SCHEMA_VERSION === "1.0.0" &&
    REVIEW_FILE_MAX_BYTES === 5 * 1024 * 1024 &&
    REVIEW_STATUSES.map(([value]) => value).join(",") === reviewStatuses.join(","),
  "La sesión de revisión declara versión, límite y estados docentes estables."
);

const resultsRoute = "/fisica-basica-1/herramientas/notas";
check(
  routes.has(resultsRoute) &&
    !COURSE_NAV.some((item) => item.href === resultsRoute) &&
    !NAV.flatMap((item) => item.children ?? []).some((item) => item.href === resultsRoute),
  "El Organizador existe como herramienta docente sin entrar a la navegación global."
);

const teacherToolRoutes = [
  "/fisica-basica-1/herramientas",
  "/fisica-basica-1/herramientas/banco",
  "/fisica-basica-1/herramientas/avisos",
  "/fisica-basica-1/herramientas/simulaciones",
  reviewRoute,
  resultsRoute,
];
check(
  teacherToolRoutes.every((route) => routes.has(route)) &&
    teacherToolRoutes.every((route) => !COURSE_NAV.some((item) => item.href === route)) &&
    teacherToolRoutes.every((route) =>
      !NAV.flatMap((item) => item.children ?? []).some((item) => item.href === route)
    ),
  "El hub y sus cinco herramientas existen fuera del menú estudiantil principal."
);

check(
  SUPPORTED_RESULT_FORMATS.join(",") === "csv,xlsx,json" &&
    DUPLICATE_POLICIES.map(([value]) => value).join(",") ===
      "unresolved,first,last,highest,average" &&
    MISSING_POLICIES.map(([value]) => value).join(",") ===
      "unresolved,exclude,zero" &&
    INCIDENT_TYPES.length >= 14 &&
    RESULTS_LIMITS.maxFileBytes === 15 * 1024 * 1024 &&
    RESULTS_LIMITS.maxRows === 10_000 &&
    RESULTS_LIMITS.maxColumns === 250,
  "El Organizador declara formatos, políticas, incidencias y límites explícitos."
);

const reviewDocument = JSON.parse(JSON.stringify(validationParticipationResponse));
const reviewImport = addReviewImportEntries(createReviewSession(), [
  {
    name: "respuesta.json",
    size: 1024,
    text: JSON.stringify(reviewDocument),
  },
  {
    name: "duplicado.json",
    size: 1024,
    text: JSON.stringify(reviewDocument),
  },
  {
    name: "invalido.json",
    size: 12,
    text: "{no-json}",
  },
]);
const reviewSummary = aggregateReviewSession(reviewImport);
const reviewExport = createReviewExport(
  reviewImport,
  {},
  "2026-08-08T00:00:00.000Z"
);

check(
  validateImportedDocument(reviewDocument).status === "valid" &&
    reviewSummary.uniqueRecords === 1 &&
    reviewSummary.duplicates === 1 &&
    reviewSummary.incidents.invalid === 1 &&
    reviewExport.items[0].original.responseId === validationParticipationResponse.responseId &&
    reviewExport.authenticity === "local-editable-file",
  "La revisión valida por archivo, deduplica sin inflar conteos y conserva el original."
);

check(
  HOME_LINKS.map((item) => `${item.number}|${item.label}|${item.href}`)
    .join("\n") ===
    [
      `01|${COURSE.name}|/fisica-basica-1`,
      "02|Simulaciones|/simulaciones",
    ].join("\n"),
  "La portada destaca solo el curso y Simulaciones."
);

const simulationIds = SIMULATIONS.map((simulation) => simulation.id);
const simulationRoutes = SIMULATIONS.map((simulation) => simulation.route);
const unit1TopicSet = new Set(UNIT_1.topics.map((topic) => topic.slug));
const simulationModelIds = SIMULATION_MODELS.map((model) => model.id);
const simulationExperienceIds = SIMULATION_EXPERIENCES.map((experience) => experience.id);
const simulationRendererIds = SIMULATION_RENDERERS.map((renderer) => renderer.id);

check(
  duplicates(simulationModelIds).length === 0 &&
    duplicates(simulationRendererIds).length === 0 &&
    simulationRendererIds.join(",") === SIMULATION_RENDERER_IDS.join(",") &&
    SIMULATION_MODELS.every((model) =>
      /^[a-z][a-z0-9-]*$/.test(model.id) &&
      SIMULATION_RENDERER_IDS.includes(model.rendererId) &&
      getSimulationRendererById(model.rendererId)?.modelId === model.id &&
      Object.values(model.parameters).every((parameter) =>
        parameter.type === "number" &&
        parameter.label &&
        parameter.symbol &&
        parameter.unit &&
        Number.isFinite(parameter.hardMinimum) &&
        Number.isFinite(parameter.hardMaximum) &&
        parameter.hardMinimum < parameter.hardMaximum &&
        Number.isFinite(parameter.defaultStep) &&
        parameter.defaultStep > 0
      ) &&
      Object.values(model.views).length > 0 &&
      Object.values(model.views).every((view) =>
        typeof view.label === "string" && view.label.length > 0 &&
        typeof view.visual === "boolean"
      ) &&
      Object.values(model.views).some((view) => view.visual)
    ),
  "Los modelos tienen IDs únicos, renderer conocido, vistas declarativas y límites confiables."
);

check(
  SIMULATION_EXPERIENCE_SCHEMA_VERSION === "2.0.0" &&
    SIMULATION_EXPERIENCE_PACK_SCHEMA_VERSION === "2.0.0" &&
    duplicates(simulationExperienceIds).length === 0 &&
    SIMULATION_EXPERIENCES.every((experience) =>
      validateSimulationExperience(experience).valid &&
      getSimulationModelById(experience.modelId)
    ),
  "Las experiencias declarativas son únicas, versionadas y válidas para modelos registrados."
);

check(
  duplicates(simulationIds).length === 0 &&
    duplicates(simulationRoutes).length === 0 &&
    SIMULATIONS.every((simulation) =>
      /^[a-z][a-z0-9-]*$/.test(simulation.id) &&
      SIMULATION_CATEGORIES.includes(simulation.category) &&
      SIMULATION_STATUSES.includes(simulation.status) &&
      routes.has(normalizeRoute(simulation.route)) &&
      simulation.experience.id === getSimulationExperienceById(simulation.id)?.id &&
      simulation.title === simulation.experience.title &&
      simulation.description === simulation.experience.summary &&
      simulation.modelId === simulation.experience.modelId &&
      simulation.contexts === simulation.experience.contexts
    ),
  "El catálogo de simulaciones conserva IDs, taxonomías y rutas válidas."
);

check(
  getPublishedSimulations().map((simulation) => simulation.id).join(",") ===
    "kinematics-1d,projectile-2d" &&
    getSimulationsForCourseTopic(
      COURSE.id,
      UNIT_1.number,
      "movimiento-1d"
    )[0]?.id === "kinematics-1d" &&
    getSimulationsForCourseTopic(
      COURSE.id,
      UNIT_1.number,
      "ecuaciones-movimiento"
    )[0]?.id === "kinematics-1d" &&
    getSimulationsForCourseTopic(
      COURSE.id,
      UNIT_1.number,
      "movimiento-2d"
    )[0]?.id === "projectile-2d" &&
    SIMULATIONS.every((simulation) =>
      simulation.contexts.every((context) =>
        getCourseById(context.courseId) &&
        context.unit === UNIT_1.number &&
        context.topics.every((topic) => unit1TopicSet.has(topic))
      )
    ),
  "Las simulaciones 1D y de proyectil están publicadas en sus contextos académicos reales."
);

const projectileExperience = getSimulationExperienceById("projectile-2d");
const projectileParameters = projectileExperience
  ? Object.fromEntries(Object.entries(projectileExperience.parameters)
    .map(([key, config]) => [key, config.default]))
  : null;
const projectileSummary = projectileParameters
  ? getProjectileSummary(projectileParameters)
  : null;

check(
  projectileExperience?.presets.map((preset) => preset.id).join(",") ===
    "classic-range,low-angle,high-angle,horizontal-launch" &&
    projectileSummary &&
    Number.isFinite(projectileSummary.flightTime) &&
    Number.isFinite(projectileSummary.range) &&
    Number.isFinite(projectileSummary.maximumHeight) &&
    projectileSummary.range > 0 &&
    projectileSummary.maximumHeight > 0,
  "El proyectil conserva cuatro casos pedagógicos y magnitudes globales finitas."
);

const returnPreset = KINEMATICS_1D_PRESETS.find(
  (preset) => preset.id === "return"
);
const returnState = returnPreset
  ? getKinematicsState(returnPreset.parameters, returnPreset.parameters.T)
  : null;
const returnPoint = returnPreset
  ? getTurningPoint(returnPreset.parameters)
  : null;

check(
  KINEMATICS_1D_CONTROLS.map((control) =>
    `${control.key}:${control.minimum}:${control.maximum}`
  ).join("|") === "x0:-50:50|v0:-20:20|a:-10:10|T:1:20" &&
    KINEMATICS_1D_PRESETS.map((preset) => preset.id).join(",") ===
      "uniform,rest,return" &&
    returnPoint?.time === 3 &&
    returnPoint?.position === 5 &&
    returnState?.position === -4 &&
    returnState?.displacement === 0 &&
    returnState?.distance === 18,
  "Controles, presets y caso académico de retorno conservan sus valores aprobados."
);

check(
  ["position", "velocity", "acceleration"].every((quantity) => {
    const path = createKinematicsChartGeometry(
      returnPreset.parameters,
      quantity
    ).linePath;
    return path.startsWith("M ") && !/NaN|Infinity|undefined/.test(path);
  }),
  "Las tres curvas cinemáticas producen paths SVG completos y finitos."
);

const missingCourseRoutes = COURSE_NAV
  .map((item) => normalizeRoute(item.href))
  .filter((route) => !routes.has(route));

check(
  missingCourseRoutes.length === 0,
  missingCourseRoutes.length === 0
    ? "Todas las rutas de COURSE_NAV existen en src/pages."
    : `Faltan rutas de COURSE_NAV: ${missingCourseRoutes.join(", ")}`
);

check(
  routes.has("/recursos"),
  "La ruta anterior de Recursos se conserva como compatibilidad."
);

check(
  DEFAULT_LOCALE === "es" &&
    SUPPORTED_LOCALES.join(",") === "es,en" &&
    Object.values(LOCALES).every((locale) =>
      locale.htmlLang && locale.intlLocale && locale.label && locale.short
    ) &&
    getDictionaryKeys("es").join("|") === getDictionaryKeys("en").join("|") &&
    Object.values(UI_DICTIONARIES).every((dictionary) =>
      Object.values(dictionary).every((value) => typeof value === "string" && value.length > 0)
    ) &&
    t("en", "shell.menu") === "Menu",
  "El registro de locales y los diccionarios bilingües tienen paridad exacta."
);

const requiredLocalizedRoutes = Object.values(LOCALIZED_ROUTES)
  .flatMap((localized) => Object.values(localized))
  .filter(Boolean)
  .map(normalizeRoute);

check(
  requiredLocalizedRoutes.every((route) => routes.has(route)) &&
    !requiredLocalizedRoutes.some((route) => route.startsWith("/es/")) &&
    getRouteCounterpart("/simulaciones/cinematica-1d", "en") === "/en/simulations/kinematics-1d" &&
    getRouteCounterpart("/fisica-basica-1", "en") === null &&
    getLanguageMetadata("en", ROUTE_IDS.PROJECTILE_2D).canonicalPath === "/en/simulations/projectile-2d",
  "Las rutas bilingües, contrapartes y metadatos existen sin publicar un prefijo /es."
);

check(
  duplicates(NOTICES.map((notice) => notice.id)).length === 0,
  "Los avisos tienen identificadores únicos."
);

check(
  NOTICES.every((notice) => validateNotice(notice).valid),
  "Todos los avisos cumplen el contrato editorial canónico."
);

check(
  NOTICE_SCHEMA_VERSION === "3.0.0" &&
    NOTICE_PACK_SCHEMA_VERSION === "3.0.0" &&
    NOTICES.every((notice) => notice.schemaVersion === NOTICE_SCHEMA_VERSION) &&
    NOTICES.every((notice) => notice.locale === "es") &&
    NOTICES.every((notice) => validateContentScope(notice.scope).valid),
  "Avisos y paquetes usan el esquema 3.0.0 con ámbito y locale explícitos."
);

check(
  NOTICE_STATUSES.join(",") === "draft,review,published,archived" &&
    !NOTICE_STATUSES.includes("new") &&
    NOTICE_CATEGORIES.length === 5,
  "Avisos conserva cuatro estados explícitos y un conjunto pequeño de categorías."
);

check(
  getPublishedNotices().every((notice) => notice.status === "published") &&
    getPublishedNotices().length === NOTICES.filter((notice) => notice.status === "published").length,
  "La consulta pública de avisos excluye draft, review y archived."
);

const homepageNotices = getHomepageNotices(3);
const firstHomepageRegular = homepageNotices.findIndex((notice) => !notice.featured);

check(
  getGlobalNotices().every((notice) => notice.scope.type === "global") &&
    getCourseNotices(COURSE.id).every(
      (notice) => notice.scope.type === "course" && notice.scope.courseId === COURSE.id
    ) &&
    homepageNotices.length <= 3 &&
    homepageNotices.every((notice) => notice.status === "published") &&
    new Set(homepageNotices.map((notice) => notice.id)).size === homepageNotices.length &&
    (firstHomepageRegular < 0 || homepageNotices
      .slice(firstHomepageRegular)
      .every((notice) => !notice.featured)),
  "Las consultas separan ámbitos y la portada prioriza destacados sin duplicar ni exceder tres avisos."
);

const generalMigratedNotice = NOTICES.find(
  (notice) => notice.title === "¿Cómo sabemos cuanto mide un segundo?"
);
const courseMigratedNotice = NOTICES.find(
  (notice) => notice.title === "Universo Mecánico: la caída de los cuerpos"
);

check(
  generalMigratedNotice?.scope.type === "global" &&
    courseMigratedNotice?.scope.type === "course" &&
    courseMigratedNotice?.scope.courseId === COURSE.id &&
    courseMigratedNotice?.featured === true &&
    courseMigratedNotice?.status === "published",
  "Los dos avisos existentes conservan la migración editorial de ámbito aprobada."
);

check(
  duplicates(VIDEOS.map((video) => video.id)).length === 0,
  "Los videos tienen identificadores únicos."
);

check(
  resolveBasePath("/avisos", "/pagina-fisica/") ===
    "/pagina-fisica/avisos" &&
    resolveBasePath("/", "/pagina-fisica/") ===
      "/pagina-fisica/" &&
    resolveBasePath("/pagina-fisica/avisos", "/pagina-fisica/") ===
      "/pagina-fisica/avisos" &&
    resolveBasePath("#contenido", "/pagina-fisica/") ===
      "#contenido" &&
    resolveBasePath("https://example.com", "/pagina-fisica/") ===
      "https://example.com",
  "El resolvedor respeta la ruta base, las anclas y los enlaces externos."
);

// Los enlaces literales y los declarados en datos forman juntos el contrato navegable.
const sourceFiles = walkFiles(path.join(projectRoot, "src"))
  .filter((file) => file.endsWith(".astro"));

const sourceInternalLinks = sourceFiles.flatMap((file) => {
  const source = fs.readFileSync(file, "utf8");
  const literalLinks = [
    ...source.matchAll(/\bhref\s*=\s*["'](\/[^"']*)["']/g),
  ].map((match) => match[1]);
  const resolvedLinks = [
    ...source.matchAll(/\bwithBase\(\s*["'](\/[^"']*)["']\s*\)/g),
  ].map((match) => match[1]);

  return [...literalLinks, ...resolvedLinks];
});

// Un atributo literal desde `/` omite `base` y se rompe en una Project Page.
const unsafeRootAttributes = sourceFiles.flatMap((file) => {
  const source = fs.readFileSync(file, "utf8");
  return [
    ...source.matchAll(
      /\b(?:href|src)\s*=\s*(?:\{\s*)?["']\/(?!\/)[^"']*["'](?:\s*\})?/g
    ),
  ].map((match) =>
    `${path.relative(projectRoot, file)}: ${match[0]}`
  );
});

check(
  unsafeRootAttributes.length === 0,
  unsafeRootAttributes.length === 0
    ? "Las plantillas no contienen href o src literales que omitan BASE_URL."
    : `Atributos incompatibles con base: ${unsafeRootAttributes.join(", ")}`
);

const dataInternalLinks = [
  ...NAV.flatMap((item) => [
    item.href,
    ...(item.children ?? []).map((child) => child.href),
  ]),
  ...HOME_LINKS.map((item) => item.href),
  ...NOTICES.map((notice) => notice.href).filter(Boolean),
  ...ACADEMIC_UNITS.flatMap((unit) => [
    unit.route,
    unit.practiceRoute,
    ...unit.topics.map((topic) => topic.route),
  ]),
  ...SIMULATIONS.map((simulation) => simulation.route),
];

const internalLinks = [
  ...sourceInternalLinks,
  ...dataInternalLinks,
]
  .filter((href) => href.startsWith("/"))
  .map(normalizeRoute);

const missingInternalRoutes = [
  ...new Set(
    internalLinks.filter((route) => !routes.has(route))
  ),
];

check(
  missingInternalRoutes.length === 0,
  missingInternalRoutes.length === 0
    ? "Los enlaces internos principales apuntan a rutas existentes."
    : `Hay enlaces internos sin ruta: ${missingInternalRoutes.join(", ")}`
);

const logoFile = path.join(
  projectRoot,
  "public",
  SITE.logoPath.replace(/^\//, "")
);

check(
  fs.existsSync(logoFile),
  "El recurso gráfico principal existe en public."
);

// El tema es un contrato transversal: datos, arranque temprano, control y CSS.
const themeValues = THEME_PREFERENCES.map((option) => option.value);
check(
  themeValues.join(",") === "light,dark,system" &&
    duplicates(themeValues).length === 0,
  "Las preferencias de tema son claro, oscuro y sistema."
);

check(
  THEME_STORAGE_KEY === "aula-fisica:theme",
  "La preferencia visual utiliza una clave local estable."
);

const globalCssFile = path.join(projectRoot, "src/styles/global.css");
const globalCss = fs.readFileSync(globalCssFile, "utf8");
const lightThemeBlock = extractCssBlock(globalCss, ":root");
const darkThemeBlock = extractCssBlock(
  globalCss,
  ':root[data-theme="dark"]'
);
const lightTokens = cssHexTokens(lightThemeBlock);
const darkTokens = {
  ...lightTokens,
  ...cssHexTokens(darkThemeBlock),
};

const requiredThemeTokens = [
  "--bg",
  "--surface-subtle",
  "--surface",
  "--surface-raised",
  "--text",
  "--text-muted",
  "--border",
  "--border-strong",
  "--accent",
  "--accent-secondary",
  "--focus",
  "--home-hero-bg",
  "--home-hero-surface",
  "--home-hero-text",
  "--home-hero-text-soft",
  "--home-hero-muted",
  "--home-hero-border",
  "--home-hero-control-border",
  "--home-hero-mark-border",
  "--home-hero-accent",
  "--home-hero-accent-secondary",
  "--home-hero-on-accent",
  "--home-hero-grid",
  "--home-hero-glow-ring",
  "--home-hero-glow",
  "--home-hero-orb-opacity",
  "--home-hero-grid-opacity",
  "--content-canvas",
  "--formula-bg",
  "--bonus-bg",
  "--simulation-bg",
  "--chart-bg",
  "--chart-grid",
  "--chart-axis",
  "--chart-label",
  "--chart-reference",
  "--chart-vector",
  "--chart-annotation-halo",
  "--chart-area-opacity",
];

check(
  requiredThemeTokens.every((token) => lightThemeBlock.includes(`${token}:`)),
  "El tema claro define todos los tokens semánticos requeridos."
);

check(
  requiredThemeTokens.every((token) => darkThemeBlock.includes(`${token}:`)),
  "El tema oscuro redefine todos los tokens semánticos requeridos."
);

const colorTokenBlocksRemoved = globalCss
  .replace(`:root {${lightThemeBlock}\n}`, "")
  .replace(`:root[data-theme="dark"] {${darkThemeBlock}\n}`, "");

check(
  !/(?:#[0-9a-f]{3,8}\b|\brgba?\s*\()/i.test(colorTokenBlocksRemoved),
  "Los componentes CSS consumen tokens en lugar de colores literales."
);

check(
  !/(?:^|[\s,{])\.dark(?:[\s.:#\[\]>+~]|$)/m.test(globalCss),
  "El tema no depende de reglas individuales con la clase .dark."
);

check(
  lightTokens["--bg"] === THEME_COLORS.light &&
    darkTokens["--bg"] === THEME_COLORS.dark,
  "theme-color coincide con el fondo efectivo de cada tema."
);

const contrastPairs = [
  ["--text", "--bg", 4.5],
  ["--text-muted", "--bg", 4.5],
  ["--accent", "--bg", 4.5],
  ["--accent-secondary", "--bg", 4.5],
  ["--nav-active-text", "--nav-active-bg", 4.5],
  ["--status-info-text", "--status-info-bg", 4.5],
  ["--status-success-text", "--status-success-bg", 4.5],
  ["--status-warning-text", "--status-warning-bg", 4.5],
  ["--status-event-text", "--status-event-bg", 4.5],
  ["--focus", "--bg", 3],
  ["--border-strong", "--bg", 3],
  ["--text", "--surface", 4.5],
  ["--text-muted", "--surface", 4.5],
  ["--accent", "--surface", 4.5],
  ["--focus", "--surface", 3],
  ["--data-series-1", "--content-canvas", 3],
  ["--data-series-2", "--content-canvas", 3],
  ["--data-series-3", "--content-canvas", 3],
];

const contrastFailures = [
  ["claro", lightTokens],
  ["oscuro", darkTokens],
].flatMap(([theme, tokens]) =>
  contrastPairs
    .filter(([foreground, background, minimum]) =>
      !tokens[foreground] ||
      !tokens[background] ||
      contrastRatio(tokens[foreground], tokens[background]) < minimum
    )
    .map(([foreground, background, minimum]) =>
      `${theme}: ${foreground} sobre ${background} (< ${minimum}:1)`
    )
);

const brandContrastPairs = [
  ["--brand-text", "--brand-surface", 4.5],
  ["--brand-muted", "--brand-surface", 4.5],
  ["--brand-accent", "--brand-surface", 4.5],
  ["--brand-accent-secondary", "--brand-surface", 4.5],
  ["--brand-border-strong", "--brand-surface", 3],
];

contrastFailures.push(
  ...brandContrastPairs
    .filter(([foreground, background, minimum]) =>
      !lightTokens[foreground] ||
      !lightTokens[background] ||
      contrastRatio(
        lightTokens[foreground],
        lightTokens[background]
      ) < minimum
    )
    .map(([foreground, background, minimum]) =>
      `marca: ${foreground} sobre ${background} (< ${minimum}:1)`
    )
);

check(
  contrastFailures.length === 0,
  contrastFailures.length === 0
    ? "Los pares semánticos principales cumplen contraste WCAG."
    : `Contraste insuficiente: ${contrastFailures.join(", ")}`
);

check(
  lightTokens["--accent"] === "#94382f" &&
    lightTokens["--accent-secondary"] === "#87501f" &&
    darkTokens["--accent"] === "#47d5f4" &&
    darkTokens["--accent-secondary"] === "#65ef82",
  "Claro usa terracota/cobre y oscuro conserva su identidad cian/verde."
);

const allSourceFiles = walkFiles(path.join(projectRoot, "src"))
  .filter((file) => /\.(?:astro|js|css)$/.test(file));
const localStorageFiles = allSourceFiles
  .filter((file) => fs.readFileSync(file, "utf8").includes("localStorage"))
  .map((file) => path.relative(projectRoot, file));

check(
  localStorageFiles.length === 2 &&
    localStorageFiles.includes("src/layouts/BaseLayout.astro") &&
    localStorageFiles.includes("src/components/ThemeSelector.astro"),
  "localStorage se limita al arranque y al selector del tema."
);

const baseLayoutSource = fs.readFileSync(
  path.join(projectRoot, "src/layouts/BaseLayout.astro"),
  "utf8"
);
const themeSelectorSource = fs.readFileSync(
  path.join(projectRoot, "src/components/ThemeSelector.astro"),
  "utf8"
);

check(
  baseLayoutSource.includes("is:inline") &&
    baseLayoutSource.includes("prefers-color-scheme: dark") &&
    baseLayoutSource.includes("localStorage.getItem"),
  "El layout aplica la preferencia antes del primer render."
);

check(
  themeSelectorSource.includes('type="radio"') &&
    themeSelectorSource.includes('systemTheme.addEventListener("change"') &&
    themeSelectorSource.includes("localStorage.setItem") &&
    themeSelectorSource.includes('new CustomEvent("themechange"'),
  "El selector mantiene teclado, persistencia y respuesta al sistema."
);

// Contratos editoriales de contenido académico: estructura, taxonomía y rutas.
check(
  duplicates(ACADEMIC_UNITS.map((unit) => unit.number)).length === 0 &&
    duplicates(ACADEMIC_UNITS.map((unit) => unit.slug)).length === 0,
  "Las unidades académicas tienen números y slugs únicos."
);

check(
  ACADEMIC_UNITS.every((academicUnit) =>
    UNITS.some((courseUnit) => courseUnit.number === academicUnit.number)
  ),
  "Cada unidad académica desarrolla una unidad registrada en course.js."
);

const unit1TopicSlugs = UNIT_1.topics.map((topic) => topic.slug);
const unit1TopicRoutes = UNIT_1.topics.map((topic) => topic.route);
const unit1SectionIds = Object.values(UNIT_1_CONTENT)
  .flatMap((topic) => topic.sections.map((section) => section.id));

check(
  duplicates(unit1TopicSlugs).length === 0 &&
    duplicates(unit1TopicRoutes).length === 0,
  "Los temas de Unidad 1 tienen slugs y rutas únicas."
);

check(
  UNIT_1.topics.every((topic, index) => topic.order === index + 1),
  "Los temas de Unidad 1 conservan un orden consecutivo."
);

check(
  Object.keys(UNIT_1_CONTENT).sort().join("|") ===
    [...unit1TopicSlugs].sort().join("|"),
  "Cada tema de Unidad 1 tiene un único bloque de contenido."
);

check(
  Object.values(UNIT_1_CONTENT).every((topic) =>
    topic.sections.length > 0 &&
    topic.sections.every((section) =>
      section.essential?.length > 0 &&
      section.understand?.length > 0 &&
      section.deepen?.length > 0
    )
  ),
  "Cada sección contiene Esencial, Comprende y Profundiza."
);

check(
  UNIT_1.topics.find((topic) => topic.slug === "coordenadas-polares")
    ?.priority === "extension",
  "Coordenadas polares se conserva como ampliación de menor prioridad."
);

const referencedFormulaIds = Object.values(UNIT_1_CONTENT)
  .flatMap((topic) => topic.sections)
  .flatMap((section) => section.formulas ?? []);
const referencedVisualizationIds = Object.values(UNIT_1_CONTENT)
  .flatMap((topic) => topic.sections)
  .flatMap((section) => section.visualizations ?? [])
  .concat(
    UNIT_1_EXERCISES.map((exercise) => exercise.visualizationId).filter(Boolean)
  );

check(
  referencedFormulaIds.every((id) => UNIT_1_FORMULAS[id]) &&
    Object.entries(UNIT_1_FORMULAS).every(([id, item]) =>
      item.id === id &&
      item.mathml.includes("<math") &&
      item.mathml.includes("<semantics>") &&
      item.represents
    ),
  "Las fórmulas referenciadas existen y usan MathML con contexto."
);

const mathUtilitySource = fs.readFileSync(
  path.join(projectRoot, "src/utils/mathml.js"),
  "utf8"
);
const crossProductMathml = UNIT_1_FORMULAS["cross-product"].mathml;

check(
  ["magnitude", "absoluteValue", "norm"].every((name) =>
    mathUtilitySource.includes(`export const ${name}`)
  ) &&
    crossProductMathml.includes('fence="true"') &&
    crossProductMathml.includes('stretchy="true"') &&
    crossProductMathml.includes('form="prefix"') &&
    crossProductMathml.includes('form="postfix"'),
  "MathML usa delimitadores semánticos reutilizables para magnitud, valor absoluto y norma."
);

const visibleAcademicStrings = [
  ...Object.values(UNIT_1_CONTENT).flatMap((topic) =>
    topic.sections.flatMap((section) => [
      ...section.essential,
      ...section.understand,
      ...section.deepen,
      ...(section.explore ?? []),
      ...(section.checks ?? []).flatMap((item) => [
        item.question,
        ...(item.options ?? []),
        item.answer,
      ]),
    ])
  ),
  ...UNIT_1_EXERCISES.flatMap((exercise) => [
    exercise.prompt,
    ...exercise.hints,
    ...exercise.solution.map((item) => item.text),
  ]),
  ...UNIT_1_COMMON_ERRORS.flatMap((error) => [
    error.description,
    error.feedback,
  ]),
  ...Object.values(UNIT_1_FORMULAS).flatMap((item) => [
    item.represents,
    item.interpretation,
    item.dimensions,
    ...item.conditions,
    ...item.commonErrors,
    ...item.variables.flatMap((variable) => [
      variable.symbol,
      variable.meaning,
      variable.unit ?? "",
    ]),
  ]),
].filter(Boolean);

const keyboardMathPattern = /(?:\b[A-Za-z]+_[A-Za-záéíóú0-9/]+|\bsqrt\s*\(|\^[{(]?\d)/;
const unresolvedKeyboardMath = visibleAcademicStrings.filter((source) => {
  const presentation = presentUnit1RichText(source);
  const remainingText = typeof presentation === "string"
    ? presentation
    : presentation
      .filter((segment) => segment.type === "text")
      .map((segment) => segment.value)
      .join("");
  return keyboardMathPattern.test(remainingText);
});

check(
  UNIT_1_INLINE_MATH_TOKENS.length > 0 &&
    UNIT_1_INLINE_MATH_TOKENS.every((item) =>
      item.literal &&
      item.segment?.type === "math" &&
      item.segment.mathml.includes('<math') &&
      item.segment.mathml.includes('display="inline"') &&
      item.segment.mathml.includes("<semantics>")
    ) &&
    unresolvedKeyboardMath.length === 0,
  unresolvedKeyboardMath.length === 0
    ? "El contenido mixto usa un registro estructurado de MathML inline."
    : `Queda notación de teclado sin presentar: ${unresolvedKeyboardMath.join(" | ")}`
);

check(
  Object.values(UNIT_1_VISUALIZATIONS).every((visualization) =>
    (visualization.props?.vectors ?? []).every((item) =>
      !item.label.includes("_") || (item.mathLabel && item.ariaLabel)
    )
  ),
  "Las etiquetas SVG con subíndices tienen presentación y nombre accesible."
);

check(
  referencedVisualizationIds.every((id) => UNIT_1_VISUALIZATIONS[id]) &&
    Object.entries(UNIT_1_VISUALIZATIONS).every(([id, item]) =>
      item.id === id &&
      ["cartesian", "diagram"].includes(item.kind) &&
      item.explanation &&
      item.props?.title &&
      item.props?.description
    ),
  "Las visualizaciones tienen ID, explicación y descripción accesible."
);

const hasOnlyFiniteVisualNumbers = (value, visited = new WeakSet()) => {
  if (typeof value === "number") return Number.isFinite(value);
  if (!value || typeof value !== "object") return true;
  if (visited.has(value)) return true;
  visited.add(value);
  return Object.values(value).every((item) => hasOnlyFiniteVisualNumbers(item, visited));
};

check(
  Object.values(UNIT_1_VISUALIZATIONS).every((visualization) =>
    hasOnlyFiniteVisualNumbers(visualization)
  ),
  "Las especificaciones SVG no contienen NaN ni Infinity."
);

check(
  UNIT_1_EXERCISES.filter((exercise) => exercise.authorSource !== "teacher").length === 55 &&
    UNIT_1_EXERCISES.filter((exercise) => exercise.id.startsWith("u1-extra-")).length === 21 &&
    UNIT_1_EXERCISES.filter((exercise) => exercise.id.startsWith("u1-visual-")).length === 12,
  "El banco fijo contiene 55 ejercicios, incluidos 21 originales del bloque y las 12 visualizaciones centrales."
);

check(
  UNIT_1_EXERCISE_FAMILIES.length === 15 &&
    UNIT_1_EXERCISE_FAMILIES.every((family) =>
      validateFamilyDefinition(family).valid &&
      unit1TopicSlugs.includes(family.topic) &&
      UNIT_1_CONTENT[family.topic]?.sections.some((section) => section.id === family.subtopic)
    ) &&
    duplicates(UNIT_1_BANK_ITEMS.map((item) => item.id)).length === 0,
  "Las 15 familias parametrizadas son válidas y permanecen separadas de los ítems fijos."
);

check(
  duplicates(UNIT_1_EXERCISES.map((exercise) => exercise.id)).length === 0,
  "Los ejercicios de Unidad 1 tienen IDs únicos."
);

const invalidExerciseTaxonomy = UNIT_1_EXERCISES.filter((exercise) =>
  exercise.unit !== UNIT_1.number ||
  !unit1TopicSlugs.includes(exercise.topic) ||
  !UNIT_1_CONTENT[exercise.topic]?.sections
    .some((section) => section.id === exercise.subtopic) ||
  !exercise.modalities?.every((item) => EXERCISE_MODALITIES.includes(item)) ||
  !EXERCISE_TYPES.includes(exercise.type) ||
  !EXERCISE_REPRESENTATIONS.includes(exercise.representation) ||
  !EXERCISE_COGNITIVE_LEVELS.includes(exercise.cognitiveLevel) ||
  !EXERCISE_STATUSES.includes(exercise.status) ||
  !EXERCISE_PURPOSES.includes(exercise.purpose) ||
  !EXERCISE_EXPOSURES.includes(exercise.exposure) ||
  !Number.isInteger(exercise.difficulty) ||
  exercise.difficulty < 1 ||
  exercise.difficulty > 5
);

check(
  UNIT_1.status === "review" &&
    UNIT_1_EXERCISES.every((exercise) =>
      exercise.status === "review" ||
      (exercise.authorSource === "teacher" && exercise.status === "draft")
    ) &&
    UNIT_1_EXERCISES.every((exercise) =>
      exercise.purpose === "learning" && exercise.exposure === "public"
    ),
  "La Unidad 1 sigue en revisión y el banco actual es público de aprendizaje."
);

check(
  invalidExerciseTaxonomy.length === 0,
  invalidExerciseTaxonomy.length === 0
    ? "La taxonomía y dificultad de los ejercicios son válidas."
    : `Ejercicios con taxonomía inválida: ${invalidExerciseTaxonomy.map((item) => item.id).join(", ")}`
);

const invalidNumericalExercises = UNIT_1_EXERCISES.filter((exercise) =>
  exercise.type === "numerical" &&
  (!exercise.expectedUnit ||
    !Number.isFinite(exercise.tolerance) ||
    exercise.tolerance < 0)
);

check(
  invalidNumericalExercises.length === 0,
  invalidNumericalExercises.length === 0
    ? "Los ejercicios numéricos declaran unidad y tolerancia."
    : `Ejercicios numéricos incompletos: ${invalidNumericalExercises.map((item) => item.id).join(", ")}`
);

check(
  UNIT_1_EXERCISES.every((exercise) =>
    exercise.prompt &&
    exercise.objectives?.length > 0 &&
    exercise.solution?.length > 0 &&
    exercise.version >= 1
  ),
  "Cada ejercicio tiene enunciado, objetivos, solución y versión."
);

check(
  UNIT_1_EXERCISES.every((exercise) =>
    exercise.feedback?.correct &&
    exercise.feedback?.incorrect &&
    exercise.feedback?.commonErrors &&
    typeof exercise.feedback.commonErrors === "object" &&
    Object.keys(exercise.feedback.commonErrors).every((id) =>
      exercise.commonErrors.includes(id)
    )
  ),
  "El feedback admite respuesta correcta, incorrecta y errores específicos."
);

const bonusIds = BONUSES.map((bonus) => bonus.id);
const bonusSlugs = BONUSES.map((bonus) => bonus.slug);
const allUnit1Subtopics = Object.values(UNIT_1_CONTENT)
  .flatMap((content) => content.sections.map((section) => section.id));
const invalidBonusDefinitions = BONUSES.filter((bonus) => {
  const blueprintCount = bonus.blueprint?.reduce(
    (total, slot) => total + slot.count,
    0
  );
  const criteriaAreValid = bonus.blueprint?.every((slot) =>
    /^[a-z0-9-]+$/.test(slot.id) &&
    Number.isInteger(slot.count) &&
    slot.count > 0 &&
    (slot.criteria.topic ?? []).every((topic) => bonus.topics.includes(topic)) &&
    (slot.criteria.subtopic ?? []).every((subtopic) => allUnit1Subtopics.includes(subtopic)) &&
    (slot.criteria.type ?? []).every((type) => EXERCISE_TYPES.includes(type)) &&
    (slot.criteria.representation ?? []).every((representation) =>
      EXERCISE_REPRESENTATIONS.includes(representation)
    ) &&
    (slot.criteria.difficulty ?? []).every((difficulty) =>
      Number.isInteger(difficulty) && difficulty >= 1 && difficulty <= 5
    )
  );

  return !/^[a-z0-9-]+$/.test(bonus.id) ||
    !/^[a-z0-9-]+$/.test(bonus.slug) ||
    !Number.isInteger(bonus.version) ||
    bonus.version < 1 ||
    bonus.unit !== UNIT_1.number ||
    bonus.modality !== "bonus" ||
    bonus.purpose !== "learning" ||
    bonus.exposure !== "public" ||
    !BONUS_FEEDBACK_POLICIES.includes(bonus.feedbackPolicy) ||
    bonus.status !== "published" ||
    !bonus.title ||
    !bonus.description ||
    !Number.isInteger(bonus.questionCount) ||
    bonus.questionCount <= 0 ||
    !Number.isInteger(bonus.estimatedMinutes) ||
    bonus.estimatedMinutes <= 0 ||
    bonus.topics.some((topic) => !unit1TopicSlugs.includes(topic)) ||
    bonus.topics.includes("coordenadas-polares") ||
    blueprintCount !== bonus.questionCount ||
    !criteriaAreValid;
});

check(
  BONUSES.length === 4 &&
    duplicates(bonusIds).length === 0 &&
    duplicates(bonusSlugs).length === 0 &&
    invalidBonusDefinitions.length === 0,
  "Los cuatro Bonos tienen IDs, slugs, versiones, temas y blueprints válidos."
);

const validInteractionContent = (content) =>
  typeof content === "string"
    ? content.trim() !== ""
    : Array.isArray(content) && content.length > 0;
const invalidBonusInteractions = UNIT_1_EXERCISES.filter((exercise) => {
  if (!exercise.bonusEligible) {
    return exercise.status !== "draft" && exercise.interaction !== null;
  }
  const interaction = exercise.interaction;
  if (!interaction || !EXERCISE_INTERACTION_KINDS.includes(interaction.kind)) return true;
  if (!exercise.modalities.includes("bonus")) return true;

  if (interaction.kind === "singleChoice") {
    const optionIds = interaction.options?.map((option) => option.id) ?? [];
    return exercise.answer.kind !== "text" ||
      optionIds.length < 2 ||
      duplicates(optionIds).length > 0 ||
      !interaction.options.every((option) =>
        /^[a-z0-9-]+$/.test(option.id) && validInteractionContent(option.content)
      ) ||
      optionIds.filter((id) => id === interaction.correctOptionId).length !== 1;
  }

  if (interaction.kind === "number") {
    return exercise.answer.kind !== "number" ||
      !interaction.field?.id ||
      !interaction.field?.label;
  }

  const fieldIds = interaction.fields?.map((field) => field.id) ?? [];
  return exercise.answer.kind !== "values" ||
    fieldIds.length !== exercise.answer.values.length ||
    duplicates(fieldIds).length > 0 ||
    !interaction.fields.every((field) => field.id && field.label);
});

check(
  invalidBonusInteractions.length === 0 &&
    UNIT_1_EXERCISES
      .filter((exercise) =>
        exercise.status !== "draft" &&
        ["number", "values"].includes(exercise.answer.kind)
      )
      .every((exercise) => exercise.bonusEligible),
  "Los ejercicios elegibles declaran interacciones compatibles y todos los resultados numéricos claros son auto-calificables."
);

const bonusEligibleExercises = UNIT_1_EXERCISES.filter(
  (exercise) => exercise.authorSource !== "teacher" && exercise.bonusEligible
);

check(
  bonusEligibleExercises.length === 47 &&
    bonusEligibleExercises.every((exercise) =>
      EXERCISE_INTERACTION_KINDS.includes(exercise.interaction.kind)
    ),
  "El banco fijo expone 47 preguntas auto-calificables con interacciones aprobadas."
);

check(
  BONUSES.every((bonus) => canSatisfyBonusBlueprint(bonus, UNIT_1_BANK_ITEMS)),
  "Cada blueprint de Bonos puede satisfacerse sin repetir ejercicios."
);

const bonusBlueprintAudits = auditAllBonusBlueprints(BONUSES, UNIT_1_BANK_ITEMS);
check(
  bonusBlueprintAudits.every((audit) =>
    audit.errors.length === 0 && audit.warnings.length === 0
  ),
  "Cada slot de Bono alcanza el objetivo editorial de candidatos."
);

check(
  BONUSES.every((bonus) =>
    eligiblePoolForBonus(bonus, UNIT_1_BANK_ITEMS).every((exercise) =>
      exercise.purpose === "learning" &&
      exercise.exposure === "public" &&
      exercise.bonusEligible === true
    )
  ),
  "Ningún ejercicio measurement o restricted puede entrar a un Bono público."
);

const bonusUtilitySource = fs.readFileSync(
  path.join(projectRoot, "src/utils/bonus.js"),
  "utf8"
);
const bonusScriptSource = fs.readFileSync(
  path.join(projectRoot, "src/scripts/bonus.js"),
  "utf8"
);
const bonusAttemptSource = fs.readFileSync(
  path.join(projectRoot, "src/components/bonus/BonusAttempt.astro"),
  "utf8"
);
const bonusQuestionSource = fs.readFileSync(
  path.join(projectRoot, "src/components/bonus/BonusQuestion.astro"),
  "utf8"
);
const bonusRouteSource = fs.readFileSync(
  path.join(projectRoot, "src/pages/fisica-basica-1/bonos/[slug].astro"),
  "utf8"
);
const bonusStyleSource = fs.readFileSync(
  path.join(projectRoot, "src/styles/bonus.css"),
  "utf8"
);

check(
  bonusUtilitySource.includes("cryptoApi.getRandomValues") &&
    !bonusUtilitySource.includes("Math.random") &&
    !bonusUtilitySource.includes("eval(") &&
    !bonusUtilitySource.includes("Function("),
  "Bonos usa aleatoriedad criptográfica y no evalúa contenido como código."
);

check(
  !bonusScriptSource.includes("localStorage") &&
    !bonusScriptSource.includes("indexedDB") &&
    !bonusScriptSource.includes("beforeunload") &&
    !bonusScriptSource.includes("innerHTML") &&
    bonusScriptSource.includes("window.print()") &&
    bonusAttemptSource.includes('aria-live="polite"'),
  "El intento permanece en memoria, evita bloqueos de salida y anuncia acciones accesiblemente."
);

check(
  bonusQuestionSource.includes("<fieldset") &&
    bonusQuestionSource.includes("<legend") &&
    bonusQuestionSource.includes('inputmode="decimal"') &&
    bonusQuestionSource.includes("data-field-error") &&
    bonusRouteSource.includes("getStaticPaths") &&
    bonusRouteSource.includes("eligiblePoolForBonus"),
  "Las interacciones tienen semántica accesible y cada ruta carga solo su pool elegible."
);

check(
  bonusStyleSource.includes("@media screen") &&
    bonusStyleSource.includes(".bonus-app [hidden]") &&
    bonusStyleSource.includes("display: none !important") &&
    bonusStyleSource.includes("@media print"),
  "Los paneles ocultos no compiten con display en pantalla y la impresión conserva su flujo propio."
);

const invalidExerciseVisualizations = UNIT_1_EXERCISES.filter((exercise) => {
  const figureRequired = exercise.requiresVisualization === true ||
    ["graphical", "visual"].includes(exercise.representation);
  return figureRequired && !UNIT_1_VISUALIZATIONS[exercise.visualizationId];
});

check(
  invalidExerciseVisualizations.length === 0,
  invalidExerciseVisualizations.length === 0
    ? "Los ejercicios gráficos y visuales resuelven una figura del registro central."
    : `Ejercicios sin visualización válida: ${invalidExerciseVisualizations.map((item) => item.id).join(", ")}`
);

const commonErrorIds = UNIT_1_COMMON_ERRORS.map((error) => error.id);
check(
  duplicates(commonErrorIds).length === 0 &&
    UNIT_1_COMMON_ERRORS.every((error) =>
      error.description &&
      error.feedback &&
      unit1SectionIds.includes(error.subtopic)
    ),
  "Los errores conceptuales tienen IDs únicos y subtemas existentes."
);

check(
  UNIT_1_EXERCISES.every((exercise) =>
    exercise.commonErrors.every((id) => commonErrorIds.includes(id))
  ),
  "Los ejercicios solo referencian errores conceptuales existentes."
);

// La UX académica debe seguir derivándose de los contratos, no de copias visuales.
const learningMapSource = fs.readFileSync(
  path.join(projectRoot, "src/components/academic/UnitLearningMap.astro"),
  "utf8"
);
const unitIndexSource = fs.readFileSync(
  path.join(
    projectRoot,
    "src/pages/fisica-basica-1/unidades/unidad-1/index.astro"
  ),
  "utf8"
);

check(
  learningMapSource.includes("topics.map") &&
    learningMapSource.includes("<ol") &&
    learningMapSource.includes("<svg") &&
    learningMapSource.includes("withBase(topic.route)") &&
    UNIT_1.topics.every((topic) =>
      !learningMapSource.includes(topic.route)
    ) &&
    unitIndexSource.includes("topics={UNIT_1.topics}"),
  "El mapa deriva nodos y rutas de UNIT_1.topics sin duplicarlos."
);

const topicPageSource = fs.readFileSync(
  path.join(projectRoot, "src/components/academic/UnitTopicPage.astro"),
  "utf8"
);
const academicSectionSource = fs.readFileSync(
  path.join(projectRoot, "src/components/academic/AcademicSection.astro"),
  "utf8"
);

check(
  topicPageSource.includes("present={presentUnit1RichText}") &&
    academicSectionSource.includes("academic-layer--essential") &&
    academicSectionSource.includes("academic-layer--understand") &&
    academicSectionSource.includes("<details") &&
    globalCss.includes("details:not([open])>*:not(summary)") &&
    globalCss.includes("@media (prefers-reduced-motion: reduce)"),
  "La lectura mantiene lo esencial visible y revela disclosures al imprimir."
);

const openPracticeSource = fs.readFileSync(
  path.join(projectRoot, "src/components/academic/OpenPractice.astro"),
  "utf8"
);
const openPracticeScript = fs.readFileSync(
  path.join(projectRoot, "src/scripts/open-practice.js"),
  "utf8"
);

check(
  openPracticeSource.includes("exercises.map") &&
    openPracticeSource.includes("data-practice-new-batch") &&
    openPracticeSource.includes("data-practice-filter") &&
    openPracticeSource.includes("<noscript") &&
    !openPracticeSource.includes("<progress") &&
    openPracticeScript.includes("selectExerciseBatch") &&
    openPracticeScript.includes("window.location.hash") &&
    openPracticeScript.includes("history.pushState") &&
    openPracticeScript.includes('event.altKey') &&
    openPracticeScript.includes("new Set") &&
    !openPracticeScript.includes("localStorage") &&
    !openPracticeSource.includes(" de 34") &&
    !openPracticeSource.includes("porcentaje"),
  "Práctica abierta usa tandas, filtros, hash y sesión efímera sin progreso global."
);

// La biblioteca de gráficas conserva separadas matemática, SVG y presentación.
const chartUtilityFile = path.join(projectRoot, "src/utils/chart.js");
const chartComponentFile = path.join(
  projectRoot,
  "src/components/visualization/CartesianChart.astro"
);
const chartUtilitySource = fs.existsSync(chartUtilityFile)
  ? fs.readFileSync(chartUtilityFile, "utf8")
  : "";
const chartComponentSource = fs.existsSync(chartComponentFile)
  ? fs.readFileSync(chartComponentFile, "utf8")
  : "";

check(
  chartUtilitySource.includes("createCartesianTransform") &&
    chartUtilitySource.includes("createIsotropicTransform") &&
    chartUtilitySource.includes("clipSegmentToDomain") &&
    chartUtilitySource.includes("segmentsToSvgPath"),
  "La capa matemática expone transformación, recorte y geometría SVG."
);

const diagramComponentSource = fs.readFileSync(
  path.join(projectRoot, "src/components/visualization/AcademicDiagram.astro"),
  "utf8"
);

check(
  diagramComponentSource.includes('scaleMode = "isotropic"') &&
    diagramComponentSource.includes("createIsotropicTransform") &&
    diagramComponentSource.includes("labelOffset") &&
    diagramComponentSource.includes("labelAnchor") &&
    diagramComponentSource.includes("keepLabelVisible") &&
    chartComponentSource.includes("createCartesianTransform") &&
    !chartComponentSource.includes("createIsotropicTransform"),
  "Diagramas físicos usan escala isotrópica y las gráficas conservan escalas independientes."
);

check(
  diagramComponentSource.includes('role="img"') &&
    diagramComponentSource.includes("aria-label={title}") &&
    diagramComponentSource.includes("aria-describedby={descriptionId}") &&
    diagramComponentSource.includes("<desc") &&
    !diagramComponentSource.includes("<title"),
  "Los diagramas conservan nombre y descripción accesibles sin tooltip nativo."
);

check(
  chartComponentSource.includes("<svg") &&
    chartComponentSource.includes("viewBox=") &&
    chartComponentSource.includes('role="img"') &&
    chartComponentSource.includes("aria-label={title}") &&
    chartComponentSource.includes("aria-describedby={descriptionId}") &&
    !chartComponentSource.includes("<title") &&
    chartComponentSource.includes("<desc") &&
    chartComponentSource.includes("clipPath") &&
    !chartComponentSource.includes("<canvas"),
  "CartesianChart genera SVG responsive, descrito y recortado sin tooltip nativo."
);

check(
  chartComponentSource.includes("data-chart-id") &&
    chartComponentSource.includes("data-series-id") &&
    chartComponentSource.includes("data-x-min") &&
    chartComponentSource.includes("data-plot-width"),
  "Las gráficas exponen hooks estables para controles y sincronización futuros."
);

const chartSvgCssBlock = extractCssBlock(globalCss, ".academic-chart__svg");
const chartFigureCssBlock = extractCssBlock(globalCss, ".academic-chart");

check(
  chartSvgCssBlock.includes("width: 100%;") &&
    chartSvgCssBlock.includes("height: auto;") &&
    chartSvgCssBlock.includes("overflow: hidden;") &&
    chartFigureCssBlock.includes("overflow: clip;") &&
    globalCss.includes("var(--data-series-1)") &&
    globalCss.includes("var(--chart-bg)"),
  "La presentación SVG es responsive, recortada y consume tokens temáticos."
);

const publicNavigationRoutes = [
  ...NAV.flatMap((item) => [
    item.href,
    ...(item.children ?? []).map((child) => child.href),
  ]),
  ...COURSE_NAV.map((item) => item.href),
  ...HOME_LINKS.map((item) => item.href),
];

check(
  !routes.has("/dev/visualizaciones") &&
    !publicNavigationRoutes.some((route) => route.startsWith("/dev")),
  "No se publica ninguna ruta de desarrollo de visualizaciones."
);

const packageData = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
);
const packageNames = [
  ...Object.keys(packageData.dependencies ?? {}),
  ...Object.keys(packageData.devDependencies ?? {}),
];
const chartLibraries = ["chart.js", "plotly.js", "d3", "echarts", "highcharts"];

check(
  chartLibraries.every((library) => !packageNames.includes(library)),
  "La infraestructura de gráficas no incorpora dependencias de visualización."
);

const kinematicsComponentSource = fs.readFileSync(
  path.join(projectRoot, "src/components/simulations/KinematicsSimulation.astro"),
  "utf8"
);
const kinematicsScriptSource = fs.readFileSync(
  path.join(projectRoot, "src/scripts/kinematics-1d.js"),
  "utf8"
);
const kinematicsStyleSource = fs.readFileSync(
  path.join(projectRoot, "src/styles/kinematics-simulation.css"),
  "utf8"
);
const projectileComponentSource = fs.readFileSync(
  path.join(projectRoot, "src/components/simulations/ProjectileSimulation.astro"),
  "utf8"
);
const projectileScriptSource = fs.readFileSync(
  path.join(projectRoot, "src/scripts/projectile-2d.js"),
  "utf8"
);
const projectileRendererSource = fs.readFileSync(
  path.join(projectRoot, "src/scripts/p5-projectile-renderer.js"),
  "utf8"
);
const projectileStyleSource = fs.readFileSync(
  path.join(projectRoot, "src/styles/projectile-simulation.css"),
  "utf8"
);
const astroConfigSource = fs.readFileSync(
  path.join(projectRoot, "astro.config.mjs"),
  "utf8"
);
const simulationLabComponentSource = fs.readFileSync(
  path.join(projectRoot, "src/components/simulations/SimulationLab.astro"),
  "utf8"
);
const simulationLabScriptSource = fs.readFileSync(
  path.join(projectRoot, "src/scripts/simulation-lab.js"),
  "utf8"
);
const simulationLabStyleSource = fs.readFileSync(
  path.join(projectRoot, "src/styles/simulation-lab.css"),
  "utf8"
);
const simulationImporterSource = fs.readFileSync(
  path.join(projectRoot, "scripts/import-simulations.mjs"),
  "utf8"
);

check(
  kinematicsComponentSource.includes("data-kinematics-simulation") &&
    kinematicsComponentSource.includes("<noscript>") &&
    kinematicsComponentSource.includes('aria-live="polite"') &&
    kinematicsComponentSource.includes('data-time-scrubber') &&
    kinematicsComponentSource.includes('data-reading="direction"'),
  "La simulación ofrece raíz estable, controles, estado textual y alternativa sin JavaScript."
);

check(
  kinematicsScriptSource.includes("requestAnimationFrame") &&
    kinematicsScriptSource.includes("cancelAnimationFrame") &&
    kinematicsScriptSource.includes('visibilitychange') &&
    kinematicsScriptSource.includes('pagehide') &&
    kinematicsScriptSource.includes("createElementNS") &&
    kinematicsScriptSource.includes("replaceChildren") &&
    kinematicsScriptSource.includes("textContent") &&
    !/(?:innerHTML|outerHTML\s*=|fetch\(|localStorage|sessionStorage|indexedDB|eval\(|Function\()/.test(
      kinematicsScriptSource
    ),
  "El cliente anima y limpia frames sin red, persistencia ni inyección dinámica."
);

check(
  kinematicsStyleSource.includes("@media (max-width: 920px)") &&
    kinematicsStyleSource.includes("@media (max-width: 720px)") &&
    kinematicsStyleSource.includes("@media (max-width: 480px)") &&
    kinematicsStyleSource.includes("prefers-reduced-motion") &&
    !/(?:#[0-9a-f]{3,8}\b|\brgba?\s*\()/i.test(kinematicsStyleSource),
  "Los estilos de simulación son responsive, reducen movimiento y consumen tokens."
);

check(
  packageData.dependencies?.p5 === "2.3.1" &&
    projectileComponentSource.includes("data-projectile-simulation") &&
    projectileComponentSource.includes('role="img"') &&
    projectileComponentSource.includes("<noscript>") &&
    projectileComponentSource.includes('aria-live="polite"') &&
    projectileComponentSource.includes("data-time-scrubber") &&
    projectileComponentSource.includes('t(locale, "projectile.textAlternative")'),
  "El proyectil fija p5 local y conserva controles, lecturas y alternativa accesible."
);

check(
  projectileRendererSource.includes('import("p5")') &&
    projectileRendererSource.includes("new P5") &&
    projectileRendererSource.includes("p.noLoop()") &&
    projectileRendererSource.includes("new ResizeObserver") &&
    projectileRendererSource.includes('window.addEventListener("themechange"') &&
    projectileRendererSource.includes("instance.remove()") &&
    projectileRendererSource.includes("p.describe(") &&
    !projectileRendererSource.includes("WEBGL") &&
    !/(?:https?:\/\/|fetch\(|localStorage|sessionStorage|indexedDB|eval\(|Function\()/.test(
      projectileRendererSource
    ),
  "El renderer p5 usa modo instancia, Canvas 2D, carga local diferida y ciclo de vida completo."
);

check(
  projectileScriptSource.includes("requestAnimationFrame") &&
    projectileScriptSource.includes("cancelAnimationFrame") &&
    projectileScriptSource.includes("visibilitychange") &&
    projectileScriptSource.includes("pagehide") &&
    projectileScriptSource.includes("destroy()") &&
    !/(?:innerHTML|outerHTML\s*=|fetch\(|localStorage|sessionStorage|indexedDB|eval\(|Function\()/.test(
      projectileScriptSource
    ),
  "El runtime del proyectil mantiene un solo frame, se limpia y no persiste ni ejecuta entrada."
);

check(
  projectileStyleSource.includes("@media (max-width: 920px)") &&
    projectileStyleSource.includes("@media (max-width: 720px)") &&
    projectileStyleSource.includes("@media (max-width: 480px)") &&
    projectileStyleSource.includes("prefers-reduced-motion") &&
    !/(?:#[0-9a-f]{3,8}\b|\brgba?\s*\()/i.test(projectileStyleSource) &&
    astroConfigSource.includes("codeSplitting") &&
    astroConfigSource.includes('name: "p5"') &&
    astroConfigSource.includes("node_modules\\/p5\\/"),
  "El proyectil es responsive, usa tokens y aísla el chunk de p5 del resto del sitio."
);

check(
  simulationLabComponentSource.includes("<fieldset") &&
    simulationLabComponentSource.includes("<legend") &&
    simulationLabComponentSource.includes("data-preview-simulation") &&
    simulationLabComponentSource.includes("data-export-simulation") &&
    simulationLabComponentSource.includes("<SimulationExperienceRenderer") &&
    simulationLabComponentSource.includes("SIMULATION_MODELS.map") &&
    simulationLabComponentSource.includes("Object.entries(model.views)") &&
    simulationLabComponentSource.includes("UNIT_1.topics.map") &&
    simulationLabScriptSource.includes("mountSimulationExperienceRenderer") &&
    simulationLabScriptSource.includes("destroySimulationExperienceRenderer") &&
    simulationLabScriptSource.includes("textContent") &&
    simulationLabScriptSource.includes("replaceChildren") &&
    !/(?:innerHTML|outerHTML\s*=|fetch\(|localStorage|sessionStorage|indexedDB|eval\(|Function\()/.test(
      simulationLabScriptSource
    ),
  "El Laboratorio usa formularios accesibles, preview compartida y texto seguro en memoria."
);

check(
  simulationLabStyleSource.includes("@media (max-width: 1280px)") &&
    simulationLabStyleSource.includes("@media (max-width: 800px)") &&
    simulationLabStyleSource.includes("@media (max-width: 520px)") &&
    simulationLabStyleSource.includes("prefers-reduced-motion") &&
    simulationLabStyleSource.includes("[hidden]") &&
    !/(?:#[0-9a-f]{3,8}\b|\brgba?\s*\()/i.test(simulationLabStyleSource),
  "El Laboratorio responde a escritorio y móvil, respeta tema y estados ocultos."
);

check(
  packageData.scripts?.["import:simulations"] === "node scripts/import-simulations.mjs" &&
    simulationImporterSource.includes("mergeSimulationExperiencePack") &&
    simulationImporterSource.includes("estado review") &&
    simulationImporterSource.includes("Ninguna experiencia fue publicada automáticamente") &&
    !simulationImporterSource.includes("eval(") &&
    !simulationImporterSource.includes("Function("),
  "El importador acepta paquetes JSON, fuerza revisión y nunca publica automáticamente."
);

const reviewUtilitySource = fs.readFileSync(
  path.join(projectRoot, "src/utils/review.js"),
  "utf8"
);
const reviewScriptSource = fs.readFileSync(
  path.join(projectRoot, "src/scripts/review-center.js"),
  "utf8"
);
const reviewImportSource = fs.readFileSync(
  path.join(projectRoot, "src/components/review/ReviewImportPanel.astro"),
  "utf8"
);
const reviewStyleSource = fs.readFileSync(
  path.join(projectRoot, "src/styles/review-center.css"),
  "utf8"
);

const noticeEditorSource = fs.readFileSync(
  path.join(projectRoot, "src/scripts/notice-editor.js"),
  "utf8"
);
const noticeEditorComponent = fs.readFileSync(
  path.join(projectRoot, "src/components/notices/NoticeEditor.astro"),
  "utf8"
);
const noticeCardSource = fs.readFileSync(
  path.join(projectRoot, "src/components/NoticeCard.astro"),
  "utf8"
);
const generalNoticesPageSource = fs.readFileSync(
  path.join(projectRoot, "src/pages/avisos.astro"),
  "utf8"
);
const courseNoticesPageSource = fs.readFileSync(
  path.join(projectRoot, "src/pages/fisica-basica-1/avisos.astro"),
  "utf8"
);
const publicPageSource = pageFiles
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");

check(
  !noticeEditorSource.includes("innerHTML") &&
    !noticeEditorSource.includes("fetch(") &&
    !noticeEditorSource.includes("localStorage") &&
    noticeEditorSource.includes("textContent") &&
    noticeEditorComponent.includes('name="title"') &&
    noticeEditorComponent.includes('name="publishedAt"') &&
    noticeEditorComponent.includes('name="scope"') &&
    noticeEditorComponent.includes("COURSES.map") &&
    noticeEditorSource.includes("contentScopeLabel"),
  "El Editor de avisos usa texto seguro, no envía datos y expone campos accesibles."
);

check(
  generalNoticesPageSource.includes("getGlobalNotices") &&
    courseNoticesPageSource.includes("getCourseNotices(COURSE.id)") &&
    courseNoticesPageSource.includes('withBase("/avisos")') &&
    noticeCardSource.includes("href &&") &&
    noticeCardSource.includes('rel={external ? "noopener noreferrer"') &&
    !noticeCardSource.includes("!compact && href"),
  "Las rutas de avisos separan ámbitos y NoticeCard conserva enlaces seguros en modo compacto."
);

check(
  !publicPageSource.includes("Primera etapa de desarrollo") &&
    !publicPageSource.includes("El sitio se encuentra en construcción") &&
    !publicPageSource.includes("Sección en desarrollo"),
  "Las páginas públicas no conservan mensajes obsoletos del proceso de desarrollo."
);

check(
  !reviewScriptSource.includes("fetch(") &&
    !reviewScriptSource.includes("localStorage") &&
    !reviewScriptSource.includes("sessionStorage") &&
    !reviewScriptSource.includes("indexedDB") &&
    !reviewScriptSource.includes("innerHTML") &&
    !reviewUtilitySource.includes("eval(") &&
    !reviewUtilitySource.includes("Function("),
  "El Centro de revisión no envía, persiste ni evalúa contenido importado."
);

check(
  reviewImportSource.includes('type="file"') &&
    reviewImportSource.includes('accept=".json,application/json"') &&
    reviewImportSource.includes("multiple") &&
    reviewImportSource.includes('aria-live="polite"') &&
    reviewScriptSource.includes("file.text()") &&
    reviewScriptSource.includes("textContent") &&
    reviewScriptSource.includes("window.print()"),
  "La importación JSON múltiple y las salidas locales usan APIs nativas accesibles."
);

check(
  reviewStyleSource.includes("@media screen") &&
    reviewStyleSource.includes("[hidden]") &&
    reviewStyleSource.includes("@media print") &&
    reviewStyleSource.includes("prefers-reduced-motion"),
  "El Centro de revisión define estados ocultos, impresión y movimiento reducido."
);

if (failures.length > 0) {
  console.error(`\nValidación fallida: ${failures.length} problema(s).`);
  process.exitCode = 1;
} else {
  console.log("\nValidación interna completada sin errores.");
}
