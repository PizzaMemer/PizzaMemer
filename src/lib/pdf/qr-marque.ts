/**
 * QR code « aux couleurs du site » : modules arrondis brun-noir sur crème, repères avec cœur rouge
 * tomate, et le disque Pizza Memer au centre. Correction d'erreurs H (30 %) pour supporter le logo.
 * Sert à la chaîne WhatsApp ; le QR de la carte (boîtes) reste en noir et blanc purs, plus robuste.
 */
import QRCode from 'qrcode';
import sharp from 'sharp';
import { commerce } from '../../config/commerce';

const NOIR = '#14110f';
const CREME = '#fffaf0';
const ROUGE = '#cc281a';
const MARGE = 4;

/** Adresse encodée dans le QR de la chaîne ('' si la chaîne n'est pas configurée). */
export function urlChaine(): string {
  return commerce.chaineWhatsapp.trim();
}

export function qrMarqueSvg(texte: string, taille?: number): string {
  const qr = QRCode.create(texte, { errorCorrectionLevel: 'H' });
  const n = qr.modules.size;
  const data = qr.modules.data;
  const total = n + MARGE * 2;
  const c = total / 2;
  const rLogo = n * 0.125; // rayon du disque central
  const rVide = rLogo + 1.1; // zone dégagée autour du disque
  const dansRepere = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);

  let modules = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!data[y * n + x] || dansRepere(x, y)) continue;
      if (Math.hypot(x + 0.5 + MARGE - c, y + 0.5 + MARGE - c) < rVide) continue;
      modules += `<rect x="${x + MARGE}" y="${y + MARGE}" width="1" height="1" rx="0.26"/>`;
    }
  }
  const repere = (x: number, y: number) =>
    `<rect x="${x + MARGE}" y="${y + MARGE}" width="7" height="7" rx="2" fill="${NOIR}"/>` +
    `<rect x="${x + MARGE + 1}" y="${y + MARGE + 1}" width="5" height="5" rx="1.2" fill="${CREME}"/>` +
    `<rect x="${x + MARGE + 2}" y="${y + MARGE + 2}" width="3" height="3" rx="0.8" fill="${ROUGE}"/>`;

  // Disque de la marque (même dessin que le favicon), ramené au rayon rLogo.
  const s = rLogo / 25;
  const logo =
    `<circle cx="${c}" cy="${c}" r="${rVide - 0.25}" fill="${CREME}"/>` +
    `<g transform="translate(${c - 32 * s} ${c - 32 * s}) scale(${s})">` +
    `<circle cx="32" cy="32" r="25" fill="${NOIR}"/><circle cx="32" cy="32" r="22.5" fill="#e39a2d"/>` +
    `<circle cx="32" cy="32" r="17" fill="${ROUGE}"/><circle cx="25.5" cy="27" r="5.5" fill="${CREME}"/>` +
    `<circle cx="38.5" cy="35.5" r="5.5" fill="${CREME}"/><path d="M26 40c3-5 9-5 12-1-3 4-9 5-12 1z" fill="#1f7a3a"/></g>`;

  const dim = taille ? ` width="${taille}" height="${taille}"` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}"${dim}>` +
    `<rect width="${total}" height="${total}" rx="2.5" fill="${CREME}"/>` +
    `<g fill="${NOIR}">${modules}</g>` +
    repere(0, 0) + repere(n - 7, 0) + repere(0, n - 7) + logo +
    `</svg>`
  );
}

export async function qrMarquePng(texte: string, taillePx = 1200): Promise<Buffer> {
  return sharp(Buffer.from(qrMarqueSvg(texte, taillePx)), { density: 300 })
    .resize(taillePx, taillePx)
    .png({ compressionLevel: 9 })
    .toBuffer();
}
