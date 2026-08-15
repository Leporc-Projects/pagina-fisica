// Frontera datos físicos → geometría SVG de un diagrama académico. Es la única
// fuente de la composición: `AcademicDiagram.astro` la usa para renderizar y
// `validate.mjs` la usa para reproducir exactamente lo que se va a publicar y
// detectar solapes antes del despliegue. Si el renderer calculara por su cuenta
// la posición de una etiqueta, el verificador dejaría de proteger nada.
import {
  clipSegmentToDomain,
  createCartesianTransform,
  createClippedSegments,
  createIsotropicTransform,
  segmentsToSvgPath,
} from "./chart.js";
import {
  DIAGRAM_PLACEMENTS,
  clampLabelToPlot,
  estimateLabelWidth,
  getDiagramFamily,
  resolveClearance,
  resolveLabelPlacement,
  resolveRectangleLabel,
} from "./diagram-layout.js";

export const DIAGRAM_STYLES = Object.freeze([
  "primary",
  "secondary",
  "tertiary",
  "reference",
  "region",
  "highlight",
]);

export const RECTANGLE_PLACEMENTS = Object.freeze(["inside", "above", "below"]);

/**
 * Contrato cerrado de props y de cada primitiva. Una clave desconocida detiene
 * el build en lugar de desaparecer en silencio: ese fallo silencioso mantuvo
 * doce figuras publicando menos de lo que declaraban.
 */
export const DIAGRAM_PROP_KEYS = Object.freeze([
  "id", "title", "description", "family", "xDomain", "yDomain", "vectors",
  "segments", "curves", "circles", "rectangles", "points", "annotations",
  "grid", "scaleMode", "aspectRatio",
]);

const PRIMITIVE_KEYS = Object.freeze({
  vector: ["start", "end", "label", "style", "lineStyle", "mathLabel", "ariaLabel", "labelOffset", "labelAnchor", "labelPosition"],
  segment: ["start", "end", "label", "style", "lineStyle", "labelOffset", "labelAnchor", "labelPosition"],
  curve: ["points", "label", "style", "lineStyle"],
  circle: ["center", "radius", "label", "style"],
  rectangle: ["x", "y", "width", "height", "label", "style", "labelAnchor", "labelPosition"],
  point: ["x", "y", "label", "style", "labelOffset", "labelAnchor", "labelPosition"],
  annotation: ["x", "y", "label", "offset", "labelAnchor", "labelPosition"],
  grid: ["x", "y", "labels"],
  mathLabel: ["base", "sub", "suffix", "baseRole"],
});

/** Texto realmente pintado: un mathLabel se compone de base, subíndice y sufijo. */
export const diagramLabelText = (label = "", mathLabel) => mathLabel
  ? `${mathLabel.base}${mathLabel.sub ?? ""}${mathLabel.suffix ?? ""}`
  : label;

const assertContract = (props) => {
  const reject = (message) => {
    throw new Error(`AcademicDiagram "${props.id}": ${message}`);
  };

  if (!/^[a-z][a-z0-9-]*$/.test(props.id ?? "")) {
    throw new Error("AcademicDiagram requiere un id estable en minúsculas y con guiones.");
  }

  for (const key of Object.keys(props)) {
    if (!DIAGRAM_PROP_KEYS.includes(key)) reject(`la prop "${key}" no pertenece al contrato.`);
  }

  const checkSpec = (spec, kind, index) => {
    for (const key of Object.keys(spec)) {
      if (!PRIMITIVE_KEYS[kind].includes(key)) {
        reject(`${kind}[${index}] declara "${key}", que no pertenece al contrato.`);
      }
    }

    if (spec.style !== undefined && !DIAGRAM_STYLES.includes(spec.style)) {
      reject(`${kind}[${index}] usa el estilo "${spec.style}" fuera del union ${DIAGRAM_STYLES.join(", ")}.`);
    }

    const placements = kind === "rectangle" ? RECTANGLE_PLACEMENTS : DIAGRAM_PLACEMENTS;

    if (spec.labelPosition !== undefined && !placements.includes(spec.labelPosition)) {
      reject(`${kind}[${index}] usa labelPosition "${spec.labelPosition}" fuera de ${placements.join(", ")}.`);
    }

    if (spec.mathLabel) {
      for (const key of Object.keys(spec.mathLabel)) {
        if (!PRIMITIVE_KEYS.mathLabel.includes(key)) reject(`${kind}[${index}].mathLabel declara "${key}".`);
      }
    }
  };

  for (const [kind, plural] of [
    ["vector", "vectors"], ["segment", "segments"], ["curve", "curves"],
    ["circle", "circles"], ["rectangle", "rectangles"], ["point", "points"],
    ["annotation", "annotations"],
  ]) {
    (props[plural] ?? []).forEach((spec, index) => checkSpec(spec, kind, index));
  }

  if (props.grid) checkSpec(props.grid, "grid", 0);

  (props.rectangles ?? []).forEach((rectangle, index) => {
    if (!(rectangle.width > 0) || !(rectangle.height > 0)) {
      reject(`rectangle[${index}] necesita ancho y alto positivos en coordenadas físicas.`);
    }
  });
};

/**
 * Prepara la composición completa de un diagrama.
 *
 * `fontSize` es la métrica con la que se reserva el hueco de cada etiqueta. El
 * SVG conserva las mismas coordenadas en escritorio y móvil y solo cambia el
 * cuerpo de letra, así que el componente pasa siempre la métrica mayor: reservar
 * el caso peor evita que el texto grande se solape donde el pequeño cabía.
 */
export const prepareDiagram = ({ props, fontSize }) => {
  assertContract(props);

  const {
    id,
    xDomain,
    yDomain,
    family,
    vectors = [],
    segments = [],
    curves = [],
    circles = [],
    rectangles = [],
    points = [],
    annotations = [],
    grid,
    scaleMode = "isotropic",
    aspectRatio,
  } = props;
  const preset = getDiagramFamily(family);
  const effectiveAspectRatio = aspectRatio ?? preset.aspectRatio;
  const viewBoxWidth = 100;
  const viewBoxHeight = viewBoxWidth * effectiveAspectRatio;
  const requestedPlot = {
    left: preset.padding,
    top: preset.padding,
    width: viewBoxWidth - preset.padding * 2,
    height: viewBoxHeight - preset.padding * 2,
  };
  const transform = scaleMode === "isotropic"
    ? createIsotropicTransform({ xDomain, yDomain, plot: requestedPlot })
    : createCartesianTransform({ xDomain, yDomain, plot: requestedPlot });
  const plot = transform.plot;
  const domains = { xDomain, yDomain };

  const placeLabel = ({ start, end, spec, kind, hasArrowhead = false }) => {
    const placement = spec.labelPosition ?? preset.placement[kind];
    const placed = resolveLabelPlacement({
      start,
      end,
      placement,
      clearance: resolveClearance({ fontSize, hasArrowhead }),
      textHeight: fontSize,
    });
    const anchor = spec.labelAnchor ?? placed.anchor;
    const base = placement === "beyond-tip"
      ? end
      : { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    const point = spec.labelOffset
      ? { x: base.x + spec.labelOffset.x, y: base.y + spec.labelOffset.y }
      : { x: placed.x, y: placed.y };
    const text = diagramLabelText(spec.label, spec.mathLabel);

    return {
      ...clampLabelToPlot({
        ...point,
        width: estimateLabelWidth(text, fontSize),
        fontSize,
        anchor,
        plot,
      }),
      text,
    };
  };

  const preparedVectors = vectors
    .map((vector) => ({
      ...vector,
      style: vector.style ?? preset.styles.vector,
      lineStyle: vector.lineStyle ?? "solid",
      clipped: clipSegmentToDomain(vector.start, vector.end, domains),
    }))
    .filter((vector) => vector.clipped)
    .map((vector) => ({
      ...vector,
      svgStart: transform.point(vector.clipped[0]),
      svgEnd: transform.point(vector.clipped[1]),
    }))
    .map((vector) => ({
      ...vector,
      labelSvg: placeLabel({
        start: vector.svgStart,
        end: vector.svgEnd,
        spec: vector,
        kind: "vector",
        hasArrowhead: true,
      }),
    }));

  const preparedSegments = segments
    .map((segment) => ({
      ...segment,
      style: segment.style ?? preset.styles.segment,
      lineStyle: segment.lineStyle ?? "dashed",
      clipped: clipSegmentToDomain(segment.start, segment.end, domains),
    }))
    .filter((segment) => segment.clipped)
    .map((segment) => ({
      ...segment,
      svgStart: transform.point(segment.clipped[0]),
      svgEnd: transform.point(segment.clipped[1]),
    }))
    .map((segment) => ({
      ...segment,
      labelSvg: segment.label
        ? placeLabel({
            start: segment.svgStart,
            end: segment.svgEnd,
            spec: segment,
            kind: "segment",
          })
        : null,
    }));

  const preparedCurves = curves.map((curve) => ({
    ...curve,
    style: curve.style ?? preset.styles.curve,
    lineStyle: curve.lineStyle ?? "solid",
    path: segmentsToSvgPath(createClippedSegments(curve.points, domains), transform),
  }));

  const preparedCircles = circles.map((circle) => {
    const center = transform.point(circle.center);
    return {
      ...circle,
      style: circle.style ?? preset.styles.circle,
      center,
      radiusX: Math.abs(transform.x(circle.center.x + circle.radius) - center.x),
      radiusY: Math.abs(transform.y(circle.center.y + circle.radius) - center.y),
    };
  });

  // x,y describen la esquina inferior izquierda en coordenadas físicas; SVG
  // crece hacia abajo, así que el borde superior físico fija la y del rect.
  const preparedRectangles = rectangles.map((rectangle) => {
    const left = transform.x(rectangle.x);
    const right = transform.x(rectangle.x + rectangle.width);
    const bottom = transform.y(rectangle.y);
    const top = transform.y(rectangle.y + rectangle.height);
    const label = rectangle.label
      ? resolveRectangleLabel({
          box: { left, right, top, bottom },
          text: rectangle.label,
          fontSize,
          placement: rectangle.labelPosition,
        })
      : null;

    return {
      ...rectangle,
      style: rectangle.style ?? preset.styles.rectangle,
      svg: { x: left, y: top, width: right - left, height: bottom - top },
      labelSvg: label
        ? {
            ...clampLabelToPlot({
              x: label.x,
              y: label.y,
              width: label.width,
              fontSize,
              anchor: rectangle.labelAnchor ?? label.anchor,
              plot,
            }),
            text: rectangle.label,
          }
        : null,
    };
  });

  const preparedPoints = points
    .filter(transform.isVisible)
    .map((point) => ({
      ...point,
      style: point.style ?? preset.styles.point,
      svg: transform.point(point),
    }))
    .map((point) => ({
      ...point,
      labelSvg: point.label
        ? placeLabel({ start: point.svg, end: point.svg, spec: point, kind: "point" })
        : null,
    }));

  const preparedAnnotations = annotations
    .filter(transform.isVisible)
    .map((annotation) => {
      const svg = transform.point(annotation);
      return {
        ...annotation,
        svg,
        labelSvg: placeLabel({
          start: svg,
          end: svg,
          spec: { ...annotation, labelOffset: annotation.offset },
          kind: "annotation",
        }),
      };
    });

  const gridX = (grid?.x ?? [])
    .filter((value) => Number.isFinite(value) && value >= xDomain[0] && value <= xDomain[1])
    .map((value) => ({ value, position: transform.x(value) }));
  const gridY = (grid?.y ?? [])
    .filter((value) => Number.isFinite(value) && value >= yDomain[0] && value <= yDomain[1])
    .map((value) => ({ value, position: transform.y(value) }));

  return {
    id,
    family,
    plot,
    viewBoxWidth,
    viewBoxHeight,
    scaleMode,
    vectors: preparedVectors,
    segments: preparedSegments,
    curves: preparedCurves,
    circles: preparedCircles,
    rectangles: preparedRectangles,
    points: preparedPoints,
    annotations: preparedAnnotations,
    gridX,
    gridY,
  };
};

/** Todas las etiquetas realmente pintadas, en el orden en que se dibujan. */
export const collectDiagramLabels = (diagram) => [
  ...diagram.rectangles,
  ...diagram.vectors,
  ...diagram.segments,
  ...diagram.points,
  ...diagram.annotations,
]
  .map((primitive) => primitive.labelSvg)
  .filter(Boolean);
