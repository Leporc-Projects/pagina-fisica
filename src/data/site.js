// Configuración editorial y navegación general del sitio.
// Los datos académicos se importan desde course.js en lugar de duplicarse aquí.

import { COURSE, COURSE_NAV } from "./course.js";

export const SITE = {
  name: "Papilla's Physics",
  teacherName: "César Barrero",
  tagline: "Física para comprender, practicar y conectar ideas.",
  description:
    "Sitio docente personal con materiales, ejercicios y recursos para el aprendizaje de la física.",
  logoPath: "/images/leporc-projects.jpg",
  lang: "es",
  locale: "es-CO",
};

/**
 * Navegación principal consumida por Header y por la validación de enlaces.
 * La rama del curso reutiliza COURSE_NAV para conservar un único contrato.
 */
export const NAV = [
  {
    label: "Inicio",
    href: "/",
  },
  {
    label: COURSE.name,
    href: "/fisica-basica-1",
    children: COURSE_NAV,
  },
  {
    label: "Simulaciones",
    href: "/simulaciones",
  },
  {
    label: "Recursos",
    href: "/recursos",
  },
  {
    label: "Avisos",
    href: "/avisos",
  },
];

/** Accesos editoriales de la portada; todos deben apuntar a rutas internas. */
export const HOME_LINKS = [
  {
    number: "01",
    label: COURSE.name,
    description: "Información, unidades y materiales del curso activo.",
    href: "/fisica-basica-1",
  },
  {
    number: "02",
    label: "Ejercicios",
    description: "Práctica conceptual y resolución progresiva de problemas.",
    href: "/fisica-basica-1/ejercicios",
  },
  {
    number: "03",
    label: "Simulaciones",
    description: "Experiencias interactivas para explorar modelos físicos.",
    href: "/simulaciones",
  },
  {
    number: "04",
    label: "Recursos",
    description: "Guías, referencias, videos y enlaces seleccionados.",
    href: "/recursos",
  },
];

/**
 * Taxonomía visual del futuro catálogo de simulaciones.
 * No equivale a UNITS ni debe utilizarse como fuente académica del curso.
 */
export const SIM_CATEGORIES = [
  "Vectores",
  "Cinemática",
  "Dinámica",
  "Trabajo y energía",
  "Momento lineal",
  "Rotación",
  "Gravitación",
  "Oscilaciones",
];
