import type { Request, Response } from "express";
import { supabase } from "@/integrations/supabase/client";

// Fetch pixel info from the database by pixelID
async function getPixelInfo(pixelID: string) {
  // pixelID from params is likely a string, but DB uses number
  const pixel_id = Number(pixelID);
  if (isNaN(pixel_id)) return null;
  const { data, error } = await supabase
    .from('pixels')
    .select('*')
    .eq('pixel_id', pixel_id)
    .single();
  if (error || !data) return null;
  return data;
}

export default async function (req: Request, res: Response) {
  const { pixelID } = req.params;
  const pixel = await getPixelInfo(pixelID);
  const { x, y } = idToCoords(pixel.pixel_id);

  if (!pixel) {
    res.status(404).json({ error: 'Pixel not found' });
    return;
  }

  // OpenSea metadata standard
  const metadata = {
    name: `Monapix (${x},${y})`,
    description: `Monapix is a pixel-based NFT marketplace where each pixel is a unique, tradable, customizable.`,
    image: `https://monapix.org/api/pix/${pixelID}`,
    external_url: `https://monapix.org`,
    attributes: [
      { trait_type: 'color', value: pixel.color },
      { trait_type: 'image', value: pixel.image_url },
      { trait_type: 'owner', value: pixel.owner_wallet ?? 'N/A' },
      { trait_type: 'unlocked_at', value: pixel.unlocked_at ? new Date(pixel.unlocked_at * 1000).toISOString() : 'N/A' },
      { trait_type: 'minted_at', value: pixel.created_at ? new Date(pixel.created_at).toISOString() : 'N/A' }
    ],
  };

  res.setHeader('Content-Type', 'application/json');
  res.json(metadata);
}

function idToCoords(id: number) {
  const x = Math.floor(id / 1000);
  const y = id % 1000;
  return { x, y };
}