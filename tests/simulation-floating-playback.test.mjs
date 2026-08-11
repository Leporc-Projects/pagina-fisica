import assert from "node:assert/strict";
import test from "node:test";

import { shouldShowFloatingPlayback } from "../src/scripts/simulation-floating-playback.js";

test("el control flotante solo acompaña una simulación visible sin reproducción canónica", () => {
  assert.equal(shouldShowFloatingPlayback(true, true), false);
  assert.equal(shouldShowFloatingPlayback(false, true), true);
  assert.equal(shouldShowFloatingPlayback(false, false), false);
  assert.equal(shouldShowFloatingPlayback(undefined, true), false);
});
