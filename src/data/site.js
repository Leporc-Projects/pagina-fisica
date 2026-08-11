// Configuración editorial y navegación general del sitio.
// Los datos académicos se importan desde course.js en lugar de duplicarse aquí.

import { COURSE, COURSE_NAV } from "./course.js";
import { ROUTE_IDS, getLocalizedPath } from "../i18n/routes.js";

export const SITE = {
  name: "Aula Física",
  teacherName: "César Barrero",
  // Ruta lógica: BaseLayout, Header y la portada la resuelven con withBase().
  logoPath: "/images/leporc-projects.jpg",
};

export const getNavigation = (locale) => [
  {
    labelKey: "nav.home",
    href: getLocalizedPath(ROUTE_IDS.HOME, locale),
  },
  {
    labelKey: "nav.course",
    href: getLocalizedPath(ROUTE_IDS.COURSE, locale),
    disabled: !getLocalizedPath(ROUTE_IDS.COURSE, locale),
    children: locale === "es"
      ? COURSE_NAV.filter((item) => item.includeInGlobalMenu !== false)
      : undefined,
  },
  {
    labelKey: "nav.simulations",
    href: getLocalizedPath(ROUTE_IDS.SIMULATIONS, locale),
  },
  {
    labelKey: "nav.notices",
    href: getLocalizedPath(ROUTE_IDS.NOTICES, locale),
    disabled: !getLocalizedPath(ROUTE_IDS.NOTICES, locale),
  },
];

/**
 * Navegación principal consumida por Header y por la validación de enlaces.
 * La rama del curso reutiliza COURSE_NAV para conservar un único contrato.
 * Los destinos son rutas lógicas; Header aplica el BASE_URL al renderizarlos.
 */
export const NAV = [
  {
    label: "Inicio",
    href: "/",
  },
  {
    label: COURSE.name,
    href: "/fisica-basica-1",
    children: COURSE_NAV.filter(
      (item) => item.includeInGlobalMenu !== false
    ),
  },
  {
    label: "Simulaciones",
    href: "/simulaciones",
  },
  {
    label: "Avisos",
    href: "/avisos",
  },
];

/**
 * Accesos editoriales de la portada. Todos apuntan a rutas lógicas internas;
 * index.astro añade el BASE_URL mediante withBase().
 */
export const HOME_LINKS = [
  {
    number: "01",
    label: COURSE.name,
    description: "Información, unidades y materiales del curso activo.",
    href: "/fisica-basica-1",
  },
  {
    number: "02",
    label: "Simulaciones",
    description: "Experiencias interactivas para explorar modelos físicos.",
    href: "/simulaciones",
  },
];
