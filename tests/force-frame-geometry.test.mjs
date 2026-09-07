import test from "node:test";
import assert from "node:assert/strict";
import {
  createForcesFrictionFbdGeometry,
  createInclinedForceFrame,
  createRightAngleMarker,
  resolveWeightInInclinedFrame,
} from "../src/utils/force-frame-geometry.js";
import { createForcesFrictionState } from "../src/utils/forces-friction.js";

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

test("el DCL usa una sola escala lineal y mantiene las razones físicas",()=>{const cases=[
  {m:4,beta:0,F:20,alpha:0,muS:1,muK:0.3,g:10,v0:0},
  {m:10,beta:0,F:20,alpha:0,muS:0.5,muK:0.3,g:9.8,v0:0},
  {m:10,beta:0,F:55,alpha:0,muS:0.5,muK:0.3,g:9.8,v0:0},
  {m:10,beta:30,F:0,alpha:0,muS:0.3,muK:0.2,g:9.8,v0:0},
  {m:8,beta:20,F:35,alpha:-25,muS:0.4,muK:0.25,g:9.8,v0:1},
];for(const parameters of cases){const state=createForcesFrictionState(parameters),snapshot=structuredClone(state),geometry=createForcesFrictionFbdGeometry({...parameters,normal:state.normal,friction:state.friction});assert.deepEqual(state,snapshot);assert.ok(Number.isFinite(geometry.pixelsPerNewton)&&geometry.pixelsPerNewton>0);for(const key of Object.keys(geometry.vectors)){const physical=geometry.vectors[key],display=geometry.displayVectors[key],physicalLength=Math.hypot(physical.x,physical.y),displayLength=Math.hypot(display.x,display.y);close(displayLength,physicalLength*geometry.pixelsPerNewton);close(physical.x*display.y-physical.y*display.x,0);assert.ok(physical.x*display.x+physical.y*display.y>=-1e-10);}assert.ok(Math.max(...Object.values(geometry.displayVectors).map(({x,y})=>Math.hypot(x,y)))<=geometry.maximumLength+1e-10);}const ratio=createForcesFrictionFbdGeometry({...cases[0],normal:40,friction:-20});close(Math.hypot(ratio.displayVectors.weight.x,ratio.displayVectors.weight.y)/Math.hypot(ratio.displayVectors.applied.x,ratio.displayVectors.applied.y),2);close(Math.hypot(ratio.displayVectors.applied.x,ratio.displayVectors.applied.y),Math.hypot(ratio.displayVectors.friction.x,ratio.displayVectors.friction.y));const zero=createForcesFrictionFbdGeometry({m:4,g:10,beta:0,alpha:0,F:0,normal:40,friction:0});close(Math.hypot(zero.displayVectors.applied.x,zero.displayVectors.applied.y),0);close(Math.hypot(zero.displayVectors.friction.x,zero.displayVectors.friction.y),0);close(Math.hypot(zero.displayVectors.normal.x,zero.displayVectors.normal.y),Math.hypot(zero.displayVectors.weight.x,zero.displayVectors.weight.y));});
