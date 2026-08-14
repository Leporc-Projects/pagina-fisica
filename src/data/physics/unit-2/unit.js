import { ROUTE_IDS } from "../../../i18n/routes.js";

const unitRoute = "/fisica-basica-1/unidades/unidad-2";

export const UNIT_2 = Object.freeze({
  number: 2,
  slug: "unidad-2",
  title: "Leyes de Newton",
  shortTitle: "Unidad 2",
  chapters: "Capítulo 4",
  status: "review",
  priority: "core",
  routeId: ROUTE_IDS.COURSE_UNIT_2,
  route: unitRoute,
  practiceRouteId: ROUTE_IDS.COURSE_UNIT_2_PRACTICE,
  practiceRoute: "/fisica-basica-1/ejercicios/unidad-2",
  bonusRoute: null,
  description: "Fundamentos de las interacciones mecánicas, las tres leyes de Newton, masa, peso, diagramas de cuerpo libre y sistemas de referencia inerciales.",
  sourceScope: {
    stable: "Programa oficial 0302270 de Física Básica I",
    semester: "Programa clase a clase de Física Básica I 2026-2",
  },
  topics: Object.freeze([
    { order: 1, slug: "fuerzas-interacciones", title: "Fuerza e interacciones", shortTitle: "Fuerzas", route: `${unitRoute}/fuerzas-interacciones`, routeId: ROUTE_IDS.COURSE_UNIT_2_TOPIC_FORCES, priority: "core", summary: "Interacciones, elección del sistema, fuerza neta y medición en newtons." },
    { order: 2, slug: "primera-ley", title: "Primera ley de Newton", shortTitle: "Primera ley", route: `${unitRoute}/primera-ley`, routeId: ROUTE_IDS.COURSE_UNIT_2_TOPIC_FIRST_LAW, priority: "core", summary: "Inercia, fuerza neta cero y el papel de los marcos inerciales." },
    { order: 3, slug: "segunda-ley", title: "Segunda ley de Newton", shortTitle: "Segunda ley", route: `${unitRoute}/segunda-ley`, routeId: ROUTE_IDS.COURSE_UNIT_2_TOPIC_SECOND_LAW, priority: "core", summary: "Relación vectorial entre fuerza neta externa, masa y aceleración." },
    { order: 4, slug: "masa-peso", title: "Masa y peso", shortTitle: "Masa y peso", route: `${unitRoute}/masa-peso`, routeId: ROUTE_IDS.COURSE_UNIT_2_TOPIC_MASS_WEIGHT, priority: "core", summary: "Masa inercial, fuerza gravitacional y variación del peso con el campo." },
    { order: 5, slug: "tercera-ley", title: "Tercera ley de Newton", shortTitle: "Tercera ley", route: `${unitRoute}/tercera-ley`, routeId: ROUTE_IDS.COURSE_UNIT_2_TOPIC_THIRD_LAW, priority: "core", summary: "Pares de interacción simultáneos que actúan sobre cuerpos diferentes." },
    { order: 6, slug: "diagramas-cuerpo-libre", title: "Diagramas de cuerpo libre", shortTitle: "DCL", route: `${unitRoute}/diagramas-cuerpo-libre`, routeId: ROUTE_IDS.COURSE_UNIT_2_TOPIC_FREE_BODY, priority: "core", summary: "Aislamiento del sistema, inventario de fuerzas, ejes y lectura dinámica." },
    { order: 7, slug: "marcos-inerciales", title: "Sistemas de referencia inerciales", shortTitle: "Marcos inerciales", route: `${unitRoute}/marcos-inerciales`, routeId: ROUTE_IDS.COURSE_UNIT_2_TOPIC_INERTIAL_FRAMES, priority: "core", summary: "Criterio inercial, transformaciones galileanas y límites de marcos acelerados." },
  ]),
});

export const getUnit2Topic = (slug) => UNIT_2.topics.find((topic) => topic.slug === slug) ?? null;
