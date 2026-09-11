// Contrato académico central de Física Básica I. Las páginas consumen estas
// exportaciones para no repetir información ni introducir versiones contradictorias.

import { COURSE_IDS, getCourseById } from "./courses.js";

const courseIdentity = getCourseById(COURSE_IDS.PHYSICS_BASIC_1);

if (!courseIdentity) {
    throw new Error("Física Básica I no está registrada en src/data/courses.js.");
}

/**
 * Identidad y propósito académico estable del curso.
 * No incorpora semestre, grupo, evaluación ni carga administrativa.
 */
export const COURSE = {
    ...courseIdentity,
    // Wire compatibility for Mini Quiz 1.x and Participation 1.x exports.
    // This value is not rendered in current public course chrome.
    code: "0302270",
    summary:
        "Curso introductorio de mecánica newtoniana orientado al estudio del movimiento, las fuerzas y las leyes de conservación.",

    purpose:
        "Desarrollar una comprensión sólida de las leyes fundamentales de la mecánica newtoniana y fortalecer la capacidad de analizar y resolver problemas físicos mediante cálculo elemental, geometría vectorial y razonamiento basado en primeros principios.",

    methodology: [
        "Exposición argumentativa de los conceptos fundamentales.",
        "Resolución y discusión de problemas.",
        "Trabajo de taller y retroalimentación.",
        "Uso de videos, simulaciones y demostraciones cuando aporten al análisis físico.",
        "Estudio independiente apoyado en el texto guía y los materiales del curso.",
    ],

    learningGoals: [
        "Comprender las tres leyes de Newton y la ley de gravitación universal.",
        "Aplicar correctamente la segunda ley de Newton.",
        "Formular y resolver ecuaciones de movimiento.",
        "Analizar sistemas de partículas.",
        "Comprender las leyes de conservación de la energía y del momento.",
        "Aplicar las leyes de conservación en problemas mecánicos.",
    ],
};

/**
 * Índice canónico de rutas internas del curso.
 * CourseNav consume la lista completa y la navegación global puede omitir
 * entradas marcadas para permanecer dentro del curso. validate.mjs comprueba
 * que no haya rutas duplicadas y que cada destino exista. Se guardan rutas
 * lógicas: los componentes incorporan el BASE_URL al renderizar.
 */
export const COURSE_NAV = [
    {
        label: "Unidades y apuntes",
        href: "/fisica-basica-1/unidades",
    },
    {
        label: "Ejercicios y tutorías",
        href: "/fisica-basica-1/ejercicios",
    },
    {
        label: "Mini quices",
        href: "/fisica-basica-1/mini-quices",
    },
    {
        label: "Videos",
        href: "/fisica-basica-1/videos",
    },
    {
        label: "Recursos",
        href: "/fisica-basica-1/recursos",
    },
    {
        label: "Participa",
        href: "/fisica-basica-1/participa",
        // Es propia del curso, pero no forma parte del menú global del sitio.
        includeInGlobalMenu: false,
    },
];

/**
 * Organización temática vigente en siete unidades.
 * La consumen el curso, el catálogo de unidades, ejercicios y videos. No debe
 * reorganizarse por inferencia: cualquier diferencia entre fuentes requiere
 * revisión académica con el profesor.
 */
export const UNITS = [
    {
        number: 1,
        title: "Vectores y cinemática",
        chapters: "Capítulos 1, 2 y 3",
        description:
            "Fundamentos de medición, álgebra vectorial y descripción del movimiento en una, dos y tres dimensiones.",
        topics: [
            "Unidades, cantidades físicas y análisis dimensional",
            "Cifras significativas y órdenes de magnitud",
            "Vectores, componentes y vectores unitarios",
            "Movimiento rectilíneo",
            "Movimiento con aceleración constante",
            "Caída libre",
            "Movimiento de proyectiles",
            "Movimiento circular",
            "Velocidad relativa",
        ],
    },
    {
        number: 2,
        title: "Leyes de Newton",
        chapters: "Capítulo 4",
        description:
            "Estudio de las interacciones mecánicas y de las leyes que relacionan fuerza, masa y movimiento.",
        topics: [
            "Fuerza e interacciones",
            "Primera ley de Newton",
            "Segunda ley de Newton",
            "Masa y peso",
            "Tercera ley de Newton",
            "Diagramas de cuerpo libre",
            "Sistemas de referencia inerciales",
        ],
    },
    {
        number: 3,
        title: "Fuerzas y ecuaciones de movimiento",
        chapters: "Capítulo 5",
        description:
            "Aplicación de las leyes de Newton a partículas en equilibrio y en movimiento.",
        topics: [
            "Partículas en equilibrio",
            "Dinámica de partículas",
            "Fuerza normal",
            "Tensión",
            "Fricción estática y cinética",
            "Resistencia de fluidos",
            "Dinámica del movimiento circular",
            "Fuerzas fundamentales de la naturaleza",
        ],
    },
    {
        number: 4,
        title: "Trabajo y energía",
        chapters: "Capítulos 6 y 7",
        description:
            "Formulación energética de la mecánica y análisis de fuerzas conservativas y no conservativas.",
        topics: [
            "Trabajo",
            "Energía cinética",
            "Teorema trabajo-energía",
            "Trabajo con fuerza variable",
            "Potencia",
            "Energía potencial gravitacional",
            "Energía potencial elástica",
            "Fuerzas conservativas y no conservativas",
            "Conservación de la energía",
            "Diagramas de energía",
        ],
    },
    {
        number: 5,
        title: "Momento lineal y sistemas de partículas",
        chapters: "Capítulo 8",
        description:
            "Descripción de sistemas de partículas mediante momento lineal, impulso y centro de masa.",
        topics: [
            "Momento lineal",
            "Impulso",
            "Conservación del momento lineal",
            "Colisiones elásticas e inelásticas",
            "Centro de masa",
            "Sistemas de masa variable",
            "Propulsión de cohetes",
        ],
    },
    {
        number: 6,
        title: "Rotación y momento angular",
        chapters: "Capítulos 9 y 10",
        description:
            "Cinemática y dinámica de cuerpos rígidos en rotación.",
        topics: [
            "Velocidad y aceleración angulares",
            "Rotación con aceleración angular constante",
            "Relación entre movimiento lineal y angular",
            "Momento de inercia",
            "Teorema de los ejes paralelos",
            "Energía cinética rotacional",
            "Torca",
            "Trabajo y potencia en rotación",
            "Momento angular",
            "Conservación del momento angular",
            "Giróscopos y precesión",
        ],
    },
    {
        number: 7,
        title: "Gravitación y movimiento periódico",
        chapters: "Capítulos 13 y 14",
        description:
            "Aplicaciones de la mecánica newtoniana a sistemas gravitacionales y oscilatorios.",
        topics: [
            "Ley de gravitación universal",
            "Peso y campo gravitacional",
            "Energía potencial gravitacional",
            "Movimiento de satélites",
            "Leyes de Kepler",
            "Descripción de las oscilaciones",
            "Movimiento armónico simple",
            "Energía del oscilador",
            "Péndulo simple y péndulo físico",
            "Oscilaciones amortiguadas",
            "Oscilaciones forzadas y resonancia",
        ],
    },
];

/**
 * Referencias bibliográficas del programa oficial.
 * Se muestran como metadatos en el curso y en Recursos; nunca deben convertirse
 * en enlaces a copias no autorizadas de libros comerciales.
 */
export const BIBLIOGRAPHY = [
    {
        shortName: "S–Z",
        title: "Física universitaria, volumen 1",
        authors: "Sears y Zemansky; Young y Freedman",
        edition: "13.ª edición",
        role: "Texto guía",
    },
    {
        shortName: "K–K",
        title: "An Introduction to Mechanics",
        authors: "Kleppner y Kolenkow",
        edition: "",
        role: "Texto complementario",
    },
    {
        shortName: "H–R–W",
        title: "Fundamentos de física",
        authors: "Halliday, Resnick y Walker",
        edition: "",
        role: "Texto complementario",
    },
    {
        shortName: "A–F",
        title: "Física, volumen I",
        authors: "Marcelo Alonso y Edward J. Finn",
        edition: "",
        role: "Texto complementario",
    },
];
