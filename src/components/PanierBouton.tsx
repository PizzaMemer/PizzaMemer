import { useEffect, useState } from 'preact/hooks';
import { textes } from '../content/textes';
import { usePanier } from '../lib/cart';
import { OUVRIR_TIROIR } from './panier-commun';

interface Props {
  href: string;
}

/** Bouton du panier dans l'en-tête : un vrai lien vers /commande/, qui ouvre le tiroir quand il est prêt. */
export default function PanierBouton({ href }: Props) {
  const etat = usePanier();
  const n = etat.lignes.reduce((s, l) => s + l.quantite, 0);
  const [rebond, setRebond] = useState(false);

  useEffect(() => {
    let t = 0;
    const surAjout = (): void => {
      setRebond(false);
      window.clearTimeout(t);
      requestAnimationFrame(() => {
        setRebond(true);
        t = window.setTimeout(() => setRebond(false), 450);
      });
    };
    window.addEventListener('panier:ajout', surAjout);
    return () => {
      window.removeEventListener('panier:ajout', surAjout);
      window.clearTimeout(t);
    };
  }, []);

  const ouvrir = (e: MouseEvent): void => {
    if ((window as unknown as { __tiroirPret?: boolean }).__tiroirPret) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent(OUVRIR_TIROIR));
    }
  };

  return (
    <a class="panier-bouton" href={href} onClick={ouvrir} aria-label={`${textes.nav.panier}${n ? ` (${n})` : ''}`}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <path d="M5 8h14l-1.200 11.200a1 1 0 0 1-1 .8H7.200a1 1 0 0 1-1-.8L5 8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M9 8V6.500a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
      <span class="panier-bouton__texte">{textes.nav.panier}</span>
      <span class={`panier-bouton__nombre${n > 0 ? ' est-plein' : ''}${rebond ? ' rebond' : ''}`} aria-hidden="true">
        {n}
      </span>
    </a>
  );
}
