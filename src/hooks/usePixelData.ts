
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
  price?: number;
  unlocked_at: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  pixel_id: number;
  transaction_type: 'mint' | 'purchase';
  from_wallet?: string;
  to_wallet?: string;
  transaction_hash: string;
  created_at: string;
}

// Input validation functions
function validateCoordinates(x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && 
         x >= 0 && x <= 255 && y >= 0 && y <= 255;
}

function validatePixelData(data: Partial<Pixel>): Partial<Pixel> {
  const validated: Partial<Pixel> = {};
  
  if (data.color && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.color)) {
    validated.color = data.color;
  }
  
  if (data.image_url) {
    try {
      const url = new URL(data.image_url);
      if (url.protocol === 'https:') {
        validated.image_url = data.image_url.substring(0, 500);
      }
    } catch {
      // Invalid URL, skip
    }
  }
  
  if (data.link) {
    try {
      const url = new URL(data.link);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        validated.link = data.link.substring(0, 500);
      }
    } catch {
      // Invalid URL, skip
    }
  }
  
  if (data.owner_wallet && /^0x[a-fA-F0-9]{40}$/.test(data.owner_wallet)) {
    validated.owner_wallet = data.owner_wallet;
  }
  
  if (data.price && Number.isFinite(data.price) && data.price >= 0) {
    validated.price = data.price;
  }
  
  if (data.unlocked_at && Number.isInteger(data.unlocked_at) && data.unlocked_at >= 0) {
    validated.unlocked_at = data.unlocked_at;
  }
  
  return validated;
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
  const getPixelId = (x: number, y: number) => {
    if (!validateCoordinates(x, y)) {
      throw new Error('Invalid coordinates');
    }
    return x * 1000 + y;
  };

  // Fetch pixels in viewport range with proper validation
  const fetchPixels = async (minX = 0, maxX = 255, minY = 0, maxY = 255) => {
    try {
      // Validate input parameters
      if (!validateCoordinates(minX, minY) || !validateCoordinates(maxX, maxY)) {
        throw new Error('Invalid coordinate range');
      }
      
      if (minX > maxX || minY > maxY) {
        throw new Error('Invalid range: min values cannot be greater than max values');
      }

      const minPixelId = minX * 1000 + minY;
      const maxPixelId = maxX * 1000 + maxY;

      const { data, error } = await supabase
        .from('pixels')
        .select('pixel_id, color, image_url, link, owner_wallet, price, unlocked_at, created_at, updated_at')
        .gte('pixel_id', minPixelId)
        .lte('pixel_id', maxPixelId)
        .limit(1000); // Prevent excessive data loading

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      const pixelMap = new Map<string, Pixel>();
      data?.forEach((pixel) => {
        const coords = getCoordinatesFromId(pixel.pixel_id);
        
        // Validate coordinates are within expected range
        if (validateCoordinates(coords.x, coords.y)) {
          const pixelWithCoords = {
            ...pixel,
            x: coords.x,
            y: coords.y
          };
          pixelMap.set(`${coords.x},${coords.y}`, pixelWithCoords);
        }
      });

      setPixels(pixelMap);
    } catch (error) {
      console.error('Error fetching pixels:', error);
      toast.error('Failed to load pixel data');
    } finally {
      setLoading(false);
    }
  };

  // Save or update a pixel with proper validation
  const savePixel = async (x: number, y: number, data: Partial<Pixel>) => {
    try {
      if (!validateCoordinates(x, y)) {
        throw new Error('Invalid coordinates');
      }

      const pixel_id = getPixelId(x, y);
      const validatedData = validatePixelData(data);
      
      if (Object.keys(validatedData).length === 0) {
        throw new Error('No valid data provided');
      }

      const pixelData = {
        pixel_id,
        ...validatedData,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('pixels')
        .upsert(pixelData)
        .select('pixel_id, color, image_url, link, owner_wallet, price, unlocked_at, created_at, updated_at')
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

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

  // Create a transaction record with validation
  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    try {
      // Validate transaction data
      if (!Number.isInteger(transaction.pixel_id) || transaction.pixel_id < 0) {
        throw new Error('Invalid pixel ID');
      }
      
      if (!['mint', 'purchase'].includes(transaction.transaction_type)) {
        throw new Error('Invalid transaction type');
      }
      
      if (!transaction.transaction_hash || !/^0x[a-fA-F0-9]{64}$/.test(transaction.transaction_hash)) {
        throw new Error('Invalid transaction hash');
      }
      
      if (transaction.from_wallet && !/^0x[a-fA-F0-9]{40}$/.test(transaction.from_wallet)) {
        throw new Error('Invalid from_wallet address');
      }
      
      if (transaction.to_wallet && !/^0x[a-fA-F0-9]{40}$/.test(transaction.to_wallet)) {
        throw new Error('Invalid to_wallet address');
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  };

  // Set up real-time subscription with error handling
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
          try {
            console.log('Real-time pixel update:', payload);

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const pixel = payload.new as Pixel;
              
              // Validate the incoming data
              if (!pixel.pixel_id || !Number.isInteger(pixel.pixel_id)) {
                console.error('Invalid pixel data received:', pixel);
                return;
              }
              
              const coords = getCoordinatesFromId(pixel.pixel_id);
              
              if (!validateCoordinates(coords.x, coords.y)) {
                console.error('Invalid coordinates for pixel:', pixel);
                return;
              }
              
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
              
              if (pixel.pixel_id && Number.isInteger(pixel.pixel_id)) {
                const coords = getCoordinatesFromId(pixel.pixel_id);
                
                if (validateCoordinates(coords.x, coords.y)) {
                  setPixels(prev => {
                    const updated = new Map(prev);
                    updated.delete(`${coords.x},${coords.y}`);
                    return updated;
                  });
                }
              }
            }
          } catch (error) {
            console.error('Error processing real-time update:', error);
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
