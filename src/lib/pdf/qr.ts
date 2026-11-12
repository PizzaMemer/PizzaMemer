/**
 * QR code de la carte. Adresse unique : <urlSite>/carte/ (ne jamais la changer après impression).
 * Correction d'erreurs M, zone de silence de 4 modules, modules noirs purs sur blanc pur.
 */
import QRCode from 'qrcode';
import sharp from 'sharp';
import { commerce } from '../../config/commerce';

export const MARGE_MODULES = 4;
export const NIVEAU_CORRECTION = 'M' as const;

/** Adresse de la carte en ligne, barres obliques normalisées, avec "/" final. */
export function urlCarte(): string {
  const base = commerce.urlSite.trim().replace(/\/+$/, '');
  return `${base}/carte/`;
}

export interface MatriceQr {
  /** Nombre de modules d'un côté, SANS zone de silence. */
  n: number;
  /** sombre(x, y) : vrai si le module est noir. */
  sombre: (x: number, y: number) => boolean;
}

export function qrMatrice(texte: string): MatriceQr {
  const qr = QRCode.create(texte, { errorCorrectionLevel: NIVEAU_CORRECTION });
  const n = qr.modules.size;
  const data = qr.modules.data;
  return { n, sombre: (x, y) => x >= 0 && y >= 0 && x < n && y < n && !!data[y * n + x] };
}

export interface OptionsQrSvg {
  /** Taille affichée en px (attribut width/height) ; sinon le SVG s'adapte à son conteneur. */
  taille?: number;
  marge?: number;
}

export function qrSvg(texte: string, options: OptionsQrSvg = {}): string {
  const marge = options.marge ?? MARGE_MODULES;
  const m = qrMatrice(texte);
  const total = m.n + marge * 2;
  let d = '';
  for (let y = 0; y < m.n; y++) {
    let x = 0;
    while (x < m.n) {
      if (!m.sombre(x, y)) { x++; continue; }
      const debut = x;
      while (x < m.n && m.sombre(x, y)) x++;
      d += `M${debut + marge} ${y + marge}h${x - debut}v1h-${x - debut}z`;
    }
  }
  const dim = options.taille ? ` width="${options.taille}" height="${options.taille}"` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}"${dim} shape-rendering="crispEdges">` +
    `<title>QR code : ${texte.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>` +
    `<rect width="${total}" height="${total}" fill="#ffffff"/><path d="${d}" fill="#000000"/></svg>`
  );
}

/** PNG de côté exactement `taillePx` (zone de silence comprise), en noir et blanc purs, bords nets. */
export async function qrPng(texte: string, taillePx = 1200, marge = MARGE_MODULES): Promise<Buffer> {
  const m = qrMatrice(texte);
  const total = m.n + marge * 2;
  const echelle = Math.max(1, Math.floor(taillePx / total));
  const brut = total * echelle;
  const px = Buffer.alloc(brut * brut, 255);
  for (let y = 0; y < m.n; y++) {
    for (let x = 0; x < m.n; x++) {
      if (!m.sombre(x, y)) continue;
      for (let dy = 0; dy < echelle; dy++) {
        const ligne = ((y + marge) * echelle + dy) * brut + (x + marge) * echelle;
        px.fill(0, ligne, ligne + echelle);
      }
    }
  }
  let img = sharp(px, { raw: { width: brut, height: brut, channels: 1 } });
  if (brut !== taillePx) {
    // recadrage par un fond blanc : on garde des modules de taille entière (pas de flou)
    img = img.extend({
      top: Math.floor((taillePx - brut) / 2),
      bottom: Math.ceil((taillePx - brut) / 2),
      left: Math.floor((taillePx - brut) / 2),
      right: Math.ceil((taillePx - brut) / 2),
      background: '#ffffff',
    });
  }
  return img.png({ compressionLevel: 9 }).toBuffer();
}
