import { Button } from '@/components/ui/button';
import { Wallet, User, Grid3X3, HelpCircle } from 'lucide-react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { useTotalSupply } from '@/lib/monapixContract';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export const Header = () => {
  const { address: account, isConnected } = useAccount();
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect();
  const { data: totalSupply } = useTotalSupply();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-sm border-b border-neon-green/70 shadow-[0_0_20px_hsl(var(--neon-green)_/_0.7)]">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex flex-row items-center justify-between gap-1 sm:gap-0 min-h-[48px]">
          <div className="flex items-center gap-1 sm:gap-3 w-auto justify-start">
            <img src="/icon.png" alt="MONAPIX" className="w-6 h-6 sm:w-8 sm:h-8" />
            <h1 className="text-base sm:text-2xl font-bold text-neon-green glow-effect">
              MONAPIX <span className="text-neon-blue text-xs">v0</span>
            </h1>
          </div>

          <div className="flex flex-row items-center gap-1 sm:gap-2 w-auto justify-end flex-shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-neon-green neon-border flex items-center gap-1 min-w-0 px-2 py-1 h-8 text-xs">
                  <HelpCircle className="w-4 h-4" />
                  <span className="hidden xs:inline">How to Play</span>
                  <span className="inline xs:hidden">Help</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs sm:max-w-md min-w-0 sm:min-w-80 w-full bg-black/95 border-neon-green neon-border shadow-[0_0_20px_hsl(var(--neon-green)_/_0.7)] text-white">
                <DialogHeader>
                  <DialogTitle className="text-neon-green glow-effect flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-neon-green" />
                    How to Play
                  </DialogTitle>
                </DialogHeader>
                <DialogDescription asChild>
                  <div className="text-neon-blue text-sm sm:text-base pt-2 space-y-3">
                    <span>There are only 65,536 monapix on the Monad.</span>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Each pixel is an NFT, starting at 1 MON.</li>
                      <li>When you mint, set a lock duration (1-7 days). Each day adds +0.2 MON to the resell price.</li>
                      <li>After the pixel is unlocked, anyone can buy your pixel instantly at the resell price.</li>
                      <li>Owner not required to list for sale; unlocked pixels are always available for purchase.</li>
                      <li>More to come...</li>
                    </ul>
                  </div>
                </DialogDescription>
              </DialogContent>
            </Dialog>
            <div className="hidden md:flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="text-neon-blue">
                From: <span className="text-neon-green font-bold">1.0 MON</span>
              </div>
              <div className="text-neon-blue">
                Minted: <span className="text-neon-green font-bold">{totalSupply?.toString() || '...'}/65,536</span>
              </div>
            </div>

            {isConnected ? (
              <div className="flex items-center gap-1 sm:gap-2 w-auto justify-center">
                <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-neon-blue">
                  <User className="w-4 h-4 text-neon-green" />
                  <span className="font-mono text-neon-green">{formatAddress(account!)}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => disconnect()}
                  className="text-neon-green neon-border min-w-0 px-2 py-1 h-8 text-xs"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="focus-neon neon-border min-w-0 px-2 py-1 h-8 text-xs"
                onClick={() => connect({ connector: connectors[0] })}
              >
                <Wallet className="w-4 h-4 mr-2 text-neon-green" />
                <span className="hidden xs:inline">Connect Wallet</span>
                <span className="inline xs:hidden">Connect</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
