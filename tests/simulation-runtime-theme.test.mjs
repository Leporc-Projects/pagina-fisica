import assert from "node:assert/strict";
import test from "node:test";

import { listenForSimulationThemeChange } from "../src/utils/simulation-theme.js";

test("themechange redibuja sin tocar el estado y cleanup elimina el listener", () => {
  const target = new EventTarget();
  const physicalState = {
    t: 1.25,
    positions: { m1: 1.5, m2: 1.5 },
    velocities: { m1: 2.4, m2: 2.4 },
    history: [{ t: 0 }, { t: 1.25 }],
  };
  const before = structuredClone(physicalState);
  let redraws = 0;
  const remove = listenForSimulationThemeChange({
    target,
    redraw: () => { redraws += 1; },
  });

  target.dispatchEvent(new Event("themechange"));
  assert.equal(redraws, 1);
  assert.deepEqual(physicalState, before);

  remove();
  remove();
  target.dispatchEvent(new Event("themechange"));
  assert.equal(redraws, 1);
  assert.deepEqual(physicalState, before);
});

test("el enlace de tema rechaza contratos incompletos", () => {
  assert.throws(() => listenForSimulationThemeChange({ target: null, redraw() {} }), /EventTarget/);
  assert.throws(() => listenForSimulationThemeChange({ target: new EventTarget() }), /redibujado/);
});
