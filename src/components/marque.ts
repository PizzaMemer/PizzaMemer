/** Ressources de marque facultatives déposées par le gérant dans src/assets/brand/ (hero.*, logo.*). */
import type { ImageMetadata } from 'astro';

const heros = import.meta.glob<ImageMetadata>('/src/assets/brand/hero.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});
const logos = import.meta.glob<ImageMetadata>('/src/assets/brand/logo.{svg,png,webp}', {
  eager: true,
  import: 'default',
});

export const imageHero: ImageMetadata | null = Object.values(heros)[0] ?? null;
export const imageLogo: ImageMetadata | null = Object.values(logos)[0] ?? null;

const photos = import.meta.glob<ImageMetadata>('/src/assets/pizzas/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
});

/** Photo d'une pizza si le fichier existe ; sinon null (avec un avertissement si un nom a été saisi). */
export function photoPizza(nom: string | null, idPizza: string): ImageMetadata | null {
  if (!nom) return null;
  const trouvee = photos[`/src/assets/pizzas/${nom}`];
  if (!trouvee) {
    console.warn(
      `[pizzamemer] Photo introuvable pour « ${idPizza} » : src/assets/pizzas/${nom}. L'illustration est affichée à la place.`,
    );
    return null;
  }
  return trouvee;
}

const ambiance = import.meta.glob<ImageMetadata>('/src/assets/ambiance/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
});

/** Photo d'ambiance (pâton, four…) par nom de fichier ; null si absente. */
export function photoAmbiance(nom: string): ImageMetadata | null {
  return ambiance[`/src/assets/ambiance/${nom}`] ?? null;
}

/** Photo d'une pizza par nom de fichier, sans avertissement (usage décoratif, ex. héros). */
export function photoPizzaParNom(nom: string): ImageMetadata | null {
  return photos[`/src/assets/pizzas/${nom}`] ?? null;
}
