import { aujourdhuiMaurice } from '../lib/catalogue';
import type { EtatPanier } from '../lib/cart';
import { calculer } from '../lib/pricing';
import type { EntreeCalcul, ResultatCalcul } from '../lib/types';

export function entreeDepuisEtat(etat: EtatPanier): EntreeCalcul {
  return {
    lignes: etat.lignes,
    mode: etat.mode,
    zoneId: etat.zoneId,
    sousVide: etat.sousVide,
    codePromo: etat.codePromo,
    aujourdhui: aujourdhuiMaurice(),
  };
}

export function calculDepuisEtat(etat: EtatPanier): ResultatCalcul {
  return calculer(entreeDepuisEtat(etat));
}

export const OUVRIR_TIROIR = 'panier:ouvrir';
