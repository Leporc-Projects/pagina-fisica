import { choose, integerBetween, PARAMETERIZED_FAMILY_SCHEMA_VERSION, roundTo } from "../../../utils/exercise-families.js";
import { multiNumberInteraction, numberInteraction } from "../exercise-builder.js";
import { t } from "../../../i18n/index.js";

const family = (definition) => ({
  schemaVersion: PARAMETERIZED_FAMILY_SCHEMA_VERSION,
  itemKind: "parameterizedFamily", version: 1, unit: 2,
  modalities: ["practice", "selfAssessment"], purpose: "learning", exposure: "public", status: "review",
  bonusEligible: false, estimatedMinutes: 5, commonErrors: [],
  feedback: { correct: t("es", "exercise.familyFeedback.correct"), incorrect: t("es", "exercise.familyFeedback.incorrect"), commonErrors: {} },
  ...definition,
});
const steps = (...texts) => texts.map((text, index) => ({ step: index + 1, title: ["Modelo", "Representación", "Cálculo", "Interpretación"][index] ?? `Paso ${index + 1}`, text }));

export const UNIT_2_EXERCISE_FAMILIES = [
  family({
    id: "u2-family-collinear-net-force", topic: "fuerzas-interacciones", subtopic: "fuerza-neta", type: "numerical", representation: "numerical", cognitiveLevel: "apply", difficulty: 2,
    objectives: ["Sumar fuerzas colineales mediante una convención de signos."], constraints: { positiveMagnitudes: true, nonzeroResult: true }, interaction: { kind: "number" },
    generateParameters: (random) => { let right; let left; do { right = integerBetween(4, 25, random); left = integerBetween(2, 20, random); } while (right === left); return { right, left }; },
    build: ({ right, left }) => {
      const net = right - left;
      return { title: "Resultante colineal", prompt: `Sobre un sistema actúan ${right} N hacia +x y ${left} N hacia −x. Calcula ΣFₓ.`, answer: { kind: "number", value: net, display: `${net} N` }, tolerance: 0, expectedUnit: "N", interaction: numberInteraction("ΣFₓ", "N"), hints: ["Asigna signos según el eje +x."], solution: steps("La fuerza neta suma las fuerzas externas con dirección.", `ΣFₓ = +${right} − ${left}.`, `ΣFₓ = ${net} N.`, `El signo ${net > 0 ? "positivo" : "negativo"} fija el sentido.`) };
    },
  }),
  family({
    id: "u2-family-net-force-2d", topic: "fuerzas-interacciones", subtopic: "fuerza-neta", type: "numerical", representation: "vectorial", cognitiveLevel: "apply", difficulty: 2,
    objectives: ["Sumar dos fuerzas bidimensionales por componentes."], constraints: { boundedComponents: [-12, 12], finiteResult: true }, interaction: { kind: "multiNumber" },
    generateParameters: (random) => ({ ax: integerBetween(-8, 8, random), ay: integerBetween(-8, 8, random), bx: integerBetween(-8, 8, random), by: integerBetween(-8, 8, random) }),
    build: ({ ax, ay, bx, by }) => {
      const x = ax + bx; const y = ay + by;
      return { title: "Suma de fuerzas en 2D", prompt: `F⃗₁ = (${ax}, ${ay}) N y F⃗₂ = (${bx}, ${by}) N. Determina ΣFₓ y ΣFᵧ.`, answer: { kind: "values", values: [{ symbol: "ΣFₓ", value: x, unit: "N" }, { symbol: "ΣFᵧ", value: y, unit: "N" }] }, tolerance: 0, expectedUnit: "N", interaction: multiNumberInteraction([["x", "ΣFₓ", "N"], ["y", "ΣFᵧ", "N"]]), hints: ["Suma componentes homólogas."], solution: steps("La suma vectorial se proyecta en los ejes.", `ΣFₓ = ${ax} + (${bx}); ΣFᵧ = ${ay} + (${by}).`, `ΣF⃗ = (${x}, ${y}) N.`, "Las componentes conservan los signos de los ejes.") };
    },
  }),
  family({
    id: "u2-family-second-law-acceleration", topic: "segunda-ley", subtopic: "fuerza-neta-y-aceleracion", type: "numerical", representation: "numerical", cognitiveLevel: "apply", difficulty: 2,
    objectives: ["Calcular aceleración desde fuerza neta y masa constante."], constraints: { positiveMass: true, finiteAcceleration: true }, interaction: { kind: "number" },
    generateParameters: (random) => { const mass = choose([2, 3, 4, 5, 6, 8, 10], random); const acceleration = choose([-6, -4, -3, 2, 3, 4, 5], random); return { mass, force: mass * acceleration }; },
    build: ({ mass, force }) => { const acceleration = force / mass; return { title: "Aceleración por segunda ley", prompt: `Una masa de ${mass} kg recibe ΣFₓ = ${force} N. Calcula aₓ.`, answer: { kind: "number", value: acceleration, display: `${acceleration} m/s²` }, tolerance: 0, expectedUnit: "m/s²", interaction: numberInteraction("aₓ", "m/s²"), hints: ["Usa aₓ = ΣFₓ/m."], solution: steps("La masa es constante y la fuerza dada es neta.", "ΣFₓ = maₓ.", `aₓ = ${force}/${mass} = ${acceleration} m/s².`, "El signo fija la dirección sobre x.") }; },
  }),
  family({
    id: "u2-family-second-law-required-force", topic: "segunda-ley", subtopic: "fuerza-neta-y-aceleracion", type: "numerical", representation: "numerical", cognitiveLevel: "apply", difficulty: 2,
    objectives: ["Calcular la fuerza neta requerida para una aceleración."], constraints: { positiveMass: true, finiteForce: true }, interaction: { kind: "number" },
    generateParameters: (random) => ({ mass: choose([2, 4, 5, 6, 8, 10], random), acceleration: choose([-5, -3, -2, 2, 3, 4, 5], random) }),
    build: ({ mass, acceleration }) => { const force = mass * acceleration; return { title: "Fuerza neta requerida", prompt: `¿Qué ΣFₓ requiere una masa de ${mass} kg para tener aₓ = ${acceleration} m/s²?`, answer: { kind: "number", value: force, display: `${force} N` }, tolerance: 0, expectedUnit: "N", interaction: numberInteraction("ΣFₓ", "N"), hints: ["Multiplica m por aₓ conservando el signo."], solution: steps("La pregunta pide la resultante externa.", "ΣFₓ = maₓ.", `ΣFₓ = ${mass}(${acceleration}) = ${force} N.`, "El signo indica el sentido de la resultante.") }; },
  }),
  family({
    id: "u2-family-weight", topic: "masa-peso", subtopic: "peso", type: "numerical", representation: "numerical", cognitiveLevel: "apply", difficulty: 2,
    objectives: ["Calcular peso usando masa y campo gravitacional explícitos."], constraints: { positiveMass: true, statedGravity: true }, interaction: { kind: "number" },
    generateParameters: (random) => ({ mass: choose([2, 3, 5, 7.5, 10, 12], random), g: choose([1.6, 3.7, 9.8, 10], random) }),
    build: ({ mass, g }) => { const weight = roundTo(mass * g); return { title: "Peso en un campo declarado", prompt: `Una masa de ${mass} kg está donde g = ${g} m/s². Calcula la magnitud de su peso.`, answer: { kind: "number", value: weight, display: `${weight} N` }, tolerance: 0.02, expectedUnit: "N", interaction: numberInteraction("W", "N"), hints: ["El peso es una fuerza: W = mg."], solution: steps("El campo local está dado explícitamente.", "W = mg.", `W = ${mass}(${g}) = ${weight} N.`, "La masa permanece; el resultado es una fuerza.") }; },
  }),
  family({
    id: "u2-family-third-law", topic: "tercera-ley", subtopic: "igual-magnitud-direccion-opuesta", type: "numerical", representation: "verbal", cognitiveLevel: "analyze", difficulty: 3,
    objectives: ["Combinar tercera ley y segunda ley para cuerpos de masa distinta."], constraints: { positiveMasses: true, unequalMasses: true, equalInteractionForces: true }, interaction: { kind: "multiNumber" },
    generateParameters: (random) => { let massA; let massB; do { massA = choose([40, 50, 60, 75, 80], random); massB = choose([40, 50, 60, 75, 80], random); } while (massA === massB); const force = choose([120, 150, 180, 240], random); return { massA, massB, force }; },
    build: ({ massA, massB, force }) => { const aA = roundTo(force / massA); const aB = roundTo(-force / massB); return { title: "Par de interacción y aceleraciones", prompt: `A (${massA} kg) y B (${massB} kg) se empujan con una fuerza mutua de ${force} N. Toma +x en el sentido de la fuerza sobre A y calcula a_A y a_B, sin otras fuerzas horizontales.`, answer: { kind: "values", values: [{ symbol: "a_A", value: aA, unit: "m/s²" }, { symbol: "a_B", value: aB, unit: "m/s²" }] }, tolerance: 0.02, expectedUnit: "m/s²", interaction: multiNumberInteraction([["a", "a_A", "m/s²"], ["b", "a_B", "m/s²"]]), hints: ["Las fuerzas son opuestas; aplica luego ΣF = ma a cada cuerpo."], solution: steps("La tercera ley fija +F sobre A y −F sobre B.", "Cada cuerpo requiere su propia segunda ley.", `a_A = ${force}/${massA} = ${aA}; a_B = −${force}/${massB} = ${aB} m/s².`, "Fuerzas iguales no implican aceleraciones iguales.") }; },
  }),
  family({
    id: "u2-family-fbd-resultant", topic: "diagramas-cuerpo-libre", subtopic: "leer-un-dcl", type: "numerical", representation: "visual", cognitiveLevel: "apply", difficulty: 2,
    objectives: ["Calcular resultante y aceleración desde un inventario colineal."], constraints: { positiveMass: true, nonzeroResult: true }, interaction: { kind: "multiNumber" },
    generateParameters: (random) => { const mass = choose([2, 3, 4, 5, 6], random); let right; let left; do { right = integerBetween(5, 20, random); left = integerBetween(2, 15, random); } while (right === left); return { mass, right, left }; },
    build: ({ mass, right, left }) => { const net = right - left; const acceleration = roundTo(net / mass); return { title: "Del DCL a la aceleración", prompt: `El DCL de una masa de ${mass} kg muestra ${right} N hacia +x y ${left} N hacia −x. Calcula ΣFₓ y aₓ.`, answer: { kind: "values", values: [{ symbol: "ΣFₓ", value: net, unit: "N" }, { symbol: "aₓ", value: acceleration, unit: "m/s²" }] }, tolerance: 0.02, expectedUnit: "N y m/s²", interaction: multiNumberInteraction([["f", "ΣFₓ", "N"], ["a", "aₓ", "m/s²"]]), hints: ["Primero suma fuerzas; después divide por la masa."], solution: steps("El DCL define el inventario sobre el mismo sistema.", `ΣFₓ = ${right} − ${left} = ${net} N.`, `aₓ = ${net}/${mass} = ${acceleration} m/s².`, "El signo común fija la dirección.") }; },
  }),
  family({
    id: "u2-family-galilean-velocity", topic: "marcos-inerciales", subtopic: "marcos-con-velocidad-relativa-constante", type: "numerical", representation: "verbal", cognitiveLevel: "apply", difficulty: 2,
    objectives: ["Transformar una velocidad unidimensional entre marcos inerciales."], constraints: { constantRelativeVelocity: true, signedVelocities: true }, interaction: { kind: "number" },
    generateParameters: (random) => ({ relative: choose([-6, -4, -2, 2, 3, 5, 7], random), frame: choose([-12, -8, -5, 5, 8, 12], random) }),
    build: ({ relative, frame }) => { const ground = relative + frame; return { title: "Velocidad galileana", prompt: `Un objeto tiene v' = ${relative} m/s en S', y S' se mueve con V = ${frame} m/s respecto a S. Calcula v en S.`, answer: { kind: "number", value: ground, display: `${ground} m/s` }, tolerance: 0, expectedUnit: "m/s", interaction: numberInteraction("v", "m/s"), hints: ["De v' = v − V se obtiene v = v' + V."], solution: steps("Los marcos tienen velocidad relativa constante.", "v = v' + V.", `v = ${relative} + (${frame}) = ${ground} m/s.`, "La aceleración seguiría siendo la misma en ambos marcos.") }; },
  }),
];

export const getUnit2ExerciseFamily = (id) => UNIT_2_EXERCISE_FAMILIES.find((family) => family.id === id) ?? null;
