import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { WagmiProvider, http, createConfig } from 'wagmi';
import { monadTestnet } from 'wagmi/chains';
import { injected, metaMask, safe } from 'wagmi/connectors';

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(),
    metaMask(),
    safe(),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
});

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
