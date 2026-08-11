// Geometría pura para proyectar coordenadas físicas del proyectil a Canvas.
// No conoce p5, DOM ni el ciclo de animación.

export const formatProjectileNumber = (value, maximumFractionDigits = 2) => {
  if (!Number.isFinite(value)) return "—";
  const normalized = Math.abs(value) < 1e-9 ? 0 : value;
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(normalized);
};

export const createProjectileCanvasTransform = ({
  xDomain,
  yDomain,
  width,
  height,
  padding = { left: 58, right: 24, top: 28, bottom: 46 },
}) => {
  const values = [...xDomain, ...yDomain, width, height, ...Object.values(padding)];
  if (!values.every(Number.isFinite) || width <= 0 || height <= 0 ||
      xDomain[0] >= xDomain[1] || yDomain[0] >= yDomain[1]) {
    throw new RangeError("La transformación Canvas requiere dominios y dimensiones finitos.");
  }
  const availableWidth = Math.max(1, width - padding.left - padding.right);
  const availableHeight = Math.max(1, height - padding.top - padding.bottom);
  const scale = Math.min(
    availableWidth / (xDomain[1] - xDomain[0]),
    availableHeight / (yDomain[1] - yDomain[0])
  );
  const physicalWidth = (xDomain[1] - xDomain[0]) * scale;
  const physicalHeight = (yDomain[1] - yDomain[0]) * scale;
  const offsetX = padding.left + (availableWidth - physicalWidth) / 2;
  const offsetY = padding.top + (availableHeight - physicalHeight) / 2;

  return Object.freeze({
    scale,
    x(value) {
      return offsetX + (value - xDomain[0]) * scale;
    },
    y(value) {
      // Canvas crece hacia abajo; la coordenada física +y crece hacia arriba.
      return offsetY + (yDomain[1] - value) * scale;
    },
    point(point) {
      return { x: this.x(point.x), y: this.y(point.y) };
    },
    plot: Object.freeze({
      left: offsetX,
      right: offsetX + physicalWidth,
      top: offsetY,
      bottom: offsetY + physicalHeight,
    }),
  });
};

export const createProjectileVectorScales = ({
  velocityMagnitudes,
  accelerationMagnitude,
  maximumPixels = 92,
}) => {
  if (!Array.isArray(velocityMagnitudes) || velocityMagnitudes.length === 0 ||
      !velocityMagnitudes.every(Number.isFinite) ||
      !Number.isFinite(accelerationMagnitude) || accelerationMagnitude < 0 ||
      !Number.isFinite(maximumPixels) || maximumPixels <= 0) {
    throw new RangeError("La escala de vectores requiere magnitudes finitas.");
  }
  return {
    velocity: maximumPixels / Math.max(1, ...velocityMagnitudes.map(Math.abs)),
    acceleration: maximumPixels * 0.72 / Math.max(1, Math.abs(accelerationMagnitude)),
  };
};
