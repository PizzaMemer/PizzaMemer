# Sécurité du site Pizza Memer

Audit du 25 novembre 2026 : dépôt GitHub `pizzamemer/PizzaMemer` (tout l'historique), code,
dépendances, déploiement GitHub Actions et site en ligne `https://pizzamemer.github.io/PizzaMemer/`.

## Verdict

Aucune faille grave. Le site est statique (pas de serveur, pas de base de données, pas de paiement
en ligne, aucun mot de passe ni clé secrète) : la surface d'attaque est faible. **Le vrai point
sensible est le compte GitHub `pizzamemer`** : quiconque y accède peut changer le numéro WhatsApp
du site et détourner les commandes.

## Ce qui a été vérifié

| Domaine | Résultat |
|---|---|
| Secrets (clés, mots de passe, jetons) dans tout l'historique git | Aucun |
| Métadonnées des photos (EXIF, position GPS) dans tout l'historique | Aucune : supprimées à l'import |
| Dépendances (`npm audit`) | 0 vulnérabilité |
| Injection de code (XSS) | Saisies client affichées en texte, encodées dans le lien WhatsApp ; HTML brut uniquement issu de la configuration, au build |
| Panier stocké dans le navigateur | Données relues et validées ; données corrompues → panier vide |
| Ouverture de WhatsApp | Onglet ouvert sans lien de retour vers le site (`opener` coupé) |
| HTTPS | Forcé (redirection 301 + HSTS) |
| Fichiers internes exposés (`.git`, `package.json`, `src/`, `legacy/`, photos…) | Aucun : seul le dossier construit est publié |
| Protection anti-secrets de GitHub (secret scanning + push protection) | Activée |

## Corrections appliquées

1. **Politique de sécurité du contenu (CSP)** sur toutes les pages (`astro.config.mjs`) : le
   navigateur refuse tout script, image ou connexion qui ne vient pas du site ou de GoatCounter.
   Testé : un script injecté est bloqué ; le site, le panier et les statistiques fonctionnent.
2. **Script GoatCounter verrouillé** : version figée (`count.v5.js`) avec contrôle d'intégrité
   (SRI). Si le fichier est modifié chez GoatCounter, le navigateur refuse de l'exécuter.
3. **Publication GitHub Actions durcie** (`.github/workflows/deploy.yml`) : actions figées sur une
   empreinte de commit, droits d'écriture limités à l'étape de publication, identifiants git non
   conservés pendant la construction.

## À faire par le gérant (non faisable depuis Claude)

1. **Activer la double authentification** sur le compte GitHub `pizzamemer` :
   https://github.com/settings/security — priorité n° 1. Faites de même sur GoatCounter
   (mot de passe fort) et sur l'adresse e-mail liée au compte GitHub.
2. **Masquer votre adresse e-mail** : https://github.com/settings/emails → cocher « Keep my email
   addresses private » et « Block command line pushes that expose my email ». Votre adresse Gmail
   est visible dans 4 anciens commits faits depuis github.com ; elle y restera (réécrire
   l'historique n'en vaut pas la peine), mais plus aucun nouveau commit ne l'exposera.
3. **Activer les alertes Dependabot** : https://github.com/pizzamemer/PizzaMemer/settings/security_analysis
   → « Dependabot alerts » et « Dependabot security updates ».
4. **Protéger la branche `main`** (facultatif) : https://github.com/pizzamemer/PizzaMemer/settings/rules
   → nouveau « Branch ruleset » sur `main` cochant « Restrict deletions » et « Block force pushes ».
5. **Contrôler les accès** (l'audit n'a pas pu les lire) : dans Settings du dépôt, vérifier que
   *Collaborators*, *Deploy keys* et *Webhooks* sont vides ; dans
   https://github.com/settings/applications, retirer les applications que vous n'utilisez plus
   (l'application Claude peut être retirée quand vous n'avez plus besoin de modifications).
6. **Ne jamais renommer ni supprimer** le compte `pizzamemer` ou le dépôt `PizzaMemer` : les QR
   codes imprimés pointent dessus, et un nom libéré pourrait être repris par quelqu'un d'autre.

## Règles commerciales à garder en tête

- Le client peut modifier le message WhatsApp avant de l'envoyer : **vérifiez toujours le total**
  avec votre carte avant de confirmer une commande.
- Un code promo ajouté dans `src/config/commerce.ts` est lisible par toute personne qui consulte le
  code du site : ne comptez pas sur son secret.

## Limites connues

- GitHub Pages ne permet pas d'ajouter des en-têtes HTTP : la protection contre l'affichage du site
  dans un cadre d'un autre site (*clickjacking*) n'est pas possible. Risque faible : le site ne
  contient aucune action sensible (pas de compte, pas de paiement).
- Si vous modifiez le petit script en tête de `BaseLayout.astro`, son empreinte doit être
  recalculée dans `astro.config.mjs`, sinon il sera bloqué (le test automatique le détectera).
