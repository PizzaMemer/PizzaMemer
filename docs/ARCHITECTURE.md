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
2. Aucune photo sur le site (`src/config/apparence.ts`, `photos: false`) : chaque pizza a un visuel
   graphique abstrait (`illustration.ts`). Les photos du gérant sont rangées dans `photos-reserve/`.
3. Ouvrir WhatsApp ≠ commande confirmée. Le site le dit explicitement et ne vide pas le panier
   automatiquement à l'ouverture du lien.
4. Aucun délai minimum de 24 h imposé.
5. Français partout (interface, commentaires utiles au gérant, noms de fonctions métier).

## Direction artistique
Consigne du gérant : « quelque chose de plus graphique, moderne, avec des effets visuels ; pas de photos de pizza ». Parti pris : affiche contemporaine.
- **Zéro photo** : `src/config/apparence.ts` (`photos: false`) ; `marque.ts` charge les photos à la demande, donc rien n'est traité au build tant que l'interrupteur est coupé.
- **Visuel = disque vectoriel abstrait** (`illustration.ts`) : croûte ocre perlée, sauce en aplat, une forme géométrique par famille d'ingrédient (mozzarella = cercles, basilic = amandes, champignon = demi-disques, oignon = arcs, chorizo = pastilles, miel = spirale, cheddar = secteurs…), déterministe depuis `id` + `base` + ingrédients.
- **Palette** (`tokens.css`) : aplats rouge tomate / noir / crème, jaune et vert en accents ; sections pleines, contraste AA vérifié (texte blanc ou crème sur rouge, jaune sur noir).
- **Typographie** : Fraunces 900 serré, romain + italique, pour les titres et gros chiffres ; Figtree pour le texte. **Formes** : pilules (boutons, prix, étiquettes), panneaux à angles francs, filets de 3 px, ombre dure.
- **Effets** (CSS + JS natif, `transform`/`opacity`, coupés sous `prefers-reduced-motion`) : disque du héros qui tourne et suit le défilement, halo au pointeur (bureau), bandeau défilant `aria-hidden`, titres révélés mot à mot, disques qui se posent/tournent sur les cartes, compteurs, disque qui vole vers le panier, View Transitions. La page /commande/ reste sobre.
