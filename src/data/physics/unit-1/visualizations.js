// Especificaciones físicas de las figuras de Unidad 1. Mantienen datos y
// coordenadas del problema separados de los componentes que producen SVG.

const sampleRange = (start, end, count, evaluate) =>
  Array.from({ length: count }, (_, index) => {
    const value = start + (end - start) * index / (count - 1);
    return evaluate(value);
  });

const projectileEnd = 16 / 9.8;
const circularAngle = 50 * Math.PI / 180;
const circularPoint = {
  x: 2.6 * Math.cos(circularAngle),
  y: 2.6 * Math.sin(circularAngle),
};

export const UNIT_1_VISUALIZATIONS = {
  "vector-components": {
    id: "vector-components",
    kind: "diagram",
    explanation:
      "El vector A no cambia al descomponerse: Aₓ y Aᵧ son proyecciones con signo sobre los ejes elegidos y forman el mismo desplazamiento resultante.",
    props: {
      id: "vector-components-diagram",
      title: "Vector A y sus componentes cartesianas",
      description:
        "Un vector A parte del origen y termina en el primer cuadrante. La componente A x es horizontal y la componente A y completa verticalmente el vector.",
      xDomain: [-0.5, 4.2],
      yDomain: [-0.6, 3.4],
      vectors: [
        { start: { x: 0, y: 0 }, end: { x: 3.2, y: 2.4 }, label: "A", style: "primary" },
        { start: { x: 0, y: 0 }, end: { x: 3.2, y: 0 }, label: "Aₓ", style: "secondary" },
        { start: { x: 3.2, y: 0 }, end: { x: 3.2, y: 2.4 }, label: "Aᵧ", style: "tertiary" },
      ],
      segments: [
        { start: { x: -0.35, y: 0 }, end: { x: 3.8, y: 0 }, style: "reference", lineStyle: "solid" },
        { start: { x: 0, y: -0.35 }, end: { x: 0, y: 3.0 }, style: "reference", lineStyle: "solid" },
      ],
      points: [{ x: 0, y: 0, label: "O", style: "reference" }],
    },
  },

  "vector-sum": {
    id: "vector-sum",
    kind: "diagram",
    explanation:
      "La regla punta-cola conserva cada vector. La resultante A+B conecta el origen del primero con la punta del segundo.",
    props: {
      id: "vector-sum-diagram",
      title: "Suma geométrica de los vectores A y B",
      description:
        "A parte del origen. B parte de la punta de A. La resultante A más B conecta el origen con la punta final.",
      xDomain: [-0.5, 4.8],
      yDomain: [-0.5, 3.8],
      vectors: [
        { start: { x: 0, y: 0 }, end: { x: 2.4, y: 1.0 }, label: "A", style: "primary" },
        { start: { x: 2.4, y: 1.0 }, end: { x: 3.7, y: 3.0 }, label: "B", style: "secondary" },
        { start: { x: 0, y: 0 }, end: { x: 3.7, y: 3.0 }, label: "A + B", style: "tertiary", lineStyle: "dashed" },
      ],
      points: [{ x: 0, y: 0, label: "O", style: "reference" }],
    },
  },

  "dot-projection": {
    id: "dot-projection",
    kind: "diagram",
    explanation:
      "La proyección de A sobre la dirección de B mide la parte de A alineada con B. El producto escalar multiplica esa proyección por la magnitud de B.",
    props: {
      id: "dot-projection-diagram",
      title: "Producto escalar interpretado como proyección",
      description:
        "El vector B se ubica sobre el eje horizontal. El vector A forma un ángulo agudo y una guía perpendicular muestra su proyección sobre B.",
      xDomain: [-0.5, 5],
      yDomain: [-0.6, 3.5],
      vectors: [
        { start: { x: 0, y: 0 }, end: { x: 3.2, y: 2.4 }, label: "A", style: "primary" },
        { start: { x: 0, y: 0 }, end: { x: 4.3, y: 0 }, label: "B", style: "secondary" },
        { start: { x: 0, y: 0 }, end: { x: 3.2, y: 0 }, label: "proy_B A", style: "tertiary" },
      ],
      segments: [
        { start: { x: 3.2, y: 0 }, end: { x: 3.2, y: 2.4 }, style: "reference", lineStyle: "dashed" },
      ],
    },
  },

  "position-time": {
    id: "position-time",
    kind: "cartesian",
    relationLabel: "x(t) — su pendiente es v(t)",
    explanation:
      "La curva de posición se hace cada vez más inclinada: la velocidad es positiva y aumenta con el tiempo.",
    props: {
      id: "position-time-chart",
      title: "Posición en función del tiempo",
      description: "Curva x de t igual a uno más dos t más un medio t al cuadrado entre cero y cinco segundos.",
      xAxis: { domain: [0, 5], label: "Tiempo", unit: "s", ticks: 6 },
      yAxis: { domain: [0, 24], label: "Posición", unit: "m", ticks: 5 },
      functions: [
        { id: "position", label: "x(t)", evaluate: (t) => 1 + 2 * t + 0.5 * t ** 2, samples: 61 },
      ],
      references: [{ axis: "x", value: 0, label: "x₀ = 1 m" }],
    },
  },

  "velocity-time": {
    id: "velocity-time",
    kind: "cartesian",
    relationLabel: "v(t) — pendiente: a; área algebraica: Δx",
    explanation:
      "La velocidad crece linealmente. Su pendiente constante vale 1 m/s² y el área algebraica acumulada coincide con el desplazamiento.",
    props: {
      id: "velocity-time-chart",
      title: "Velocidad en función del tiempo",
      description: "Recta v de t igual a dos más t entre cero y cinco segundos.",
      xAxis: { domain: [0, 5], label: "Tiempo", unit: "s", ticks: 6 },
      yAxis: { domain: [0, 8], label: "Velocidad", unit: "m/s", ticks: 5 },
      functions: [
        { id: "velocity", label: "v(t)", evaluate: (t) => 2 + t, samples: 41, mode: "area", baseline: 0 },
      ],
    },
  },

  "acceleration-time": {
    id: "acceleration-time",
    kind: "cartesian",
    relationLabel: "a(t) — su área algebraica es Δv",
    explanation:
      "La aceleración es constante y positiva. El área del rectángulo entre dos instantes representa el aumento de velocidad en ese intervalo.",
    props: {
      id: "acceleration-time-chart",
      title: "Aceleración en función del tiempo",
      description: "Línea horizontal de aceleración igual a un metro por segundo cuadrado entre cero y cinco segundos.",
      xAxis: { domain: [0, 5], label: "Tiempo", unit: "s", ticks: 6 },
      yAxis: { domain: [-0.5, 2], label: "Aceleración", unit: "m/s²", ticks: 6 },
      functions: [
        { id: "acceleration", label: "a(t)", evaluate: () => 1, samples: 21, mode: "area", baseline: 0 },
      ],
      references: [{ axis: "y", value: 0, label: "a = 0" }],
    },
  },

  "constant-acceleration": {
    id: "constant-acceleration",
    kind: "cartesian",
    explanation:
      "La velocidad v(t)=4−1,2t cruza cero: el área positiva anterior al cruce aporta desplazamiento hacia +x y el área posterior aporta desplazamiento hacia −x.",
    props: {
      id: "constant-acceleration-chart",
      title: "Velocidad con aceleración constante y cambio de sentido",
      description: "Recta de velocidad que inicia positiva, cruza cero y se vuelve negativa. Las áreas a cada lado del eje tienen signos opuestos.",
      xAxis: { domain: [0, 6], label: "Tiempo", unit: "s", ticks: 7 },
      yAxis: { domain: [-4, 5], label: "Velocidad", unit: "m/s", ticks: 6 },
      functions: [
        { id: "constant-v", label: "v(t)=4−1,2t", evaluate: (t) => 4 - 1.2 * t, samples: 61, mode: "area", baseline: 0 },
      ],
      references: [{ axis: "x", value: 4 / 1.2, label: "v = 0" }],
      annotations: [{ x: 1.4, y: 2.2, label: "Δx > 0" }, { x: 4.8, y: -1.7, label: "Δx < 0" }],
    },
  },

  "free-fall-position": {
    id: "free-fall-position",
    kind: "cartesian",
    relationLabel: "y(t) durante un lanzamiento vertical",
    explanation:
      "La altura aumenta hasta que la pendiente se hace cero y luego disminuye. La concavidad hacia abajo refleja aᵧ = −g durante todo el intervalo.",
    props: {
      id: "free-fall-position-chart",
      title: "Altura de un lanzamiento vertical ideal",
      description: "Parábola de altura que sube desde dieciocho metros, alcanza un máximo y regresa al suelo con aceleración vertical constante negativa.",
      xAxis: { domain: [0, 2.65], label: "Tiempo", unit: "s", ticks: 6 },
      yAxis: { domain: [0, 21], label: "Altura", unit: "m", ticks: 6 },
      functions: [
        { id: "height", label: "y(t)", evaluate: (t) => 18 + 6 * t - 4.9 * t ** 2, domain: [0, 2.625], samples: 81 },
      ],
      annotations: [{ x: 6 / 9.8, y: 18 + 18 / 9.8, label: "vᵧ = 0; aᵧ = −g" }],
    },
  },

  "free-fall-velocity": {
    id: "free-fall-velocity",
    kind: "cartesian",
    relationLabel: "vᵧ(t) bajo aceleración gravitacional",
    explanation:
      "La velocidad vertical disminuye linealmente. Cruza cero en la altura máxima, pero la pendiente permanece −g.",
    props: {
      id: "free-fall-velocity-chart",
      title: "Velocidad vertical de un lanzamiento ideal",
      description: "Recta con pendiente negativa que inicia en seis metros por segundo y cruza cero antes de hacerse negativa.",
      xAxis: { domain: [0, 2.65], label: "Tiempo", unit: "s", ticks: 6 },
      yAxis: { domain: [-21, 8], label: "Velocidad vertical", unit: "m/s", ticks: 6 },
      functions: [
        { id: "vertical-velocity", label: "vᵧ(t)", evaluate: (t) => 6 - 9.8 * t, domain: [0, 2.625], samples: 61 },
      ],
      references: [{ axis: "x", value: 6 / 9.8, label: "altura máxima" }],
    },
  },

  "projectile-motion": {
    id: "projectile-motion",
    kind: "cartesian",
    explanation:
      "Cada punto corresponde al mismo tiempo en x e y. La separación horizontal uniforme refleja vₓ constante; la curvatura vertical refleja aᵧ = −g.",
    props: {
      id: "projectile-motion-chart",
      title: "Trayectoria de un proyectil ideal",
      description: "Trayectoria parabólica desde el suelo hasta regresar al suelo, con puntos que avanzan en intervalos iguales de tiempo.",
      xAxis: { domain: [0, 12], label: "Posición horizontal", unit: "m", ticks: 7 },
      yAxis: { domain: [0, 4], label: "Altura", unit: "m", ticks: 5 },
      series: [
        {
          id: "trajectory",
          label: "Trayectoria",
          mode: "line-points",
          marker: "circle",
          points: sampleRange(0, projectileEnd, 17, (t) => ({ x: 7 * t, y: 8 * t - 4.9 * t ** 2 })),
        },
      ],
      references: [{ axis: "y", value: 0, label: "suelo" }],
      annotations: [{ x: 7 * 8 / 9.8, y: 32 / 9.8, label: "vᵧ = 0; aᵧ = −g" }],
    },
  },

  "circular-motion": {
    id: "circular-motion",
    kind: "diagram",
    explanation:
      "La velocidad es tangente a la circunferencia. La aceleración radial es perpendicular a la velocidad y apunta hacia el centro, aunque la rapidez sea constante.",
    props: {
      id: "circular-motion-diagram",
      title: "Velocidad tangencial y aceleración radial",
      description: "Una partícula está en el primer cuadrante de una circunferencia. Su velocidad es tangente y su aceleración apunta hacia el centro.",
      xDomain: [-3.5, 4.3],
      yDomain: [-3.5, 4.1],
      circles: [{ center: { x: 0, y: 0 }, radius: 2.6, label: "trayectoria circular", style: "reference" }],
      vectors: [
        {
          start: circularPoint,
          end: { x: circularPoint.x - 1.5 * Math.sin(circularAngle), y: circularPoint.y + 1.5 * Math.cos(circularAngle) },
          label: "v tangente",
          style: "primary",
        },
        { start: circularPoint, end: { x: 0, y: 0 }, label: "a_r", style: "secondary" },
      ],
      points: [{ ...circularPoint, label: "partícula", style: "tertiary" }, { x: 0, y: 0, label: "centro", style: "reference" }],
    },
  },

  "relative-velocity": {
    id: "relative-velocity",
    kind: "diagram",
    explanation:
      "La construcción punta-cola representa v_A/C = v_A/B + v_B/C. Las etiquetas conservan objeto y marco para evitar sumar cantidades ambiguas.",
    props: {
      id: "relative-velocity-diagram",
      title: "Composición de velocidades relativas",
      description: "Dos velocidades relativas se colocan punta-cola y producen una velocidad resultante entre el primer objeto y el marco final.",
      xDomain: [-0.6, 5.2],
      yDomain: [-0.8, 3.8],
      vectors: [
        { start: { x: 0, y: 0 }, end: { x: 2.3, y: 0.8 }, label: "v_A/B", style: "primary" },
        { start: { x: 2.3, y: 0.8 }, end: { x: 4.2, y: 2.8 }, label: "v_B/C", style: "secondary" },
        { start: { x: 0, y: 0 }, end: { x: 4.2, y: 2.8 }, label: "v_A/C", style: "tertiary", lineStyle: "dashed" },
      ],
    },
  },

  "polar-basis": {
    id: "polar-basis",
    kind: "diagram",
    explanation:
      "r̂ apunta desde el origen hacia la partícula y θ̂ es perpendicular en el sentido de aumento de θ. Ambos unitarios rotan cuando cambia el ángulo.",
    props: {
      id: "polar-basis-diagram",
      title: "Base radial y transversal en coordenadas polares",
      description: "Una partícula se encuentra sobre un rayo a cuarenta y cinco grados. El unitario radial apunta hacia afuera y el transversal es perpendicular.",
      xDomain: [-0.7, 4.2],
      yDomain: [-0.7, 4.2],
      vectors: [
        { start: { x: 0, y: 0 }, end: { x: 2.2, y: 2.2 }, label: "r", style: "reference" },
        { start: { x: 2.2, y: 2.2 }, end: { x: 3.2, y: 3.2 }, label: "r̂", style: "primary" },
        { start: { x: 2.2, y: 2.2 }, end: { x: 1.2, y: 3.2 }, label: "θ̂", style: "secondary" },
      ],
      curves: [
        {
          points: sampleRange(0, Math.PI / 4, 21, (angle) => ({ x: 0.8 * Math.cos(angle), y: 0.8 * Math.sin(angle) })),
          label: "ángulo theta",
          style: "tertiary",
          lineStyle: "solid",
        },
      ],
      segments: [
        { start: { x: 0, y: 0 }, end: { x: 3.7, y: 0 }, style: "reference", lineStyle: "solid" },
      ],
      points: [{ x: 2.2, y: 2.2, label: "(r, θ)", style: "tertiary" }],
      annotations: [{ x: 0.65, y: 0.27, label: "θ" }],
    },
  },
};

export const getUnit1Visualization = (id) => UNIT_1_VISUALIZATIONS[id];
