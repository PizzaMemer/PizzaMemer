# Mettre le site en ligne

Le site est publié sur GitHub Pages par GitHub Actions, avec le fichier `.github/workflows/deploy.yml`.
À chaque modification de la branche `main`, GitHub teste le site, le construit, puis le publie.

Adresse finale du site : **https://pizzamemer.github.io/PizzaMemer/**

## Première mise en ligne (à faire une seule fois)

### a. Fusionner la branche de travail dans `main`

La branche de travail est celle où les fichiers du nouveau site ont été préparés. Sur github.com :

1. Ouvrez le dépôt, puis l'onglet **Pull requests**, puis **New pull request**.
2. Vérifiez que la destination (base) est `main` et que la source (compare) est la branche de travail.
3. Cliquez sur **Create pull request**, puis sur **Merge pull request**, puis sur **Confirm merge**.

Dès que la fusion est faite, la mise en ligne se déclenche.

### b. Régler GitHub Pages sur « GitHub Actions » (réglage unique)

1. Dans le dépôt, ouvrez **Settings**, puis **Pages**.
2. Dans la rubrique « Build and deployment », à **Source**, choisissez **GitHub Actions**.

Ce réglage est indispensable. Aujourd'hui, le site est servi directement depuis une branche, qui cherche un fichier `index.html` à la racine du dépôt. Il n'y en a plus : sans ce changement, la mise en ligne ne fonctionnera pas.

### c. Ce que fait le workflow

À chaque modification de `main`, le workflow :

1. installe les composants du site (Node.js 22) ;
2. lance les tests automatiques (`npm test`) ;
3. construit le site (`npm run build`) ;
4. publie le résultat sur GitHub Pages.

Si un test échoue, rien n'est publié : le site en ligne reste sur la version précédente.

Pour lancer la mise en ligne à la main, ouvrez l'onglet **Actions**, cliquez sur **Publier le site**, puis sur **Run workflow**.

### d. Vérifier la mise en ligne

1. Ouvrez l'onglet **Actions** du dépôt.
2. La dernière exécution doit avoir une coche verte. Une croix rouge signale un échec : ouvrez-la pour lire le message.
3. Ouvrez https://pizzamemer.github.io/PizzaMemer/ dans un navigateur. La mise en ligne peut prendre quelques minutes.
4. Vérifiez les pages principales : `/carte/`, `/comment-ca-marche/`, `/contact/`, `/commande/`.

## QR code

### Où pointe le QR code

Le QR code pointe vers la page carte : **https://pizzamemer.github.io/PizzaMemer/carte/**

### Les fichiers à imprimer

Une fois le site en ligne, ces fichiers sont générés automatiquement :

| Fichier | Contenu |
|---|---|
| `https://pizzamemer.github.io/PizzaMemer/qr/etiquette.pdf` | Planche A4 de 12 étiquettes de 60 × 60 mm, avec repères de coupe. La deuxième page contient une étiquette seule. |
| `https://pizzamemer.github.io/PizzaMemer/qr/etiquette.png` | Une étiquette, en image |
| `https://pizzamemer.github.io/PizzaMemer/qr/carte.png` | Le QR code seul, en image |
| `https://pizzamemer.github.io/PizzaMemer/qr/carte.svg` | Le QR code seul, en vectoriel (à utiliser pour un imprimeur) |

Dans les étiquettes fournies, le QR code mesure 34 mm, au-dessus du minimum.

### Taille d'impression

- Si vous imprimez le QR code seul : **25 mm de côté** est la taille recommandée.
- Ne descendez jamais **sous 22 mm**. Cette taille minimale a été testée sur carton kraft.

### Attention : ne plus changer l'adresse

Après impression des QR codes sur les boîtes, **ne modifiez plus** :

- l'adresse `urlSite` dans `src/config/commerce.ts` ;
- le nom du dépôt (`PizzaMemer`), qui fait partie de l'adresse.

Sinon, les QR codes déjà imprimés ne fonctionneront plus.

Si un nom de domaine est acheté un jour, gardez l'ancienne adresse `pizzamemer.github.io/PizzaMemer/` active.

## Revenir en arrière

L'ancien site est conservé dans le dossier `legacy/` :

- `legacy/index.html` : l'ancien site
- `legacy/index-ancienne-copie.html` : une autre version de l'ancien site

Ne supprimez pas ce dossier.

Pour remettre l'ancien site en ligne, il faudrait le replacer à la racine du dépôt et remettre le réglage Pages sur « Deploy from a branch ». Cette opération demande un développeur.

## Liens utiles

- `docs/MODIFIER-LA-CARTE.md` : modifier la carte, les prix et les textes
- `docs/ARCHITECTURE.md` : document technique, pour les développeurs
