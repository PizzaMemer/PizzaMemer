import type { APIRoute } from 'astro';
import { genererEtiquettePdf } from '../../lib/pdf/etiquette';

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await genererEtiquettePdf()), { headers: { 'Content-Type': 'application/pdf' } });
