import type { APIRoute } from 'astro';
import { qrMarqueSvg, urlChaine } from '../../lib/pdf/qr-marque';
import { commerce } from '../../config/commerce';

/** QR de la chaîne WhatsApp (à défaut de chaîne configurée : l'adresse du site). */
export const GET: APIRoute = () =>
  new Response(qrMarqueSvg(urlChaine() || `${commerce.urlSite}/`), { headers: { 'Content-Type': 'image/svg+xml' } });
