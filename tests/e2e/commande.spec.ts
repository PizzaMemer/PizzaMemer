import { expect, test, type Page } from '@playwright/test';
import { commerce } from '../../src/config/commerce';
import { libelleDate } from '../../src/lib/dates';
import { norm, semerPanier, totalAffiche, zone } from './aide';

async function espionWhatsApp(page: Page) {
  await page.addInitScript(() => {
    (window as any).__ouvertures = [];
    window.open = ((u: string) => {
      (window as any).__ouvertures.push(String(u));
      return null;
    }) as typeof window.open;
  });
}
const ouvertures = (page: Page) => page.evaluate(() => (window as any).__ouvertures as string[]);

test('envoi avec formulaire vide : erreurs visibles, rien d’ouvert', async ({ page }) => {
  await espionWhatsApp(page);
  await semerPanier(page, { lignes: [{ id: 'margherita', quantite: 1 }] });
  await page.goto('commande/');
  await page.getByRole('button', { name: /WhatsApp/ }).first().click();
  const alerte = page.getByRole('alert');
  await expect(alerte).toBeVisible();
  await expect(alerte).toContainText('Indiquez votre nom');
  await expect(alerte).toContainText('téléphone');
  await expect(alerte).toContainText('Choisissez une date');
  expect(await ouvertures(page)).toEqual([]);
});

test('commande complète en livraison : lien WhatsApp et message cohérents', async ({ page }) => {
  await espionWhatsApp(page);
  await semerPanier(page, { lignes: [{ id: 'margherita', quantite: 2 }, { id: 'thon', quantite: 1 }] });
  await page.goto('commande/');
  await expect(page.getByRole('heading', { name: 'Récapitulatif' })).toBeVisible();

  await page.getByRole('radio', { name: 'Livraison' }).check();
  const z = zone('bain-boeuf');
  await page.locator('#zone').selectOption(z.id);
  await page.locator('#adresse').fill('12 rue des Flamboyants, Bain Bœuf');
  const iso = await page.locator('input[name="date"]').first().getAttribute('value');
  await page.locator('label.date').first().click();
  await page.locator('#nom').fill('Test Qualité');
  await page.locator('#tel').fill('5712 3456');
  await page.locator('#remarque').fill('Sonnez deux fois svp');

  const totalPage = norm(await totalAffiche(page).innerText());
  await page.getByRole('button', { name: /WhatsApp/ }).first().click();

  const ouv = await ouvertures(page);
  expect(ouv).toHaveLength(1);
  expect(ouv[0].startsWith(`https://wa.me/${commerce.whatsapp}?text=`)).toBe(true);
  const texte = decodeURIComponent(ouv[0].split('?text=')[1]);

  expect(texte).toContain('Test Qualité');
  expect(texte).toMatch(/2 × Margherita/);
  expect(texte).toMatch(/1 × Thon/);
  expect(texte).toContain(z.nom);
  expect(texte).toContain('12 rue des Flamboyants, Bain Bœuf');
  expect(texte).toContain(libelleDate(iso!));
  expect(texte).toContain('Sonnez deux fois svp');
  const total = /\*Total : ([^*]+)\*/.exec(texte)?.[1];
  expect(norm(total!)).toBe(totalPage);

  const apres = page.locator('.apres');
  await expect(apres).toBeVisible();
  await expect(apres).toContainText('Votre panier est conservé');
  await expect(page.locator('.recap__lignes li')).toHaveCount(2);
  const corps = (await page.locator('body').innerText()).toLowerCase();
  expect(corps).not.toMatch(/commande (est |a bien été |a été )?(confirmée|envoyée|enregistrée|reçue)|merci pour votre commande/);
  expect((await apres.innerText()).toLowerCase()).not.toContain('confirmée');
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('pizzamemer.panier.v1')))!).lignes).toHaveLength(2);
});
