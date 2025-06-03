import { supabase } from "../../src/integrations/supabase/client";
import { Config, Context } from "@netlify/functions";

function validatePixelID(pixelID: string): number | null {
    const pixel_id = Number(pixelID);
    if (isNaN(pixel_id) || pixel_id < 0 || pixel_id > 255999) {
        return null;
    }
    return pixel_id;
}

function sanitizeText(text: string): string {
    return text
        .replace(/[<>&"']/g, (char) => {
            switch (char) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '"': return '&quot;';
                case "'": return '&#x27;';
                default: return char;
            }
        })
        .substring(0, 100);
}

function validateColor(color: string): string {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return colorRegex.test(color) ? color : '#ffffff';
}

function validateImageUrl(url: string): string {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== 'https:') {
            return '';
        }
        return url.substring(0, 500);
    } catch {
        return '';
    }
}

async function getPixelInfo(pixelID: string) {
    const pixel_id = validatePixelID(pixelID);
    if (pixel_id === null) return null;

    try {
        const { data, error } = await supabase
            .from('pixels')
            .select('pixel_id, color, image_url, owner_wallet, unlocked_at, price')
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

export default async (req: Request, context: Context) => {
    if (req.method !== 'GET') {
        return new Response("Method not allowed", {
            status: 405,
        })
    }

    const pixelID = context.url.pathname.replaceAll("/pix/", "");
    if (!pixelID || typeof pixelID !== 'string') {
        return new Response("Invalid pixel ID", {
            status: 400,
        });
    }

    try {
        const pixel = await getPixelInfo(pixelID);

        if (!pixel) {
            return new Response("Pixel not found", {
                status: 404,
            });
        }

        const { x, y } = idToCoords(pixel.pixel_id);
        const sanitizedColor = validateColor(pixel.color);
        const sanitizedImageUrl = pixel.image_url ? validateImageUrl(pixel.image_url) : '';
        const displayOwner = pixel.owner_wallet ?
            sanitizeText(pixel.owner_wallet.slice(0, 8) + '...' + pixel.owner_wallet.slice(-8)) :
            'Unknown';
        const unlockTime = pixel.unlocked_at ?
            sanitizeText(new Date(pixel.unlocked_at * 1000).toLocaleString()) :
            'N/A';
        const skillLength = Math.floor(Math.random() * 20) + 5;
        const skillPattern = '?'.repeat(skillLength);

        const svg = `<svg width="245" height="405" viewBox="0 0 245 405" xmlns="http://www.w3.org/2000/svg">
  <rect width="245" height="405" rx="12" ry="12" fill="#200052" stroke="#836EF9" stroke-width="2"/>
  <rect x="16" y="16" width="213" height="28" rx="4" ry="4" fill="#200052" stroke="#836EF9" stroke-width="1"/>
  <text x="22" y="35" font-family="'Orbitron', monospace" font-size="16" font-weight="bold" fill="#39FF14">Monapix (${x},${y})</text>
  <text x="180" y="35" font-family="'Orbitron', monospace" font-size="14" font-weight="bold" fill="#39FF14">Lv.0</text>
  <rect x="16" y="52" width="213" height="213" rx="6" ry="6" fill="${sanitizedColor}" stroke="#836EF9" stroke-width="1"/>
  ${sanitizedImageUrl
                ? `<image href="${sanitizedImageUrl}" x="20" y="56" width="205" height="205" preserveAspectRatio="xMidYMid slice"/>`
                : `<text x="122.5" y="150" font-family="'Orbitron', monospace" font-size="24" font-weight="bold" fill="#39FF14" text-anchor="middle" opacity="0.8">PIXEL</text>
         <text x="122.5" y="180" font-family="'Orbitron', monospace" font-size="16" fill="#39FF14" text-anchor="middle" opacity="0.6">#${pixel.pixel_id}</text>`
            }
  <rect x="16" y="275" width="213" height="20" fill="#200052" stroke="#836EF9" stroke-width="1"/>
  <text x="20" y="289" font-family="'Orbitron', monospace" font-size="10" fill="#39FF14">ID: ${pixel.pixel_id}</text>
  <text x="170" y="289" font-family="'Orbitron', monospace" font-size="10" fill="#39FF14">${pixel.price || '1.0'} MON</text>
  <rect x="16" y="303" width="213" height="35" fill="#200052" stroke="#836EF9" stroke-width="1"/>
  <text x="20" y="317" font-family="'Orbitron', monospace" font-size="10" font-weight="bold" fill="#39FF14">${displayOwner}</text>
  <text x="20" y="330" font-family="'Orbitron', monospace" font-size="9" fill="#39FF14">Unlock at ${unlockTime} UTC</text>
  <rect x="16" y="346" width="213" height="32" fill="#200052" stroke="#836EF9" stroke-width="1"/>
  <text x="20" y="360" font-family="'Orbitron', monospace" font-size="10" font-weight="bold" fill="#39FF14">Effect:</text>
  <text x="20" y="373" font-family="'Orbitron', monospace" font-size="8" fill="#39FF14">${skillPattern}</text>
  <text x="122.5" y="400" font-family="'Orbitron', monospace" font-size="8" fill="#39FF14" text-anchor="middle">© 2025 monapix.org</text>
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

        return new Response(svg, {
            status: 200,
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=300',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        console.error('Server error:', error);
        return new Response(error.toString(), {
            status: 500,
        });
    }
};

export const config: Config = {
    path: "/pix/:id"
};