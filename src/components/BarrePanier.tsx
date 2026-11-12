import { useEffect } from 'preact/hooks';
import { usePanier } from '../lib/cart';
import { rs } from '../lib/format';
import { libelles } from './libelles';
import { OUVRIR_TIROIR, calculDepuisEtat } from './panier-commun';

interface Props {
  href: string;
  /** Page de commande : la barre n'a pas lieu d'être. */
  masquer?: boolean;
}

/** Barre collante en bas de l'écran sur mobile, visible dès que le panier n'est pas vide. */
export default function BarrePanier({ href, masquer = false }: Props) {
  const etat = usePanier();
  const r = calculDepuisEtat(etat);
  const visible = !masquer && !r.vide;

  useEffect(() => {
    if (visible) document.body.dataset.barre = '1';
    else delete document.body.dataset.barre;
    return () => {
      delete document.body.dataset.barre;
    };
  }, [visible]);

  if (!visible) return null;
  const ouvrir = (e: MouseEvent): void => {
    if ((window as unknown as { __tiroirPret?: boolean }).__tiroirPret) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent(OUVRIR_TIROIR));
    }
  };
  return (
    <a class="barre-panier" href={href} onClick={ouvrir}>
      <span class="barre-panier__texte">
        {libelles.voirPanier}
        <span class="barre-panier__detail">
          {' · '}
          {r.nombrePizzas} {r.nombrePizzas > 1 ? libelles.pizzas : libelles.pizza}
          {' · '}
          {rs(r.total)}
        </span>
      </span>
    </a>
  );
}
