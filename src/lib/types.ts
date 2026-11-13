/**
 * CONTRATS DE TYPES — source unique partagée par tous les modules.
 * Propriétaire : orchestrateur. Les agents ne modifient pas ce fichier sans le signaler.
 */

// ───────── Données (src/config) ─────────
export interface Pizza {
  id: string;
  nom: string;
  prix: number;
  ingredients: string[];
  description: string;
  photo: string | null;
  disponible: boolean;
  masquee: boolean;
  badge: 'nouveau' | 'temporaire' | null;
  jusquau: string | null; // AAAA-MM-JJ
  infos: string[];
  allergenes: string[];
  base: 'tomate' | 'blanche';
}

export interface ZoneLivraison {
  id: string;
  nom: string;
  frais?: number;
  gratuitDes: number | null;
}

export interface CodePromo {
  code: string;
  libelle: string;
  type: 'pourcentage' | 'montant';
  valeur: number;
  actif: boolean;
  expireLe?: string | null; // AAAA-MM-JJ inclus
  minPizzas?: number;
  cumulable: boolean;
}

export interface Commerce {
  nom: string;
  lieu: string;
  adresseRetrait: string;
  lienCarteRetrait: string;
  horaires: string;
  whatsapp: string;
  whatsappAffiche: string;
  facebook: string;
  chaineWhatsapp: string;
  urlSite: string;
  distribution: {
    jours: number[];
    fermetures: string[];
    nombreDatesProposees: number;
    jourMemeAutorise: boolean;
    heureLimiteJourMeme: number | null;
    conseil: string;
    mentionJourMeme: string;
  };
  retrait: { actif: boolean; frais: number };
  livraison: { actif: boolean; fraisStandard: number; zones: ZoneLivraison[] };
  sousVide: { actif: boolean; prixParPizza: number; libelle: string; aide: string };
  remises: {
    quantite: { actif: boolean; aPartirDe: number; pourcentage: number };
    codes: CodePromo[];
    cumul: 'meilleure' | 'code' | 'quantite';
  };
  preparation: { cuisson: string[]; conservation: string[]; congelation: string[] };
  mentionStock: string;
}

// ───────── Panier et commande ─────────
export interface LignePanier {
  id: string; // id de pizza
  quantite: number;
}

export type ModeRecuperation = 'retrait' | 'livraison';

/** Tout ce dont le calcul a besoin. Aucune lecture du DOM ni de l'horloge dans le calcul. */
export interface EntreeCalcul {
  lignes: LignePanier[];
  mode: ModeRecuperation;
  zoneId: string | null;
  sousVide: boolean;
  codePromo: string; // saisi par le client, '' si aucun
  /** Date du jour AAAA-MM-JJ (heure de Maurice) — sert à l'expiration des codes. */
  aujourdhui: string;
}

export interface LigneCalculee {
  id: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  total: number;
}

export interface RemiseAppliquee {
  origine: 'quantite' | 'code';
  libelle: string; // ex. "Remise 10 % (4 pizzas ou plus)"
  montant: number; // roupies, positif
}

export type EtatCode =
  | 'aucun' // rien saisi
  | 'applique'
  | 'inconnu'
  | 'expire'
  | 'inactif'
  | 'minimum-non-atteint'
  | 'non-retenu'; // valide mais écarté par la règle de cumul

export interface ResultatCalcul {
  lignes: LigneCalculee[]; // uniquement pizzas connues, non masquées, disponibles, quantité > 0
  ignorees: string[]; // ids présents dans le panier mais non commandables (retirés du calcul)
  nombrePizzas: number;
  sousTotal: number; // pizzas, avant remise
  remises: RemiseAppliquee[];
  totalRemises: number;
  pizzasApresRemise: number; // base du seuil de livraison offerte
  sousVide: number; // 0 si option non choisie ou désactivée
  livraison: {
    applicable: boolean; // mode livraison ET zone configurée choisie
    zoneNom: string | null;
    fraisNormaux: number; // tarif de la zone avant gratuité
    frais: number; // montant réellement facturé
    offerte: boolean;
    /** Montant de pizzas encore à ajouter pour obtenir la gratuité ; null si non concerné. */
    resteAvantGratuite: number | null;
  };
  etatCode: EtatCode;
  /** Pizzas manquantes pour déclencher la remise quantité ; null si déjà acquise ou désactivée. */
  pizzasAvantRemiseQuantite: number | null;
  total: number; // montant final, entier en roupies, jamais négatif
  vide: boolean;
}

export interface InfosClient {
  nom: string;
  telephone: string;
  adresse: string; // livraison uniquement
  date: string; // AAAA-MM-JJ choisie
  remarque: string;
}

export interface DateProposee {
  iso: string; // AAAA-MM-JJ
  libelle: string; // "Jeudi 19 novembre"
  libelleCourt: string; // "Jeu. 19 nov."
  estAujourdhui: boolean;
}
