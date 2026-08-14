import { ROUTE_IDS } from "../../../i18n/routes.js";

const unitRoute = "/fisica-basica-1/unidades/unidad-3";

export const UNIT_3 = Object.freeze({
  number: 3,
  slug: "unidad-3",
  title: "Fuerzas y ecuaciones de movimiento",
  shortTitle: "Unidad 3",
  chapters: "Capítulo 5",
  status: "review",
  priority: "core",
  routeId: ROUTE_IDS.COURSE_UNIT_3,
  route: unitRoute,
  practiceRouteId: ROUTE_IDS.COURSE_UNIT_3_PRACTICE,
  practiceRoute: "/fisica-basica-1/ejercicios/unidad-3",
  bonusRoute: null,
  description: "Aplicación sistemática de las leyes de Newton al equilibrio y la dinámica, con modelos de fuerzas de contacto, fricción, resistencia de fluidos y movimiento circular.",
  sourceScope: {
    stable: "Programa oficial 0302270 de Física Básica I",
    semester: "Programa clase a clase de Física Básica I 2026-2",
  },
  topics: Object.freeze([
    { order: 1, slug: "equilibrio", title: "Partículas en equilibrio", shortTitle: "Equilibrio", route: `${unitRoute}/equilibrio`, routeId: ROUTE_IDS.COURSE_UNIT_3_TOPIC_EQUILIBRIUM, priority: "core", summary: "Condición vectorial de equilibrio, estrategia de solución y fuerzas inclinadas." },
    { order: 2, slug: "dinamica-particulas", title: "Dinámica de partículas", shortTitle: "Dinámica", route: `${unitRoute}/dinamica-particulas`, routeId: ROUTE_IDS.COURSE_UNIT_3_TOPIC_PARTICLE_DYNAMICS, priority: "core", summary: "Del DCL a las ecuaciones, sistemas de cuerpos y restricciones de movimiento." },
    { order: 3, slug: "fuerza-normal", title: "Fuerza normal", shortTitle: "Normal", route: `${unitRoute}/fuerza-normal`, routeId: ROUTE_IDS.COURSE_UNIT_3_TOPIC_NORMAL, priority: "core", summary: "Origen, dirección y cálculo dinámico de la fuerza normal." },
    { order: 4, slug: "tension", title: "Tensión", shortTitle: "Tensión", route: `${unitRoute}/tension`, routeId: ROUTE_IDS.COURSE_UNIT_3_TOPIC_TENSION, priority: "core", summary: "Fuerza transmitida por cuerdas y condiciones del modelo ideal." },
    { order: 5, slug: "friccion", title: "Fricción estática y cinética", shortTitle: "Fricción", route: `${unitRoute}/friccion`, routeId: ROUTE_IDS.COURSE_UNIT_3_TOPIC_FRICTION, priority: "core", summary: "Dirección, regímenes y límites de los modelos de fricción." },
    { order: 6, slug: "resistencia-fluidos", title: "Resistencia de fluidos", shortTitle: "Arrastre", route: `${unitRoute}/resistencia-fluidos`, routeId: ROUTE_IDS.COURSE_UNIT_3_TOPIC_FLUID_RESISTANCE, priority: "core", summary: "Arrastre lineal y cuadrático, rapidez terminal y validez del modelo." },
    { order: 7, slug: "dinamica-circular", title: "Dinámica del movimiento circular", shortTitle: "Dinámica circular", route: `${unitRoute}/dinamica-circular`, routeId: ROUTE_IDS.COURSE_UNIT_3_TOPIC_CIRCULAR_DYNAMICS, priority: "core", summary: "Resultante radial, curvas planas y peraltadas, y círculo vertical." },
    { order: 8, slug: "fuerzas-fundamentales", title: "Fuerzas fundamentales de la naturaleza", shortTitle: "Fuerzas fundamentales", route: `${unitRoute}/fuerzas-fundamentales`, routeId: ROUTE_IDS.COURSE_UNIT_3_TOPIC_FUNDAMENTAL_FORCES, priority: "core", summary: "Cuatro interacciones fundamentales y fuerzas efectivas macroscópicas." },
  ]),
});

export const getUnit3Topic = (slug) => UNIT_3.topics.find((topic) => topic.slug === slug) ?? null;
