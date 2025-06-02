
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
    <div className="absolute bottom-16 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-2 border border-primary-purple/30">
      <div className="flex items-center gap-2 min-w-[200px]">
        <Button
          size="icon"
          variant="outline"
          className="p-2"
          onClick={() => onZoomChange(Math.max(300, zoom - 100))}
          disabled={zoom <= 300}
        >
          <ZoomOut />
        </Button>

        <div className="flex-1">
          <Slider
            value={[zoom]}
            onValueChange={(value) => onZoomChange(value[0])}
            min={300}
            max={3500}
            step={100}
            className="w-full"
          />
        </div>

        <Button
          size="icon"
          variant="outline"
          className="p-2"
          onClick={() => onZoomChange(Math.min(3500, zoom + 100))}
          disabled={zoom >= 3500}
        >
          <ZoomIn />
        </Button>
      </div>
    </div>
  );
};
