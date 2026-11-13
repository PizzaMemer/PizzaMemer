# Modifier la carte et les réglages, pas à pas

Ce guide explique comment changer le site directement sur github.com, sans rien installer.
Chaque exemple montre la ligne avant, puis après la modification.

## Avant de commencer

- Tout se fait dans les fichiers du dépôt `PizzaMemer/PizzaMemer` sur github.com.
- Le site se met à jour seul après chaque enregistrement sur la branche `main`. Compter environ 2 à 3 minutes.
- Les fichiers sont écrits avec une syntaxe précise. Une virgule, une apostrophe ou un guillemet mal placé suffit à bloquer la mise en ligne. Les exemples ci-dessous respectent cette syntaxe : copiez-les tels quels.

### Les règles de syntaxe à retenir

- Chaque ligne d'une liste de réglages se termine par une virgule : `prix: 390,`
- Un texte se met entre guillemets simples : `'Mozzarella'`
- Dans un texte, utilisez l'apostrophe courbe `’` (comme dans les fichiers existants). Une apostrophe droite `'` ferme le texte et bloque tout.
  - Incorrect : `'Chèvre d'orange'`
  - Correct : `'Chèvre d’orange'`
- Les prix s'écrivent sans guillemets ni « Rs » : `prix: 390,`
- Les mots `true` (oui), `false` (non) et `null` (vide) s'écrivent sans guillemets.
- Ne supprimez pas les accolades `{ }`, les crochets `[ ]` ni les parenthèses `( )`, sauf si l'exemple le demande.

## Modifier un fichier sur github.com

1. Ouvrez le dépôt `PizzaMemer/PizzaMemer` sur github.com, connecté à votre compte.
2. Ouvrez le dossier, puis cliquez sur le fichier (par exemple `src/config/pizzas.ts`).
3. Cliquez sur le crayon (« Edit this file ») en haut à droite.
4. Modifiez le texte.
5. Cliquez sur « Commit changes… » en haut à droite. Vérifiez que « Commit directly to the main branch » est coché, puis cliquez sur « Commit changes ».

Le site, la carte PDF et les étiquettes QR se mettent à jour automatiquement en 2 à 3 minutes environ.
Les QR déjà imprimés n'ont pas besoin d'être refaits : ils pointent vers la page carte, qui se met à jour seule.

---

## Les pizzas : `src/config/pizzas.ts`

Ouvrez `src/config/pizzas.ts`. Chaque pizza est un bloc entre accolades `{ ... }`, qui commence par `id:` et se termine par `base:`.

### 1. Changer un prix

Trouvez la pizza (par son nom `nom:`), puis la ligne `prix:`.

Avant :
```
    nom: 'Thon',
    prix: 390,
```
Après :
```
    nom: 'Thon',
    prix: 410,
```

Le nouveau prix apparaît partout : site, panier, message WhatsApp et carte PDF.

### 2. Modifier les ingrédients

La ligne `ingredients:` est une liste entre crochets, séparée par des virgules.

Avant :
```
    ingredients: ['Sauce tomate', 'Thon', 'Mozzarella', 'Oignon rouge'],
```
Après (ajout d'olives) :
```
    ingredients: ['Sauce tomate', 'Thon', 'Mozzarella', 'Oignon rouge', 'Olives'],
```

Une liste vide `[]` signifie que rien n'est affiché.

### 3. Ajouter une pizza

Copiez le bloc ci-dessous, puis collez-le juste après le `},` de la dernière pizza, et avant la dernière ligne `];` du fichier. Remplacez les valeurs par les vôtres.

```
  {
    id: 'quatre-fromages',
    nom: 'Quatre Fromages',
    prix: 460,
    ingredients: ['Sauce tomate', 'Mozzarella', 'Chèvre', 'Emmental'],
    description: '',
    photo: null,
    disponible: true,
    masquee: false,
    badge: null,
    jusquau: null,
    infos: [],
    allergenes: [],
    base: 'tomate',
  },
```

- `id` : identifiant unique, en minuscules, sans espace ni accent. Il ne doit pas être identique à celui d'une autre pizza. Ensuite, ne le changez plus.
- `photo: null` : pas encore de photo. Le site affiche un visuel graphique (voir la section sur les photos).
- `base` : `'tomate'` ou `'blanche'`, pour choisir la couleur du dessin.

### 4. Marquer une pizza indisponible

La pizza reste visible, avec la mention « Indisponible », mais elle ne peut pas être commandée. À utiliser quand la pizza est en rupture pour quelque temps.

Avant :
```
    disponible: true,
```
Après :
```
    disponible: false,
```

Pour la rendre de nouveau commandable, remettez `disponible: true,`.

### 5. Masquer une pizza

La pizza disparaît complètement du site et de la carte PDF. À utiliser quand vous ne la proposez plus.

Avant :
```
    masquee: false,
```
Après :
```
    masquee: true,
```

Pour la faire réapparaître, remettez `masquee: false,`.

Différence : « indisponible » laisse la pizza visible ; « masquée » la retire.

### 6. Pizza temporaire, avec date de fin

La ligne `jusquau:` indique le dernier jour où la pizza est proposée. La date s'écrit `AAAA-MM-JJ`, entre guillemets simples. Le jour indiqué est inclus.

Avant :
```
    badge: null,
    jusquau: null,
```
Après (pizza proposée jusqu'au 31 décembre 2026 inclus) :
```
    badge: 'temporaire',
    jusquau: '2026-12-31',
```

- La pizza disparaît à la première mise à jour du site après cette date.
- Pour la retirer tout de suite, mettez `masquee: true,`.
- Attention au format : `'2026-12-31'` est correct, `'31/12/2026'` ne l'est pas.

### 7. Étiquette « Nouveau »

Une petite étiquette apparaît sur la carte. Pensez à la retirer quelques semaines plus tard.

Avant :
```
    badge: null,
```
Après :
```
    badge: 'nouveau',
```

Pour l'enlever, remettez `badge: null,`.

### 8. Ajouter ou remplacer une photo

> **Depuis le 13 novembre 2026, le site n'affiche aucune photo** : chaque pizza a un visuel graphique
> généré automatiquement à partir de ses ingrédients (rien à faire quand vous ajoutez une pizza).
> Vos photos sont rangées dans `photos-reserve/`. Ce qui suit ne s'applique que si vous réactivez
> les photos : remettez les fichiers dans `src/assets/pizzas/` et passez `photos: true` dans
> `src/config/apparence.ts`.

**Préparer le fichier**

- Format JPEG, conseillé. Le site accepte aussi `.png`, `.webp` et `.avif`.
- Pizza bien centrée dans l'image.
- Au moins 1200 pixels de large.
- Nom simple, sans espace ni accent, par exemple `quatre-fromages.jpg`.

**Déposer le fichier sur github.com**

1. Ouvrez le dossier `src/assets/pizzas/`.
2. Cliquez sur « Add file », puis « Upload files ».
3. Glissez votre fichier dans la zone, puis cliquez sur « Commit changes ».

**Indiquer la photo à la pizza**

Dans `src/config/pizzas.ts`, dans le bloc de la pizza, la ligne `photo:` doit contenir le nom exact du fichier, avec son extension, en respectant les majuscules.

Avant :
```
    photo: null,
```
Après :
```
    photo: 'quatre-fromages.jpg',
```

**Régler le cadrage si la pizza est mal centrée**

Le cadrage se règle dans `src/components/cadrages.ts`. Ce fichier est une liste de lignes, une par photo :

```
  'burger.jpg': { x: 52, y: 50, zoom: 1.08 },
```

- `'burger.jpg'` : le nom exact du fichier, entre guillemets simples, suivi de deux-points.
- `x` : position horizontale du centre de la photo, de `0` (gauche) à `100` (droite). `50` = milieu.
- `y` : position verticale, de `0` (haut) à `100` (bas). `50` = milieu.
- `zoom` : agrandissement. `1` = aucun zoom. `1.1` = un léger zoom.

Une photo absente de cette liste est centrée (`x: 50, y: 50, zoom: 1`). Pour une pizza, le cadre est plus haut que large.

Pour ajuster, ajoutez une ligne dans la partie « Pizzas » du fichier, par exemple :
```
  'quatre-fromages.jpg': { x: 52, y: 50, zoom: 1.05 },
```
Modifiez les valeurs par petits pas (2 à 5 points), puis regardez le résultat sur le site.

Si le nom de la photo est mal orthographié, le site ne s'arrête pas : la pizza s'affiche avec le dessin à la place de la photo.

---

## Photos générales

### Photo du haut de l'accueil

Déposez un fichier nommé `hero.jpg` (ou `hero.jpeg`, `hero.png`, `hero.webp`) dans le dossier `src/assets/brand/`.
Sans ce fichier, le site affiche un grand visuel graphique.

### Logo

Déposez un fichier nommé `logo.svg`, `logo.png` ou `logo.webp` dans le dossier `src/assets/brand/`. Il s'affiche en haut de chaque page, environ 40 pixels de haut.
Sans ce fichier, le site affiche « Pizza Memer » écrit en texte. Un logo en `.jpg` n'est pas pris en compte.

---

## Livraison, sous-vide, remises : `src/config/commerce.ts`

Ouvrez `src/config/commerce.ts`. Les réglages sont regroupés par thème, avec un commentaire au-dessus de chaque bloc.

### 9. Frais et zones de livraison

Dans le bloc `livraison`, `fraisStandard: 150,` est le tarif appliqué à une zone sans tarif propre.

Chaque zone est une ligne :
```
      { id: 'calodyne', nom: 'Calodyne', frais: 150, gratuitDes: null },
```

- `frais` : le tarif de la zone, en roupies.
- `gratuitDes` : à partir de quel montant de pizzas, après remise, la livraison est offerte. `null` = jamais offerte dans cette zone.

Avant :
```
      { id: 'calodyne', nom: 'Calodyne', frais: 150, gratuitDes: null },
```
Après (tarif 120 Rs, livraison offerte dès 2 000 Rs de pizzas) :
```
      { id: 'calodyne', nom: 'Calodyne', frais: 120, gratuitDes: 2000 },
```

**Ajouter une zone.** Copiez une ligne existante, puis changez `id` (minuscules, sans espace ni accent, unique) et `nom` :
```
      { id: 'nouvelle-zone', nom: 'Nom de la zone', frais: 150, gratuitDes: null },
```
Ajoutez-la dans la liste `zones`, en gardant la virgule à la fin de chaque ligne.

**Retirer une zone.** Supprimez sa ligne. Une adresse hors de la liste ne peut pas être livrée par le site.

**Un tarif unique.** Pour appliquer le même tarif partout, supprimez les parties `frais: ...,` de chaque zone. Le tarif `fraisStandard` s'applique alors.

**Désactiver la livraison.** Dans le bloc `livraison`, mettez `actif: false,`. Pour le retrait, même principe dans le bloc `retrait`.

### 10. Activer ou désactiver le sous-vide

Dans le bloc `sousVide` :

```
  sousVide: {
    actif: true,
    prixParPizza: 20,
```

- `actif: false,` retire l'option du site.
- `prixParPizza: 20,` est le supplément par pizza, en roupies.

### 11. Modifier la remise par quantité

Dans le bloc `remises`, `quantite` :

Avant :
```
    quantite: { actif: true, aPartirDe: 4, pourcentage: 10 },
```
Après (15 % dès 5 pizzas) :
```
    quantite: { actif: true, aPartirDe: 5, pourcentage: 15 },
```

Le libellé affiché (« Remise 15 % (5 pizzas ou plus) ») se met à jour tout seul.
Pour désactiver la remise, mettez `actif: false,`.

### 12. Créer un code promo

Les codes sont dans la liste `codes:`, à l'intérieur du bloc `remises`. Par défaut, la liste est vide : `codes: [],`.

Pour ajouter un code, remplacez `codes: [],` par :

```
    codes: [
      {
        code: 'VOISINS',
        libelle: 'Offre voisins',
        type: 'pourcentage',
        valeur: 15,
        actif: true,
        expireLe: '2027-01-31',
        minPizzas: 1,
        cumulable: false,
      },
    ],
```

Ce que signifie chaque ligne :

- `code` : le mot que le client tape. Les espaces et les majuscules ou minuscules ne comptent pas.
- `libelle` : le nom affiché au client.
- `type` : `'pourcentage'` (la valeur est un pourcentage) ou `'montant'` (la valeur est un montant en roupies).
- `valeur` : le pourcentage, ou le montant. Exemple : `15` pour 15 %, ou `100` pour 100 Rs avec `type: 'montant'`.
- `actif` : `true` pour activer le code, `false` pour le désactiver immédiatement.
- `expireLe` : dernier jour valable, inclus, au format `AAAA-MM-JJ`. Mettez `null` pour ne pas mettre de date.
- `minPizzas` : nombre minimum de pizzas exigé. Supprimez la ligne s'il n'y a pas de minimum.
- `cumulable` : `true` si le code s'ajoute à la remise par quantité. `false` si c'est la règle de cumul ci-dessous qui décide.

**Attention** : le fichier est public. Toute personne qui regarde le code source du site peut lire vos codes promo.

**La règle de cumul.** Juste après la liste `codes`, la ligne `cumul` décide quoi faire quand un code non cumulable et la remise par quantité s'appliquent en même temps :

- `cumul: 'meilleure',` : le client bénéficie de la remise la plus avantageuse, une seule fois.
- `cumul: 'code',` : le code remplace la remise par quantité.
- `cumul: 'quantite',` : la remise par quantité l'emporte, et le code est ignoré.

---

## Jours, fermetures et horaires : `src/config/commerce.ts`

### 13. Changer les jours de distribution

Dans le bloc `distribution`, la ligne `jours` contient les numéros des jours :
`0` = dimanche, `1` = lundi, `2` = mardi, `3` = mercredi, `4` = jeudi, `5` = vendredi, `6` = samedi.

Actuellement :
```
    jours: [4, 5, 6],
```
Exemple, ajout du mercredi :
```
    jours: [3, 4, 5, 6],
```

### 14. Ajouter une fermeture exceptionnelle

La ligne `fermetures` contient les dates, une par élément, au format `AAAA-MM-JJ` entre guillemets simples.

Avant :
```
    fermetures: [],
```
Après :
```
    fermetures: ['2026-12-25'],
```
Pour plusieurs dates : `fermetures: ['2026-12-25', '2027-01-01'],`

### 15. Heure limite pour le jour même

La ligne `heureLimiteJourMeme` indique l'heure, sur 24 heures, heure de Maurice, après laquelle le client ne peut plus demander le jour même.

Avant :
```
    heureLimiteJourMeme: null,
```
Après (le jour même n'est plus proposé après 14 h) :
```
    heureLimiteJourMeme: 14,
```

Pour supprimer la limite, remettez `null`.
Pour interdire complètement la commande du jour même, mettez `jourMemeAutorise: false,` dans le même bloc.

---

## Contact et présentation : `src/config/commerce.ts`

### 16. Changer le numéro WhatsApp

Deux lignes doivent être modifiées ensemble :

```
  whatsapp: '23054778439',
  whatsappAffiche: '5477 8439',
```

- `whatsapp` : le numéro complet, avec l'indicatif du pays, sans `+` ni espace. `230` est l'indicatif de Maurice.
- `whatsappAffiche` : le même numéro, écrit comme on le lit sur le site.

Exemple (numéro fictif) :
```
  whatsapp: '23051234567',
  whatsappAffiche: '5123 4567',
```

### 17. Ajouter le lien Facebook

Avant :
```
  facebook: '',
```
Après (adresse copiée depuis la barre d'adresse de la page Facebook) :
```
  facebook: 'https://www.facebook.com/nom-de-votre-page',
```

Une chaîne vide `''` signifie que le lien n'est pas affiché.

### 18. Ajouter le lien Google Maps du point de retrait

Sur Google Maps, cherchez le lieu, cliquez sur « Partager », puis copiez le lien.

Avant :
```
  lienCarteRetrait: '',
```
Après :
```
  lienCarteRetrait: 'https://maps.google.com/…',
```

Une chaîne vide `''` signifie qu'aucun bouton d'itinéraire n'est affiché.
L'adresse écrite sur le site se modifie dans la ligne `adresseRetrait:`.

### 19. Modifier les horaires

La ligne `horaires` accepte un texte libre :

Avant :
```
  horaires: '',
```
Après (exemple, à remplacer par vos horaires) :
```
  horaires: 'Jeudi à samedi, de 11 h à 20 h',
```

Une chaîne vide `''` signifie que les horaires ne sont pas affichés.

### 20. Compléter les consignes de conservation et de congélation

Dans le bloc `preparation`, chaque ligne entre guillemets est une phrase, affichée sur la page « Comment ça marche ? ».

Aujourd'hui, les deux listes sont vides. La section n'apparaît donc pas. Pour la compléter :

```
    conservation: [
      'Votre consigne de conservation, une phrase entre guillemets.',
      'Une autre phrase si besoin.',
    ],
    congelation: [
      'Votre consigne de congélation.',
    ],
```

Le site n'invente aucune durée ni aucune température : c'est à vous de les écrire.

---

## Les textes du site : `src/content/textes.ts`

Ce fichier contient tous les textes rédigés : accueil, carte, contact, panier, pied de page.

Exemple. Remplacer le mot « artisanales » par « maison » dans la phrase d'accroche :

Avant :
```
  marque: {
    baseline: 'Pizzas napolitaines artisanales, à finir chez vous',
  },
```
Après :
```
  marque: {
    baseline: 'Pizzas napolitaines maison, à finir chez vous',
  },
```

Règles pour les textes :

- Ne modifiez que ce qui se trouve entre les guillemets simples.
- Gardez les apostrophes courbes `’`.
- Ne supprimez pas les mots entre accolades comme `{n}` ou `{montant}` : le site les remplace par des valeurs.

---

## Avant d'enregistrer

- Chaque ligne se termine par une virgule.
- Chaque texte est entre guillemets simples, sans apostrophe droite à l'intérieur.
- Les dates sont au format `AAAA-MM-JJ`.
- Le nom d'une photo est exactement celui du fichier déposé.
- Après la mise en ligne, ouvrez le site et vérifiez la page modifiée.

---

## En cas d'erreur

Si une modification contient une erreur, GitHub ne met pas le site en ligne.

- Ouvrez l'onglet **Actions** du dépôt. Une croix rouge à côté de la dernière modification signale l'échec.
- Le site en ligne reste alors sur la version précédente. Rien de visible ne casse.
- Ouvrez la ligne en rouge pour lire le message. Pour revenir en arrière, remettez l'ancienne valeur et enregistrez à nouveau.
- Si vous ne trouvez pas l'erreur, transmettez le message au développeur.

Erreurs les plus fréquentes :

- **Une virgule oubliée** en fin de ligne, par exemple `prix: 390` au lieu de `prix: 390,`.
- **Une apostrophe droite** dans un texte entre guillemets simples. Utilisez `’`.
- **Un `id` en double** : deux pizzas ne doivent pas avoir le même `id`, car les paniers des clients s'y réfèrent.
- **Un nom de photo mal orthographié** : ce n'est pas une erreur bloquante. Le site se met en ligne, mais la pizza affiche le dessin à la place de la photo. Vérifiez le nom et l'extension.
- **Une date au mauvais format** : `'2026-12-31'` est correct, pas `'31/12/2026'`.
- **Un crochet ou une accolade oubliés** : vérifiez que chaque `[` a son `]` et chaque `{` son `}`.

## Chaîne WhatsApp

Le lien de la chaîne se règle dans `src/config/commerce.ts`, ligne `chaineWhatsapp`.
Le bloc « La chaîne WhatsApp » (accueil et page contact), le lien du pied de page et le QR code aux
couleurs du site sont générés à partir de ce lien. Mettre `''` fait disparaître le tout.
Le QR code se télécharge à l'adresse `/PizzaMemer/qr/chaine.png` (ou `chaine.svg`).
