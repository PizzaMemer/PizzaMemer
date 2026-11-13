/**
 * Ressources photo facultatives. Tout est chargé « à la demande » (glob non eager) :
 * avec apparence.photos = false, aucune photo n'est optimisée ni référencée par les pages
 * (Astro copie néanmoins les fichiers d'origine dans dist/_astro, sans lien depuis le site).
 */
import type { ImageMetadata } from 'astro';
import { apparence } from '../config/apparence';

type Charge = Record<string, () => Promise<ImageMetadata>>;
const heros = import.meta.glob<ImageMetadata>('/src/assets/brand/hero.{jpg,jpeg,png,webp}', { import: 'default' }) as Charge;
const photos = import.meta.glob<ImageMetadata>('/src/assets/pizzas/*.{jpg,jpeg,png,webp,avif}', { import: 'default' }) as Charge;
const ambiance = import.meta.glob<ImageMetadata>('/src/assets/ambiance/*.{jpg,jpeg,png,webp,avif}', { import: 'default' }) as Charge;

async function charger(table: Charge, cle: string): Promise<ImageMetadata | null> {
  if (!apparence.photos) return null;
  return table[cle] ? await table[cle]() : null;
}

export const imageHero = async (): Promise<ImageMetadata | null> => {
  if (!apparence.photos) return null;
  const premiere = Object.values(heros)[0];
  return premiere ? await premiere() : null;
};

/** Photo d'une pizza si le fichier existe et si les photos sont activées ; sinon null. */
export async function photoPizza(nom: string | null, idPizza: string): Promise<ImageMetadata | null> {
  if (!apparence.photos || !nom) return null;
  const trouvee = await charger(photos, `/src/assets/pizzas/${nom}`);
  if (!trouvee) console.warn(`[pizzamemer] Photo introuvable pour « ${idPizza} » : src/assets/pizzas/${nom}.`);
  return trouvee;
}

/** Photo d'ambiance (pâton, four…) par nom de fichier ; null si absente ou désactivée. */
export const photoAmbiance = (nom: string): Promise<ImageMetadata | null> => charger(ambiance, `/src/assets/ambiance/${nom}`);

/** Photo d'une pizza par nom de fichier, sans avertissement. */
export const photoPizzaParNom = (nom: string): Promise<ImageMetadata | null> => charger(photos, `/src/assets/pizzas/${nom}`);
