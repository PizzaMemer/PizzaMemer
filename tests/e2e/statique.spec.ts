import { expect, test } from '@playwright/test';
import jsQR from 'jsqr';
import sharp from 'sharp';
import { commerce } from '../../src/config/commerce';
import { BASE } from './aide';

test('carte.pdf : PDF valide et bouton de téléchargement', async ({ page, request }) => {
  const r = await request.get('carte.pdf');
  expect(r.status()).toBe(200);
  expect(r.headers()['content-type']).toContain('application/pdf');
  expect((await r.body()).subarray(0, 4).toString()).toBe('%PDF');
  await page.goto('carte/');
  await expect(page.getByRole('link', { name: /Télécharger la carte/ })).toHaveAttribute('href', `${BASE}carte.pdf`);
});

test('QR : décode vers l’adresse de la carte', async ({ request }) => {
  const r = await request.get('qr/carte.png');
  expect(r.status()).toBe(200);
  const { data, info } = await sharp(await r.body()).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  expect(code?.data).toBe('https://pizzamemer.github.io/PizzaMemer/carte/');
  expect(code?.data).toBe(`${commerce.urlSite}/carte/`);
  for (const f of ['qr/etiquette.pdf', 'qr/etiquette.png']) expect((await request.get(f)).status(), f).toBe(200);
});

const PAGES = [
  { c: '', noindex: false },
  { c: 'carte/', noindex: false },
  { c: 'comment-ca-marche/', noindex: false },
  { c: 'contact/', noindex: false },
  { c: 'commande/', noindex: true },
  { c: 'cette-page-nexiste-pas/', noindex: true },
];
for (const p of PAGES) {
  test(`SEO ${p.c || 'accueil'}`, async ({ page }) => {
    await page.goto(p.c);
    const meta = async (sel: string) => (await page.locator(sel).first().getAttribute('content')) ?? '';
    expect((await meta('meta[name="description"]')).length).toBeGreaterThan(20);
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(/^https:\/\/pizzamemer\.github\.io\/PizzaMemer\//);
    expect((await meta('meta[property="og:title"]')).length).toBeGreaterThan(0);
    expect(await meta('meta[property="og:image"]')).toMatch(/^https:\/\/pizzamemer\.github\.io\/PizzaMemer\/.+/);
    const robots = await meta('meta[name="robots"]');
    if (p.noindex) expect(robots).toContain('noindex');
    else expect(robots).not.toContain('noindex');
  });
}

test('robots.txt, sitemap, JSON-LD', async ({ page, request }) => {
  expect((await request.get('robots.txt')).status()).toBe(200);
  expect((await request.get('sitemap-index.xml')).status()).toBe(200);
  await page.goto('');
  const blocs = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = blocs.map((b) => JSON.parse(b)).flatMap((o) => [o['@type']].flat());
  expect(types).toContain('FoodEstablishment');
});
