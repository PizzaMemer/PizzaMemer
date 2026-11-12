# Architecture — Pizza Memer (document de référence des agents)

## Décisions structurantes
- **Astro (sortie 100 % statique)** : 4 pages de contenu servies en HTML pur → référencement local et
  Lighthouse excellents, compatible GitHub Pages sans astuce de routage (contrairement à une SPA React).
- **Îlots Preact (3 Ko)** uniquement pour ce qui est interactif : boutons d'ajout, tiroir panier, formulaire
  de commande. Pas de React, pas de Tailwind (CSS natif + jetons `src/styles/tokens.css`).
- **Données ≠ interface** : `src/config/pizzas.ts` (carte) et `src/config/commerce.ts` (règles, coordonnées).
  Aucun prix, numéro, zone ou jour écrit en dur ailleurs.
- **Un seul calcul** : `calculer()` dans `src/lib/pricing.ts`, pur et testé. L'affichage du panier ET le
  message WhatsApp consomment le même `ResultatCalcul` → montants forcément identiques.
- **PDF et QR générés au build** par des endpoints Astro à partir des mêmes données (pdfkit, qrcode).
- **Chemin de base** : toujours préfixer les liens internes avec `import.meta.env.BASE_URL`
  (helper `url()` dans `src/lib/url.ts`). Jamais de lien commençant par `/` en dur.
- Fuseau : toutes les dates sont calculées en heure de Maurice (`Indian/Mauritius`).

## Pages
`/` accueil · `/carte/` catalogue · `/comment-ca-marche/` · `/contact/` · `/commande/` (panier complet +
formulaire + envoi WhatsApp) · `/carte.pdf` · `/qr/…` (visuels QR). Le QR pointe vers `/carte/`.

## Propriété des fichiers
| Zone | Propriétaire |
|---|---|
| `src/lib/types.ts`, `src/config/*`, `src/styles/tokens.css`, `astro.config.mjs`, `docs/ARCHITECTURE.md` | orchestrateur |
| `src/lib/pricing.ts`, `dates.ts`, `whatsapp.ts`, `cart.ts`, `format.ts`, `catalogue.ts` + `tests/unit/**` | dev-fonctionnel |
| `src/layouts/**`, `src/components/**`, `src/pages/*.astro`, `src/styles/*.css` (sauf tokens), `src/lib/url.ts` | dev-frontend |
| `src/content/textes.ts` | redacteur |
| `src/pages/carte.pdf.ts`, `src/pages/qr/**`, `src/lib/pdf/**`, `tests/unit/qr.test.ts`, `tests/unit/pdf.test.ts` | dev-fonctionnel (lot PDF/QR) |
| `src/lib/seo.ts`, `public/robots.txt`, `src/components/Seo.astro` | seo |
| `tests/e2e/**`, `playwright.config.ts` | testeur-qa |

## Règles non négociables
1. Ne rien inventer : ni prix, ni ingrédient, ni allergène, ni horaire, ni avis client, ni consigne de
   cuisson/conservation. Une donnée vide dans la config = élément non affiché.
2. Pas de photo de pizza fabriquée. Sans photo réelle (`photo: null`), afficher l'illustration
   vectorielle `PizzaIllustration` — clairement un dessin, jamais un faux cliché.
3. Ouvrir WhatsApp ≠ commande confirmée. Le site le dit explicitement et ne vide pas le panier
   automatiquement à l'ouverture du lien.
4. Aucun délai minimum de 24 h imposé.
5. Français partout (interface, commentaires utiles au gérant, noms de fonctions métier).
