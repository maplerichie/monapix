
import React from 'react';
import { Header } from '@/components/Header';
import { PixelCanvas } from '@/components/PixelCanvas';

const Index = () => {
  return (
    <div className="min-h-screen bg-dark-bg overflow-hidden">
      <Header />
      <div className="pt-16">
        <PixelCanvas />
      </div>
    </div>
  );
};

export default Index;
