import assert from "node:assert/strict";
import test from "node:test";

import { t } from "../src/i18n/index.js";
import { createCanvasAlertLayout } from "../src/utils/canvas-text-layout.js";

const measureText = (value) => Array.from(value).reduce((width, character) =>
  width + (character === " " ? 3.5 : /[ilí']/u.test(character) ? 3.2 : 6.4), 0);

test("el aviso completo ES/EN cabe en canvas móvil sin truncación", () => {
  for (const locale of ["es", "en"]) {
    const message = t(locale, "pulleySystems.limitReached");
    const layout = createCanvasAlertLayout({ text: message, canvasWidth: 320, measureText, compact: true });
    assert.equal(layout.lines.join(" "), message);
    assert.ok(layout.lines.length >= 3, `${locale}: se esperaba wrapping móvil`);
    assert.ok(layout.lines.every((line) => measureText(line) <= layout.text.width), `${locale}: línea fuera de caja`);
    assert.ok(layout.box.x >= 0 && layout.box.x + layout.box.width <= 320);
    assert.ok(layout.box.y + layout.box.height < 390);
    assert.doesNotMatch(layout.lines.join(""), /…|\.\.\.$/u);
  }
});

test("el aviso desktop conserva el mismo contenido y una caja responsive", () => {
  for (const locale of ["es", "en"]) {
    const message = t(locale, "pulleySystems.limitReached");
    const layout = createCanvasAlertLayout({ text: message, canvasWidth: 800, measureText });
    assert.equal(layout.lines.join(" "), message);
    assert.ok(layout.lines.every((line) => measureText(line) <= layout.text.width));
    assert.ok(layout.box.x + layout.box.width <= 800);
  }
});
