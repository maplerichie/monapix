import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, User, Palette, Image } from 'lucide-react';
import { type Pixel } from '@/hooks/usePixelData';
import { useAccount } from 'wagmi';

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
  const { address: account, isConnected } = useAccount();

  if (!pixel) return null;

  const isOwner = isConnected && account && pixel.owner_wallet &&
    account.toLowerCase() === pixel.owner_wallet.toLowerCase();

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
      <DialogContent className="max-w-md min-w-96 w-auto bg-black/95 border-neon-green neon-border shadow-[0_0_20px_hsl(var(--neon-green)_/_0.7)] text-white">
        <DialogHeader>
          <DialogTitle className="text-neon-green glow-effect flex items-center gap-2">
            <Palette className="w-5 h-5 text-neon-green" />
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
              className="text-neon-blue hover:text-neon-green flex items-center justify-center underline"
            >
              {pixel.link}&nbsp;<ExternalLink className="w-3 h-3 text-neon-green" />
            </a>
          )}

          {/* Owner */}
          <div>
            <div className="text-sm text-neon-green">Owned by <span className="font-mono text-neon-blue">
              {pixel.owner_wallet?.slice(0, 6)}...{pixel.owner_wallet?.slice(-4)}{isOwner && (
                <span className="text-xs text-neon-green pl-2">(It's you!)</span>
              )}</span>
            </div>
          </div>

          {/* Status & Last Price Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs text-neon-blue">
            {/* Status */}
            <div className="flex flex-col gap-1">
              <div className="text-sm text-gray-400">Status</div>
              {isLocked ? (
                <Badge variant="destructive" className="bg-orange-500 text-white max-w-fit neon-border">
                  Unlocks in: {formatCountdown(countdown)}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-neon-green text-black max-w-fit neon-border">
                  <User className="w-3 h-3 mr-1 text-black" />
                  Unlocked
                </Badge>
              )}
            </div>
            {/* Last Price */}
            <div>
              <div className="text-sm text-gray-400">Last Price</div>
              <div className="text-lg font-bold text-neon-green">
                {pixel.price ? `${pixel.price} MON` : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          {isOwner ? (
            <div className="flex-1"></div>
          ) : (
            <Button
              onClick={onEdit}
              className="flex-1"
              disabled={isLocked}
            >
              Purchase
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="outline"
            className="border-neon-green text-neon-green"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog >
  );
};
