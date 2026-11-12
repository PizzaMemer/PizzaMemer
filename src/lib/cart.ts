/**
 * Magasin de panier partagé entre îlots Preact indépendants.
 * Sans dépendance ; persistance localStorage ; sûr côté serveur (SSR).
 */
import { useEffect, useState } from 'preact/hooks';
import type { InfosClient, LignePanier, ModeRecuperation } from './types';

export interface EtatPanier {
  lignes: LignePanier[];
  mode: ModeRecuperation;
  zoneId: string | null;
  sousVide: boolean;
  codePromo: string;
  client: InfosClient;
}

export const CLE_STOCKAGE = 'pizzamemer.panier.v1';
const QUANTITE_MAX = 99;

function etatInitial(): EtatPanier {
  return {
    lignes: [],
    mode: 'retrait',
    zoneId: null,
    sousVide: false,
    codePromo: '',
    client: { nom: '', telephone: '', adresse: '', date: '', remarque: '' },
  };
}

const ETAT_VIDE: EtatPanier = Object.freeze(etatInitial()) as EtatPanier;

let etat: EtatPanier | null = null; // chargé paresseusement
const abonnes = new Set<() => void>();
let ecouteStorage = false;

const estTexte = (v: unknown): v is string => typeof v === 'string';

/** Valide la forme d'une donnée lue ; renvoie l'état initial si elle est inexploitable. */
function valider(brut: unknown): EtatPanier {
  const base = etatInitial();
  if (!brut || typeof brut !== 'object') return base;
  const o = brut as Record<string, unknown>;
  const lignes: LignePanier[] = [];
  if (Array.isArray(o.lignes)) {
    for (const l of o.lignes) {
      const r = l as Record<string, unknown> | null;
      if (r && estTexte(r.id) && r.id && typeof r.quantite === 'number' && Number.isInteger(r.quantite) && r.quantite > 0) {
        const deja = lignes.find((x) => x.id === r.id);
        if (deja) deja.quantite = Math.min(QUANTITE_MAX, deja.quantite + r.quantite);
        else lignes.push({ id: r.id, quantite: Math.min(QUANTITE_MAX, r.quantite) });
      }
    }
  }
  const c = (o.client && typeof o.client === 'object' ? o.client : {}) as Record<string, unknown>;
  return {
    lignes,
    mode: o.mode === 'livraison' ? 'livraison' : 'retrait',
    zoneId: estTexte(o.zoneId) ? o.zoneId : null,
    sousVide: o.sousVide === true,
    codePromo: estTexte(o.codePromo) ? o.codePromo : '',
    client: {
      nom: estTexte(c.nom) ? c.nom : '',
      telephone: estTexte(c.telephone) ? c.telephone : '',
      adresse: estTexte(c.adresse) ? c.adresse : '',
      date: estTexte(c.date) ? c.date : '',
      remarque: estTexte(c.remarque) ? c.remarque : '',
    },
  };
}

function charger(): EtatPanier {
  try {
    if (typeof window === 'undefined') return etatInitial();
    const texte = window.localStorage.getItem(CLE_STOCKAGE);
    return texte ? valider(JSON.parse(texte)) : etatInitial();
  } catch {
    return etatInitial();
  }
}

function sauvegarder(e: EtatPanier): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(e));
  } catch {
    /* stockage indisponible ou plein : le panier reste en mémoire */
  }
}

function notifier(): void {
  for (const fn of [...abonnes]) {
    try {
      fn();
    } catch {
      /* un abonné défaillant ne doit pas bloquer les autres */
    }
  }
}

function changer(suivant: EtatPanier): void {
  etat = suivant;
  sauvegarder(suivant);
  notifier();
}

export function lirePanier(): EtatPanier {
  if (etat === null) etat = charger();
  return etat;
}

function surStorage(ev: { key?: string | null }): void {
  if (ev.key !== null && ev.key !== undefined && ev.key !== CLE_STOCKAGE) return;
  etat = charger();
  notifier();
}

/** S'abonne aux changements (y compris ceux venant d'un autre onglet). Renvoie la fonction de désabonnement. */
export function abonner(fn: () => void): () => void {
  abonnes.add(fn);
  try {
    if (!ecouteStorage && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('storage', surStorage as EventListener);
      ecouteStorage = true;
    }
  } catch {
    /* ignoré */
  }
  return () => {
    abonnes.delete(fn);
  };
}

function quantiteValide(q: number): number {
  return Number.isFinite(q) ? Math.floor(q) : NaN;
}

export function ajouter(id: string, quantite = 1): void {
  const q = quantiteValide(quantite);
  if (!id || !(q > 0)) return;
  const e = lirePanier();
  const existe = e.lignes.find((l) => l.id === id);
  const lignes = existe
    ? e.lignes.map((l) => (l.id === id ? { id, quantite: Math.min(QUANTITE_MAX, l.quantite + q) } : l))
    : [...e.lignes, { id, quantite: Math.min(QUANTITE_MAX, q) }];
  changer({ ...e, lignes });
}

export function definirQuantite(id: string, quantite: number): void {
  const q = quantiteValide(quantite);
  if (Number.isNaN(q)) return;
  const e = lirePanier();
  if (q <= 0) return retirer(id);
  const n = Math.min(QUANTITE_MAX, q);
  const lignes = e.lignes.some((l) => l.id === id)
    ? e.lignes.map((l) => (l.id === id ? { id, quantite: n } : l))
    : [...e.lignes, { id, quantite: n }];
  changer({ ...e, lignes });
}

export function retirer(id: string): void {
  const e = lirePanier();
  if (!e.lignes.some((l) => l.id === id)) return;
  changer({ ...e, lignes: e.lignes.filter((l) => l.id !== id) });
}

/** Vide le panier (lignes) ; conserve les coordonnées du client et les options. */
export function vider(): void {
  changer({ ...lirePanier(), lignes: [] });
}

export function majOptions(partiel: Partial<Pick<EtatPanier, 'mode' | 'zoneId' | 'sousVide' | 'codePromo'>>): void {
  changer({ ...lirePanier(), ...partiel });
}

export function majClient(partiel: Partial<InfosClient>): void {
  const e = lirePanier();
  changer({ ...e, client: { ...e.client, ...partiel } });
}

export function nombreArticles(): number {
  return lirePanier().lignes.reduce((s, l) => s + l.quantite, 0);
}

/**
 * Hook Preact. Premier rendu = état vide (identique côté serveur et au 1er rendu client,
 * donc pas d'écart d'hydratation), puis l'état réel après montage.
 */
export function usePanier(): EtatPanier {
  const [valeur, setValeur] = useState<EtatPanier>(ETAT_VIDE);
  useEffect(() => {
    setValeur(lirePanier());
    return abonner(() => setValeur(lirePanier()));
  }, []);
  return valeur;
}
