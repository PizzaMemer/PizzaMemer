import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { commerce } from '../../src/config/commerce';
import { pizzasVisibles } from '../../src/lib/catalogue';
import { rs } from '../../src/lib/format';
import { genererCartePdf, lignesPratiques } from '../../src/lib/pdf/carte';
import { genererEtiquettePdf } from '../../src/lib/pdf/etiquette';

async function texteDuPdf(buf: Buffer): Promise<{ pages: number; texte: string }> {
  const req = createRequire(import.meta.url);
  const pdfjs = await import(pathToFileURL(req.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href);
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: false, verbosity: 0 }).promise;
  let texte = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const contenu = await page.getTextContent();
    texte += contenu.items.map((it: any) => it.str).join(' ') + '\n';
  }
  return { pages: doc.numPages, texte };
}
// espaces insécables / fines normalisés pour comparer avec le texte extrait
const norm = (s: string) => s.replace(/[   ]/g, ' ').replace(/\s+/g, ' ');

describe('carte PDF', () => {
  it('est un PDF de taille raisonnable (< 400 Ko), sur une seule page aujourd’hui', async () => {
    const buf = await genererCartePdf();
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
    expect(buf.length).toBeLessThan(400 * 1024);
    expect((await texteDuPdf(buf)).pages).toBe(1);
  });

  it('contient le nom et le prix de CHAQUE pizza visible, et les coordonnées de la config', async () => {
    const { texte } = await texteDuPdf(await genererCartePdf());
    const t = norm(texte);
    const visibles = pizzasVisibles();
    expect(visibles.length).toBeGreaterThan(0);
    for (const p of visibles) {
      expect(t, `nom ${p.nom}`).toContain(norm(p.nom));
      expect(t, `prix ${p.nom}`).toContain(norm(rs(p.prix)));
    }
    expect(t).toContain(norm(commerce.whatsappAffiche));
    expect(t).toContain(norm(commerce.mentionStock));
    expect(t).toContain(norm(commerce.adresseRetrait));
    expect(t).toContain('PIZZA');
    expect(t).toContain('MEMER');
  });

  it('affiche correctement accents, œ et insécable (pas de glyphe manquant)', async () => {
    const { texte } = await texteDuPdf(await genererCartePdf());
    expect(texte).toContain('Chèvre');
    expect(texte).toContain('Bœuf');
    expect(texte).toContain('Péreybère');
    expect(texte).not.toMatch(/[�□]/);
  });

  it('ne contient aucun emoji', async () => {
    const { texte } = await texteDuPdf(await genererCartePdf());
    expect(texte).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('le bloc pratique ne reprend que la config (jours, zones, seuil, remise)', () => {
    const l = lignesPratiques().map((x) => `${x.titre} ${x.texte}`).join('\n');
    expect(l).toContain('Jeudi, vendredi et samedi');
    for (const z of commerce.livraison.zones) expect(l).toContain(z.nom);
    expect(l).toContain(`dès ${rs(1500)}`);
    expect(l).toContain(`dès ${commerce.remises.quantite.aPartirDe} pizzas`);
  });

  it('embarque les polices de marque et la langue', async () => {
    const buf = (await genererCartePdf()).toString('latin1');
    expect(buf).toMatch(/Fraunces/i);
    expect(buf).toMatch(/Figtree/i);
    expect(buf).toMatch(/\/Lang\s*\(fr/);
  });
});

describe('étiquettes PDF', () => {
  it('est un PDF de 2 pages (planche A4 + étiquette seule), léger', async () => {
    const buf = await genererEtiquettePdf();
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
    expect(buf.length).toBeLessThan(400 * 1024);
    expect((await texteDuPdf(buf)).pages).toBe(2);
  });
});
