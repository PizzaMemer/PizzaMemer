import { expect, test } from '@playwright/test';
import { ajouterCarte, BASE, CLE, tiroirPret, pizza, montant } from './aide';

test.describe('menu mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'menu burger : mobile uniquement');

  test('s’ouvre, se ferme et navigue', async ({ page }) => {
    await page.goto('');
    const burger = page.getByRole('button', { name: 'Menu' });
    const lien = page.locator('#menu-principal').getByRole('link', { name: 'La carte' });
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    await expect(lien).toBeHidden();
    await burger.click();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    await expect(lien).toBeVisible();
    await burger.click();
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    await expect(lien).toBeHidden();
    await burger.click();
    await lien.click();
    await expect(page).toHaveURL(`${BASE}carte/`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('panier', () => {
  test('ajout depuis la carte, compteur, persistance, tiroir', async ({ page }) => {
    await page.goto('carte/');
    await tiroirPret(page);
    await ajouterCarte(page, 'Margherita', 2);
    await ajouterCarte(page, 'Thon', 1);
    const compteur = page.locator('.panier-bouton__nombre');
    await expect(compteur).toHaveText('3');

    // persistance : rechargement puis autre page
    await page.reload();
    await expect(page.locator('.panier-bouton__nombre')).toHaveText('3');
    await page.goto('contact/');
    await expect(page.locator('.panier-bouton__nombre')).toHaveText('3');
    expect(JSON.parse((await page.evaluate((c) => localStorage.getItem(c), CLE))!).lignes).toEqual([
      { id: 'margherita', quantite: 2 },
      { id: 'thon', quantite: 1 },
    ]);

    // tiroir
    await tiroirPret(page);
    await page.getByRole('link', { name: /^Panier/ }).click();
    const tiroir = page.getByRole('dialog', { name: 'Votre panier' });
    await expect(tiroir).toBeVisible();
    const sousTotal = tiroir.locator('.totaux > div').first().locator('dd');
    const m = pizza('margherita').prix;
    const t = pizza('thon').prix;
    await expect(sousTotal).toHaveText(montant(2 * m + t));

    await tiroir.getByRole('button', { name: 'Ajouter une pizza : Thon' }).click();
    await expect(sousTotal).toHaveText(montant(2 * m + 2 * t));
    await tiroir.getByRole('button', { name: 'Retirer : Margherita' }).click();
    await expect(tiroir.getByText('Margherita')).toHaveCount(0);
    await expect(sousTotal).toHaveText(montant(2 * t));
    await expect(page.locator('.panier-bouton__nombre')).toHaveText('2');

    await page.keyboard.press('Escape');
    await expect(tiroir).toBeHidden();
  });
});
