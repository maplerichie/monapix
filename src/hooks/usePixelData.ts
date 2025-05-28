
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Pixel {
  pixel_id: number;
  x: number;
  y: number;
  color: string;
  image_url?: string;
  link?: string;
  owner_wallet?: string;
  last_price?: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  pixel_id: number;
  transaction_type: 'mint' | 'transfer' | 'update';
  from_wallet?: string;
  to_wallet?: string;
  transaction_hash: string;
  created_at: string;
}

export const usePixelData = () => {
  const [pixels, setPixels] = useState<Map<string, Pixel>>(new Map());
  const [loading, setLoading] = useState(true);

  // Convert pixel_id to x,y coordinates
  const getCoordinatesFromId = (pixel_id: number) => ({
    x: Math.floor(pixel_id / 1000),
    y: pixel_id % 1000
  });

  // Convert x,y coordinates to pixel_id
  const getPixelId = (x: number, y: number) => x * 1000 + y;

  // Fetch pixels in viewport range
  const fetchPixels = async (minX = 0, maxX = 255, minY = 0, maxY = 255) => {
    try {
      const minPixelId = minX * 1000 + minY;
      const maxPixelId = maxX * 1000 + maxY;

      const { data, error } = await supabase
        .from('pixels')
        .select('*')
        .gte('pixel_id', minPixelId)
        .lte('pixel_id', maxPixelId);

      if (error) throw error;

      const pixelMap = new Map<string, Pixel>();
      data?.forEach((pixel) => {
        const coords = getCoordinatesFromId(pixel.pixel_id);
        const pixelWithCoords = {
          ...pixel,
          x: coords.x,
          y: coords.y
        };
        pixelMap.set(`${coords.x},${coords.y}`, pixelWithCoords);
      });

      setPixels(pixelMap);
    } catch (error) {
      console.error('Error fetching pixels:', error);
      toast.error('Failed to load pixel data');
    } finally {
      setLoading(false);
    }
  };

  // Save or update a pixel
  const savePixel = async (x: number, y: number, data: Partial<Pixel>) => {
    try {
      const pixel_id = getPixelId(x, y);
      const pixelData = {
        pixel_id,
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('pixels')
        .upsert(pixelData)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const coords = getCoordinatesFromId(result.pixel_id);
      const updatedPixel = {
        ...result,
        x: coords.x,
        y: coords.y
      };
      
      setPixels(prev => new Map(prev.set(`${x},${y}`, updatedPixel)));
      
      return result;
    } catch (error) {
      console.error('Error saving pixel:', error);
      toast.error('Failed to save pixel');
      throw error;
    }
  };

  // Create a transaction record
  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('pixels_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pixels'
        },
        (payload) => {
          console.log('Real-time pixel update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const pixel = payload.new as Pixel;
            const coords = getCoordinatesFromId(pixel.pixel_id);
            const pixelWithCoords = {
              ...pixel,
              x: coords.x,
              y: coords.y
            };
            
            setPixels(prev => new Map(prev.set(`${coords.x},${coords.y}`, pixelWithCoords)));
            
            if (payload.eventType === 'INSERT') {
              toast.success(`Pixel minted at (${coords.x}, ${coords.y})`);
            }
          } else if (payload.eventType === 'DELETE') {
            const pixel = payload.old as Pixel;
            const coords = getCoordinatesFromId(pixel.pixel_id);
            setPixels(prev => {
              const updated = new Map(prev);
              updated.delete(`${coords.x},${coords.y}`);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    pixels,
    loading,
    fetchPixels,
    savePixel,
    createTransaction,
    getPixelId,
    getCoordinatesFromId
  };
};
