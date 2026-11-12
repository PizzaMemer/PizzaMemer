/**
 * Carte PDF A4 — générée au build à partir de src/config (pizzas + commerce).
 * Rien n'est écrit en dur ici : prix, jours, zones, remises, coordonnées viennent de la config.
 */
import PDFDocument from 'pdfkit';
import { commerce } from '../../config/commerce';
import { pizzasVisibles } from '../catalogue';
import { rs } from '../format';
import type { Pizza } from '../types';
import { enregistrerPolices } from './polices';
import { MARGE_MODULES, qrMatrice, urlCarte } from './qr';

const TOMATE = '#c5301c';
const FOUR = '#221611';
const ENCRE = '#2a1d16';
const DOUCE = '#6d5c50';
const GRIS = '#8a7d73';
const CREME = '#f6eede';
const TRAIT = '#c9b99c';

const LARGEUR = 595.28;
const HAUTEUR = 841.89;
const MARGE = 44;
const UTILE = LARGEUR - 2 * MARGE;
const BAS = HAUTEUR - 36;

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function enumeration(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
}
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Lignes du bloc pratique, déduites uniquement de la config. */
export function lignesPratiques(): { titre: string; texte: string }[] {
  const lignes: { titre: string; texte: string }[] = [];
  const { distribution, retrait, livraison, sousVide, remises } = commerce;

  const jours = [...distribution.jours].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((j) => JOURS[j]);
  if (jours.length) lignes.push({ titre: 'Distribution', texte: majuscule(enumeration(jours)) });

  if (retrait.actif && commerce.adresseRetrait) {
    lignes.push({
      titre: 'Retrait',
      texte: commerce.adresseRetrait + (retrait.frais > 0 ? ` (${rs(retrait.frais)})` : ''),
    });
  }

  if (livraison.actif && livraison.zones.length) {
    const zones = livraison.zones
      .map((z) => `${z.nom} ${rs(z.frais ?? livraison.fraisStandard)}`)
      .join(' · ');
    lignes.push({ titre: 'Livraison', texte: zones });
    const seuils = new Map<number, string[]>();
    for (const z of livraison.zones) {
      if (z.gratuitDes != null) seuils.set(z.gratuitDes, [...(seuils.get(z.gratuitDes) ?? []), z.nom]);
    }
    for (const [seuil, noms] of seuils) {
      lignes.push({ titre: '', texte: `Livraison offerte dès ${rs(seuil)} de pizzas (${enumeration(noms)}).` });
    }
  }

  const q = remises.quantite;
  if (q.actif) lignes.push({ titre: 'Remise', texte: `${q.pourcentage} % de remise dès ${q.aPartirDe} pizzas.` });

  if (sousVide.actif) {
    lignes.push({
      titre: sousVide.libelle || 'Sous vide',
      texte: `+${rs(sousVide.prixParPizza)} par pizza${sousVide.aide ? ` — ${sousVide.aide}` : ''}`,
    });
  }

  if (commerce.whatsappAffiche) lignes.push({ titre: 'Commande sur WhatsApp', texte: commerce.whatsappAffiche });
  if (commerce.horaires) lignes.push({ titre: 'Horaires', texte: commerce.horaires });
  lignes.push({ titre: 'Carte en ligne', texte: commerce.urlSite.replace(/^https?:\/\//, '') });
  return lignes;
}

export function genererCartePdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, bottom: 0, left: MARGE, right: MARGE },
      autoFirstPage: false,
      info: {
        Title: `Carte ${commerce.nom}`,
        Author: commerce.nom,
        Subject: 'Pizzas napolitaines artisanales',
        Keywords: 'pizza, carte, Péreybère',
      },
      lang: 'fr-FR',
    } as PDFKit.PDFDocumentOptions);
    const morceaux: Buffer[] = [];
    doc.on('data', (c: Buffer) => morceaux.push(c));
    doc.on('end', () => resolve(Buffer.concat(morceaux)));
    doc.on('error', reject);
    enregistrerPolices(doc);

    let y = 0;
    let pageNum = 0;

    const nouvellePage = () => {
      doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: MARGE, right: MARGE } });
      pageNum++;
      doc.rect(0, 0, LARGEUR, HAUTEUR).fill(CREME);
      doc.rect(0, 0, LARGEUR, 10).fill(TOMATE);
      if (pageNum === 1) {
        enTete();
      } else {
        doc.font('titre700').fontSize(16);
        const w1 = doc.widthOfString('PIZZA');
        const w2 = doc.widthOfString(' MEMER');
        const x0 = MARGE;
        doc.fillColor(TOMATE).text('PIZZA', x0, 34, { lineBreak: false });
        doc.fillColor(FOUR).text(' MEMER', x0 + w1, 34, { lineBreak: false });
        doc.font('texte600').fontSize(11).fillColor(DOUCE).text('La carte (suite)', x0 + w1 + w2 + 12, 38, { lineBreak: false });
        y = 66;
      }
    };

    const enTete = () => {
      doc.font('titre700').fontSize(44);
      const w1 = doc.widthOfString('PIZZA');
      const w2 = doc.widthOfString(' MEMER');
      const x0 = (LARGEUR - w1 - w2) / 2;
      doc.fillColor(TOMATE).text('PIZZA', x0, 38, { lineBreak: false });
      doc.fillColor(FOUR).text(' MEMER', x0 + w1, 38, { lineBreak: false });
      doc.font('texte600').fontSize(12.5).fillColor(DOUCE);
      doc.text(`Pizzas napolitaines artisanales · ${commerce.lieu.split(',')[0]}`, MARGE, 92, {
        width: UTILE, align: 'center', lineBreak: false,
      });
      doc.lineWidth(1.4).strokeColor(FOUR).moveTo(MARGE, 114).lineTo(LARGEUR - MARGE, 114).stroke();
      doc.lineWidth(0.5).moveTo(MARGE, 118).lineTo(LARGEUR - MARGE, 118).stroke();
      y = 134;
    };

    const hauteurPizza = (p: Pizza): number => {
      let h = 21;
      doc.font('texte400').fontSize(11);
      const ing = p.ingredients.join(' · ');
      if (ing) h += doc.heightOfString(ing, { width: UTILE - 70 }) + 1;
      if (p.infos.length) h += 14;
      if (!p.disponible) h += 14;
      return h + 12;
    };

    const dessinerPizza = (p: Pizza) => {
      const indispo = !p.disponible;
      const couleurNom = indispo ? GRIS : FOUR;
      doc.font('titre600').fontSize(15.5).fillColor(couleurNom);
      const prix = rs(p.prix);
      doc.font('texte700').fontSize(14);
      const wPrix = doc.widthOfString(prix);
      doc.font('titre600').fontSize(15.5);
      const wNom = doc.widthOfString(p.nom);
      doc.text(p.nom, MARGE, y, { lineBreak: false });
      let finNom = MARGE + wNom;
      if (p.badge) {
        const lib = p.badge === 'nouveau' ? 'Nouveau' : 'Temporaire';
        doc.font('texte700').fontSize(9.5);
        const w = doc.widthOfString(lib) + 12;
        doc.roundedRect(finNom + 8, y + 1.5, w, 15, 7.5).fill(FOUR);
        doc.fillColor('#ffffff').text(lib, finNom + 14, y + 4.5, { lineBreak: false });
        finNom += 8 + w;
      }
      doc.font('texte700').fontSize(14).fillColor(couleurNom).text(prix, LARGEUR - MARGE - wPrix, y + 1, { lineBreak: false });
      // filet pointillé entre le nom et le prix
      const yf = y + 13.5;
      doc.save().lineWidth(0.9).strokeColor(TRAIT).dash(0.9, { space: 3 })
        .moveTo(finNom + 8, yf).lineTo(LARGEUR - MARGE - wPrix - 8, yf).stroke().undash().restore();
      let yy = y + 21;
      const ing = p.ingredients.join(' · ');
      if (ing) {
        doc.font('texte400').fontSize(11).fillColor(DOUCE);
        doc.text(ing, MARGE, yy, { width: UTILE - 70 });
        yy += doc.heightOfString(ing, { width: UTILE - 70 }) + 1;
      }
      if (p.infos.length) {
        doc.font('texte600').fontSize(11).fillColor(ENCRE).text(p.infos.join(' · '), MARGE, yy, { width: UTILE - 70, lineBreak: false });
        yy += 14;
      }
      if (indispo) {
        doc.font('texte600').fontSize(11).fillColor(TOMATE).text('Indisponible actuellement', MARGE, yy, { lineBreak: false });
        yy += 14;
      }
      y = yy + 12;
    };

    // ── Contenu ──
    nouvellePage();
    for (const p of pizzasVisibles()) {
      if (y + hauteurPizza(p) > BAS) nouvellePage();
      dessinerPizza(p);
    }

    // Bloc pratique + QR
    const lignes = lignesPratiques();
    const QR_PT = 84; // zone de silence comprise
    const largeurTexteBloc = UTILE - QR_PT - 20;
    const mesure = (): number => {
      let h = 0;
      for (const l of lignes) {
        doc.font('texte400').fontSize(11);
        h += doc.heightOfString(l.titre ? `${l.titre} : ${l.texte}` : l.texte, { width: largeurTexteBloc }) + 4;
      }
      return h;
    };
    const hBloc = Math.max(mesure(), QR_PT) + 30 + 18;
    if (y + hBloc > BAS) nouvellePage();
    y += 2;
    doc.lineWidth(1.4).strokeColor(FOUR).moveTo(MARGE, y).lineTo(LARGEUR - MARGE, y).stroke();
    y += 14;
    const yDebutBloc = y;
    for (const l of lignes) {
      const hLigne = (() => {
        doc.font('texte400').fontSize(11);
        return doc.heightOfString(l.titre ? `${l.titre} : ${l.texte}` : l.texte, { width: largeurTexteBloc });
      })();
      if (l.titre) {
        doc.font('texte700').fontSize(11).fillColor(FOUR).text(`${l.titre} : `, MARGE, y, { width: largeurTexteBloc, continued: true });
        doc.font('texte400').fillColor(ENCRE).text(l.texte);
      } else {
        doc.font('texte400').fontSize(11).fillColor(ENCRE).text(l.texte, MARGE, y, { width: largeurTexteBloc });
      }
      y += hLigne + 4;
    }

    // QR (zone de silence blanche, modules noirs purs)
    const m = qrMatrice(urlCarte());
    const mod = QR_PT / (m.n + 2 * MARGE_MODULES);
    const qx = LARGEUR - MARGE - QR_PT;
    const qy = yDebutBloc;
    doc.rect(qx, qy, QR_PT, QR_PT).fill('#ffffff');
    for (let r = 0; r < m.n; r++) for (let c = 0; c < m.n; c++) {
      if (m.sombre(c, r)) doc.rect(qx + (c + MARGE_MODULES) * mod, qy + (r + MARGE_MODULES) * mod, mod + 0.02, mod + 0.02).fill('#000000');
    }
    doc.font('texte600').fontSize(9.5).fillColor(DOUCE).text('Scannez pour la carte en ligne', qx - 6, qy + QR_PT + 3, { width: QR_PT + 12, align: 'center' });
    y = Math.max(y, qy + QR_PT + 26);

    if (commerce.mentionStock) {
      doc.font('texte600').fontSize(11).fillColor(DOUCE).text(commerce.mentionStock, MARGE, y + 2, { width: UTILE, align: 'left' });
    }
    doc.end();
  });
}
