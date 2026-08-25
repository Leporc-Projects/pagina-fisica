const requireFinitePositive = (value, label) => {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} debe ser finito y positivo.`);
};

export const wrapCanvasText = ({ text, maxWidth, measureText }) => {
  if (typeof text !== "string" || !text.trim()) throw new TypeError("El texto del canvas no puede estar vacío.");
  requireFinitePositive(maxWidth, "maxWidth");
  if (typeof measureText !== "function") throw new TypeError("measureText debe ser una función.");

  const lines = [];
  let current = "";
  for (const word of text.trim().split(/\s+/u)) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measureText(candidate) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return Object.freeze(lines);
};

export const createCanvasAlertLayout = ({
  text,
  canvasWidth,
  measureText,
  compact = canvasWidth < 620,
}) => {
  requireFinitePositive(canvasWidth, "canvasWidth");
  const margin = compact ? 12 : 18;
  const paddingX = compact ? 12 : 16;
  const paddingY = compact ? 10 : 12;
  const fontSize = compact ? 11 : 12;
  const lineHeight = compact ? 15 : 17;
  const width = canvasWidth - 2 * margin;
  const textWidth = width - 2 * paddingX;
  const lines = wrapCanvasText({ text, maxWidth: textWidth, measureText });

  return Object.freeze({
    box: Object.freeze({ x: margin, y: compact ? 46 : 52, width, height: 2 * paddingY + lines.length * lineHeight }),
    text: Object.freeze({ x: margin + paddingX, y: (compact ? 46 : 52) + paddingY, width: textWidth }),
    fontSize,
    lineHeight,
    lines,
  });
};
