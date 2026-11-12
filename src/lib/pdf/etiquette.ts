/**
 * Étiquette QR pour boîte à pizza : carré 60 × 60 mm.
 * Mise en page définie une seule fois (en millimètres) puis rendue en PNG (sharp, textes vectorisés
 * donc indépendants des polices du système) et en PDF (pdfkit, vectoriel).
 */
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { commerce } from '../../config/commerce';
import { cheminTexte, largeurTexte, type NomPolice } from './polices';
import { MARGE_MODULES, qrMatrice, urlCarte } from './qr';

export const COTE_MM = 60;
export const QR_MM = 34; // zone de silence comprise (minimum exigé : 32)
export const DPI_PNG = 300;
const TOMATE = '#c5301c';
const FOUR = '#221611';

export function adresseCourte(): string {
  return commerce.urlSite.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

interface Texte { police: NomPolice; tailleMm: number; couleur: string; morceaux: { t: string; couleur?: string }[]; yBase: number }

function textes(): Texte[] {
  return [
    {
      police: 'titre700', tailleMm: 6.4, couleur: FOUR, yBase: 9.4,
      morceaux: [{ t: 'PIZZA', couleur: TOMATE }, { t: ' MEMER', couleur: FOUR }],
    },
    { police: 'texte700', tailleMm: 3.5, couleur: FOUR, yBase: 49.6, morceaux: [{ t: 'Scannez-moi pour découvrir' }] },
    { police: 'texte700', tailleMm: 3.5, couleur: FOUR, yBase: 53.6, morceaux: [{ t: 'notre carte !' }] },
    { police: 'texte400', tailleMm: 2.4, couleur: '#4a3b32', yBase: 57.9, morceaux: [{ t: adresseCourte() }] },
  ];
}

/** Éléments à dessiner : chemins pleins (unités = mm, origine en haut à gauche de l'étiquette). */
function elements(): { d: string; couleur: string }[] {
  const out: { d: string; couleur: string }[] = [];
  for (const t of textes()) {
    const total = t.morceaux.reduce((s, m) => s + largeurTexte(t.police, m.t, t.tailleMm), 0);
    let x = (COTE_MM - total) / 2;
    for (const m of t.morceaux) {
      out.push({ d: cheminTexte(t.police, m.t, t.tailleMm, x, t.yBase), couleur: m.couleur ?? t.couleur });
      x += largeurTexte(t.police, m.t, t.tailleMm);
    }
  }
  // QR : modules noirs sur zone blanche de QR_MM, silence de 4 modules inclus
  const q = qrMatrice(urlCarte());
  const module = QR_MM / (q.n + MARGE_MODULES * 2);
  const x0 = (COTE_MM - QR_MM) / 2;
  const y0 = 11.6;
  let d = '';
  for (let y = 0; y < q.n; y++) {
    let x = 0;
    while (x < q.n) {
      if (!q.sombre(x, y)) { x++; continue; }
      const debut = x;
      while (x < q.n && q.sombre(x, y)) x++;
      const r = (v: number) => +v.toFixed(4);
      d += `M${r(x0 + (debut + MARGE_MODULES) * module)} ${r(y0 + (y + MARGE_MODULES) * module)}h${r((x - debut) * module)}v${r(module)}h${r(-(x - debut) * module)}z`;
    }
  }
  out.push({ d, couleur: '#000000' });
  return out;
}

export function etiquetteSvg(): string {
  const corps = elements().map((e) => `<path d="${e.d}" fill="${e.couleur}"/>`).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COTE_MM} ${COTE_MM}" width="${COTE_MM}mm" height="${COTE_MM}mm">` +
    `<rect width="${COTE_MM}" height="${COTE_MM}" fill="#ffffff"/>${corps}</svg>`
  );
}

export async function genererEtiquettePng(): Promise<Buffer> {
  const px = Math.round((COTE_MM / 25.4) * DPI_PNG); // 709
  const svg = etiquetteSvg().replace(`width="${COTE_MM}mm" height="${COTE_MM}mm"`, `width="${px}" height="${px}"`);
  return sharp(Buffer.from(svg))
    .flatten({ background: '#ffffff' })
    .withMetadata({ density: DPI_PNG })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const MM = 72 / 25.4;

function dessiner(doc: PDFKit.PDFDocument, ox: number, oy: number): void {
  doc.save();
  doc.translate(ox * MM, oy * MM).scale(MM);
  doc.rect(0, 0, COTE_MM, COTE_MM).fill('#ffffff');
  for (const e of elements()) doc.path(e.d).fill(e.couleur);
  doc.restore();
}

/** Page 1 : planche A4 de 12 étiquettes (3 × 4) avec repères de coupe. Page 2 : une étiquette seule. */
export function genererEtiquettePdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `${commerce.nom} — étiquettes QR`,
        Author: commerce.nom,
        Subject: 'Étiquettes 60 × 60 mm à coller sur les boîtes',
        Keywords: 'QR code, carte',
      },
      lang: 'fr-FR',
    } as PDFKit.PDFDocumentOptions);
    const morceaux: Buffer[] = [];
    doc.on('data', (c: Buffer) => morceaux.push(c));
    doc.on('end', () => resolve(Buffer.concat(morceaux)));
    doc.on('error', reject);

    const colonnes = 3, lignes = 4;
    const gx = (210 - colonnes * COTE_MM) / 2;
    const gy = (297 - lignes * COTE_MM) / 2;
    for (let r = 0; r < lignes; r++) for (let c = 0; c < colonnes; c++) dessiner(doc, gx + c * COTE_MM, gy + r * COTE_MM);

    // repères de coupe : petits traits dans les marges, aux limites de chaque étiquette
    doc.lineWidth(0.3).strokeColor('#9a9a9a');
    const t = 4 * MM, ecart = 1 * MM;
    for (let c = 0; c <= colonnes; c++) {
      const x = (gx + c * COTE_MM) * MM;
      doc.moveTo(x, gy * MM - ecart).lineTo(x, gy * MM - ecart - t).stroke();
      doc.moveTo(x, (gy + lignes * COTE_MM) * MM + ecart).lineTo(x, (gy + lignes * COTE_MM) * MM + ecart + t).stroke();
    }
    for (let r = 0; r <= lignes; r++) {
      const y = (gy + r * COTE_MM) * MM;
      doc.moveTo(gx * MM - ecart, y).lineTo(gx * MM - ecart - t, y).stroke();
      doc.moveTo((gx + colonnes * COTE_MM) * MM + ecart, y).lineTo((gx + colonnes * COTE_MM) * MM + ecart + t, y).stroke();
    }

    doc.addPage({ size: [COTE_MM * MM, COTE_MM * MM], margin: 0 });
    dessiner(doc, 0, 0);
    doc.end();
  });
}
