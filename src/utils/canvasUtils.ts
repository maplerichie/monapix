export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface GridSettings {
  majorGrid: number;
  minorGrid: number;
  majorOpacity: number;
  minorOpacity: number;
  majorLineWidth: number;
  minorLineWidth: number;
}

// Pixel canvas dimensions
const PIXEL_GRID_SIZE = 256;
const PADDING_RATIO = 0.1; // 10% padding around the pixel area

export const calculateViewportBounds = (
  canvasWidth: number,
  canvasHeight: number,
  pan: { x: number; y: number },
  zoom: number
): ViewportBounds => {
  const pixelSize = (zoom / 100) * 2;

  return {
    minX: Math.floor(-pan.x / pixelSize) - 1,
    maxX: Math.ceil((canvasWidth - pan.x) / pixelSize) + 1,
    minY: Math.floor(-pan.y / pixelSize) - 1,
    maxY: Math.ceil((canvasHeight - pan.y) / pixelSize) + 1
  };
};

export const getGridSettings = (zoom: number): GridSettings => {
  const pixelSize = (zoom / 100) * 2;

  if (pixelSize < 2) {
    return {
      majorGrid: 16,
      minorGrid: 0,
      majorOpacity: 0.1,
      minorOpacity: 0,
      majorLineWidth: 0.25,
      minorLineWidth: 0
    };
  } else if (pixelSize < 8) {
    return {
      majorGrid: 8,
      minorGrid: 0,
      majorOpacity: 0.2,
      minorOpacity: 0,
      majorLineWidth: 0.25,
      minorLineWidth: 0
    };
  } else if (pixelSize < 16) {
    return {
      majorGrid: 4,
      minorGrid: 1,
      majorOpacity: 0.3,
      minorOpacity: 0.1,
      majorLineWidth: 0.5,
      minorLineWidth: 0.3
    };
  } else {
    return {
      majorGrid: 1,
      minorGrid: 1,
      majorOpacity: 0.4,
      minorOpacity: 0.2,
      majorLineWidth: 0.5,
      minorLineWidth: 0.5
    };
  }
};

export const smoothStep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const constrainPan = (
  pan: { x: number; y: number },
  zoom: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } => {
  const pixelSize = (zoom / 100) * 2;
  const gridWidth = PIXEL_GRID_SIZE * pixelSize;
  const gridHeight = PIXEL_GRID_SIZE * pixelSize;

  // Calculate minimal padding based on canvas size and zoom
  const padding = Math.min(canvasWidth, canvasHeight) * PADDING_RATIO;

  // Calculate bounds to keep the pixel grid area centered with minimal padding
  const minX = canvasWidth - gridWidth - padding;
  const maxX = padding;
  const minY = canvasHeight - gridHeight - padding;
  const maxY = padding;

  // If the grid is smaller than the canvas, center it
  const centeredX = gridWidth < canvasWidth ? (canvasWidth - gridWidth) / 2 : pan.x;
  const centeredY = gridHeight < canvasHeight ? (canvasHeight - gridHeight) / 2 : pan.y;

  return {
    x: gridWidth < canvasWidth ? centeredX : Math.max(minX, Math.min(maxX, pan.x)),
    y: gridHeight < canvasHeight ? centeredY : Math.max(minY, Math.min(maxY, pan.y))
  };
};

export const getCenteredPan = (
  canvasWidth: number,
  canvasHeight: number,
  zoom: number
): { x: number; y: number } => {
  const pixelSize = (zoom / 100) * 2;
  const gridWidth = PIXEL_GRID_SIZE * pixelSize;
  const gridHeight = PIXEL_GRID_SIZE * pixelSize;

  return {
    x: (canvasWidth - gridWidth) / 2,
    y: (canvasHeight - gridHeight) / 2
  };
};
