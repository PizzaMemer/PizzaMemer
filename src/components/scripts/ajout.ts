/** Boutons « Ajouter au panier » des pages statiques : délégation d'événements, aucun îlot par carte. */
import { ajouter } from '../../lib/cart';

const QMAX = 99;
const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Un petit disque part de la carte et file vers le panier de l'en-tête (transform + opacity, Web Animations). */
function envolerDisque(bouton: HTMLElement): void {
  const carte = bouton.closest('.plat');
  const source = carte?.querySelector<SVGElement>('.illustration');
  const cible = document.querySelector<HTMLElement>('.panier-bouton');
  if (reduit || !source || !cible || typeof source.animate !== 'function') return;
  const a = source.getBoundingClientRect();
  const b = cible.getBoundingClientRect();
  const taille = 56;
  const clone = source.cloneNode(true) as SVGElement;
  clone.removeAttribute('class');
  clone.setAttribute('aria-hidden', 'true');
  clone.removeAttribute('role');
  clone.removeAttribute('aria-label');
  Object.assign(clone.style, { position: 'fixed', left: '0', top: '0', width: `${taille}px`, height: `${taille}px`, zIndex: '90', pointerEvents: 'none', willChange: 'transform' });
  document.body.appendChild(clone);
  const x0 = a.left + a.width / 2 - taille / 2;
  const y0 = a.top + a.height / 2 - taille / 2;
  const x1 = b.left + b.width / 2 - taille / 2;
  const y1 = b.top + b.height / 2 - taille / 2;
  const anim = clone.animate(
    [
      { transform: `translate(${x0}px, ${y0}px) scale(${Math.min(2.4, a.width / taille)}) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 40}px) scale(1.1) rotate(200deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${x1}px, ${y1}px) scale(0.3) rotate(420deg)`, opacity: 0.2 },
    ],
    { duration: 720, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' },
  );
  anim.onfinish = () => {
    clone.remove();
    cible.classList.remove('panier-bouton--recoit');
    void cible.offsetWidth;
    cible.classList.add('panier-bouton--recoit');
  };
}

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
  envolerDisque(bouton);

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
