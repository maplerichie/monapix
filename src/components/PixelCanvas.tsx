
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PixelEditor } from './PixelEditor';
import { CanvasControls } from './CanvasControls';
import { CoordinateTooltip } from './CoordinateTooltip';

interface Pixel {
  x: number;
  y: number;
  color: string;
  owner?: string;
  price: number;
  url?: string;
  image?: string;
}

export const PixelCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(150);
  const [pan, setPan] = useState({ x: -100, y: -100 });
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const [selectedPixel, setSelectedPixel] = useState<Pixel | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pixels, setPixels] = useState<Map<string, Pixel>>(new Map());

  // Initialize some sample pixels
  useEffect(() => {
    const samplePixels = new Map<string, Pixel>();
    
    // Add some sample owned pixels
    for (let i = 0; i < 50; i++) {
      const x = Math.floor(Math.random() * 256);
      const y = Math.floor(Math.random() * 256);
      const colors = ['#00ff00', '#0080ff', '#ff4080', '#ffff00', '#ff8000'];
      samplePixels.set(`${x},${y}`, {
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)],
        owner: `user${Math.floor(Math.random() * 10)}`,
        price: 1 + Math.random() * 5,
      });
    }
    
    setPixels(samplePixels);
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate pixel size based on zoom
    const pixelSize = (zoom / 100) * 2;

    // Draw grid
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x < 256; x++) {
      const canvasX = x * pixelSize + pan.x;
      if (canvasX >= -pixelSize && canvasX <= canvas.width) {
        ctx.beginPath();
        ctx.moveTo(canvasX, 0);
        ctx.lineTo(canvasX, canvas.height);
        ctx.stroke();
      }
    }
    
    for (let y = 0; y < 256; y++) {
      const canvasY = y * pixelSize + pan.y;
      if (canvasY >= -pixelSize && canvasY <= canvas.height) {
        ctx.beginPath();
        ctx.moveTo(0, canvasY);
        ctx.lineTo(canvas.width, canvasY);
        ctx.stroke();
      }
    }

    // Draw pixels
    pixels.forEach((pixel) => {
      const canvasX = pixel.x * pixelSize + pan.x;
      const canvasY = pixel.y * pixelSize + pan.y;
      
      if (canvasX >= -pixelSize && canvasX <= canvas.width && 
          canvasY >= -pixelSize && canvasY <= canvas.height) {
        ctx.fillStyle = pixel.color;
        ctx.fillRect(canvasX, canvasY, pixelSize, pixelSize);
        
        if (pixel.owner) {
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 1;
          ctx.strokeRect(canvasX, canvasY, pixelSize, pixelSize);
        }
      }
    });

    // Highlight hovered pixel
    if (hoveredPixel) {
      const canvasX = hoveredPixel.x * pixelSize + pan.x;
      const canvasY = hoveredPixel.y * pixelSize + pan.y;
      
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(canvasX, canvasY, pixelSize, pixelSize);
    }
  }, [zoom, pan, pixels, hoveredPixel]);

  // Setup canvas and event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [drawCanvas]);

  // Draw canvas when state changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const getPixelCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const pixelSize = (zoom / 100) * 2;
    const pixelX = Math.floor((canvasX - pan.x) / pixelSize);
    const pixelY = Math.floor((canvasY - pan.y) / pixelSize);

    if (pixelX >= 0 && pixelX < 256 && pixelY >= 0 && pixelY < 256) {
      return { x: pixelX, y: pixelY };
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      const coords = getPixelCoordinates(e.clientX, e.clientY);
      setHoveredPixel(coords);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    
    const coords = getPixelCoordinates(e.clientX, e.clientY);
    if (coords) {
      const pixelKey = `${coords.x},${coords.y}`;
      const existingPixel = pixels.get(pixelKey);
      
      setSelectedPixel(existingPixel || {
        x: coords.x,
        y: coords.y,
        color: '#ffffff',
        price: 1,
      });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(100, Math.min(300, prev * zoomFactor)));
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const handlePanReset = () => {
    // Random section at startup
    const randomX = Math.floor(Math.random() * 256) * -2;
    const randomY = Math.floor(Math.random() * 256) * -2;
    setPan({ x: randomX, y: randomY });
  };

  const handlePixelSave = (updatedPixel: Pixel) => {
    const pixelKey = `${updatedPixel.x},${updatedPixel.y}`;
    setPixels(prev => new Map(prev.set(pixelKey, updatedPixel)));
    setSelectedPixel(null);
  };

  return (
    <div ref={containerRef} className="w-full h-screen relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="pixel-grid w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setHoveredPixel(null);
          setIsDragging(false);
        }}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      
      <CanvasControls
        zoom={zoom}
        onZoomChange={handleZoomChange}
        onPanReset={handlePanReset}
      />
      
      {hoveredPixel && (
        <CoordinateTooltip
          x={mousePos.x}
          y={mousePos.y}
          pixelX={hoveredPixel.x}
          pixelY={hoveredPixel.y}
          pixel={pixels.get(`${hoveredPixel.x},${hoveredPixel.y}`)}
        />
      )}
      
      {selectedPixel && (
        <PixelEditor
          pixel={selectedPixel}
          onSave={handlePixelSave}
          onClose={() => setSelectedPixel(null)}
        />
      )}
    </div>
  );
};
