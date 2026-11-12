/**
 * ═══════════════════════════════════════════════════════════════
 *  RÉGLAGES PIZZA MEMER — coordonnées, livraison, remises, jours
 * ═══════════════════════════════════════════════════════════════
 *
 * Tout ce qui est commercial se règle ici (rien n'est écrit "en dur" dans les pages).
 * Une valeur vide ("" ou null ou []) = l'information n'est simplement pas affichée.
 * Les lignes marquées "À COMPLÉTER" attendent une information de votre part.
 */
import type { Commerce } from '../lib/types';

export const commerce: Commerce = {
  // ── Identité et coordonnées ────────────────────────────────
  nom: 'Pizza Memer',
  lieu: 'Péreybère, nord de l’île Maurice',
  adresseRetrait: 'Chemin Vingt Pieds, Péreybère',
  /** Lien Google Maps du point de retrait. À COMPLÉTER ("" = pas de bouton itinéraire). */
  lienCarteRetrait: '',
  /** Horaires de retrait/livraison, texte libre. À COMPLÉTER ("" = non affiché). */
  horaires: '',

  /** Numéro WhatsApp au format international, chiffres uniquement (230 = Maurice). */
  whatsapp: '23054778439',
  /** Le même numéro tel qu'on veut le lire sur le site. */
  whatsappAffiche: '5477 8439',
  /** Adresse complète de la page Facebook. À COMPLÉTER ("" = pas de lien Facebook). */
  facebook: '',

  // ── Adresse publique du site (sert au QR code, au partage, au référencement) ──
  /** NE CHANGEZ PAS cette adresse après avoir imprimé le QR code sur les boîtes. */
  urlSite: 'https://pizzamemer.github.io/PizzaMemer',

  // ── Jours de distribution ──────────────────────────────────
  distribution: {
    /** 0 = dimanche, 1 = lundi, 2 = mardi, 3 = mercredi, 4 = jeudi, 5 = vendredi, 6 = samedi */
    jours: [4, 5, 6],
    /** Fermetures exceptionnelles, format "AAAA-MM-JJ". Ex. : ['2026-12-25', '2027-01-01'] */
    fermetures: [],
    /** Nombre de dates proposées au client dans le formulaire. */
    nombreDatesProposees: 6,
    /** true = le client peut demander le jour même (aucun délai de 24 h imposé). */
    jourMemeAutorise: true,
    /**
     * Heure (0-23, heure de Maurice) après laquelle le jour même n'est plus proposé.
     * null = pas de limite. À AJUSTER si vous voulez arrêter les commandes du jour à une heure précise.
     */
    heureLimiteJourMeme: null,
    /** Conseil affiché sous le choix du jour. */
    conseil:
      'Je vous conseille de commander la veille pour être certain d’avoir les pizzas que vous souhaitez.',
    /** Mention affichée si le client choisit le jour même. */
    mentionJourMeme: 'Pour aujourd’hui, la disponibilité vous sera confirmée sur WhatsApp.',
  },

  // ── Retrait et livraison ───────────────────────────────────
  retrait: { actif: true, frais: 0 },
  livraison: {
    actif: true,
    /** Tarif appliqué à une zone qui n'a pas de "frais" propre. */
    fraisStandard: 150,
    /**
     * Zones desservies. Une adresse hors de cette liste ne peut PAS être livrée par le site.
     *   frais          tarif de la zone (sinon fraisStandard)
     *   gratuitDes     montant de pizzas (après remise) à partir duquel la livraison est offerte ;
     *                  null = jamais offerte dans cette zone
     *
     * NB : tarifs par zone repris du site actuel (70 / 100 / 150 Rs).
     * Pour passer à un tarif unique de 150 Rs, supprimez simplement les lignes "frais".
     */
    zones: [
      { id: 'pereybere', nom: 'Péreybère', frais: 70, gratuitDes: 1500 },
      { id: 'grand-baie', nom: 'Grand Baie', frais: 70, gratuitDes: 1500 },
      { id: 'bain-boeuf', nom: 'Bain Bœuf', frais: 100, gratuitDes: null },
      { id: 'cap-malheureux', nom: 'Cap Malheureux', frais: 100, gratuitDes: null },
      { id: 'pointe-aux-canonniers', nom: 'Pointe aux Canonniers', frais: 150, gratuitDes: null },
      { id: 'mont-choisy', nom: 'Mont Choisy', frais: 150, gratuitDes: null },
      { id: 'trou-aux-biches', nom: 'Trou aux Biches', frais: 150, gratuitDes: null },
      { id: 'calodyne', nom: 'Calodyne', frais: 150, gratuitDes: null },
      { id: 'grand-gaube', nom: 'Grand Gaube', frais: 150, gratuitDes: null },
    ],
  },

  // ── Option sous-vide ───────────────────────────────────────
  sousVide: {
    /** false = l'option disparaît du site. */
    actif: true,
    prixParPizza: 20,
    libelle: 'Conditionnement sous vide',
    aide: 'Pratique pour congeler vos pizzas.',
  },

  // ── Remises ────────────────────────────────────────────────
  remises: {
    /** Remise automatique selon le nombre de pizzas. */
    quantite: { actif: true, aPartirDe: 4, pourcentage: 10 },
    /**
     * Codes promotionnels. Exemple à décommenter :
     *   { code: 'VOISINS', libelle: 'Offre voisins', type: 'pourcentage', valeur: 15,
     *     actif: true, expireLe: '2027-01-31', minPizzas: 1, cumulable: false },
     *   type : 'pourcentage' (valeur = %) ou 'montant' (valeur = roupies)
     *   cumulable : true = s'ajoute à la remise quantité ; false = voir "cumul" ci-dessous.
     * Attention : un code écrit ici est lisible par quelqu'un qui fouille le code du site.
     */
    codes: [],
    /**
     * Quand un code NON cumulable et la remise quantité s'appliquent en même temps :
     *   'meilleure' = le client bénéficie de la plus avantageuse des deux (une seule remise)
     *   'code'      = le code remplace la remise quantité
     *   'quantite'  = la remise quantité l'emporte, le code est ignoré
     */
    cumul: 'meilleure',
  },

  // ── Cuisson et conservation (page "Comment ça marche ?") ───
  preparation: {
    /** Consigne reprise telle quelle de votre site actuel. */
    cuisson: [
      'Préchauffez votre four au maximum, en chaleur statique.',
      'Retirez l’emballage de la pizza.',
      'Enfournez 2 à 3 minutes.',
    ],
    /** À COMPLÉTER : conservation au réfrigérateur (durée, température). [] = section masquée. */
    conservation: [],
    /** À COMPLÉTER : congélation (durée) et cuisson d'une pizza congelée. [] = section masquée. */
    congelation: [],
  },

  mentionStock: 'Production limitée, jusqu’à épuisement du stock.',
};
