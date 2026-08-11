import { DEFAULT_LOCALE, assertSupportedLocale } from "./config.js";

export const ROUTE_IDS = Object.freeze({
  HOME: "home",
  COURSE: "course",
  SIMULATIONS: "simulations",
  KINEMATICS_1D: "simulation.kinematics-1d",
  PROJECTILE_2D: "simulation.projectile-2d",
  NOTICES: "notices",
});

export const LOCALIZED_ROUTES = Object.freeze({
  [ROUTE_IDS.HOME]: Object.freeze({ es: "/", en: "/en/" }),
  [ROUTE_IDS.COURSE]: Object.freeze({ es: "/fisica-basica-1", en: null }),
  [ROUTE_IDS.SIMULATIONS]: Object.freeze({ es: "/simulaciones", en: "/en/simulations" }),
  [ROUTE_IDS.KINEMATICS_1D]: Object.freeze({ es: "/simulaciones/cinematica-1d", en: "/en/simulations/kinematics-1d" }),
  [ROUTE_IDS.PROJECTILE_2D]: Object.freeze({ es: "/simulaciones/proyectil-2d", en: "/en/simulations/projectile-2d" }),
  [ROUTE_IDS.NOTICES]: Object.freeze({ es: "/avisos", en: null }),
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
