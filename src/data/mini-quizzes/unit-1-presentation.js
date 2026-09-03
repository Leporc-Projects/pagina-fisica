import { presentUnit1RichText } from "../physics/unit-1/math-content.js";
import {
  escapeMathText,
  mathSegment,
  mi,
  mo,
  mover,
  row,
  sqrt,
  sub,
  textSegment,
  unitVector,
  vector,
} from "../../utils/mathml.js";

const range = (start, end, count, evaluate) => Array.from({ length: count }, (_, index) => {
  const x = start + (end - start) * index / (count - 1);
  return evaluate(x);
});

const t = (locale, es, en) => locale === "en" ? en : es;

const cartesianAxes = () => [
  { start: { x: -3.2, y: 0 }, end: { x: 3.2, y: 0 }, label: "x", style: "reference", labelPosition: "beyond-tip" },
  { start: { x: 0, y: -1.1 }, end: { x: 0, y: 3.2 }, label: "y", style: "reference", labelPosition: "beyond-tip" },
];

const visualizationsFor = (locale) => ({
  "mq-v2-u1-c1-5-position-tangent": {
    id: "mq-v2-u1-c1-5-position-tangent",
    kind: "cartesian",
    explanation: t(locale, "La curva y su tangente fijan la pendiente local sin nombrar la velocidad.", "The curve and tangent establish the local slope without naming the velocity."),
    props: {
      id: "mq-v2-u1-c1-5-position-tangent-chart",
      title: t(locale, "Posición y tangente en t₀", "Position and tangent at t₀"),
      description: t(locale, "Gráfica de posición contra tiempo. La curva pasa por diez metros en t sub cero y allí tiene una tangente descendente.", "Position-versus-time graph. The curve passes through ten metres at t sub zero and has a descending tangent there."),
      xAxis: { domain: [0, 4], label: t(locale, "Tiempo", "Time"), unit: "s", ticks: [0, 1, 2, 3, 4] },
      yAxis: { domain: [2, 19], label: t(locale, "Posición", "Position"), unit: "m", ticks: [2, 6, 10, 14, 18] },
      series: [
        { id: "position-curve", label: "x(t)", points: range(0, 4, 61, (time) => ({ x: time, y: 10 - 3 * (time - 2) + 0.55 * (time - 2) ** 2 })) },
        { id: "local-tangent", label: t(locale, "Tangente en t₀", "Tangent at t₀"), lineStyle: "dashed", points: [{ x: 1, y: 13 }, { x: 3, y: 7 }] },
      ],
      references: [{ axis: "x", value: 2, label: "t₀" }],
      annotations: [{ x: 2, y: 10, label: "x=10 m", offset: { x: 8, y: -8 } }],
    },
  },
  "mq-v2-u1-c1-6-negative-velocity-tangent": {
    id: "mq-v2-u1-c1-6-negative-velocity-tangent",
    kind: "cartesian",
    explanation: t(locale, "El punto está bajo el eje y la tangente local desciende; la interpretación queda para el estudiante.", "The point is below the axis and the local tangent descends; interpretation remains for the student."),
    props: {
      id: "mq-v2-u1-c1-6-negative-velocity-tangent-chart",
      title: t(locale, "Velocidad y tangente en t₀", "Velocity and tangent at t₀"),
      description: t(locale, "Gráfica de velocidad contra tiempo. En t sub cero la curva está bajo cero y su tangente tiene pendiente negativa.", "Velocity-versus-time graph. At t sub zero the curve is below zero and its tangent has negative slope."),
      xAxis: { domain: [0, 4], label: t(locale, "Tiempo", "Time"), unit: "s", ticks: [0, 1, 2, 3, 4] },
      yAxis: { domain: [-6, 1], label: t(locale, "Velocidad", "Velocity"), unit: "m/s", ticks: [-6, -4, -2, 0] },
      series: [
        { id: "velocity-curve", label: "v(t)", points: range(0, 4, 61, (time) => ({ x: time, y: -2 - (time - 2) - 0.2 * (time - 2) ** 2 })) },
        { id: "local-tangent", label: t(locale, "Tangente en t₀", "Tangent at t₀"), lineStyle: "dashed", points: [{ x: 1, y: -1 }, { x: 3, y: -3 }] },
      ],
      references: [{ axis: "x", value: 2, label: "t₀" }, { axis: "y", value: 0 }],
    },
  },
  "mq-v2-u1-c1-7-velocity-law": {
    id: "mq-v2-u1-c1-7-velocity-law",
    kind: "cartesian",
    explanation: t(locale, "La recta representa únicamente la ley de velocidad dada en el enunciado.", "The line represents only the velocity law given in the prompt."),
    props: {
      id: "mq-v2-u1-c1-7-velocity-law-chart",
      title: t(locale, "Velocidad entre 0 y 4 s", "Velocity from 0 to 4 s"),
      description: t(locale, "Recta de velocidad que parte de seis metros por segundo, cruza cero a los tres segundos y llega a menos dos metros por segundo a los cuatro segundos.", "Velocity line that starts at six metres per second, crosses zero at three seconds, and reaches minus two metres per second at four seconds."),
      xAxis: { domain: [0, 4], label: t(locale, "Tiempo", "Time"), unit: "s", ticks: [0, 1, 2, 3, 4] },
      yAxis: { domain: [-2, 6], label: t(locale, "Velocidad", "Velocity"), unit: "m/s", ticks: [-2, 0, 2, 4, 6] },
      series: [{ id: "velocity-law", label: "v(t)=6−2t", points: [{ x: 0, y: 6 }, { x: 4, y: -2 }] }],
      references: [{ axis: "x", value: 3, label: "v=0" }],
    },
  },
  "mq-v2-u1-mp-1-acceleration-profile": {
    id: "mq-v2-u1-mp-1-acceleration-profile",
    kind: "cartesian",
    explanation: t(locale, "El perfil reproduce los dos tramos del enunciado sin calificarlos.", "The profile reproduces both prompt intervals without classifying them."),
    props: {
      id: "mq-v2-u1-mp-1-acceleration-profile-chart",
      title: t(locale, "Aceleración por tramos", "Piecewise acceleration"),
      description: t(locale, "La aceleración vale dos metros por segundo cuadrado de cero a cuatro segundos y luego aumenta linealmente hasta seis a los ocho segundos.", "Acceleration is two metres per second squared from zero to four seconds and then increases linearly to six at eight seconds."),
      xAxis: { domain: [0, 8], label: t(locale, "Tiempo", "Time"), unit: "s", ticks: [0, 2, 4, 6, 8] },
      yAxis: { domain: [0, 6], label: t(locale, "Aceleración", "Acceleration"), unit: "m/s²", ticks: [0, 2, 4, 6] },
      series: [{ id: "acceleration-profile", label: "a(t)", mode: "line-points", marker: "circle", points: [{ x: 0, y: 2 }, { x: 4, y: 2 }, { x: 8, y: 6 }] }],
      legend: false,
    },
  },
  "mq-v2-u1-r-4-reversal-velocity": {
    id: "mq-v2-u1-r-4-reversal-velocity",
    kind: "cartesian",
    explanation: t(locale, "La recta muestra el cambio de signo de la velocidad sin calcular áreas ni recorridos.", "The line shows the velocity sign change without calculating areas or path lengths."),
    props: {
      id: "mq-v2-u1-r-4-reversal-velocity-chart",
      title: t(locale, "Velocidad con cambio de sentido", "Velocity with a change of direction"),
      description: t(locale, "Recta de velocidad que parte de cuatro metros por segundo, cruza cero a los dos segundos y llega a menos cuatro a los cuatro segundos.", "Velocity line that starts at four metres per second, crosses zero at two seconds, and reaches minus four at four seconds."),
      xAxis: { domain: [0, 4], label: t(locale, "Tiempo", "Time"), unit: "s", ticks: [0, 1, 2, 3, 4] },
      yAxis: { domain: [-4, 4], label: t(locale, "Velocidad", "Velocity"), unit: "m/s", ticks: [-4, -2, 0, 2, 4] },
      series: [{ id: "reversal-velocity", label: "v(t)=4−2t", points: [{ x: 0, y: 4 }, { x: 4, y: -4 }] }],
      references: [{ axis: "x", value: 2, label: "v=0" }],
    },
  },
  "mq-v2-u1-mc-4-increasing-speed-circle": {
    id: "mq-v2-u1-mc-4-increasing-speed-circle",
    kind: "diagram",
    family: "motion-sketch",
    explanation: t(locale, "La figura fija la posición y la velocidad instantánea; no dibuja ninguna aceleración.", "The figure establishes instantaneous position and velocity; it draws no acceleration."),
    props: {
      id: "mq-v2-u1-mc-4-increasing-speed-circle-diagram",
      title: t(locale, "Partícula en el punto derecho de una circunferencia", "Particle at the rightmost point of a circle"),
      description: t(locale, "Una circunferencia con centro marcado. La partícula está en el extremo derecho y su velocidad instantánea apunta hacia arriba.", "A circle with its centre marked. The particle is at the rightmost point and its instantaneous velocity points upward."),
      xDomain: [-3.2, 4.4], yDomain: [-3.2, 3.8], aspectRatio: 0.9,
      circles: [{ center: { x: 0, y: 0 }, radius: 2.4, label: t(locale, "trayectoria", "path"), style: "reference" }],
      vectors: [{ start: { x: 2.4, y: 0 }, end: { x: 2.4, y: 2.0 }, label: "v", style: "primary", labelPosition: "beyond-tip" }],
      points: [{ x: 0, y: 0, label: t(locale, "centro", "centre"), style: "reference", labelPosition: "below" }, { x: 2.4, y: 0, label: t(locale, "partícula", "particle"), style: "tertiary", labelPosition: "right" }],
    },
  },
  "mq-v2-u1-r-6-circular-geometry": {
    id: "mq-v2-u1-r-6-circular-geometry",
    kind: "diagram",
    family: "motion-sketch",
    explanation: t(locale, "La figura fija la tangente instantánea y deja sin dibujar la aceleración que se debe inferir.", "The figure establishes the instantaneous tangent and leaves the acceleration to be inferred."),
    props: {
      id: "mq-v2-u1-r-6-circular-geometry-diagram",
      title: t(locale, "Partícula en el punto izquierdo de una circunferencia", "Particle at the leftmost point of a circle"),
      description: t(locale, "Una circunferencia con centro marcado. La partícula está en el extremo izquierdo y su velocidad instantánea apunta hacia abajo.", "A circle with its centre marked. The particle is at the leftmost point and its instantaneous velocity points downward."),
      xDomain: [-4.4, 3.2], yDomain: [-3.8, 3.2], aspectRatio: 0.9,
      circles: [{ center: { x: 0, y: 0 }, radius: 2.4, label: t(locale, "trayectoria", "path"), style: "reference" }],
      vectors: [{ start: { x: -2.4, y: 0 }, end: { x: -2.4, y: -2.0 }, label: "v", style: "primary", labelPosition: "beyond-tip" }],
      points: [{ x: 0, y: 0, label: t(locale, "centro", "centre"), style: "reference", labelPosition: "below" }, { x: -2.4, y: 0, label: t(locale, "partícula", "particle"), style: "tertiary", labelPosition: "left" }],
    },
  },
  "mq-v2-u1-cp-1-polar-angle": {
    id: "mq-v2-u1-cp-1-polar-angle",
    kind: "diagram",
    family: "vector-geometry",
    explanation: t(locale, "Los ejes, el rayo radial y la orientación angular fijan la geometría sin mostrar la derivada de la base.", "The axes, radial ray, and angular orientation establish the geometry without showing the basis derivative."),
    props: {
      id: "mq-v2-u1-cp-1-polar-angle-diagram",
      title: t(locale, "Geometría polar en θ=90°", "Polar geometry at θ=90°"),
      description: t(locale, "Ejes cartesianos, un rayo desde el origen hasta una partícula sobre el eje y positivo, y una indicación de que theta aumenta en sentido antihorario.", "Cartesian axes, a ray from the origin to a particle on the positive y axis, and an indication that theta increases counterclockwise."),
      xDomain: [-3.4, 3.8], yDomain: [-1.4, 4.1], aspectRatio: 0.8,
      segments: cartesianAxes(),
      vectors: [{ start: { x: 0, y: 0 }, end: { x: 0, y: 2.8 }, label: "r", style: "primary", labelPosition: "left" }],
      curves: [{ points: range(0, Math.PI / 2, 25, (angle) => ({ x: 0.9 * Math.cos(angle), y: 0.9 * Math.sin(angle) })), style: "tertiary" }],
      points: [{ x: 0, y: 2.8, label: t(locale, "partícula", "particle"), style: "tertiary", labelPosition: "right" }],
      annotations: [{ x: 0.75, y: 0.55, label: t(locale, "θ aumenta ↺", "θ increases ↺"), labelPosition: "right" }],
    },
  },
  "mq-v2-u1-cp-4-polar-basis": {
    id: "mq-v2-u1-cp-4-polar-basis",
    kind: "diagram",
    family: "vector-geometry",
    explanation: t(locale, "La figura muestra solo las direcciones de la base polar local; no construye la velocidad resultante.", "The figure shows only the local polar basis directions; it does not construct the resultant velocity."),
    props: {
      id: "mq-v2-u1-cp-4-polar-basis-diagram",
      title: t(locale, "Base polar local en θ=90°", "Local polar basis at θ=90°"),
      description: t(locale, "Ejes cartesianos y una partícula sobre el eje y positivo. Desde la partícula, r sombrero apunta hacia arriba y theta sombrero hacia la izquierda.", "Cartesian axes and a particle on the positive y axis. From the particle, r hat points upward and theta hat points left."),
      xDomain: [-3.8, 3.4], yDomain: [-1.4, 4.6], aspectRatio: 0.85,
      segments: cartesianAxes(),
      vectors: [
        { start: { x: 0, y: 2.2 }, end: { x: 0, y: 3.7 }, label: "r̂", style: "primary", labelPosition: "beyond-tip" },
        { start: { x: 0, y: 2.2 }, end: { x: -1.7, y: 2.2 }, label: "θ̂", style: "secondary", labelPosition: "beyond-tip" },
      ],
      points: [{ x: 0, y: 2.2, label: t(locale, "partícula", "particle"), style: "tertiary", labelPosition: "right" }],
    },
  },
});

export const UNIT_1_MINI_QUIZ_V2_VISUAL_BY_SLOT = Object.freeze({
  "c1-5": "mq-v2-u1-c1-5-position-tangent",
  "c1-6": "mq-v2-u1-c1-6-negative-velocity-tangent",
  "c1-7": "mq-v2-u1-c1-7-velocity-law",
  "mp-1": "mq-v2-u1-mp-1-acceleration-profile",
  "mc-4": "mq-v2-u1-mc-4-increasing-speed-circle",
  "r-4": "mq-v2-u1-r-4-reversal-velocity",
  "r-6": "mq-v2-u1-r-6-circular-geometry",
  "cp-1": "mq-v2-u1-cp-1-polar-angle",
  "cp-4": "mq-v2-u1-cp-4-polar-basis",
});

export const getUnit1MiniQuizV2Visualizations = (locale) => visualizationsFor(locale);

const mathToken = (literal, label, tex, body) => ({
  literal,
  segment: mathSegment({ label, tex, body }),
});

const indexed = (locale, literal, base, index) => mathToken(
  literal,
  t(locale, `${base} sub ${index}`, `${base} sub ${index}`),
  `${base}_{${index}}`,
  sub(mi(base), mi(index)),
);

const relativeVelocity = (locale, literal, index) => mathToken(
  literal,
  t(locale, `vector velocidad sub ${index}`, `velocity vector sub ${index}`),
  `\\vec v_{${index}}`,
  sub(vector("v"), mi(index)),
);

const polarSymbol = (locale, literal, tex, body, esLabel, enLabel) =>
  mathToken(literal, t(locale, esLabel, enLabel), tex, body);

export const UNIT_1_MINI_QUIZ_V2_MATH_OVERRIDE_LITERALS = Object.freeze([
  "sqrt(ad)", "a_r", "a_x", "a_y", "a_θ", "v_x", "v_y", "v_r", "v_θ",
  "r̂", "θ̂", "ṙ", "r̈", "θ̇", "θ̈",
  "v_a/g", "v_a/s", "v_a/t", "v_b/a", "v_b/g", "v_b/t", "v_b/w", "v_p/a", "v_p/g", "v_p/s", "v_w/g",
]);

const v2MathTokens = (locale) => [
  mathToken("sqrt(ad)", t(locale, "raíz cuadrada de a por d", "square root of a times d"), "\\sqrt{ad}", sqrt(row(mi("a"), mi("d")))),
  indexed(locale, "a_r", "a", "r"), indexed(locale, "a_x", "a", "x"), indexed(locale, "a_y", "a", "y"), indexed(locale, "a_θ", "a", "θ"),
  indexed(locale, "v_x", "v", "x"), indexed(locale, "v_y", "v", "y"), indexed(locale, "v_r", "v", "r"), indexed(locale, "v_θ", "v", "θ"),
  polarSymbol(locale, "r̂", "\\hat r", unitVector("r"), "unitario radial", "radial unit vector"),
  polarSymbol(locale, "θ̂", "\\hat\\theta", unitVector("θ"), "unitario theta", "theta unit vector"),
  polarSymbol(locale, "ṙ", "\\dot r", mover(mi("r"), mo("˙")), "r punto", "r dot"),
  polarSymbol(locale, "r̈", "\\ddot r", mover(mi("r"), mo("¨")), "r dos puntos", "r double dot"),
  polarSymbol(locale, "θ̇", "\\dot\\theta", mover(mi("θ"), mo("˙")), "theta punto", "theta dot"),
  polarSymbol(locale, "θ̈", "\\ddot\\theta", mover(mi("θ"), mo("¨")), "theta dos puntos", "theta double dot"),
  ...["a/g", "a/s", "a/t", "b/a", "b/g", "b/t", "b/w", "p/a", "p/g", "p/s", "w/g"].map((index) => relativeVelocity(locale, `v_${index}`, index)),
].sort((first, second) => second.literal.length - first.literal.length);

const applyTokens = (source, tokens) => {
  let segments = [textSegment(source)];
  tokens.forEach((entry) => {
    segments = segments.flatMap((segment) => {
      if (segment.type !== "text" || !segment.value.includes(entry.literal)) return segment;
      const parts = segment.value.split(entry.literal);
      return parts.flatMap((part, index) => [
        ...(index > 0 ? [entry.segment] : []),
        ...(part ? [textSegment(part)] : []),
      ]);
    });
  });
  return segments;
};

// La capa matemática académica preexistente es canónica para la geometría
// MathML, pero sus nombres accesibles son españoles. Este mapa limitado al
// corpus V2 publicado conserva esa estructura y localiza solo la presentación.
const inheritedEnglishMathLabels = Object.freeze({
  "+x": "positive x-axis",
  "-\\vec B": "negative vector B",
  "-x": "negative x-axis",
  "A_{x}": "A sub x",
  "A_{y}": "A sub y",
  "\\Delta v": "delta v",
  "\\Delta x": "delta x",
  "\\mathrm{m/s^2}": "metres per second squared",
  "\\mathrm{m/s^3}": "metres per second cubed",
  "\\mathrm{m/s}": "metres per second",
  "\\vec A\\cdot\\vec B": "A dot B",
  "\\vec A\\times\\vec B": "A cross B",
  "\\vec B\\times\\vec A": "B cross A",
  "\\vec r(t)": "position vector as a function of t",
  "a(t)": "a of t",
  "a_{x}": "a sub x",
  "a_{y}": "a sub y",
  "dv/dt": "derivative of v with respect to t",
  "dx/dt": "derivative of x with respect to t",
  "t^2": "t squared",
  "v(0)": "v of zero",
  "v(t)": "v of t",
  "v_{0}": "v sub zero",
  "v_{A/B}": "velocity of A relative to B",
  "v_{f}": "final velocity",
  "v_{x}": "v sub x",
  "x(t)": "x of t",
  "x_{0}": "x sub zero",
  "x_{f}": "final position",
  "x_{i}": "initial position",
  "|v|": "magnitude of v",
});

const localizeInheritedMathSegment = (segment, locale) => {
  if (locale !== "en" || segment.type !== "math") return segment;
  const label = inheritedEnglishMathLabels[segment.tex];
  if (!label) return segment;
  return {
    ...segment,
    label,
    mathml: segment.mathml.replace(
      /aria-label="[^"]*"/,
      `aria-label="${escapeMathText(label)}"`,
    ),
  };
};

export const presentUnit1MiniQuizV2RichText = (source, locale = "es") => {
  if (typeof source !== "string" || source.length === 0) return source;
  const segments = applyTokens(source, v2MathTokens(locale)).flatMap((segment) => {
    if (segment.type !== "text") return segment;
    const presented = presentUnit1RichText(segment.value);
    return (Array.isArray(presented) ? presented : [textSegment(presented)])
      .map((entry) => localizeInheritedMathSegment(entry, locale));
  });
  return segments.length === 1 && segments[0].type === "text" ? source : segments;
};

const rich = (value, locale) => presentUnit1MiniQuizV2RichText(value, locale);

export const attachUnit1MiniQuizV2Presentation = (record, locale) => ({
  ...record,
  ...(UNIT_1_MINI_QUIZ_V2_VISUAL_BY_SLOT[record.assessmentSlot]
    ? { visualizationId: UNIT_1_MINI_QUIZ_V2_VISUAL_BY_SLOT[record.assessmentSlot] }
    : {}),
  presentation: {
    prompt: rich(record.prompt, locale),
    options: Object.fromEntries(record.interaction.options.map((option) => [option.id, {
      content: rich(option.content, locale),
      ...(option.diagnostic ? { diagnosticFeedback: rich(option.diagnostic.feedback, locale) } : {}),
    }])),
    feedback: {
      correct: rich(record.feedback.correct, locale),
      incorrect: rich(record.feedback.incorrect, locale),
    },
    solution: record.solution.map((step) => ({ title: rich(step.title, locale), text: rich(step.text, locale) })),
  },
});
