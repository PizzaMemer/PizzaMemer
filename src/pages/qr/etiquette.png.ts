import type { APIRoute } from 'astro';
import { genererEtiquettePng } from '../../lib/pdf/etiquette';

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await genererEtiquettePng()), { headers: { 'Content-Type': 'image/png' } });
