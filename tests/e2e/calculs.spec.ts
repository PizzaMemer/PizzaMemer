import { expect, test, type Page } from '@playwright/test';
import { calculer } from '../../src/lib/pricing';
import { commerce } from '../../src/config/commerce';
import { entree, montant, norm, semerPanier, totalAffiche, zone } from './aide';

type L = { id: string; quantite: number };

async function ouvrir(page: Page, lignes: L[], extra: Record<string, unknown> = {}) {
  await semerPanier(page, { lignes, ...extra });
  await page.goto('commande/');
  await expect(page.getByRole('heading', { name: 'Récapitulatif' })).toBeVisible();
}
const recap = (page: Page) => page.locator('.commande__recap');
const ligne = (page: Page, dt: RegExp) => recap(page).locator('.totaux > div').filter({ has: page.locator('dt', { hasText: dt }) });

const trois: L[] = [{ id: 'margherita', quantite: 2 }, { id: 'thon', quantite: 1 }];
const quatre: L[] = [{ id: 'margherita', quantite: 2 }, { id: 'thon', quantite: 2 }];

test('3 pizzas : aucune remise', async ({ page }) => {
  const r = calculer(entree({ lignes: trois }));
  expect(r.remises).toHaveLength(0);
  await ouvrir(page, trois);
  await expect(page.locator('.totaux__remise')).toHaveCount(0);
  await expect(totalAffiche(page)).toHaveText(montant(r.total));
});

test('4 pizzas : ligne de remise 10 %', async ({ page }) => {
  const r = calculer(entree({ lignes: quatre }));
  expect(r.remises).toHaveLength(1);
  await ouvrir(page, quatre);
  const remise = page.locator('.totaux__remise');
  await expect(remise).toHaveCount(1);
  await expect(remise.locator('dt')).toContainText(`${commerce.remises.quantite.pourcentage} %`);
  await expect(remise.locator('dd')).toHaveText(`−${montant(r.totalRemises)}`);
  await expect(totalAffiche(page)).toHaveText(montant(r.total));
});

test('retrait : pas de frais de livraison', async ({ page }) => {
  const r = calculer(entree({ lignes: trois, mode: 'retrait' }));
  expect(r.livraison.frais).toBe(0);
  await ouvrir(page, trois, { mode: 'retrait' });
  await expect(ligne(page, /Livraison/)).toHaveCount(0);
  await expect(totalAffiche(page)).toHaveText(montant(r.sousTotal));
});

test('livraison Bain Bœuf : frais de la zone', async ({ page }) => {
  const z = zone('bain-boeuf');
  const r = calculer(entree({ lignes: trois, mode: 'livraison', zoneId: z.id }));
  expect(r.livraison.frais).toBe(z.frais ?? commerce.livraison.fraisStandard);
  await ouvrir(page, trois, { mode: 'livraison', zoneId: z.id });
  await expect(ligne(page, /Livraison/).locator('dd')).toHaveText(montant(r.livraison.frais));
  await expect(totalAffiche(page)).toHaveText(montant(r.total));
});

test('livraison Péreybère sous le seuil : frais appliqués', async ({ page }) => {
  const z = zone('pereybere');
  const sous = calculer(entree({ lignes: trois, mode: 'livraison', zoneId: z.id }));
  expect(sous.livraison.offerte).toBe(false);
  await ouvrir(page, trois, { mode: 'livraison', zoneId: z.id });
  await expect(ligne(page, /Livraison/).locator('dd')).toHaveText(montant(sous.livraison.frais));
  await expect(totalAffiche(page)).toHaveText(montant(sous.total));
});

test('livraison Péreybère au-dessus du seuil : « Offerte »', async ({ page }) => {
  const z = zone('pereybere');
  const gros: L[] = [{ id: 'burger', quantite: 8 }];
  const r = calculer(entree({ lignes: gros, mode: 'livraison', zoneId: z.id }));
  expect(r.livraison.offerte).toBe(true);
  await ouvrir(page, gros, { mode: 'livraison', zoneId: z.id });
  await expect(ligne(page, /Livraison/).locator('dd')).toHaveText('Offerte');
  await expect(totalAffiche(page)).toHaveText(montant(r.total));
});

test('option sous-vide : prix par pizza × nombre de pizzas', async ({ page }) => {
  const r = calculer(entree({ lignes: trois, sousVide: true }));
  expect(r.sousVide).toBe(commerce.sousVide.prixParPizza * 3);
  await ouvrir(page, trois);
  await page.getByRole('checkbox', { name: new RegExp(commerce.sousVide.libelle) }).check();
  await expect(ligne(page, /Sous vide/).locator('dd')).toHaveText(montant(r.sousVide));
  await expect(totalAffiche(page)).toHaveText(montant(r.total));
  expect(norm(await totalAffiche(page).innerText())).toBe(montant(r.total));
});
