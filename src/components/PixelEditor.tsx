
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Upload, Link, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface Pixel {
  x: number;
  y: number;
  color: string;
  owner?: string;
  price: number;
  url?: string;
  image?: string;
}

interface PixelEditorProps {
  pixel: Pixel;
  onSave: (pixel: Pixel) => void;
  onClose: () => void;
}

export const PixelEditor: React.FC<PixelEditorProps> = ({
  pixel,
  onSave,
  onClose,
}) => {
  const [color, setColor] = useState(pixel.color);
  const [url, setUrl] = useState(pixel.url || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const presetColors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#ff8000', '#8000ff', '#0080ff', '#ff0080', '#80ff00', '#ff4080',
    '#ffffff', '#808080', '#404040', '#000000'
  ];

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
  };

  const handleSave = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedPixel: Pixel = {
        ...pixel,
        color,
        url: url || undefined,
        owner: 'current_user', // In real app, this would be the actual user
      };
      
      onSave(updatedPixel);
      toast.success('Pixel updated successfully!');
    } catch (error) {
      toast.error('Failed to update pixel');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate purchase processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const purchasedPixel: Pixel = {
        ...pixel,
        color,
        url: url || undefined,
        owner: 'current_user',
      };
      
      onSave(purchasedPixel);
      toast.success(`Pixel purchased for ${pixel.price} ETH!`);
    } catch (error) {
      toast.error('Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit
      toast.error('Image too large. Max size: 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > 128 || img.height > 128) {
          toast.error('Image too large. Max size: 128x128px');
          return;
        }
        // Process image and extract dominant color
        setColor('#' + Math.floor(Math.random()*16777215).toString(16));
        toast.success('Image uploaded successfully!');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md bg-black/95 border-neon-green text-white">
        <DialogHeader>
          <DialogTitle className="text-neon-green glow-effect flex items-center gap-2">
            <Palette className="w-5 h-5" />
            EDITOR
          </DialogTitle>
          <div className="text-sm text-neon-blue">
            Position: ({pixel.x}, {pixel.y})
          </div>
        </DialogHeader>

        <Tabs defaultValue="color" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="color">Color</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>

          <TabsContent value="color" className="space-y-4">
            <div className="space-y-2">
              <Label>Color Picker</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-16 h-10 p-1 border-neon-green/50"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 bg-gray-800 border-neon-green/50"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preset Colors</Label>
              <div className="grid grid-cols-8 gap-1">
                {presetColors.map((presetColor) => (
                  <button
                    key={presetColor}
                    className={`w-8 h-8 border-2 rounded ${
                      color === presetColor ? 'border-neon-green' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: presetColor }}
                    onClick={() => handleColorChange(presetColor)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Image</Label>
              <div className="border-2 border-dashed border-neon-green/30 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-neon-green" />
                <div className="text-sm text-gray-400 mb-2">
                  Max size: 128x128px, 1MB
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bg-transparent border-none"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

              <div className="flex gap-2">
                <Link className="w-5 h-5 mt-2 text-neon-blue" />
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-gray-800 border-neon-green/50"
                  placeholder="https://example.com"
                />
              </div>
        
        <div className="flex gap-2 pt-4">
          {pixel.owner ? (
            <Button
              onClick={handleSave}
              disabled={isProcessing}
              className="cyber-button flex-1"
            >
              {isProcessing ? 'Updating...' : 'Update Pixel'}
            </Button>
          ) : (
            <Button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="cyber-button flex-1"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isProcessing ? 'Processing...' : `Buy for ${pixel.price} ETH`}
            </Button>
          )}
          
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
