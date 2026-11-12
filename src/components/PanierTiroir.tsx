import { useEffect, useRef, useState } from 'preact/hooks';
import { textes } from '../content/textes';
import { definirQuantite, retirer, usePanier } from '../lib/cart';
import { rs } from '../lib/format';
import { libelles } from './libelles';
import { OUVRIR_TIROIR, calculDepuisEtat } from './panier-commun';
import { remplir } from './outils';

interface Props {
  hrefCarte: string;
  hrefCommande: string;
}

/** Tiroir du panier : <dialog> modal natif (piège de focus, Échap, retour du focus) + fermeture au clic extérieur. */
export default function PanierTiroir({ hrefCarte, hrefCommande }: Props) {
  const etat = usePanier();
  const r = calculDepuisEtat(etat);
  const ref = useRef<HTMLDialogElement>(null);
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    const ouvrir = (): void => {
      const d = ref.current;
      if (d && !d.open) {
        d.showModal();
        setOuvert(true);
      }
    };
    (window as unknown as { __tiroirPret?: boolean }).__tiroirPret = true;
    window.addEventListener(OUVRIR_TIROIR, ouvrir);
    return () => {
      (window as unknown as { __tiroirPret?: boolean }).__tiroirPret = false;
      window.removeEventListener(OUVRIR_TIROIR, ouvrir);
    };
  }, []);

  const fermer = (): void => ref.current?.close();

  const surClic = (e: MouseEvent): void => {
    // Un clic sur le fond (l'élément dialog lui-même, hors du panneau) ferme le tiroir.
    if (e.target === ref.current) fermer();
  };

  const incitations: string[] = [];
  if (r.pizzasAvantRemiseQuantite) {
    incitations.push(
      r.pizzasAvantRemiseQuantite === 1
        ? textes.panier.encoreRemiseUn
        : remplir(textes.panier.encoreRemisePlusieurs, { n: r.pizzasAvantRemiseQuantite }),
    );
  }
  if (r.livraison.resteAvantGratuite && r.livraison.resteAvantGratuite > 0) {
    incitations.push(remplir(textes.panier.encoreLivraison, { montant: rs(r.livraison.resteAvantGratuite) }));
  }

  return (
    <dialog ref={ref} class="tiroir" aria-labelledby="tiroir-titre" onClick={surClic} onClose={() => setOuvert(false)}>
      <div class="tiroir__panneau">
        <header class="tiroir__tete">
          <h2 id="tiroir-titre">{textes.panier.titre}</h2>
          <button type="button" class="icone-bouton" onClick={fermer} aria-label={libelles.fermer}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
            </svg>
          </button>
        </header>

        {ouvert && r.vide ? (
          <div class="tiroir__vide">
            <p>{textes.panier.vide}</p>
            <a class="btn btn--tomate" href={hrefCarte}>{textes.panier.videAction}</a>
          </div>
        ) : (
          <>
            <ul class="tiroir__lignes">
              {r.lignes.map((l) => (
                <li class="ligne-panier" key={l.id}>
                  <div class="ligne-panier__nom">
                    <span>{l.nom}</span>
                    <span class="ligne-panier__unite">{rs(l.prixUnitaire)}</span>
                  </div>
                  <div class="qte qte--petit" role="group" aria-label={`${libelles.quantite} — ${l.nom}`}>
                    <button type="button" class="qte__bouton" onClick={() => definirQuantite(l.id, l.quantite - 1)} aria-label={`${libelles.moins} : ${l.nom}`}>−</button>
                    <span class="qte__texte" aria-live="polite">{l.quantite}</span>
                    <button type="button" class="qte__bouton" onClick={() => definirQuantite(l.id, l.quantite + 1)} aria-label={`${libelles.plus} : ${l.nom}`}>+</button>
                  </div>
                  <span class="ligne-panier__total">{rs(l.total)}</span>
                  <button type="button" class="lien-discret" onClick={() => retirer(l.id)} aria-label={`${libelles.retirer} : ${l.nom}`}>{libelles.retirer}</button>
                </li>
              ))}
            </ul>

            <div class="tiroir__pied">
              {incitations.map((t) => (
                <p class="incitation" key={t}>{t}</p>
              ))}
              <dl class="totaux">
                <div><dt>{textes.panier.sousTotal}</dt><dd>{rs(r.sousTotal)}</dd></div>
                {r.remises.map((x) => (
                  <div class="totaux__remise" key={x.libelle}><dt>{x.libelle}</dt><dd>−{rs(x.montant)}</dd></div>
                ))}
                {r.sousVide > 0 && <div><dt>{libelles.sousVide}</dt><dd>{rs(r.sousVide)}</dd></div>}
                {r.livraison.applicable && (
                  <div>
                    <dt>{textes.panier.livraison}{r.livraison.zoneNom ? ` — ${r.livraison.zoneNom}` : ''}</dt>
                    <dd>{r.livraison.offerte ? textes.panier.livraisonOfferte : rs(r.livraison.frais)}</dd>
                  </div>
                )}
                <div class="totaux__total"><dt>{textes.panier.total}</dt><dd>{rs(r.total)}</dd></div>
              </dl>
              <a class="btn btn--tomate btn--large" href={hrefCommande} onClick={fermer}>{textes.panier.commander}</a>
              <button type="button" class="lien-discret lien-discret--centre" onClick={fermer}>{textes.panier.continuer}</button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
