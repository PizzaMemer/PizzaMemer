/** Message WhatsApp, lien et validation. Aucun calcul : tout vient du ResultatCalcul. */
import { commerce } from '../config/commerce';
import { estDateValide, libelleDate } from './dates';
import { rs } from './format';
import type { Commerce, EntreeCalcul, InfosClient, ResultatCalcul } from './types';

const montant = (n: number): string => rs(n).replace(/[  ]/g, ' ');
const chiffres = (s: string): string => String(s ?? '').replace(/\D/g, '');

export function construireMessage(
  resultat: ResultatCalcul,
  entree: EntreeCalcul,
  client: InfosClient,
  config: Commerce = commerce,
): string {
  const l: string[] = [];
  l.push('Bonjour, je souhaite passer une commande Pizza Memer 🍕', '');
  l.push(`Nom : ${client.nom.trim()}`);
  l.push(`Téléphone : ${client.telephone.trim()}`, '');

  l.push('*Ma commande*');
  for (const ligne of resultat.lignes) {
    l.push(
      `• ${ligne.quantite} × ${ligne.nom} — ${montant(ligne.prixUnitaire)} l'unité — ${montant(ligne.total)}`,
    );
  }
  l.push('');
  l.push(`Sous-total : ${montant(resultat.sousTotal)}`);
  for (const r of resultat.remises) l.push(`${r.libelle} : −${montant(r.montant)}`);
  if (resultat.sousVide > 0) {
    l.push(`Sous vide (${resultat.nombrePizzas} pizzas) : ${montant(resultat.sousVide)}`);
  }
  l.push('');

  if (entree.mode === 'livraison') {
    l.push(`Mode : Livraison — ${resultat.livraison.zoneNom ?? 'zone non précisée'}`);
    l.push(`Adresse : ${client.adresse.trim()}`);
    l.push(`Frais de livraison : ${resultat.livraison.offerte ? 'Offerte' : montant(resultat.livraison.frais)}`);
  } else {
    l.push(`Mode : Retrait — ${config.adresseRetrait}`);
    if (resultat.livraison.frais > 0) l.push(`Frais de retrait : ${montant(resultat.livraison.frais)}`);
  }
  l.push(`Date demandée : ${libelleDate(client.date)}`, '');
  l.push(`*Total : ${montant(resultat.total)}*`);
  if (client.remarque.trim()) l.push('', `Remarque : ${client.remarque.trim()}`);
  l.push('', 'Merci de me confirmer la disponibilité 🙏');
  return l.join('\n');
}

export function lienWhatsApp(message: string, config: Commerce = commerce): string | null {
  const numero = chiffres(config.whatsapp);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
}

export function validerCommande(
  resultat: ResultatCalcul,
  entree: EntreeCalcul,
  client: InfosClient,
  maintenant: Date,
  config: Commerce = commerce,
): string[] {
  const e: string[] = [];
  if (resultat.vide) e.push('Votre panier est vide.');
  if (!client.nom.trim()) e.push('Indiquez votre nom.');
  const tel = chiffres(client.telephone);
  if (!client.telephone.trim()) e.push('Indiquez votre numéro de téléphone.');
  else if (tel.length < 7) e.push('Le numéro de téléphone semble incomplet (7 chiffres minimum).');
  if (!client.date) e.push('Choisissez une date.');
  else if (!estDateValide(client.date, maintenant, config)) e.push("La date choisie n'est plus disponible, choisissez-en une autre.");
  if (entree.mode === 'livraison') {
    if (!config.livraison.actif) e.push("La livraison n'est pas proposée actuellement.");
    else {
      if (!resultat.livraison.applicable) e.push('Choisissez une zone de livraison desservie.');
      if (!client.adresse.trim()) e.push('Indiquez votre adresse de livraison.');
    }
  }
  if (!chiffres(config.whatsapp)) e.push("Le numéro WhatsApp du commerce n'est pas configuré.");
  return e;
}
