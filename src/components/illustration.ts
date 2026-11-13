/**
 * Visuel graphique d'une pizza : un disque vu du dessus, réduit à des formes plates
 * (aplats, anneaux, demi-lunes, pastilles, lamelles, trames). Jamais une photo, jamais un dessin figuratif.
 * Déterministe : même id + même base + mêmes ingrédients = même disque (graine = hash de l'id).
 * Chaque famille d'ingrédient (reconnue par mot-clé) a sa forme et sa couleur ; un ingrédient inconnu est ignoré.
 */
import type { Pizza } from '../lib/types';

type Alea = () => number;
const f = (n: number): string => String(Math.round(n * 10) / 10);

export function hachage(texte: string): number {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function alea(graine: number): Alea {
  let a = graine;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Palette du disque (identique aux jetons de tokens.css). */
export const C = {
  rouge: '#cc281a',
  rougeFonce: '#8f1a10',
  creme: '#f7efdc',
  blanc: '#fffaf0',
  noir: '#14110f',
  vert: '#1f7a3a',
  jaune: '#f4b92a',
  ocre: '#e39a2d',
  ocreFonce: '#b86f14',
  brun: '#8a5a3b',
  rose: '#f2a79b',
  chorizo: '#6e1510',
  sauceBlanche: '#f3e2b3',
  thon: '#e7b48d',
} as const;

/** Couleurs de fond des cartes (le disque ressort sur chacune). */
export const FONDS = [C.vert, C.noir, C.jaune, C.creme] as const;

const normaliser = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export interface Familles {
  mozzarella: boolean;
  cheddar: boolean;
  jambon: boolean;
  champignons: boolean;
  oignon: boolean;
  thon: boolean;
  chorizo: boolean;
  boeuf: boolean;
  chevre: boolean;
  basilic: boolean;
  miel: boolean;
  moutarde: boolean;
  huile: boolean;
}

export function familles(ingredients: string[]): Familles {
  const t = ingredients.map(normaliser).join(' | ');
  return {
    mozzarella: /mozzarella|mozza/.test(t),
    cheddar: /cheddar/.test(t),
    jambon: /jambon/.test(t),
    champignons: /champignon/.test(t),
    oignon: /oignon/.test(t),
    thon: /thon/.test(t),
    chorizo: /chorizo/.test(t),
    boeuf: /boeuf|viande|hache/.test(t),
    chevre: /chevre/.test(t),
    basilic: /basilic/.test(t),
    miel: /miel/.test(t),
    moutarde: /moutarde/.test(t),
    huile: /huile/.test(t),
  };
}

type Forme = (x: number, y: number, ang: number, tomate: boolean) => string;
const place = (x: number, y: number, ang: number, contenu: string): string =>
  `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})">${contenu}</g>`;

/** Formes d'une famille « petite » : dessinées autour de (0,0), axe y = vers le centre du disque. */
const FORMES: Record<string, Forme> = {
  champignons: (x, y, a, t) =>
    place(x, y, a, `<path d="M-8 3A8 8 0 0 1 8 3Z M-2.4 3h4.8v6h-4.8z" fill="${t ? C.creme : C.brun}"/>`),
  jambon: (x, y, a) => place(x, y, a, `<rect x="-11" y="-4" width="22" height="8" rx="4" fill="${C.rose}"/>`),
  thon: (x, y, a) => place(x, y, a, `<rect x="-6.5" y="-6" width="13" height="4.4" rx="2.2" fill="${C.thon}"/><rect x="-6.5" y="1.6" width="13" height="4.4" rx="2.2" fill="${C.thon}"/>`),
  chorizo: (x, y, a) => place(x, y, a, `<circle r="7" fill="${C.chorizo}" stroke="${C.ocre}" stroke-width="1.3"/><circle r="1.6" fill="${C.ocre}"/>`),
  boeuf: (x, y, a) => place(x, y, a, `<circle cx="-3.4" cy="2" r="2.6" fill="#3d2217"/><circle cx="3.4" cy="2" r="2.6" fill="#3d2217"/><circle cy="-3.6" r="2.6" fill="#3d2217"/>`),
  oignon: (x, y, a, t) => place(x, y, a, `<path d="M-8 3A8 8 0 0 1 8 3M-4.4 3A4.4 4.4 0 0 1 4.4 3" fill="none" stroke="${t ? C.creme : C.noir}" stroke-width="1.8" stroke-linecap="round"/>`),
  chevre: (x, y, a) => place(x, y, a, `<circle r="7.2" fill="${C.blanc}" stroke="${C.ocre}" stroke-width="1.4"/><circle r="2.6" fill="${C.ocre}"/>`),
  basilic: (x, y, a) => place(x, y, a, `<path d="M0-10C7-5 7 5 0 10C-7 5-7-5 0-10Z" fill="${C.vert}"/><path d="M0-7V7" stroke="${C.creme}" stroke-width="1.1" stroke-linecap="round"/>`),
};
const ORDRE = ['champignons', 'jambon', 'thon', 'chorizo', 'boeuf', 'oignon', 'chevre', 'basilic'] as const;

export function dessinerPizza(pizza: Pick<Pizza, 'id' | 'base' | 'ingredients'>): string {
  const a = alea(hachage(pizza.id));
  const k = familles(pizza.ingredients);
  const t = pizza.base === 'tomate';
  const decalage = a() * 360;
  const o: string[] = [];
  const pol = (r: number, ang: number): [number, number] => [100 + r * Math.cos((ang * Math.PI) / 180), 100 + r * Math.sin((ang * Math.PI) / 180)];

  // Croûte : disque ocre cerclé de noir, perles régulières
  const perles = 54 + (hachage(pizza.id) % 4) * 6;
  const pas = (2 * Math.PI * 87) / perles;
  o.push(`<circle cx="100" cy="100" r="98.5" fill="${C.noir}"/><circle cx="100" cy="100" r="95.5" fill="${C.ocre}"/>`);
  o.push(`<circle cx="100" cy="100" r="87" fill="none" stroke="${C.ocreFonce}" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="0.01 ${f(pas - 0.01)}" transform="rotate(${f(decalage)} 100 100)"/>`);
  // Sauce : aplat plein
  o.push(`<circle cx="100" cy="100" r="78" fill="${t ? C.rouge : C.sauceBlanche}"/>`);
  o.push(`<circle cx="100" cy="100" r="72.5" fill="none" stroke="${t ? C.rougeFonce : C.ocre}" stroke-width="1.3"${t ? '' : ' stroke-dasharray="2 4.2" stroke-linecap="round"'}/>`);

  // Cheddar : secteurs jaunes
  if (k.cheddar) {
    const n = 3;
    for (let i = 0; i < n; i++) {
      const a0 = decalage + i * (360 / n) + 6;
      const a1 = a0 + 360 / n - 22;
      const [x0, y0] = pol(73, a0);
      const [x1, y1] = pol(73, a1);
      o.push(`<path d="M100 100L${f(x0)} ${f(y0)}A73 73 0 0 1 ${f(x1)} ${f(y1)}Z" fill="${C.jaune}"/>`);
    }
  }

  // Mozzarella : grands cercles clairs en couronne
  const rOut = k.mozzarella ? 66 : 57;
  if (k.mozzarella) {
    for (let i = 0; i < 6; i++) {
      const [x, y] = pol(45, decalage + i * 60);
      o.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${t ? 15 : 14.5}" fill="${t ? C.blanc : C.blanc}"${t ? '' : ` stroke="${C.ocre}" stroke-width="1.4"`}/>`);
    }
  }

  // Garnitures « petites » : couronne extérieure (alternance) + couronne intérieure
  const actives = ORDRE.filter((nom) => k[nom as keyof Familles]);
  if (actives.length) {
    const n = actives.length === 1 ? 6 : 12;
    for (let i = 0; i < n; i++) {
      const ang = decalage + 30 + i * (360 / n);
      const nom = actives[i % Math.min(actives.length, 3)];
      const [x, y] = pol(rOut, ang);
      o.push(FORMES[nom](x, y, ang - 90, t));
    }
    const interieur = actives.length > 1 ? actives[1] : actives[0];
    const ni = actives.length > 1 ? 5 : 4;
    for (let i = 0; i < ni; i++) {
      const ang = decalage + 15 + i * (360 / ni);
      const [x, y] = pol(20, ang);
      o.push(FORMES[interieur](x, y, ang - 90, t));
    }
  }

  // Moutarde : pointillés ; huile : filet fin pointillé ; miel : filets ocres en spirale
  if (k.moutarde) {
    o.push(`<circle cx="100" cy="100" r="34" fill="none" stroke="#6b4a07" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.01 6.4"/>`);
    o.push(`<circle cx="100" cy="100" r="54" fill="none" stroke="#6b4a07" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.01 6.4"/>`);
  }
  if (k.huile) o.push(`<circle cx="100" cy="100" r="76" fill="none" stroke="${C.jaune}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="14 6"/>`);
  if (k.miel) {
    let d = '';
    for (let th = 0; th <= Math.PI * 6.2; th += 0.12) {
      const r = 4 + th * 3.1;
      const [x, y] = pol(r, (th * 180) / Math.PI + decalage);
      d += (d ? 'L' : 'M') + f(x) + ' ' + f(y);
    }
    o.push(`<path d="${d}" fill="none" stroke="#f29a0d" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="30 9"/>`);
  }

  return o.join('');
}

/** Disque de l'accueil : une composition « maison » qui réunit les familles du site (aucune pizza précise). */
export const DISQUE_MARQUE = {
  id: 'memer',
  base: 'tomate' as const,
  ingredients: ['Mozzarella', 'Champignons', 'Chorizo', 'Basilic', 'Miel'],
};
