import p5 from "p5";
import { t } from "../i18n/index.js";

const cssColor = (container, name, fallback) =>
  getComputedStyle(container).getPropertyValue(name).trim() || fallback;

export const createForcesFrictionP5Renderer = ({ container, getFrame, locale }) => {
  let instance;
  let resizeObserver;
  const sketch = (p) => {
    const arrow = (x, y, dx, dy, color, label, dashed = false) => {
      const magnitude = Math.hypot(dx, dy);
      if (magnitude < 0.5) return;
      p.push();
      p.stroke(color);
      p.fill(color);
      p.strokeWeight(2.4);
      if (dashed) p.drawingContext.setLineDash([6, 5]);
      p.line(x, y, x + dx, y + dy);
      p.drawingContext.setLineDash([]);
      const angle = Math.atan2(dy, dx);
      p.translate(x + dx, y + dy);
      p.rotate(angle);
      p.triangle(0, 0, -10, -4, -10, 4);
      p.rotate(-angle);
      p.noStroke();
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.text(label, 7, dy < 0 ? -5 : 15);
      p.pop();
    };

    const forceArrow = (origin, vector, color, label, scale = 0.58) => {
      const magnitude = Math.hypot(vector.x, vector.y);
      if (magnitude < 0.01) return;
      const length = Math.min(78, 21 + Math.sqrt(magnitude) * 5.2) * scale;
      arrow(origin.x, origin.y, vector.x / magnitude * length, vector.y / magnitude * length, color, label);
    };

    const drawHistory = (frame, box, colors) => {
      p.noStroke();
      p.fill(colors.panel);
      p.rect(box.x, box.y, box.w, box.h, 10);
      p.fill(colors.muted);
      p.textSize(10);
      p.textStyle(p.NORMAL);
      p.text("v(t)", box.x + 9, box.y + 14);
      p.text("ΣF∥(t)", box.x + 9, box.y + box.h / 2 + 14);
      const history = frame.history;
      if (history.length < 2) return;
      const drawStrip = (key, y, height, color) => {
        const maximum = Math.max(1, ...history.map((sample) => Math.abs(sample[key])));
        p.stroke(colors.grid);
        p.strokeWeight(1);
        p.line(box.x + 44, y + height / 2, box.x + box.w - 8, y + height / 2);
        p.noFill();
        p.stroke(color);
        p.strokeWeight(2);
        p.beginShape();
        history.forEach((sample, index) => {
          const x = box.x + 44 + index / Math.max(1, history.length - 1) * (box.w - 54);
          const pointY = y + height / 2 - sample[key] / maximum * (height * 0.34);
          p.vertex(x, pointY);
        });
        p.endShape();
      };
      drawStrip("v", box.y + 4, box.h / 2 - 5, colors.velocity);
      drawStrip("net", box.y + box.h / 2 + 4, box.h / 2 - 8, colors.net);
    };

    const drawFbd = (frame, x, y, size, colors) => {
      p.noStroke();
      p.fill(colors.panel);
      p.rect(x, y, size, size, 12);
      p.fill(colors.text);
      p.textSize(11);
      p.textStyle(p.BOLD);
      p.text(t(locale, "forcesFriction.fbdShort"), x + 10, y + 17);
      const center = { x: x + size / 2, y: y + size / 2 + 8 };
      p.rectMode(p.CENTER);
      p.fill(colors.block);
      p.rect(center.x, center.y, 28, 22, 4);
      p.rectMode(p.CORNER);
      const beta = frame.parameters.beta * Math.PI / 180;
      const alpha = frame.parameters.alpha * Math.PI / 180;
      const tangent = { x: Math.cos(-beta), y: Math.sin(-beta) };
      const outward = { x: Math.sin(beta), y: -Math.cos(beta) };
      forceArrow(center, { x: 0, y: frame.parameters.m * frame.parameters.g }, colors.weight, "W", 0.5);
      forceArrow(center, { x: outward.x * frame.readings.normal, y: outward.y * frame.readings.normal }, colors.normal, "N", 0.5);
      forceArrow(center, {
        x: frame.parameters.F * (tangent.x * Math.cos(alpha) + outward.x * Math.sin(alpha)),
        y: frame.parameters.F * (tangent.y * Math.cos(alpha) + outward.y * Math.sin(alpha)),
      }, colors.applied, "F", 0.5);
      forceArrow(center, { x: tangent.x * frame.readings.friction, y: tangent.y * frame.readings.friction }, colors.friction, "f", 0.5);
    };

    p.setup = () => {
      const width = Math.max(320, container.clientWidth);
      p.createCanvas(width, Math.max(390, Math.min(590, width * 0.67))).parent(container);
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      p.noLoop();
      resizeObserver = new ResizeObserver(() => {
        const nextWidth = Math.max(320, container.clientWidth);
        p.resizeCanvas(nextWidth, Math.max(390, Math.min(590, nextWidth * 0.67)));
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
        block: cssColor(container, "--accent", "#1769aa"),
        track: cssColor(container, "--border-strong", "#718096"),
        applied: cssColor(container, "--data-series-1", "#1769aa"),
        weight: cssColor(container, "--data-series-2", "#9a3412"),
        normal: cssColor(container, "--data-series-3", "#047857"),
        friction: cssColor(container, "--data-series-4", "#7c3aed"),
        velocity: cssColor(container, "--data-series-5", "#b45309"),
        acceleration: cssColor(container, "--status-warning-text", "#b91c1c"),
        net: cssColor(container, "--accent-strong", "#0f4c81"),
      };
      p.background(colors.background);
      const compact = p.width < 620;
      const sceneBottom = compact ? p.height * 0.61 : p.height * 0.7;
      const center = { x: compact ? p.width * 0.48 : p.width * 0.42, y: sceneBottom * 0.55 };
      const beta = frame.parameters.beta * Math.PI / 180;
      const tangent = { x: Math.cos(-beta), y: Math.sin(-beta) };
      const outward = { x: Math.sin(beta), y: -Math.cos(beta) };
      p.push();
      p.translate(center.x, center.y + 22);
      p.rotate(-beta);
      p.stroke(colors.track);
      p.strokeWeight(5);
      p.line(-p.width, 0, p.width, 0);
      p.strokeWeight(1);
      const offset = ((frame.state.s * 28) % 40 + 40) % 40;
      for (let x = -p.width - 40; x < p.width + 40; x += 40) {
        p.line(x - offset, 0, x - offset - 12, 13);
      }
      p.pop();
      p.noStroke();
      p.fill(colors.block);
      p.push();
      p.translate(center.x, center.y);
      p.rotate(-beta);
      p.rectMode(p.CENTER);
      p.rect(0, 0, 70, 45, 8);
      p.fill("white");
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.text(`${frame.parameters.m} kg`, 0, 0);
      p.pop();
      p.textAlign(p.LEFT, p.BASELINE);
      const origin = center;
      const alpha = frame.parameters.alpha * Math.PI / 180;
      forceArrow(origin, {
        x: frame.parameters.F * (tangent.x * Math.cos(alpha) + outward.x * Math.sin(alpha)),
        y: frame.parameters.F * (tangent.y * Math.cos(alpha) + outward.y * Math.sin(alpha)),
      }, colors.applied, "F");
      forceArrow(origin, { x: 0, y: frame.parameters.m * frame.parameters.g }, colors.weight, "W");
      forceArrow(origin, { x: outward.x * frame.readings.normal, y: outward.y * frame.readings.normal }, colors.normal, "N");
      forceArrow(origin, { x: tangent.x * frame.readings.friction, y: tangent.y * frame.readings.friction }, colors.friction, "f");
      if (frame.experience.views.vectors) {
        const velocityLength = Math.sign(frame.state.v) * Math.min(62, 18 + Math.abs(frame.state.v) * 7);
        arrow(center.x, center.y + 55, tangent.x * velocityLength, tangent.y * velocityLength, colors.velocity, "v", true);
        const accelerationLength = Math.sign(frame.state.a) * Math.min(62, 18 + Math.abs(frame.state.a) * 7);
        arrow(center.x, center.y + 78, tangent.x * accelerationLength, tangent.y * accelerationLength, colors.acceleration, "a", true);
      }
      p.fill(colors.muted);
      p.noStroke();
      p.textSize(10);
      p.text(t(locale, "forcesFriction.movingView"), 12, sceneBottom - 8);
      p.text(`β = ${frame.parameters.beta}°`, 12, 18);
      if (frame.experience.views.freeBodyDiagram) {
        const fbdSize = compact ? 112 : 156;
        drawFbd(frame, p.width - fbdSize - 18, 18, fbdSize, colors);
      }
      if (frame.experience.views.historyGraph) {
        drawHistory(frame, { x: 10, y: sceneBottom + 5, w: p.width - 20, h: p.height - sceneBottom - 15 }, colors);
      }
      if (frame.readings.regime === "contact-invalid") {
        p.fill(colors.panel);
        p.stroke(colors.acceleration);
        p.strokeWeight(2);
        p.rect(18, sceneBottom * 0.34, compact ? p.width - 36 : p.width * 0.56, 76, 10);
        p.noStroke();
        p.fill(colors.text);
        p.textSize(12);
        p.textStyle(p.BOLD);
        p.text(t(locale, "forcesFriction.contactInvalidShort"), 32, sceneBottom * 0.34 + 31);
        p.textStyle(p.NORMAL);
        p.text(t(locale, "forcesFriction.adjustParameters"), 32, sceneBottom * 0.34 + 53);
      }
    };
  };
  instance = new p5(sketch);
  return Promise.resolve({
    update() { instance.redraw(); },
    destroy() { resizeObserver?.disconnect(); instance.remove(); },
  });
};
