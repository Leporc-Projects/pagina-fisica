import {
  createProjectileCanvasTransform,
  createProjectileVectorScales,
} from "../utils/projectile-canvas.js";
import { formatNumber, t } from "../i18n/index.js";
import { listenForSimulationThemeChange } from "../utils/simulation-theme.js";

let p5ConstructorPromise;

export const loadP5Constructor = () => {
  p5ConstructorPromise ??= import("p5").then((module) => module.default);
  return p5ConstructorPromise;
};

const readThemeTokens = (container) => {
  const styles = getComputedStyle(container);
  const token = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  return {
    background: token("--chart-bg", "rgb(248, 248, 246)"),
    grid: token("--chart-grid", "rgb(198, 199, 194)"),
    axis: token("--chart-axis", "rgb(65, 69, 68)"),
    label: token("--chart-label", "rgb(55, 59, 58)"),
    trajectory: token("--data-series-1", "rgb(15, 111, 125)"),
    secondary: token("--data-series-2", "rgb(180, 92, 31)"),
    reference: token("--chart-reference", "rgb(112, 91, 134)"),
    halo: token("--chart-annotation-halo", "rgb(248, 248, 246)"),
  };
};

const containerSize = (container) => {
  const width = Math.max(1, Math.floor(container.clientWidth || 640));
  return { width, height: Math.round(Math.min(520, Math.max(260, width * 0.62))) };
};

const drawArrow = (p, start, vector, color, label) => {
  const end = { x: start.x + vector.x, y: start.y + vector.y };
  const length = Math.hypot(vector.x, vector.y);
  if (length < 1) return;
  const ux = vector.x / length;
  const uy = vector.y / length;
  const head = Math.min(11, Math.max(7, length * 0.18));
  p.stroke(color);
  p.strokeWeight(2.6);
  p.line(start.x, start.y, end.x, end.y);
  p.line(end.x, end.y, end.x - head * (ux - uy * 0.55), end.y - head * (uy + ux * 0.55));
  p.line(end.x, end.y, end.x - head * (ux + uy * 0.55), end.y - head * (uy - ux * 0.55));
  p.noStroke();
  p.fill(color);
  p.text(label, end.x + 5, end.y - 5);
};

const drawScene = (p, frame, container, locale) => {
  const { state, summary, samples, domains, views } = frame;
  const colors = readThemeTokens(container);
  const transform = createProjectileCanvasTransform({
    xDomain: domains.x,
    yDomain: domains.y,
    width: p.width,
    height: p.height,
  });
  const current = transform.point(state.position);
  const launch = transform.point({ x: 0, y: frame.parameters.y0 });
  const vertex = transform.point(summary.vertex);
  const impact = transform.point({ x: summary.range, y: 0 });
  const groundY = transform.y(0);
  // Los tres puntos clave rotulan siempre por encima y a la derecha de su
  // marca. La lectura de posición necesita conocerlos para no escribirse
  // encima cuando la partícula coincide con uno de ellos, que es exactamente
  // el estado inicial por defecto: t = 0 sobre el punto de lanzamiento.
  const keyPoints = [
    [launch, t(locale, "projectile.launch")],
    [vertex, t(locale, "projectile.apex")],
    [impact, t(locale, "projectile.impact")],
  ];

  p.background(colors.background);
  p.textFont("system-ui, sans-serif");
  p.textSize(12);
  p.strokeCap(p.ROUND);
  p.strokeJoin(p.ROUND);

  if (views.scene) {
    p.stroke(colors.grid);
    p.strokeWeight(1);
    for (let index = 0; index <= 5; index += 1) {
      const x = transform.plot.left + (transform.plot.right - transform.plot.left) * index / 5;
      const y = transform.plot.top + (transform.plot.bottom - transform.plot.top) * index / 5;
      p.line(x, transform.plot.top, x, transform.plot.bottom);
      p.line(transform.plot.left, y, transform.plot.right, y);
    }
    p.stroke(colors.axis);
    p.strokeWeight(2);
    p.line(transform.plot.left, groundY, transform.plot.right, groundY);
    const yAxisX = transform.x(0);
    p.line(yAxisX, transform.plot.bottom, yAxisX, transform.plot.top);
    drawArrow(p, { x: transform.plot.right - 22, y: groundY }, { x: 20, y: 0 }, colors.axis, "+x");
    drawArrow(p, { x: yAxisX, y: transform.plot.top + 22 }, { x: 0, y: -20 }, colors.axis, "+y");
    p.noStroke();
    p.fill(colors.label);
    // El rótulo del suelo vive en el extremo derecho del eje: en el origen
    // competía con la marca de lanzamiento y con la lectura de posición.
    p.textAlign(p.RIGHT);
    p.text(t(locale, "projectile.groundLabel"), transform.plot.right - 30, groundY - 8);
    p.textAlign(p.LEFT);
    p.text("x (m)", transform.plot.right - 24, groundY + 28);
    p.text("y (m)", transform.x(0) + 9, transform.plot.top + 13);
  }

  if (views.trajectory) {
    p.noFill();
    p.stroke(colors.trajectory);
    p.strokeWeight(3);
    p.beginShape();
    samples.forEach((sample) => {
      const point = transform.point(sample.position);
      p.vertex(point.x, point.y);
    });
    p.endShape();
  }

  if (views.keyPoints) {
    keyPoints.forEach(([point, label]) => {
      p.fill(colors.background);
      p.stroke(colors.reference);
      p.strokeWeight(2);
      p.circle(point.x, point.y, 10);
      p.noStroke();
      p.fill(colors.label);
      p.text(label, point.x + 7, point.y - 8);
    });
  }

  const vectorScales = createProjectileVectorScales({
    velocityMagnitudes: [frame.parameters.v0, summary.impactSpeed, state.speed],
    accelerationMagnitude: frame.parameters.g,
    maximumPixels: Math.min(92, p.width * 0.19),
  });
  if (views.velocityVector) {
    drawArrow(p, current, {
      x: state.velocity.x * vectorScales.velocity,
      y: -state.velocity.y * vectorScales.velocity,
    }, colors.secondary, "v");
  }
  if (views.accelerationVector) {
    drawArrow(p, current, {
      x: 0,
      y: frame.parameters.g * vectorScales.acceleration,
    }, colors.reference, "a");
  }
  if (views.velocityComponents) {
    p.drawingContext.setLineDash([5, 4]);
    drawArrow(p, current, {
      x: state.velocity.x * vectorScales.velocity,
      y: 0,
    }, colors.trajectory, "vx");
    drawArrow(p, current, {
      x: 0,
      y: -state.velocity.y * vectorScales.velocity,
    }, colors.secondary, "vy");
    p.drawingContext.setLineDash([]);
  }

  p.fill(colors.background);
  p.stroke(colors.trajectory);
  p.strokeWeight(3);
  p.circle(current.x, current.y, 15);
  p.noStroke();
  p.fill(colors.label);
  p.textStyle(p.BOLD);
  const positionLabel = `(${formatNumber(locale, state.position.x)}, ${formatNumber(locale, state.position.y)}) m`;
  // Subiendo, la trayectoria ocupa el espacio superior y la lectura baja;
  // bajando ocurre lo contrario. Junto a un punto clave siempre baja, porque
  // esa banda superior ya está rotulada.
  const nearKeyPoint = views.keyPoints && keyPoints.some(
    ([point]) => Math.hypot(point.x - current.x, point.y - current.y) < 18
  );
  const readoutBelow = state.velocity.y >= 0 || nearKeyPoint;
  const readoutY = readoutBelow
    ? Math.min(p.height - 8, current.y + 22)
    : Math.max(18, current.y - 14);
  p.text(positionLabel, Math.min(current.x + 10, p.width - 120), readoutY);
  p.textStyle(p.NORMAL);
};

export const createProjectileP5Renderer = async ({ container, getFrame, locale = "es" }) => {
  if (!(container instanceof HTMLElement) || typeof getFrame !== "function") {
    throw new TypeError("El renderer p5 requiere contenedor y fuente de estado.");
  }
  const P5 = await loadP5Constructor();
  let destroyed = false;
  let instance;
  let resolveReady;
  const ready = new Promise((resolve) => { resolveReady = resolve; });

  instance = new P5((p) => {
    p.setup = () => {
      const size = containerSize(container);
      p.pixelDensity(Math.min(2, Math.max(1, window.devicePixelRatio || 1)));
      p.createCanvas(size.width, size.height);
      p.noLoop();
      p.describe(t(locale, "projectile.canvasDescribe"));
      p.describeElement(t(locale, "projectile.trajectory"), t(locale, "projectile.trajectoryDescribe"));
      p.describeElement(t(locale, "projectile.particle"), t(locale, "projectile.particleDescribe"));
      resolveReady();
    };
    p.draw = () => {
      const frame = getFrame();
      if (frame) drawScene(p, frame, container, locale);
    };
  }, container);

  await ready;
  const redraw = () => {
    if (!destroyed) instance.redraw();
  };
  const resize = () => {
    if (destroyed) return;
    const size = containerSize(container);
    if (instance.width !== size.width || instance.height !== size.height) {
      instance.resizeCanvas(size.width, size.height, true);
    }
    redraw();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const removeThemeListener = listenForSimulationThemeChange({ target: window, redraw });
  redraw();

  return {
    update: redraw,
    resize,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      resizeObserver.disconnect();
      removeThemeListener();
      instance.remove();
    },
  };
};
