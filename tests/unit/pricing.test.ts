import { describe, expect, it } from 'vitest';
import { calculer } from '../../src/lib/pricing';
import type { Commerce } from '../../src/lib/types';
import { catalogueTest as cat, configTest, entree } from './helpers';

const cfg = configTest();
const calc = (e = entree(), c: Commerce = cfg) => calculer(e, c, cat);
const lignes = (...l: [string, number][]) => l.map(([id, quantite]) => ({ id, quantite }));

describe('lignes et quantités', () => {
  it('calcule le sous-total', () => {
    const r = calc(entree({ lignes: lignes(['a', 2], ['b', 1]) }));
    expect(r.sousTotal).toBe(1000);
    expect(r.nombrePizzas).toBe(3);
    expect(r.lignes[0]).toMatchObject({ id: 'a', nom: 'A', prixUnitaire: 300, quantite: 2, total: 600 });
  });
  it('ignore quantités 0, négatives, décimales, NaN', () => {
    const r = calc(entree({ lignes: lignes(['a', 0], ['b', -2], ['a', 1.5], ['b', NaN]) }));
    expect(r.vide).toBe(true);
    expect(r.lignes).toEqual([]);
  });
  it('fusionne les doublons et plafonne à 99', () => {
    const r = calc(entree({ lignes: lignes(['a', 2], ['a', 3]) }));
    expect(r.lignes).toHaveLength(1);
    expect(r.lignes[0].quantite).toBe(5);
    expect(calc(entree({ lignes: lignes(['a', 60], ['a', 60]) })).lignes[0].quantite).toBe(99);
  });
  it('écarte id inconnu, indisponible, masquée, expirée', () => {
    const r = calc(entree({ lignes: lignes(['zzz', 1], ['indispo', 1], ['cachee', 1], ['temp', 1], ['a', 1]) , aujourdhui: '2026-11-21' }));
    expect(r.ignorees).toEqual(['zzz', 'indispo', 'cachee', 'temp']);
    expect(r.lignes.map((l) => l.id)).toEqual(['a']);
  });
  it('pizza temporaire encore valable le dernier jour', () => {
    expect(calc(entree({ lignes: lignes(['temp', 1]), aujourdhui: '2026-11-20' })).lignes).toHaveLength(1);
  });
});

describe('remise quantité', () => {
  it('absente à 3 pizzas, présente à 4', () => {
    const r3 = calc(entree({ lignes: lignes(['a', 3]) }));
    expect(r3.remises).toEqual([]);
    expect(r3.pizzasAvantRemiseQuantite).toBe(1);
    const r4 = calc(entree({ lignes: lignes(['a', 4]) }));
    expect(r4.remises).toHaveLength(1);
    expect(r4.remises[0]).toMatchObject({ origine: 'quantite', libelle: 'Remise 10 % (4 pizzas ou plus)', montant: 120 });
    expect(r4.pizzasAvantRemiseQuantite).toBeNull();
    expect(r4.total).toBe(1080);
  });
  it('arrondit au plus proche', () => {
    const c = configTest({ remises: { ...cfg.remises, quantite: { actif: true, aPartirDe: 1, pourcentage: 10 } } });
    const catalogue = [{ ...cat[0], prix: 335 }];
    expect(calculer(entree(), c, catalogue).remises[0].montant).toBe(34); // 33,5 → 34
  });
  it('désactivée : aucune remise, pas de pizzas manquantes', () => {
    const c = configTest({ remises: { ...cfg.remises, quantite: { actif: false, aPartirDe: 4, pourcentage: 10 } } });
    const r = calc(entree({ lignes: lignes(['a', 5]) }), c);
    expect(r.remises).toEqual([]);
    expect(r.pizzasAvantRemiseQuantite).toBeNull();
  });
});

describe('codes promo', () => {
  it('insensible à la casse et aux espaces', () => {
    const r = calc(entree({ codePromo: '  pr omo ' }));
    expect(r.etatCode).toBe('applique');
    expect(r.remises[0].origine).toBe('code');
    expect(r.remises[0].montant).toBe(60);
  });
  it('aucun / inconnu / inactif', () => {
    expect(calc(entree({ codePromo: '' })).etatCode).toBe('aucun');
    expect(calc(entree({ codePromo: '   ' })).etatCode).toBe('aucun');
    expect(calc(entree({ codePromo: 'NOPE' })).etatCode).toBe('inconnu');
    expect(calc(entree({ codePromo: 'OFF' })).etatCode).toBe('inactif');
  });
  it('expiré : valable le jour même, expiré le lendemain', () => {
    expect(calc(entree({ codePromo: 'VIEUX', aujourdhui: '2026-11-12' })).etatCode).toBe('applique');
    const r = calc(entree({ codePromo: 'VIEUX', aujourdhui: '2026-11-13' }));
    expect(r.etatCode).toBe('expire');
    expect(r.remises).toEqual([]);
  });
  it('minimum de pizzas', () => {
    expect(calc(entree({ codePromo: 'MIN3', lignes: lignes(['a', 2]) })).etatCode).toBe('minimum-non-atteint');
    expect(calc(entree({ codePromo: 'MIN3', lignes: lignes(['a', 3]) })).etatCode).toBe('applique');
  });
  it('montant fixe supérieur au sous-total : plafonné, total des pizzas à 0', () => {
    const r = calc(entree({ codePromo: 'GROS' }));
    expect(r.totalRemises).toBe(300);
    expect(r.pizzasApresRemise).toBe(0);
    expect(r.total).toBe(0);
  });
  it('montant fixe', () => {
    const r = calc(entree({ codePromo: 'FIXE', lignes: lignes(['a', 2]) }));
    expect(r.remises[0].montant).toBe(50);
    expect(r.total).toBe(550);
  });
});

describe('cumul', () => {
  const q4 = lignes(['a', 4]); // sous-total 1200 ; quantité = 120
  it('meilleure : le code gagne s’il est plus gros', () => {
    const r = calc(entree({ lignes: q4, codePromo: 'PROMO' })); // 240 > 120
    expect(r.remises.map((x) => x.origine)).toEqual(['code']);
    expect(r.totalRemises).toBe(240);
    expect(r.etatCode).toBe('applique');
  });
  it('meilleure : la quantité gagne si le code est plus petit', () => {
    const r = calc(entree({ lignes: q4, codePromo: 'FIXE' })); // 50 < 120
    expect(r.remises.map((x) => x.origine)).toEqual(['quantite']);
    expect(r.etatCode).toBe('non-retenu');
  });
  it('meilleure : égalité → remise quantité', () => {
    const c = configTest();
    c.remises.codes = [{ code: 'EGAL', libelle: 'Égal', type: 'montant', valeur: 120, actif: true, cumulable: false }];
    const r = calc(entree({ lignes: q4, codePromo: 'EGAL' }), c);
    expect(r.remises.map((x) => x.origine)).toEqual(['quantite']);
    expect(r.etatCode).toBe('non-retenu');
  });
  it('code : le code remplace la quantité', () => {
    const c = configTest({ remises: { ...cfg.remises, cumul: 'code' } });
    const r = calc(entree({ lignes: q4, codePromo: 'FIXE' }), c);
    expect(r.remises.map((x) => x.origine)).toEqual(['code']);
    expect(r.etatCode).toBe('applique');
  });
  it('quantite : la quantité l’emporte', () => {
    const c = configTest({ remises: { ...cfg.remises, cumul: 'quantite' } });
    const r = calc(entree({ lignes: q4, codePromo: 'PROMO' }), c);
    expect(r.remises.map((x) => x.origine)).toEqual(['quantite']);
    expect(r.etatCode).toBe('non-retenu');
  });
  it('cumulable : les deux s’additionnent', () => {
    const r = calc(entree({ lignes: q4, codePromo: 'CUMUL' }));
    expect(r.remises.map((x) => x.origine)).toEqual(['quantite', 'code']);
    expect(r.totalRemises).toBe(120 + 60);
    expect(r.etatCode).toBe('applique');
  });
  it('sans remise quantité, un code non cumulable s’applique normalement (même en mode quantite)', () => {
    const c = configTest({ remises: { ...cfg.remises, cumul: 'quantite' } });
    const r = calc(entree({ codePromo: 'PROMO' }), c);
    expect(r.etatCode).toBe('applique');
    expect(r.totalRemises).toBe(60);
  });
  it('les remises ne dépassent jamais le sous-total (cumul plafonné)', () => {
    const c = configTest();
    c.remises.codes = [{ code: 'TOUT', libelle: 'Tout', type: 'pourcentage', valeur: 100, actif: true, cumulable: true }];
    const r = calc(entree({ lignes: q4, codePromo: 'TOUT' }), c);
    expect(r.totalRemises).toBe(1200);
    expect(r.remises.reduce((s, x) => s + x.montant, 0)).toBe(1200);
    expect(r.total).toBe(0);
  });
});

describe('livraison et retrait', () => {
  const liv = (zoneId: string | null, extra = {}) => entree({ mode: 'livraison', zoneId, ...extra });
  it('zone avec frais propre', () => {
    const r = calc(liv('proche'));
    expect(r.livraison).toMatchObject({ applicable: true, zoneNom: 'Proche', fraisNormaux: 70, frais: 70, offerte: false, resteAvantGratuite: 1200 });
    expect(r.total).toBe(370);
  });
  it('zone sans frais → tarif standard, jamais offerte', () => {
    const r = calc(liv('std', { lignes: lignes(['b', 10]) }));
    expect(r.livraison.fraisNormaux).toBe(150);
    expect(r.livraison.frais).toBe(150);
    expect(r.livraison.resteAvantGratuite).toBeNull();
  });
  it('seuil pile atteint → offerte', () => {
    const c = configTest();
    c.remises.quantite.actif = false;
    const r = calc(liv('proche', { lignes: lignes(['a', 5]) }), c); // 1500
    expect(r.livraison).toMatchObject({ offerte: true, frais: 0, fraisNormaux: 70, resteAvantGratuite: null });
  });
  it('à 1 Rs près → non offerte', () => {
    const c = configTest();
    c.remises.quantite.actif = false;
    const catalogue = [{ ...cat[0], prix: 1499 }];
    const r = calculer(liv('proche', { lignes: lignes(['a', 1]) }), c, catalogue);
    expect(r.livraison.offerte).toBe(false);
    expect(r.livraison.resteAvantGratuite).toBe(1);
  });
  it('seuil évalué APRÈS remise', () => {
    // 5 × 300 = 1500 avant remise ; −10 % = 1350 < 1500
    const r = calc(liv('proche', { lignes: lignes(['a', 5]) }));
    expect(r.pizzasApresRemise).toBe(1350);
    expect(r.livraison.offerte).toBe(false);
    expect(r.livraison.resteAvantGratuite).toBe(150);
  });
  it('le sous-vide n’entre pas dans le seuil', () => {
    const c = configTest();
    c.remises.quantite.actif = false;
    const r = calc(liv('loin', { lignes: lignes(['a', 3]), sousVide: true }), c); // 900 + 60
    expect(r.livraison.offerte).toBe(false);
    expect(r.livraison.resteAvantGratuite).toBe(100);
  });
  it('zone inconnue ou absente : non applicable, frais 0', () => {
    for (const z of ['zzz', null]) {
      const r = calc(liv(z));
      expect(r.livraison.applicable).toBe(false);
      expect(r.livraison.frais).toBe(0);
      expect(r.total).toBe(300);
    }
  });
  it('livraison désactivée', () => {
    const c = configTest(); c.livraison.actif = false;
    const r = calc(liv('proche'), c);
    expect(r.livraison.applicable).toBe(false);
    expect(r.livraison.frais).toBe(0);
  });
  it('retrait : frais de retrait, non applicable', () => {
    const c = configTest(); c.retrait.frais = 25;
    const r = calc(entree({ zoneId: 'proche' }), c);
    expect(r.livraison.applicable).toBe(false);
    expect(r.livraison.frais).toBe(25);
    expect(r.total).toBe(325);
    expect(calc().livraison.frais).toBe(0);
  });
});

describe('sous-vide et total', () => {
  it('actif : prix × pizzas, jamais remisé', () => {
    const r = calc(entree({ lignes: lignes(['a', 4]), sousVide: true }));
    expect(r.sousVide).toBe(80);
    expect(r.total).toBe(1200 - 120 + 80);
  });
  it('option décochée ou désactivée → 0', () => {
    expect(calc(entree({ sousVide: false })).sousVide).toBe(0);
    const c = configTest(); c.sousVide.actif = false;
    expect(calc(entree({ sousVide: true }), c).sousVide).toBe(0);
  });
  it('total complet : pizzas − remise + sous-vide + livraison', () => {
    const r = calc(entree({ lignes: lignes(['a', 2], ['b', 2]), sousVide: true, mode: 'livraison', zoneId: 'proche' }));
    // 1400 − 140 = 1260 ; + 80 + 70
    expect(r.total).toBe(1410);
    expect(Number.isInteger(r.total)).toBe(true);
  });
  it('panier vide : tout à zéro même avec options et code', () => {
    const r = calc(entree({ lignes: [], sousVide: true, mode: 'livraison', zoneId: 'proche', codePromo: 'FIXE' }));
    expect(r).toMatchObject({ vide: true, total: 0, sousTotal: 0, sousVide: 0, totalRemises: 0, remises: [], pizzasAvantRemiseQuantite: null });
    expect(r.livraison.frais).toBe(0);
  });
});

describe('fumée sur la vraie config', () => {
  it('calcule sans erreur', async () => {
    const { pizzas } = await import('../../src/config/pizzas');
    const p = pizzas.find((x) => x.disponible && !x.masquee)!;
    const r = calculer({ lignes: [{ id: p.id, quantite: 4 }], mode: 'retrait', zoneId: null, sousVide: false, codePromo: '', aujourdhui: '2026-11-12' });
    expect(r.nombrePizzas).toBe(4);
    expect(r.total).toBeGreaterThan(0);
    expect(r.total).toBeLessThan(r.sousTotal);
  });
});
