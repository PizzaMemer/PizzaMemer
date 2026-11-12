/**
 * ═══════════════════════════════════════════════════════════════
 *  TEXTES PIZZA MEMER — tout le texte rédactionnel du site
 * ═══════════════════════════════════════════════════════════════
 *
 * Propriétaire : rédacteur. Prix, zones, jours et numéro ne sont pas écrits ici :
 * ils viennent de src/config/commerce.ts et src/config/pizzas.ts.
 * Les valeurs entre accolades ({n}, {montant}, {annee}) sont remplacées par le code.
 */

export const textes = {
  marque: {
    baseline: 'Pizzas napolitaines artisanales, à finir chez vous',
  },

  nav: {
    accueil: 'Accueil',
    carte: 'La carte',
    commentCaMarche: 'Comment ça marche ?',
    contact: 'Contact',
    commander: 'Commander',
    panier: 'Panier',
  },

  accueil: {
    accroche: 'Une vraie pizza napolitaine, quelques minutes au four et c’est prêt !',
    intro:
      'Je prépare des pizzas napolitaines artisanales, en petites quantités, dans le nord de l’île Maurice. Elles sont précuites : il vous suffit de les finir au four chez vous.',
    boutonCarte: 'Découvrir la carte',
    boutonCommander: 'Commander',
    concept: {
      titre: 'Comment ça se passe',
      etapes: [
        {
          titre: 'Je prépare',
          texte:
            'Je prépare mes pizzas moi-même, en petites quantités, avec une pâte qui fermente longtemps.',
        },
        {
          titre: 'Elle est précuite',
          texte:
            'La cuisson se fait en partie chez moi. Il ne reste que la finition à faire chez vous.',
        },
        {
          titre: 'Vous finissez au four',
          texte: 'Vous la passez au four quelques minutes, puis elle est prête à déguster.',
        },
        {
          titre: 'Vous en profitez',
          texte: 'Vous la mangez tout de suite ou plus tard. Vous pouvez aussi la congeler.',
        },
      ],
    },
    selection: {
      titre: 'Quelques-unes de mes pizzas',
      sousTitre: 'Des pizzas préparées en petites quantités, à retirer ou à faire livrer.',
      lienToutVoir: 'Voir toute la carte',
    },
    avantages: {
      titre: 'Ce que vous y gagnez',
      items: [
        {
          titre: 'Une pâte à fermentation longue',
          texte:
            'Je laisse la pâte fermenter longtemps, pour une corniche bien alvéolée et une pâte savoureuse.',
        },
        {
          titre: 'Prête en quelques minutes',
          texte:
            'Pas de préparation compliquée : il suffit de finir la cuisson au four, quelques minutes avant de servir.',
        },
        {
          titre: 'Elle se congèle',
          texte: 'Vous pouvez congeler vos pizzas et les cuire quand l’envie vous prend.',
        },
        {
          titre: 'Retrait ou livraison',
          texte: 'Vous venez la chercher, ou je vous la livre dans le nord de l’île.',
        },
      ],
    },
    final: {
      titre: 'Envie de goûter ?',
      texte:
        'Choisissez vos pizzas dans la carte, puis envoyez-moi votre commande sur WhatsApp. Je vous confirme la disponibilité.',
    },
  },

  carte: {
    titre: 'La carte',
    intro:
      'Mes pizzas sont préparées en petites quantités. Vous trouverez ci-dessous les prix et la composition de chaque pizza, ainsi que la carte à télécharger si vous le souhaitez.',
    telecharger: 'Télécharger la carte (PDF)',
    sansIngredients: 'Composition sur demande',
    illustration: 'Illustration : il ne s’agit pas d’une photo.',
  },

  commentCaMarche: {
    titre: 'Comment ça marche ?',
    intro:
      'Mes pizzas sont précuites. Voici comment les finir chez vous, comment les garder et comment passer commande.',
    cuisson: {
      titre: 'Finir la cuisson chez vous',
      astuce:
        'Suivez les étapes indiquées ci-dessus. Chaque four a sa façon de cuire : surveillez la pizza la première fois.',
    },
    conservation: {
      titre: 'Conserver la pizza',
    },
    congelation: {
      titre: 'Congeler la pizza',
    },
    commander: {
      titre: 'Commander, en quatre étapes',
      etapes: [
        'Choisissez vos pizzas dans la carte.',
        'Indiquez le retrait ou la livraison, et le jour souhaité.',
        'Envoyez le récapitulatif sur WhatsApp.',
        'Je vous confirme la disponibilité par message.',
      ],
    },
    faq: [
      {
        question: 'Comment passer commande ?',
        reponse:
          'Ajoutez vos pizzas au panier, puis envoyez-moi le récapitulatif sur WhatsApp. Je vous réponds pour confirmer la disponibilité.',
      },
      {
        question: 'Faut-il commander à l’avance ?',
        reponse:
          'Je vous conseille de commander la veille, pour être certain d’avoir les pizzas souhaitées. Ce n’est pas obligatoire : vous pouvez aussi demander le jour même.',
      },
      {
        question: 'Peut-on congeler les pizzas ?',
        reponse:
          'Oui, c’est possible. Si vous ne les mangez pas tout de suite, pensez à les congeler.',
      },
      {
        question: 'Me livrez-vous chez moi ?',
        reponse:
          'Cela dépend de votre adresse. Les zones desservies sont indiquées sur la page contact. Si la vôtre n’y figure pas, écrivez-moi sur WhatsApp.',
      },
      {
        question: 'Comment finir la cuisson ?',
        reponse:
          'Suivez la consigne affichée plus haut sur cette page. Il ne reste que la finition au four.',
      },
      {
        question: 'La pizza est-elle déjà cuite ?',
        reponse: 'Elle est précuite. Elle doit simplement être terminée au four chez vous.',
      },
    ],
  },

  contact: {
    titre: 'Contact',
    intro:
      'Pour une question ou une commande, le plus simple est de m’écrire sur WhatsApp.',
    retrait: {
      titre: 'Retrait sur place',
    },
    livraison: {
      titre: 'Livraison dans le nord',
      hors:
        'Votre zone n’est pas listée ? Écrivez-moi sur WhatsApp, je regarderai ce que je peux faire.',
    },
    jours: {
      titre: 'Jours de distribution',
    },
    whatsapp: {
      titre: 'Me joindre sur WhatsApp',
      bouton: 'Écrire sur WhatsApp',
    },
    facebook: {
      titre: 'Retrouvez-moi sur Facebook',
      bouton: 'Voir ma page Facebook',
    },
  },

  panier: {
    titre: 'Votre panier',
    vide: 'Votre panier est vide pour le moment.',
    videAction: 'Voir la carte',
    sousTotal: 'Sous-total',
    livraison: 'Livraison',
    livraisonOfferte: 'Offerte',
    total: 'Total',
    commander: 'Finaliser la commande',
    continuer: 'Continuer mes achats',
    ajoute: 'Ajoutée au panier',
    encoreRemise: 'Plus que {n} pizza(s) pour profiter de la remise',
    encoreRemiseUn: 'Plus qu’une pizza pour profiter de la remise',
    encoreRemisePlusieurs: 'Plus que {n} pizzas pour profiter de la remise',
    encoreLivraison: 'Encore {montant} de pizzas pour une livraison offerte',
  },

  commande: {
    titre: 'Ma commande',
    intro:
      'Vérifiez votre panier, puis complétez ces informations. Le récapitulatif sera prêt pour WhatsApp.',
    etapes: {
      panier: 'Votre panier',
      recuperation: 'Retrait ou livraison',
      jour: 'Le jour souhaité',
      coordonnees: 'Vos coordonnées',
      recap: 'Récapitulatif',
    },
    champs: {
      nom: 'Nom et prénom',
      telephone: 'Téléphone',
      adresse: 'Adresse de livraison',
      zone: 'Zone de livraison',
      choisirZone: 'Choisir une zone',
      remarque: 'Remarque (facultatif)',
      remarqueAide: 'Par exemple, l’heure souhaitée ou une précision sur votre adresse.',
      code: 'Code promo',
      appliquer: 'Appliquer',
    },
    modes: {
      retrait: 'Retrait',
      livraison: 'Livraison',
    },
    codes: {
      applique: 'Le code est appliqué.',
      inconnu: 'Ce code ne correspond à aucune offre.',
      expire: 'Ce code a expiré.',
      inactif: 'Ce code n’est plus actif.',
      minimum: 'Ce code demande un nombre minimum de pizzas, qui n’est pas encore atteint.',
      nonRetenu: 'Ce code est valide, mais la remise déjà appliquée est plus avantageuse.',
    },
    envoyer: 'Envoyer ma commande sur WhatsApp',
    avantEnvoi:
      'Le bouton ouvre WhatsApp avec votre récapitulatif prêt. Rien n’est envoyé tant que vous n’appuyez pas sur Envoyer dans WhatsApp. La commande est validée quand je vous réponds.',
    apresEnvoi: {
      titre: 'WhatsApp s’est ouvert',
      texte:
        'Pensez à envoyer le message dans WhatsApp. Je vous confirme la disponibilité de vos pizzas. Votre panier est conservé.',
      rouvrir: 'Rouvrir WhatsApp',
      copier: 'Copier le récapitulatif',
      vider: 'Vider mon panier',
    },
    indisponible: 'La commande par WhatsApp n’est pas disponible pour le moment.',
  },

  pied: {
    texte:
      'Pizzas napolitaines artisanales, précuites, à finir chez vous. Préparées en petites quantités.',
    mentions: '© {annee} Pizza Memer — Péreybère, île Maurice',
  },
} as const;
