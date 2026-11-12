/**
 * Calcul unique du panier (prix, remises, sous-vide, livraison, total).
 * Fonction pure : ni horloge, ni DOM. Toutes les règles viennent de src/config/commerce.ts.
 */
import { commerce } from '../config/commerce';
import { pizzas } from '../config/pizzas';
import type {
  CodePromo,
  Commerce,
  EntreeCalcul,
  EtatCode,
  LigneCalculee,
  Pizza,
  RemiseAppliquee,
  ResultatCalcul,
} from './types';

const QUANTITE_MAX = 99;

function normaliserCode(texte: string): string {
  return String(texte ?? '').replace(/\s+/g, '').toUpperCase();
}

function arrondi(n: number): number {
  return Math.round(n);
}

export function calculer(
  entree: EntreeCalcul,
  config: Commerce = commerce,
  catalogue: Pizza[] = pizzas,
): ResultatCalcul {
  // ── 1. Lignes : fusion des doublons, filtrage ─────────────────
  const quantites = new Map<string, number>();
  const ignorees: string[] = [];
  for (const l of entree.lignes ?? []) {
    const q = l?.quantite;
    if (typeof q !== 'number' || !Number.isInteger(q) || q <= 0) continue;
    const pizza = catalogue.find((p) => p.id === l.id);
    const commandable =
      !!pizza &&
      !pizza.masquee &&
      pizza.disponible &&
      !(pizza.jusquau && pizza.jusquau < entree.aujourdhui);
    if (!commandable) {
      if (!ignorees.includes(l.id)) ignorees.push(l.id);
      continue;
    }
    quantites.set(l.id, Math.min(QUANTITE_MAX, (quantites.get(l.id) ?? 0) + q));
  }

  const lignes: LigneCalculee[] = [];
  for (const [id, quantite] of quantites) {
    const p = catalogue.find((x) => x.id === id)!;
    lignes.push({ id, nom: p.nom, prixUnitaire: p.prix, quantite, total: p.prix * quantite });
  }

  const nombrePizzas = lignes.reduce((s, l) => s + l.quantite, 0);
  const sousTotal = lignes.reduce((s, l) => s + l.total, 0);
  const vide = nombrePizzas === 0;

  // ── 2. Remise quantité ────────────────────────────────────────
  const rq = config.remises.quantite;
  let remiseQuantite: RemiseAppliquee | null = null;
  if (!vide && rq.actif && nombrePizzas >= rq.aPartirDe) {
    remiseQuantite = {
      origine: 'quantite',
      libelle: `Remise ${rq.pourcentage} % (${rq.aPartirDe} pizzas ou plus)`,
      montant: arrondi((sousTotal * rq.pourcentage) / 100),
    };
  }

  // ── 3. Code promo ─────────────────────────────────────────────
  const saisi = normaliserCode(entree.codePromo);
  let etatCode: EtatCode = 'aucun';
  let code: CodePromo | null = null;
  let remiseCode: RemiseAppliquee | null = null;
  if (saisi !== '') {
    const trouve = config.remises.codes.find((c) => normaliserCode(c.code) === saisi);
    if (!trouve) etatCode = 'inconnu';
    else if (!trouve.actif) etatCode = 'inactif';
    else if (trouve.expireLe && trouve.expireLe < entree.aujourdhui) etatCode = 'expire';
    else if (trouve.minPizzas && nombrePizzas < trouve.minPizzas) etatCode = 'minimum-non-atteint';
    else {
      etatCode = 'applique';
      code = trouve;
      const brut =
        trouve.type === 'pourcentage' ? arrondi((sousTotal * trouve.valeur) / 100) : trouve.valeur;
      remiseCode = {
        origine: 'code',
        libelle: trouve.libelle ? `${trouve.libelle} (code ${trouve.code})` : `Code ${trouve.code}`,
        montant: Math.max(0, Math.min(brut, sousTotal)),
      };
    }
  }

  // ── 4. Cumul ──────────────────────────────────────────────────
  let retenues: RemiseAppliquee[] = [];
  if (vide) {
    // Panier vide : aucune remise ; un code valide n'a rien à remiser.
    if (etatCode === 'applique') etatCode = 'aucun';
  } else if (remiseCode && remiseQuantite) {
    if (code!.cumulable) {
      retenues = [remiseQuantite, remiseCode];
    } else {
      const regle = config.remises.cumul;
      const gardeCode =
        regle === 'code' || (regle === 'meilleure' && remiseCode.montant > remiseQuantite.montant);
      retenues = [gardeCode ? remiseCode : remiseQuantite];
      if (!gardeCode) etatCode = 'non-retenu';
    }
  } else if (remiseCode) {
    retenues = [remiseCode];
  } else if (remiseQuantite) {
    retenues = [remiseQuantite];
  }

  // Plafonnement au sous-total (les montants affichés restent cohérents avec le total).
  let reste = sousTotal;
  const remises = retenues.map((r) => {
    const montant = Math.max(0, Math.min(r.montant, reste));
    reste -= montant;
    return { ...r, montant };
  });
  const totalRemises = remises.reduce((s, r) => s + r.montant, 0);
  const pizzasApresRemise = sousTotal - totalRemises;

  // ── 5. Sous-vide ──────────────────────────────────────────────
  const sousVide =
    !vide && entree.sousVide && config.sousVide.actif ? config.sousVide.prixParPizza * nombrePizzas : 0;

  // ── 6. Livraison / retrait ────────────────────────────────────
  const zone =
    entree.mode === 'livraison' && config.livraison.actif
      ? config.livraison.zones.find((z) => z.id === entree.zoneId)
      : undefined;
  const livraison: ResultatCalcul['livraison'] = {
    applicable: false,
    zoneNom: null,
    fraisNormaux: 0,
    frais: 0,
    offerte: false,
    resteAvantGratuite: null,
  };
  if (zone) {
    const fraisNormaux = zone.frais ?? config.livraison.fraisStandard;
    const seuil = zone.gratuitDes;
    const offerte = !vide && seuil !== null && pizzasApresRemise >= seuil;
    livraison.applicable = true;
    livraison.zoneNom = zone.nom;
    if (!vide) {
      livraison.fraisNormaux = fraisNormaux;
      livraison.offerte = offerte;
      livraison.frais = offerte ? 0 : fraisNormaux;
      livraison.resteAvantGratuite = seuil !== null && !offerte ? seuil - pizzasApresRemise : null;
    }
  } else if (entree.mode === 'retrait' && !vide) {
    livraison.fraisNormaux = config.retrait.frais;
    livraison.frais = config.retrait.frais;
  }

  // ── 7. Total ──────────────────────────────────────────────────
  const total = vide ? 0 : Math.max(0, arrondi(pizzasApresRemise + sousVide + livraison.frais));

  return {
    lignes,
    ignorees,
    nombrePizzas,
    sousTotal,
    remises,
    totalRemises,
    pizzasApresRemise,
    sousVide,
    livraison,
    etatCode,
    pizzasAvantRemiseQuantite:
      !vide && rq.actif && nombrePizzas < rq.aPartirDe ? rq.aPartirDe - nombrePizzas : null,
    total,
    vide,
  };
}
