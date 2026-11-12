/** Boutons « Ajouter au panier » des pages statiques : délégation d'événements, aucun îlot par carte. */
import { ajouter } from '../../lib/cart';

const QMAX = 99;

function champ(depuis: Element): HTMLInputElement | null {
  return depuis.closest('.plat__ajout, .qte')?.querySelector<HTMLInputElement>('[data-qte-champ]') ?? null;
}
const lire = (c: HTMLInputElement | null): number => {
  const n = parseInt(c?.value ?? '1', 10);
  return Number.isFinite(n) ? Math.min(QMAX, Math.max(1, n)) : 1;
};

document.addEventListener('click', (ev) => {
  const cible = ev.target as Element | null;
  if (!cible) return;

  const pm = cible.closest<HTMLElement>('[data-qte]');
  if (pm) {
    const c = champ(pm);
    if (c) c.value = String(Math.min(QMAX, Math.max(1, lire(c) + Number(pm.dataset.qte))));
    return;
  }

  const bouton = cible.closest<HTMLButtonElement>('[data-ajout]');
  if (!bouton || bouton.disabled) return;
  const c = champ(bouton);
  const quantite = lire(c);
  ajouter(bouton.dataset.ajout!, quantite);
  if (c) c.value = '1';

  const nom = bouton.dataset.nom ?? '';
  const fait = bouton.dataset.fait ?? '';
  const zone = document.getElementById('annonces');
  if (zone) {
    zone.textContent = '';
    window.setTimeout(() => (zone.textContent = `${quantite} × ${nom} : ${fait}`), 30);
  }
  window.dispatchEvent(new CustomEvent('panier:ajout'));

  if (!bouton.dataset.libelle) bouton.dataset.libelle = bouton.textContent ?? '';
  bouton.textContent = fait;
  bouton.classList.add('btn--ok');
  window.clearTimeout(Number(bouton.dataset.minuterie));
  bouton.dataset.minuterie = String(
    window.setTimeout(() => {
      bouton.textContent = bouton.dataset.libelle ?? '';
      bouton.classList.remove('btn--ok');
    }, 1600),
  );
});

document.addEventListener('input', (ev) => {
  const c = (ev.target as Element | null)?.closest<HTMLInputElement>('[data-qte-champ]');
  if (c) c.value = c.value.replace(/\D/g, '').slice(0, 2);
});
document.addEventListener('focusout', (ev) => {
  const c = (ev.target as Element | null)?.closest<HTMLInputElement>('[data-qte-champ]');
  if (c) c.value = String(lire(c));
});
