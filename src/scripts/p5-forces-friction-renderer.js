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

    const forceArrow = (origin, vector, color, label, scale = 0.72) => {
      const magnitude = Math.hypot(vector.x, vector.y);
      if (magnitude < 0.01) return;
      const length = Math.min(78, 21 + Math.sqrt(magnitude) * 5.2) * scale;
      arrow(origin.x, origin.y, vector.x / magnitude * length, vector.y / magnitude * length, color, label);
    };

    p.setup = () => {
      const width = Math.max(320, container.clientWidth);
      p.createCanvas(width, Math.max(360, Math.min(520, width * 0.58))).parent(container);
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      p.noLoop();
      resizeObserver = new ResizeObserver(() => {
        const nextWidth = Math.max(320, container.clientWidth);
        p.resizeCanvas(nextWidth, Math.max(360, Math.min(520, nextWidth * 0.58)));
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
      };
      p.background(colors.background);
      const compact = p.width < 620;
      const sceneBottom = p.height;
      const center = { x: p.width * 0.5, y: p.height * (compact ? 0.48 : 0.5) };
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
      p.pop();
      p.fill(colors.panel);
      p.stroke(colors.grid);
      p.strokeWeight(1);
      p.rectMode(p.CENTER);
      p.rect(center.x, center.y - 3, 49, 23, 11);
      p.noStroke();
      p.fill(colors.text);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(11);
      p.textStyle(p.BOLD);
      p.text(`${frame.parameters.m} kg`, center.x, center.y - 3);
      p.rectMode(p.CORNER);
      p.textAlign(p.LEFT, p.BASELINE);
      const alpha = frame.parameters.alpha * Math.PI / 180;
      if (frame.experience.views.vectors && frame.toggles.forces) {
        forceArrow({ x: center.x + tangent.x * 34, y: center.y + tangent.y * 34 }, {
          x: frame.parameters.F * (tangent.x * Math.cos(alpha) + outward.x * Math.sin(alpha)),
          y: frame.parameters.F * (tangent.y * Math.cos(alpha) + outward.y * Math.sin(alpha)),
        }, colors.applied, "F");
        forceArrow({ x: center.x, y: center.y + 13 }, { x: 0, y: frame.parameters.m * frame.parameters.g }, colors.weight, "W");
        forceArrow({ x: center.x + outward.x * 25, y: center.y + outward.y * 25 }, { x: outward.x * frame.readings.normal, y: outward.y * frame.readings.normal }, colors.normal, "N");
        forceArrow({ x: center.x + outward.x * 19 - tangent.x * 18, y: center.y + outward.y * 19 - tangent.y * 18 }, { x: tangent.x * frame.readings.friction, y: tangent.y * frame.readings.friction }, colors.friction, "f");
      }
      if (frame.experience.views.vectors && frame.toggles.velocity) {
        const velocityLength = Math.sign(frame.state.v) * Math.min(62, 18 + Math.abs(frame.state.v) * 7);
        arrow(center.x, center.y + 55, tangent.x * velocityLength, tangent.y * velocityLength, colors.velocity, "v", true);
      }
      if (frame.experience.views.vectors && frame.toggles.acceleration) {
        const accelerationLength = Math.sign(frame.state.a) * Math.min(62, 18 + Math.abs(frame.state.a) * 7);
        arrow(center.x, center.y + 78, tangent.x * accelerationLength, tangent.y * accelerationLength, colors.acceleration, "a", true);
      }
      p.fill(colors.muted);
      p.noStroke();
      p.textSize(compact ? 9 : 10);
      p.text(
        t(locale, "forcesFriction.movingView"),
        12,
        sceneBottom - (compact ? 34 : 18),
        p.width - 24,
        compact ? 28 : 16
      );
      p.text(`β = ${frame.parameters.beta}°`, 12, 18);
      if (frame.readings.regime === "contact-invalid") {
        p.fill(colors.panel);
        p.stroke(colors.acceleration);
        p.strokeWeight(2);
        p.rect(18, sceneBottom * 0.29, compact ? p.width - 36 : p.width * 0.56, 76, 10);
        p.noStroke();
        p.fill(colors.text);
        p.textSize(12);
        p.textStyle(p.BOLD);
        p.text(t(locale, "forcesFriction.contactInvalidShort"), 32, sceneBottom * 0.29 + 31);
        p.textStyle(p.NORMAL);
        p.text(t(locale, "forcesFriction.adjustParameters"), 32, sceneBottom * 0.29 + 53);
      }
    };
  };
  instance = new p5(sketch);
  return Promise.resolve({
    update() { instance.redraw(); },
    destroy() { resizeObserver?.disconnect(); instance.remove(); },
  });
};
