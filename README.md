# Pizza Memer — le site

Le site de Pizza Memer (pizzas napolitaines artisanales, Péreybère, île Maurice).
Il présente la carte et permet au client de préparer son panier, puis d'envoyer sa commande par WhatsApp.

- Le client compose son panier sur la page `/commande/`. Le total est calculé par le site.
- Ouvrir WhatsApp ne vaut pas commande confirmée : le site le dit au client. Vous confirmez ensuite sur WhatsApp.
- La carte PDF et les étiquettes QR sont générées automatiquement à partir des mêmes données.

Adresse publique : https://pizzamemer.github.io/PizzaMemer/

## Les pages

| Adresse (après `PizzaMemer/`) | Contenu |
|---|---|
| `/` | Accueil |
| `/carte/` | La carte des pizzas |
| `/comment-ca-marche/` | Cuisson, conservation, congélation |
| `/contact/` | Coordonnées et WhatsApp |
| `/commande/` | Panier, formulaire, envoi WhatsApp |
| `/carte.pdf` | La carte en PDF |
| `/qr/…` | Visuels QR (voir `docs/DEPLOIEMENT.md`) |

## Où modifier quoi

| Ce que je veux changer | Fichier |
|---|---|
| Un prix, des ingrédients, ajouter ou masquer une pizza, une photo de pizza, une étiquette « Nouveau » | `src/config/pizzas.ts` |
| Frais et zones de livraison, seuil de livraison offerte, sous-vide, remise par quantité, codes promo | `src/config/commerce.ts` |
| Jours de distribution, fermetures, heure limite du jour même | `src/config/commerce.ts` |
| Numéro WhatsApp, lien Facebook, lien Google Maps, adresse du retrait, horaires | `src/config/commerce.ts` |
| Consignes de conservation et de congélation | `src/config/commerce.ts` (bloc `preparation`) |
| Un texte du site (accueil, carte, contact, etc.) | `src/content/textes.ts` |
| Photo du haut de l'accueil | déposer `hero.jpg` dans `src/assets/brand/` |
| Logo | déposer `logo.svg` (ou `.png`, `.webp`) dans `src/assets/brand/` |
| Recadrage d'une photo mal centrée | `src/components/cadrages.ts` |

Le guide pas à pas, avec des exemples avant/après : `docs/MODIFIER-LA-CARTE.md`.

## Lancer le site sur son ordinateur

Cette étape n'est pas nécessaire pour modifier le site sur github.com. Elle sert à tester en local.

1. Installer Node.js, version 22.
2. Ouvrir un terminal dans le dossier du projet.
3. `npm install` (une seule fois, pour installer les composants).
4. `npm run dev` : lance le site de test. Le terminal indique l'adresse à ouvrir dans le navigateur.
5. `npm test` : lance les tests automatiques.
6. `npm run build` : construit le site final dans le dossier `dist/`.
7. `npm run preview` : affiche le site construit, pour le vérifier avant la mise en ligne.

Ces commandes sont les mêmes que celles lancées par GitHub avant chaque mise en ligne (`.github/workflows/deploy.yml`).

## Structure des dossiers

- `src/config/` : la carte (`pizzas.ts`) et les réglages commerciaux (`commerce.ts`).
- `src/content/` : les textes du site (`textes.ts`).
- `photos-reserve/` : vos photos, mises de côté (le site n'en affiche aucune ; voir `src/config/apparence.ts`).
- `src/assets/` : emplacement des photos si vous les réactivez. `pizzas/` pour les pizzas, `brand/` pour le logo et le haut de l'accueil, `ambiance/` pour les autres photos.
- `src/components/` : les morceaux d'affichage. `cadrages.ts` règle le cadrage des photos.
- `src/pages/` : une page par adresse du site.
- `src/lib/` : les calculs (prix, remises, dates, message WhatsApp, PDF, QR). À ne pas modifier sans développeur.
- `src/styles/` : couleurs (`tokens.css`), polices et mise en page.
- `tests/` : les tests automatiques.
- `public/` : icône du site, image de partage (`og.jpg`), `robots.txt`.
- `docs/` : les guides, dont celui-ci, et le document technique `ARCHITECTURE.md`.
- `legacy/` : l'ancien site, conservé pour mémoire (`legacy/index.html`). Le nouveau site ne l'utilise pas.
- `.github/workflows/` : la mise en ligne automatique.

## Documents

- `docs/MODIFIER-LA-CARTE.md` : modifier la carte, les prix, les réglages et les textes, sans rien installer.
- `docs/DEPLOIEMENT.md` : mettre le site en ligne, QR code et étiquettes à imprimer.
- `docs/ARCHITECTURE.md` : document technique à l'attention des développeurs.

## Choix techniques

- Le site est construit avec Astro, en pages statiques (HTML simple). Cela convient à GitHub Pages et au référencement local.
- Le panier et le formulaire utilisent Preact, une petite bibliothèque. Le reste est en HTML et CSS.
- Les données sont séparées de l'affichage : prix et pizzas dans `src/config/`, aucun prix écrit ailleurs.
- Le panier et le message WhatsApp utilisent le même calcul (`src/lib/pricing.ts`), donc le même total.
- À chaque modification de la branche `main`, GitHub Actions teste, construit et publie le site.
