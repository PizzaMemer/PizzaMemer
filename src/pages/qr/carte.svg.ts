import type { APIRoute } from 'astro';
import { qrSvg, urlCarte } from '../../lib/pdf/qr';

export const GET: APIRoute = () =>
  new Response(qrSvg(urlCarte(), { taille: 1200 }), { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
