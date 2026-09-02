import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const between = (contents, start, end) => {
  const startIndex = contents.indexOf(start);
  const endIndex = contents.indexOf(end, startIndex + start.length);
  assert.ok(startIndex !== -1 && endIndex !== -1, `se encontró el bloque entre ${start} y ${end}`);
  return contents.slice(startIndex, endIndex);
};

test("las ecuaciones en vivo de fricción separan relaciones y conservan bindings", () => {
  const analysis = source("src/components/simulations/ForcesFrictionAnalysis.astro");
  const staticRegime = between(
    analysis,
    '<div data-equation-regime="static">',
    '<div data-equation-regime="kinetic" hidden>',
  );
  const kineticRegime = between(
    analysis,
    '<div data-equation-regime="kinetic" hidden>',
    '<div data-equation-regime="contact-invalid" hidden>',
  );

  assert.doesNotMatch(staticRegime, /<mo>·<\/mo>/);
  assert.equal((staticRegime.match(/<math display="block">/g) ?? []).length, 4);
  assert.match(staticRegime, /<msub><mi>μ<\/mi><mi>s<\/mi><\/msub><mi>N<\/mi><\/mrow><\/math>/);
  assert.match(staticRegime, /<mo>∑<\/mo><msub><mi>F<\/mi><mo>∥<\/mo><\/msub><mo>=<\/mo><mn>0<\/mn><\/mrow><\/math>/);
  assert.match(staticRegime, /<mi>a<\/mi><mo>=<\/mo><mn>0<\/mn><\/mrow><\/math>/);

  assert.doesNotMatch(kineticRegime, /<mo>·<\/mo>/);
  assert.equal((kineticRegime.match(/<math display="block">/g) ?? []).length, 3);
  assert.match(kineticRegime, /data-equation="net"/);
  assert.match(kineticRegime, /data-equation="acceleration"/);
  assert.match(kineticRegime, /data-equation="net"[\s\S]*?<\/mrow><\/math>\s*<math display="block"><mrow><mi>a<\/mi>/);
});

test("la explicación separa proyectil, fricción y relaciones circulares", () => {
  const explanation = source("src/components/simulations/SimulationModelExplanation.astro");
  const projectile = between(explanation, '{modelId === "projectile-2d"', '{modelId === "forces-friction"');
  const forces = between(explanation, '{modelId === "forces-friction"', '{modelId === "circular-radial-force"');
  const circular = between(explanation, '{modelId === "circular-radial-force"', '{modelId === "pulley-systems"');

  assert.doesNotMatch(projectile, /vx₀[\s\S]*?·[\s\S]*?vy₀/);
  assert.match(projectile, /<p><span>vx₀<\/span> = v₀ cos θ<\/p>\s*<p><span>vy₀<\/span> = v₀ sin θ<\/p>/);

  assert.doesNotMatch(forces, /<mo>·<\/mo>/);
  assert.equal((forces.match(/<math display="block">/g) ?? []).length, 5);
  assert.match(forces, /<msub><mi>μ<\/mi><mi>s<\/mi><\/msub><mi>N<\/mi><\/mrow><\/math>\s*<math display="block">/);

  assert.doesNotMatch(circular, /<mo>·<\/mo>/);
  assert.equal((circular.match(/<math display="block">/g) ?? []).length, 5);
  assert.match(circular, /<msub><mi>a<\/mi><mi>r<\/mi><\/msub>[\s\S]*?<\/mrow><\/math>\s*<math display="block"><mrow><mi>ω<\/mi>/);
  assert.match(circular, /<msub><mi>F<\/mi><mi>r<\/mi><\/msub>[\s\S]*?<\/mrow><\/math>\s*<math display="block"><mrow><mi>T<\/mi>/);
});
