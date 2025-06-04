import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Locate } from 'lucide-react';

interface CanvasControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onPanReset: () => void;
  onLocateRandomArea: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoom,
  onZoomChange,
  onPanReset,
  onLocateRandomArea,
}) => {
  return (
    <div className="absolute bottom-16 left-2 bg-black/80 backdrop-blur-sm rounded-lg p-1 border border-primary-purple/30 shadow-lg">
      <div className="flex flex-col items-center gap-2 sm:gap-3 min-h-[140px] sm:min-h-[250px]">
        <Button
          size="icon"
          variant="outline"
          className="p-1 border-primary-purple/50 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px]"
          onClick={() => onZoomChange(Math.min(5000, zoom * 1.25))}
          disabled={zoom >= 5000}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          <Slider
            orientation="vertical"
            value={[zoom]}
            onValueChange={(value) => onZoomChange(value[0])}
            min={200}
            max={5000}
            step={50}
            className="min-h-[60px] sm:min-h-[100px] w-4"
          />
        </div>

        <Button
          size="icon"
          variant="outline"
          className="p-1 border-primary-purple/50 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px]"
          onClick={() => onZoomChange(Math.max(200, zoom * 0.8))}
          disabled={zoom <= 200}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          variant="outline"
          className="p-1 border-primary-purple/50 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px]"
          onClick={onLocateRandomArea}
          title="Locate random area"
        >
          <Locate className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
