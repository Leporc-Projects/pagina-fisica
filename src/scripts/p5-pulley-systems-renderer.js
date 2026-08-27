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
    const pulley = ({ x, y, radius }, colors) => {
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
      // Los radios son estáticos: no se finge una cinemática de no deslizamiento.
      p.stroke(colors.metal);
      p.strokeWeight(2);
      p.line(-radius * .68, 0, radius * .68, 0);
      p.line(0, -radius * .68, 0, radius * .68);
      p.fill(colors.metal);
      p.noStroke();
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

    const rope = (points, colors) => {
      p.noFill();
      p.stroke(colors.rope);
      p.strokeWeight(4);
      p.strokeJoin(p.ROUND);
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
      p.stroke(colors.metal);
      p.strokeWeight(4);
      p.line(x - width / 2, y, x + width / 2, y);
      p.strokeWeight(1);
      for (let dx = -width / 2 + 6; dx <= width / 2; dx += 12) p.line(x + dx, y, x + dx - 9, y + 9);
    };

    const anchor = ({ x, y }, colors) => {
      p.stroke(colors.metal);
      p.strokeWeight(3);
      p.line(x - 10, y, x + 10, y);
      p.line(x - 8, y, x - 2, y + 7);
      p.line(x, y, x + 6, y + 7);
    };

    const stop = ({ x, y }, colors) => {
      p.stroke(colors.muted);
      p.strokeWeight(2);
      p.line(x - 12, y, x + 12, y);
      p.line(x - 8, y, x - 3, y - 6);
      p.line(x + 2, y, x + 7, y - 6);
    };

    p.setup = () => {
      const width = Math.max(320, container.clientWidth);
      p.createCanvas(width, Math.max(480, Math.min(620, width * .72))).parent(container);
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      p.noLoop();
      resizeObserver = new ResizeObserver(() => {
        const nextWidth = Math.max(320, container.clientWidth);
        p.resizeCanvas(nextWidth, Math.max(480, Math.min(620, nextWidth * .72)));
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
        rope: cssColor(container, "--text-muted", "#475569"),
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

      // Capas: estructura → límites → cuerda → conectores → ruedas → masas.
      geometry.supports.filter(({ type }) => type === "ceiling").forEach((item) => support(item, colors));
      geometry.supports.filter(({ type }) => type === "bracket").forEach((item) => polyline(item.points, colors, 5));
      geometry.stops.forEach((item) => stop(item, colors));
      geometry.anchors.forEach((item) => anchor(item, colors));
      if (frame.scenarioId === "table-hanging") {
        p.stroke(colors.metal); p.strokeWeight(6);
        p.line(geometry.table.x, geometry.table.y, geometry.table.edgeX, geometry.table.y);
        p.line(geometry.table.legX, geometry.table.y, geometry.table.legX, p.height - 20);
      }
      geometry.ropes.forEach((points) => rope(points, colors));
      geometry.connectors.forEach(({ points, type }) => polyline(points, colors, type === "axle" ? 4 : 3));
      geometry.pulleys.forEach((item) => pulley(item, colors));

      if (frame.scenarioId === "table-hanging") {
        block(geometry.blocks.m1, "m₁", frame.parameters.m1, colors, colors.block, ["upperRight"]);
        block(geometry.blocks.m2, "m₂", frame.parameters.m2, colors, colors.second);
        p.fill(colors.muted); p.noStroke(); p.textStyle(p.NORMAL); p.text(t(locale, frame.readings.status === "static" ? "pulleySystems.tableStaticNote" : "pulleySystems.tableKineticNote"), 28, p.height - 48, p.width - 56, 36);
      } else if (frame.scenarioId === "atwood") {
        block(geometry.blocks.m1, "m₁", frame.parameters.m1, colors);
        block(geometry.blocks.m2, "m₂", frame.parameters.m2, colors, colors.second);
      } else if (frame.scenarioId === "movable-pulley") {
        block(geometry.blocks.mL, "mL", frame.parameters.mL, colors);
        block(geometry.blocks.mC, "mC", frame.parameters.mC, colors, colors.second);
      } else {
        block(geometry.blocks.m3, "m₃", frame.parameters.m3, colors, colors.third);
        block(geometry.blocks.m1, "m₁", frame.parameters.m1, colors);
        block(geometry.blocks.m2, "m₂", frame.parameters.m2, colors, colors.second);
        p.fill(colors.muted); p.noStroke(); p.textStyle(p.NORMAL); p.text("Tᴄ = 2Tᴀ", 18, p.height - 36);
      }

    };
  };
  instance = new p5(sketch);
  removeThemeListener = listenForSimulationThemeChange({ target: window, redraw: () => instance.redraw() });
  return Promise.resolve({
    update() { instance.redraw(); },
    destroy() { removeThemeListener?.(); resizeObserver?.disconnect(); instance.remove(); },
  });
};
