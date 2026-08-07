// Núcleo matemático de las visualizaciones: transforma y recorta datos físicos
// sin conocer Astro, el DOM, colores ni decisiones de presentación.

const EPSILON = 1e-10;

const isFinitePoint = (point) =>
  point !== null &&
  Number.isFinite(point?.x) &&
  Number.isFinite(point?.y);

/**
 * Valida un dominio físico creciente. Los ejes y todas las geometrías consumen
 * este contrato para detectar configuraciones ambiguas antes de generar SVG.
 */
export const assertDomain = (domain, name = "dominio") => {
  if (
    !Array.isArray(domain) ||
    domain.length !== 2 ||
    !domain.every(Number.isFinite) ||
    domain[0] >= domain[1]
  ) {
    throw new RangeError(
      `${name} debe contener dos números finitos en orden creciente.`
    );
  }

  return [...domain];
};

const assertPlot = (plot) => {
  if (
    !plot ||
    !Number.isFinite(plot.left) ||
    !Number.isFinite(plot.top) ||
    !Number.isFinite(plot.width) ||
    !Number.isFinite(plot.height) ||
    plot.width <= 0 ||
    plot.height <= 0
  ) {
    throw new RangeError(
      "El área SVG debe tener origen finito y dimensiones positivas."
    );
  }

  return { ...plot };
};

/**
 * Crea una escala lineal entre dos espacios. El rango puede ser descendente,
 * como ocurre al convertir el eje y cartesiano al sistema vertical de SVG.
 */
export const createLinearScale = (domain, range) => {
  const [domainMin, domainMax] = assertDomain(domain);

  if (
    !Array.isArray(range) ||
    range.length !== 2 ||
    !range.every(Number.isFinite) ||
    Math.abs(range[1] - range[0]) < EPSILON
  ) {
    throw new RangeError(
      "El rango debe contener dos números finitos distintos."
    );
  }

  const scale = (value) => {
    if (!Number.isFinite(value)) {
      throw new TypeError("La escala solo acepta valores finitos.");
    }

    const ratio = (value - domainMin) / (domainMax - domainMin);
    return range[0] + ratio * (range[1] - range[0]);
  };

  return scale;
};

/**
 * Mantiene aislada la conversión datos físicos → espacio SVG. Los consumidores
 * entregan puntos en sus unidades; el componente decide el viewBox y el plot.
 */
export const createCartesianTransform = ({
  xDomain,
  yDomain,
  plot,
}) => {
  const checkedXDomain = assertDomain(xDomain, "xDomain");
  const checkedYDomain = assertDomain(yDomain, "yDomain");
  const checkedPlot = assertPlot(plot);
  const x = createLinearScale(checkedXDomain, [
    checkedPlot.left,
    checkedPlot.left + checkedPlot.width,
  ]);
  const y = createLinearScale(checkedYDomain, [
    checkedPlot.top + checkedPlot.height,
    checkedPlot.top,
  ]);

  return {
    x,
    y,
    point: (point) => ({ x: x(point.x), y: y(point.y) }),
    isVisible: (point) =>
      isFinitePoint(point) &&
      point.x >= checkedXDomain[0] &&
      point.x <= checkedXDomain[1] &&
      point.y >= checkedYDomain[0] &&
      point.y <= checkedYDomain[1],
    xDomain: checkedXDomain,
    yDomain: checkedYDomain,
    plot: checkedPlot,
  };
};

/**
 * Produce ticks lineales previsibles. Si una disciplina necesita ticks no
 * uniformes, el componente acepta después una lista explícita de valores.
 */
export const createLinearTicks = (domain, count = 6) => {
  const [minimum, maximum] = assertDomain(domain);

  if (!Number.isInteger(count) || count < 2) {
    throw new RangeError("La cantidad de ticks debe ser un entero mayor que uno.");
  }

  const step = (maximum - minimum) / (count - 1);
  return Array.from(
    { length: count },
    (_, index) => index === count - 1 ? maximum : minimum + step * index
  );
};

/**
 * Evalúa una función suministrada por datos durante el build. Los valores no
 * finitos se conservan como cortes para no unir por error ramas discontinuas.
 */
export const sampleFunction = ({
  evaluate,
  domain,
  samples = 121,
}) => {
  const [minimum, maximum] = assertDomain(domain);

  if (typeof evaluate !== "function") {
    throw new TypeError("evaluate debe ser una función.");
  }

  if (!Number.isInteger(samples) || samples < 2) {
    throw new RangeError("samples debe ser un entero mayor que uno.");
  }

  const step = (maximum - minimum) / (samples - 1);

  return Array.from({ length: samples }, (_, index) => {
    const x = index === samples - 1 ? maximum : minimum + step * index;
    const y = evaluate(x);
    return Number.isFinite(y) ? { x, y } : null;
  });
};

/**
 * Recorta un segmento contra los dominios en coordenadas físicas. Así ningún
 * valor fuera de rango produce geometría SVG desbordada ni se altera el dato.
 */
export const clipSegmentToDomain = (
  start,
  end,
  { xDomain, yDomain }
) => {
  if (!isFinitePoint(start) || !isFinitePoint(end)) return null;

  const [xMin, xMax] = assertDomain(xDomain, "xDomain");
  const [yMin, yMax] = assertDomain(yDomain, "yDomain");
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const p = [-deltaX, deltaX, -deltaY, deltaY];
  const q = [
    start.x - xMin,
    xMax - start.x,
    start.y - yMin,
    yMax - start.y,
  ];
  let lower = 0;
  let upper = 1;

  for (let index = 0; index < p.length; index += 1) {
    if (Math.abs(p[index]) < EPSILON) {
      if (q[index] < 0) return null;
      continue;
    }

    const ratio = q[index] / p[index];

    if (p[index] < 0) {
      lower = Math.max(lower, ratio);
    } else {
      upper = Math.min(upper, ratio);
    }

    if (lower > upper) return null;
  }

  return [
    {
      x: start.x + lower * deltaX,
      y: start.y + lower * deltaY,
    },
    {
      x: start.x + upper * deltaX,
      y: start.y + upper * deltaY,
    },
  ];
};

/**
 * Convierte una serie —incluidos cortes nulos— en segmentos ya recortados.
 * El resultado todavía permanece en coordenadas físicas y puede reutilizarse.
 */
export const createClippedSegments = (points, domains) => {
  if (!Array.isArray(points)) {
    throw new TypeError("points debe ser una lista.");
  }

  const segments = [];

  for (let index = 1; index < points.length; index += 1) {
    const clipped = clipSegmentToDomain(
      points[index - 1],
      points[index],
      domains
    );

    if (clipped) segments.push(clipped);
  }

  return segments;
};

/** Agrupa puntos finitos sin cruzar discontinuidades declaradas con null. */
export const splitPointRuns = (points) => {
  if (!Array.isArray(points)) {
    throw new TypeError("points debe ser una lista.");
  }

  const runs = [];
  let currentRun = [];

  for (const point of points) {
    if (isFinitePoint(point)) {
      currentRun.push(point);
    } else if (currentRun.length > 0) {
      runs.push(currentRun);
      currentRun = [];
    }
  }

  if (currentRun.length > 0) runs.push(currentRun);
  return runs;
};

const intersectVertical = (start, end, x) => {
  const ratio = (x - start.x) / (end.x - start.x);
  return { x, y: start.y + ratio * (end.y - start.y) };
};

const intersectHorizontal = (start, end, y) => {
  const ratio = (y - start.y) / (end.y - start.y);
  return { x: start.x + ratio * (end.x - start.x), y };
};

const clipPolygonBoundary = (points, isInside, intersection) => {
  if (points.length === 0) return [];

  const output = [];
  let previous = points.at(-1);

  for (const current of points) {
    const currentInside = isInside(current);
    const previousInside = isInside(previous);

    if (currentInside) {
      if (!previousInside) output.push(intersection(previous, current));
      output.push(current);
    } else if (previousInside) {
      output.push(intersection(previous, current));
    }

    previous = current;
  }

  return output;
};

/** Recorta áreas poligonales sin introducir coordenadas de presentación. */
export const clipPolygonToDomain = (
  points,
  { xDomain, yDomain }
) => {
  if (!Array.isArray(points) || !points.every(isFinitePoint)) {
    throw new TypeError("El polígono solo puede contener puntos finitos.");
  }

  const [xMin, xMax] = assertDomain(xDomain, "xDomain");
  const [yMin, yMax] = assertDomain(yDomain, "yDomain");
  const boundaries = [
    [(point) => point.x >= xMin, (start, end) => intersectVertical(start, end, xMin)],
    [(point) => point.x <= xMax, (start, end) => intersectVertical(start, end, xMax)],
    [(point) => point.y >= yMin, (start, end) => intersectHorizontal(start, end, yMin)],
    [(point) => point.y <= yMax, (start, end) => intersectHorizontal(start, end, yMax)],
  ];

  return boundaries.reduce(
    (clipped, [isInside, intersection]) =>
      clipPolygonBoundary(clipped, isInside, intersection),
    points
  );
};

/**
 * Construye y recorta las áreas entre una serie y su línea base. Cada rama
 * discontinua produce un polígono independiente todavía en unidades físicas.
 */
export const createAreaPolygons = (
  points,
  baseline,
  domains
) => {
  if (!Number.isFinite(baseline)) {
    throw new TypeError("La línea base del área debe ser finita.");
  }

  return splitPointRuns(points)
    .filter((run) => run.length >= 2)
    .map((run) => [
      { x: run[0].x, y: baseline },
      ...run,
      { x: run.at(-1).x, y: baseline },
    ])
    .map((polygon) => clipPolygonToDomain(polygon, domains))
    .filter((polygon) => polygon.length >= 3);
};

/** Conserva únicamente marcadores visibles; las líneas se recortan aparte. */
export const getVisiblePoints = (points, transform) =>
  points.filter((point) => transform.isVisible(point));

const formatSvgNumber = (value) => {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
};

/**
 * La generación de path es la frontera geometría SVG: recibe segmentos físicos
 * validados y aplica la transformación una sola vez.
 */
export const segmentsToSvgPath = (segments, transform) =>
  segments.reduce((path, [start, end], index) => {
    const svgStart = transform.point(start);
    const svgEnd = transform.point(end);
    const previousEnd = index > 0
      ? transform.point(segments[index - 1][1])
      : null;
    const isContinuation = previousEnd &&
      Math.abs(previousEnd.x - svgStart.x) < EPSILON &&
      Math.abs(previousEnd.y - svgStart.y) < EPSILON;
    const command = isContinuation
      ? ["L", formatSvgNumber(svgEnd.x), formatSvgNumber(svgEnd.y)]
      : [
          "M",
          formatSvgNumber(svgStart.x),
          formatSvgNumber(svgStart.y),
          "L",
          formatSvgNumber(svgEnd.x),
          formatSvgNumber(svgEnd.y),
        ];

    return [...path, ...command];
  }, [])
    .join(" ");

/** Genera paths cerrados de área a partir de polígonos físicos recortados. */
export const polygonsToSvgPath = (polygons, transform) =>
  polygons
    .filter((polygon) => polygon.length >= 3)
    .map((polygon) => {
      const [first, ...rest] = polygon.map(transform.point);
      return [
        "M",
        formatSvgNumber(first.x),
        formatSvgNumber(first.y),
        ...rest.flatMap((point) => [
          "L",
          formatSvgNumber(point.x),
          formatSvgNumber(point.y),
        ]),
        "Z",
      ].join(" ");
    })
    .join(" ");
