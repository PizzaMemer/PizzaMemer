import type { APIRoute } from 'astro';
import { qrMarquePng, urlChaine } from '../../lib/pdf/qr-marque';
import { commerce } from '../../config/commerce';

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await qrMarquePng(urlChaine() || `${commerce.urlSite}/`, 1200)), {
    headers: { 'Content-Type': 'image/png' },
  });
