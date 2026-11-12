/** Dates de distribution, calculées en heure de Maurice (UTC+4, sans heure d'été). */
import { commerce } from '../config/commerce';
import type { Commerce, DateProposee } from './types';

const DECALAGE_MS = 4 * 60 * 60 * 1000; // Indian/Mauritius
const JOURS_MAX = 400;

function deux(n: number): string {
  return String(n).padStart(2, '0');
}

function iso(d: Date): string {
  return `${d.getUTCFullYear()}-${deux(d.getUTCMonth() + 1)}-${deux(d.getUTCDate())}`;
}

function majuscule(s: string): string {
  return s.charAt(0).toLocaleUpperCase('fr-FR') + s.slice(1);
}

/** Date AAAA-MM-JJ → Date UTC à midi (évite tout effet de bord de fuseau). */
function depuisIso(valeur: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valeur);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
  return iso(d) === valeur ? d : null;
}

function formater(d: Date, court: boolean): string {
  const texte = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC',
    weekday: court ? 'short' : 'long',
    day: 'numeric',
    month: court ? 'short' : 'long',
  }).format(d);
  return majuscule(texte);
}

export function libelleDate(valeur: string): string {
  const d = depuisIso(valeur);
  return d ? formater(d, false) : valeur;
}

export function datesProposees(maintenant: Date, config: Commerce = commerce): DateProposee[] {
  const { jours, fermetures, nombreDatesProposees, jourMemeAutorise, heureLimiteJourMeme } =
    config.distribution;
  if (!jours.length || nombreDatesProposees <= 0) return [];

  const local = new Date(maintenant.getTime() + DECALAGE_MS); // lire en getUTC* = heure de Maurice
  const heure = local.getUTCHours();
  const aujourdhui = iso(local);
  const resultat: DateProposee[] = [];

  for (let i = 0; i < JOURS_MAX && resultat.length < nombreDatesProposees; i++) {
    const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + i, 12));
    if (!jours.includes(d.getUTCDay())) continue;
    const jour = iso(d);
    if (fermetures.includes(jour)) continue;
    if (i === 0 && !(jourMemeAutorise && (heureLimiteJourMeme === null || heure < heureLimiteJourMeme))) continue;
    resultat.push({
      iso: jour,
      libelle: formater(d, false),
      libelleCourt: formater(d, true),
      estAujourdhui: jour === aujourdhui,
    });
  }
  return resultat;
}

export function estDateValide(valeur: string, maintenant: Date, config: Commerce = commerce): boolean {
  return datesProposees(maintenant, config).some((d) => d.iso === valeur);
}
