/**
 * Illustration d'une pizza vue du dessus — dessin au trait monochrome (couleur héritée), jamais une photo.
 * Déterministe : la même pizza donne toujours le même dessin (graine = hash de l'id).
 * Seuls la base, l'id et les ingrédients (par mots-clés) comptent ; un ingrédient inconnu est ignoré.
 */
import type { Pizza } from '../lib/types';

type Pt = { x: number; y: number };
type Alea = () => number;

const f = (n: number): number => Math.round(n * 10) / 10;

function hachage(texte: string): number {
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

/** Courbe fermée lissée (Catmull-Rom → Bézier) passant par les points. */
function lisse(pts: Pt[]): string {
  const n = pts.length;
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d + 'Z';
}

/** Tache irrégulière centrée en (cx, cy), éventuellement allongée (ry) et tournée (rot en radians). */
function tache(cx: number, cy: number, rx: number, ry: number, rot: number, irr: number, n: number, a: Alea): string {
  const pts: Pt[] = [];
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n;
    const k = 1 - irr / 2 + a() * irr;
    const x = Math.cos(ang) * rx * k;
    const y = Math.sin(ang) * ry * k;
    pts.push({ x: cx + x * c - y * s, y: cy + x * s + y * c });
  }
  return lisse(pts);
}

/** Points répartis dans un disque, en évitant qu'ils se chevauchent trop. */
function semer(n: number, rMax: number, dmin: number, a: Alea): Pt[] {
  const res: Pt[] = [];
  for (let i = 0; i < n; i++) {
    let meilleur: Pt | null = null;
    let meilleureDist = -1;
    for (let essai = 0; essai < 24; essai++) {
      const r = rMax * Math.sqrt(a());
      const ang = a() * Math.PI * 2;
      const p = { x: 100 + r * Math.cos(ang), y: 100 + r * Math.sin(ang) };
      const d = res.reduce((m, q) => Math.min(m, Math.hypot(p.x - q.x, p.y - q.y)), 999);
      if (d > meilleureDist) {
        meilleureDist = d;
        meilleur = p;
      }
      if (d >= dmin) break;
    }
    if (meilleur) res.push(meilleur);
  }
  return res;
}

const normaliser = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export interface MotsCles {
  mozzarella: boolean;
  jambon: boolean;
  champignons: boolean;
  oignon: boolean;
  thon: boolean;
  cheddar: boolean;
  viande: boolean;
  moutarde: boolean;
}

export function motsCles(ingredients: string[]): MotsCles {
  const t = ingredients.map(normaliser).join(' | ');
  return {
    mozzarella: /mozzarella|mozza/.test(t),
    jambon: /jambon/.test(t),
    champignons: /champignon/.test(t),
    oignon: /oignon/.test(t),
    thon: /thon/.test(t),
    cheddar: /cheddar/.test(t),
    viande: /viande|boeuf|hache/.test(t),
    moutarde: /moutarde/.test(t),
  };
}

export function dessinerPizza(pizza: Pick<Pizza, 'id' | 'base' | 'ingredients'>): string {
  const a = alea(hachage(pizza.id));
  const k = motsCles(pizza.ingredients);
  const tomate = pizza.base === 'tomate';
  const o: string[] = [];

  // Corniche : double contour irrégulier
  const corniche = (r0: number, amp: number): string => {
    const pts: Pt[] = [];
    for (let i = 0; i < 28; i++) {
      const ang = (Math.PI * 2 * i) / 28;
      const r = r0 + (a() - 0.5) * amp;
      pts.push({ x: 100 + r * Math.cos(ang), y: 100 + r * Math.sin(ang) });
    }
    return lisse(pts);
  };
  o.push(`<path d="${corniche(95, 3.5)}" stroke-width="1.4"/>`);
  o.push(`<path d="${corniche(80, 2.5)}"${tomate ? '' : ' stroke-dasharray="1 3.2"'}/>`);
  // Quelques alvéoles sur la corniche
  for (let i = 0; i < 10; i++) {
    const ang = a() * Math.PI * 2;
    const r = 87.5;
    o.push(`<path d="${tache(100 + r * Math.cos(ang), 100 + r * Math.sin(ang), 1.8 + a() * 1.6, 1.2 + a() * 1.2, a() * 3, 0.5, 6, a)}" stroke-width=".9"/>`);
  }
  if (tomate) {
    // Sauce : hachures légères
    for (let y = -56; y <= 56; y += 9) {
      const demi = Math.sqrt(Math.max(0, 74 * 74 - y * y));
      o.push(`<path d="M${f(100 - demi)} ${f(100 + y)}L${f(100 + demi)} ${f(100 + y)}" stroke-width=".5" opacity=".35"/>`);
    }
  }

  let couches = 0;
  const dessinerMozza = (): void => {
    for (const p of semer(10, 62, 22, a)) {
      const rx = 9 + a() * 6;
      o.push(`<path d="${tache(p.x, p.y, rx, rx * (0.7 + a() * 0.3), a() * 3, 0.45, 8, a)}" fill="var(--papier)"/>`);
    }
  };
  if (k.mozzarella || pizza.ingredients.length === 0) {
    dessinerMozza();
    couches++;
  }
  if (k.cheddar) {
    for (const p of semer(7, 60, 24, a)) {
      const rx = 11 + a() * 7;
      o.push(`<path d="${tache(p.x, p.y, rx, rx * (0.7 + a() * 0.3), a() * 3, 0.5, 8, a)}" fill="var(--papier)"/>`);
    }
    couches++;
  }
  if (k.jambon) {
    for (const p of semer(7, 60, 24, a)) {
      const deg = f(a() * 180);
      o.push(`<g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${deg})" fill="var(--papier)"><path d="${tache(0, 0, 12, 6.5, 0, 0.25, 8, a)}"/></g>`);
    }
    couches++;
  }
  if (k.champignons) {
    for (const p of semer(7, 60, 22, a)) {
      const deg = f(a() * 360);
      o.push(`<g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${deg})" fill="var(--papier)"><path d="M-8.5 1C-8.5-8.5 8.5-8.5 8.5 1L3.2 1L3.2 8.5C3.2 9.5-3.2 9.5-3.2 8.5L-3.2 1Z"/></g>`);
    }
    couches++;
  }
  if (k.thon) {
    for (const p of semer(14, 62, 14, a)) {
      const rx = 3.6 + a() * 3.4;
      o.push(`<path d="${tache(p.x, p.y, rx, rx * 0.75, a() * 3, 0.55, 6, a)}" stroke-width=".9"/>`);
    }
    couches++;
  }
  if (k.viande) {
    for (const p of semer(30, 62, 7, a)) o.push(`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(1.2 + a() * 1)}" stroke-width=".9"/>`);
    couches++;
  }
  if (k.oignon) {
    for (const p of semer(9, 60, 18, a)) {
      const r = 5 + a() * 3.5;
      const a0 = a() * Math.PI * 2;
      const span = 1.7 + a() * 1.6;
      const xa = p.x + r * Math.cos(a0);
      const ya = p.y + r * Math.sin(a0);
      const xb = p.x + r * Math.cos(a0 + span);
      const yb = p.y + r * Math.sin(a0 + span);
      o.push(`<path d="M${f(xa)} ${f(ya)}A${f(r)} ${f(r)} 0 ${span > Math.PI ? 1 : 0} 1 ${f(xb)} ${f(yb)}" stroke-width="1.3"/>`);
    }
    couches++;
  }
  if (k.moutarde) {
    for (let i = 0; i < 3; i++) {
      const dec = (i - 1) * 24;
      const demi = Math.sqrt(Math.max(0, 62 * 62 - dec * dec));
      let d = '';
      for (let t = -demi, j = 0; t <= demi; t += 9, j++) d += (j === 0 ? 'M' : 'L') + f(100 + t) + ' ' + f(100 + dec + (j % 2 ? 3.5 : -3.5));
      o.push(`<path d="${d}" stroke-width="1"/>`);
    }
    couches++;
  }
  if (couches === 0) dessinerMozza();

  // Basilic : uniquement sur la Margherita
  if (pizza.id === 'margherita') {
    for (const p of semer(5, 52, 28, a)) {
      const deg = f(a() * 360);
      o.push(`<g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${deg}) scale(1.15)"><path d="M0-9C7-6 7 6 0 9C-7 6-7-6 0-9Z" fill="var(--papier)"/><path d="M0-7L0 7" stroke-width=".8"/></g>`);
    }
  }

  return o.join('');
}
