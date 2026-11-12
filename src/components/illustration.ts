/**
 * Illustration vectorielle d'une pizza vue du dessus — dessin à plat, jamais une photo.
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

  // Corniche dorée irrégulière
  const cornichePts: Pt[] = [];
  for (let i = 0; i < 28; i++) {
    const ang = (Math.PI * 2 * i) / 28;
    const r = 95 + (a() - 0.5) * 4.5;
    cornichePts.push({ x: 100 + r * Math.cos(ang), y: 100 + r * Math.sin(ang) });
  }
  o.push(`<path d="${lisse(cornichePts)}" fill="#d99a43"/>`);
  o.push('<circle cx="100" cy="100" r="89" fill="none" stroke="#e9b766" stroke-width="7" opacity=".75"/>');
  // Taches « léopard » : zones brûlées et zones claires
  for (let i = 0; i < 12; i++) {
    const ang = a() * Math.PI * 2;
    const r = 82 + a() * 11;
    o.push(`<path d="${tache(100 + r * Math.cos(ang), 100 + r * Math.sin(ang), 4 + a() * 4, 2.5 + a() * 2.5, a() * 3, 0.5, 6, a)}" fill="#f4cd83" opacity=".8"/>`);
  }
  for (let i = 0; i < 26; i++) {
    const ang = a() * Math.PI * 2;
    const r = 82 + a() * 12;
    o.push(`<path d="${tache(100 + r * Math.cos(ang), 100 + r * Math.sin(ang), 1.6 + a() * 2.6, 1.2 + a() * 1.8, a() * 3, 0.6, 6, a)}" fill="#7d3d1b" opacity=".85"/>`);
  }

  // Fond de sauce
  const saucePts: Pt[] = [];
  for (let i = 0; i < 24; i++) {
    const ang = (Math.PI * 2 * i) / 24;
    const r = 79 + (a() - 0.5) * 3;
    saucePts.push({ x: 100 + r * Math.cos(ang), y: 100 + r * Math.sin(ang) });
  }
  o.push(`<path d="${lisse(saucePts)}" fill="${tomate ? '#cc3a26' : '#f3e4bf'}" stroke="${tomate ? '#a82a1a' : '#d9c18c'}" stroke-width="1.4"/>`);
  for (const p of semer(6, 60, 26, a)) {
    o.push(`<path d="${tache(p.x, p.y, 14 + a() * 10, 8 + a() * 6, a() * 3, 0.5, 7, a)}" fill="${tomate ? '#de5436' : '#ead6a6'}" opacity=".7"/>`);
  }

  let couches = 0;

  // Mozzarella (ou fromage seul quand la composition est vide)
  const mozza = k.mozzarella || pizza.ingredients.length === 0;
  const dessinerMozza = (): void => {
    for (const p of semer(11, 66, 22, a)) {
      const rx = 9 + a() * 6;
      const ry = rx * (0.7 + a() * 0.3);
      const rot = a() * 3;
      const d = tache(p.x, p.y, rx, ry, rot, 0.45, 8, a);
      o.push(`<path d="${d}" transform="translate(.8 1.4)" fill="#7a3a1a" opacity=".18"/>`);
      o.push(`<path d="${d}" fill="${tomate ? '#fff5de' : '#fffaf0'}"/>`);
    }
  };
  if (mozza) {
    dessinerMozza();
    couches++;
  }

  if (k.cheddar) {
    for (const p of semer(7, 62, 24, a)) {
      const rx = 11 + a() * 7;
      const d = tache(p.x, p.y, rx, rx * (0.7 + a() * 0.3), a() * 3, 0.5, 8, a);
      o.push(`<path d="${d}" transform="translate(.8 1.4)" fill="#7a3a1a" opacity=".2"/>`);
      o.push(`<path d="${d}" fill="#e8962c"/>`);
      o.push(`<path d="${tache(p.x - 2, p.y - 2, rx * 0.5, rx * 0.35, a() * 3, 0.4, 6, a)}" fill="#f6bf5c"/>`);
    }
    couches++;
  }

  if (k.jambon) {
    for (const p of semer(7, 62, 24, a)) {
      const rot = a() * Math.PI;
      const deg = f((rot * 180) / Math.PI);
      o.push(
        `<g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${deg})">` +
          `<path d="${tache(0, 0, 12, 6.5, 0, 0.25, 8, a)}" fill="#eaa5a1" stroke="#cf7f7e" stroke-width="1"/>` +
          `<path d="M-7 -1.5 Q0 2.5 7 -1.5" fill="none" stroke="#f6c9c4" stroke-width="1.4" stroke-linecap="round"/></g>`,
      );
    }
    couches++;
  }

  if (k.champignons) {
    for (const p of semer(7, 62, 22, a)) {
      const deg = f(a() * 360);
      o.push(
        `<g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${deg})">` +
          `<path d="M-8.5 1 C-8.5 -8.5 8.5 -8.5 8.5 1 L3.2 1 L3.2 8.5 C3.2 9.5 -3.2 9.5 -3.2 8.5 L-3.2 1Z" fill="#e7d3ae" stroke="#b08f5f" stroke-width="1" stroke-linejoin="round"/>` +
          `<path d="M-5 -2.5 Q0 -5.5 5 -2.5" fill="none" stroke="#f6ead0" stroke-width="1.2" stroke-linecap="round"/></g>`,
      );
    }
    couches++;
  }

  if (k.thon) {
    for (const p of semer(14, 64, 14, a)) {
      const rx = 3.6 + a() * 3.4;
      o.push(`<path d="${tache(p.x, p.y, rx, rx * 0.75, a() * 3, 0.55, 6, a)}" fill="#dbb8a0" stroke="#c39a80" stroke-width=".8"/>`);
    }
    couches++;
  }

  if (k.viande) {
    for (const p of semer(34, 66, 7, a)) {
      const r = 1.8 + a() * 1.2;
      o.push(`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(r)}" fill="${a() > 0.4 ? '#69391f' : '#8a5230'}"/>`);
    }
    couches++;
  }

  if (k.oignon) {
    for (const p of semer(9, 62, 18, a)) {
      const r = 5 + a() * 3.5;
      const a0 = a() * Math.PI * 2;
      const span = 1.7 + a() * 1.6;
      const arc = (rr: number): string => {
        const xa = p.x + rr * Math.cos(a0);
        const ya = p.y + rr * Math.sin(a0);
        const xb = p.x + rr * Math.cos(a0 + span);
        const yb = p.y + rr * Math.sin(a0 + span);
        return `M${f(xa)} ${f(ya)}A${f(rr)} ${f(rr)} 0 ${span > Math.PI ? 1 : 0} 1 ${f(xb)} ${f(yb)}`;
      };
      o.push(`<path d="${arc(r)}" fill="none" stroke="#8f3b80" stroke-width="2.4" stroke-linecap="round"/>`);
      o.push(`<path d="${arc(r - 2.6)}" fill="none" stroke="#cf86bf" stroke-width="1" stroke-linecap="round"/>`);
    }
    couches++;
  }

  if (k.moutarde) {
    for (let i = 0; i < 4; i++) {
      const ang = a() * Math.PI;
      const dx = Math.cos(ang);
      const dy = Math.sin(ang);
      const decal = (i - 1.5) * 22 + (a() - 0.5) * 8;
      const nx = -dy;
      const ny = dx;
      const demi = Math.sqrt(Math.max(0, 66 * 66 - decal * decal));
      let d = '';
      const pas = 9;
      for (let t = -demi, j = 0; t <= demi; t += pas, j++) {
        const x = 100 + nx * decal + dx * t + nx * (j % 2 ? 4 : -4);
        const y = 100 + ny * decal + dy * t + ny * (j % 2 ? 4 : -4);
        d += (j === 0 ? 'M' : 'L') + f(x) + ' ' + f(y);
      }
      o.push(`<path d="${d}" fill="none" stroke="#e7b91c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/>`);
    }
    couches++;
  }

  // Aucun ingrédient reconnu : pizza nature avec fromage
  if (couches === 0) dessinerMozza();

  // Basilic : uniquement sur la Margherita
  if (pizza.id === 'margherita') {
    for (const p of semer(5, 54, 28, a)) {
      const deg = f(a() * 360);
      o.push(
        `<g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${deg}) scale(1.15)">` +
          `<path d="M0 -9 C7 -6 7 6 0 9 C-7 6 -7 -6 0 -9Z" fill="#3f8c3e" stroke="#2b6a2d" stroke-width=".8"/>` +
          `<path d="M0 -7 L0 7" stroke="#8cc77f" stroke-width="1" stroke-linecap="round"/></g>`,
      );
    }
  }

  return o.join('');
}
