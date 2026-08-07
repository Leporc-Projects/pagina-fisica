// Fórmulas de la Unidad 1 expresadas con MathML nativo. FormulaBlock consume
// este contrato y muestra significado, hipótesis y comprobaciones editoriales.
import {
  blockMath,
  frac,
  integral,
  mi,
  mn,
  mo,
  mover,
  mspace,
  row,
  sqrt,
  sub,
  sup,
  unitVector,
  vector,
} from "../../../utils/mathml.js";

const formula = ({
  id,
  label,
  tex,
  body,
  represents,
  variables = [],
  conditions = [],
  interpretation = "",
  dimensions = "",
  commonErrors = [],
  related = [],
}) => ({
  id,
  label,
  mathml: blockMath(label, tex, body),
  represents,
  variables,
  conditions,
  interpretation,
  dimensions,
  commonErrors,
  related,
});

export const UNIT_1_FORMULAS = {
  "dimensional-velocity": formula({
    id: "dimensional-velocity",
    label: "Dimensión de la velocidad igual a longitud sobre tiempo",
    tex: "[v]=L T^{-1}",
    body: row(
      mo("["), mi("v"), mo("]"), mo("="), mi("L"),
      sup(mi("T"), row(mo("−"), mn("1")))
    ),
    represents: "La estructura dimensional de cualquier velocidad.",
    variables: [
      { symbol: "L", meaning: "dimensión de longitud" },
      { symbol: "T", meaning: "dimensión de tiempo" },
    ],
    conditions: ["La unidad concreta puede cambiar, pero debe ser compatible con L/T."],
    dimensions: "En el SI, L/T se representa mediante m/s.",
    commonErrors: ["Confundir dimensión con unidad específica."],
  }),

  "vector-magnitude": formula({
    id: "vector-magnitude",
    label: "Magnitud de un vector cartesiano tridimensional",
    tex: "A=\\sqrt{A_x^2+A_y^2+A_z^2}",
    body: row(
      mi("A"), mo("="), sqrt(row(
        sup(sub(mi("A"), mi("x")), mn("2")), mo("+"),
        sup(sub(mi("A"), mi("y")), mn("2")), mo("+"),
        sup(sub(mi("A"), mi("z")), mn("2"))
      ))
    ),
    represents: "La longitud del vector A en una base cartesiana ortonormal.",
    variables: [
      { symbol: "Aₓ, Aᵧ, A_z", meaning: "componentes cartesianas de A" },
    ],
    conditions: ["Los ejes de la base son mutuamente perpendiculares y los unitarios tienen magnitud uno."],
    interpretation: "La magnitud es no negativa aunque alguna componente sea negativa.",
    dimensions: "Todos los términos elevados al cuadrado deben tener la misma dimensión.",
    commonErrors: ["Interpretar una componente negativa como una magnitud negativa."],
  }),

  "vector-components": formula({
    id: "vector-components",
    label: "Componentes de un vector plano a partir de su magnitud y ángulo",
    tex: "A_x=A\\cos\\theta,\\quad A_y=A\\sin\\theta",
    body: row(
      sub(mi("A"), mi("x")), mo("="), mi("A"), mi("cos"), mi("θ"),
      mo(","), mspace(),
      sub(mi("A"), mi("y")), mo("="), mi("A"), mi("sin"), mi("θ"))
    ,
    represents: "Las proyecciones cartesianas de A en el plano.",
    variables: [
      { symbol: "A", meaning: "magnitud del vector" },
      { symbol: "θ", meaning: "ángulo medido desde +x" },
    ],
    conditions: ["θ se mide desde el eje +x y los signos se determinan con el cuadrante."],
    interpretation: "Coseno acompaña al cateto adyacente al ángulo definido; seno, al opuesto.",
    commonErrors: ["Intercambiar seno y coseno sin revisar desde qué eje se mide θ."],
    related: ["vector-magnitude"],
  }),

  "dot-product": formula({
    id: "dot-product",
    label: "Producto escalar de dos vectores",
    tex: "\\vec A\\cdot\\vec B=AB\\cos\\theta",
    body: row(vector("A"), mo("·"), vector("B"), mo("="), mi("A"), mi("B"), mi("cos"), mi("θ")),
    represents: "Una medida escalar de la alineación entre A y B.",
    variables: [{ symbol: "θ", meaning: "ángulo menor entre A y B" }],
    conditions: ["A y B se miden en un espacio euclidiano con el mismo sistema de unidades por componente."],
    interpretation: "Es positivo para ángulo agudo, cero para vectores perpendiculares y negativo para ángulo obtuso.",
    dimensions: "Tiene la dimensión del producto de las magnitudes A y B.",
    commonErrors: ["Olvidar que el resultado es un escalar."],
  }),

  "cross-product": formula({
    id: "cross-product",
    label: "Magnitud del producto vectorial de dos vectores",
    tex: "|\\vec A\\times\\vec B|=AB\\sin\\theta",
    body: row(mo("|"), vector("A"), mo("×"), vector("B"), mo("|"), mo("="), mi("A"), mi("B"), mi("sin"), mi("θ")),
    represents: "La magnitud del vector perpendicular a A y B.",
    variables: [{ symbol: "θ", meaning: "ángulo menor entre A y B" }],
    conditions: ["La dirección se completa con la regla de la mano derecha."],
    interpretation: "La magnitud coincide con el área del paralelogramo construido con A y B.",
    commonErrors: ["Tratar A×B como conmutativo; B×A tiene sentido opuesto."],
  }),

  "average-velocity": formula({
    id: "average-velocity",
    label: "Velocidad media en una dimensión",
    tex: "v_{med}=\\frac{\\Delta x}{\\Delta t}",
    body: row(sub(mi("v"), mi("med")), mo("="), frac(row(mo("Δ"), mi("x")), row(mo("Δ"), mi("t")))),
    represents: "El desplazamiento por unidad de tiempo durante un intervalo.",
    variables: [
      { symbol: "Δx", meaning: "x_f − x_i", unit: "m" },
      { symbol: "Δt", meaning: "t_f − t_i", unit: "s" },
    ],
    conditions: ["Δt es positivo y los dos eventos se describen en el mismo sistema de referencia."],
    interpretation: "Su signo representa el sentido del desplazamiento neto.",
    dimensions: "L/T; en SI, m/s.",
    commonErrors: ["Usar distancia recorrida en lugar de desplazamiento."],
  }),

  "instantaneous-velocity": formula({
    id: "instantaneous-velocity",
    label: "Velocidad instantánea como derivada de la posición",
    tex: "v=\\frac{dx}{dt}",
    body: row(mi("v"), mo("="), frac(row(mi("d"), mi("x")), row(mi("d"), mi("t")))),
    represents: "La razón de cambio instantánea de la posición.",
    conditions: ["x(t) es diferenciable en el instante considerado."],
    interpretation: "Es la pendiente de la tangente a la gráfica x(t).",
    dimensions: "L/T.",
    commonErrors: ["Confundir el valor de x con la pendiente de x(t)."],
    related: ["average-velocity"],
  }),

  "average-acceleration": formula({
    id: "average-acceleration",
    label: "Aceleración media en una dimensión",
    tex: "a_{med}=\\frac{\\Delta v}{\\Delta t}",
    body: row(sub(mi("a"), mi("med")), mo("="), frac(row(mo("Δ"), mi("v")), row(mo("Δ"), mi("t")))),
    represents: "El cambio de velocidad por unidad de tiempo durante un intervalo.",
    variables: [{ symbol: "Δv", meaning: "v_f − v_i", unit: "m/s" }],
    conditions: ["Las velocidades se expresan respecto al mismo eje y marco."],
    dimensions: "L/T²; en SI, m/s².",
    commonErrors: ["Interpretar aceleración negativa como disminución automática de rapidez."],
  }),

  "instantaneous-acceleration": formula({
    id: "instantaneous-acceleration",
    label: "Aceleración instantánea como derivada de la velocidad y segunda derivada de la posición",
    tex: "a=\\frac{dv}{dt}=\\frac{d^2x}{dt^2}",
    body: row(
      mi("a"), mo("="), frac(row(mi("d"), mi("v")), row(mi("d"), mi("t"))),
      mo("="), frac(row(sup(mi("d"), mn("2")), mi("x")), row(mi("d"), sup(mi("t"), mn("2"))))
    ),
    represents: "La razón de cambio instantánea de la velocidad.",
    conditions: ["v(t) es diferenciable; para la segunda igualdad, x(t) es dos veces diferenciable."],
    interpretation: "Es la pendiente de v(t).",
    dimensions: "L/T².",
    related: ["instantaneous-velocity"],
  }),

  "constant-velocity": formula({
    id: "constant-velocity",
    label: "Velocidad para aceleración constante",
    tex: "v=v_0+at",
    body: row(mi("v"), mo("="), sub(mi("v"), mn("0")), mo("+"), mi("a"), mi("t")),
    represents: "La velocidad después de un intervalo t con aceleración constante.",
    conditions: ["a es constante durante todo el intervalo y t se mide desde la condición inicial."],
    interpretation: "v(t) es una recta cuya pendiente es a.",
    dimensions: "Cada término tiene dimensión L/T.",
    commonErrors: ["Usarla cuando a cambia con el tiempo."],
  }),

  "constant-position": formula({
    id: "constant-position",
    label: "Posición para aceleración constante",
    tex: "x=x_0+v_0t+\\frac12at^2",
    body: row(
      mi("x"), mo("="), sub(mi("x"), mn("0")), mo("+"), sub(mi("v"), mn("0")), mi("t"),
      mo("+"), frac(mn("1"), mn("2")), mi("a"), sup(mi("t"), mn("2"))
    ),
    represents: "La posición después de un intervalo t con aceleración constante.",
    conditions: ["a es constante y x₀, v₀ corresponden al inicio del intervalo."],
    interpretation: "x(t) es cuadrática; su pendiente local coincide con v(t).",
    dimensions: "x₀, v₀t y ½at² tienen dimensión de longitud.",
    commonErrors: ["Omitir la posición inicial o perder el signo de a."],
  }),

  "constant-no-time": formula({
    id: "constant-no-time",
    label: "Relación cinemática sin tiempo para aceleración constante",
    tex: "v^2=v_0^2+2a(x-x_0)",
    body: row(
      sup(mi("v"), mn("2")), mo("="), sup(sub(mi("v"), mn("0")), mn("2")),
      mo("+"), mn("2"), mi("a"), mo("("), mi("x"), mo("−"), sub(mi("x"), mn("0")), mo(")")
    ),
    represents: "La relación entre velocidad y desplazamiento sin usar explícitamente el tiempo.",
    conditions: ["a es constante durante el desplazamiento considerado."],
    interpretation: "Conserva información sobre v²; el sentido de v debe decidirse con el contexto.",
    dimensions: "Ambos lados tienen dimensión L²/T².",
    commonErrors: ["Tomar automáticamente la raíz positiva al despejar v."],
  }),

  "constant-average-displacement": formula({
    id: "constant-average-displacement",
    label: "Desplazamiento mediante velocidad promedio con aceleración constante",
    tex: "\\Delta x=\\frac{v_0+v}{2}t",
    body: row(
      mo("Δ"), mi("x"), mo("="), frac(row(sub(mi("v"), mn("0")), mo("+"), mi("v")), mn("2")), mi("t")
    ),
    represents: "El área algebraica bajo una velocidad que cambia linealmente.",
    conditions: ["Solo para aceleración constante durante el intervalo."],
    interpretation: "(v₀+v)/2 es la velocidad media porque v(t) es lineal.",
    commonErrors: ["Usar este promedio cuando la aceleración no es constante."],
  }),

  "integrated-velocity": formula({
    id: "integrated-velocity",
    label: "Velocidad obtenida por integración de la aceleración",
    tex: "v(t)=v_0+\\int_{t_0}^{t}a(\\tau)d\\tau",
    body: row(
      mi("v"), mo("("), mi("t"), mo(")"), mo("="), sub(mi("v"), mn("0")), mo("+"),
      integral(sub(mi("t"), mn("0")), mi("t")), mi("a"), mo("("), mi("τ"), mo(")"), mi("dτ")
    ),
    represents: "La velocidad como condición inicial más el cambio acumulado.",
    conditions: ["a(t) es integrable en el intervalo y v₀ corresponde a t₀."],
    interpretation: "El área algebraica bajo a(t) es Δv, no v por sí sola.",
    dimensions: "(L/T²)·T = L/T.",
  }),

  "integrated-position": formula({
    id: "integrated-position",
    label: "Posición obtenida por integración de la velocidad",
    tex: "x(t)=x_0+\\int_{t_0}^{t}v(\\tau)d\\tau",
    body: row(
      mi("x"), mo("("), mi("t"), mo(")"), mo("="), sub(mi("x"), mn("0")), mo("+"),
      integral(sub(mi("t"), mn("0")), mi("t")), mi("v"), mo("("), mi("τ"), mo(")"), mi("dτ")
    ),
    represents: "La posición como condición inicial más el desplazamiento acumulado.",
    conditions: ["v(t) es integrable en el intervalo y x₀ corresponde a t₀."],
    interpretation: "El área algebraica bajo v(t) es Δx.",
    dimensions: "(L/T)·T = L.",
  }),

  "position-vector": formula({
    id: "position-vector",
    label: "Vector posición cartesiano en tres dimensiones",
    tex: "\\vec r(t)=x(t)\\hat i+y(t)\\hat j+z(t)\\hat k",
    body: row(
      vector("r"), mo("("), mi("t"), mo(")"), mo("="),
      mi("x"), mo("("), mi("t"), mo(")"), unitVector("i"), mo("+"),
      mi("y"), mo("("), mi("t"), mo(")"), unitVector("j"), mo("+"),
      mi("z"), mo("("), mi("t"), mo(")"), unitVector("k")
    ),
    represents: "La ubicación de la partícula respecto al origen cartesiano.",
    conditions: ["i, j y k forman una base cartesiana fija."],
    dimensions: "Cada componente tiene dimensión de longitud.",
  }),

  "velocity-vector": formula({
    id: "velocity-vector",
    label: "Velocidad vectorial como derivada de la posición",
    tex: "\\vec v=\\frac{d\\vec r}{dt}",
    body: row(vector("v"), mo("="), frac(row(mi("d"), vector("r")), row(mi("d"), mi("t")))),
    represents: "La razón de cambio del vector posición.",
    conditions: ["r(t) es diferenciable en el instante considerado."],
    interpretation: "v es tangente a la trayectoria cuando la rapidez es distinta de cero.",
    dimensions: "L/T.",
  }),

  "acceleration-vector": formula({
    id: "acceleration-vector",
    label: "Aceleración vectorial como derivada de la velocidad",
    tex: "\\vec a=\\frac{d\\vec v}{dt}",
    body: row(vector("a"), mo("="), frac(row(mi("d"), vector("v")), row(mi("d"), mi("t")))),
    represents: "La razón de cambio del vector velocidad.",
    conditions: ["v(t) es diferenciable en el instante considerado."],
    interpretation: "Puede cambiar rapidez, dirección o ambas.",
    dimensions: "L/T².",
  }),

  "projectile-acceleration": formula({
    id: "projectile-acceleration",
    label: "Componentes de aceleración de un proyectil ideal",
    tex: "a_x=0,\\quad a_y=-g",
    body: row(sub(mi("a"), mi("x")), mo("="), mn("0"), mo(","), mspace(), sub(mi("a"), mi("y")), mo("="), mo("−"), mi("g")),
    represents: "La aceleración en el modelo ideal de proyectil.",
    conditions: ["Resistencia del aire despreciable, g aproximadamente constante y +y hacia arriba."],
    interpretation: "La aceleración horizontal es cero; la vertical apunta hacia abajo durante todo el vuelo.",
    commonErrors: ["Suponer que aᵧ se hace cero en el punto más alto."],
  }),

  "projectile-position": formula({
    id: "projectile-position",
    label: "Posición de un proyectil ideal en componentes",
    tex: "x=x_0+v_{0x}t,\\quad y=y_0+v_{0y}t-\\frac12gt^2",
    body: row(
      mi("x"), mo("="), sub(mi("x"), mn("0")), mo("+"), sub(mi("v"), row(mn("0"), mi("x"))), mi("t"),
      mo(","), mspace(), mi("y"), mo("="), sub(mi("y"), mn("0")), mo("+"),
      sub(mi("v"), row(mn("0"), mi("y"))), mi("t"), mo("−"), frac(mn("1"), mn("2")), mi("g"), sup(mi("t"), mn("2"))
    ),
    represents: "La posición horizontal y vertical en función del mismo tiempo.",
    conditions: ["Las mismas hipótesis del proyectil ideal y ejes cartesianos fijos."],
    interpretation: "x(t) es lineal y y(t) es cuadrática; al eliminar t se obtiene una parábola.",
    commonErrors: ["Usar tiempos distintos para las componentes horizontal y vertical."],
    related: ["projectile-acceleration"],
  }),

  "circular-speed": formula({
    id: "circular-speed",
    label: "Relación entre rapidez lineal y rapidez angular",
    tex: "v=\\omega R",
    body: row(mi("v"), mo("="), mi("ω"), mi("R")),
    represents: "La rapidez tangencial en una circunferencia de radio R.",
    conditions: ["R es constante y ω se expresa en radianes por unidad de tiempo."],
    interpretation: "A igual ω, un punto más alejado del eje recorre más longitud por segundo.",
    dimensions: "(1/T)·L = L/T; el radián es adimensional.",
  }),

  "centripetal-acceleration": formula({
    id: "centripetal-acceleration",
    label: "Aceleración radial en movimiento circular",
    tex: "\\vec a_r=-\\frac{v^2}{R}\\hat r,\\quad a_c=\\frac{v^2}{R}=\\omega^2R",
    body: row(
      sub(vector("a"), mi("r")), mo("="), mo("−"), frac(sup(mi("v"), mn("2")), mi("R")), unitVector("r"),
      mo(","), mspace(), sub(mi("a"), mi("c")), mo("="), frac(sup(mi("v"), mn("2")), mi("R")),
      mo("="), sup(mi("ω"), mn("2")), mi("R")
    ),
    represents: "Dirección vectorial radial y magnitud centrípeta.",
    conditions: ["La trayectoria es circular de radio R en el instante considerado."],
    interpretation: "El signo negativo indica dirección hacia el centro respecto a r̂ saliente.",
    dimensions: "(L/T)²/L = L/T².",
    commonErrors: ["Dibujar la aceleración tangente a la circunferencia."],
  }),

  "relative-velocity": formula({
    id: "relative-velocity",
    label: "Composición clásica de velocidades relativas",
    tex: "\\vec v_{A/C}=\\vec v_{A/B}+\\vec v_{B/C}",
    body: row(
      sub(vector("v"), row(mi("A"), mo("/"), mi("C"))), mo("="),
      sub(vector("v"), row(mi("A"), mo("/"), mi("B"))), mo("+"),
      sub(vector("v"), row(mi("B"), mo("/"), mi("C")))
    ),
    represents: "La velocidad de A respecto a C mediante un marco intermedio B.",
    conditions: ["Composición galileana en marcos clásicos; todos los vectores usan ejes compatibles."],
    interpretation: "Los subíndices interiores B se encadenan y el resultado conecta A con C.",
    commonErrors: ["Cambiar el orden de los subíndices sin invertir el vector."],
  }),

  "polar-velocity": formula({
    id: "polar-velocity",
    label: "Velocidad en coordenadas polares",
    tex: "\\vec v=\\dot r\\hat r+r\\dot\\theta\\hat\\theta",
    body: row(
      vector("v"), mo("="), mover(mi("r"), mo("˙")), unitVector("r"), mo("+"),
      mi("r"), mover(mi("θ"), mo("˙")), unitVector("θ")
    ),
    represents: "La suma de las componentes radial y transversal de la velocidad.",
    conditions: ["r y θ describen la posición en una base polar plana orientada positivamente."],
    interpretation: "ṙ cambia la distancia al origen; rθ̇ produce movimiento transversal.",
    dimensions: "ṙ y rθ̇ tienen dimensión L/T.",
  }),

  "polar-acceleration": formula({
    id: "polar-acceleration",
    label: "Aceleración en coordenadas polares",
    tex: "\\vec a=(\\ddot r-r\\dot\\theta^2)\\hat r+(r\\ddot\\theta+2\\dot r\\dot\\theta)\\hat\\theta",
    body: row(
      vector("a"), mo("="), mo("("), mover(mi("r"), mo("¨")), mo("−"), mi("r"),
      sup(mover(mi("θ"), mo("˙")), mn("2")), mo(")"), unitVector("r"), mo("+"),
      mo("("), mi("r"), mover(mi("θ"), mo("¨")), mo("+"), mn("2"),
      mover(mi("r"), mo("˙")), mover(mi("θ"), mo("˙")), mo(")"), unitVector("θ")
    ),
    represents: "Las componentes radial y transversal de la aceleración en una base móvil.",
    conditions: ["Movimiento plano descrito por funciones r(t) y θ(t) dos veces diferenciables."],
    interpretation: "Para r constante y ω constante queda únicamente −rω² r̂.",
    dimensions: "Cada término tiene dimensión L/T².",
    commonErrors: ["Derivar r y θ ignorando que los vectores unitarios también cambian."],
    related: ["polar-velocity", "centripetal-acceleration"],
  }),
};

export const getUnit1Formula = (id) => UNIT_1_FORMULAS[id];
