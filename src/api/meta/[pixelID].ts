
import type { Request, Response } from "express";
import { supabase } from "@/integrations/supabase/client";

// Input validation function
function validatePixelID(pixelID: string): number | null {
  const pixel_id = Number(pixelID);
  if (isNaN(pixel_id) || pixel_id < 0 || pixel_id > 255999) {
    return null;
  }
  return pixel_id;
}

// Fetch pixel info from the database by pixelID with proper error handling
async function getPixelInfo(pixelID: string) {
  const pixel_id = validatePixelID(pixelID);
  if (pixel_id === null) return null;

  try {
    const { data, error } = await supabase
      .from('pixels')
      .select('pixel_id, color, image_url, owner_wallet, unlocked_at, created_at')
      .eq('pixel_id', pixel_id)
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
}

function idToCoords(id: number) {
  const x = Math.floor(id / 1000);
  const y = id % 1000;
  return { x, y };
}

export default async function (req: Request, res: Response) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { pixelID } = req.params;

  // Validate input
  if (!pixelID || typeof pixelID !== 'string') {
    res.status(400).json({ error: 'Invalid pixel ID' });
    return;
  }

  try {
    const pixel = await getPixelInfo(pixelID);

    if (!pixel) {
      res.status(404).json({ error: 'Pixel not found' });
      return;
    }

    const { x, y } = idToCoords(pixel.pixel_id);

    // Sanitize data before sending
    const metadata = {
      name: `Monapix (${x},${y})`,
      description: `Monapix is a pixel-based NFT marketplace where each pixel is a unique, tradable, customizable.`,
      image: `https://monapix.org/api/pix/${pixel.pixel_id}`,
      external_url: `https://monapix.org`,
      attributes: [
        { trait_type: 'color', value: pixel.color || '#ffffff' },
        { trait_type: 'image', value: pixel.image_url || '' },
        { trait_type: 'owner', value: pixel.owner_wallet ? 
          pixel.owner_wallet.slice(0, 8) + '...' + pixel.owner_wallet.slice(-8) : 'N/A' },
        { trait_type: 'unlocked_at', value: pixel.unlocked_at ? 
          new Date(pixel.unlocked_at * 1000).toISOString() : 'N/A' },
        { trait_type: 'minted_at', value: pixel.created_at ? 
          new Date(pixel.created_at).toISOString() : 'N/A' }
      ],
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minute cache
    res.json(metadata);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
