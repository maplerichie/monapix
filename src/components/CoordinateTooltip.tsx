
import React from 'react';

interface Pixel {
  x: number;
  y: number;
  color: string;
  image_url?: string;
  link?: string;
  owner_wallet?: string;
  last_price?: number;
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
      className="fixed z-50 bg-black/90 backdrop-blur-sm text-white p-3 rounded-lg border border-primary-purple/50 pointer-events-none animate-fade-in"
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
            {pixel.owner_wallet && (
              <div className="text-primary-purple">
                Owner: {pixel.owner_wallet}
              </div>
            )}
            <div className="text-yellow-400">
              Price: {pixel.last_price.toFixed(2)} ETH
            </div>
          </>
        ) : (
          <div className="text-gray-400">Available for mint</div>
        )}
      </div>
    </div>
  );
};
