import { DEFAULT_LOCALE, assertSupportedLocale } from "./config.js";

export const ROUTE_IDS = Object.freeze({
  HOME: "home",
  COURSE: "course",
  COURSE_NOTICES: "course.notices",
  COURSE_SCHEDULE: "course.schedule",
  COURSE_UNITS: "course.units",
  COURSE_PRACTICE: "course.practice",
  COURSE_BONUSES: "course.bonuses",
  COURSE_BONUS_TOOLS_VECTORS: "course.bonus.tools-vectors",
  COURSE_BONUS_KINEMATICS: "course.bonus.kinematics",
  COURSE_BONUS_MOTION_2D_CIRCULAR_RELATIVE: "course.bonus.motion-2d-circular-relative",
  COURSE_BONUS_UNIT_1_REVIEW: "course.bonus.unit-1-review",
  COURSE_VIDEOS: "course.videos",
  COURSE_ASSESSMENT: "course.assessment",
  COURSE_RESOURCES: "course.resources",
  COURSE_PARTICIPATE: "course.participate",
  COURSE_TOOLS: "course.tools",
  COURSE_TOOL_QUESTION_BANK: "course.tool.question-bank",
  COURSE_TOOL_NOTICES: "course.tool.notices",
  COURSE_TOOL_SIMULATION_LAB: "course.tool.simulation-lab",
  COURSE_TOOL_REVIEW: "course.tool.review",
  COURSE_TOOL_RESULTS: "course.tool.results",
  COURSE_UNIT_1: "course.unit1",
  COURSE_UNIT_1_PRACTICE: "course.unit1.practice",
  COURSE_UNIT_1_TOPIC_TOOLS: "course.unit1.topic.herramientas",
  COURSE_UNIT_1_TOPIC_VECTORS: "course.unit1.topic.vectores",
  COURSE_UNIT_1_TOPIC_MOTION_1D: "course.unit1.topic.movimiento-1d",
  COURSE_UNIT_1_TOPIC_EQUATIONS: "course.unit1.topic.ecuaciones-movimiento",
  COURSE_UNIT_1_TOPIC_MOTION_2D: "course.unit1.topic.movimiento-2d",
  COURSE_UNIT_1_TOPIC_CIRCULAR_RELATIVE: "course.unit1.topic.circular-relativo",
  COURSE_UNIT_1_TOPIC_POLAR: "course.unit1.topic.coordenadas-polares",
  SIMULATIONS: "simulations",
  KINEMATICS_1D: "simulation.kinematics-1d",
  PROJECTILE_2D: "simulation.projectile-2d",
  NOTICES: "notices",
});

export const LOCALIZED_ROUTES = Object.freeze({
  [ROUTE_IDS.HOME]: Object.freeze({ es: "/", en: "/en/" }),
  [ROUTE_IDS.COURSE]: Object.freeze({ es: "/fisica-basica-1", en: "/en/basic-physics-1" }),
  [ROUTE_IDS.COURSE_NOTICES]: Object.freeze({ es: "/fisica-basica-1/avisos", en: "/en/basic-physics-1/notices" }),
  [ROUTE_IDS.COURSE_SCHEDULE]: Object.freeze({ es: "/fisica-basica-1/cronograma", en: "/en/basic-physics-1/schedule" }),
  [ROUTE_IDS.COURSE_UNITS]: Object.freeze({ es: "/fisica-basica-1/unidades", en: "/en/basic-physics-1/units" }),
  [ROUTE_IDS.COURSE_PRACTICE]: Object.freeze({ es: "/fisica-basica-1/ejercicios", en: "/en/basic-physics-1/practice" }),
  [ROUTE_IDS.COURSE_BONUSES]: Object.freeze({ es: "/fisica-basica-1/bonos", en: "/en/basic-physics-1/bonuses" }),
  [ROUTE_IDS.COURSE_BONUS_TOOLS_VECTORS]: Object.freeze({ es: "/fisica-basica-1/bonos/herramientas-vectores", en: "/en/basic-physics-1/bonuses/herramientas-vectores" }),
  [ROUTE_IDS.COURSE_BONUS_KINEMATICS]: Object.freeze({ es: "/fisica-basica-1/bonos/cinematica", en: "/en/basic-physics-1/bonuses/cinematica" }),
  [ROUTE_IDS.COURSE_BONUS_MOTION_2D_CIRCULAR_RELATIVE]: Object.freeze({ es: "/fisica-basica-1/bonos/movimiento-2d-circular-relativo", en: "/en/basic-physics-1/bonuses/movimiento-2d-circular-relativo" }),
  [ROUTE_IDS.COURSE_BONUS_UNIT_1_REVIEW]: Object.freeze({ es: "/fisica-basica-1/bonos/repaso-unidad-1", en: "/en/basic-physics-1/bonuses/repaso-unidad-1" }),
  [ROUTE_IDS.COURSE_VIDEOS]: Object.freeze({ es: "/fisica-basica-1/videos", en: "/en/basic-physics-1/videos" }),
  [ROUTE_IDS.COURSE_ASSESSMENT]: Object.freeze({ es: "/fisica-basica-1/evaluacion", en: "/en/basic-physics-1/assessment" }),
  [ROUTE_IDS.COURSE_RESOURCES]: Object.freeze({ es: "/fisica-basica-1/recursos", en: "/en/basic-physics-1/resources" }),
  [ROUTE_IDS.COURSE_PARTICIPATE]: Object.freeze({ es: "/fisica-basica-1/participa", en: "/en/basic-physics-1/participate" }),
  [ROUTE_IDS.COURSE_TOOLS]: Object.freeze({ es: "/fisica-basica-1/herramientas", en: "/en/basic-physics-1/tools" }),
  [ROUTE_IDS.COURSE_TOOL_QUESTION_BANK]: Object.freeze({ es: "/fisica-basica-1/herramientas/banco", en: "/en/basic-physics-1/tools/question-bank" }),
  [ROUTE_IDS.COURSE_TOOL_NOTICES]: Object.freeze({ es: "/fisica-basica-1/herramientas/avisos", en: "/en/basic-physics-1/tools/notices" }),
  [ROUTE_IDS.COURSE_TOOL_SIMULATION_LAB]: Object.freeze({ es: "/fisica-basica-1/herramientas/simulaciones", en: "/en/basic-physics-1/tools/simulation-lab" }),
  [ROUTE_IDS.COURSE_TOOL_REVIEW]: Object.freeze({ es: "/fisica-basica-1/herramientas/revision", en: "/en/basic-physics-1/tools/review" }),
  [ROUTE_IDS.COURSE_TOOL_RESULTS]: Object.freeze({ es: "/fisica-basica-1/herramientas/notas", en: "/en/basic-physics-1/tools/results" }),
  [ROUTE_IDS.COURSE_UNIT_1]: Object.freeze({ es: "/fisica-basica-1/unidades/unidad-1", en: "/en/basic-physics-1/units/unit-1" }),
  [ROUTE_IDS.COURSE_UNIT_1_PRACTICE]: Object.freeze({ es: "/fisica-basica-1/ejercicios/unidad-1", en: "/en/basic-physics-1/practice/unit-1" }),
  [ROUTE_IDS.COURSE_UNIT_1_TOPIC_TOOLS]: Object.freeze({ es: "/fisica-basica-1/unidades/unidad-1/herramientas", en: "/en/basic-physics-1/units/unit-1/measurement-tools" }),
  [ROUTE_IDS.COURSE_UNIT_1_TOPIC_VECTORS]: Object.freeze({ es: "/fisica-basica-1/unidades/unidad-1/vectores", en: "/en/basic-physics-1/units/unit-1/vectors" }),
  [ROUTE_IDS.COURSE_UNIT_1_TOPIC_MOTION_1D]: Object.freeze({ es: "/fisica-basica-1/unidades/unidad-1/movimiento-1d", en: "/en/basic-physics-1/units/unit-1/motion-1d" }),
  [ROUTE_IDS.COURSE_UNIT_1_TOPIC_EQUATIONS]: Object.freeze({ es: "/fisica-basica-1/unidades/unidad-1/ecuaciones-movimiento", en: "/en/basic-physics-1/units/unit-1/equations-of-motion" }),
  [ROUTE_IDS.COURSE_UNIT_1_TOPIC_MOTION_2D]: Object.freeze({ es: "/fisica-basica-1/unidades/unidad-1/movimiento-2d", en: "/en/basic-physics-1/units/unit-1/motion-2d" }),
  [ROUTE_IDS.COURSE_UNIT_1_TOPIC_CIRCULAR_RELATIVE]: Object.freeze({ es: "/fisica-basica-1/unidades/unidad-1/circular-relativo", en: "/en/basic-physics-1/units/unit-1/circular-relative-motion" }),
  [ROUTE_IDS.COURSE_UNIT_1_TOPIC_POLAR]: Object.freeze({ es: "/fisica-basica-1/unidades/unidad-1/coordenadas-polares", en: "/en/basic-physics-1/units/unit-1/polar-coordinates" }),
  [ROUTE_IDS.SIMULATIONS]: Object.freeze({ es: "/simulaciones", en: "/en/simulations" }),
  [ROUTE_IDS.KINEMATICS_1D]: Object.freeze({ es: "/simulaciones/cinematica-1d", en: "/en/simulations/kinematics-1d" }),
  [ROUTE_IDS.PROJECTILE_2D]: Object.freeze({ es: "/simulaciones/proyectil-2d", en: "/en/simulations/projectile-2d" }),
  [ROUTE_IDS.NOTICES]: Object.freeze({ es: "/avisos", en: "/en/notices" }),
});

const normalizePath = (path) => {
  const pathname = String(path ?? "/").split(/[?#]/, 1)[0] || "/";
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
};

export const getLocalizedPath = (routeId, locale) => {
  assertSupportedLocale(locale);
  if (!Object.hasOwn(LOCALIZED_ROUTES, routeId)) {
    throw new RangeError(`Unknown route id: ${String(routeId)}`);
  }
  return LOCALIZED_ROUTES[routeId][locale] ?? null;
};

export const getRouteIdFromPath = (path) => {
  const normalized = normalizePath(path);
  return Object.entries(LOCALIZED_ROUTES).find(([, routes]) =>
    Object.values(routes).some((candidate) => candidate && normalizePath(candidate) === normalized)
  )?.[0] ?? null;
};

export const getRouteCounterpart = (path, targetLocale) => {
  assertSupportedLocale(targetLocale);
  const routeId = getRouteIdFromPath(path);
  return routeId ? getLocalizedPath(routeId, targetLocale) : null;
};

export const getRouteAlternates = (routeId) => {
  if (!Object.hasOwn(LOCALIZED_ROUTES, routeId)) return [];
  return Object.entries(LOCALIZED_ROUTES[routeId])
    .filter(([, path]) => Boolean(path))
    .map(([locale, path]) => ({ locale, path }));
};

export const getXDefaultPath = (routeId) =>
  getLocalizedPath(routeId, DEFAULT_LOCALE);
