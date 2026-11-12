/** Affichage d'un montant en roupies : 1500 → "1 500 Rs" (espace insécable). */
export function rs(montant: number): string {
  const n = Math.round(montant);
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Rs`;
}
