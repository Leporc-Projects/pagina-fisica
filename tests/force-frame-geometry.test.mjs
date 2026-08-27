import test from "node:test";
import assert from "node:assert/strict";
import {
  createInclinedForceFrame,
  createRightAngleMarker,
  resolveWeightInInclinedFrame,
} from "../src/utils/force-frame-geometry.js";

const close = (actual, expected, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);

for (const beta of [0, 15, 30, 45, 60]) {
  test(`el marco tangente-normal es ortonormal y exterior para β=${beta}°`, () => {
    const { tangent, outward } = createInclinedForceFrame(beta);
    close(Math.hypot(tangent.x, tangent.y), 1);
    close(Math.hypot(outward.x, outward.y), 1);
    close(tangent.x * outward.x + tangent.y * outward.y, 0);
    assert.ok(outward.y < 0);
    if (beta > 0) assert.ok(outward.x < 0);
    const marker = createRightAngleMarker({ x: 0, y: 0 }, beta, 10);
    close(Math.hypot(marker[1].x - marker[0].x, marker[1].y - marker[0].y), 10);
    close(Math.hypot(marker[2].x - marker[1].x, marker[2].y - marker[1].y), 10);
  });
}

test("la fuerza aplicada respeta α y el peso se recompone exactamente", () => {
  for (const beta of [0, 15, 30, 45, 60]) {
    for (const alpha of [-20, 0, 35]) {
      const frame = createInclinedForceFrame(beta, alpha);
      close(Math.hypot(frame.applied.x, frame.applied.y), 1);
      close(frame.applied.x * frame.tangent.x + frame.applied.y * frame.tangent.y, Math.cos(alpha * Math.PI / 180));
      close(frame.applied.x * frame.outward.x + frame.applied.y * frame.outward.y, Math.sin(alpha * Math.PI / 180));
    }
    const weight = resolveWeightInInclinedFrame(7, 9.8, beta);
    close(weight.parallel.x + weight.perpendicular.x, 0);
    close(weight.parallel.y + weight.perpendicular.y, 68.6);
  }
});
