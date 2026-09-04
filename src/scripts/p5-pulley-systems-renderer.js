import p5 from "p5";
import { t } from "../i18n/index.js";
import { createPulleySceneGeometry } from "../utils/pulley-geometry.js";
import { listenForSimulationThemeChange } from "../utils/simulation-theme.js";

const cssColor = (container, name, fallback) =>
  getComputedStyle(container).getPropertyValue(name).trim() || fallback;

export const createPulleySystemsP5Renderer = ({ container, getFrame, locale }) => {
  let instance;
  let resizeObserver;
  let removeThemeListener;
  const sketch = (p) => {
    const canvasHeight = (width) => Math.max(540, Math.min(700, width * .78));

    const pulley = ({ x, y, radius, rotationPhase }, colors) => {
      p.push();
      p.stroke(colors.metal);
      p.strokeWeight(3);
      p.fill(colors.panel);
      p.circle(x, y, radius * 2);
      p.noFill();
      p.stroke(colors.rope);
      p.strokeWeight(2);
      p.circle(x, y, radius * 1.72);
      p.translate(x, y);
      p.rotate(rotationPhase);
      p.stroke(colors.metal);
      p.strokeWeight(2);
      for (let index = 0; index < 3; index += 1) {
        p.rotate(Math.PI / 3);
        p.line(-radius * .66, 0, radius * .66, 0);
      }
      p.fill(colors.marker);
      p.noStroke();
      p.circle(radius * .66, 0, Math.max(5, radius * .16));
      p.fill(colors.metal);
      p.circle(0, 0, 9);
      p.pop();
    };

    const block = (geometry, label, mass, colors, accent = colors.block, hookKeys = ["top"]) => {
      p.push();
      p.rectMode(p.CENTER);
      p.stroke(colors.metal);
      p.strokeWeight(2);
      p.fill(accent);
      p.rect(geometry.x, geometry.y, geometry.width, geometry.height, 8);
      p.noStroke();
      p.fill(colors.panel);
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.textSize(12);
      p.text(`${label}\n${mass} kg`, geometry.x, geometry.y);
      p.stroke(colors.metal);
      p.strokeWeight(2);
      p.fill(colors.panel);
      hookKeys.forEach((key) => {
        const hook = geometry.hooks[key];
        if (hook) p.circle(hook.x, hook.y, 5);
      });
      p.pop();
    };

    const drawRope = ({ points, style }, colors) => {
      p.noFill();
      p.stroke(style === "secondary" ? colors.ropeSecondary : colors.rope);
      p.strokeWeight(style === "secondary" ? 5 : 4);
      p.strokeJoin(p.ROUND);
      p.strokeCap(p.ROUND);
      p.beginShape();
      points.forEach(({ x, y }) => p.vertex(x, y));
      p.endShape();
    };

    const polyline = (points, colors, weight = 3) => {
      p.noFill();
      p.stroke(colors.metal);
      p.strokeWeight(weight);
      p.strokeJoin(p.ROUND);
      p.beginShape();
      points.forEach(({ x, y }) => p.vertex(x, y));
      p.endShape();
    };

    const support = ({ x, y, width = 64 }, colors) => {
      p.push();
      p.rectMode(p.CENTER);
      p.stroke(colors.metal);
      p.strokeWeight(2);
      p.fill(colors.hardwareFill);
      p.rect(x, y, width, 10, 3);
      p.fill(colors.metal);
      p.noStroke();
      p.circle(x - width * .34, y, 4);
      p.circle(x + width * .34, y, 4);
      p.pop();
    };

    const anchor = ({ x, y, type }, colors) => {
      p.push();
      p.stroke(colors.metal);
      p.strokeWeight(3);
      p.fill(colors.panel);
      if (type === "fixed") p.line(x, y - 8, x, y);
      else p.line(x - 8, y, x + 8, y);
      p.circle(x, y, 9);
      p.pop();
    };

    const table = ({ x, edgeX, y, thickness, legX }, colors) => {
      p.push();
      p.stroke(colors.metal);
      p.strokeWeight(2);
      p.fill(colors.hardwareFill);
      p.rectMode(p.CORNERS);
      p.rect(x, y, edgeX, y + thickness, 2);
      p.rectMode(p.CENTER);
      p.rect(legX, y + (p.height - 20 - y) / 2, 12, p.height - 20 - y, 2);
      p.pop();
    };

    const ropeLabel = ({ tensionLabel, labelPoint, style }, colors) => {
      if (!tensionLabel || !labelPoint) return;
      p.push();
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.textSize(11);
      const labelWidth = p.textWidth(tensionLabel) + 12;
      p.rectMode(p.CENTER);
      p.stroke(style === "secondary" ? colors.ropeSecondary : colors.rope);
      p.strokeWeight(1);
      p.fill(colors.panel);
      p.rect(labelPoint.x, labelPoint.y, labelWidth, 20, 10);
      p.noStroke();
      p.fill(colors.text);
      p.text(tensionLabel, labelPoint.x, labelPoint.y + .5);
      p.pop();
    };

    p.setup = () => {
      const width = Math.max(320, container.clientWidth);
      p.createCanvas(width, canvasHeight(width)).parent(container);
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      p.noLoop();
      resizeObserver = new ResizeObserver(() => {
        const nextWidth = Math.max(320, container.clientWidth);
        p.resizeCanvas(nextWidth, canvasHeight(nextWidth));
        p.redraw();
      });
      resizeObserver.observe(container);
    };

    p.draw = () => {
      const frame = getFrame();
      const colors = {
        background: cssColor(container, "--content-canvas", "#f4f7fb"),
        panel: cssColor(container, "--surface", "#ffffff"),
        text: cssColor(container, "--text", "#172033"),
        muted: cssColor(container, "--text-muted", "#64748b"),
        grid: cssColor(container, "--border", "#d7deea"),
        metal: cssColor(container, "--border-strong", "#64748b"),
        hardwareFill: cssColor(container, "--surface-raised", "#eef2f7"),
        rope: cssColor(container, "--text-muted", "#475569"),
        ropeSecondary: cssColor(container, "--data-series-4", "#7c3aed"),
        marker: cssColor(container, "--accent-secondary", "#b45309"),
        block: cssColor(container, "--accent", "#1769aa"),
        second: cssColor(container, "--data-series-3", "#047857"),
        third: cssColor(container, "--data-series-4", "#7c3aed"),
      };
      p.background(colors.background);
      const compact = p.width < 620;
      const q = frame.readings.positions;
      const geometry = createPulleySceneGeometry({
        scenarioId: frame.scenarioId,
        width: p.width,
        height: p.height,
        positions: q,
        compact,
      });
      p.fill(colors.text);
      p.noStroke();
      p.textAlign(p.LEFT, p.TOP);
      p.textStyle(p.BOLD);
      p.textSize(compact ? 12 : 14);
      p.text(t(locale, `pulleySystems.scenario.${frame.scenarioId}`), 16, 14);

      // Capas semánticas: soporte fijo → anclajes → cuerdas → herrajes móviles → ruedas → cargas → etiquetas.
      if (geometry.table) table(geometry.table, colors);
      geometry.supports.forEach((item) => support(item, colors));
      geometry.connectors.filter(({ type }) => ["axle", "mount"].includes(type)).forEach(({ points, type }) => polyline(points, colors, type === "mount" ? 6 : 5));
      geometry.anchors.forEach((item) => anchor(item, colors));
      geometry.ropes.forEach((item) => drawRope(item, colors));
      geometry.connectors.filter(({ type }) => !["axle", "mount"].includes(type)).forEach(({ points, type }) => polyline(points, colors, type === "lifting-frame" ? 6 : 4));
      geometry.pulleys.forEach((item) => pulley(item, colors));

      if (frame.scenarioId === "table-hanging") {
        block(geometry.blocks.m1, "m₁", frame.parameters.m1, colors, colors.block, ["right"]);
        block(geometry.blocks.m2, "m₂", frame.parameters.m2, colors, colors.second);
        p.fill(colors.muted); p.noStroke(); p.textStyle(p.NORMAL); p.text(t(locale, frame.readings.status === "static" ? "pulleySystems.tableStaticNote" : "pulleySystems.tableKineticNote"), 28, p.height - 48, p.width - 56, 36);
      } else if (frame.scenarioId === "atwood") {
        block(geometry.blocks.m1, "m₁", frame.parameters.m1, colors);
        block(geometry.blocks.m2, "m₂", frame.parameters.m2, colors, colors.second);
      } else if (["movable-pulley", "three-pulley-tackle"].includes(frame.scenarioId)) {
        block(geometry.blocks.mL, "mL", frame.parameters.mL, colors);
        block(geometry.blocks.mC, "mC", frame.parameters.mC, colors, colors.second);
        if (frame.scenarioId === "three-pulley-tackle") {
          p.fill(colors.muted); p.noStroke(); p.textStyle(p.NORMAL); p.text("3T ↑ · T = const.", 18, p.height - 36);
        }
      } else {
        block(geometry.blocks.m3, "m₃", frame.parameters.m3, colors, colors.third);
        block(geometry.blocks.m1, "m₁", frame.parameters.m1, colors);
        block(geometry.blocks.m2, "m₂", frame.parameters.m2, colors, colors.second);
        p.fill(colors.muted); p.noStroke(); p.textStyle(p.NORMAL); p.text("Tᴄ = 2Tᴀ", 18, p.height - 36);
      }

      geometry.ropes.forEach((item) => ropeLabel(item, colors));

    };
  };
  instance = new p5(sketch);
  removeThemeListener = listenForSimulationThemeChange({ target: window, redraw: () => instance.redraw() });
  return Promise.resolve({
    update() { instance.redraw(); },
    destroy() { removeThemeListener?.(); resizeObserver?.disconnect(); instance.remove(); },
  });
};
