// Geometría de colocación de etiquetas para diagramas académicos. Módulo puro:
// no conoce el DOM, Astro ni colores. El componente lo usa para renderizar y
// `validate.mjs` lo usa para reproducir la misma geometría y detectar colisiones
// antes de publicar. Ambas capas deben derivar de aquí; duplicar la fórmula en
// uno de los dos lados reintroduce el defecto que este módulo previene.

/**
 * Métrica tipográfica efectiva de `.academic-diagram__labels text`. El componente
 * publica estos valores como variables CSS para que global.css no mantenga una
 * copia divergente: el tamaño de fuente decide el ancho estimado de cada etiqueta
 * y, por tanto, si dos etiquetas colisionan.
 */
export const DIAGRAM_LABEL_METRICS = Object.freeze({
  desktop: Object.freeze({ fontSize: 2.4, haloWidth: 0.6 }),
  mobile: Object.freeze({ fontSize: 3.2, haloWidth: 0.8 }),
});

export const DIAGRAM_METRIC_NAMES = Object.freeze(["desktop", "mobile"]);

/**
 * Avance horizontal medio por carácter de `var(--font-mono)`, expresado como
 * fracción del tamaño de fuente. Derivarlo del tamaño evita el error de fijar
 * un ancho absoluto válido solo en escritorio.
 */
export const LABEL_ADVANCE_RATIO = 0.6;
export const LABEL_ASCENT_RATIO = 0.78;
export const LABEL_DESCENT_RATIO = 0.22;

/**
 * Punta de flecha en unidades del viewBox. El `<marker>` se declara con
 * `markerUnits="userSpaceOnUse"`, de modo que estas medidas son las reales y no
 * dependen del grosor de trazo del vector.
 */
export const ARROWHEAD_LENGTH = 3;
export const ARROWHEAD_WIDTH = 2.1;

export const DIAGRAM_PLACEMENTS = Object.freeze([
  "above",
  "below",
  "left",
  "right",
  "normal",
  "beyond-tip",
  "inside",
]);

const EPSILON = 1e-9;

const assertFiniteNumber = (value, name) => {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} debe ser un número finito.`);
  }

  return value;
};

const assertPoint = (point, name) => {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new TypeError(`${name} debe ser un punto con x e y finitos.`);
  }

  return { x: point.x, y: point.y };
};

/** Ancho estimado de una etiqueta en unidades del viewBox. */
export const estimateLabelWidth = (text = "", fontSize) => {
  assertFiniteNumber(fontSize, "fontSize");
  const characters = [...String(text)].length;
  return Math.max(characters, 1) * fontSize * LABEL_ADVANCE_RATIO;
};

/**
 * Caja del texto a partir del punto de anclaje SVG. `y` es la línea base, por lo
 * que la caja se extiende hacia arriba por el ascenso y hacia abajo por el
 * descenso; sin esa asimetría dos etiquetas separadas verticalmente parecerían
 * solaparse cuando no lo hacen.
 */
export const createLabelBox = ({ x, y, width, fontSize, anchor = "start" }) => {
  assertFiniteNumber(x, "x");
  assertFiniteNumber(y, "y");
  assertFiniteNumber(width, "width");
  assertFiniteNumber(fontSize, "fontSize");
  const left = anchor === "end" ? x - width : anchor === "middle" ? x - width / 2 : x;

  return {
    left,
    right: left + width,
    top: y - fontSize * LABEL_ASCENT_RATIO,
    bottom: y + fontSize * LABEL_DESCENT_RATIO,
  };
};

/**
 * Caja envolvente de la punta de flecha. La punta se sitúa exactamente en `end`
 * y el cuerpo del triángulo retrocede a lo largo de la dirección del vector.
 */
export const createArrowheadBox = (
  start,
  end,
  { length = ARROWHEAD_LENGTH, width = ARROWHEAD_WIDTH, tipOvershoot = 0 } = {}
) => {
  const from = assertPoint(start, "start");
  const to = assertPoint(end, "end");
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const magnitude = Math.hypot(deltaX, deltaY);
  const ux = magnitude < EPSILON ? 1 : deltaX / magnitude;
  const uy = magnitude < EPSILON ? 0 : deltaY / magnitude;
  const tip = { x: to.x + ux * tipOvershoot, y: to.y + uy * tipOvershoot };
  const baseCenter = { x: tip.x - ux * length, y: tip.y - uy * length };
  const halfWidth = width / 2;
  const corners = [
    tip,
    { x: baseCenter.x - uy * halfWidth, y: baseCenter.y + ux * halfWidth },
    { x: baseCenter.x + uy * halfWidth, y: baseCenter.y - ux * halfWidth },
  ];

  return {
    left: Math.min(...corners.map((corner) => corner.x)),
    right: Math.max(...corners.map((corner) => corner.x)),
    top: Math.min(...corners.map((corner) => corner.y)),
    bottom: Math.max(...corners.map((corner) => corner.y)),
  };
};

/** Área de intersección entre dos cajas; cero cuando no se tocan. */
export const boxOverlapArea = (first, second) => {
  const width = Math.min(first.right, second.right) - Math.max(first.left, second.left);
  const height = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
  return width > EPSILON && height > EPSILON ? width * height : 0;
};

export const boxesOverlap = (first, second) => boxOverlapArea(first, second) > EPSILON;

/** Recorte contra el área de trazado: mide cuánto sobresale la caja. */
export const boxOutsideAmount = (box, plot) => Math.max(
  plot.left - box.left,
  box.right - (plot.left + plot.width),
  plot.top - box.top,
  box.bottom - (plot.top + plot.height),
  0
);

/**
 * Separación mínima entre el elemento y su etiqueta. Incorpora el semiancho de
 * la punta de flecha para que una etiqueta perpendicular nunca caiga sobre ella,
 * más un respiro proporcional al cuerpo de letra.
 */
export const resolveClearance = ({ fontSize, hasArrowhead = false }) => {
  assertFiniteNumber(fontSize, "fontSize");
  const arrow = hasArrowhead ? ARROWHEAD_WIDTH / 2 : 0;
  return Math.max(arrow, fontSize * 0.3) + fontSize * 0.25;
};

const anchorForOffset = (offsetX, clearance) => {
  if (offsetX > clearance * 0.35) return "start";
  if (offsetX < -clearance * 0.35) return "end";
  return "middle";
};

/**
 * Traduce una política de colocación en un punto de línea base y un `text-anchor`.
 * Trabaja en espacio SVG, donde `y` crece hacia abajo. El desplazamiento se
 * deriva de la dirección del elemento; `clearance` fija la distancia y ya debe
 * incorporar el tamaño de la punta cuando el elemento la tiene.
 */
export const resolveLabelPlacement = ({
  start,
  end,
  placement = "normal",
  clearance,
  textHeight,
}) => {
  const from = assertPoint(start, "start");
  const to = assertPoint(end, "end");
  assertFiniteNumber(clearance, "clearance");
  assertFiniteNumber(textHeight, "textHeight");

  if (!DIAGRAM_PLACEMENTS.includes(placement)) {
    throw new RangeError(
      `placement "${placement}" no pertenece al contrato: ${DIAGRAM_PLACEMENTS.join(", ")}.`
    );
  }

  const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const centeredBaseline = textHeight * (LABEL_ASCENT_RATIO - LABEL_DESCENT_RATIO) / 2;

  if (placement === "inside") {
    return { x: middle.x, y: middle.y + centeredBaseline, anchor: "middle" };
  }

  if (placement === "above") {
    return {
      x: middle.x,
      y: middle.y - clearance - textHeight * LABEL_DESCENT_RATIO,
      anchor: "middle",
    };
  }

  if (placement === "below") {
    return {
      x: middle.x,
      y: middle.y + clearance + textHeight * LABEL_ASCENT_RATIO,
      anchor: "middle",
    };
  }

  if (placement === "left") {
    return { x: middle.x - clearance, y: middle.y + centeredBaseline, anchor: "end" };
  }

  if (placement === "right") {
    return { x: middle.x + clearance, y: middle.y + centeredBaseline, anchor: "start" };
  }

  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const magnitude = Math.hypot(deltaX, deltaY);
  const ux = magnitude < EPSILON ? 1 : deltaX / magnitude;
  const uy = magnitude < EPSILON ? 0 : deltaY / magnitude;
  const base = placement === "beyond-tip" ? to : middle;
  // La normal se elige siempre hacia arriba en pantalla, sea cual sea el sentido
  // del vector: así dos flechas opuestas del mismo diagrama etiquetan al mismo
  // lado y el lector no interpreta la posición del texto como un dato físico.
  const rawNormalX = uy;
  const rawNormalY = -ux;
  const flip = rawNormalY > 0 ? -1 : 1;
  const normalX = placement === "beyond-tip" ? ux : rawNormalX * flip;
  const normalY = placement === "beyond-tip" ? uy : rawNormalY * flip;
  const offsetX = (magnitude < EPSILON ? 1 : normalX) * clearance;
  const offsetY = (magnitude < EPSILON ? 0 : normalY) * clearance;
  const verticalShare = Math.min(1, Math.abs(offsetY) / clearance);
  const verticalCorrection = offsetY >= 0
    ? textHeight * LABEL_ASCENT_RATIO * verticalShare
    : -textHeight * LABEL_DESCENT_RATIO * verticalShare;

  return {
    x: base.x + offsetX,
    y: base.y + offsetY + verticalCorrection + centeredBaseline * (1 - verticalShare),
    anchor: anchorForOffset(offsetX, clearance),
  };
};

/**
 * Mantiene la etiqueta dentro del área de trazado desplazando su punto de
 * anclaje, no recortando el texto. Componente y verificador comparten esta
 * función para que ninguno de los dos «arregle» el borde por su cuenta.
 */
export const clampLabelToPlot = ({
  x,
  y,
  width,
  fontSize,
  anchor = "start",
  plot,
  padding = 0.6,
}) => {
  const box = createLabelBox({ x, y, width, fontSize, anchor });
  const minimumLeft = plot.left + padding;
  const maximumRight = plot.left + plot.width - padding;
  const minimumTop = plot.top + padding;
  const maximumBottom = plot.top + plot.height - padding;
  const shiftX = box.left < minimumLeft
    ? minimumLeft - box.left
    : box.right > maximumRight
      ? maximumRight - box.right
      : 0;
  const shiftY = box.top < minimumTop
    ? minimumTop - box.top
    : box.bottom > maximumBottom
      ? maximumBottom - box.bottom
      : 0;

  return { x: x + shiftX, y: y + shiftY, anchor };
};

/**
 * Etiqueta de una región rectangular. Va dentro cuando cabe con holgura y sobre
 * el borde superior cuando no; es una decisión del renderer y no de los datos,
 * de modo que cambiar el dominio de una figura no exige reescribir su etiqueta.
 */
export const resolveRectangleLabel = ({
  box,
  text = "",
  fontSize,
  placement,
  padding = 0.5,
}) => {
  assertFiniteNumber(fontSize, "fontSize");
  const width = estimateLabelWidth(text, fontSize);
  const boxWidth = box.right - box.left;
  const boxHeight = box.bottom - box.top;
  const fits = width + padding * 2 <= boxWidth &&
    fontSize * (LABEL_ASCENT_RATIO + LABEL_DESCENT_RATIO) + padding * 2 <= boxHeight;
  const resolved = placement ?? (fits ? "inside" : "above");
  const centerX = (box.left + box.right) / 2;

  if (resolved === "inside") {
    return {
      x: centerX,
      y: (box.top + box.bottom) / 2 + fontSize * (LABEL_ASCENT_RATIO - LABEL_DESCENT_RATIO) / 2,
      anchor: "middle",
      placement: "inside",
      width,
    };
  }

  if (resolved === "below") {
    return {
      x: centerX,
      y: box.bottom + padding + fontSize * LABEL_ASCENT_RATIO,
      anchor: "middle",
      placement: "below",
      width,
    };
  }

  return {
    x: centerX,
    y: box.top - padding - fontSize * LABEL_DESCENT_RATIO,
    anchor: "middle",
    placement: "above",
    width,
  };
};

/**
 * Presets por familia de figura. Cada familia fija encuadre sugerido, respiro
 * del área de trazado, política de colocación por primitiva y estilos por
 * defecto. No contienen lógica de transformación: esa vive en `chart.js`.
 */
export const DIAGRAM_FAMILIES = Object.freeze({
  "vector-geometry": Object.freeze({
    aspectRatio: 0.64,
    padding: 6,
    placement: Object.freeze({
      vector: "normal",
      segment: "above",
      point: "above",
      rectangle: "inside",
      annotation: "above",
    }),
    styles: Object.freeze({
      vector: "primary",
      segment: "reference",
      curve: "primary",
      circle: "reference",
      point: "primary",
      rectangle: "region",
    }),
  }),
  "system-boundary": Object.freeze({
    aspectRatio: 0.62,
    padding: 5,
    placement: Object.freeze({
      vector: "beyond-tip",
      segment: "above",
      point: "above",
      rectangle: "inside",
      annotation: "above",
    }),
    styles: Object.freeze({
      vector: "primary",
      segment: "reference",
      curve: "reference",
      circle: "reference",
      point: "primary",
      rectangle: "region",
    }),
  }),
  "free-body": Object.freeze({
    aspectRatio: 0.7,
    padding: 6,
    placement: Object.freeze({
      vector: "beyond-tip",
      segment: "above",
      point: "above",
      rectangle: "inside",
      annotation: "above",
    }),
    styles: Object.freeze({
      vector: "primary",
      segment: "reference",
      curve: "reference",
      circle: "region",
      point: "primary",
      rectangle: "region",
    }),
  }),
  "motion-sketch": Object.freeze({
    aspectRatio: 0.7,
    padding: 6,
    placement: Object.freeze({
      vector: "normal",
      segment: "above",
      point: "below",
      rectangle: "inside",
      annotation: "above",
    }),
    styles: Object.freeze({
      vector: "primary",
      segment: "reference",
      curve: "primary",
      circle: "reference",
      point: "primary",
      rectangle: "region",
    }),
  }),
  "concept-map": Object.freeze({
    aspectRatio: 0.6,
    padding: 4,
    placement: Object.freeze({
      vector: "beyond-tip",
      segment: "normal",
      point: "above",
      rectangle: "inside",
      annotation: "below",
    }),
    styles: Object.freeze({
      vector: "reference",
      segment: "reference",
      curve: "reference",
      circle: "reference",
      point: "reference",
      rectangle: "region",
    }),
  }),
  "force-sum": Object.freeze({
    aspectRatio: 0.78,
    padding: 6,
    placement: Object.freeze({
      vector: "normal",
      segment: "above",
      point: "above",
      rectangle: "inside",
      annotation: "above",
    }),
    styles: Object.freeze({
      vector: "primary",
      segment: "reference",
      curve: "primary",
      circle: "reference",
      point: "primary",
      rectangle: "region",
    }),
  }),
});

export const DIAGRAM_FAMILY_NAMES = Object.freeze(Object.keys(DIAGRAM_FAMILIES));

/**
 * Familias cuya composición es un balance de fuerzas: dentro del SVG solo caben
 * marcadores breves. Una explicación en prosa pertenece al campo `explanation`
 * del grupo de figura, que ya se localiza y se lee en impresión.
 */
export const DIAGRAM_SENTENCE_FREE_FAMILIES = Object.freeze([
  "free-body",
  "system-boundary",
]);

/** Longitud máxima de una anotación en esas familias. */
export const DIAGRAM_ANNOTATION_MAX_LENGTH = 16;

export const getDiagramFamily = (name) => {
  const family = DIAGRAM_FAMILIES[name];

  if (!family) {
    throw new RangeError(
      `family "${name}" no pertenece al contrato: ${DIAGRAM_FAMILY_NAMES.join(", ")}.`
    );
  }

  return family;
};
