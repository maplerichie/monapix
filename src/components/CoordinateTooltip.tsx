
import React from 'react';

interface Pixel {
  x: number;
  y: number;
  color: string;
  owner?: string;
  price: number;
  url?: string;
  image?: string;
}

interface CoordinateTooltipProps {
  x: number;
  y: number;
  pixelX: number;
  pixelY: number;
  pixel?: Pixel;
}

export const CoordinateTooltip: React.FC<CoordinateTooltipProps> = ({
  x,
  y,
  pixelX,
  pixelY,
  pixel,
}) => {
  return (
    <div
      className="fixed z-50 bg-black/90 backdrop-blur-sm text-white p-3 rounded-lg border border-neon-green/50 pointer-events-none animate-fade-in"
      style={{
        left: Math.min(x + 10, window.innerWidth - 200),
        top: Math.max(y - 80, 10),
      }}
    >
      <div className="text-xs space-y-1">
        <div>X: {pixelX}, Y: {pixelY}</div>
        {pixel ? (
          <>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 border border-white/50"
                style={{ backgroundColor: pixel.color }}
              />
              <span>{pixel.color}</span>
            </div>
            {pixel.owner && (
              <div className="text-neon-blue">
                Owner: {pixel.owner}
              </div>
            )}
            <div className="text-yellow-400">
              Price: {pixel.price.toFixed(2)} ETH
            </div>
          </>
        ) : (
          <div className="text-gray-400">Available for purchase</div>
        )}
      </div>
    </div>
  );
};
