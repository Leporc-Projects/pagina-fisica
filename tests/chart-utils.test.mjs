// Pruebas unitarias del núcleo matemático; no requieren navegador ni dependencias.
import assert from "node:assert/strict";
import test from "node:test";

import {
  assertDomain,
  clipSegmentToDomain,
  createAreaPolygons,
  createCartesianTransform,
  createClippedSegments,
  createIsotropicTransform,
  createLinearScale,
  createLinearTicks,
  sampleFunction,
  segmentsToSvgPath,
} from "../src/utils/chart.js";

test("valida dominios físicos crecientes", () => {
  assert.deepEqual(assertDomain([-2, 3]), [-2, 3]);
  assert.throws(() => assertDomain([2, 2]), RangeError);
  assert.throws(() => assertDomain([3, -2]), RangeError);
  assert.throws(() => assertDomain([0, Number.NaN]), RangeError);
});

test("mantiene una escala física isotrópica y centra el letterboxing", () => {
  const transform = createIsotropicTransform({
    xDomain: [-4, 4],
    yDomain: [-2, 2],
    plot: { left: 10, top: 5, width: 80, height: 60 },
  });
  const origin = transform.point({ x: 0, y: 0 });
  const unitX = transform.point({ x: 1, y: 0 });
  const unitY = transform.point({ x: 0, y: 1 });

  assert.equal(Math.abs(unitX.x - origin.x), Math.abs(unitY.y - origin.y));
  assert.deepEqual(transform.plot, {
    left: 10,
    top: 15,
    width: 80,
    height: 40,
  });
  assert.equal(transform.scale, 10);
});

test("transforma extremos físicos al plot SVG e invierte el eje y", () => {
  const transform = createCartesianTransform({
    xDomain: [-10, 10],
    yDomain: [-5, 15],
    plot: { left: 10, top: 4, width: 80, height: 40 },
  });

  assert.deepEqual(transform.point({ x: -10, y: -5 }), { x: 10, y: 44 });
  assert.deepEqual(transform.point({ x: 10, y: 15 }), { x: 90, y: 4 });
  assert.deepEqual(transform.point({ x: 0, y: 5 }), { x: 50, y: 24 });
});

test("acepta rangos descendentes sin mezclar escala y dato", () => {
  const scale = createLinearScale([0, 4], [10, 2]);
  assert.equal(scale(0), 10);
  assert.equal(scale(2), 6);
  assert.equal(scale(4), 2);
});

test("genera ticks uniformes e incluye ambos extremos", () => {
  assert.deepEqual(createLinearTicks([-2, 2], 5), [-2, -1, 0, 1, 2]);
  assert.throws(() => createLinearTicks([0, 1], 1), RangeError);
});

test("recorta segmentos que cruzan el dominio y descarta los externos", () => {
  const domains = { xDomain: [-1, 1], yDomain: [-1, 1] };

  assert.deepEqual(
    clipSegmentToDomain({ x: -2, y: 0 }, { x: 2, y: 0 }, domains),
    [{ x: -1, y: 0 }, { x: 1, y: 0 }]
  );
  assert.equal(
    clipSegmentToDomain({ x: -3, y: 2 }, { x: -2, y: 2 }, domains),
    null
  );
});

test("los cortes nulos impiden unir ramas discontinuas", () => {
  const points = sampleFunction({
    evaluate: (value) => value === 0 ? Number.POSITIVE_INFINITY : 1 / value,
    domain: [-1, 1],
    samples: 5,
  });
  const segments = createClippedSegments(points, {
    xDomain: [-1, 1],
    yDomain: [-2, 2],
  });

  assert.equal(points[2], null);
  assert.equal(segments.length, 2);
});

test("genera un path SVG finito después de transformar y recortar", () => {
  const domains = { xDomain: [-1, 1], yDomain: [-1, 1] };
  const transform = createCartesianTransform({
    ...domains,
    plot: { left: 0, top: 0, width: 100, height: 50 },
  });
  const segments = createClippedSegments(
    [{ x: -2, y: 0 }, { x: 0, y: 0 }, { x: 2, y: 0 }],
    domains
  );
  const path = segmentsToSvgPath(segments, transform);

  assert.equal(path, "M 0 25 L 50 25 L 100 25");
  assert.doesNotMatch(path, /NaN|Infinity/);
});

test("recorta áreas contra ambos dominios antes de crear el SVG", () => {
  const polygons = createAreaPolygons(
    [
      { x: -2, y: 0.5 },
      { x: 0, y: 2 },
      { x: 2, y: 0.5 },
    ],
    -2,
    { xDomain: [-1, 1], yDomain: [-1, 1] }
  );

  assert.equal(polygons.length, 1);
  assert.ok(
    polygons[0].every(
      (point) =>
        point.x >= -1 && point.x <= 1 &&
        point.y >= -1 && point.y <= 1
    )
  );
});
