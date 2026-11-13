import type { Commerce, EntreeCalcul, Pizza } from '../../src/lib/types';

export function pizza(id: string, prix: number, extra: Partial<Pizza> = {}): Pizza {
  return {
    id, nom: id.toUpperCase(), prix, ingredients: [], description: '', photo: null,
    disponible: true, masquee: false, badge: null, jusquau: null, infos: [], allergenes: [],
    base: 'tomate', ...extra,
  };
}

export const catalogueTest: Pizza[] = [
  pizza('a', 300), pizza('b', 400),
  pizza('indispo', 500, { disponible: false }),
  pizza('cachee', 500, { masquee: true }),
  pizza('temp', 500, { jusquau: '2026-11-20' }),
];

export function configTest(surcharge: Partial<Commerce> = {}): Commerce {
  return {
    nom: 'Test', lieu: 'Lieu', adresseRetrait: '1 rue du Test', lienCarteRetrait: '', horaires: '',
    whatsapp: '23050000000', whatsappAffiche: '5000 0000', facebook: '', chaineWhatsapp: '', urlSite: 'https://x.test',
    distribution: {
      jours: [4, 5, 6], fermetures: [], nombreDatesProposees: 6, jourMemeAutorise: true,
      heureLimiteJourMeme: null, conseil: '', mentionJourMeme: '',
    },
    retrait: { actif: true, frais: 0 },
    livraison: {
      actif: true, fraisStandard: 150,
      zones: [
        { id: 'proche', nom: 'Proche', frais: 70, gratuitDes: 1500 },
        { id: 'std', nom: 'Standard', gratuitDes: null },
        { id: 'loin', nom: 'Loin', frais: 100, gratuitDes: 1000 },
      ],
    },
    sousVide: { actif: true, prixParPizza: 20, libelle: '', aide: '' },
    remises: {
      quantite: { actif: true, aPartirDe: 4, pourcentage: 10 },
      codes: [
        { code: 'PROMO', libelle: 'Promo', type: 'pourcentage', valeur: 20, actif: true, cumulable: false },
        { code: 'CUMUL', libelle: 'Cumul', type: 'pourcentage', valeur: 5, actif: true, cumulable: true },
        { code: 'FIXE', libelle: 'Fixe', type: 'montant', valeur: 50, actif: true, cumulable: false },
        { code: 'GROS', libelle: 'Gros', type: 'montant', valeur: 5000, actif: true, cumulable: false },
        { code: 'OFF', libelle: 'Off', type: 'pourcentage', valeur: 50, actif: false, cumulable: false },
        { code: 'VIEUX', libelle: 'Vieux', type: 'pourcentage', valeur: 50, actif: true, expireLe: '2026-11-12', cumulable: false },
        { code: 'MIN3', libelle: 'Min3', type: 'pourcentage', valeur: 50, actif: true, minPizzas: 3, cumulable: false },
      ],
      cumul: 'meilleure',
    },
    preparation: { cuisson: [], conservation: [], congelation: [] },
    mentionStock: '',
    ...surcharge,
  };
}

export function entree(surcharge: Partial<EntreeCalcul> = {}): EntreeCalcul {
  return {
    lignes: [{ id: 'a', quantite: 1 }], mode: 'retrait', zoneId: null, sousVide: false,
    codePromo: '', aujourdhui: '2026-11-12', ...surcharge,
  };
}
