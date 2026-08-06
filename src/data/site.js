// Información central del sitio.
// Los nombres, enlaces y textos generales se cambian desde este archivo.

import { COURSE_NAV } from "./course.js";

export const SITE = {
  name: "Papilla's Physics",
  teacherName: "César Barrero",
  tagline: "Física para comprender, practicar y conectar ideas.",
  description:
    "Sitio docente personal con materiales, ejercicios y recursos para el aprendizaje de la física.",
  currentCourse: "Física Básica I",
  logoPath: "/images/leporc-projects.jpg",
  lang: "es",
  locale: "es-CO",
};

export const NAV = [
  {
    label: "Inicio",
    href: "/",
  },
  {
    label: "Física Básica I",
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

export const HOME_LINKS = [
  {
    number: "01",
    label: "Física Básica I",
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

export const RECENT_NOTICES = [
  {
    date: "2026-08-06",
    category: "Sitio",
    title: "Primera etapa de desarrollo",
    text: "El sitio se encuentra en construcción. Los contenidos del curso se incorporarán y revisarán progresivamente.",
  },
];

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
