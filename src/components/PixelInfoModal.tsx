import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, User, Palette, Image, Twitter, Send, Share2 } from 'lucide-react';
import { type Pixel } from '@/hooks/usePixelData';
import { useAccount } from 'wagmi';
import html2canvas from 'html2canvas';

interface PixelInfoModalProps {
  pixel: Pixel | null;
  onClose: () => void;
  onEdit?: () => void;
  resetImage: (reset: boolean) => void;
}

export const PixelInfoModal: React.FC<PixelInfoModalProps> = ({
  pixel,
  onClose,
  onEdit,
  resetImage
}) => {
  const { address: account, isConnected } = useAccount();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareImg, setShareImg] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  const handlePlatformShare = async (platform: string) => {
    const shareText = `Minted (${pixel.x}, ${pixel.y}) on Monapix!\nOwning a piece of Monad history now! #gmonad\n@monad_xyz @monad_eco @monad_Daily`;
    const shareUrl = window.location.href;
    const file = await fetch(shareImg).then(r => r.blob()).then(b => new File([b], `pixel-${pixel.x}-${pixel.y}.png`, { type: 'image/png' }));
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Monapix',
        text: shareText,
        url: shareUrl,
        files: [file],
      });
      return;
    }
    // Fallback: open platform share intent (no image)
    if (platform === 'x') {
      window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
    } else if (platform === 'reddit') {
      window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`);
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
    }
  };

  // Minimal share preview component
  const SharePreview = () => (
    <div ref={previewRef} className="w-auto p-4 neon-shadow rounded-md flex items-center gap-2">
      {pixel.image_url ? (
        <img src={pixel.image_url} alt="Pixel" className="w-28 h-28 object-cover rounded-lg border border-neon-green" />
      ) : (
        <div className="w-28 h-28 rounded-lg border border-neon-green flex items-center justify-center text-white text-lg font-mono" style={{ backgroundColor: pixel.color }}>{pixel.color}</div>
      )}
      <div className="flex flex-col gap-2 justify-between">
        <div className="flex gap-2">
          <div className="flex items-center gap-2 text-neon-green font-bold text-md"><img src="/icon.png" className="w-6 h-6" /> ({pixel.x}, {pixel.y})</div>
          <div className="text-neon-green text-xs">{pixel.price ? `${pixel.price} MON` : ''}</div>
        </div>
        {pixel.link ? (
          <a href={pixel.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-neon-blue text-xs">{pixel.link}</a>
        ) : <div className="flex-1"></div>}
        <div className="text-neon-green text-xs">Owned a piece of Monad history on Monapix.org</div>
      </div>

    </div>
  );

  // Copy preview image to clipboard
  const handleCopyImage = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, { backgroundColor: '#0E100F', scale: 2.5, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        setShareImg(URL.createObjectURL(blob));
        try {
          await navigator.clipboard.write([
            new window.ClipboardItem({ 'image/png': blob })
          ]);
        } catch (err) {
          // download image fallback
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `monadpix(${pixel.x}-${pixel.y}).png`;
          a.click();
          URL.revokeObjectURL(url);
          console.error('Failed to copy image to clipboard.');
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to generate image.', err);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent ref={modalRef} className="max-w-md min-w-96 w-auto bg-black/95 border-neon-green neon-border shadow-[0_0_20px_hsl(var(--neon-green)_/_0.7)] text-white">
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
          <div className="flex gap-2 pt-2">
            {isOwner ? (
              <Button className="flex-1 flex items-center gap-2" onClick={() => setShareOpen(true)}>
                <Share2 className="w-4 h-4" /> Share
              </Button>
            ) : (
              <Button
                onClick={() => {
                  resetImage(true);
                  onEdit();
                }}
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
      </Dialog>
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogTitle hidden></DialogTitle>
        <DialogContent className="max-w-md min-w-96 w-auto bg-black border-neon-green neon-border text-white" aria-describedby={undefined}>
          <div className="flex flex-col items-center">
            <SharePreview />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button variant="outline" className="flex items-center gap-2 border-neon-green text-neon-green" onClick={handleCopyImage}>
                <Image className="w-4 h-4" /> Copy Image
              </Button>
              <Button variant="outline" className="flex items-center border-neon-green text-neon-green" onClick={() => handlePlatformShare('x')}><Twitter className="w-4 h-4 text-blue-400" /> X </Button>
              <Button variant="outline" className="flex items-center border-neon-green text-orange-500" onClick={() => handlePlatformShare('reddit')}><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="8.5" cy="13.5" r="1.5" /><circle cx="15.5" cy="13.5" r="1.5" /><path d="M12 17c1.657 0 3-1.343 3-3H9c0 1.657 1.343 3 3 3z" /><path d="M16.24 7.76l2.12-2.12" /><circle cx="19" cy="5" r="1" /></svg> Reddit</Button>
              <Button variant="outline" className="flex items-center border-neon-green text-blue-500" onClick={() => handlePlatformShare('telegram')}><Send className="w-4 h-4" /> Telegram</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
