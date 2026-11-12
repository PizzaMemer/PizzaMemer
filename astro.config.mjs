import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

// Adresse publique. En déploiement GitHub Pages, le workflow fournit SITE_URL et BASE_PATH
// automatiquement ; en local on retombe sur l'adresse actuelle du site.
const site = process.env.SITE_URL ?? 'https://pizzamemer.github.io';
const base = process.env.BASE_PATH ?? '/PizzaMemer';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [preact(), sitemap()],
  build: { format: 'directory' },
});
