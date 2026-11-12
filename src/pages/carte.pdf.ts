import type { APIRoute } from 'astro';
import { genererCartePdf } from '../lib/pdf/carte';

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await genererCartePdf()), { headers: { 'Content-Type': 'application/pdf' } });
