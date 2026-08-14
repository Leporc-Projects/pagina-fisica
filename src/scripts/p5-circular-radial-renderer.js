import p5 from "p5";
import { t } from "../i18n/index.js";

const cssColor = (container, name, fallback) =>
  getComputedStyle(container).getPropertyValue(name).trim() || fallback;

export const createCircularRadialP5Renderer = ({ container, getFrame, locale }) => {
  let instance;
  let resizeObserver;
  const sketch = (p) => {
    const arrow = (x, y, dx, dy, color, label) => {
      const magnitude = Math.hypot(dx, dy);
      if (magnitude < 0.5) return;
      p.stroke(color); p.fill(color); p.strokeWeight(2.5);
      p.line(x, y, x + dx, y + dy);
      const angle = Math.atan2(dy, dx);
      p.push(); p.translate(x + dx, y + dy); p.rotate(angle);
      p.triangle(0, 0, -10, -4, -10, 4);
      p.rotate(-angle); p.noStroke(); p.textSize(12); p.textStyle(p.BOLD);
      p.text(label, 7, -5); p.pop();
    };
    const normalizedArrow = (origin, vector, color, label) => {
      const magnitude = Math.hypot(vector.x, vector.y);
      if (magnitude < 1e-8) return;
      const length = Math.min(76, 28 + Math.sqrt(magnitude) * 7);
      arrow(origin.x, origin.y, vector.x / magnitude * length, -vector.y / magnitude * length, color, label);
    };
    p.setup = () => {
      const width = Math.max(320, container.clientWidth);
      p.createCanvas(width, Math.max(390, Math.min(610, width * 0.66))).parent(container);
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      p.noLoop();
      resizeObserver = new ResizeObserver(() => {
        const width = Math.max(320, container.clientWidth);
        p.resizeCanvas(width, Math.max(390, Math.min(610, width * 0.66)));
        p.redraw();
      });
      resizeObserver.observe(container);
    };
    p.draw = () => {
      const frame = getFrame();
      const colors = {
        bg: cssColor(container, "--content-canvas", "#f4f7fb"),
        panel: cssColor(container, "--surface", "#fff"),
        text: cssColor(container, "--text", "#172033"),
        muted: cssColor(container, "--text-muted", "#64748b"),
        grid: cssColor(container, "--border", "#d7deea"),
        accent: cssColor(container, "--accent", "#1769aa"),
        velocity: cssColor(container, "--data-series-1", "#1769aa"),
        acceleration: cssColor(container, "--data-series-2", "#b45309"),
        tension: cssColor(container, "--data-series-3", "#047857"),
        trail: cssColor(container, "--data-series-4", "#7c3aed"),
        warning: cssColor(container, "--status-warning-text", "#b91c1c"),
      };
      p.background(colors.bg);
      const compact = p.width < 620;
      const center = { x: compact ? p.width / 2 : p.width * 0.42, y: p.height * 0.5 };
      const available = compact ? Math.min(p.width * 0.31, p.height * 0.29) : Math.min(p.width * 0.3, p.height * 0.37);
      const scale = available / frame.parameters.R;
      const toScreen = (point) => ({ x: center.x + point.x * scale, y: center.y - point.y * scale });
      p.noFill(); p.stroke(colors.grid); p.strokeWeight(2);
      p.drawingContext.setLineDash([7, 7]);
      p.circle(center.x, center.y, 2 * frame.parameters.R * scale);
      p.drawingContext.setLineDash([]);
      if (frame.experience.views.trail && frame.trail.length > 1) {
        p.noFill(); p.stroke(colors.trail); p.strokeWeight(2.5); p.beginShape();
        frame.trail.forEach((point) => { const screen = toScreen(point); p.vertex(screen.x, screen.y); });
        p.endShape();
      }
      const puck = toScreen(frame.state.position);
      if (frame.state.status === "connected") {
        p.stroke(colors.muted); p.strokeWeight(3); p.line(center.x, center.y, puck.x, puck.y);
      } else {
        const broken = toScreen(frame.state.breakPosition);
        p.stroke(colors.warning); p.strokeWeight(3);
        const midpoint = { x: center.x + (broken.x - center.x) * 0.65, y: center.y + (broken.y - center.y) * 0.65 };
        p.line(center.x, center.y, midpoint.x - 5, midpoint.y - 4);
        p.line(midpoint.x + 5, midpoint.y + 4, broken.x, broken.y);
        p.noFill(); p.stroke(colors.muted); p.strokeWeight(1.5);
        p.drawingContext.setLineDash([5, 5]);
        const velocity = frame.state.breakVelocity;
        const length = Math.max(frame.parameters.R * 2.8, frame.parameters.v * 2.5);
        p.line(broken.x, broken.y, broken.x + velocity.x / frame.parameters.v * length * scale, broken.y - velocity.y / frame.parameters.v * length * scale);
        p.drawingContext.setLineDash([]);
        p.noStroke(); p.fill(colors.muted); p.circle(broken.x, broken.y, 8);
      }
      p.noStroke(); p.fill(colors.accent); p.circle(center.x, center.y, 17);
      p.fill(colors.text); p.textSize(10); p.textStyle(p.BOLD); p.text(t(locale, "circularDynamics.pivot"), center.x + 12, center.y + 4);
      p.fill(colors.accent); p.circle(puck.x, puck.y, 31);
      if (frame.toggles.velocity) normalizedArrow(puck, frame.state.velocity, colors.velocity, "v");
      if (frame.toggles.acceleration && frame.state.status === "connected") normalizedArrow(puck, frame.state.acceleration, colors.acceleration, "aᵣ");
      if (frame.toggles.tension && frame.state.status === "connected") {
        const inward = { x: -frame.state.position.x * frame.readings.tension / frame.parameters.R, y: -frame.state.position.y * frame.readings.tension / frame.parameters.R };
        normalizedArrow(puck, inward, colors.tension, "T");
      }
      if (frame.experience.views.freeBodyDiagram) {
        const size = compact ? 112 : 152;
        const x = p.width - size - 20, y = 18;
        p.noStroke(); p.fill(colors.panel); p.rect(x, y, size, 104, 12);
        p.fill(colors.text); p.textSize(11); p.textStyle(p.BOLD); p.text(t(locale, "circularDynamics.fbdShort"), x + 11, y + 19);
        p.fill(colors.accent); p.circle(x + size * 0.7, y + 58, 20);
        if (frame.state.status === "connected") arrow(x + size * 0.7, y + 58, -58, 0, colors.tension, "T");
        else { p.fill(colors.muted); p.textStyle(p.NORMAL); p.text(t(locale, "circularDynamics.noHorizontalForce"), x + 11, y + 84); }
      }
      p.noStroke(); p.fill(colors.muted); p.textSize(10); p.textStyle(p.NORMAL);
      p.text(t(locale, "circularDynamics.vectorScaleNote"), 12, p.height - 14);
    };
  };
  instance = new p5(sketch);
  return Promise.resolve({ update() { instance.redraw(); }, destroy() { resizeObserver?.disconnect(); instance.remove(); } });
};
