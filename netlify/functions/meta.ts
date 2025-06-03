import { supabase } from "../../src/integrations/supabase/client";
import type { Config, Context } from "@netlify/functions";

function validatePixelID(pixelID: string): number | null {
    const pixel_id = Number(pixelID);
    if (isNaN(pixel_id) || pixel_id < 0 || pixel_id > 255999) {
        return null;
    }
    return pixel_id;
}

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

export const config: Config = {
    path: "/meta/:pixelID"
};

export default async (req: Request, context: Context) => {
    if (req.method !== 'GET') {
        return new Response("Method not allowed", {
            status: 405,
        });
    }

    const pixelID = context.url.pathname.replaceAll("/meta/", "");
    if (!pixelID || typeof pixelID !== 'string') {
        return new Response("Invalid pixel ID", {
            status: 404,
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

        const metadata = {
            name: `Monapix (${x},${y})`,
            description: `Monapix is a pixel-based NFT marketplace where each pixel is a unique, tradable, customizable.`,
            image: `https://monapix.org/pix/${pixel.pixel_id}`,
            external_url: `https://monapix.org`,
            attributes: [
                { trait_type: 'color', value: pixel.color || '#ffffff' },
                { trait_type: 'image', value: pixel.image_url || '' },
                {
                    trait_type: 'owner', value: pixel.owner_wallet ?
                        pixel.owner_wallet.slice(0, 8) + '...' + pixel.owner_wallet.slice(-8) : 'N/A'
                },
                {
                    trait_type: 'unlocked_at', value: pixel.unlocked_at ?
                        new Date(pixel.unlocked_at * 1000).toISOString() : 'N/A'
                },
                {
                    trait_type: 'minted_at', value: pixel.created_at ?
                        new Date(pixel.created_at).toISOString() : 'N/A'
                }
            ],
        };

        return new Response(JSON.stringify(metadata), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300',
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        return new Response(error.toString(), {
            status: 500,
        });
    }
}; 