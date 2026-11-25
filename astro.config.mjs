import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import { commerce } from './src/config/commerce.ts';

// Adresse publique. En déploiement GitHub Pages, le workflow fournit SITE_URL et BASE_PATH
// automatiquement ; en local on retombe sur l'adresse actuelle du site.
const site = process.env.SITE_URL ?? 'https://pizzamemer.github.io';
const base = process.env.BASE_PATH ?? '/PizzaMemer';

// Statistiques GoatCounter : autorisées par la politique de sécurité seulement si un compte est configuré.
const goatcounter = /^[a-z0-9-]+$/i.test(commerce.statistiques.goatcounter)
  ? `https://${commerce.statistiques.goatcounter}.goatcounter.com`
  : null;

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [preact(), sitemap()],
  build: { format: 'directory' },
  // Politique de sécurité du contenu (CSP) : le navigateur refuse tout script, image ou connexion
  // qui ne vient pas du site lui-même ou des services listés ici. Astro ajoute automatiquement
  // les empreintes de ses propres scripts et styles. Voir docs/SECURITE.md.
  security: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        `connect-src 'self'${goatcounter ? ` ${goatcounter}` : ''}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "manifest-src 'self'",
        'upgrade-insecure-requests',
      ],
      styleDirective: {
        resources: [
          "'self'",
          // Attributs style="--i:0" (variables CSS d'animation) : sans risque d'exécution de code.
          { resource: "'unsafe-inline'", kind: 'attribute' },
        ],
      },
      scriptDirective: {
        resources: ["'self'", ...(goatcounter ? ['https://gc.zgo.at'] : [])],
        // Script en ligne du <head> qui marque la page « JS actif » (BaseLayout.astro).
        // Si vous modifiez ce script, son empreinte doit être recalculée.
        hashes: ['sha256-/x7W7R75k8Roq0WaVRQX9blP4OufE5xbAdzklGxsgpw='],
      },
    },
  },
});
