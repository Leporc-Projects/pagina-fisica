import p5 from "p5";
import { t } from "../i18n/index.js";

const cssColor = (container, name, fallback) =>
  getComputedStyle(container).getPropertyValue(name).trim() || fallback;

export const createPulleySystemsP5Renderer = ({ container, getFrame, locale }) => {
  let instance;
  let resizeObserver;
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
      p.fill(colors.text);
      p.noStroke();
      p.textAlign(p.LEFT, p.TOP);
      p.textStyle(p.BOLD);
      p.textSize(compact ? 12 : 14);
      p.text(t(locale, `pulleySystems.scenario.${frame.scenarioId}`), 16, 14);

      if (frame.scenarioId === "table-hanging") {
        const edgeX = p.width * .72;
        const tableY = p.height * .48;
        const pulleyX = edgeX + 24;
        const pulleyY = tableY - 22;
        const blockX = Math.min(edgeX - 72, p.width * .34 + q.m1 * scale);
        const hangingY = p.height * .58 + q.m2 * scale;
        p.stroke(colors.metal); p.strokeWeight(6); p.line(28, tableY, edgeX, tableY); p.line(edgeX, tableY, edgeX, p.height - 24);
        rope([{ x: blockX + 36, y: tableY - 27 }, { x: pulleyX, y: pulleyY - 28 }, { x: pulleyX + 28, y: pulleyY }, { x: pulleyX + 28, y: hangingY - 30 }], colors);
        pulley(pulleyX, pulleyY, 28, rotation, colors);
        block(blockX, tableY - 25, 72, 48, "m₁", frame.parameters.m1, colors);
        block(pulleyX + 28, hangingY, 62, 58, "m₂", frame.parameters.m2, colors, colors.second);
        p.fill(colors.muted); p.noStroke(); p.textStyle(p.NORMAL); p.text(t(locale, frame.readings.status === "static" ? "pulleySystems.tableStaticNote" : "pulleySystems.tableKineticNote"), 28, p.height - 48, p.width - 56, 36);
      } else if (frame.scenarioId === "atwood") {
        const cx = p.width * .5;
        const cy = 105;
        const leftY = p.height * .58 + q.m1 * scale;
        const rightY = p.height * .58 + q.m2 * scale;
        support(cx, 38, colors); p.stroke(colors.metal); p.line(cx, 38, cx, cy - 31);
        rope([{ x: cx - 30, y: leftY - 30 }, { x: cx - 30, y: cy }, { x: cx, y: cy - 30 }, { x: cx + 30, y: cy }, { x: cx + 30, y: rightY - 30 }], colors);
        pulley(cx, cy, 30, rotation, colors);
        block(cx - 30, leftY, 62, 58, "m₁", frame.parameters.m1, colors);
        block(cx + 30, rightY, 62, 58, "m₂", frame.parameters.m2, colors, colors.second);
      } else if (frame.scenarioId === "movable-pulley") {
        const top = 52;
        const anchorX = p.width * .2;
        const mobileX = p.width * .46;
        const fixedX = p.width * .76;
        const mobileY = p.height * .46 + q.mL * scale;
        const counterY = p.height * .56 + q.mC * scale;
        support(anchorX, top, colors); support(fixedX, top, colors);
        rope([{ x: anchorX, y: top }, { x: anchorX, y: mobileY }, { x: mobileX, y: mobileY + 30 }, { x: fixedX, y: top + 30 }, { x: fixedX + 30, y: top + 60 }, { x: fixedX + 30, y: counterY - 31 }], colors);
        pulley(mobileX, mobileY, 30, -rotation, colors, true);
        pulley(fixedX, top + 30, 30, rotation * 2, colors);
        block(mobileX, mobileY + 88, 72, 58, "mL", frame.parameters.mL, colors);
        block(fixedX + 30, counterY, 62, 58, "mC", frame.parameters.mC, colors, colors.second);
        p.fill(colors.muted); p.noStroke(); p.textStyle(p.NORMAL); p.text(t(locale, "pulleySystems.twoToOneScene"), 18, p.height - 45, p.width - 36, 34);
      } else {
        const fixedX = p.width * .42;
        const fixedY = 92;
        const mass3X = fixedX - 34;
        const mobileX = p.width * .67;
        const mobileY = p.height * .42 + q.pulley * scale;
        const m3Y = p.height * .42 + q.m3 * scale;
        const m1X = mobileX - (compact ? 42 : 68);
        const m2X = mobileX + (compact ? 42 : 68);
        const m1Y = p.height * .72 + q.m1 * scale;
        const m2Y = p.height * .72 + q.m2 * scale;
        support(fixedX, 34, colors); p.stroke(colors.metal); p.line(fixedX, 34, fixedX, fixedY - 29);
        rope([{ x: mass3X, y: m3Y - 30 }, { x: mass3X, y: fixedY }, { x: fixedX, y: fixedY - 29 }, { x: fixedX + 30, y: fixedY }, { x: fixedX + 30, y: mobileY - 42 }, { x: mobileX, y: mobileY - 42 }], colors);
        pulley(fixedX, fixedY, 29, rotation, colors);
        block(mass3X, m3Y, 58, 55, "m₃", frame.parameters.m3, colors, colors.third);
        rope([{ x: m1X, y: m1Y - 28 }, { x: m1X, y: mobileY }, { x: mobileX, y: mobileY - 29 }, { x: m2X, y: mobileY }, { x: m2X, y: m2Y - 28 }], colors);
        pulley(mobileX, mobileY, 29, -rotation, colors, true);
        block(m1X, m1Y, compact ? 52 : 58, 54, "m₁", frame.parameters.m1, colors);
        block(m2X, m2Y, compact ? 52 : 58, 54, "m₂", frame.parameters.m2, colors, colors.second);
        p.fill(colors.muted); p.noStroke(); p.textStyle(p.NORMAL); p.text("Tᴄ = 2Tᴀ", 18, p.height - 36);
      }

      if (frame.readings.status === "travel-limit") {
        p.fill(colors.panel); p.stroke(colors.warning); p.strokeWeight(2); p.rect(18, 58, p.width - 36, 58, 10);
        p.noStroke(); p.fill(colors.text); p.textStyle(p.BOLD); p.text(t(locale, "pulleySystems.limitReached"), 34, 80);
      }
    };
  };
  instance = new p5(sketch);
  return Promise.resolve({
    update() { instance.redraw(); },
    destroy() { resizeObserver?.disconnect(); instance.remove(); },
  });
};
