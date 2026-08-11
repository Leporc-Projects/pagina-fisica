import {
  choose,
  integerBetween,
  PARAMETERIZED_FAMILY_SCHEMA_VERSION,
  roundTo,
} from "../../../utils/exercise-families.js";
import { t } from "../../../i18n/index.js";

const singleChoice = (options, correctOptionId) => ({
  kind: "singleChoice",
  options: options.map(([id, content]) => ({ id, content })),
  correctOptionId,
});

const numberInteraction = (label, unit) => ({
  kind: "number",
  field: { id: "value", label, unit },
});

const valuesInteraction = (fields) => ({
  kind: "multiNumber",
  fields: fields.map(([id, label, unit]) => ({ id, label, unit })),
});

const family = (definition) => ({
  schemaVersion: PARAMETERIZED_FAMILY_SCHEMA_VERSION,
  itemKind: "parameterizedFamily",
  version: 1,
  unit: 1,
  modalities: ["practice", "selfAssessment", "bonus"],
  purpose: "learning",
  exposure: "public",
  status: "review",
  bonusEligible: true,
  estimatedMinutes: 5,
  commonErrors: [],
  feedback: {
    correct: t("es", "exercise.familyFeedback.correct"),
    incorrect: t("es", "exercise.familyFeedback.incorrect"),
    commonErrors: {},
  },
  ...definition,
});

const solution = (...steps) => steps.map((text, index) => ({
  step: index + 1,
  title: ["Modelo", "Cálculo", "Resultado", "Comprobación"][index] ?? `Paso ${index + 1}`,
  text,
}));

const signs = (value) => value >= 0 ? `+${value}` : String(value).replace("-", "−");

export const UNIT_1_EXERCISE_FAMILIES = [
  family({
    id: "family-u1-vector-components-direction",
    topic: "vectores",
    subtopic: "componentes-y-base",
    type: "numerical",
    representation: "vectorial",
    cognitiveLevel: "apply",
    difficulty: 2,
    objectives: ["Descomponer un vector en componentes cartesianas considerando el cuadrante."],
    constraints: { magnitude: [5, 15], anglesExcludeAxes: true, quadrants: [1, 2, 3, 4] },
    interaction: { kind: "multiNumber" },
    generateParameters: (random) => ({
      magnitude: choose([5, 8, 10, 12, 13, 15], random),
      angleDeg: choose([30, 37, 45, 53, 60, 120, 135, 150, 210, 225, 300, 315], random),
    }),
    build: ({ magnitude, angleDeg }) => {
      const radians = angleDeg * Math.PI / 180;
      const x = roundTo(magnitude * Math.cos(radians));
      const y = roundTo(magnitude * Math.sin(radians));
      return {
        title: "Componentes desde magnitud y dirección",
        prompt: `Un vector A tiene magnitud ${magnitude} unidades y forma un ángulo de ${angleDeg}° medido antihorario desde +x. Determina Aₓ y Aᵧ.`,
        answer: { kind: "values", values: [
          { symbol: "Aₓ", value: x, unit: "unidades" },
          { symbol: "Aᵧ", value: y, unit: "unidades" },
        ] },
        tolerance: 0.02,
        expectedUnit: "unidades",
        interaction: valuesInteraction([["x", "Aₓ", "unidades"], ["y", "Aᵧ", "unidades"]]),
        hints: ["Usa coseno para x y seno para y; conserva los signos del cuadrante."],
        solution: solution(
          `Aₓ = A cos θ y Aᵧ = A sin θ con θ = ${angleDeg}°.`,
          `Aₓ = ${x} y Aᵧ = ${y} unidades.`,
          `√(Aₓ² + Aᵧ²) ≈ ${magnitude} unidades.`
        ),
        commonErrors: ["vector-sine-cosine", "vector-wrong-quadrant"],
      };
    },
  }),
  family({
    id: "family-u1-vector-magnitude-components",
    topic: "vectores",
    subtopic: "componentes-y-base",
    type: "numerical",
    representation: "vectorial",
    cognitiveLevel: "apply",
    difficulty: 2,
    objectives: ["Calcular la magnitud de un vector desde sus componentes."],
    constraints: { nonzeroComponents: true, mixedIntegerAndDecimal: true },
    interaction: { kind: "number" },
    generateParameters: (random) => choose([
      { x: 3, y: 4 }, { x: -5, y: 12 }, { x: -8, y: -15 }, { x: 7, y: -24 },
      { x: 2.5, y: 6 }, { x: -4.2, y: 3.5 }, { x: 5.5, y: -7.2 },
    ], random),
    build: ({ x, y }) => {
      const magnitude = roundTo(Math.hypot(x, y));
      return {
        title: "Magnitud desde componentes",
        prompt: `El vector A = (${signs(x)}, ${signs(y)}) en componentes cartesianas. Calcula su magnitud.`,
        answer: { kind: "number", value: magnitude, display: `${magnitude} unidades` },
        tolerance: 0.02,
        expectedUnit: "unidades",
        interaction: numberInteraction("Magnitud de A", "unidades"),
        hints: ["La magnitud es √(Aₓ² + Aᵧ²)."],
        solution: solution(`|A| = √[(${x})² + (${y})²].`, `|A| = ${magnitude} unidades.`),
        commonErrors: ["vector-magnitude-component", "vector-negative-magnitude"],
      };
    },
  }),
  family({
    id: "family-u1-vector-sum",
    topic: "vectores",
    subtopic: "suma-y-resta",
    type: "numerical",
    representation: "vectorial",
    cognitiveLevel: "apply",
    difficulty: 2,
    objectives: ["Sumar vectores por componentes y obtener la magnitud de la resultante."],
    constraints: { nonzeroResult: true, boundedComponents: [-8, 8] },
    interaction: { kind: "multiNumber" },
    generateParameters: (random) => {
      let ax; let ay; let bx; let by;
      do {
        ax = integerBetween(-7, 7, random); ay = integerBetween(-7, 7, random);
        bx = integerBetween(-7, 7, random); by = integerBetween(-7, 7, random);
      } while ((ax === 0 && ay === 0) || (bx === 0 && by === 0) || (ax + bx === 0 && ay + by === 0));
      return { ax, ay, bx, by };
    },
    build: ({ ax, ay, bx, by }) => {
      const rx = ax + bx; const ry = ay + by; const magnitude = roundTo(Math.hypot(rx, ry));
      return {
        title: "Suma de dos vectores",
        prompt: `Sean A = (${signs(ax)}, ${signs(ay)}) y B = (${signs(bx)}, ${signs(by)}). Determina R = A + B y su magnitud.`,
        answer: { kind: "values", values: [
          { symbol: "Rₓ", value: rx, unit: "unidades" }, { symbol: "Rᵧ", value: ry, unit: "unidades" },
          { symbol: "|R|", value: magnitude, unit: "unidades" },
        ] },
        tolerance: 0.02,
        expectedUnit: "unidades",
        interaction: valuesInteraction([["rx", "Rₓ", "unidades"], ["ry", "Rᵧ", "unidades"], ["r", "|R|", "unidades"]]),
        hints: ["Suma primero las componentes homólogas."],
        solution: solution(`R = (${ax} + ${bx}, ${ay} + ${by}) = (${rx}, ${ry}).`, `|R| = √(${rx}² + ${ry}²) = ${magnitude} unidades.`),
        commonErrors: ["vector-magnitude-component"],
      };
    },
  }),
  family({
    id: "family-u1-vector-perpendicular-lambda",
    topic: "vectores",
    subtopic: "producto-escalar-y-vectorial",
    type: "symbolic",
    representation: "vectorial",
    cognitiveLevel: "analyze",
    difficulty: 3,
    objectives: ["Imponer perpendicularidad mediante producto escalar."],
    constraints: { nonzeroLambdaCoefficient: true, cleanFiniteSolution: true },
    interaction: { kind: "number" },
    generateParameters: (random) => {
      const a1 = choose([-4, -3, -2, 2, 3, 4], random);
      const b1 = choose([-3, -2, 2, 3], random);
      const b2 = choose([-4, -2, 2, 4], random);
      const b3 = choose([-2, -1, 1, 2], random);
      const lambda = choose([-3, -2, -1, 1, 2, 3], random);
      const a3 = (-b2 * lambda - a1 * b1) / b3;
      return { a1, a3, b1, b2, b3, lambda };
    },
    build: ({ a1, a3, b1, b2, b3, lambda }) => ({
      title: "Parámetro para perpendicularidad",
      prompt: `Determina λ para que A = (${a1}, λ, ${a3}) sea perpendicular a B = (${b1}, ${b2}, ${b3}).`,
      answer: { kind: "number", value: lambda, display: `λ = ${lambda}` },
      tolerance: 0.001,
      expectedUnit: "adimensional",
      interaction: numberInteraction("λ", ""),
      hints: ["Dos vectores no nulos son perpendiculares cuando A · B = 0."],
      solution: solution(`${a1}(${b1}) + λ(${b2}) + ${a3}(${b3}) = 0.`, `Al despejar, λ = ${lambda}.`),
      commonErrors: ["vector-magnitude-component"],
    }),
  }),
  family({
    id: "family-u1-distance-displacement",
    topic: "movimiento-1d",
    subtopic: "referencia-y-posicion",
    type: "numerical",
    representation: "numerical",
    cognitiveLevel: "apply",
    difficulty: 2,
    objectives: ["Distinguir distancia recorrida y desplazamiento en una trayectoria unidimensional."],
    constraints: { turningPointRequired: true, distanceGreaterThanDisplacementMagnitude: true },
    interaction: { kind: "multiNumber" },
    generateParameters: (random) => {
      const start = integerBetween(-8, 6, random);
      const middle = start + choose([5, 7, 9, 12], random);
      const final = middle - choose([2, 4, 6, 8], random);
      return { start, middle, final };
    },
    build: ({ start, middle, final }) => {
      const distance = Math.abs(middle - start) + Math.abs(final - middle);
      const displacement = final - start;
      return {
        title: "Distancia y desplazamiento",
        prompt: `Una partícula parte de x = ${start} m, se mueve hasta x = ${middle} m y termina en x = ${final} m. Calcula la distancia total y el desplazamiento.`,
        answer: { kind: "values", values: [
          { symbol: "distancia", value: distance, unit: "m" }, { symbol: "Δx", value: displacement, unit: "m" },
        ] },
        tolerance: 0,
        expectedUnit: "m",
        interaction: valuesInteraction([["distance", "Distancia", "m"], ["displacement", "Δx", "m"]]),
        hints: ["La distancia suma longitudes; el desplazamiento es x_f − x_i."],
        solution: solution(`d = |${middle} − (${start})| + |${final} − ${middle}| = ${distance} m.`, `Δx = ${final} − (${start}) = ${displacement} m.`),
        commonErrors: ["kinematics-distance-displacement"],
      };
    },
  }),
  family({
    id: "family-u1-average-velocity",
    topic: "movimiento-1d",
    subtopic: "velocidad-y-rapidez",
    type: "numerical",
    representation: "numerical",
    cognitiveLevel: "apply",
    difficulty: 2,
    objectives: ["Calcular velocidad media a partir de desplazamiento e intervalo temporal."],
    constraints: { positiveDuration: true, signedDisplacement: true },
    interaction: { kind: "number" },
    generateParameters: (random) => {
      const ti = integerBetween(0, 4, random); const duration = choose([2, 4, 5, 8], random);
      const xi = integerBetween(-12, 12, random); const velocity = choose([-6, -4, -2, 2, 3, 5], random);
      return { xi, xf: xi + velocity * duration, ti, tf: ti + duration };
    },
    build: ({ xi, xf, ti, tf }) => {
      const velocity = (xf - xi) / (tf - ti);
      return {
        title: "Velocidad media con signo",
        prompt: `Una partícula está en xᵢ = ${xi} m cuando tᵢ = ${ti} s y en x_f = ${xf} m cuando t_f = ${tf} s. Calcula su velocidad media.`,
        answer: { kind: "number", value: velocity, display: `${velocity} m/s` },
        tolerance: 0.001,
        expectedUnit: "m/s",
        interaction: numberInteraction("Velocidad media", "m/s"),
        hints: ["Usa (x_f − xᵢ)/(t_f − tᵢ), conservando el signo."],
        solution: solution(`v̄ = [${xf} − (${xi})]/(${tf} − ${ti}).`, `v̄ = ${velocity} m/s.`),
        commonErrors: ["kinematics-distance-average-velocity"],
      };
    },
  }),
  family({
    id: "family-u1-signs-speed",
    topic: "movimiento-1d",
    subtopic: "aceleracion-y-signos",
    type: "conceptual",
    representation: "verbal",
    cognitiveLevel: "understand",
    difficulty: 2,
    objectives: ["Relacionar los signos de velocidad y aceleración con el cambio de rapidez."],
    constraints: { combinations: ["++", "+-", "-+", "--"] },
    interaction: { kind: "singleChoice" },
    generateParameters: (random) => choose([
      { velocitySign: 1, accelerationSign: 1 }, { velocitySign: 1, accelerationSign: -1 },
      { velocitySign: -1, accelerationSign: 1 }, { velocitySign: -1, accelerationSign: -1 },
    ], random),
    build: ({ velocitySign, accelerationSign }) => {
      const increases = velocitySign === accelerationSign;
      return {
        title: "Signos de velocidad y aceleración",
        prompt: `En cierto instante v es ${velocitySign > 0 ? "positiva" : "negativa"} y a es ${accelerationSign > 0 ? "positiva" : "negativa"}. ¿Qué ocurre con la rapidez en ese instante?`,
        answer: { kind: "text", value: increases ? "Aumenta." : "Disminuye." },
        tolerance: null,
        expectedUnit: null,
        interaction: singleChoice([["increase", "Aumenta."], ["decrease", "Disminuye."], ["constant", "Permanece constante."], ["unknown", "No puede determinarse con los signos."]], increases ? "increase" : "decrease"),
        hints: ["Compara si v y a tienen el mismo signo."],
        solution: solution(`v y a ${increases ? "tienen" : "no tienen"} el mismo signo.`, `La rapidez ${increases ? "aumenta" : "disminuye"}.`),
        commonErrors: ["kinematics-negative-acceleration-slowing", "kinematics-negative-velocity-slowing"],
      };
    },
  }),
  family({
    id: "family-u1-constant-velocity",
    topic: "ecuaciones-movimiento",
    subtopic: "aceleracion-constante",
    type: "numerical",
    representation: "numerical",
    cognitiveLevel: "apply",
    difficulty: 2,
    objectives: ["Aplicar v = v₀ + at con signos coherentes."],
    constraints: { positiveTime: true, boundedVelocity: true },
    interaction: { kind: "number" },
    generateParameters: (random) => ({ v0: integerBetween(-8, 12, random), a: choose([-4, -2, -1, 1, 2, 3], random), t: choose([2, 3, 4, 5], random) }),
    build: ({ v0, a, t }) => {
      const v = v0 + a * t;
      return {
        title: "Velocidad con aceleración constante",
        prompt: `Un móvil tiene v₀ = ${v0} m/s y aceleración constante a = ${a} m/s². Determina v después de ${t} s.`,
        answer: { kind: "number", value: v, display: `${v} m/s` }, tolerance: 0.001, expectedUnit: "m/s",
        interaction: numberInteraction("Velocidad final", "m/s"), hints: ["Usa v = v₀ + at."],
        solution: solution(`v = ${v0} + (${a})(${t}).`, `v = ${v} m/s.`), commonErrors: ["constant-match-symbols"],
      };
    },
  }),
  family({
    id: "family-u1-constant-displacement",
    topic: "ecuaciones-movimiento",
    subtopic: "aceleracion-constante",
    type: "numerical",
    representation: "numerical",
    cognitiveLevel: "apply",
    difficulty: 2,
    objectives: ["Aplicar la ecuación de desplazamiento con aceleración constante."],
    constraints: { positiveTime: true, boundedDisplacement: true },
    interaction: { kind: "number" },
    generateParameters: (random) => ({ v0: integerBetween(-4, 10, random), a: choose([-3, -2, -1, 1, 2, 3], random), t: choose([2, 3, 4, 5], random) }),
    build: ({ v0, a, t }) => {
      const dx = v0 * t + 0.5 * a * t ** 2;
      return {
        title: "Desplazamiento con aceleración constante",
        prompt: `Un móvil parte con v₀ = ${v0} m/s y mantiene a = ${a} m/s² durante ${t} s. Calcula su desplazamiento.`,
        answer: { kind: "number", value: dx, display: `${dx} m` }, tolerance: 0.001, expectedUnit: "m",
        interaction: numberInteraction("Desplazamiento", "m"), hints: ["Usa Δx = v₀t + ½at²."],
        solution: solution(`Δx = (${v0})(${t}) + ½(${a})(${t})².`, `Δx = ${dx} m.`), commonErrors: ["constant-match-symbols"],
      };
    },
  }),
  family({
    id: "family-u1-turning-point",
    topic: "ecuaciones-movimiento",
    subtopic: "cambio-de-sentido",
    type: "numerical",
    representation: "numerical",
    cognitiveLevel: "analyze",
    difficulty: 3,
    objectives: ["Determinar el instante y la posición de detención antes de un cambio de sentido."],
    constraints: { positiveStopTime: true, oppositeVelocityAccelerationSigns: true },
    interaction: { kind: "multiNumber" },
    generateParameters: (random) => ({ v0: choose([6, 8, 10, 12, 15], random), deceleration: choose([2, 3, 4, 5], random) }),
    build: ({ v0, deceleration }) => {
      const a = -deceleration; const t = roundTo(v0 / deceleration); const dx = roundTo(v0 * t + 0.5 * a * t ** 2);
      return {
        title: "Detención y cambio de sentido",
        prompt: `Un móvil parte de x = 0 con v₀ = ${v0} m/s y a = ${a} m/s². Calcula el instante en que se detiene y su desplazamiento hasta allí.`,
        answer: { kind: "values", values: [{ symbol: "t_det", value: t, unit: "s" }, { symbol: "Δx", value: dx, unit: "m" }] },
        tolerance: 0.02, expectedUnit: "s y m", interaction: valuesInteraction([["time", "t_det", "s"], ["dx", "Δx", "m"]]),
        hints: ["En el punto de cambio de sentido, v = 0 instantáneamente."],
        solution: solution(`0 = ${v0} + (${a})t da t = ${t} s.`, `Δx = ${v0}(${t}) + ½(${a})(${t})² = ${dx} m.`),
        commonErrors: ["constant-ignore-turning-point", "constant-zero-velocity-zero-acceleration"],
      };
    },
  }),
  family({
    id: "family-u1-no-time",
    topic: "ecuaciones-movimiento",
    subtopic: "aceleracion-constante",
    type: "numerical",
    representation: "symbolic",
    cognitiveLevel: "apply",
    difficulty: 3,
    objectives: ["Usar la relación cinemática sin tiempo."],
    constraints: { realFinalSpeed: true, boundedRadicand: [4, 400] },
    interaction: { kind: "number" },
    generateParameters: (random) => {
      let v0; let a; let dx; let radicand;
      do { v0 = integerBetween(0, 12, random); a = choose([-3, -2, 1, 2, 3], random); dx = integerBetween(2, 18, random); radicand = v0 ** 2 + 2 * a * dx; } while (radicand < 4 || radicand > 400);
      return { v0, a, dx };
    },
    build: ({ v0, a, dx }) => {
      const v = roundTo(Math.sqrt(v0 ** 2 + 2 * a * dx));
      return {
        title: "Rapidez final sin usar el tiempo",
        prompt: `Un móvil tiene rapidez inicial ${v0} m/s, aceleración constante ${a} m/s² y avanza Δx = ${dx} m. Determina la rapidez final positiva.`,
        answer: { kind: "number", value: v, display: `${v} m/s` }, tolerance: 0.02, expectedUnit: "m/s",
        interaction: numberInteraction("Rapidez final", "m/s"), hints: ["Usa v² = v₀² + 2aΔx y selecciona la raíz compatible con rapidez."],
        solution: solution(`v² = ${v0}² + 2(${a})(${dx}).`, `v = ${v} m/s.`), commonErrors: ["constant-match-symbols"],
      };
    },
  }),
  family({
    id: "family-u1-free-fall",
    topic: "ecuaciones-movimiento",
    subtopic: "caida-libre",
    type: "numerical",
    representation: "numerical",
    cognitiveLevel: "apply",
    difficulty: 3,
    objectives: ["Aplicar un modelo de caída libre con eje y convención de signos explícitos."],
    constraints: { upwardPositive: true, gravity: [9.8, 10], noDrag: true },
    interaction: { kind: "number" },
    generateParameters: (random) => ({ mode: choose(["drop", "top-time", "return-speed", "max-height"], random), g: choose([9.8, 10], random), value: choose([10, 15, 20, 25, 30], random) }),
    build: ({ mode, g, value }) => {
      if (mode === "drop") {
        const time = roundTo(Math.sqrt(2 * value / g));
        return { title: "Caída desde el reposo", prompt: `Una piedra se suelta desde ${value} m. Sin resistencia del aire y con g = ${g} m/s², calcula el tiempo de caída.`, answer: { kind: "number", value: time, display: `${time} s` }, tolerance: 0.02, expectedUnit: "s", interaction: numberInteraction("Tiempo", "s"), hints: ["Con +y hacia arriba: Δy = −½gt²."], solution: solution(`−${value} = −½(${g})t².`, `t = ${time} s.`), commonErrors: ["freefall-gravity-only-down"] };
      }
      const v0 = value;
      if (mode === "top-time") {
        const time = roundTo(v0 / g);
        return { title: "Tiempo hasta la altura máxima", prompt: `Se lanza una pelota verticalmente hacia arriba con v₀ = ${v0} m/s. Usa +y hacia arriba y g = ${g} m/s². Calcula el tiempo hasta la altura máxima.`, answer: { kind: "number", value: time, display: `${time} s` }, tolerance: 0.02, expectedUnit: "s", interaction: numberInteraction("Tiempo", "s"), hints: ["En la altura máxima v = 0, pero a = −g."], solution: solution(`0 = ${v0} − ${g}t.`, `t = ${time} s.`), commonErrors: ["freefall-top-zero-acceleration"] };
      }
      if (mode === "return-speed") {
        return { title: "Velocidad al regresar", prompt: `Una pelota se lanza hacia arriba con v₀ = ${v0} m/s y regresa a la misma altura. Sin resistencia del aire, con +y hacia arriba, ¿cuál es su velocidad al regresar?`, answer: { kind: "number", value: -v0, display: `−${v0} m/s` }, tolerance: 0.001, expectedUnit: "m/s", interaction: numberInteraction("Velocidad de regreso", "m/s"), hints: ["A la misma altura recupera la rapidez, pero desciende."], solution: solution("La simetría energética conserva la magnitud de la velocidad.", `Como regresa hacia −y, v = −${v0} m/s.`), commonErrors: ["freefall-invalid-symmetry"] };
      }
      const height = roundTo(v0 ** 2 / (2 * g));
      return { title: "Altura máxima de un lanzamiento", prompt: `Una pelota se lanza hacia arriba con v₀ = ${v0} m/s. Usa +y hacia arriba y g = ${g} m/s². Calcula el ascenso máximo.`, answer: { kind: "number", value: height, display: `${height} m` }, tolerance: 0.02, expectedUnit: "m", interaction: numberInteraction("Ascenso máximo", "m"), hints: ["En la cima v = 0; usa la relación sin tiempo."], solution: solution(`0 = ${v0}² − 2(${g})Δy.`, `Δy = ${height} m.`), commonErrors: ["freefall-top-zero-acceleration"] };
    },
  }),
  family({
    id: "family-u1-horizontal-projectile",
    topic: "movimiento-2d",
    subtopic: "proyectiles",
    type: "numerical",
    representation: "numerical",
    cognitiveLevel: "analyze",
    difficulty: 3,
    objectives: ["Usar el mismo tiempo en las componentes horizontal y vertical de un proyectil."],
    constraints: { positiveHeight: true, positiveHorizontalSpeed: true, noDrag: true },
    interaction: { kind: "multiNumber" },
    generateParameters: (random) => ({ height: choose([5, 10, 15, 20, 30, 45], random), vx: choose([3, 5, 8, 10, 12], random), g: choose([9.8, 10], random) }),
    build: ({ height, vx, g }) => {
      const time = roundTo(Math.sqrt(2 * height / g)); const range = roundTo(vx * time);
      return {
        title: "Proyectil lanzado horizontalmente",
        prompt: `Un objeto sale horizontalmente con vₓ = ${vx} m/s desde una altura de ${height} m. Sin resistencia del aire y con g = ${g} m/s², calcula el tiempo de caída y el alcance horizontal.`,
        answer: { kind: "values", values: [{ symbol: "t", value: time, unit: "s" }, { symbol: "alcance", value: range, unit: "m" }] },
        tolerance: 0.03, expectedUnit: "s y m", interaction: valuesInteraction([["time", "Tiempo", "s"], ["range", "Alcance", "m"]]),
        hints: ["El tiempo de la caída vertical es el mismo que multiplica vₓ en el movimiento horizontal."],
        solution: solution(`${height} = ½(${g})t² da t = ${time} s.`, `x = vₓt = ${vx}(${time}) = ${range} m.`),
        commonErrors: ["projectile-separate-times", "projectile-horizontal-acceleration"],
      };
    },
  }),
  family({
    id: "family-u1-circular-acceleration",
    topic: "circular-relativo",
    subtopic: "movimiento-circular",
    type: "numerical",
    representation: "numerical",
    cognitiveLevel: "apply",
    difficulty: 2,
    objectives: ["Calcular la aceleración radial sin introducir una fuerza adicional."],
    constraints: { positiveSpeed: true, positiveRadius: true },
    interaction: { kind: "number" },
    generateParameters: (random) => ({ speed: choose([3, 4, 6, 8, 10, 12], random), radius: choose([2, 3, 4, 5, 8, 10], random) }),
    build: ({ speed, radius }) => {
      const acceleration = roundTo(speed ** 2 / radius);
      return {
        title: "Aceleración radial",
        prompt: `Una partícula se mueve en una circunferencia de radio R = ${radius} m con rapidez ${speed} m/s. Calcula la magnitud de su aceleración centrípeta.`,
        answer: { kind: "number", value: acceleration, display: `${acceleration} m/s²` }, tolerance: 0.02, expectedUnit: "m/s²",
        interaction: numberInteraction("Aceleración centrípeta", "m/s²"), hints: ["Usa a_c = v²/R; su dirección es hacia el centro."],
        solution: solution(`a_c = (${speed})²/${radius}.`, `a_c = ${acceleration} m/s² hacia el centro.`), commonErrors: ["circular-new-force", "circular-tangent-acceleration"],
      };
    },
  }),
  family({
    id: "family-u1-relative-velocity-1d",
    topic: "circular-relativo",
    subtopic: "velocidad-relativa",
    type: "numerical",
    representation: "verbal",
    cognitiveLevel: "apply",
    difficulty: 3,
    objectives: ["Componer velocidades unidimensionales declarando marcos y signos."],
    constraints: { signedVelocities: true, explicitFrames: true },
    interaction: { kind: "number" },
    generateParameters: (random) => ({ context: choose(["banda móvil", "plataforma", "vehículo"], random), relative: choose([-5, -3, -2, 2, 3, 5], random), frame: choose([-4, -2, 2, 4, 6], random) }),
    build: ({ context, relative, frame }) => {
      const ground = relative + frame;
      return {
        title: "Velocidad relativa en una dimensión",
        prompt: `Toma +x hacia la derecha. En una ${context}, un objeto tiene velocidad ${relative} m/s respecto al marco móvil, que a su vez lleva ${frame} m/s respecto al suelo. Calcula la velocidad del objeto respecto al suelo.`,
        answer: { kind: "number", value: ground, display: `${ground} m/s` }, tolerance: 0.001, expectedUnit: "m/s",
        interaction: numberInteraction("Velocidad respecto al suelo", "m/s"), hints: ["Escribe v_objeto/suelo = v_objeto/móvil + v_móvil/suelo."],
        solution: solution(`v_obj/suelo = (${relative}) + (${frame}).`, `v_obj/suelo = ${ground} m/s.`), commonErrors: ["relative-index-order", "relative-no-frames"],
      };
    },
  }),
];

export const getUnit1ExerciseFamily = (id) =>
  UNIT_1_EXERCISE_FAMILIES.find((item) => item.id === id);
