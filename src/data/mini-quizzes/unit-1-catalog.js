import { assertSupportedLocale } from "../../i18n/config.js";
import { ROUTE_IDS } from "../../i18n/routes.js";
import { UNIT_1_MINI_QUIZ_V2_BLUEPRINTS } from "./unit-1.js";

const localized = (es, en) => Object.freeze({ es, en });
const blueprints = new Map(
  UNIT_1_MINI_QUIZ_V2_BLUEPRINTS.map((blueprint) => [blueprint.id, blueprint]),
);

const activity = ({ blueprintId, ...definition }) => {
  const sourceBlueprint = blueprints.get(blueprintId);
  if (!sourceBlueprint) throw new RangeError(`No existe el blueprint V2 ${blueprintId}.`);
  return Object.freeze({
    version: 1,
    unit: 1,
    modality: "bonus",
    purpose: "learning",
    exposure: "public",
    feedbackPolicy: "afterAttempt",
    status: "published",
    blueprintId,
    blueprint: sourceBlueprint.blueprint,
    questionCount: sourceBlueprint.questionCount,
    supportsRetake: false,
    ...definition,
  });
};

export const UNIT_1_MINI_QUIZ_V2_ACTIVITIES = Object.freeze([
  activity({
    id: "mq-v2-u1-tools-vectors",
    blueprintId: "mq-v2-u1-tools-vectors",
    slug: "herramientas-vectores",
    routeId: ROUTE_IDS.COURSE_MINI_QUIZ_TOOLS_VECTORS,
    title: localized("Mini quiz de herramientas y vectores", "Measurement tools and vectors mini quiz"),
    shortTitle: localized("Herramientas y vectores", "Measurement tools and vectors"),
    description: localized(
      "Comprueba análisis dimensional, componentes y operaciones vectoriales en una actividad breve.",
      "Check dimensional analysis, components, and vector operations in a short activity.",
    ),
    topics: ["herramientas", "vectores"],
    estimatedMinutes: 15,
  }),
  activity({
    id: "mq-v2-u1-kinematics-1d",
    blueprintId: "mq-v2-u1-kinematics-1d",
    slug: "cinematica",
    routeId: ROUTE_IDS.COURSE_MINI_QUIZ_KINEMATICS,
    title: localized("Mini quiz de cinemática en una dimensión", "One-dimensional kinematics mini quiz"),
    shortTitle: localized("Cinemática en una dimensión", "One-dimensional kinematics"),
    description: localized(
      "Revisa posición, desplazamiento, signos y gráficas de movimiento en una dimensión.",
      "Review position, displacement, signs, and graphs of one-dimensional motion.",
    ),
    topics: ["movimiento-1d"],
    estimatedMinutes: 18,
  }),
  activity({
    id: "mq-v2-u1-models-projectiles",
    blueprintId: "mq-v2-u1-models-projectiles",
    slug: "modelos-proyectiles",
    routeId: ROUTE_IDS.COURSE_MINI_QUIZ_MODELS_PROJECTILES,
    title: localized("Mini quiz de modelos y proyectiles", "Models and projectiles mini quiz"),
    shortTitle: localized("Modelos y proyectiles", "Models and projectiles"),
    description: localized(
      "Contrasta modelos cinemáticos, caída libre y movimiento de proyectiles.",
      "Compare kinematic models, free fall, and projectile motion.",
    ),
    topics: ["ecuaciones-movimiento", "movimiento-2d"],
    estimatedMinutes: 18,
  }),
  activity({
    id: "mq-v2-u1-motion-2d-circular-relative",
    blueprintId: "mq-v2-u1-motion-2d-circular-relative",
    slug: "movimiento-2d-circular-relativo",
    routeId: ROUTE_IDS.COURSE_MINI_QUIZ_MOTION_2D_CIRCULAR_RELATIVE,
    title: localized("Mini quiz de movimiento 2D, circular y relativo", "2D, circular, and relative motion mini quiz"),
    shortTitle: localized("Movimiento 2D, circular y relativo", "2D, circular, and relative motion"),
    description: localized(
      "Conecta cinemática vectorial, movimiento circular y composición de velocidades.",
      "Connect vector kinematics, circular motion, and velocity composition.",
    ),
    topics: ["movimiento-2d", "circular-relativo"],
    estimatedMinutes: 16,
  }),
  activity({
    id: "mq-v2-u1-review",
    blueprintId: "mq-v2-u1-review",
    slug: "repaso-unidad-1",
    routeId: ROUTE_IDS.COURSE_MINI_QUIZ_UNIT_1_REVIEW,
    title: localized("Mini quiz de repaso de Unidad 1", "Unit 1 review mini quiz"),
    shortTitle: localized("Repaso de Unidad 1", "Unit 1 review"),
    description: localized(
      "Integra las ideas principales de la unidad con preguntas conceptuales, vectoriales y gráficas.",
      "Integrate the unit's main ideas through conceptual, vector, and graphical questions.",
    ),
    topics: ["herramientas", "vectores", "movimiento-1d", "ecuaciones-movimiento", "movimiento-2d", "circular-relativo"],
    estimatedMinutes: 22,
  }),
  activity({
    id: "mq-v2-u1-polar-coordinates",
    blueprintId: "mq-v2-u1-polar-coordinates",
    slug: "coordenadas-polares",
    routeId: ROUTE_IDS.COURSE_MINI_QUIZ_POLAR_COORDINATES,
    title: localized("Mini quiz de coordenadas polares", "Polar coordinates mini quiz"),
    shortTitle: localized("Coordenadas polares", "Polar coordinates"),
    description: localized(
      "Practica la base polar y las componentes polares de velocidad y aceleración.",
      "Practice the polar basis and the polar components of velocity and acceleration.",
    ),
    topics: ["coordenadas-polares"],
    estimatedMinutes: 16,
  }),
]);

export const localizeUnit1MiniQuizV2Activity = (source, locale) => {
  assertSupportedLocale(locale);
  if (!source) return source;
  return {
    ...source,
    title: source.title[locale],
    shortTitle: source.shortTitle[locale],
    description: source.description[locale],
  };
};
