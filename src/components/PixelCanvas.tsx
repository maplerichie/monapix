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
  getCenteredPan,
  easeOutCubic
} from '@/utils/canvasUtils';

export const PixelCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(300);
  const [pan, setPan] = useState({ x: -64, y: -64 });
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const [selectedPixel, setSelectedPixel] = useState<Pixel | null>(null);
  const [viewingPixel, setViewingPixel] = useState<Pixel | null>(null);
  const [resetImage, setResetImage] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragMomentum, setDragMomentum] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);
  const draggedRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const { animate, stop } = useSmoothAnimation();
  const { pixels, loading, fetchPixels, savePixel, createTransaction } = usePixelData();

  // Initialize by fetching pixels
  useEffect(() => {
    fetchPixels();
  }, []);

  // Center the view on first load with constrained bounds
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (canvas && container && !isInitialized) {
      const centeredPan = getCenteredPan(container.clientWidth, container.clientHeight, zoom);
      const constrainedPan = constrainPan(centeredPan, zoom, container.clientWidth, container.clientHeight);
      setPan(constrainedPan);
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
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pixelSize = (zoom / 100) * 2;
    const bounds = calculateViewportBounds(canvas.width, canvas.height, pan, zoom);
    const gridSettings = getGridSettings(zoom);

    // Only draw grid if pixels are large enough and within pixel area bounds
    if (pixelSize > 1) {
      // Draw minor grid
      if (gridSettings.minorGrid > 0 && gridSettings.minorOpacity > 0) {
        ctx.strokeStyle = `rgba(100, 100, 120, ${gridSettings.minorOpacity})`;
        ctx.lineWidth = gridSettings.minorLineWidth;

        for (let x = Math.max(0, Math.floor(bounds.minX / gridSettings.minorGrid) * gridSettings.minorGrid);
          x <= Math.min(255, bounds.maxX);
          x += gridSettings.minorGrid) {
          const canvasX = x * pixelSize + pan.x;
          if (canvasX >= -1 && canvasX <= canvas.width + 1) {
            ctx.beginPath();
            ctx.moveTo(canvasX, Math.max(0, pan.y));
            ctx.lineTo(canvasX, Math.min(canvas.height, 256 * pixelSize + pan.y));
            ctx.stroke();
          }
        }

        for (let y = Math.max(0, Math.floor(bounds.minY / gridSettings.minorGrid) * gridSettings.minorGrid);
          y <= Math.min(255, bounds.maxY);
          y += gridSettings.minorGrid) {
          const canvasY = y * pixelSize + pan.y;
          if (canvasY >= -1 && canvasY <= canvas.height + 1) {
            ctx.beginPath();
            ctx.moveTo(Math.max(0, pan.x), canvasY);
            ctx.lineTo(Math.min(canvas.width, 256 * pixelSize + pan.x), canvasY);
            ctx.stroke();
          }
        }
      }

      // Draw major grid
      if (gridSettings.majorGrid > 0) {
        ctx.strokeStyle = `rgba(150, 150, 170, ${gridSettings.majorOpacity})`;
        ctx.lineWidth = gridSettings.majorLineWidth;

        for (let x = Math.max(0, Math.floor(bounds.minX / gridSettings.majorGrid) * gridSettings.majorGrid);
          x <= Math.min(255, bounds.maxX);
          x += gridSettings.majorGrid) {
          const canvasX = x * pixelSize + pan.x;
          if (canvasX >= -1 && canvasX <= canvas.width + 1) {
            ctx.beginPath();
            ctx.moveTo(canvasX, Math.max(0, pan.y));
            ctx.lineTo(canvasX, Math.min(canvas.height, 256 * pixelSize + pan.y));
            ctx.stroke();
          }
        }

        for (let y = Math.max(0, Math.floor(bounds.minY / gridSettings.majorGrid) * gridSettings.majorGrid);
          y <= Math.min(255, bounds.maxY);
          y += gridSettings.majorGrid) {
          const canvasY = y * pixelSize + pan.y;
          if (canvasY >= -1 && canvasY <= canvas.height + 1) {
            ctx.beginPath();
            ctx.moveTo(Math.max(0, pan.x), canvasY);
            ctx.lineTo(Math.min(canvas.width, 256 * pixelSize + pan.x), canvasY);
            ctx.stroke();
          }
        }
      }
    }

    // Draw pixel area boundary
    ctx.strokeStyle = 'rgba(200, 200, 220, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pan.x, pan.y, 256 * pixelSize, 256 * pixelSize);

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

      // If moved more than 4px, consider as drag
      if (!draggedRef.current && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
        draggedRef.current = true;
      }

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
    draggedRef.current = false;
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);

      // Apply momentum for smooth deceleration
      if (Math.abs(dragMomentum.x) > 0.5 || Math.abs(dragMomentum.y) > 0.5) {
        const canvas = canvasRef.current;
        if (canvas) {
          const targetPan = {
            x: pan.x + dragMomentum.x * 8,
            y: pan.y + dragMomentum.y * 8
          };
          const constrainedTarget = constrainPan(targetPan, zoom, canvas.width, canvas.height);

          animate(
            0, 1, 250,
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
    if (isDragging || draggedRef.current) return;

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
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(200, Math.min(4000, zoom * zoomFactor));

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

    const targetPan = getCenteredPan(canvas.width, canvas.height, zoom);
    const constrainedTarget = constrainPan(targetPan, zoom, canvas.width, canvas.height);

    animate(
      0, 1, 400,
      (progress) => {
        setPan({
          x: pan.x + (constrainedTarget.x - pan.x) * progress,
          y: pan.y + (constrainedTarget.y - pan.y) * progress
        });
      },
      undefined,
      easeOutCubic
    );
  };

  // Locate random area handler
  const handleLocateRandomArea = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Pick a random pixel coordinate
    const randX = Math.floor(Math.random() * 256);
    const randY = Math.floor(Math.random() * 256);
    // Pick a random zoom level (e.g., between 800 and 2000)
    const randomZoom = Math.floor(500 + Math.random() * 2500);

    // Calculate the pan needed to center this pixel
    const pixelSize = (randomZoom / 100) * 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const targetPan = {
      x: centerX - randX * pixelSize - pixelSize / 2,
      y: centerY - randY * pixelSize - pixelSize / 2
    };
    const constrainedTarget = constrainPan(targetPan, randomZoom, canvas.width, canvas.height);

    // Animate zoom and pan
    const startZoom = zoom;
    const startPan = { ...pan };
    const duration = 500;
    animate(
      0, 1, duration,
      (progress) => {
        const eased = easeOutCubic(progress);
        setZoom(startZoom + (randomZoom - startZoom) * eased);
        setPan({
          x: startPan.x + (constrainedTarget.x - startPan.x) * eased,
          y: startPan.y + (constrainedTarget.y - startPan.y) * eased
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
    <div ref={containerRef} className="w-full h-[100dvh] min-h-[320px] relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="pixel-grid w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setHoveredPixel(null);
          setIsDragging(false);
          draggedRef.current = true;
        }}
        onClick={handleClick}
        onWheel={handleWheel}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            stop();
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            setDragMomentum({ x: 0, y: 0 });
            draggedRef.current = false;
            // For tap-to-select
            touchStartRef.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
              time: Date.now(),
            };
            // e.preventDefault();
          }
        }}
        onTouchMove={(e) => {
          if (isDragging && e.touches.length === 1) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - dragStart.x;
            const deltaY = touch.clientY - dragStart.y;
            if (!draggedRef.current && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
              draggedRef.current = true;
            }
            setDragMomentum({ x: deltaX * 0.1, y: deltaY * 0.1 });
            const newPan = { x: pan.x + deltaX, y: pan.y + deltaY };
            const canvas = canvasRef.current;
            if (canvas) {
              const constrainedPan = constrainPan(newPan, zoom, canvas.width, canvas.height);
              setPan(constrainedPan);
            }
            setDragStart({ x: touch.clientX, y: touch.clientY });
            // e.preventDefault();
          }
        }}
        onTouchEnd={(e) => {
          if (isDragging) {
            setIsDragging(false);
            // Tap-to-select logic
            if (touchStartRef.current && e.changedTouches.length === 1) {
              const touch = e.changedTouches[0];
              const dx = touch.clientX - touchStartRef.current.x;
              const dy = touch.clientY - touchStartRef.current.y;
              const dt = Date.now() - touchStartRef.current.time;
              if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 300 && !draggedRef.current) {
                // Simulate a click event for handleClick
                handleClick({
                  clientX: touch.clientX,
                  clientY: touch.clientY,
                  preventDefault: () => { },
                  stopPropagation: () => { },
                } as any);
              }
              touchStartRef.current = null;
            }
            if (Math.abs(dragMomentum.x) > 0.5 || Math.abs(dragMomentum.y) > 0.5) {
              const canvas = canvasRef.current;
              if (canvas) {
                const targetPan = {
                  x: pan.x + dragMomentum.x * 8,
                  y: pan.y + dragMomentum.y * 8
                };
                const constrainedTarget = constrainPan(targetPan, zoom, canvas.width, canvas.height);
                animate(
                  0, 1, 250,
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
            // e.preventDefault();
          }
        }}
      />

      <CanvasControls
        zoom={zoom}
        onZoomChange={handleZoomChange}
        onPanReset={handlePanReset}
        onLocateRandomArea={handleLocateRandomArea}
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
          resetImage={setResetImage}
        />
      )}

      {selectedPixel && (
        <PixelEditor
          pixel={selectedPixel}
          onSave={handlePixelSave}
          onClose={() => setSelectedPixel(null)}
          createTransaction={handleTransaction}
          resetImage={resetImage}
        />
      )}
    </div>
  );
};
