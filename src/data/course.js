// Contrato académico central de Física Básica I.
// Los datos estables provienen del programa oficial; SCHEDULE proviene del
// plan clase a clase 2026-2. Las páginas consumen estas exportaciones para no
// repetir información ni introducir versiones contradictorias.

/**
 * Identidad, carga académica y resultados estables del curso.
 * La consumen las cabeceras y las páginas académicas. No debe incorporar
 * contacto, oficina, horarios ni información del profesor del taller.
 */
export const COURSE = {
    name: "Física Básica I",
    code: "0302270",
    semester: "2026-2",
    group: "2",
    teacher: "César Barrero",
    credits: 4,
    modality: "Presencial",
    interactionHours: 96,
    independentHours: 96,
    totalHours: 192,

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
        label: "Curso",
        href: "/fisica-basica-1",
    },
    {
        label: "Cronograma",
        href: "/fisica-basica-1/cronograma",
    },
    {
        label: "Unidades y apuntes",
        href: "/fisica-basica-1/unidades",
    },
    {
        label: "Ejercicios y tutorías",
        href: "/fisica-basica-1/ejercicios",
    },
    {
        label: "Videos",
        href: "/fisica-basica-1/videos",
    },
    {
        label: "Evaluación y notas",
        href: "/fisica-basica-1/evaluacion",
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
 * Componentes y porcentajes establecidos por el programa oficial.
 * Las vistas calculan el total desde estos registros y la validación exige
 * que la suma permanezca en 100 %.
 */
export const EVALUATION = [
    {
        name: "Primer examen",
        percentage: 20,
        content: "Capítulos 1, 2 y 3",
    },
    {
        name: "Segundo examen",
        percentage: 20,
        content: "Capítulos 4, 5 y 6",
    },
    {
        name: "Tercer examen",
        percentage: 20,
        content: "Capítulos 7, 8 y 9",
    },
    {
        name: "Cuarto examen",
        percentage: 20,
        content: "Capítulos 10, 13 y 14",
    },
    {
        name: "Taller",
        percentage: 20,
        content: "Actividades y resolución de problemas",
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

/**
 * Desarrollo concreto del semestre según el plan clase a clase 2026-2.
 * El orden del arreglo es el orden cronológico de publicación. Los números de
 * sesión deben ser consecutivos y este conjunto no incluye el cronograma del taller.
 */
export const SCHEDULE = [
    {
        session: 1,
        date: "2026-08-04",
        type: "class",
        title: "Presentación del curso",
        chapter: "",
        topics: [
            "Presentación general",
            "Organización del curso",
            "Encuesta inicial",
        ],
        objectives: [
            "Conocer la organización, metodología y evaluación del curso.",
        ],
    },
    {
        session: 2,
        date: "2026-08-06",
        type: "class",
        title: "Unidades, cantidades físicas y vectores",
        chapter: "Capítulo 1",
        topics: [
            "Estándares y unidades",
            "Análisis dimensional",
            "Cifras significativas",
            "Órdenes de magnitud",
            "Vectores y suma de vectores",
            "Componentes",
            "Vectores unitarios",
            "Productos de vectores",
        ],
        objectives: [
            "Reconocer las cantidades fundamentales y sus unidades.",
            "Aplicar cifras significativas en cálculos.",
            "Representar vectores mediante componentes.",
            "Utilizar vectores unitarios y productos vectoriales.",
        ],
    },
    {
        session: 3,
        date: "2026-08-11",
        type: "class",
        title: "Movimiento rectilíneo",
        chapter: "Capítulo 2",
        topics: [
            "Desplazamiento",
            "Velocidad media e instantánea",
            "Aceleración media e instantánea",
            "Gráficas de posición, velocidad y aceleración",
        ],
        objectives: [
            "Describir el movimiento rectilíneo mediante posición, velocidad y aceleración.",
            "Interpretar gráficas cinemáticas.",
        ],
    },
    {
        session: 4,
        date: "2026-08-13",
        type: "class",
        title: "Movimiento con aceleración constante",
        chapter: "Capítulo 2",
        topics: [
            "Movimiento con aceleración constante",
            "Caída libre",
            "Velocidad y posición por integración",
        ],
        objectives: [
            "Resolver problemas de aceleración constante y caída libre.",
            "Analizar movimientos con aceleración no constante.",
        ],
    },
    {
        session: 5,
        date: "2026-08-18",
        type: "class",
        title: "Movimiento en dos y tres dimensiones",
        chapter: "Capítulo 3",
        topics: [
            "Vectores de posición y velocidad",
            "Vector aceleración",
            "Movimiento de proyectiles",
        ],
        objectives: [
            "Representar posición, velocidad y aceleración vectorialmente.",
            "Describir el movimiento de proyectiles.",
        ],
    },
    {
        session: 6,
        date: "2026-08-20",
        type: "class",
        title: "Movimiento circular y velocidad relativa",
        chapter: "Capítulo 3",
        topics: [
            "Movimiento circular",
            "Rapidez constante y variable",
            "Velocidad relativa",
            "Marcos de referencia",
        ],
        objectives: [
            "Analizar el movimiento en trayectorias circulares.",
            "Relacionar velocidades observadas desde distintos sistemas de referencia.",
        ],
    },
    {
        session: 7,
        date: "2026-08-25",
        type: "review",
        title: "Repaso de los capítulos 1, 2 y 3",
        chapter: "Capítulos 1–3",
        topics: ["Resolución de problemas y preparación para el primer examen"],
        objectives: ["Integrar los conceptos de vectores y cinemática."],
    },
    {
        session: 8,
        date: "2026-08-27",
        type: "exam",
        title: "Primer examen",
        chapter: "Capítulos 1–3",
        topics: ["Vectores y cinemática"],
        objectives: [],
    },
    {
        session: 9,
        date: "2026-09-01",
        type: "class",
        title: "Leyes del movimiento de Newton",
        chapter: "Capítulo 4",
        topics: [
            "Fuerza e interacciones",
            "Primera ley",
            "Segunda ley",
            "Masa y peso",
        ],
        objectives: [
            "Comprender el concepto vectorial de fuerza.",
            "Relacionar fuerza neta, masa y aceleración.",
        ],
    },
    {
        session: 10,
        date: "2026-09-03",
        type: "class",
        title: "Tercera ley y diagramas de cuerpo libre",
        chapter: "Capítulo 4",
        topics: [
            "Tercera ley de Newton",
            "Pares de interacción",
            "Diagramas de cuerpo libre",
        ],
        objectives: [
            "Identificar correctamente fuerzas de interacción.",
            "Construir diagramas de cuerpo libre.",
        ],
    },
    {
        session: 11,
        date: "2026-09-08",
        type: "class",
        title: "Aplicación de las leyes de Newton",
        chapter: "Capítulo 5",
        topics: [
            "Partículas en equilibrio",
            "Dinámica de partículas",
            "Fuerzas de fricción",
        ],
        objectives: [
            "Resolver problemas de equilibrio.",
            "Aplicar la segunda ley a partículas aceleradas.",
            "Distinguir diferentes formas de fricción.",
        ],
    },
    {
        session: 12,
        date: "2026-09-10",
        type: "class",
        title: "Dinámica del movimiento circular",
        chapter: "Capítulo 5",
        topics: [
            "Fuerzas en trayectorias circulares",
            "Fuerzas fundamentales de la naturaleza",
        ],
        objectives: [
            "Resolver problemas dinámicos de movimiento circular.",
            "Reconocer las cuatro interacciones fundamentales.",
        ],
    },
    {
        session: 13,
        date: "2026-09-15",
        type: "class",
        title: "Trabajo y energía cinética",
        chapter: "Capítulo 6",
        topics: [
            "Trabajo",
            "Energía cinética",
            "Teorema trabajo-energía",
        ],
        objectives: [
            "Calcular el trabajo realizado por una fuerza.",
            "Relacionar trabajo total y cambio de energía cinética.",
        ],
    },
    {
        session: 14,
        date: "2026-09-17",
        type: "class",
        title: "Trabajo con fuerza variable y potencia",
        chapter: "Capítulo 6",
        topics: [
            "Trabajo con fuerzas variables",
            "Trayectorias curvas",
            "Potencia",
        ],
        objectives: [
            "Aplicar el teorema trabajo-energía con fuerzas variables.",
            "Resolver problemas de potencia.",
        ],
    },
    {
        session: 15,
        date: "2026-09-22",
        type: "review",
        title: "Repaso de los capítulos 4, 5 y 6",
        chapter: "Capítulos 4–6",
        topics: ["Resolución de problemas y preparación para el segundo examen"],
        objectives: ["Integrar leyes de Newton, fuerza, trabajo y energía cinética."],
    },
    {
        session: 16,
        date: "2026-09-24",
        type: "exam",
        title: "Segundo examen",
        chapter: "Capítulos 4–6",
        topics: ["Leyes de Newton, aplicaciones, trabajo y energía cinética"],
        objectives: [],
    },
    {
        session: 17,
        date: "2026-09-29",
        type: "class",
        title: "Energía potencial y conservación de la energía",
        chapter: "Capítulo 7",
        topics: [
            "Energía potencial gravitacional",
            "Energía potencial elástica",
            "Fuerzas conservativas y no conservativas",
        ],
        objectives: [
            "Resolver problemas con energía potencial gravitacional y elástica.",
            "Distinguir fuerzas conservativas y no conservativas.",
        ],
    },
    {
        session: 18,
        date: "2026-10-01",
        type: "class",
        title: "Fuerza, energía potencial y diagramas de energía",
        chapter: "Capítulo 7",
        topics: [
            "Relación entre fuerza y energía potencial",
            "Diagramas de energía",
        ],
        objectives: [
            "Obtener propiedades de una fuerza a partir de la energía potencial.",
            "Interpretar el movimiento mediante diagramas de energía.",
        ],
    },
    {
        session: 19,
        date: "2026-10-06",
        type: "class",
        title: "Momento lineal, impulso y colisiones",
        chapter: "Capítulo 8",
        topics: [
            "Momento lineal",
            "Impulso",
            "Conservación del momento lineal",
            "Choques elásticos e inelásticos",
        ],
        objectives: [
            "Relacionar impulso y cambio de momento lineal.",
            "Aplicar conservación del momento en colisiones.",
        ],
    },
    {
        session: 20,
        date: "2026-10-08",
        type: "class",
        title: "Centro de masa y propulsión",
        chapter: "Capítulo 8",
        topics: [
            "Centro de masa",
            "Movimiento del centro de masa",
            "Propulsión de un cohete",
        ],
        objectives: [
            "Analizar el movimiento del centro de masa.",
            "Estudiar sistemas cuya masa cambia durante el movimiento.",
        ],
    },
    {
        session: 21,
        date: "2026-10-13",
        type: "class",
        title: "Rotación de cuerpos rígidos",
        chapter: "Capítulo 9",
        topics: [
            "Posición angular",
            "Velocidad angular",
            "Aceleración angular",
            "Rotación con aceleración angular constante",
            "Relación entre variables lineales y angulares",
        ],
        objectives: [
            "Describir la rotación mediante variables angulares.",
            "Relacionar cinemática lineal y angular.",
        ],
    },
    {
        session: 22,
        date: "2026-10-15",
        type: "class",
        title: "Energía de rotación y momento de inercia",
        chapter: "Capítulo 9",
        topics: [
            "Energía cinética rotacional",
            "Momento de inercia",
            "Teorema de los ejes paralelos",
        ],
        objectives: [
            "Interpretar físicamente el momento de inercia.",
            "Calcular momentos de inercia de cuerpos.",
        ],
    },
    {
        session: 23,
        date: "2026-10-20",
        type: "review",
        title: "Repaso de los capítulos 7, 8 y 9",
        chapter: "Capítulos 7–9",
        topics: ["Resolución de problemas y preparación para el tercer examen"],
        objectives: [
            "Integrar energía, momento lineal y cinemática rotacional.",
        ],
    },
    {
        session: 24,
        date: "2026-10-22",
        type: "exam",
        title: "Tercer examen",
        chapter: "Capítulos 7–9",
        topics: ["Energía, momento lineal y rotación"],
        objectives: [],
    },
    {
        session: 25,
        date: "2026-10-27",
        type: "event",
        title: "Examen de admisión",
        chapter: "",
        topics: ["No se programa contenido ordinario del curso"],
        objectives: [],
    },
    {
        session: 26,
        date: "2026-10-29",
        type: "class",
        title: "Dinámica del movimiento de rotación",
        chapter: "Capítulo 10",
        topics: [
            "Torca",
            "Torca y aceleración angular",
            "Rotación alrededor de un eje móvil",
            "Trabajo y potencia rotacional",
        ],
        objectives: [
            "Relacionar torca y aceleración angular.",
            "Analizar cuerpos que se trasladan y giran.",
        ],
    },
    {
        session: 27,
        date: "2026-11-03",
        type: "class",
        title: "Momento angular",
        chapter: "Capítulo 10",
        topics: [
            "Momento angular",
            "Conservación del momento angular",
            "Giróscopos",
            "Precesión",
        ],
        objectives: [
            "Interpretar el momento angular.",
            "Aplicar su ley de conservación.",
            "Comprender cualitativamente la precesión.",
        ],
    },
    {
        session: 28,
        date: "2026-11-05",
        type: "class",
        title: "Gravitación",
        chapter: "Capítulo 13",
        topics: [
            "Ley de gravitación universal",
            "Peso",
            "Energía potencial gravitacional",
            "Órbitas circulares",
        ],
        objectives: [
            "Calcular fuerzas gravitacionales.",
            "Relacionar peso y fuerza gravitacional.",
            "Analizar energía y movimiento orbital.",
        ],
    },
    {
        session: 29,
        date: "2026-11-10",
        type: "class",
        title: "Satélites y leyes de Kepler",
        chapter: "Capítulo 13",
        topics: [
            "Movimiento de satélites",
            "Leyes de Kepler",
            "Movimiento planetario",
            "Introducción a agujeros negros",
        ],
        objectives: [
            "Aplicar las leyes de Kepler.",
            "Relacionar órbitas con la gravitación newtoniana.",
        ],
    },
    {
        session: 30,
        date: "2026-11-12",
        type: "class",
        title: "Movimiento periódico",
        chapter: "Capítulo 14",
        topics: [
            "Amplitud, periodo y frecuencia",
            "Movimiento armónico simple",
            "Energía en el movimiento armónico simple",
            "Aplicaciones",
        ],
        objectives: [
            "Describir cuantitativamente las oscilaciones.",
            "Aplicar el modelo de movimiento armónico simple.",
        ],
    },
    {
        session: 31,
        date: "2026-11-17",
        type: "class",
        title: "Péndulos, amortiguamiento y resonancia",
        chapter: "Capítulo 14",
        topics: [
            "Péndulo simple",
            "Péndulo físico",
            "Oscilaciones amortiguadas",
            "Oscilaciones forzadas",
            "Resonancia",
        ],
        objectives: [
            "Analizar péndulos simples y físicos.",
            "Interpretar amortiguamiento, forzamiento y resonancia.",
        ],
    },
    {
        session: 32,
        date: "2026-11-19",
        type: "review",
        title: "Repaso de los capítulos 10, 13 y 14",
        chapter: "Capítulos 10, 13 y 14",
        topics: ["Resolución de problemas y preparación para el cuarto examen"],
        objectives: [
            "Integrar dinámica rotacional, gravitación y oscilaciones.",
        ],
    },
    {
        session: 33,
        date: "2026-11-24",
        type: "exam",
        title: "Cuarto examen",
        chapter: "Capítulos 10, 13 y 14",
        topics: ["Rotación, gravitación y movimiento periódico"],
        objectives: [],
    },
    {
        session: 34,
        date: "2026-12-01",
        type: "event",
        title: "Habilitación",
        chapter: "",
        topics: ["Evaluación de habilitación"],
        objectives: [],
    },
];

/** Etiquetas de presentación para los tipos admitidos por SCHEDULE. */
export const SCHEDULE_TYPES = {
    class: {
        label: "Clase",
    },
    review: {
        label: "Repaso",
    },
    exam: {
        label: "Evaluación",
    },
    event: {
        label: "Evento",
    },
};
