import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { commerce } from '../../src/config/commerce';
import { qrPng, qrSvg, urlCarte } from '../../src/lib/pdf/qr';
import { COTE_MM, DPI_PNG, genererEtiquettePng } from '../../src/lib/pdf/etiquette';

async function lirePng(buf: Buffer) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}
async function decoderPng(buf: Buffer): Promise<string | null> {
  const p = await lirePng(buf);
  return jsQR(new Uint8ClampedArray(p.data), p.width, p.height)?.data ?? null;
}

/**
 * Simule un QR imprimé sur une boîte kraft puis photographié par un téléphone moyen :
 * réduction à ~8 px/mm, puis ~4 px/mm, léger flou gaussien, noir -> #333, blanc -> #c9a877.
 */
async function vuParTelephone(png: Buffer, cotéMm: number, flou = 0.7): Promise<string | null> {
  const hi = await sharp(png).resize(cotéMm * 8, cotéMm * 8, { kernel: 'lanczos3' }).toBuffer();
  const lo = await sharp(hi).resize(cotéMm * 4, cotéMm * 4, { kernel: 'linear' }).blur(flou).toBuffer();
  const { data, info } = await sharp(lo).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const t = data[i * info.channels] / 255; // 0 = noir, 1 = blanc
    rgba[i * 4] = 0x33 + t * (0xc9 - 0x33);
    rgba[i * 4 + 1] = 0x33 + t * (0xa8 - 0x33);
    rgba[i * 4 + 2] = 0x33 + t * (0x77 - 0x33);
    rgba[i * 4 + 3] = 255;
  }
  return jsQR(rgba, info.width, info.height)?.data ?? null;
}

describe('urlCarte', () => {
  it('vaut <urlSite>/carte/ sans double barre', () => {
    expect(urlCarte()).toBe(`${commerce.urlSite.replace(/\/+$/, '')}/carte/`);
    expect(urlCarte()).toMatch(/^https:\/\/[^/]+(\/[^/]+)?\/carte\/$/);
    expect(urlCarte().replace('https://', '')).not.toContain('//');
  });
});

describe('QR de la carte', () => {
  it('le PNG 1200 px se décode en urlCarte()', async () => {
    const png = await qrPng(urlCarte(), 1200);
    const p = await lirePng(png);
    expect([p.width, p.height]).toEqual([1200, 1200]);
    expect(await decoderPng(png)).toBe(urlCarte());
  });

  it('est en noir et blanc purs, avec une zone de silence blanche de 4 modules', async () => {
    const p = await lirePng(await qrPng(urlCarte(), 1200));
    const valeurs = new Set<number>();
    for (let i = 0; i < p.data.length; i += 4) valeurs.add(p.data[i]);
    expect([...valeurs].sort()).toEqual([0, 255]);
    // bandeau de silence : 4 modules ≈ 4 × 1200 / (n + 8) px ; on contrôle les 100 premiers px
    for (let y = 0; y < 100; y++) for (let x = 0; x < 1200; x += 7) expect(p.data[(y * 1200 + x) * 4]).toBe(255);
  });

  it('le SVG est valide, noir sur blanc, viewBox carré', () => {
    const svg = qrSvg(urlCarte());
    expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 (\d+) \1"/);
    expect(svg).toContain('fill="#000000"');
    expect(svg).toContain('fill="#ffffff"');
  });

  /**
   * Lisibilité à taille réelle (côté mesuré zone de silence comprise, simulation ci-dessus).
   * Résultats mesurés avec jsQR et l'adresse actuelle (QR version 4 = 33 modules + 2 × 4 de silence) :
   *   25 mm : lisible, même avec un flou fort (σ = 1)    -> TAILLE RECOMMANDÉE
   *   22 mm : lisible avec un flou léger (σ ≤ 0.7)       -> TAILLE MINIMALE VALIDÉE
   *   20 mm : échoue dès σ = 0.7 ; 15 mm : échoue        -> NE PAS descendre sous 22 mm
   * (≈ 2 px par module à 4 px/mm : en dessous, un téléphone moyen n'échantillonne plus correctement.)
   * L'étiquette fournie fait 34 mm de QR : large marge de sécurité. Une adresse plus courte
   * (moins de modules) permettrait de réduire la taille, mais l'adresse imprimée ne doit plus changer.
   */
  for (const mm of [25, 22]) {
    it(`reste lisible imprimé à ${mm} mm sur carton kraft`, async () => {
      const png = await qrPng(urlCarte(), 1200);
      expect(await vuParTelephone(png, mm)).toBe(urlCarte());
    });
  }
  it('reste lisible à 25 mm même avec un flou plus fort', async () => {
    expect(await vuParTelephone(await qrPng(urlCarte(), 1200), 25, 1)).toBe(urlCarte());
  });
});

describe('étiquette PNG', () => {
  it('fait 60 mm à 300 dpi et son QR se décode', async () => {
    const buf = await genererEtiquettePng();
    const meta = await sharp(buf).metadata();
    expect(meta.width).toBe(Math.round((COTE_MM / 25.4) * DPI_PNG));
    expect(meta.height).toBe(meta.width);
    expect(await decoderPng(buf)).toBe(urlCarte());
  });
  it("le QR de l'étiquette reste lisible une fois imprimé en 60 mm sur kraft", async () => {
    expect(await vuParTelephone(await genererEtiquettePng(), COTE_MM)).toBe(urlCarte());
  });
});

describe('QR de la chaîne WhatsApp (aux couleurs du site, logo central)', () => {
  it('se décode vers le lien configuré, en grand et en petit (écran de téléphone, 30 mm imprimé)', async () => {
    const { qrMarquePng, urlChaine } = await import('../../src/lib/pdf/qr-marque');
    const lien = urlChaine();
    expect(lien).toMatch(/^https:\/\/(www\.)?whatsapp\.com\/channel\//);
    const png = await qrMarquePng(lien, 1200);
    expect(await decoderPng(png)).toBe(lien);
    for (const px of [520, 260, 180]) {
      const petit = await sharp(png).resize(px, px).blur(0.6).png().toBuffer();
      expect(await decoderPng(petit), `à ${px}px`).toBe(lien);
    }
  });
});
