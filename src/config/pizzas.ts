/**
 * ═══════════════════════════════════════════════════════════════
 *  LA CARTE PIZZA MEMER — c'est LE fichier à modifier pour la carte
 * ═══════════════════════════════════════════════════════════════
 *
 * Le site, le panier, le message WhatsApp ET la carte PDF lisent ce fichier.
 * Changer un prix ici le change partout.
 *
 * Pour chaque pizza :
 *   id           identifiant technique : minuscules, sans espace ni accent. NE PAS le changer
 *                une fois la pizza en ligne (les paniers des clients y font référence).
 *   nom          nom affiché.
 *   prix         prix en roupies (nombre entier, sans "Rs").
 *   ingredients  liste des ingrédients. Laisser [] si vous préférez ne rien afficher.
 *   description  petite phrase facultative ("" = rien).
 *   photo        nom du fichier photo placé dans src/assets/pizzas/ (ex. "margherita.jpg").
 *                null = pas encore de photo : le site affiche une illustration à la place.
 *   disponible   false = la pizza reste visible mais marquée "Indisponible" et non commandable.
 *   masquee      true  = la pizza disparaît complètement du site et du PDF.
 *   badge        "nouveau" | "temporaire" | null — petite étiquette sur la carte.
 *   jusquau      pour une pizza temporaire : date de fin "AAAA-MM-JJ" (elle disparaît
 *                automatiquement à la prochaine mise à jour du site après cette date) ou null.
 *   infos        informations utiles facultatives (ex. "Sans mozzarella"). [] si aucune.
 *   allergenes   à compléter par vos soins. [] = rien n'est affiché (le site n'invente rien).
 *   base         "tomate" | "blanche" — sert uniquement à dessiner l'illustration.
 */
import type { Pizza } from '../lib/types';

export const pizzas: Pizza[] = [
  {
    id: 'margherita',
    nom: 'Margherita',
    prix: 330,
    ingredients: ['Sauce tomate', 'Mozzarella', 'Basilic frais', 'Huile d’olive'],
    description: '',
    photo: null,
    disponible: true,
    masquee: false,
    badge: null,
    jusquau: null,
    infos: [],
    allergenes: [],
    base: 'tomate',
  },
  {
    id: 'thon',
    nom: 'Thon',
    prix: 390,
    ingredients: ['Sauce tomate', 'Thon', 'Mozzarella', 'Oignon rouge'],
    description: '',
    photo: 'thon.jpg',
    disponible: true,
    masquee: false,
    badge: null,
    jusquau: null,
    infos: [],
    allergenes: [],
    base: 'tomate',
  },
  {
    id: 'forestiere',
    nom: 'La Forestière',
    prix: 420,
    ingredients: ['Sauce tomate', 'Mozzarella', 'Jambon', 'Champignons'],
    description: '',
    photo: 'forestiere.jpg',
    disponible: true,
    masquee: false,
    badge: null,
    jusquau: null,
    infos: ['Jambon de poulet sur demande'],
    allergenes: [],
    base: 'tomate',
  },
  {
    id: 'signature-blanche',
    nom: 'Signature Blanche',
    prix: 430,
    ingredients: ['Base crème à l’ail', 'Jambon', 'Champignons', 'Mozzarella', 'Oignon rouge'],
    description: '',
    photo: 'signature-blanche.jpg',
    disponible: true,
    masquee: false,
    badge: null,
    jusquau: null,
    infos: ['Jambon de poulet sur demande'],
    allergenes: [],
    base: 'blanche',
  },
  {
    id: 'burger',
    nom: 'Burger',
    prix: 450,
    ingredients: ['Sauce tomate', 'Bœuf haché', 'Cheddar', 'Oignons rouges', 'Sauce burger'],
    description: '',
    photo: 'burger.jpg',
    disponible: true,
    masquee: false,
    badge: null,
    jusquau: null,
    infos: ['Sans mozzarella'],
    allergenes: [],
    base: 'tomate',
  },
  {
    id: 'welsh',
    nom: 'Welsh',
    prix: 450,
    ingredients: ['Cheddar à la bière', 'Jambon', 'Moutarde'],
    description: '',
    photo: 'welsh.jpg',
    disponible: true,
    masquee: false,
    badge: null,
    jusquau: null,
    infos: ['Jambon de poulet sur demande'],
    allergenes: [],
    base: 'blanche',
  },
  {
    id: 'chorizo',
    nom: 'Chorizo',
    prix: 450,
    ingredients: ['Sauce tomate', 'Chorizo', 'Mozzarella'],
    description: '',
    photo: 'chorizo.jpg',
    disponible: true,
    masquee: false,
    badge: 'nouveau',
    jusquau: null,
    infos: [],
    allergenes: [],
    base: 'tomate',
  },
  {
    id: 'chevre-miel',
    nom: 'Chèvre Miel',
    prix: 500,
    ingredients: ['Base crème fraîche', 'Chèvre', 'Mozzarella', 'Miel'],
    description: '',
    photo: 'chevre-miel.jpg',
    disponible: true,
    masquee: false,
    badge: 'nouveau',
    jusquau: null,
    infos: [],
    allergenes: [],
    base: 'blanche',
  },
];
