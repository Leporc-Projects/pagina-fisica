const setLine = (line, x1, y1, x2, y2) => {
  if (!(line instanceof SVGLineElement)) return;
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
};

export const updateSimulationLinkedChart = (root, geometry, formatNumber) => {
  if (!(root instanceof HTMLElement)) return;
  const { plot } = geometry;
  root.dataset.xMin = String(geometry.xDomain[0]);
  root.dataset.xMax = String(geometry.xDomain[1]);
  root.dataset.yMin = String(geometry.yDomain[0]);
  root.dataset.yMax = String(geometry.yDomain[1]);

  root.querySelectorAll("[data-grid-x]").forEach((line, index) => {
    const tick = geometry.xTicks[index];
    const x = plot.left + index / (geometry.xTicks.length - 1) * plot.width;
    setLine(line, x, plot.top, x, plot.top + plot.height);
    const label = root.querySelector(`[data-tick-x="${index}"]`);
    if (label) {
      label.setAttribute("x", String(x));
      label.textContent = formatNumber(tick);
    }
  });
  root.querySelectorAll("[data-grid-y]").forEach((line, index) => {
    const tick = geometry.yTicks[index];
    const y = plot.top + plot.height - index / (geometry.yTicks.length - 1) * plot.height;
    setLine(line, plot.left, y, plot.left + plot.width, y);
    const label = root.querySelector(`[data-tick-y="${index}"]`);
    if (label) {
      label.setAttribute("y", String(y));
      label.textContent = formatNumber(tick);
    }
  });

  root.querySelectorAll("[data-series-path]").forEach((path, index) => {
    path.setAttribute("d", geometry.paths[index] ?? "");
    path.toggleAttribute("hidden", !geometry.paths[index]);
  });
  root.querySelectorAll("[data-series-current]").forEach((point, index) => {
    const current = geometry.currentPoints[index];
    point.toggleAttribute("hidden", !current);
    if (current) {
      point.setAttribute("cx", String(current.x));
      point.setAttribute("cy", String(current.y));
    }
  });
  const cursor = root.querySelector("[data-chart-cursor]");
  cursor?.toggleAttribute("hidden", geometry.cursorX === null);
  if (geometry.cursorX !== null) setLine(cursor, geometry.cursorX, plot.top, geometry.cursorX, plot.top + plot.height);
  const event = root.querySelector("[data-chart-event]");
  event?.toggleAttribute("hidden", geometry.eventX === null || geometry.eventX === undefined);
  if (geometry.eventX !== null && geometry.eventX !== undefined) {
    setLine(event, geometry.eventX, plot.top, geometry.eventX, plot.top + plot.height);
    const eventLabel = root.querySelector("[data-chart-event-label]");
    eventLabel?.toggleAttribute("hidden", false);
    eventLabel?.setAttribute("x", String(Math.min(geometry.eventX + 6, plot.left + plot.width - 58)));
  } else {
    root.querySelector("[data-chart-event-label]")?.toggleAttribute("hidden", true);
  }
  const reference = root.querySelector("[data-chart-reference]");
  reference?.toggleAttribute("hidden", geometry.referenceY === null);
  if (geometry.referenceY !== null) setLine(reference, plot.left, geometry.referenceY, plot.left + plot.width, geometry.referenceY);
  const zero = root.querySelector("[data-chart-zero]");
  const zeroVisible = geometry.yDomain[0] <= 0 && geometry.yDomain[1] >= 0;
  zero?.toggleAttribute("hidden", !zeroVisible);
  if (zeroVisible) {
    const ratio = (0 - geometry.yDomain[0]) / (geometry.yDomain[1] - geometry.yDomain[0]);
    const y = plot.top + plot.height * (1 - ratio);
    setLine(zero, plot.left, y, plot.left + plot.width, y);
  }
};

export const setSvgArrow = (root, selector, { x1, y1, x2, y2 }, labelOffset = { x: 0, y: 0 }) => {
  const group = root.querySelector(selector);
  if (!(group instanceof SVGGElement)) return;
  const line = group.querySelector("line");
  setLine(line, x1, y1, x2, y2);
  const label = group.querySelector("text");
  if (label instanceof SVGTextElement) {
    label.setAttribute("x", String(x2 + labelOffset.x));
    label.setAttribute("y", String(y2 + labelOffset.y));
  }
};
