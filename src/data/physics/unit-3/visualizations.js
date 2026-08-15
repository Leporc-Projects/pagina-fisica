// Figuras declarativas de Unidad 3. Cada figura declara su familia y su dominio
// real: los valores por defecto solo cubren el caso en que la composición ya
// coincida con ellos, nunca imponen un encuadre común a toda la unidad.
const diagram = (id, family, explanation, title, description, props = {}) => ({
  id, kind: "diagram", family, explanation,
  props: { id: `${id}-diagram`, title, description, xDomain: [-1, 7], yDomain: [-1, 5], ...props },
});

export const UNIT_3_VISUALIZATIONS = {
  "equilibrium-force-polygon": diagram(
    "equilibrium-force-polygon",
    "force-sum",
    "Las tres fuerzas se acomodan punta-cola y cierran el polígono. El cierre representa resultante cero; no aparece una cuarta interacción.",
    "Polígono de fuerzas en equilibrio",
    "Tres vectores de fuerza forman un triángulo cerrado que representa suma vectorial cero.",
    {
      xDomain: [0.6, 6.4],
      yDomain: [0.3, 4.6],
      vectors: [
        { start: { x: 1, y: 1 }, end: { x: 4, y: 1 }, label: "F₁", style: "primary", labelPosition: "below" },
        { start: { x: 4, y: 1 }, end: { x: 2.5, y: 3.6 }, label: "F₂", style: "secondary" },
        { start: { x: 2.5, y: 3.6 }, end: { x: 1, y: 1 }, label: "F₃", style: "tertiary" },
      ],
      annotations: [{ x: 4.6, y: 3.6, label: "polígono cerrado: ΣF=0" }],
    }
  ),

  "equilibrium-two-cables": diagram(
    "equilibrium-two-cables",
    "free-body",
    "Las tensiones siguen los cables. Sus componentes horizontales se cancelan y las verticales sostienen el peso, sin revelar el valor numérico de T.",
    "Lámpara con dos cables simétricos",
    "Una lámpara central recibe dos tensiones inclinadas simétricas y su peso hacia abajo.",
    {
      xDomain: [-1, 7],
      yDomain: [-0.85, 4.45],
      circles: [{ center: { x: 3, y: 1.4 }, radius: 0.45, label: "lámpara", style: "region" }],
      segments: [
        { start: { x: 0.8, y: 4.2 }, end: { x: 3, y: 1.4 }, style: "reference" },
        { start: { x: 5.2, y: 4.2 }, end: { x: 3, y: 1.4 }, style: "reference" },
      ],
      vectors: [
        { start: { x: 3, y: 1.4 }, end: { x: 1.4, y: 3.45 }, label: "T izquierda", style: "primary" },
        { start: { x: 3, y: 1.4 }, end: { x: 4.6, y: 3.45 }, label: "T derecha", style: "secondary" },
        { start: { x: 3, y: 1.4 }, end: { x: 3, y: -0.3 }, label: "peso", style: "tertiary" },
      ],
    }
  ),

  "two-block-system-boundary": diagram(
    "two-block-system-boundary",
    "system-boundary",
    "La frontera pequeña aísla el bloque 2 y muestra el contacto. La frontera grande incluye ambos bloques: el contacto queda interno y desaparece del balance externo.",
    "Fronteras para dos bloques en contacto",
    "Dos bloques tocándose aparecen dentro de una frontera conjunta; otra frontera aísla el segundo bloque y una fuerza externa empuja el primero.",
    {
      xDomain: [-0.15, 5.75],
      yDomain: [0.6, 4],
      // Los bloques se tocan: el contacto solo existe si comparten una cara.
      // Las dos fronteras contienen otros elementos, así que su etiqueta va
      // sobre el borde superior para no caer encima de lo que encierran.
      rectangles: [
        { x: 0.8, y: 1, width: 4.6, height: 2.6, label: "sistema 1+2", style: "region", labelPosition: "above" },
        { x: 3, y: 1.45, width: 2, height: 1.5, label: "sistema 2", style: "highlight", labelPosition: "below" },
        { x: 1.4, y: 1.6, width: 1.8, height: 1.3, label: "m₁", style: "primary" },
        { x: 3.2, y: 1.6, width: 1.6, height: 1.3, label: "m₂", style: "secondary" },
      ],
      vectors: [
        { start: { x: 0.2, y: 2.25 }, end: { x: 1.4, y: 2.25 }, label: "F externa", style: "primary", labelPosition: "above" },
        { start: { x: 3.2, y: 2.7 }, end: { x: 4.3, y: 2.7 }, label: "contacto sobre 2", style: "tertiary", labelPosition: "above" },
      ],
    }
  ),

  "ideal-rope-pulley": diagram(
    "ideal-rope-pulley",
    "free-body",
    "La cuerda ideal transmite la misma magnitud T a ambos lados y obliga a aceleraciones de igual magnitud; los pesos corresponden a sistemas distintos.",
    "Cuerda y polea ideales",
    "Dos masas colgantes unidas por una cuerda sobre una polea muestran tensión hacia arriba y peso hacia abajo en cada masa.",
    {
      xDomain: [-1.5, 7.45],
      yDomain: [-1.15, 4.75],
      circles: [{ center: { x: 3, y: 3.8 }, radius: 0.65, label: "polea ideal", style: "reference" }],
      segments: [
        { start: { x: 1.5, y: 1.4 }, end: { x: 1.5, y: 3.8 }, style: "reference" },
        { start: { x: 4.5, y: 3.8 }, end: { x: 4.5, y: 1.1 }, style: "reference" },
        { start: { x: 1.5, y: 3.8 }, end: { x: 4.5, y: 3.8 }, style: "reference" },
      ],
      rectangles: [
        { x: 0.9, y: 0.7, width: 1.2, height: 0.8, label: "m₁", style: "primary" },
        { x: 3.9, y: 0.4, width: 1.2, height: 0.8, label: "m₂", style: "secondary" },
      ],
      vectors: [
        { start: { x: 1.5, y: 1.5 }, end: { x: 1.5, y: 2.7 }, label: "T", style: "primary" },
        { start: { x: 1.5, y: 0.7 }, end: { x: 1.5, y: -0.2 }, label: "m₁g", style: "tertiary" },
        { start: { x: 4.5, y: 1.2 }, end: { x: 4.5, y: 2.5 }, label: "T", style: "secondary" },
        { start: { x: 4.5, y: 0.4 }, end: { x: 4.5, y: -0.5 }, label: "m₂g", style: "tertiary" },
      ],
    }
  ),

  "normal-incline": diagram(
    "normal-incline",
    "free-body",
    "La normal es perpendicular al plano. La guía mg cosθ es una componente del peso, no una fuerza adicional.",
    "Bloque sobre un plano inclinado",
    "Un bloque sobre una rampa recibe peso vertical y normal perpendicular; una guía punteada indica la componente perpendicular del peso.",
    {
      xDomain: [-0.7, 6.75],
      yDomain: [-0.85, 4.05],
      segments: [
        { start: { x: 0, y: 0 }, end: { x: 6, y: 3 }, style: "reference" },
        { start: { x: 3.1, y: 2 }, end: { x: 1.9, y: 1.4 }, style: "reference", lineStyle: "dashed" },
      ],
      rectangles: [{ x: 2.5, y: 1.5, width: 1.3, height: 0.9, label: "bloque", style: "region", labelPosition: "below" }],
      vectors: [
        { start: { x: 3.15, y: 1.95 }, end: { x: 2.2, y: 3.85 }, label: "N", style: "primary" },
        { start: { x: 3.15, y: 1.95 }, end: { x: 3.15, y: -0.35 }, label: "mg", style: "secondary" },
      ],
      annotations: [{ x: 1.5, y: 1.1, label: "guía: mg cosθ", labelPosition: "below" }],
    }
  ),

  "elevator-scale": diagram(
    "elevator-scale",
    "system-boundary",
    "N y mg son fuerzas sobre la persona. El indicador de aceleración del ascensor está separado porque la aceleración no es una fuerza.",
    "Balanza dentro de un ascensor",
    "Una persona sobre una balanza recibe normal arriba y peso abajo; al lado aparece un indicador separado de aceleración del ascensor.",
    {
      xDomain: [-0.5, 7.6],
      yDomain: [-0.15, 4.55],
      rectangles: [
        { x: 1, y: 0.4, width: 4, height: 3.8, label: "ascensor", style: "region", labelPosition: "above" },
        { x: 2.3, y: 1.2, width: 1.4, height: 1.1, label: "persona", style: "highlight", labelPosition: "above" },
      ],
      vectors: [
        { start: { x: 3, y: 1.75 }, end: { x: 3, y: 3.4 }, label: "N", style: "primary" },
        { start: { x: 3, y: 1.75 }, end: { x: 3, y: 0.15 }, label: "mg", style: "secondary", labelPosition: "right" },
        { start: { x: 6, y: 1.1 }, end: { x: 6, y: 3.1 }, label: "a del ascensor", style: "tertiary", lineStyle: "dashed", labelPosition: "above" },
      ],
    }
  ),

  "static-friction-response": {
    id: "static-friction-response", kind: "cartesian", relationLabel: "La fricción estática se ajusta hasta f_s,max",
    explanation: "La rama f_s=F_app termina en el umbral. Más allá ya no representa un estado estático.",
    props: { id: "static-friction-response-chart", title: "Respuesta de la fricción estática", description: "Recta de fricción estática requerida frente a fuerza aplicada que termina en el máximo estático.", xAxis: { domain: [0, 60], label: "Fuerza aplicada", unit: "N", ticks: 7 }, yAxis: { domain: [0, 60], label: "Fricción estática", unit: "N", ticks: 7 }, functions: [{ id: "static-response", label: "f_s=F_app hasta f_s,max", evaluate: (force) => force <= 45 ? force : null, samples: 61 }] },
  },
  "friction-regimes": {
    id: "friction-regimes", kind: "cartesian", relationLabel: "Ejemplo de transición entre regímenes",
    explanation: "La línea estática sigue la fuerza requerida hasta su máximo; al deslizar, el nivel cinético ilustrativo es menor. Esta comparación no afirma una ley universal μ_k<μ_s.",
    props: { id: "friction-regimes-chart", title: "Regímenes de fricción en un modelo ilustrativo", description: "Dos ramas comparan fricción estática hasta el umbral y un nivel cinético aproximado tras el deslizamiento.", xAxis: { domain: [0, 70], label: "Fuerza aplicada", unit: "N", ticks: 8 }, yAxis: { domain: [0, 55], label: "Magnitud de fricción", unit: "N", ticks: 6 }, functions: [{ id: "static", label: "estática requerida", evaluate: (force) => force <= 45 ? force : null, samples: 71 }, { id: "kinetic", label: "cinética ilustrativa", evaluate: (force) => force >= 45 ? 34 : null, samples: 71 }] },
  },
  "drag-linear-quadratic": {
    id: "drag-linear-quadratic", kind: "cartesian", relationLabel: "Magnitud de arrastre frente a rapidez",
    explanation: "Con coeficientes ilustrativos, bv crece linealmente y cv² crece cuadráticamente. Son modelos de regímenes, no datos experimentales universales.",
    props: { id: "drag-linear-quadratic-chart", title: "Comparación de arrastre lineal y cuadrático", description: "Una recta y una parábola muestran dos dependencias posibles de la magnitud de arrastre con la rapidez.", xAxis: { domain: [0, 10], label: "Rapidez relativa", unit: "m/s", ticks: 6 }, yAxis: { domain: [0, 25], label: "Magnitud de arrastre", unit: "N", ticks: 6 }, functions: [{ id: "linear", label: "bv, b=2 kg/s", evaluate: (v) => 2 * v, samples: 51 }, { id: "quadratic", label: "cv², c=0,25 kg/m", evaluate: (v) => 0.25 * v * v, samples: 51 }] },
  },

  "terminal-speed-force-balance": diagram(
    "terminal-speed-force-balance",
    "free-body",
    "Al aumentar la rapidez crece el arrastre: primero es menor que el peso y al estado terminal iguala su magnitud. La gravedad nunca desaparece.",
    "Balance de fuerzas durante una caída con arrastre",
    "Tres estados de caída muestran el mismo peso y flechas de arrastre creciente hasta igualar al peso en rapidez terminal.",
    {
      xDomain: [0.05, 8.15],
      yDomain: [-0.6, 4.7],
      // Cada panel es lo bastante ancho para contener el nombre de su estado:
      // así la etiqueta no sube al borde superior y choca con la punta de F_D.
      rectangles: [
        { x: 0.2, y: 1.6, width: 2.4, height: 0.9, label: "baja rapidez", style: "region" },
        { x: 2.9, y: 1.6, width: 2.4, height: 0.9, label: "intermedio", style: "region" },
        { x: 5.6, y: 1.6, width: 2.4, height: 0.9, label: "terminal", style: "highlight" },
      ],
      vectors: [
        { start: { x: 1.4, y: 1.6 }, end: { x: 1.4, y: 0 }, label: "mg", style: "secondary" },
        { start: { x: 1.4, y: 2.5 }, end: { x: 1.4, y: 3 }, label: "F_D", style: "primary" },
        { start: { x: 4.1, y: 1.6 }, end: { x: 4.1, y: 0 }, label: "mg", style: "secondary" },
        { start: { x: 4.1, y: 2.5 }, end: { x: 4.1, y: 3.5 }, label: "F_D", style: "primary" },
        { start: { x: 6.8, y: 1.6 }, end: { x: 6.8, y: 0 }, label: "mg", style: "secondary" },
        { start: { x: 6.8, y: 2.5 }, end: { x: 6.8, y: 4.1 }, label: "F_D", style: "primary" },
      ],
    }
  ),

  "flat-curve-fbd": diagram(
    "flat-curve-fbd",
    "free-body",
    "La velocidad es tangente y la fricción estática apunta hacia el centro. No se añade una fuerza centrípeta separada.",
    "Curva plana y DCL desde arriba",
    "Un automóvil sobre una trayectoria circular tiene velocidad tangente y fricción radial hacia el centro en un DCL separado.",
    {
      xDomain: [0.1, 6],
      yDomain: [0.35, 4.25],
      circles: [
        { center: { x: 1.8, y: 2.2 }, radius: 1.4, label: "trayectoria", style: "reference" },
        { center: { x: 1.8, y: 2.2 }, radius: 0.15, label: "centro", style: "highlight" },
      ],
      rectangles: [
        { x: 2.8, y: 1.9, width: 0.9, height: 0.6, label: "auto", style: "region", labelPosition: "below" },
        { x: 4.3, y: 1.6, width: 1.4, height: 1, label: "DCL", style: "highlight", labelPosition: "above" },
      ],
      vectors: [
        { start: { x: 3.25, y: 2.2 }, end: { x: 3.25, y: 3.8 }, label: "v tangente", style: "primary" },
        { start: { x: 5.4, y: 2.1 }, end: { x: 4.4, y: 2.1 }, label: "f_s hacia centro", style: "secondary", labelPosition: "below" },
      ],
    }
  ),

  "banked-curve-components": diagram(
    "banked-curve-components",
    "free-body",
    "La normal es perpendicular a la carretera; su componente horizontal apunta hacia el centro y su componente vertical equilibra el peso. Las guías punteadas separan esas dos componentes de la normal.",
    "Componentes en una curva peraltada",
    "Una sección inclinada de carretera muestra normal oblicua, peso vertical y guías de las componentes horizontal y vertical de la normal.",
    {
      xDomain: [-0.4, 6.6],
      yDomain: [-0.2, 4.4],
      segments: [
        { start: { x: 0.4, y: 0.6 }, end: { x: 5.8, y: 2.5 }, style: "reference" },
        { start: { x: 3.3, y: 2.25 }, end: { x: 3.3, y: 4.2 }, style: "reference", lineStyle: "dashed" },
        { start: { x: 3.3, y: 4.2 }, end: { x: 1.8, y: 4.2 }, style: "reference", lineStyle: "dashed" },
      ],
      rectangles: [{ x: 2.75, y: 1.75, width: 1.1, height: 0.8, label: "vehículo", style: "region", labelPosition: "below" }],
      vectors: [
        { start: { x: 3.3, y: 2.15 }, end: { x: 1.8, y: 4.2 }, label: "N", style: "primary" },
        { start: { x: 3.3, y: 2.15 }, end: { x: 3.3, y: 0 }, label: "mg", style: "secondary", labelPosition: "right" },
      ],
    }
  ),

  "vertical-circle-local-fbd": diagram(
    "vertical-circle-local-fbd",
    "free-body",
    "La dirección hacia el centro cambia: abajo es hacia arriba y arriba es hacia abajo. Las ecuaciones radiales se construyen localmente sin energía.",
    "DCL locales en un círculo vertical",
    "Dos puntos, superior e inferior, muestran la dirección local hacia el centro y fuerzas normales y gravitacionales.",
    {
      xDomain: [-1.9, 6.3],
      yDomain: [-0.95, 4.45],
      circles: [{ center: { x: 2.2, y: 2.2 }, radius: 1.7, label: "trayectoria", style: "reference" }],
      points: [
        { x: 2.2, y: 3.9, label: "arriba", style: "primary" },
        { x: 2.2, y: 0.5, label: "abajo", style: "secondary", labelPosition: "below" },
      ],
      // Las fuerzas se aplican en el punto; la dirección local hacia el centro
      // es una guía y por eso se dibuja desplazada, sin superponerse a ellas.
      vectors: [
        { start: { x: 1.5, y: 3.9 }, end: { x: 1.5, y: 2.9 }, label: "hacia centro", style: "tertiary", lineStyle: "dashed", labelPosition: "left" },
        { start: { x: 2.2, y: 3.9 }, end: { x: 2.2, y: 2.4 }, label: "mg y contacto", style: "primary", labelPosition: "right" },
        { start: { x: 1.5, y: 0.5 }, end: { x: 1.5, y: 1.5 }, label: "hacia centro; N", style: "secondary", labelPosition: "left" },
        { start: { x: 2.2, y: 0.5 }, end: { x: 2.2, y: -0.4 }, label: "mg", style: "tertiary", labelPosition: "beyond-tip" },
      ],
    }
  ),

  "fundamental-forces-map": diagram(
    "fundamental-forces-map",
    "concept-map",
    "El bloque superior reúne las cuatro interacciones fundamentales. Normal, fricción y tensión aparecen abajo como descripciones efectivas macroscópicas, principalmente de origen electromagnético.",
    "Mapa de interacciones fundamentales y fuerzas efectivas",
    "Cuatro interacciones fundamentales forman un bloque de dos filas; debajo, tres fuerzas cotidianas se conectan con la interacción electromagnética como su descripción efectiva.",
    {
      xDomain: [-0.6, 8.6],
      yDomain: [-0.3, 4.9],
      rectangles: [
        { x: 0.2, y: 3.5, width: 3.4, height: 0.9, label: "gravedad", style: "primary" },
        { x: 4.4, y: 3.5, width: 3.4, height: 0.9, label: "fuerte", style: "tertiary" },
        { x: 0.2, y: 2.2, width: 3.4, height: 0.9, label: "electromagnética", style: "secondary" },
        { x: 4.4, y: 2.2, width: 3.4, height: 0.9, label: "débil", style: "highlight" },
        { x: 0.3, y: 0.7, width: 2.3, height: 0.9, label: "normal", style: "region" },
        { x: 2.9, y: 0.7, width: 2.3, height: 0.9, label: "fricción", style: "region" },
        { x: 5.5, y: 0.7, width: 2.3, height: 0.9, label: "tensión", style: "region" },
      ],
      segments: [
        { start: { x: 1.9, y: 2.2 }, end: { x: 1.45, y: 1.6 }, style: "reference", lineStyle: "dashed" },
        { start: { x: 1.9, y: 2.2 }, end: { x: 4.05, y: 1.6 }, style: "reference", lineStyle: "dashed" },
        { start: { x: 1.9, y: 2.2 }, end: { x: 6.65, y: 1.6 }, style: "reference", lineStyle: "dashed" },
      ],
      annotations: [{ x: 4, y: 0.25, label: "fuerzas efectivas macroscópicas" }],
    }
  ),
};
