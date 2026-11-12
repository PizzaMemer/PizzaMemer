import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CLE = 'pizzamemer.panier.v1';
type Ecouteur = (ev: { key: string | null }) => void;

function installerWindow(initial: Record<string, string> = {}, casse = false) {
  const data = new Map(Object.entries(initial));
  const ecouteurs: Ecouteur[] = [];
  const localStorage = {
    getItem: (k: string) => {
      if (casse) throw new Error('stockage bloqué');
      return data.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (casse) throw new Error('quota');
      data.set(k, v);
    },
    removeItem: (k: string) => void data.delete(k),
  };
  (globalThis as any).window = {
    localStorage,
    addEventListener: (nom: string, fn: Ecouteur) => nom === 'storage' && ecouteurs.push(fn),
  };
  return { data, ecouteurs };
}

async function charger() {
  vi.resetModules();
  return import('../../src/lib/cart');
}

beforeEach(() => {
  delete (globalThis as any).window;
});
afterEach(() => {
  delete (globalThis as any).window;
});

describe('cart', () => {
  it('SSR : aucune erreur sans window', async () => {
    const c = await charger();
    expect(c.lirePanier().lignes).toEqual([]);
    expect(() => { c.ajouter('a'); c.majClient({ nom: 'x' }); c.vider(); }).not.toThrow();
    const off = c.abonner(() => {});
    off();
  });

  it('état initial', async () => {
    installerWindow();
    const c = await charger();
    expect(c.lirePanier()).toEqual({
      lignes: [], mode: 'retrait', zoneId: null, sousVide: false, codePromo: '',
      client: { nom: '', telephone: '', adresse: '', date: '', remarque: '' },
    });
    expect(c.nombreArticles()).toBe(0);
  });

  it('ajouter, quantité, retirer, vider, compteur', async () => {
    const { data } = installerWindow();
    const c = await charger();
    c.ajouter('a');
    c.ajouter('a', 2);
    c.ajouter('b');
    expect(c.lirePanier().lignes).toEqual([{ id: 'a', quantite: 3 }, { id: 'b', quantite: 1 }]);
    expect(c.nombreArticles()).toBe(4);
    c.definirQuantite('a', 7);
    expect(c.lirePanier().lignes[0].quantite).toBe(7);
    c.definirQuantite('a', 0);
    expect(c.lirePanier().lignes.map((l) => l.id)).toEqual(['b']);
    c.retirer('b');
    expect(c.lirePanier().lignes).toEqual([]);
    c.ajouter('a', 500);
    expect(c.lirePanier().lignes[0].quantite).toBe(99);
    c.ajouter('a', -1);
    c.ajouter('a', NaN);
    expect(c.lirePanier().lignes[0].quantite).toBe(99);
    c.vider();
    expect(c.lirePanier().lignes).toEqual([]);
    expect(JSON.parse(data.get(CLE)!).lignes).toEqual([]);
  });

  it('options et client persistés', async () => {
    const { data } = installerWindow();
    const c = await charger();
    c.majOptions({ mode: 'livraison', zoneId: 'z', sousVide: true, codePromo: 'X' });
    c.majClient({ nom: 'Jean' });
    c.majClient({ telephone: '123' });
    const s = JSON.parse(data.get(CLE)!);
    expect(s).toMatchObject({ mode: 'livraison', zoneId: 'z', sousVide: true, codePromo: 'X' });
    expect(s.client).toMatchObject({ nom: 'Jean', telephone: '123' });
  });

  it('relecture depuis le stockage', async () => {
    installerWindow({ [CLE]: JSON.stringify({ lignes: [{ id: 'a', quantite: 2 }], mode: 'livraison', client: { nom: 'Z' } }) });
    const c = await charger();
    expect(c.lirePanier().lignes).toEqual([{ id: 'a', quantite: 2 }]);
    expect(c.lirePanier().mode).toBe('livraison');
    expect(c.lirePanier().client.nom).toBe('Z');
    expect(c.lirePanier().client.telephone).toBe('');
  });

  it('données corrompues → état initial', async () => {
    for (const brut of ['pas du json', '123', 'null', '{"lignes":"oops"}']) {
      installerWindow({ [CLE]: brut });
      const c = await charger();
      expect(c.lirePanier().lignes).toEqual([]);
      expect(c.lirePanier().mode).toBe('retrait');
    }
  });

  it('lignes invalides filtrées, mode invalide corrigé', async () => {
    installerWindow({ [CLE]: JSON.stringify({ mode: 'drone', lignes: [{ id: 'a', quantite: 1.5 }, { id: 3, quantite: 1 }, { id: 'b', quantite: -1 }, { id: 'c', quantite: 2 }, null] }) });
    const c = await charger();
    expect(c.lirePanier().lignes).toEqual([{ id: 'c', quantite: 2 }]);
    expect(c.lirePanier().mode).toBe('retrait');
  });

  it('stockage qui lève → fonctionne en mémoire', async () => {
    installerWindow({}, true);
    const c = await charger();
    expect(() => c.ajouter('a')).not.toThrow();
    expect(c.nombreArticles()).toBe(1);
  });

  it('abonnés notifiés, désabonnement', async () => {
    installerWindow();
    const c = await charger();
    const fn = vi.fn();
    const off = c.abonner(fn);
    c.ajouter('a');
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    c.ajouter('a');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('synchronisation entre onglets via storage', async () => {
    const { data, ecouteurs } = installerWindow();
    const c = await charger();
    const fn = vi.fn();
    c.abonner(fn);
    c.abonner(() => {});
    expect(ecouteurs).toHaveLength(1);
    data.set(CLE, JSON.stringify({ lignes: [{ id: 'z', quantite: 4 }] }));
    ecouteurs[0]({ key: CLE });
    expect(c.lirePanier().lignes).toEqual([{ id: 'z', quantite: 4 }]);
    expect(fn).toHaveBeenCalledTimes(1);
    ecouteurs[0]({ key: 'autre' });
    expect(fn).toHaveBeenCalledTimes(1);
    data.clear();
    ecouteurs[0]({ key: null });
    expect(c.lirePanier().lignes).toEqual([]);
  });
});
