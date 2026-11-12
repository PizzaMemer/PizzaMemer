import { pizzas } from '../config/pizzas';
import type { Pizza } from './types';

/** Date du jour à Maurice, AAAA-MM-JJ. */
export function aujourdhuiMaurice(maintenant: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Indian/Mauritius' }).format(maintenant);
}

/** Pizzas à afficher : non masquées et, pour les temporaires, non expirées. */
export function pizzasVisibles(aujourdhui: string = aujourdhuiMaurice(), liste: Pizza[] = pizzas): Pizza[] {
  return liste.filter((p) => !p.masquee && (!p.jusquau || p.jusquau >= aujourdhui));
}

/** Pizzas que l'on peut mettre au panier. */
export function pizzasCommandables(aujourdhui: string = aujourdhuiMaurice(), liste: Pizza[] = pizzas): Pizza[] {
  return pizzasVisibles(aujourdhui, liste).filter((p) => p.disponible);
}
