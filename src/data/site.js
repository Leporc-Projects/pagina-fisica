// Información central del sitio.
// Los nombres, enlaces y textos generales se cambian desde este archivo.

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
    children: [
      { label: "Curso", href: "/fisica-basica-1" },
      { label: "Cronograma", disabled: true },
      { label: "Unidades y apuntes", disabled: true },
      { label: "Ejercicios y tutorías", disabled: true },
      { label: "Videos", disabled: true },
      { label: "Evaluación y notas", disabled: true },
    ],
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
    href: "/#avisos",
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
    href: "/actividades",
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

// Estructura general del curso. Se ampliará en el bloque académico.
export const UNITS = [
  { number: 1, title: "Vectores y cinemática", status: "pendiente" },
  { number: 2, title: "Leyes de Newton", status: "pendiente" },
  {
    number: 3,
    title: "Fuerzas y ecuaciones de movimiento",
    status: "pendiente",
  },
  { number: 4, title: "Trabajo y energía", status: "pendiente" },
  {
    number: 5,
    title: "Momento lineal y sistemas de partículas",
    status: "pendiente",
  },
  {
    number: 6,
    title: "Rotación y momento angular",
    status: "pendiente",
  },
  {
    number: 7,
    title: "Gravitación y movimiento periódico",
    status: "pendiente",
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