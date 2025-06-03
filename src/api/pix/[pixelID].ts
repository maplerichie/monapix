import type { Request, Response } from "express";
import { supabase } from "@/integrations/supabase/client";

// Fetch pixel info from the database by pixelID
async function getPixelInfo(pixelID: string) {
  // pixelID from pixel is likely a string, but DB uses number
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

  if (!pixel) {
    res.status(404).send('Pixel not found');
    return;
  }
  const { x, y } = idToCoords(pixel.pixel_id);
  const displayOwner = pixel.owner_wallet.slice(0, 8) + '...' + pixel.owner_wallet.slice(-8);
  const skillLength = Math.floor(Math.random() * 20) + 5; // Random length 5-24
  const skillPattern = '?'.repeat(skillLength);

  const svg = `<svg width="245" height="405" viewBox="0 0 245 405" xmlns="http://www.w3.org/2000/svg">
  <!-- Card Background -->
  <rect width="245" height="405" rx="12" ry="12" fill="#200052" stroke="#836EF9" stroke-width="2"/>
  
  <!-- Name banner -->
  <rect x="16" y="16" width="213" height="28" rx="4" ry="4" fill="#200052" stroke="#836EF9" stroke-width="1"/>
  
  <!-- Monapix Name -->
  <text x="22" y="35" font-family="'Orbitron', monospace" font-size="16" font-weight="bold" fill="#39FF14">Monapix (${x},${y})</text>
  
  <!-- Level -->
  <text x="180" y="35" font-family="'Orbitron', monospace" font-size="14" font-weight="bold" fill="#39FF14">Lv.0</text>
  
  <!-- Main artwork/image area (square) -->
  <rect x="16" y="52" width="213" height="213" rx="6" ry="6" fill="${pixel.color || '#87CEEB'}" stroke="#836EF9" stroke-width="1"/>
  
  ${pixel.image_url
      ? `<image href="${pixel.image_url}" x="20" y="56" width="205" height="205" preserveAspectRatio="xMidYMid slice"/>`
      : `<text x="122.5" y="150" font-family="'Orbitron', monospace" font-size="24" font-weight="bold" fill="#39FF14" text-anchor="middle" opacity="0.8">PIXEL</text>
         <text x="122.5" y="180" font-family="'Orbitron', monospace" font-size="16" fill="#39FF14" text-anchor="middle" opacity="0.6">#${pixel.pixel_id}</text>`
    }
  
  <!-- Info bar -->
  <rect x="16" y="275" width="213" height="20" fill="#200052" stroke="#836EF9" stroke-width="1"/>
  <text x="20" y="289" font-family="'Orbitron', monospace" font-size="10" fill="#39FF14">ID: ${pixel.pixel_id}</text>
  <text x="170" y="289" font-family="'Orbitron', monospace" font-size="10" fill="#39FF14">${pixel.price} MON</text>
  
  <!-- Owner info section -->
  <rect x="16" y="303" width="213" height="35" fill="#200052" stroke="#836EF9" stroke-width="1"/>
  <text x="20" y="317" font-family="'Orbitron', monospace" font-size="10" font-weight="bold" fill="#39FF14">${displayOwner}</text>
  <text x="20" y="330" font-family="'Orbitron', monospace" font-size="9" fill="#39FF14">Unlock at ${pixel.unlocked_at ? new Date(pixel.unlocked_at * 1000).toLocaleString() : 'N/A'} UTC</text>
  
  <!-- Skills section -->
  <rect x="16" y="346" width="213" height="32" fill="#200052" stroke="#836EF9" stroke-width="1"/>
  <text x="20" y="360" font-family="'Orbitron', monospace" font-size="10" font-weight="bold" fill="#39FF14">Effect:</text>
  <text x="20" y="373" font-family="'Orbitron', monospace" font-size="8" fill="#39FF14">${skillPattern}</text>
  
  <!-- Footer -->
  <text x="122.5" y="400" font-family="'Orbitron', monospace" font-size="8" fill="#39FF14" text-anchor="middle">© 2025 monapix.org</text>
  
  <!-- Holographic effect overlay -->
  <defs>
    <linearGradient id="holoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(131,110,249,0.12);stop-opacity:1" />
      <stop offset="25%" style="stop-color:rgba(57,255,20,0.10);stop-opacity:1" />
      <stop offset="50%" style="stop-color:rgba(32,0,82,0.10);stop-opacity:1" />
      <stop offset="75%" style="stop-color:rgba(131,110,249,0.10);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(57,255,20,0.12);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="16" y="52" width="213" height="213" rx="6" ry="6" fill="url(#holoGrad)"/>
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  res.send(svg);
}

function idToCoords(id: number) {
  const x = Math.floor(id / 1000);
  const y = id % 1000;
  return { x, y };
}