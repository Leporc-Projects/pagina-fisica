// Figuras declarativas: enseñan relaciones de fuerza sin añadir simulaciones.
const axes = [
  { start: { x: -0.5, y: 0 }, end: { x: 5.5, y: 0 }, style: "reference" },
  { start: { x: 0, y: -0.5 }, end: { x: 0, y: 4.5 }, style: "reference" },
];
const diagram = (id, explanation, title, description, props) => ({
  id, kind: "diagram", explanation, props: { id: `${id}-diagram`, title, description, xDomain: [-1, 6], yDomain: [-1, 5], ...props },
});

export const UNIT_2_VISUALIZATIONS = {
  "interaction-system-map": diagram(
    "interaction-system-map",
    "La frontera identifica la caja como sistema. La mano y la Tierra pertenecen al entorno, y cada interacción que cruza la frontera aporta una fuerza externa.",
    "Sistema, entorno e interacciones sobre una caja",
    "Una caja dentro de una frontera recibe una fuerza de una mano hacia la derecha y una fuerza gravitacional de la Tierra hacia abajo.",
    {
      rectangles: [{ x: 2, y: 1.4, width: 2, height: 1.5, label: "sistema: caja", style: "region" }],
      vectors: [
        { start: { x: 1.2, y: 2.15 }, end: { x: 2.7, y: 2.15 }, label: "mano → caja", style: "primary" },
        { start: { x: 3, y: 3.8 }, end: { x: 3, y: 2.2 }, label: "Tierra → caja", style: "secondary" },
      ],
      points: [{ x: 0.8, y: 2.15, label: "mano", style: "reference" }, { x: 3, y: 4.35, label: "Tierra", style: "reference" }],
    }
  ),
  "net-force-vector-sum": diagram(
    "net-force-vector-sum",
    "Las fuerzas de 7 N y 3 N actúan sobre el mismo sistema en sentidos opuestos. Su suma es 4 N hacia +x; la resultante se muestra como cálculo, no como una tercera interacción.",
    "Suma de fuerzas colineales",
    "Dos vectores de fuerza opuestos producen una resultante de cuatro newtons hacia la derecha.",
    {
      segments: axes,
      vectors: [
        { start: { x: 2.5, y: 3.5 }, end: { x: 5, y: 3.5 }, label: "7 N", style: "primary" },
        { start: { x: 2.5, y: 2.2 }, end: { x: 1.4, y: 2.2 }, label: "3 N", style: "secondary" },
        { start: { x: 2.5, y: 0.8 }, end: { x: 4, y: 0.8 }, label: "ΣF = 4 N", style: "tertiary", lineStyle: "dashed" },
      ],
    }
  ),
  "first-law-constant-velocity": {
    id: "first-law-constant-velocity", kind: "cartesian",
    relationLabel: "x(t) con velocidad constante",
    explanation: "La recta tiene pendiente constante: el objeto cambia de posición sin aceleración ni fuerza neta.",
    props: {
      id: "first-law-constant-velocity-chart", title: "Movimiento con fuerza neta cero",
      description: "Gráfica lineal de posición frente al tiempo para un objeto con velocidad constante positiva.",
      xAxis: { domain: [0, 5], label: "Tiempo", unit: "s", ticks: 6 },
      yAxis: { domain: [0, 12], label: "Posición", unit: "m", ticks: 7 },
      functions: [{ id: "constant-v", label: "x(t)=2t", evaluate: (t) => 2 * t, samples: 31 }],
    },
  },
  "net-force-acceleration-direction": diagram(
    "net-force-acceleration-direction",
    "La fuerza neta y la aceleración apuntan al norte. La velocidad instantánea puede apuntar al este: la fuerza cambia el vector velocidad.",
    "Velocidad, fuerza neta y aceleración",
    "Desde una partícula, la velocidad apunta a la derecha mientras la fuerza neta y la aceleración apuntan hacia arriba.",
    {
      vectors: [
        { start: { x: 2.5, y: 2 }, end: { x: 5, y: 2 }, label: "v", style: "primary" },
        { start: { x: 2.5, y: 2 }, end: { x: 2.5, y: 4 }, label: "ΣF_ext", style: "secondary" },
        { start: { x: 3.2, y: 2 }, end: { x: 3.2, y: 3.5 }, label: "a", style: "tertiary" },
      ],
      points: [{ x: 2.5, y: 2, label: "sistema", style: "reference" }],
    }
  ),
  "force-acceleration": {
    id: "force-acceleration", kind: "cartesian", relationLabel: "a frente a F_net para m = 2 kg",
    explanation: "La recta pasa por el origen y tiene pendiente 1/m = 0,5 kg⁻¹: duplicar F_net duplica a.",
    props: {
      id: "force-acceleration-chart", title: "Aceleración frente a fuerza neta",
      description: "Recta de aceleración igual a fuerza neta dividida por dos kilogramos.",
      xAxis: { domain: [0, 12], label: "Fuerza neta", unit: "N", ticks: 7 },
      yAxis: { domain: [0, 6], label: "Aceleración", unit: "m/s²", ticks: 7 },
      functions: [{ id: "a-force", label: "a=F_net/2", evaluate: (force) => force / 2, samples: 31 }],
    },
  },
  "mass-acceleration": {
    id: "mass-acceleration", kind: "cartesian", relationLabel: "a frente a m para F_net = 12 N",
    explanation: "La curva inversa muestra que aumentar la masa reduce la aceleración cuando la fuerza neta permanece fija.",
    props: {
      id: "mass-acceleration-chart", title: "Aceleración frente a masa",
      description: "Curva decreciente de aceleración igual a doce newtons divididos por la masa.",
      xAxis: { domain: [1, 12], label: "Masa", unit: "kg", ticks: 6 },
      yAxis: { domain: [0, 12], label: "Aceleración", unit: "m/s²", ticks: 7 },
      functions: [{ id: "a-mass", label: "a=12/m", evaluate: (mass) => 12 / mass, samples: 81 }],
    },
  },
  "mass-vs-weight": diagram(
    "mass-vs-weight",
    "La masa de 10 kg es la misma en ambos lugares. Con g = 9,8 m/s² el peso es 98 N; con g = 1,6 m/s² es 16 N.",
    "La misma masa en dos campos gravitacionales",
    "Dos cuerpos idénticos de diez kilogramos muestran flechas de peso diferentes para dos valores de campo gravitacional.",
    {
      rectangles: [{ x: 0.5, y: 2.5, width: 1.5, height: 1, label: "10 kg", style: "region" }, { x: 4, y: 2.5, width: 1.5, height: 1, label: "10 kg", style: "region" }],
      vectors: [
        { start: { x: 1.25, y: 2.5 }, end: { x: 1.25, y: 0.5 }, label: "W = 98 N", style: "primary" },
        { start: { x: 4.75, y: 2.5 }, end: { x: 4.75, y: 1.7 }, label: "W = 16 N", style: "secondary" },
      ],
      annotations: [{ x: 1.25, y: 4.2, label: "g = 9,8 m/s²" }, { x: 4.75, y: 4.2, label: "g = 1,6 m/s²" }],
    }
  ),
  "third-law-pair": diagram(
    "third-law-pair",
    "Cada flecha está aplicada a un cuerpo distinto. Las fuerzas son simultáneas, de igual magnitud y sentidos opuestos.",
    "Par de interacción entre A y B",
    "Dos cuerpos separados reciben fuerzas de igual longitud y direcciones opuestas, cada una causada por el otro cuerpo.",
    {
      circles: [{ center: { x: 1.5, y: 2.5 }, radius: 0.65, label: "A", style: "primary" }, { center: { x: 4.5, y: 2.5 }, radius: 0.65, label: "B", style: "secondary" }],
      vectors: [
        { start: { x: 1.5, y: 2.5 }, end: { x: 0.2, y: 2.5 }, label: "F_B→A", style: "primary" },
        { start: { x: 4.5, y: 2.5 }, end: { x: 5.8, y: 2.5 }, label: "F_A→B", style: "secondary" },
      ],
    }
  ),
  "third-law-system-boundary": diagram(
    "third-law-system-boundary",
    "Con A como sistema, solo aparece la fuerza de B sobre A. Con A+B como sistema, el par es interno y no pertenece a la suma de fuerzas externas.",
    "Frontera individual y frontera combinada",
    "Dos cuerpos aparecen dentro de una frontera conjunta y una frontera individual resalta que solo una fuerza del par actúa sobre A.",
    {
      rectangles: [{ x: 0.3, y: 0.8, width: 5.4, height: 3.4, label: "sistema A+B", style: "region" }, { x: 0.8, y: 1.5, width: 1.7, height: 2, label: "sistema A", style: "highlight" }],
      points: [{ x: 1.65, y: 2.5, label: "A", style: "primary" }, { x: 4.35, y: 2.5, label: "B", style: "secondary" }],
      vectors: [{ start: { x: 1.65, y: 2.5 }, end: { x: 0.7, y: 2.5 }, label: "B sobre A", style: "primary" }, { start: { x: 4.35, y: 2.5 }, end: { x: 5.3, y: 2.5 }, label: "A sobre B", style: "secondary" }],
    }
  ),
  "free-body-correct": diagram(
    "free-body-correct",
    "El DCL contiene la fuerza de soporte hacia arriba, el peso hacia abajo y la fuerza de la mano hacia +x. No contiene velocidad, ma ni la reacción sobre la mano.",
    "Diagrama de cuerpo libre correcto de una caja",
    "Una caja aislada recibe tres flechas: soporte hacia arriba, peso hacia abajo y empuje hacia la derecha.",
    {
      rectangles: [{ x: 2.3, y: 1.8, width: 1.4, height: 1.2, label: "caja", style: "region" }],
      vectors: [
        { start: { x: 3, y: 2.4 }, end: { x: 3, y: 4.3 }, label: "soporte", style: "primary" },
        { start: { x: 3, y: 2.4 }, end: { x: 3, y: 0.3 }, label: "peso", style: "secondary" },
        { start: { x: 3, y: 2.4 }, end: { x: 5.3, y: 2.4 }, label: "mano sobre caja", style: "tertiary" },
      ],
    }
  ),
  "free-body-components": diagram(
    "free-body-components",
    "Fₓ y Fᵧ son proyecciones de la misma fuerza F sobre los ejes elegidos. Las guías punteadas muestran la descomposición sin sumar interacciones.",
    "Componentes de una fuerza",
    "Una fuerza diagonal desde el origen se descompone en una componente horizontal y otra vertical.",
    {
      segments: axes,
      vectors: [
        { start: { x: 0, y: 0 }, end: { x: 4, y: 3 }, label: "F", style: "primary" },
        { start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, label: "Fₓ", style: "secondary" },
        { start: { x: 4, y: 0 }, end: { x: 4, y: 3 }, label: "Fᵧ", style: "tertiary" },
      ],
    }
  ),
  "inertial-frames": diagram(
    "inertial-frames",
    "Los marcos S y S' se trasladan con velocidad relativa constante V. Comparan velocidades distintas, pero la misma aceleración.",
    "Dos marcos inerciales en traslación relativa",
    "Dos sistemas de ejes paralelos muestran que S prima se mueve hacia la derecha con velocidad constante V respecto a S.",
    {
      segments: [
        { start: { x: 0, y: 1 }, end: { x: 5.5, y: 1 }, style: "reference" },
        { start: { x: 0.8, y: 0.2 }, end: { x: 0.8, y: 3.8 }, style: "reference" },
        { start: { x: 2.2, y: 2 }, end: { x: 5.5, y: 2 }, style: "reference", lineStyle: "dashed" },
        { start: { x: 2.2, y: 1.2 }, end: { x: 2.2, y: 4.4 }, style: "reference", lineStyle: "dashed" },
      ],
      vectors: [{ start: { x: 2.2, y: 3.6 }, end: { x: 4.5, y: 3.6 }, label: "V constante", style: "primary" }],
      annotations: [{ x: 0.8, y: 0.5, label: "S" }, { x: 2.2, y: 1.5, label: "S′" }, { x: 4.8, y: 4.5, label: "a′ = a" }],
    }
  ),
};
