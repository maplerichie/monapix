
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

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
    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-neon-green/30">
      <div className="flex flex-col gap-4 min-w-[200px]">
        <div className="text-neon-green font-bold text-sm glow-effect">
          ZOOM CONTROL
        </div>
        
        <div className="flex items-center gap-2">
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
        
        <div className="text-center text-neon-blue text-xs">
          {zoom}%
        </div>
        
        <Button
          onClick={onPanReset}
          className="cyber-button w-full"
          size="sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Random View
        </Button>
      </div>
    </div>
  );
};
