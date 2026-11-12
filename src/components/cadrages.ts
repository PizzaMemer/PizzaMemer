/**
 * Table de cadrage des photos (interface uniquement, pas de donnée commerciale).
 * Clé : nom de fichier. x / y : point d'ancrage du recadrage en % (object-position, aussi origine du zoom).
 * zoom : agrandissement léger pour resserrer une pizza prise de loin (1 = aucun).
 */
export interface Cadrage {
  x: number;
  y: number;
  zoom: number;
}

const PAR_DEFAUT: Cadrage = { x: 50, y: 50, zoom: 1 };

const table: Record<string, Cadrage> = {
  // Pizzas (cadre 4:5)
  'burger.jpg': { x: 52, y: 50, zoom: 1.08 },
  'chevre-miel.jpg': { x: 50, y: 55, zoom: 1.04 },
  'chorizo.jpg': { x: 50, y: 58, zoom: 1 },
  'forestiere.jpg': { x: 50, y: 100, zoom: 1.12 },
  'signature-blanche.jpg': { x: 56, y: 100, zoom: 1.12 },
  'thon.jpg': { x: 50, y: 100, zoom: 1.12 },
  'welsh.jpg': { x: 50, y: 62, zoom: 1 },
  // Ambiance
  'paton.jpg': { x: 72, y: 50, zoom: 1 },
  'sortie-du-four.jpg': { x: 50, y: 60, zoom: 1 },
  'four.jpg': { x: 50, y: 55, zoom: 1 },
  'signature-blanche-table.jpg': { x: 50, y: 70, zoom: 1 },
};

export function cadrage(nom: string): Cadrage {
  return table[nom] ?? PAR_DEFAUT;
}

/** Pizza du grand format de l'accueil (si src/assets/brand/hero.* n'existe pas). */
export const PHOTO_HEROS = 'chorizo.jpg';
