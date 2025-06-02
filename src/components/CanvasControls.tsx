
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Target } from 'lucide-react';

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
    <div className="absolute bottom-16 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-primary-purple/30 shadow-lg">
      <div className="flex items-center gap-3 min-w-[250px]">
        <Button
          size="icon"
          variant="outline"
          className="p-2 border-primary-purple/50"
          onClick={() => onZoomChange(Math.max(200, zoom * 0.8))}
          disabled={zoom <= 200}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          <Slider
            value={[zoom]}
            onValueChange={(value) => onZoomChange(value[0])}
            min={200}
            max={5000}
            step={50}
            className="w-full"
          />
        </div>

        <Button
          size="icon"
          variant="outline"
          className="p-2 border-primary-purple/50"
          onClick={() => onZoomChange(Math.min(5000, zoom * 1.25))}
          disabled={zoom >= 5000}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
