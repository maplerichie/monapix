
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Upload, Link, ShoppingCart, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useWeb3 } from '@/contexts/Web3Context';
import { type Pixel } from '@/hooks/usePixelData';

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
  const [link, setLink] = useState(pixel.link || '');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(pixel.image_url || null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { account, isConnected, connectWallet } = useWeb3();

  const presetColors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#ff8000', '#8000ff', '#0080ff', '#ff0080', '#80ff00', '#ff4080',
    '#ffffff', '#808080', '#404040', '#000000'
  ];

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
  };

  const handleSave = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate smart contract interaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedPixel: Pixel = {
        ...pixel,
        color,
        image_url: uploadedImageUrl || undefined,
        link: link || undefined,
        owner_wallet: account!,
        last_price: pixel.last_price || 1,
      };
      
      onSave(updatedPixel);
      toast.success('Pixel updated successfully!');
    } catch (error) {
      toast.error('Failed to update pixel');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMint = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate smart contract minting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mintedPixel: Pixel = {
        ...pixel,
        color,
        image_url: uploadedImageUrl || undefined,
        link: link || undefined,
        owner_wallet: account!,
        last_price: pixel.last_price || 1,
      };
      
      onSave(mintedPixel);
      toast.success(`Pixel minted for ${pixel.last_price || 1} ETH!`);
    } catch (error) {
      toast.error('Mint failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${pixel.pixel_id}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('pixel-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('pixel-images')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = 128;
        canvas.height = 128;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, 128, 128);
          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to create resized image'));
            }
          }, file.type, 0.8);
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error('Image too large. Max size: 1MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    try {
      setIsProcessing(true);
      
      let fileToUpload = file;
      
      // Check if image needs resizing
      const tempImg = new Image();
      const needsResize = await new Promise<boolean>((resolve) => {
        tempImg.onload = () => {
          resolve(tempImg.width > 128 || tempImg.height > 128);
        };
        const reader = new FileReader();
        reader.onload = (e) => {
          tempImg.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });

      if (needsResize) {
        fileToUpload = await resizeImage(file);
        // toast.success('Image resized to 128x128px');
      }

      const imageUrl = await uploadImageToStorage(fileToUpload);
      setUploadedImageUrl(imageUrl);
      // toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Image upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImageUrl(null);
    // toast.success('Image removed');
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
            {pixel.owner_wallet && (
              <div className="text-xs text-purple-400">
                Owner: {pixel.owner_wallet.slice(0, 6)}...{pixel.owner_wallet.slice(-4)}
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="color" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="color">Color</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>

          <TabsContent value="color" className="space-y-4">
            <div className="space-y-2">
              <Label>Pick a Color</Label>
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
              <Label>Preset</Label>
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
              {uploadedImageUrl ? (
                <div className="space-y-2">
                  <div className="relative border-2 border-neon-green/50 rounded-lg p-2">
                    <img 
                      src={uploadedImageUrl} 
                      alt="Uploaded preview" 
                      className="w-full h-32 object-contain rounded"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div className="text-xs text-neon-green text-center">
                    Image ready for pixel
                  </div>
                </div>
              ) : (
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
                    disabled={isProcessing}
                  />
                  {isProcessing && (
                    <div className="text-xs text-neon-blue mt-2">
                      Processing image...
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Link className="w-5 h-5 mt-2 text-neon-blue" />
          <Input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="bg-gray-800 border-neon-green/50"
            placeholder="https://example.com"
          />
        </div>
        
        <div className="flex gap-2 pt-4">
          {pixel.owner_wallet ? (
            <Button
              onClick={handleSave}
              disabled={isProcessing || !isConnected}
              className="cyber-button flex-1"
            >
              {isProcessing ? 'Updating...' : 'Update Pixel'}
            </Button>
          ) : (
            <Button
              onClick={handleMint}
              disabled={isProcessing}
              className="cyber-button flex-1"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isProcessing ? 'Minting...' : `Mint for ${pixel.last_price || 1} ETH`}
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

        {!isConnected && (
          <div className="text-center text-sm text-yellow-400">
            Connect your wallet to mint pixels
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
