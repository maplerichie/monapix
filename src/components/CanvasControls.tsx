
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface CanvasControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onPanReset: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoom,
  onZoomChange,
  onPanReset,
}) => {
  return (
    <div className="absolute bottom-16 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-2 border border-neon-green/30">
      <div className="flex items-center gap-2 min-w-[200px]">
          <Button
            size="icon"
            variant="outline"
            className="cyber-button p-2"
            onClick={() => onZoomChange(Math.max(100, zoom - 25))}
            disabled={zoom <= 100}
          >
            <ZoomOut/>
          </Button>
          
          <div className="flex-1">
            <Slider
              value={[zoom]}
              onValueChange={(value) => onZoomChange(value[0])}
              min={100}
              max={500}
              step={25}
              className="w-full"
            />
          </div>
          
          <Button
            size="icon"
            variant="outline"
            className="cyber-button p-2"
            onClick={() => onZoomChange(Math.min(500, zoom + 25))}
            disabled={zoom >= 500}
          >
            <ZoomIn/>
          </Button>
        </div>
    </div>
  );
};
