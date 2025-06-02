import React, { useEffect, useState } from 'react';
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

  // Lock/Unlock logic (unlocked_at is in seconds)
  const now = Math.floor(Date.now() / 1000);
  const isLocked = pixel.unlocked_at && now < pixel.unlocked_at;
  const [countdown, setCountdown] = useState(
    isLocked ? Math.max(0, pixel.unlocked_at - now) : 0
  );

  useEffect(() => {
    if (!isLocked) return;
    const interval = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      setCountdown(Math.max(0, pixel.unlocked_at - nowSec));
    }, 1000);
    return () => clearInterval(interval);
  }, [pixel.unlocked_at, isLocked]);

  function formatCountdown(sec: number) {
    if (sec <= 0) return 'Unlocked';
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md min-w-96 w-auto bg-black/95 border-neon-green text-white">
        <DialogHeader>
          <DialogTitle className="text-neon-green glow-effect flex items-center gap-2">
            <Palette className="w-5 h-5" />
            ({pixel.x}, {pixel.y})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pixel Preview */}
          <div className="flex gap-4 justify-center">
            {pixel.image_url ? (
              <img
                src={pixel.image_url}
                alt="Pixel"
                className="w-48 h-48 object-cover rounded-lg"
              />
            ) : (
              <div
                className="w-48 h-48 border-2 border-neon-green/50 rounded-lg content-center text-center text-white"
                style={{ backgroundColor: pixel.color }}
              >
                {pixel.color}
              </div>
            )}
          </div>

          {/* Link */}
          {pixel.link && (
            <a
              href={pixel.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center justify-center"
            >
              {pixel.link}&nbsp;<ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* Owner */}
          <div>
            <div className="text-sm text-gray-400">Owned by <span className="font-mono text-purple-400">
              {pixel.owner_wallet?.slice(0, 6)}...{pixel.owner_wallet?.slice(-4)}{isOwner && (
                <span className="text-xs text-green-400 pl-2">(It's you!)</span>
              )}</span>
            </div>
          </div>

          {/* Status & Last Price Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-300">
            {/* Status */}
            <div className="flex flex-col gap-1">
              <div className="text-sm text-gray-400">Status</div>
              {isLocked ? (
                <Badge variant="destructive" className="bg-orange-600 text-white max-w-fit">
                  Unlocks in: {formatCountdown(countdown)}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-600 text-white max-w-fit">
                  <User className="w-3 h-3 mr-1" />
                  Unlocked
                </Badge>
              )}
            </div>
            {/* Last Price */}
            <div>
              <div className="text-sm text-gray-400">Last Price</div>
              <div className="text-lg font-bold text-yellow-400">
                {pixel.price ? `${pixel.price} ETH` : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          {isOwner && onEdit ? (
            <Button
              onClick={onEdit}
              className="cyber-button flex-1"
              disabled={isLocked}
            >
              Edit{isLocked && ' (Locked)'}
            </Button>
          ) : <div className="flex-1"></div>
          }

          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog >
  );
};
