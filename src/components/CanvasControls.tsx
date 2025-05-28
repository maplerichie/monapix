
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
    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-4 border border-neon-green/30">
      <div className="flex items-center gap-2 min-w-[200px]">
          <Button
            size="sm"
            variant="outline"
            className="cyber-button p-2"
            onClick={() => onZoomChange(Math.max(100, zoom - 25))}
            disabled={zoom <= 100}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <div className="flex-1">
            <Slider
              value={[zoom]}
              onValueChange={(value) => onZoomChange(value[0])}
              min={100}
              max={300}
              step={25}
              className="w-full"
            />
          </div>
          
          <Button
            size="sm"
            variant="outline"
            className="cyber-button p-2"
            onClick={() => onZoomChange(Math.min(300, zoom + 25))}
            disabled={zoom >= 300}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
    </div>
  );
};
