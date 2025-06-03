import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Upload, Link, Asterisk, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAccount, useConnect } from 'wagmi';
import { Transaction, type Pixel } from '@/hooks/usePixelData';
import { Slider } from '@/components/ui/slider';
import { mintPixel, purchasePixel } from '@/lib/monapixContract';

interface PixelEditorProps {
  pixel: Pixel;
  onSave: (pixel: Pixel) => void;
  onClose: () => void;
  createTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
}

export const PixelEditor: React.FC<PixelEditorProps> = ({
  pixel,
  onSave,
  onClose,
  createTransaction,
}) => {
  const DAY_IN_SECONDS = 60; // 24 * 60 * 60;
  const LOCK_BONUS = 0.2;
  const [color, setColor] = useState(pixel.color);
  const [link, setLink] = useState(pixel.link || '');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(pixel.image_url || null);
  const [imageToUpload, setImageToUpload] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockPeriod, setLockPeriod] = useState(1); // 1-7 steps
  const basePrice = pixel.price || 1;
  const resellPrice = +(basePrice + lockPeriod * LOCK_BONUS).toFixed(2);
  const unlockDate = new Date(Date.now() + lockPeriod * DAY_IN_SECONDS * 1000);

  const { connect, connectors } = useConnect();
  const { address: account, isConnected } = useAccount();

  const presetColors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#ff8000', '#8000ff', '#0080ff', '#ff0080', '#80ff00', '#ff4080',
    '#ffffff', '#808080', '#404040', '#000000'
  ];

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
  };

  const handlePixel = async (action: 'mint' | 'purchase') => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);

    try {
      let imageUrl: string | undefined;
      if (imageToUpload) {
        imageUrl = await uploadImageToStorage(imageToUpload);
      }

      // Prepare contract call arguments
      const x = pixel.x;
      const y = pixel.y;
      const lockedDays = BigInt(lockPeriod); // lockPeriod is in days
      const value = BigInt(Math.floor((pixel.price || 1) * 1e18)); // Assuming price is in MON, convert to wei

      let hash: string;
      if (action === 'mint') {
        hash = await mintPixel(x, y, lockedDays, value);
      } else {
        hash = await purchasePixel(x, y, lockedDays, value);
      }


      const mintedPixel: Pixel = {
        ...pixel,
        color: imageToUpload ? undefined : color,
        image_url: imageUrl || undefined,
        link: link || undefined,
        owner_wallet: account!,
        unlocked_at: Math.floor(Date.now() / 1000 + (lockPeriod * DAY_IN_SECONDS)),
        price: resellPrice,
      };
      if (hash) {
        await createTransaction({
          pixel_id: pixel.pixel_id,
          transaction_type: action === 'purchase' ? 'purchase' : 'mint',
          from_wallet: action === 'mint' ? undefined : pixel.owner_wallet,
          to_wallet: account!,
          transaction_hash: hash,
        });
        onSave(mintedPixel);
        toast.success(`Pixel ${action === 'mint' ? 'minted' : 'purchased'} for ${pixel.price || 1} MON!`);
      }
    } catch (error: any) {
      toast.error(`${action === 'mint' ? 'Mint' : 'Purchase'} failed: ${error?.details || error?.message || error}`);
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
          }, file.type, 1.0);
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
      setImageToUpload(fileToUpload);
      setUploadedImageUrl(tempImg.src);
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
      <DialogContent className="max-w-md min-w-96 w-auto bg-black/95 border-neon-green neon-border shadow-[0_0_20px_hsl(var(--neon-green)_/_0.7)] text-white">
        <DialogHeader>
          <DialogTitle className="text-neon-green glow-effect flex items-center gap-2">
            <Palette className="w-5 h-5 text-neon-green" />
            <span className="text-md text-neon-blue pl-4">
              ({pixel.x}, {pixel.y})
            </span>
          </DialogTitle>
          <div className="text-sm text-neon-blue">
            {pixel.owner_wallet && (
              <div className="text-xs text-neon-green">
                Owned by: {pixel.owner_wallet.slice(0, 6)}...{pixel.owner_wallet.slice(-4)}
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
                    className={`w-8 h-8 border-2 rounded ${color === presetColor ? 'border-neon-green neon-border' : 'border-gray-600'} ${color === presetColor ? 'ring-2 ring-neon-green' : ''}`}
                    style={{ backgroundColor: presetColor }}
                    onClick={() => handleColorChange(presetColor)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Image&nbsp;<span className="text-xs text-neon-blue">Max size: 1MB</span></Label>
              {uploadedImageUrl ? (
                <div className="space-y-2">
                  <div className="flex relative border-2 border-neon-green/50 rounded-lg p-2 justify-center">
                    <img
                      src={uploadedImageUrl}
                      alt="Uploaded preview"
                      className="w-40 h-40 object-contain rounded-lg"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="max-w-80 h-32 bg-transparent border-2 border-dashed border-neon-green/30 rounded-lg justify-self-center"
                  disabled={isProcessing}
                />
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
            placeholder="https://monapix.com (optional)"
          />
        </div>

        {/* Lock period slider */}
        <div className="pt-4">
          <Label>Lock for</Label>
          <div className="flex items-center gap-4">
            <Slider
              min={1}
              max={7}
              step={1}
              value={[lockPeriod]}
              onValueChange={([v]) => setLockPeriod(v)}
              className="flex-1"
            />
            <span className="text-neon-green font-mono w-8 text-center">{lockPeriod} days</span>
          </div>
          <div className="flex flex-col gap-1 mt-2 text-xs">
            <span className="text-neon-blue">Unlock at {unlockDate.toLocaleString()}</span>
            <span className="text-yellow-400 text-lg">Resell at {resellPrice} MON</span>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          {!isConnected ? (
            <Button
              onClick={() => connect({ connector: connectors[0] })}
              className="flex-1"
            >
              Connect Wallet
            </Button>
          ) : <Button
            onClick={() => handlePixel(pixel.owner_wallet ? 'purchase' : 'mint')}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? 'Processing...' : (`${pixel.owner_wallet ? 'Purchase' : 'Mint'} for ${pixel.price || 1} MON`)}
          </Button>
          }
          <Button
            onClick={onClose}
            variant="outline"
            className="border-neon-green text-neon-green"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
