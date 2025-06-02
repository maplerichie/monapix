import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PixelEditor } from './PixelEditor';
import { PixelInfoModal } from './PixelInfoModal';
import { CanvasControls } from './CanvasControls';
import { CoordinateTooltip } from './CoordinateTooltip';
import { Transaction, usePixelData, type Pixel } from '@/hooks/usePixelData';
import { useSmoothAnimation } from '@/hooks/useSmoothAnimation';
import {
  calculateViewportBounds,
  getGridSettings,
  constrainPan,
  easeOutCubic
} from '@/utils/canvasUtils';

export const PixelCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(800); // Start at a more reasonable zoom level
  const [pan, setPan] = useState({ x: 0, y: 0 }); // Start centered
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const [selectedPixel, setSelectedPixel] = useState<Pixel | null>(null);
  const [viewingPixel, setViewingPixel] = useState<Pixel | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragMomentum, setDragMomentum] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  const { animate, stop } = useSmoothAnimation();
  const { pixels, loading, fetchPixels, savePixel, createTransaction } = usePixelData();

  // Initialize by fetching pixels and centering view
  useEffect(() => {
    fetchPixels();
  }, []);

  // Center the view on first load
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (canvas && container && !isInitialized) {
      const pixelSize = (zoom / 100) * 2;
      const gridWidth = 256 * pixelSize;
      const gridHeight = 256 * pixelSize;

      setPan({
        x: (container.clientWidth - gridWidth) / 2,
        y: (container.clientHeight - gridHeight) / 2
      });

      setIsInitialized(true);
    }
  }, [zoom, isInitialized]);

  // Load images when pixels with URLs are added
  useEffect(() => {
    pixels.forEach((pixel, key) => {
      if (pixel.image_url && !imageCache.has(pixel.image_url)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setImageCache(prev => new Map(prev.set(pixel.image_url!, img)));
        };
        img.onerror = () => {
          console.log(`Failed to load image for pixel at ${pixel.x}, ${pixel.y}`);
        };
        img.src = pixel.image_url;
      }
    });
  }, [pixels, imageCache]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#200052';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pixelSize = (zoom / 100) * 2;
    const bounds = calculateViewportBounds(canvas.width, canvas.height, pan, zoom);
    const gridSettings = getGridSettings(zoom);

    // Only draw grid if pixels are large enough to see
    if (pixelSize > 1) {
      // Draw minor grid
      if (gridSettings.minorGrid > 0 && gridSettings.minorOpacity > 0) {
        ctx.strokeStyle = `rgba(250, 250, 250, ${gridSettings.minorOpacity})`;
        ctx.lineWidth = gridSettings.minorLineWidth;

        for (let x = Math.floor(bounds.minX / gridSettings.minorGrid) * gridSettings.minorGrid;
          x <= bounds.maxX;
          x += gridSettings.minorGrid) {
          if (x >= 0 && x < 256) {
            const canvasX = x * pixelSize + pan.x;
            ctx.beginPath();
            ctx.moveTo(canvasX, 0);
            ctx.lineTo(canvasX, canvas.height);
            ctx.stroke();
          }
        }

        for (let y = Math.floor(bounds.minY / gridSettings.minorGrid) * gridSettings.minorGrid;
          y <= bounds.maxY;
          y += gridSettings.minorGrid) {
          if (y >= 0 && y < 256) {
            const canvasY = y * pixelSize + pan.y;
            ctx.beginPath();
            ctx.moveTo(0, canvasY);
            ctx.lineTo(canvas.width, canvasY);
            ctx.stroke();
          }
        }
      }

      // Draw major grid
      if (gridSettings.majorGrid > 0) {
        ctx.strokeStyle = `rgba(250, 250, 250, ${gridSettings.majorOpacity})`;
        ctx.lineWidth = gridSettings.majorLineWidth;

        for (let x = Math.floor(bounds.minX / gridSettings.majorGrid) * gridSettings.majorGrid;
          x <= bounds.maxX;
          x += gridSettings.majorGrid) {
          if (x >= 0 && x < 256) {
            const canvasX = x * pixelSize + pan.x;
            ctx.beginPath();
            ctx.moveTo(canvasX, 0);
            ctx.lineTo(canvasX, canvas.height);
            ctx.stroke();
          }
        }

        for (let y = Math.floor(bounds.minY / gridSettings.majorGrid) * gridSettings.majorGrid;
          y <= bounds.maxY;
          y += gridSettings.majorGrid) {
          if (y >= 0 && y < 256) {
            const canvasY = y * pixelSize + pan.y;
            ctx.beginPath();
            ctx.moveTo(0, canvasY);
            ctx.lineTo(canvas.width, canvasY);
            ctx.stroke();
          }
        }
      }
    }

    // Draw pixels (only those in viewport)
    pixels.forEach((pixel) => {
      if (pixel.x >= bounds.minX && pixel.x <= bounds.maxX &&
        pixel.y >= bounds.minY && pixel.y <= bounds.maxY) {

        const canvasX = pixel.x * pixelSize + pan.x;
        const canvasY = pixel.y * pixelSize + pan.y;

        // Check if pixel has image and image is loaded
        if (pixel.image_url && imageCache.has(pixel.image_url)) {
          const img = imageCache.get(pixel.image_url)!;
          ctx.drawImage(img, canvasX, canvasY, pixelSize, pixelSize);
        } else {
          // Fallback to color
          ctx.fillStyle = pixel.color;
          ctx.fillRect(canvasX, canvasY, pixelSize, pixelSize);
        }

        // Show ownership border only when zoomed in enough
        if (pixel.owner_wallet && pixelSize > 4) {
          ctx.strokeStyle = '#836EF9';
          ctx.lineWidth = Math.min(2, pixelSize * 0.1);
          ctx.strokeRect(canvasX, canvasY, pixelSize, pixelSize);
        }
      }
    });

    // Highlight hovered pixel
    if (hoveredPixel && pixelSize > 2) {
      const canvasX = hoveredPixel.x * pixelSize + pan.x;
      const canvasY = hoveredPixel.y * pixelSize + pan.y;

      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = Math.max(1, pixelSize * 0.05);
      ctx.strokeRect(canvasX, canvasY, pixelSize, pixelSize);
    }
  }, [zoom, pan, pixels, hoveredPixel, imageCache]);

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
    const handle = requestAnimationFrame(drawCanvas);
    return () => cancelAnimationFrame(handle);
  }, [drawCanvas]);

  const handlePixelSave = async (updatedPixel: Pixel) => {
    try {
      await savePixel(updatedPixel.x, updatedPixel.y, {
        color: updatedPixel.color,
        image_url: updatedPixel.image_url,
        link: updatedPixel.link,
        unlocked_at: updatedPixel.unlocked_at,
        owner_wallet: updatedPixel.owner_wallet,
        price: updatedPixel.price
      });
      setSelectedPixel(null);
      setViewingPixel(null);
    } catch (error) {
      console.error('Error saving pixel:', error);
    }
  };

  const handleTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    await createTransaction(transaction);
    return Promise.resolve();
  };

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

      // Track momentum for smooth release
      setDragMomentum({ x: deltaX * 0.1, y: deltaY * 0.1 });

      const newPan = {
        x: pan.x + deltaX,
        y: pan.y + deltaY
      };

      const canvas = canvasRef.current;
      if (canvas) {
        const constrainedPan = constrainPan(newPan, zoom, canvas.width, canvas.height);
        setPan(constrainedPan);
      }

      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      const coords = getPixelCoordinates(e.clientX, e.clientY);
      setHoveredPixel(coords);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    stop(); // Stop any ongoing animations
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragMomentum({ x: 0, y: 0 });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);

      // Apply momentum for smooth deceleration
      if (Math.abs(dragMomentum.x) > 0.5 || Math.abs(dragMomentum.y) > 0.5) {
        const canvas = canvasRef.current;
        if (canvas) {
          const targetPan = {
            x: pan.x + dragMomentum.x * 10,
            y: pan.y + dragMomentum.y * 10
          };
          const constrainedTarget = constrainPan(targetPan, zoom, canvas.width, canvas.height);

          animate(
            0, 1, 300,
            (progress) => {
              const currentPan = {
                x: pan.x + (constrainedTarget.x - pan.x) * progress,
                y: pan.y + (constrainedTarget.y - pan.y) * progress
              };
              setPan(currentPan);
            },
            undefined,
            easeOutCubic
          );
        }
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;

    const coords = getPixelCoordinates(e.clientX, e.clientY);
    if (coords) {
      const pixelKey = `${coords.x},${coords.y}`;
      const existingPixel = pixels.get(pixelKey);

      if (existingPixel) {
        // Show info modal for existing pixels
        setViewingPixel(existingPixel);
      } else {
        // Open editor for minting new pixel
        setSelectedPixel({
          pixel_id: coords.x * 1000 + coords.y,
          x: coords.x,
          y: coords.y,
          color: '#ffffff',
          price: 1,
          unlocked_at: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
  };

  const handleEditPixel = () => {
    if (viewingPixel) {
      setSelectedPixel(viewingPixel);
      setViewingPixel(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Smooth zoom with smaller increments
    const zoomFactor = e.deltaY > 0 ? 0.85 : 1.18;
    const newZoom = Math.max(200, Math.min(5000, zoom * zoomFactor));

    // Zoom towards mouse cursor
    const zoomRatio = newZoom / zoom;
    const newPan = {
      x: mouseX - (mouseX - pan.x) * zoomRatio,
      y: mouseY - (mouseY - pan.y) * zoomRatio
    };

    const constrainedPan = constrainPan(newPan, newZoom, canvas.width, canvas.height);

    setZoom(newZoom);
    setPan(constrainedPan);
  };

  const handleZoomChange = (newZoom: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Zoom towards center when using controls
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const zoomRatio = newZoom / zoom;

    const newPan = {
      x: centerX - (centerX - pan.x) * zoomRatio,
      y: centerY - (centerY - pan.y) * zoomRatio
    };

    const constrainedPan = constrainPan(newPan, newZoom, canvas.width, canvas.height);

    setZoom(newZoom);
    setPan(constrainedPan);
  };

  const handlePanReset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Center the grid
    const pixelSize = (zoom / 100) * 2;
    const gridWidth = 256 * pixelSize;
    const gridHeight = 256 * pixelSize;

    const targetPan = {
      x: (canvas.width - gridWidth) / 2,
      y: (canvas.height - gridHeight) / 2
    };

    // Smooth animation to center
    animate(
      0, 1, 500,
      (progress) => {
        setPan({
          x: pan.x + (targetPan.x - pan.x) * progress,
          y: pan.y + (targetPan.y - pan.y) * progress
        });
      },
      undefined,
      easeOutCubic
    );
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-white">Loading pixel data...</div>
      </div>
    );
  }

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

      {viewingPixel && (
        <PixelInfoModal
          pixel={viewingPixel}
          onClose={() => setViewingPixel(null)}
          onEdit={handleEditPixel}
        />
      )}

      {selectedPixel && (
        <PixelEditor
          pixel={selectedPixel}
          onSave={handlePixelSave}
          onClose={() => setSelectedPixel(null)}
          createTransaction={handleTransaction}
        />
      )}
    </div>
  );
};
