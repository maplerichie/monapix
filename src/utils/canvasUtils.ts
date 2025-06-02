
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
    // Very zoomed out - show major grid only
    return {
      majorGrid: 16,
      minorGrid: 0,
      majorOpacity: 0.2,
      minorOpacity: 0,
      majorLineWidth: 0.5,
      minorLineWidth: 0
    };
  } else if (pixelSize < 8) {
    // Medium zoom - show reduced grid
    return {
      majorGrid: 8,
      minorGrid: 0,
      majorOpacity: 0.3,
      minorOpacity: 0,
      majorLineWidth: 0.5,
      minorLineWidth: 0
    };
  } else if (pixelSize < 16) {
    // Getting closer - show 4x4 grid
    return {
      majorGrid: 4,
      minorGrid: 1,
      majorOpacity: 0.4,
      minorOpacity: 0.1,
      majorLineWidth: 0.8,
      minorLineWidth: 0.3
    };
  } else {
    // Close zoom - show full grid
    return {
      majorGrid: 4,
      minorGrid: 1,
      majorOpacity: 0.5,
      minorOpacity: 0.2,
      majorLineWidth: 1,
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
  const gridWidth = 256 * pixelSize;
  const gridHeight = 256 * pixelSize;
  
  // Allow some padding beyond grid boundaries
  const padding = Math.min(canvasWidth, canvasHeight) * 0.5;
  
  const minX = Math.min(-padding, canvasWidth - gridWidth - padding);
  const maxX = Math.max(padding, canvasWidth - padding);
  const minY = Math.min(-padding, canvasHeight - gridHeight - padding);
  const maxY = Math.max(padding, canvasHeight - padding);
  
  return {
    x: Math.max(minX, Math.min(maxX, pan.x)),
    y: Math.max(minY, Math.min(maxY, pan.y))
  };
};
