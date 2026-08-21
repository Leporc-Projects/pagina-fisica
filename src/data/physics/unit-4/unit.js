import { ROUTE_IDS } from "../../../i18n/routes.js";

const unitRoute = "/fisica-basica-1/unidades/unidad-4";

export const UNIT_4 = Object.freeze({
  number: 4,
  slug: "unidad-4",
  title: "Trabajo y energía",
  shortTitle: "Unidad 4",
  chapters: "Capítulos 6 y 7",
  status: "review",
  priority: "core",
  routeId: ROUTE_IDS.COURSE_UNIT_4,
  route: unitRoute,
  practiceRouteId: ROUTE_IDS.COURSE_UNIT_4_PRACTICE,
  practiceRoute: "/fisica-basica-1/ejercicios/unidad-4",
  bonusRoute: null,
  description: "Trabajo, energía cinética y potencial, potencia y conservación de la energía como herramientas para relacionar fuerzas, movimiento y configuraciones físicas.",
  sourceScope: {
    stable: "Programa oficial 0302270 de Física Básica I",
    semester: "Programa clase a clase de Física Básica I 2026-2",
  },
  topics: Object.freeze([
    { order: 1, slug: "trabajo", title: "Trabajo de una fuerza", shortTitle: "Trabajo", route: `${unitRoute}/trabajo`, routeId: ROUTE_IDS.COURSE_UNIT_4_TOPIC_WORK, priority: "core", summary: "Transferencia de energía, producto punto y signo del trabajo." },
    { order: 2, slug: "energia-cinetica", title: "Energía cinética y teorema trabajo–energía", shortTitle: "Energía cinética", route: `${unitRoute}/energia-cinetica`, routeId: ROUTE_IDS.COURSE_UNIT_4_TOPIC_KINETIC_ENERGY, priority: "core", summary: "Relación entre trabajo neto, cambio de energía cinética y rapidez." },
    { order: 3, slug: "fuerza-variable", title: "Trabajo con fuerza variable", shortTitle: "Fuerza variable", route: `${unitRoute}/fuerza-variable`, routeId: ROUTE_IDS.COURSE_UNIT_4_TOPIC_VARIABLE_FORCE, priority: "core", summary: "Integral de línea y área con signo en una gráfica de fuerza contra posición." },
    { order: 4, slug: "potencia", title: "Potencia", shortTitle: "Potencia", route: `${unitRoute}/potencia`, routeId: ROUTE_IDS.COURSE_UNIT_4_TOPIC_POWER, priority: "core", summary: "Rapidez de transferencia de energía y potencia instantánea." },
    { order: 5, slug: "energia-potencial", title: "Energía potencial gravitacional y elástica", shortTitle: "Energía potencial", route: `${unitRoute}/energia-potencial`, routeId: ROUTE_IDS.COURSE_UNIT_4_TOPIC_POTENTIAL_ENERGY, priority: "core", summary: "Energía de configuración, referencia gravitacional y resorte ideal." },
    { order: 6, slug: "conservacion-energia", title: "Fuerzas conservativas y conservación de la energía", shortTitle: "Conservación", route: `${unitRoute}/conservacion-energia`, routeId: ROUTE_IDS.COURSE_UNIT_4_TOPIC_ENERGY_CONSERVATION, priority: "core", summary: "Energía mecánica, trabajo externo y transformación en energía interna." },
    { order: 7, slug: "fuerza-potencial", title: "Fuerza y energía potencial", shortTitle: "Fuerza y potencial", route: `${unitRoute}/fuerza-potencial`, routeId: ROUTE_IDS.COURSE_UNIT_4_TOPIC_FORCE_POTENTIAL, priority: "core", summary: "Fuerza como pendiente negativa del potencial y clasificación del equilibrio." },
    { order: 8, slug: "diagramas-energia", title: "Diagramas de energía", shortTitle: "Diagramas de energía", route: `${unitRoute}/diagramas-energia`, routeId: ROUTE_IDS.COURSE_UNIT_4_TOPIC_ENERGY_DIAGRAMS, priority: "core", summary: "Regiones permitidas, puntos de retorno, rapidez y equilibrio desde U(x)." },
  ]),
});

export const getUnit4Topic = (slug) => UNIT_4.topics.find((topic) => topic.slug === slug) ?? null;
