/**
 * Polices de marque pour le PDF et l'étiquette : Fraunces (titres) et Figtree (texte),
 * sous-ensemble latin, fichiers statiques de @fontsource. Les chemins sont résolus depuis
 * le paquet (et non depuis un chemin relatif fragile) pour fonctionner en dev, en test et au build.
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

export type NomPolice = 'titre400' | 'titre600' | 'titre700' | 'texte400' | 'texte600' | 'texte700';

const FICHIERS: Record<NomPolice, [paquet: string, fichier: string]> = {
  titre400: ['fraunces', 'fraunces-latin-400-normal.woff'],
  titre600: ['fraunces', 'fraunces-latin-600-normal.woff'],
  titre700: ['fraunces', 'fraunces-latin-700-normal.woff'],
  texte400: ['figtree', 'figtree-latin-400-normal.woff'],
  texte600: ['figtree', 'figtree-latin-600-normal.woff'],
  texte700: ['figtree', 'figtree-latin-700-normal.woff'],
};

function dossierPaquet(paquet: string): string {
  const ancres = [import.meta.url, `file://${process.cwd()}/package.json`];
  for (const ancre of ancres) {
    try {
      const req = createRequire(ancre);
      return dirname(req.resolve(`@fontsource/${paquet}/package.json`));
    } catch {
      /* essaie l'ancre suivante */
    }
  }
  throw new Error(`Police introuvable : @fontsource/${paquet} (npm install ?)`);
}

const cache = new Map<NomPolice, Buffer>();

/** Contenu binaire (woff) d'une police. */
export function donneesPolice(nom: NomPolice): Buffer {
  let b = cache.get(nom);
  if (!b) {
    const [paquet, fichier] = FICHIERS[nom];
    b = readFileSync(join(dossierPaquet(paquet), 'files', fichier));
    cache.set(nom, b);
  }
  return b;
}

export const NOMS_POLICES = Object.keys(FICHIERS) as NomPolice[];

/** Enregistre toutes les polices dans un document pdfkit. */
export function enregistrerPolices(doc: PDFKit.PDFDocument): void {
  for (const nom of NOMS_POLICES) doc.registerFont(nom, donneesPolice(nom));
}

// ── Texte vectorisé (pour rendre l'étiquette PNG sans dépendre des polices du système) ──
type Fontkit = { create(b: Buffer): any };
let fontkit: Fontkit | null = null;
const fontesCache = new Map<NomPolice, any>();

function fonte(nom: NomPolice) {
  if (!fontkit) {
    const req = createRequire(`file://${process.cwd()}/package.json`);
    fontkit = req('fontkit') as Fontkit;
  }
  let f = fontesCache.get(nom);
  if (!f) {
    f = fontkit.create(donneesPolice(nom));
    fontesCache.set(nom, f);
  }
  return f;
}

/** Largeur d'un texte, dans l'unité de `taille`. */
export function largeurTexte(nom: NomPolice, texte: string, taille: number): number {
  const f = fonte(nom);
  return (f.layout(texte).advanceWidth * taille) / f.unitsPerEm;
}

/** Contour SVG (attribut d) d'un texte dont la ligne de base est en (x, yBase). Unité = celle de `taille`. */
export function cheminTexte(nom: NomPolice, texte: string, taille: number, x: number, yBase: number): string {
  const f = fonte(nom);
  const run = f.layout(texte);
  const k = taille / f.unitsPerEm;
  let pen = 0;
  const parts: string[] = [];
  run.glyphs.forEach((g: any, i: number) => {
    const pos = run.positions[i];
    const gx = x + (pen + pos.xOffset) * k;
    const gy = yBase - pos.yOffset * k;
    // la police est en y vers le haut, SVG en y vers le bas
    parts.push(g.path.scale(k, -k).translate(gx, gy).toSVG());
    pen += pos.xAdvance;
  });
  return parts.join('');
}
