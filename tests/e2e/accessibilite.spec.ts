import { expect, test } from '@playwright/test';
import { semerPanier, tiroirPret } from './aide';

const PAGES = ['', 'carte/', 'comment-ca-marche/', 'contact/', 'commande/'];

for (const c of PAGES) {
  test(`images avec alt et lien d’évitement : ${c || 'accueil'}`, async ({ page }) => {
    await page.goto(c);
    const sansAlt = await page.$$eval('img', (is) => is.filter((i) => !i.hasAttribute('alt')).map((i) => i.src));
    expect(sansAlt).toEqual([]);
    await expect(page.getByRole('link', { name: 'Aller au contenu' })).toHaveAttribute('href', '#contenu');
    await expect(page.locator('#contenu')).toHaveCount(1);
  });
}

test('champs du formulaire de commande : libellé accessible', async ({ page }) => {
  await semerPanier(page, { lignes: [{ id: 'thon', quantite: 1 }], mode: 'livraison' });
  await page.goto('commande/');
  await expect(page.getByRole('heading', { name: 'Récapitulatif' })).toBeVisible();
  const champs = page.locator('form.commande').locator('input:not([type=hidden]), select, textarea');
  const n = await champs.count();
  expect(n).toBeGreaterThan(5);
  for (let i = 0; i < n; i++) {
    const nom = await champs.nth(i).evaluate((e) => {
      const el = e as HTMLInputElement;
      return (el.labels?.[0]?.textContent || el.getAttribute('aria-label') || '').trim();
    });
    expect(nom.length, `champ #${i} sans libellé`).toBeGreaterThan(0);
  }
  for (const l of ['Nom et prénom', 'Téléphone', 'Remarque']) await expect(page.getByLabel(new RegExp(l, 'i')).first()).toBeVisible();
});

test('clavier : ajouter une pizza puis ouvrir le panier', async ({ page, isMobile }) => {
  test.skip(isMobile, 'parcours clavier : bureau');
  await page.goto('carte/');
  await tiroirPret(page);
  await page.getByRole('button', { name: 'Ajouter au panier' }).first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.panier-bouton__nombre')).toHaveText('1');
  await page.getByRole('link', { name: /^Panier/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Votre panier' })).toBeVisible();
  await page.keyboard.press('Escape');
});
