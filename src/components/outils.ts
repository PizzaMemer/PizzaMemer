/** Petits utilitaires d'affichage (aucune valeur commerciale ici : tout vient de src/config). */
import { commerce } from '../config/commerce';

/** « jeudi, vendredi et samedi » depuis les numéros de jours de la config. */
export function joursDistribution(): string {
  const noms = [...commerce.distribution.jours]
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((j) =>
      new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + j))),
    );
  if (noms.length <= 1) return noms.join('');
  return `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`;
}

/** AAAA-MM-JJ → « 20 décembre » */
export function jourMois(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)),
  );
}

/** Remplace {cle} dans un texte rédactionnel. */
export function remplir(texte: string, valeurs: Record<string, string | number>): string {
  return texte.replace(/\{(\w+)\}/g, (_, c: string) => String(valeurs[c] ?? ''));
}

/** Texte d'un frais de zone : tarif propre ou standard. */
export function fraisZone(zone: { frais?: number }): number {
  return zone.frais ?? commerce.livraison.fraisStandard;
}
