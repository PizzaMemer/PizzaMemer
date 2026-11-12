import { describe, expect, it } from 'vitest';
import { calculer } from '../../src/lib/pricing';
import { rs } from '../../src/lib/format';
import { construireMessage, lienWhatsApp, validerCommande } from '../../src/lib/whatsapp';
import type { InfosClient } from '../../src/lib/types';
import { catalogueTest, configTest, entree } from './helpers';

const cfg = configTest();
const maintenant = new Date('2026-11-16T10:00:00+04:00');
const sp = (n: number) => rs(n).replace(/[  ]/g, ' ');
const client = (extra: Partial<InfosClient> = {}): InfosClient => ({
  nom: 'Jean', telephone: '5700 1234', adresse: '', date: '2026-11-19', remarque: '', ...extra,
});

describe('construireMessage', () => {
  it('retrait : toutes les rubriques, dans l’ordre', () => {
    const e = entree({ lignes: [{ id: 'a', quantite: 4 }, { id: 'b', quantite: 1 }], sousVide: true, codePromo: 'cumul' });
    const r = calculer(e, cfg, catalogueTest);
    const m = construireMessage(r, e, client({ remarque: 'Sans oignon' }), cfg);
    const ordre = [
      'Bonjour, je souhaite passer une commande Pizza Memer 🍕',
      'Nom : Jean', 'Téléphone : 5700 1234',
      '• 4 × A — 300 Rs l\'unité — 1 200 Rs',
      '• 1 × B — 400 Rs l\'unité — 400 Rs',
      `Sous-total : ${sp(1600)}`,
      `Remise 10 % (4 pizzas ou plus) : −${sp(160)}`,
      `Cumul (code CUMUL) : −${sp(80)}`,
      'Sous vide (5 pizzas) : 100 Rs',
      'Retrait — 1 rue du Test',
      'Date demandée : Jeudi 19 novembre',
      `*Total : ${sp(r.total)}*`,
      'Remarque : Sans oignon',
      'Merci de me confirmer la disponibilité 🙏',
    ];
    let pos = -1;
    for (const part of ordre) {
      const i = m.indexOf(part);
      expect(i, part).toBeGreaterThan(pos);
      pos = i;
    }
  });
  it('le total du message est exactement rs(resultat.total)', () => {
    const e = entree({ lignes: [{ id: 'b', quantite: 4 }] });
    const r = calculer(e, cfg, catalogueTest);
    expect(construireMessage(r, e, client(), cfg)).toContain(`*Total : ${sp(r.total)}*`);
    expect(`Total : ${sp(r.total)}`).toBe(`Total : ${rs(r.total).replace(/ | /g, ' ')}`);
  });
  it('aucun espace insécable', () => {
    const e = entree({ lignes: [{ id: 'b', quantite: 9 }] });
    const m = construireMessage(calculer(e, cfg, catalogueTest), e, client(), cfg);
    expect(m).not.toMatch(/[  ]/);
    expect(m).toContain('3 600 Rs');
  });
  it('livraison : zone, adresse, frais ; offerte', () => {
    const e = entree({ mode: 'livraison', zoneId: 'proche', lignes: [{ id: 'b', quantite: 5 }] });
    const c = configTest(); c.remises.quantite.actif = false;
    let r = calculer(e, c, catalogueTest); // 2000 ≥ 1500
    let m = construireMessage(r, e, client({ adresse: '12 rue des Fleurs' }), c);
    expect(m).toContain('Livraison — Proche');
    expect(m).toContain('Adresse : 12 rue des Fleurs');
    expect(m).toContain('Frais de livraison : Offerte');
    const e2 = entree({ mode: 'livraison', zoneId: 'proche' });
    r = calculer(e2, c, catalogueTest);
    m = construireMessage(r, e2, client({ adresse: 'x' }), c);
    expect(m).toContain('Frais de livraison : 70 Rs');
  });
  it('pas de ligne sous-vide, de remarque ni de remise si absentes', () => {
    const e = entree();
    const m = construireMessage(calculer(e, cfg, catalogueTest), e, client(), cfg);
    expect(m).not.toContain('Sous vide');
    expect(m).not.toContain('Remarque');
    expect(m).not.toContain('−');
  });
});

describe('lienWhatsApp', () => {
  it('encode accents, emoji et retours à la ligne', () => {
    const msg = 'Bonjour 🍕\nÉté & café';
    const lien = lienWhatsApp(msg, cfg)!;
    expect(lien.startsWith('https://wa.me/23050000000?text=')).toBe(true);
    expect(lien).toContain('%0A');
    expect(lien).not.toMatch(/[\s🍕é]/u);
    expect(decodeURIComponent(lien.split('?text=')[1])).toBe(msg);
  });
  it('numéro nettoyé, vide → null', () => {
    expect(lienWhatsApp('x', configTest({ whatsapp: '+230 5000-0000' }))).toBe('https://wa.me/23050000000?text=x');
    expect(lienWhatsApp('x', configTest({ whatsapp: '' }))).toBeNull();
    expect(lienWhatsApp('x', configTest({ whatsapp: ' +- ' }))).toBeNull();
  });
});

describe('validerCommande', () => {
  const v = (e = entree(), cl = client(), c = cfg) =>
    validerCommande(calculer(e, c, catalogueTest), e, cl, maintenant, c);
  it('commande valide → aucune erreur', () => {
    expect(v()).toEqual([]);
  });
  it('panier vide', () => {
    expect(v(entree({ lignes: [] }))).toContain('Votre panier est vide.');
  });
  it('nom et téléphone', () => {
    expect(v(entree(), client({ nom: '  ' })).join()).toContain('nom');
    expect(v(entree(), client({ telephone: '' })).join()).toContain('téléphone');
    expect(v(entree(), client({ telephone: '12 34' })).join()).toContain('incomplet');
    expect(v(entree(), client({ telephone: '+230 5700 1234' }))).toEqual([]);
  });
  it('date absente, invalide ou passée', () => {
    expect(v(entree(), client({ date: '' }))).toContain('Choisissez une date.');
    expect(v(entree(), client({ date: '2026-11-17' })).join()).toContain('date choisie');
    expect(v(entree(), client({ date: '2026-11-12' })).join()).toContain('date choisie');
  });
  it('livraison : zone, adresse, désactivée', () => {
    const liv = entree({ mode: 'livraison', zoneId: null });
    expect(v(liv, client({ adresse: 'x' })).join()).toContain('zone de livraison');
    expect(v(entree({ mode: 'livraison', zoneId: 'zzz' }), client({ adresse: 'x' })).join()).toContain('zone de livraison');
    expect(v(entree({ mode: 'livraison', zoneId: 'proche' }), client({ adresse: ' ' })).join()).toContain('adresse');
    expect(v(entree({ mode: 'livraison', zoneId: 'proche' }), client({ adresse: 'x' }))).toEqual([]);
    const c = configTest(); c.livraison.actif = false;
    expect(v(entree({ mode: 'livraison', zoneId: 'proche' }), client({ adresse: 'x' }), c).join()).toContain("n'est pas proposée");
  });
  it('retrait : adresse non exigée', () => {
    expect(v(entree(), client({ adresse: '' }))).toEqual([]);
  });
  it('numéro WhatsApp non configuré', () => {
    expect(v(entree(), client(), configTest({ whatsapp: '' })).join()).toContain('WhatsApp');
  });
});
