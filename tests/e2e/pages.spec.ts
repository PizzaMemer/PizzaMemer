import { expect, test, type Page } from '@playwright/test';
import { BASE } from './aide';

const PAGES: { chemin: string; nom: string; statut: number }[] = [
  { chemin: '', nom: 'accueil', statut: 200 },
  { chemin: 'carte/', nom: 'carte', statut: 200 },
  { chemin: 'comment-ca-marche/', nom: 'comment-ca-marche', statut: 200 },
  { chemin: 'contact/', nom: 'contact', statut: 200 },
  { chemin: 'commande/', nom: 'commande', statut: 200 },
  { chemin: 'cette-page-nexiste-pas/', nom: '404', statut: 404 },
];

async function liensInternes(page: Page): Promise<string[]> {
  return page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') ?? ''));
}

for (const p of PAGES) {
  test(`page ${p.nom} : statut, structure, ressources, débordement`, async ({ page, request }) => {
    const erreurs: string[] = [];
    const echecs: string[] = [];
    page.on('console', (m) => m.type() === 'error' && !(p.statut === 404 && /status of 404/.test(m.text())) && erreurs.push(m.text()));
    page.on('pageerror', (e) => erreurs.push(String(e)));
    page.on('requestfailed', (r) => echecs.push(`${r.url()} ${r.failure()?.errorText}`));
    page.on('response', (r) => {
      if (r.url().startsWith('http://localhost') && r.status() >= 400 && r.request().resourceType() !== 'document') echecs.push(`${r.status()} ${r.url()}`);
    });

    const rep = await page.goto(p.chemin);
    expect(rep?.status()).toBe(p.statut);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toHaveCount(1);
    expect((await page.title()).trim().length).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(erreurs, 'erreurs console').toEqual([]);
    expect(echecs, 'requêtes en échec').toEqual([]);

    // Compatibilité GitHub Pages : tous les liens internes portent le chemin de base et répondent 200.
    const hrefs = await liensInternes(page);
    const aTester = new Set<string>();
    for (const h of hrefs) {
      if (h.startsWith('#') || h.startsWith('tel:') || h.startsWith('mailto:') || h.startsWith('https:')) continue;
      expect(h.startsWith(BASE), `lien sans chemin de base : ${h}`).toBe(true);
      aTester.add(h.split('#')[0]);
    }
    for (const h of aTester) {
      const r = await request.get(h);
      expect(r.status(), `lien ${h}`).toBe(200);
    }
  });
}
