import { expect, type Page } from '@playwright/test';
import { commerce } from '../../src/config/commerce';
import { pizzas } from '../../src/config/pizzas';
import type { EntreeCalcul } from '../../src/lib/types';

export const BASE = '/PizzaMemer/';
export const CLE = 'pizzamemer.panier.v1';
export const pizza = (id: string) => pizzas.find((p) => p.id === id)!;
export const zone = (id: string) => commerce.livraison.zones.find((z) => z.id === id)!;

/** Normalise les espaces (insécables compris) pour comparer des montants. */
export const norm = (s: string) => s.replace(/[\s  ]+/g, ' ').trim();
export const montant = (n: number) => norm(`${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Rs`);

/** Attend que le tiroir du panier soit hydraté. */
export async function tiroirPret(page: Page) {
  await page.waitForFunction(() => (window as any).__tiroirPret === true);
}

/** Pré-remplit le panier (une seule fois, sans écraser une modification ultérieure). */
export async function semerPanier(page: Page, etat: Partial<{ lignes: { id: string; quantite: number }[]; mode: string; zoneId: string | null; sousVide: boolean; client: Record<string, string> }>) {
  await page.addInitScript(
    ([cle, e]) => {
      if (!localStorage.getItem(cle as string)) {
        localStorage.setItem(
          cle as string,
          JSON.stringify({ lignes: [], mode: 'retrait', zoneId: null, sousVide: false, codePromo: '', client: { nom: '', telephone: '', adresse: '', date: '', remarque: '' }, ...(e as object) }),
        );
      }
    },
    [CLE, etat] as const,
  );
}

export function entree(p: Partial<EntreeCalcul>): EntreeCalcul {
  return { lignes: [], mode: 'retrait', zoneId: null, sousVide: false, codePromo: '', aujourdhui: new Date().toISOString().slice(0, 10), ...p };
}

export async function ajouterCarte(page: Page, nom: string, quantite: number) {
  const carte = page.locator('article.plat').filter({ has: page.getByRole('heading', { name: nom, exact: true }) });
  await carte.getByRole('textbox', { name: /Quantité/ }).fill(String(quantite));
  await carte.getByRole('button', { name: 'Ajouter au panier' }).click();
  await expect(carte.getByRole('button', { name: /Ajoutée au panier/ })).toBeVisible();
}

export const totalAffiche = (page: Page) => page.locator('.commande__recap .totaux__total dd');
