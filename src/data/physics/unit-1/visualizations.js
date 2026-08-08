// Especificaciones físicas de las figuras de Unidad 1. Mantienen datos y
// coordenadas del problema separados de los componentes que producen SVG.

const sampleRange = (start, end, count, evaluate) =>
  Array.from({ length: count }, (_, index) => {
    const value = start + (end - start) * index / (count - 1);
    return evaluate(value);
  });

const integerRange = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index);

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
        { start: { x: 0, y: 0 }, end: { x: 3.2, y: 0 }, label: "Aₓ", mathLabel: { base: "A", sub: "x" }, ariaLabel: "componente x de A", style: "secondary" },
        { start: { x: 3.2, y: 0 }, end: { x: 3.2, y: 2.4 }, label: "Aᵧ", mathLabel: { base: "A", sub: "y" }, ariaLabel: "componente y de A", style: "tertiary" },
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
        { start: { x: 0, y: 0 }, end: { x: 2.4, y: 1.0 }, label: "A", style: "primary", labelOffset: { x: 0.8, y: 1.6 } },
        { start: { x: 2.4, y: 1.0 }, end: { x: 3.7, y: 3.0 }, label: "B", style: "secondary", labelOffset: { x: 1.2, y: -0.3 } },
        { start: { x: 0, y: 0 }, end: { x: 3.7, y: 3.0 }, label: "A + B", style: "tertiary", lineStyle: "dashed", labelOffset: { x: -1, y: -1.8 }, labelAnchor: "end" },
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
        { start: { x: 0, y: 0 }, end: { x: 4.3, y: 0 }, label: "B", style: "secondary", labelPosition: "end", labelOffset: { x: -1.2, y: 2.4 }, labelAnchor: "end" },
        { start: { x: 0, y: 0 }, end: { x: 3.2, y: 0 }, label: "proy_B A", mathLabel: { base: "proy", sub: "B", suffix: "A", baseRole: "operator" }, ariaLabel: "proyección de A sobre B", style: "tertiary", labelOffset: { x: 0, y: -2.4 }, labelAnchor: "middle" },
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
          labelPosition: "end",
          labelOffset: { x: -1.2, y: -1.4 },
          labelAnchor: "end",
        },
        { start: circularPoint, end: { x: 0, y: 0 }, label: "a_r", mathLabel: { base: "a", sub: "r" }, ariaLabel: "aceleración radial", style: "secondary", labelOffset: { x: -2, y: -2 }, labelAnchor: "end" },
      ],
      points: [
        { ...circularPoint, label: "partícula", style: "tertiary", labelOffset: { x: 1.4, y: 2.1 } },
        { x: 0, y: 0, label: "centro", style: "reference", labelOffset: { x: 1.4, y: -1.4 } },
      ],
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
        { start: { x: 0, y: 0 }, end: { x: 2.3, y: 0.8 }, label: "v_A/B", mathLabel: { base: "v", sub: "A/B" }, ariaLabel: "velocidad de A respecto a B", style: "primary", labelOffset: { x: 0.4, y: 1.8 } },
        { start: { x: 2.3, y: 0.8 }, end: { x: 4.2, y: 2.8 }, label: "v_B/C", mathLabel: { base: "v", sub: "B/C" }, ariaLabel: "velocidad de B respecto a C", style: "secondary", labelOffset: { x: 1.2, y: -0.6 } },
        { start: { x: 0, y: 0 }, end: { x: 4.2, y: 2.8 }, label: "v_A/C", mathLabel: { base: "v", sub: "A/C" }, ariaLabel: "velocidad de A respecto a C", style: "tertiary", lineStyle: "dashed", labelOffset: { x: -0.8, y: -1.7 }, labelAnchor: "end" },
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
        { start: { x: 0, y: 0 }, end: { x: 2.2, y: 2.2 }, label: "r", style: "reference", labelOffset: { x: 0.8, y: 1.6 } },
        { start: { x: 2.2, y: 2.2 }, end: { x: 3.2, y: 3.2 }, label: "r̂", style: "primary", labelPosition: "end", labelOffset: { x: -0.8, y: -1.4 }, labelAnchor: "end" },
        { start: { x: 2.2, y: 2.2 }, end: { x: 1.2, y: 3.2 }, label: "θ̂", style: "secondary", labelPosition: "end", labelOffset: { x: 1.2, y: -1.4 } },
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
      points: [{ x: 2.2, y: 2.2, label: "(r, θ)", style: "tertiary", labelOffset: { x: 1.6, y: 2.2 } }],
      annotations: [{ x: 0.65, y: 0.27, label: "θ" }],
    },
  },

  "exercise-position-slope": {
    id: "exercise-position-slope",
    kind: "cartesian",
    explanation: "La información necesaria está en los ejes y en la recta; el enunciado no repite sus coordenadas.",
    props: {
      id: "exercise-position-slope-chart",
      title: "Recta de posición en función del tiempo",
      description: "Gráfica de posición contra tiempo: una recta desciende desde dos metros en cero segundos hasta menos cuatro metros en tres segundos.",
      xAxis: { domain: [0, 3], label: "Tiempo", unit: "s", ticks: [0, 1, 2, 3] },
      yAxis: { domain: [-4, 2], label: "Posición", unit: "m", ticks: [-4, -2, 0, 2] },
      series: [{ id: "position-line", label: "x(t)", mode: "line-points", marker: "circle", points: [{ x: 0, y: 2 }, { x: 3, y: -4 }] }],
      legend: false,
    },
  },

  "vis-position-segments": {
    id: "vis-position-segments",
    kind: "cartesian",
    relationLabel: "La pendiente de cada segmento de x(t) representa su velocidad.",
    explanation: "Lee coordenadas y pendientes directamente de la poligonal antes de distinguir cambio neto y camino total.",
    props: {
      id: "vis-position-segments-chart",
      title: "Posición por tramos",
      description: "La posición pasa por cero metros en cero segundos, cuatro metros en dos segundos, permanece en cuatro metros hasta cinco segundos y termina en menos dos metros a los siete segundos.",
      xAxis: { domain: [0, 7], label: "Tiempo", unit: "s", ticks: [0, 1, 2, 3, 4, 5, 6, 7] },
      yAxis: { domain: [-2, 4], label: "Posición", unit: "m", ticks: [-2, 0, 2, 4] },
      series: [{ id: "position-segments", label: "x(t)", mode: "line-points", marker: "circle", points: [{ x: 0, y: 0 }, { x: 2, y: 4 }, { x: 5, y: 4 }, { x: 7, y: -2 }] }],
      legend: false,
    },
  },

  "vis-velocity-areas": {
    id: "vis-velocity-areas",
    kind: "cartesian",
    relationLabel: "Pendiente: aceleración. Área algebraica: desplazamiento.",
    explanation: "El tramo bajo el eje aporta desplazamiento negativo; para la distancia se suma su magnitud.",
    props: {
      id: "vis-velocity-areas-chart",
      title: "Velocidad por tramos y áreas",
      description: "La velocidad pasa por cero, cuatro, cuatro, cero y menos dos metros por segundo en los tiempos cero, dos, cinco, siete y nueve segundos.",
      xAxis: { domain: [0, 9], label: "Tiempo", unit: "s", ticks: [0, 2, 5, 7, 9] },
      yAxis: { domain: [-2, 4], label: "Velocidad", unit: "m/s", ticks: [-2, 0, 2, 4] },
      series: [{ id: "velocity-segments", label: "v(t)", mode: "area", marker: "circle", baseline: 0, points: [{ x: 0, y: 0 }, { x: 2, y: 4 }, { x: 5, y: 4 }, { x: 7, y: 0 }, { x: 9, y: -2 }] }],
      legend: false,
    },
  },

  "vis-vector-grid": {
    id: "vis-vector-grid",
    kind: "diagram",
    explanation: "La cuadrícula es la fuente de las componentes; no se muestran valores numéricos junto a la flecha.",
    props: {
      id: "vis-vector-grid-diagram",
      title: "Vector A sobre una cuadrícula cartesiana",
      description: "Un vector parte del origen y termina tres unidades a la izquierda y cuatro unidades arriba.",
      xDomain: [-4.5, 1.5],
      yDomain: [-1, 5],
      grid: { x: integerRange(-4, 1), y: integerRange(-1, 5), labels: true },
      vectors: [{ start: { x: 0, y: 0 }, end: { x: -3, y: 4 }, label: "A", style: "primary", labelPosition: "end", labelOffset: { x: 1.2, y: -1.4 } }],
      points: [{ x: 0, y: 0, label: "O", style: "reference", labelOffset: { x: 1.2, y: 2 } }],
    },
  },

  "vis-vector-sum-grid": {
    id: "vis-vector-sum-grid",
    kind: "diagram",
    explanation: "Las dos flechas conservan sus componentes en la traslación punta-cola; la resultante se deja para el estudiante.",
    props: {
      id: "vis-vector-sum-grid-diagram",
      title: "Construcción punta-cola de A más B",
      description: "A va del origen al punto cuatro coma uno. Desde allí B avanza una unidad a la izquierda y tres hacia arriba. No se dibuja la resultante.",
      xDomain: [-1, 5],
      yDomain: [-1, 5],
      grid: { x: integerRange(-1, 5), y: integerRange(-1, 5), labels: true },
      vectors: [
        { start: { x: 0, y: 0 }, end: { x: 4, y: 1 }, label: "A", style: "primary", labelOffset: { x: 0, y: 1.7 } },
        { start: { x: 4, y: 1 }, end: { x: 3, y: 4 }, label: "B", style: "secondary", labelOffset: { x: 1.4, y: -0.4 } },
      ],
      points: [{ x: 0, y: 0, label: "O", style: "reference", labelOffset: { x: 1.2, y: 2 } }],
    },
  },

  "vis-projectile-strobe": {
    id: "vis-projectile-strobe",
    kind: "cartesian",
    explanation: "Los marcadores corresponden a intervalos temporales iguales; la figura no dibuja vectores que adelanten las respuestas.",
    props: {
      id: "vis-projectile-strobe-chart",
      title: "Posiciones de un proyectil a tiempos iguales",
      description: "Once posiciones equiespaciadas horizontalmente forman una trayectoria parabólica desde el suelo hasta regresar a él.",
      xAxis: { domain: [0, 10], label: "Posición horizontal", unit: "m", ticks: 6 },
      yAxis: { domain: [0, 5], label: "Altura", unit: "m", ticks: 6 },
      series: [{ id: "projectile-points", label: "Posiciones", mode: "points", marker: "circle", points: sampleRange(0, 10, 11, (x) => ({ x, y: 0.2 * x * (10 - x) })) }],
      legend: false,
    },
  },

  "vis-circular-directions": {
    id: "vis-circular-directions",
    kind: "diagram",
    explanation: "El círculo y el punto fijan la geometría; no se dibujan las flechas de velocidad ni aceleración que debe inferir el estudiante.",
    props: {
      id: "vis-circular-directions-diagram",
      title: "Partícula en movimiento circular antihorario",
      description: "Una circunferencia con centro marcado y una partícula situada en un punto del primer cuadrante. El movimiento se declara antihorario.",
      xDomain: [-3.5, 3.5],
      yDomain: [-3.5, 3.5],
      circles: [{ center: { x: 0, y: 0 }, radius: 2.6, label: "trayectoria circular", style: "reference" }],
      points: [
        { ...circularPoint, label: "partícula", style: "primary", labelOffset: { x: 1.4, y: -1.8 } },
        { x: 0, y: 0, label: "centro", style: "reference", labelOffset: { x: 1.4, y: -1.4 } },
      ],
      annotations: [{ x: -2.1, y: -2.2, label: "sentido antihorario", offset: { x: 0, y: 0 } }],
    },
  },

  "vis-boat-current": {
    id: "vis-boat-current",
    kind: "diagram",
    explanation: "La construcción separa velocidad respecto al agua, corriente y velocidad respecto al suelo mediante objeto y marco.",
    props: {
      id: "vis-boat-current-diagram",
      title: "Composición vectorial de embarcación y corriente",
      description: "La corriente apunta al este. La velocidad de la embarcación respecto al agua apunta al noroeste y la resultante respecto al suelo es vertical hacia el norte.",
      xDomain: [-2.5, 2.5],
      yDomain: [-0.8, 3.4],
      segments: [
        { start: { x: -2.2, y: 0 }, end: { x: 2.2, y: 0 }, label: "E", style: "reference", lineStyle: "solid", labelPosition: "end", labelOffset: { x: -1, y: 2 }, labelAnchor: "end" },
        { start: { x: 0, y: -0.5 }, end: { x: 0, y: 3.1 }, label: "N", style: "reference", lineStyle: "solid", labelPosition: "end", labelOffset: { x: 1, y: 1.5 } },
      ],
      vectors: [
        { start: { x: 0, y: 0 }, end: { x: -1.5, y: 2 }, label: "barco/agua", ariaLabel: "velocidad de la embarcación respecto al agua, 2,5 metros por segundo", style: "primary", labelOffset: { x: -1, y: -1.5 }, labelAnchor: "end" },
        { start: { x: -1.5, y: 2 }, end: { x: 0, y: 2 }, label: "corriente 1,5 m/s", style: "secondary", labelOffset: { x: 0, y: -1.5 }, labelAnchor: "middle" },
        { start: { x: 0, y: 0 }, end: { x: 0, y: 2 }, label: "respecto al suelo", style: "tertiary", lineStyle: "dashed", labelOffset: { x: 1.4, y: 0 }, labelAnchor: "start" },
      ],
    },
  },

  "vis-vertical-launch-velocity": {
    id: "vis-vertical-launch-velocity",
    kind: "cartesian",
    relationLabel: "El área algebraica bajo v(t) representa desplazamiento.",
    explanation: "La recta y los ejes contienen la ley de velocidad; el enunciado no la entrega como expresión principal.",
    props: {
      id: "vis-vertical-launch-velocity-chart",
      title: "Velocidad de un lanzamiento vertical",
      description: "La velocidad disminuye linealmente desde veinte metros por segundo en cero segundos hasta menos veinte metros por segundo en cuatro segundos y cruza cero en dos segundos.",
      xAxis: { domain: [0, 4], label: "Tiempo", unit: "s", ticks: [0, 1, 2, 3, 4] },
      yAxis: { domain: [-20, 20], label: "Velocidad vertical", unit: "m/s", ticks: [-20, -10, 0, 10, 20] },
      series: [{ id: "vertical-velocity", label: "v(t)", mode: "area", baseline: 0, points: [{ x: 0, y: 20 }, { x: 4, y: -20 }] }],
      legend: false,
    },
  },

  "vis-elevator-profile": {
    id: "vis-elevator-profile",
    kind: "cartesian",
    relationLabel: "La pendiente indica aceleración; el área indica desplazamiento.",
    explanation: "El perfil distingue aceleración, marcha uniforme y frenado sin entregar la descomposición de áreas.",
    props: {
      id: "vis-elevator-profile-chart",
      title: "Perfil de velocidad de un ascensor",
      description: "La velocidad aumenta linealmente de cero a dos metros por segundo entre cero y dos segundos, permanece constante hasta ocho segundos y desciende a cero en diez segundos.",
      xAxis: { domain: [0, 10], label: "Tiempo", unit: "s", ticks: [0, 2, 4, 6, 8, 10] },
      yAxis: { domain: [0, 2.5], label: "Velocidad", unit: "m/s", ticks: [0, 0.5, 1, 1.5, 2, 2.5] },
      series: [{ id: "elevator-velocity", label: "v(t)", mode: "area", baseline: 0, points: [{ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 8, y: 2 }, { x: 10, y: 0 }] }],
      legend: false,
    },
  },

  "vis-stroboscopic-spacing": {
    id: "vis-stroboscopic-spacing",
    kind: "diagram",
    explanation: "Cada marca corresponde a un segundo adicional; usa la geometría de la secuencia como fuente de información.",
    props: {
      id: "vis-stroboscopic-spacing-diagram",
      title: "Posiciones estroboscópicas sobre el eje x",
      description: "Cinco posiciones en cero, uno, tres, seis y diez metros, tomadas a intervalos de un segundo, muestran separaciones crecientes hacia la derecha.",
      xDomain: [-1, 11],
      yDomain: [-1.2, 1.2],
      aspectRatio: 0.5,
      segments: [{ start: { x: -0.7, y: 0 }, end: { x: 10.7, y: 0 }, label: "+x", style: "reference", lineStyle: "solid", labelPosition: "end", labelOffset: { x: -1, y: 4 }, labelAnchor: "end" }],
      points: [0, 1, 3, 6, 10].map((x, index) => ({ x, y: 0, label: `t=${index} s`, style: index === 0 ? "reference" : "primary", labelOffset: { x: 0, y: index % 2 === 0 ? -2 : 3 }, labelAnchor: "middle" })),
    },
  },

  "vis-acceleration-segments": {
    id: "vis-acceleration-segments",
    kind: "cartesian",
    relationLabel: "El área algebraica bajo a(t) es el cambio de velocidad.",
    explanation: "Los saltos separan tres intervalos de aceleración constante; la velocidad inicial debe combinarse con las áreas acumuladas.",
    props: {
      id: "vis-acceleration-segments-chart",
      title: "Aceleración por tramos",
      description: "Aceleración de dos metros por segundo cuadrado entre cero y dos segundos, cero entre dos y cinco, y menos uno entre cinco y nueve segundos.",
      xAxis: { domain: [0, 9], label: "Tiempo", unit: "s", ticks: [0, 2, 5, 7, 9] },
      yAxis: { domain: [-1.5, 2.5], label: "Aceleración", unit: "m/s²", ticks: [-1, 0, 1, 2] },
      series: [{ id: "acceleration-steps", label: "a(t)", mode: "area", baseline: 0, points: [{ x: 0, y: 2 }, { x: 2, y: 2 }, null, { x: 2, y: 0 }, { x: 5, y: 0 }, null, { x: 5, y: -1 }, { x: 9, y: -1 }] }],
      legend: false,
    },
  },

  "vis-parametric-trajectory": {
    id: "vis-parametric-trajectory",
    kind: "diagram",
    explanation: "La curva conserva la escala física en x e y; la orientación local se interpreta mediante su tangente, no por deformación del viewBox.",
    props: {
      id: "vis-parametric-trajectory-diagram",
      title: "Trayectoria paramétrica en el plano",
      description: "Una trayectoria parabólica parte del origen, alcanza el punto cuatro coma cuatro en dos segundos y termina sobre el eje x en ocho metros a los cuatro segundos.",
      xDomain: [-1, 9],
      yDomain: [-1, 5],
      grid: { x: integerRange(0, 8), y: integerRange(0, 5), labels: true },
      curves: [{ points: sampleRange(0, 4, 81, (t) => ({ x: 2 * t, y: 4 * t - t ** 2 })), label: "trayectoria r de t", style: "primary" }],
      points: [{ x: 4, y: 4, label: "t = 2 s", style: "tertiary", labelOffset: { x: 0, y: -1.8 }, labelAnchor: "middle" }],
    },
  },
};

export const getUnit1Visualization = (id) => UNIT_1_VISUALIZATIONS[id];
