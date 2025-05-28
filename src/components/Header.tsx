
import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, User, Grid3X3 } from 'lucide-react';

export const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-sm border-b border-neon-green/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Grid3X3 className="w-8 h-8 text-neon-green" />
            <h1 className="text-2xl font-bold text-neon-green glow-effect">
              MONAPIX
            </h1>
            <div className="text-xs text-neon-blue hidden sm:block">
              256x256 Pixel Marketplace
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="text-gray-300">
                Floor Price: <span className="text-yellow-400">1.0 ETH</span>
              </div>
              <div className="text-gray-300">
                Total Pixels: <span className="text-neon-blue">65,536</span>
              </div>
            </div>

            <Button
              size="sm"
              className="cyber-button"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="border-neon-green/50 text-neon-green"
            >
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
