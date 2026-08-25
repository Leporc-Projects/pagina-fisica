import p5 from "p5";
import { t } from "../i18n/index.js";
import { createCanvasAlertLayout } from "../utils/canvas-text-layout.js";
import { createPulleySceneGeometry } from "../utils/pulley-geometry.js";
import { listenForSimulationThemeChange } from "../utils/simulation-theme.js";

const cssColor = (container, name, fallback) =>
  getComputedStyle(container).getPropertyValue(name).trim() || fallback;

export const createPulleySystemsP5Renderer = ({ container, getFrame, locale }) => {
  let instance;
  let resizeObserver;
  let removeThemeListener;
  const sketch = (p) => {
    const pulley = (x, y, radius, rotation, colors, mobile = false) => {
      p.push();
      p.stroke(colors.metal);
      p.strokeWeight(4);
      p.fill(colors.panel);
      p.circle(x, y, radius * 2);
      p.translate(x, y);
      p.rotate(rotation);
      p.strokeWeight(2);
      p.line(-radius * .68, 0, radius * .68, 0);
      p.line(0, -radius * .68, 0, radius * .68);
      p.fill(colors.metal);
      p.noStroke();
      p.circle(0, 0, 8);
      if (mobile) {
        p.stroke(colors.metal);
        p.strokeWeight(3);
        p.line(0, radius, 0, radius + 18);
      }
      p.pop();
    };

    const block = (x, y, width, height, label, mass, colors, accent = colors.block) => {
      p.push();
      p.rectMode(p.CENTER);
      p.stroke(colors.metal);
      p.strokeWeight(2);
      p.fill(accent);
      p.rect(x, y, width, height, 8);
      p.noStroke();
      p.fill(colors.panel);
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.textSize(12);
      p.text(`${label}\n${mass} kg`, x, y);
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

    const support = (x, y, colors) => {
      p.stroke(colors.metal);
      p.strokeWeight(4);
      p.line(x - 28, y, x + 28, y);
      p.strokeWeight(1);
      for (let dx = -24; dx <= 24; dx += 12) p.line(x + dx, y, x + dx - 9, y + 9);
    };

    p.setup = () => {
      const width = Math.max(320, container.clientWidth);
      p.createCanvas(width, Math.max(390, Math.min(560, width * .62))).parent(container);
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      p.noLoop();
      resizeObserver = new ResizeObserver(() => {
        const nextWidth = Math.max(320, container.clientWidth);
        p.resizeCanvas(nextWidth, Math.max(390, Math.min(560, nextWidth * .62)));
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
        warning: cssColor(container, "--status-warning-text", "#b91c1c"),
      };
      p.background(colors.background);
      const compact = p.width < 620;
      const scale = compact ? 21 : 28;
      const q = frame.readings.positions;
      const rotation = frame.state.t * 1.4 + Object.values(q)[0] * .8;
      const geometry = createPulleySceneGeometry({
        scenarioId: frame.scenarioId,
        width: p.width,
        height: p.height,
        positions: q,
        scale,
        compact,
      });
      p.fill(colors.text);
      p.noStroke();
      p.textAlign(p.LEFT, p.TOP);
      p.textStyle(p.BOLD);
      p.textSize(compact ? 12 : 14);
      p.text(t(locale, `pulleySystems.scenario.${frame.scenarioId}`), 16, 14);

      if (frame.scenarioId === "table-hanging") {
        p.stroke(colors.metal); p.strokeWeight(6); p.line(28, geometry.table.y, geometry.table.edgeX, geometry.table.y); p.line(geometry.table.edgeX, geometry.table.y, geometry.table.edgeX, p.height - 24);
        rope(geometry.ropes[0], colors);
        const fixed = geometry.pulleys[0];
        pulley(fixed.x, fixed.y, fixed.radius, rotation, colors);
        const m1 = geometry.blocks.m1;
        const m2 = geometry.blocks.m2;
        block(m1.x, m1.y, m1.width, m1.height, "m₁", frame.parameters.m1, colors);
        block(m2.x, m2.y, m2.width, m2.height, "m₂", frame.parameters.m2, colors, colors.second);
        p.fill(colors.muted); p.noStroke(); p.textStyle(p.NORMAL); p.text(t(locale, frame.readings.status === "static" ? "pulleySystems.tableStaticNote" : "pulleySystems.tableKineticNote"), 28, p.height - 48, p.width - 56, 36);
      } else if (frame.scenarioId === "atwood") {
        const fixed = geometry.pulleys[0];
        support(geometry.supports[0].x, geometry.supports[0].y, colors); p.stroke(colors.metal); p.line(fixed.x, geometry.supports[0].y, fixed.x, geometry.supports[0].pulleyTop);
        rope(geometry.ropes[0], colors);
        pulley(fixed.x, fixed.y, fixed.radius, rotation, colors);
        const m1 = geometry.blocks.m1;
        const m2 = geometry.blocks.m2;
        block(m1.x, m1.y, m1.width, m1.height, "m₁", frame.parameters.m1, colors);
        block(m2.x, m2.y, m2.width, m2.height, "m₂", frame.parameters.m2, colors, colors.second);
      } else if (frame.scenarioId === "movable-pulley") {
        geometry.supports.forEach(({ x, y }) => support(x, y, colors));
        rope(geometry.ropes[0], colors);
        const [mobile, fixed] = geometry.pulleys;
        pulley(mobile.x, mobile.y, mobile.radius, -rotation, colors, true);
        pulley(fixed.x, fixed.y, fixed.radius, rotation * 2, colors);
        const mL = geometry.blocks.mL;
        const mC = geometry.blocks.mC;
        block(mL.x, mL.y, mL.width, mL.height, "mL", frame.parameters.mL, colors);
        block(mC.x, mC.y, mC.width, mC.height, "mC", frame.parameters.mC, colors, colors.second);
        p.fill(colors.muted); p.noStroke(); p.textStyle(p.NORMAL); p.text(t(locale, "pulleySystems.twoToOneScene"), 18, p.height - 45, p.width - 36, 34);
      } else {
        const [fixed, mobile] = geometry.pulleys;
        support(geometry.supports[0].x, geometry.supports[0].y, colors); p.stroke(colors.metal); p.line(fixed.x, geometry.supports[0].y, fixed.x, geometry.supports[0].pulleyTop);
        geometry.ropes.forEach((path) => rope(path, colors));
        pulley(fixed.x, fixed.y, fixed.radius, rotation, colors);
        pulley(mobile.x, mobile.y, mobile.radius, -rotation, colors, true);
        const m1 = geometry.blocks.m1;
        const m2 = geometry.blocks.m2;
        const m3 = geometry.blocks.m3;
        block(m3.x, m3.y, m3.width, m3.height, "m₃", frame.parameters.m3, colors, colors.third);
        block(m1.x, m1.y, m1.width, m1.height, "m₁", frame.parameters.m1, colors);
        block(m2.x, m2.y, m2.width, m2.height, "m₂", frame.parameters.m2, colors, colors.second);
        p.fill(colors.muted); p.noStroke(); p.textStyle(p.NORMAL); p.text("Tᴄ = 2Tᴀ", 18, p.height - 36);
      }

      if (frame.readings.status === "travel-limit") {
        const message = t(locale, "pulleySystems.limitReached");
        p.textStyle(p.BOLD);
        p.textSize(compact ? 11 : 12);
        const alert = createCanvasAlertLayout({
          text: message,
          canvasWidth: p.width,
          compact,
          measureText: (value) => p.textWidth(value),
        });
        p.fill(colors.panel); p.stroke(colors.warning); p.strokeWeight(2);
        p.rect(alert.box.x, alert.box.y, alert.box.width, alert.box.height, 10);
        p.noStroke(); p.fill(colors.text); p.textAlign(p.LEFT, p.TOP);
        alert.lines.forEach((line, index) => p.text(
          line,
          alert.text.x,
          alert.text.y + index * alert.lineHeight
        ));
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
