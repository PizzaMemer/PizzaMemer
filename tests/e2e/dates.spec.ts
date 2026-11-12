import { expect, test, type Page } from '@playwright/test';
import { commerce } from '../../src/config/commerce';

const JOURS = commerce.distribution.jours;
const jourDe = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();

async function valeurs(page: Page) {
  await expect(page.locator('input[name="date"]').first()).toBeAttached();
  return page.locator('input[name="date"]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
}
async function avecPanier(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem('pizzamemer.panier.v1', JSON.stringify({ lignes: [{ id: 'thon', quantite: 1 }], mode: 'retrait', zoneId: null, sousVide: false, codePromo: '', client: { nom: '', telephone: '', adresse: '', date: '', remarque: '' } })),
  );
}

test('dates réelles : jours de distribution, aucune dans le passé', async ({ page }) => {
  await avecPanier(page);
  await page.goto('commande/');
  const v = await valeurs(page);
  expect(v).toHaveLength(commerce.distribution.nombreDatesProposees);
  const auj = new Date(Date.now() + 4 * 3600_000).toISOString().slice(0, 10);
  for (const iso of v) {
    expect(JOURS).toContain(jourDe(iso));
    expect(iso >= auj, `${iso} est dans le passé`).toBe(true);
  }
});

test('mercredi : le jour même n’est pas proposé', async ({ page }) => {
  await avecPanier(page);
  await page.clock.setFixedTime(new Date('2026-11-18T06:00:00Z'));
  await page.goto('commande/');
  const v = await valeurs(page);
  expect(v[0]).toBe('2026-11-19');
  expect(v).not.toContain('2026-11-18');
  for (const iso of v) expect(JOURS).toContain(jourDe(iso));
  await expect(page.getByText('Aujourd’hui', { exact: true })).toHaveCount(0);
});

test('jeudi : le jour même est proposé avec sa mention', async ({ page }) => {
  await avecPanier(page);
  await page.clock.setFixedTime(new Date('2026-11-19T06:00:00Z'));
  await page.goto('commande/');
  const v = await valeurs(page);
  expect(v[0]).toBe('2026-11-19');
  const jourMeme = page.locator('label.date').first();
  await expect(jourMeme).toContainText('Aujourd’hui');
  await jourMeme.click();
  await expect(page.getByText(commerce.distribution.mentionJourMeme)).toBeVisible();
});
