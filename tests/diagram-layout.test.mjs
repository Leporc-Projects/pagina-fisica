// Pruebas unitarias de la geometría de etiquetado. El módulo es puro: no
// requiere navegador, Astro ni dependencias externas.
import assert from "node:assert/strict";
import test from "node:test";

import {
  ARROWHEAD_LENGTH,
  ARROWHEAD_WIDTH,
  DIAGRAM_FAMILIES,
  DIAGRAM_FAMILY_NAMES,
  DIAGRAM_LABEL_METRICS,
  DIAGRAM_PLACEMENTS,
  LABEL_ADVANCE_RATIO,
  boxOutsideAmount,
  boxOverlapArea,
  boxesOverlap,
  clampLabelToPlot,
  createArrowheadBox,
  createLabelBox,
  estimateLabelWidth,
  getDiagramFamily,
  resolveClearance,
  resolveLabelPlacement,
  resolveRectangleLabel,
} from "../src/utils/diagram-layout.js";

const PLOT = { left: 6, top: 6, width: 88, height: 52 };

test("deriva el ancho de la etiqueta del tamaño de fuente efectivo", () => {
  const text = "F_D";
  const desktop = estimateLabelWidth(text, DIAGRAM_LABEL_METRICS.desktop.fontSize);
  const mobile = estimateLabelWidth(text, DIAGRAM_LABEL_METRICS.mobile.fontSize);

  assert.equal(desktop, 3 * 2.4 * LABEL_ADVANCE_RATIO);
  assert.equal(mobile, 3 * 3.2 * LABEL_ADVANCE_RATIO);
  // El defecto corregido: un ancho fijo por carácter subestimaba el móvil.
  assert.ok(mobile > desktop);
  assert.throws(() => estimateLabelWidth("A", Number.NaN), TypeError);
});

test("la caja del texto crece hacia arriba desde la línea base", () => {
  const box = createLabelBox({ x: 10, y: 20, width: 6, fontSize: 2.4, anchor: "start" });

  assert.equal(box.left, 10);
  assert.equal(box.right, 16);
  assert.ok(box.top < 20);
  assert.ok(box.bottom > 20);
  assert.equal(
    createLabelBox({ x: 10, y: 20, width: 6, fontSize: 2.4, anchor: "middle" }).left,
    7
  );
  assert.equal(
    createLabelBox({ x: 10, y: 20, width: 6, fontSize: 2.4, anchor: "end" }).left,
    4
  );
});

test("sitúa la punta de flecha exactamente en el extremo del vector", () => {
  const box = createArrowheadBox({ x: 10, y: 20 }, { x: 30, y: 20 });

  assert.equal(box.right, 30);
  assert.equal(box.left, 30 - ARROWHEAD_LENGTH);
  assert.ok(Math.abs(box.bottom - box.top - ARROWHEAD_WIDTH) < 1e-9);
});

test("mide solape y recorte con áreas positivas", () => {
  const first = { left: 0, right: 4, top: 0, bottom: 2 };
  const second = { left: 3, right: 8, top: 1, bottom: 5 };

  assert.equal(boxOverlapArea(first, second), 1);
  assert.ok(boxesOverlap(first, second));
  assert.equal(boxOverlapArea(first, { left: 5, right: 9, top: 0, bottom: 2 }), 0);
  assert.equal(boxOutsideAmount({ left: 10, right: 20, top: 10, bottom: 12 }, PLOT), 0);
  assert.ok(boxOutsideAmount({ left: 2, right: 20, top: 10, bottom: 12 }, PLOT) > 0);
});

test("la separación incorpora el semiancho de la punta cuando existe flecha", () => {
  const withArrow = resolveClearance({ fontSize: 2.4, hasArrowhead: true });
  const withoutArrow = resolveClearance({ fontSize: 2.4, hasArrowhead: false });

  assert.ok(withArrow > withoutArrow);
  assert.ok(withArrow >= ARROWHEAD_WIDTH / 2);
});

test("coloca la etiqueta fuera de la punta sin invadirla", () => {
  const start = { x: 10, y: 30 };
  const end = { x: 40, y: 30 };
  const clearance = resolveClearance({ fontSize: 3.2, hasArrowhead: true });
  const placed = resolveLabelPlacement({
    start,
    end,
    placement: "beyond-tip",
    clearance,
    textHeight: 3.2,
  });

  assert.equal(placed.anchor, "start");
  assert.ok(placed.x > end.x);
  const labelBox = createLabelBox({
    x: placed.x,
    y: placed.y,
    width: estimateLabelWidth("v", 3.2),
    fontSize: 3.2,
    anchor: placed.anchor,
  });
  assert.equal(boxOverlapArea(labelBox, createArrowheadBox(start, end)), 0);
});

test("la normal de un vector horizontal apunta hacia arriba en pantalla", () => {
  const placed = resolveLabelPlacement({
    start: { x: 10, y: 30 },
    end: { x: 40, y: 30 },
    placement: "normal",
    clearance: 2,
    textHeight: 2.4,
  });

  assert.equal(placed.anchor, "middle");
  assert.equal(placed.x, 25);
  assert.ok(placed.y < 30);
});

test("la normal de un vector vertical desplaza la etiqueta hacia un lado", () => {
  const placed = resolveLabelPlacement({
    start: { x: 20, y: 40 },
    end: { x: 20, y: 10 },
    placement: "normal",
    clearance: 2,
    textHeight: 2.4,
  });

  assert.notEqual(placed.x, 20);
  assert.notEqual(placed.anchor, "middle");
});

test("above y below dejan libre el elemento en ambos sentidos", () => {
  const geometry = { start: { x: 10, y: 30 }, end: { x: 30, y: 30 } };
  const above = resolveLabelPlacement({ ...geometry, placement: "above", clearance: 2, textHeight: 2.4 });
  const below = resolveLabelPlacement({ ...geometry, placement: "below", clearance: 2, textHeight: 2.4 });

  assert.ok(createLabelBox({ ...above, width: 4, fontSize: 2.4 }).bottom <= 28.001);
  assert.ok(createLabelBox({ ...below, width: 4, fontSize: 2.4 }).top >= 31.999);
});

test("rechaza placements fuera del contrato", () => {
  assert.throws(
    () => resolveLabelPlacement({
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      placement: "middle",
      clearance: 1,
      textHeight: 2.4,
    }),
    RangeError
  );
  assert.equal(DIAGRAM_PLACEMENTS.length, 7);
});

test("devuelve la etiqueta al área de trazado sin recortar el texto", () => {
  const clamped = clampLabelToPlot({
    x: 2,
    y: 4,
    width: 10,
    fontSize: 2.4,
    anchor: "start",
    plot: PLOT,
  });
  const box = createLabelBox({ ...clamped, width: 10, fontSize: 2.4 });

  assert.equal(boxOutsideAmount(box, PLOT), 0);
  assert.ok(clamped.x > 2);
  assert.ok(clamped.y > 4);
});

test("la etiqueta del rectángulo entra cuando cabe y sube cuando no", () => {
  const wide = { left: 10, right: 60, top: 10, bottom: 30 };
  const narrow = { left: 10, right: 14, top: 10, bottom: 12 };

  assert.equal(resolveRectangleLabel({ box: wide, text: "sistema", fontSize: 2.4 }).placement, "inside");
  assert.equal(resolveRectangleLabel({ box: narrow, text: "sistema", fontSize: 2.4 }).placement, "above");
  assert.ok(resolveRectangleLabel({ box: narrow, text: "sistema", fontSize: 2.4 }).y < narrow.top);
  // La decisión es del renderer, pero la figura puede anularla explícitamente.
  assert.equal(
    resolveRectangleLabel({ box: narrow, text: "sistema", fontSize: 2.4, placement: "inside" }).placement,
    "inside"
  );
});

test("cada familia declara encuadre, respiro, colocación y estilos", () => {
  assert.deepEqual(DIAGRAM_FAMILY_NAMES, [
    "vector-geometry",
    "system-boundary",
    "free-body",
    "motion-sketch",
    "concept-map",
    "force-sum",
  ]);

  for (const name of DIAGRAM_FAMILY_NAMES) {
    const family = DIAGRAM_FAMILIES[name];
    assert.ok(family.aspectRatio >= 0.5 && family.aspectRatio <= 1);
    assert.ok(family.padding > 0);
    for (const kind of ["vector", "segment", "point", "rectangle", "annotation"]) {
      assert.ok(DIAGRAM_PLACEMENTS.includes(family.placement[kind]), `${name}.${kind}`);
    }
    assert.ok(family.styles.vector);
    assert.ok(family.styles.rectangle);
  }

  assert.throws(() => getDiagramFamily("free-body-diagram"), RangeError);
});
