// Datos centralizados del sitio. Modifica aquí para actualizar todo el proyecto.

export const SITE = {
  name: "Espacio de Física",
  tagline: "Recursos y materiales para el aprendizaje de la física universitaria",
  currentCourse: "Física Básica I",
  lang: "es",
};

export const NAV = [
  { label: "Inicio",             href: "/",               icon: "🏠" },
  { label: "Física Básica I",    href: "/fisica-basica-1", icon: "📐" },
  { label: "Recursos",           href: "/recursos",        icon: "📚" },
  { label: "Simulaciones",       href: "/simulaciones",    icon: "🔬" },
  { label: "Actividades",        href: "/actividades",     icon: "✏️" },
  { label: "Herramientas",       href: "/herramientas",    icon: "🛠️" },
];

export const RECENT_NOTICES = [
  {
    date: "2025-08-05",
    text: "Sitio en construcción. Se irá completando conforme avance el semestre.",
  },
];

// Unidades provisionales de Física Básica I
export const UNITS = [
  { number: 1, title: "Medición y vectores",      status: "pendiente" },
  { number: 2, title: "Cinemática",               status: "pendiente" },
  { number: 3, title: "Dinámica de la partícula", status: "pendiente" },
  { number: 4, title: "Trabajo y energía",        status: "pendiente" },
  { number: 5, title: "Impulso y momento lineal", status: "pendiente" },
  { number: 6, title: "Rotación",                 status: "pendiente" },
];

export const SIM_CATEGORIES = [
  "Cinemática",
  "Dinámica",
  "Energía",
  "Momento",
  "Rotación",
  "Oscilaciones",
  "Ondas",
  "Electromagnetismo",
  "Termodinámica",
];
