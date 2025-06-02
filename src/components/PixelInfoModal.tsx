
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, User, Palette, Image } from 'lucide-react';
import { type Pixel } from '@/hooks/usePixelData';
import { useWeb3 } from '@/contexts/Web3Context';

interface PixelInfoModalProps {
  pixel: Pixel | null;
  onClose: () => void;
  onEdit?: () => void;
}

export const PixelInfoModal: React.FC<PixelInfoModalProps> = ({
  pixel,
  onClose,
  onEdit,
}) => {
  const { account, isConnected } = useWeb3();
  
  if (!pixel) return null;

  const isOwner = isConnected && account && pixel.owner_wallet && 
    account.toLowerCase() === pixel.owner_wallet.toLowerCase();
  
  const isOwned = !!pixel.owner_wallet;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black/95 border-neon-green text-white">
        <DialogHeader>
          <DialogTitle className="text-neon-green glow-effect flex items-center gap-2">
            <Palette className="w-5 h-5" />
            ({pixel.x}, {pixel.y})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pixel Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
            <div className="w-16 h-16 border-2 border-neon-green/50 rounded">
              {pixel.image_url ? (
                <img 
                  src={pixel.image_url} 
                  alt="Pixel" 
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <div 
                  className="w-full h-full rounded"
                  style={{ backgroundColor: pixel.color }}
                />
              )}
            </div>
            <div className="flex-1">
              {pixel.image_url ? (
                <div className="flex items-center gap-1 text-xs text-blue-400 mt-1">
                  <Image className="w-3 h-3" />
                  {pixel.image_url}
                </div>
              ):(
              <div className="text-sm text-gray-400">Color</div>
              <div className="font-mono text-neon-green">{pixel.color}</div>
              )}
            </div>
          </div>

          {/* Ownership Status */}
          <div className="space-y-2">
            <div className="text-sm text-gray-400">Status</div>
            {isOwned ? (
              <div className="space-y-2">
                <Badge variant="secondary" className="bg-purple-600 text-white">
                  <User className="w-3 h-3 mr-1" />
                  Owned
                </Badge>
                <div className="text-xs">
                  <div className="text-gray-400">Owner:</div>
                  <div className="font-mono text-purple-400">
                    {pixel.owner_wallet?.slice(0, 6)}...{pixel.owner_wallet?.slice(-4)}{isOwner && (
                  <div className="text-xs text-green-400 pl-4">
                    You!
                  </div>
                )} 
                  </div>
                </div>
              </div>
            ) : (
              <Badge variant="outline" className="border-green-500 text-green-400">
                Available for Mint
              </Badge>
            )}
          </div>

          {/* Price */}
          {pixel.last_price && (
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Last Price</div>
              <div className="text-lg font-bold text-yellow-400">
                {pixel.last_price} ETH
              </div>
            </div>
          )}

          {/* Link */}
          {pixel.link && (
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Link</div>
              <a 
                href={pixel.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm break-all"
              >
                {pixel.link}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <div>Created</div>
              <div>{new Date(pixel.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div>Updated</div>
              <div>{new Date(pixel.updated_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          {isOwner && onEdit ? (
            <Button
              onClick={onEdit}
              className="cyber-button flex-1"
            >
              Edit Pixel
            </Button>
          ) : !isOwned ? (
            <Button
              onClick={onEdit}
              className="cyber-button flex-1"
            >
              Mint Pixel
            </Button>
          ) : (
            <div className="flex-1 text-center text-sm text-gray-400 py-2">
              {isConnected ? 'Owned by another user' : 'Connect wallet to interact'}
            </div>
          )}
          
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
