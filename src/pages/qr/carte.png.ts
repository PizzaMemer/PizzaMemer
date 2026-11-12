import type { APIRoute } from 'astro';
import { qrPng, urlCarte } from '../../lib/pdf/qr';

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await qrPng(urlCarte(), 1200)), { headers: { 'Content-Type': 'image/png' } });
