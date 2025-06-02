import React from 'react';
import { type Pixel } from '@/hooks/usePixelData';

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
      className="fixed z-50 bg-black/95 backdrop-blur-sm text-neon-green p-3 rounded-lg border border-neon-green neon-border pointer-events-none animate-fade-in shadow-[0_0_20px_hsl(var(--neon-green)_/_0.7)]"
      style={{
        left: Math.min(x + 10, window.innerWidth - 200),
        top: Math.max(y - 80, 10),
      }}
    >
      <div className="text-xs space-y-1">
        <div className="text-neon-blue">X: {pixelX}, Y: {pixelY}</div>
        {pixel ? (
          <>
            {pixel.owner_wallet && (
              <div className="text-neon-green font-bold">
                Owner: {pixel.owner_wallet.slice(0, 6)}...{pixel.owner_wallet.slice(-4)}
              </div>
            )}
          </>
        ) : (
          <div className="text-neon-green font-bold">Mint now!</div>
        )}
      </div>
    </div>
  );
};
