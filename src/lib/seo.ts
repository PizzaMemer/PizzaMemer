/**
 * SEO local Pizza Memer : titres, descriptions et données structurées (JSON-LD).
 * Propriétaire : agent seo.
 *
 * Règle : tout ce qui apparaît ici vient de src/config/commerce.ts et src/config/pizzas.ts.
 * Aucune note, aucun avis, aucun horaire : ces informations ne sont pas connues du site.
 */
import { commerce } from '../config/commerce';
import { pizzasVisibles } from './catalogue';

export interface MetaPage {
  /** Titre complet de la page (≤ 60 caractères), marque incluse. */
  title: string;
  /** Description de la page (≤ 155 caractères). */
  description: string;
}

/**
 * Titres et descriptions par page. Les pages ne les importent pas encore :
 * l'orchestrateur les câblera (ex. <BaseLayout {...metaParPage.carte}>).
 */
export const metaParPage: Record<
  'accueil' | 'carte' | 'commentCaMarche' | 'contact' | 'commande' | 'introuvable',
  MetaPage
> = {
  accueil: {
    title: 'Pizza Memer — pizza napolitaine artisanale, Péreybère',
    description:
      'Pizzas napolitaines artisanales précuites, à finir au four chez vous. Petites quantités à Péreybère : retrait ou livraison dans le nord de l’île.',
  },
  carte: {
    title: 'La carte des pizzas napolitaines — Pizza Memer',
    description:
      'Prix et composition de chaque pizza napolitaine artisanale de Pizza Memer, à Péreybère. La carte est aussi disponible en PDF à télécharger.',
  },
  commentCaMarche: {
    title: 'Pizza précuite : comment la finir au four — Pizza Memer',
    description:
      'Comment finir la cuisson d’une pizza précuite au four, la conserver, la congeler et passer commande sur WhatsApp avec Pizza Memer.',
  },
  contact: {
    title: 'Contact et zones de livraison — Pizza Memer',
    description:
      'Retrait à Péreybère et livraison dans le nord de l’île Maurice, dont Grand Baie. Commandez ou posez une question directement sur WhatsApp.',
  },
  commande: {
    title: 'Commander une pizza — Pizza Memer',
    description:
      'Composez votre commande de pizzas napolitaines, choisissez le retrait ou la livraison, puis envoyez le récapitulatif sur WhatsApp.',
  },
  introuvable: {
    title: 'Page introuvable — Pizza Memer',
    description:
      'Cette page n’existe pas. Retrouvez la carte des pizzas napolitaines artisanales de Pizza Memer.',
  },
};

/** Prix en roupies sans séparateur ambigu, pour priceRange : "Rs 330–500". */
function fourchettePrix(prix: number[]): string | null {
  if (prix.length === 0) return null;
  const min = Math.min(...prix);
  const max = Math.max(...prix);
  return `Rs ${min}–${max}`;
}

/**
 * Données structurées schema.org de l'établissement, avec la carte visible.
 * Renvoie un objet JSON-LD prêt pour le composant Seo (prop jsonLd).
 */
export function donneesStructurees(): object {
  const visibles = pizzasVisibles();
  const prix = visibles.map((p) => p.prix);
  const fourchette = fourchettePrix(prix);

  const zones = commerce.livraison.actif ? commerce.livraison.zones.map((z) => z.nom) : [];

  const etablissement: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: commerce.nom,
    url: `${commerce.urlSite}/`,
    image: `${commerce.urlSite}/og.jpg`,
    servesCuisine: ['Pizza', 'Italienne'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: commerce.adresseRetrait,
      addressLocality: 'Péreybère',
      addressRegion: 'Rivière du Rempart',
      addressCountry: 'MU',
    },
    telephone: `+${commerce.whatsapp}`,
  };

  if (zones.length > 0) etablissement.areaServed = zones;
  if (fourchette) etablissement.priceRange = fourchette;
  if (commerce.facebook) etablissement.sameAs = [commerce.facebook];

  if (visibles.length > 0) {
    etablissement.hasMenu = {
      '@type': 'Menu',
      name: 'La carte',
      hasMenuSection: {
        '@type': 'MenuSection',
        name: 'Pizzas',
        hasMenuItem: visibles.map((p) => {
          const item: Record<string, unknown> = {
            '@type': 'MenuItem',
            name: p.nom,
            offers: {
              '@type': 'Offer',
              price: p.prix,
              priceCurrency: 'MUR',
              availability: p.disponible
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            },
          };
          if (p.ingredients.length > 0) item.description = p.ingredients.join(', ');
          return item;
        }),
      },
    };
  }

  return etablissement;
}

/** Données structurées FAQPage à partir des questions-réponses visibles sur une page. */
export function donneesFaq(faq: readonly { question: string; reponse: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.reponse },
    })),
  };
}
