import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { commerce } from '../config/commerce';
import { pizzas } from '../config/pizzas';
import { textes } from '../content/textes';
import { aujourdhuiMaurice } from '../lib/catalogue';
import { definirQuantite, lirePanier, majClient, majOptions, retirer, usePanier, vider } from '../lib/cart';
import { datesProposees } from '../lib/dates';
import { rs } from '../lib/format';
import { calculer } from '../lib/pricing';
import type { EntreeCalcul, EtatCode } from '../lib/types';
import { construireMessage, lienWhatsApp, validerCommande } from '../lib/whatsapp';
import { libelles } from './libelles';
import { fraisZone, remplir } from './outils';

interface Props {
  hrefCarte: string;
}

const MESSAGES_CODE: Partial<Record<EtatCode, string>> = {
  applique: textes.commande.codes.applique,
  inconnu: textes.commande.codes.inconnu,
  expire: textes.commande.codes.expire,
  inactif: textes.commande.codes.inactif,
  'minimum-non-atteint': textes.commande.codes.minimum,
  'non-retenu': textes.commande.codes.nonRetenu,
};

interface Envoi {
  lien: string;
  message: string;
}

export default function Commande({ hrefCarte }: Props) {
  const etat = usePanier();
  const [monte, setMonte] = useState(false);
  const [maintenant, setMaintenant] = useState<Date | null>(null);
  const [saisieCode, setSaisieCode] = useState('');
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState<Envoi | null>(null);
  const [copie, setCopie] = useState('');
  const [retirees, setRetirees] = useState<string[] | null>(null);
  const refErreurs = useRef<HTMLDivElement>(null);
  const refApres = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMonte(true);
    setMaintenant(new Date());
    setSaisieCode(lirePanier().codePromo);
  }, []);

  const dates = useMemo(() => (maintenant ? datesProposees(maintenant) : []), [maintenant]);

  const entree: EntreeCalcul = {
    lignes: etat.lignes,
    mode: etat.mode,
    zoneId: etat.zoneId,
    sousVide: etat.sousVide,
    codePromo: etat.codePromo,
    aujourdhui: aujourdhuiMaurice(),
  };
  const resultat = calculer(entree);

  // Pizzas devenues indisponibles : on prévient et on les retire.
  const cleIgnorees = resultat.ignorees.join('|');
  useEffect(() => {
    if (!monte || !resultat.ignorees.length) return;
    const noms = resultat.ignorees.map((id) => pizzas.find((p) => p.id === id)?.nom ?? '').filter(Boolean);
    setRetirees((prev) => [...(prev ?? []), ...noms]);
    resultat.ignorees.forEach((id) => retirer(id));
  }, [monte, cleIgnorees]);

  // Mode incohérent avec la config (ex. livraison désactivée depuis) : on revient au retrait.
  useEffect(() => {
    if (!monte) return;
    if (etat.mode === 'livraison' && !commerce.livraison.actif && commerce.retrait.actif) majOptions({ mode: 'retrait' });
    if (etat.mode === 'retrait' && !commerce.retrait.actif && commerce.livraison.actif) majOptions({ mode: 'livraison' });
  }, [monte, etat.mode]);

  useEffect(() => {
    if (erreurs.length) refErreurs.current?.focus();
  }, [erreurs]);
  useEffect(() => {
    if (envoi) refApres.current?.focus();
  }, [envoi]);

  const dateChoisie = dates.find((d) => d.iso === etat.client.date);
  const livraisonChoisie = etat.mode === 'livraison' && commerce.livraison.actif;
  const zone = commerce.livraison.zones.find((z) => z.id === etat.zoneId);

  const incitations: string[] = [];
  if (resultat.pizzasAvantRemiseQuantite) {
    incitations.push(
      resultat.pizzasAvantRemiseQuantite === 1
        ? textes.panier.encoreRemiseUn
        : remplir(textes.panier.encoreRemisePlusieurs, { n: resultat.pizzasAvantRemiseQuantite }),
    );
  }
  if (resultat.livraison.resteAvantGratuite && resultat.livraison.resteAvantGratuite > 0) {
    incitations.push(remplir(textes.panier.encoreLivraison, { montant: rs(resultat.livraison.resteAvantGratuite) }));
  }

  const envoyer = (e: Event): void => {
    e.preventDefault();
    const maintenantReel = new Date();
    const problemes = validerCommande(resultat, entree, etat.client, maintenantReel);
    if (problemes.length) {
      setErreurs(problemes);
      setEnvoi(null);
      return;
    }
    // Un seul ResultatCalcul alimente l'affichage ET le message.
    const message = construireMessage(resultat, entree, etat.client);
    const lien = lienWhatsApp(message);
    if (!lien) {
      setErreurs([textes.commande.indisponible]);
      return;
    }
    setErreurs([]);
    setCopie('');
    setEnvoi({ lien, message });
    const w = window.open(lien, '_blank');
    if (w) w.opener = null;
  };

  const copier = async (): Promise<void> => {
    if (!envoi) return;
    try {
      await navigator.clipboard.writeText(envoi.message);
      setCopie(libelles.copie);
    } catch {
      setCopie(libelles.copieEchec);
    }
  };

  const viderPanier = (): void => {
    vider();
    setEnvoi(null);
    setErreurs([]);
  };

  if (!monte) {
    return <p class="commande__attente">{libelles.chargement}</p>;
  }

  if (resultat.vide && !envoi) {
    return (
      <div class="commande__vide">
        {retirees && (
          <p class="avis" role="status">
            {retirees.length ? `${libelles.retiresIndispos} ${retirees.join(', ')}.` : libelles.retiresIndisposSans}
          </p>
        )}
        <p>{textes.panier.vide}</p>
        <a class="btn btn--tomate" href={hrefCarte}>{textes.panier.videAction}</a>
      </div>
    );
  }

  const modes = [
    commerce.retrait.actif && ({ id: 'retrait', nom: textes.commande.modes.retrait } as const),
    commerce.livraison.actif && ({ id: 'livraison', nom: textes.commande.modes.livraison } as const),
  ].filter(Boolean) as { id: 'retrait' | 'livraison'; nom: string }[];

  return (
    <form class="commande" onSubmit={envoyer} noValidate>
      <div class="commande__colonne">
        {retirees && (
          <p class="avis" role="status">
            {retirees.length ? `${libelles.retiresIndispos} ${retirees.join(', ')}.` : libelles.retiresIndisposSans}
          </p>
        )}

        <section class="etape" aria-labelledby="e-panier">
          <h2 id="e-panier" class="etape__titre"><span class="etape__num" aria-hidden="true">1</span>{textes.commande.etapes.panier}</h2>
          <ul class="tiroir__lignes">
            {resultat.lignes.map((l) => (
              <li class="ligne-panier" key={l.id}>
                <div class="ligne-panier__nom">
                  <span>{l.nom}</span>
                  <span class="ligne-panier__unite">{rs(l.prixUnitaire)}</span>
                </div>
                <div class="qte qte--petit" role="group" aria-label={`${libelles.quantite} — ${l.nom}`}>
                  <button type="button" class="qte__bouton" onClick={() => definirQuantite(l.id, l.quantite - 1)} aria-label={`${libelles.moins} : ${l.nom}`}>−</button>
                  <span class="qte__texte">{l.quantite}</span>
                  <button type="button" class="qte__bouton" onClick={() => definirQuantite(l.id, l.quantite + 1)} aria-label={`${libelles.plus} : ${l.nom}`}>+</button>
                </div>
                <span class="ligne-panier__total">{rs(l.total)}</span>
                <button type="button" class="lien-discret" onClick={() => retirer(l.id)} aria-label={`${libelles.retirer} : ${l.nom}`}>{libelles.retirer}</button>
              </li>
            ))}
          </ul>

          {commerce.sousVide.actif && (
            <label class="option">
              <input type="checkbox" checked={etat.sousVide} onChange={(e) => majOptions({ sousVide: (e.currentTarget as HTMLInputElement).checked })} />
              <span class="option__texte">
                <strong>{commerce.sousVide.libelle}</strong> · +{rs(commerce.sousVide.prixParPizza)} par pizza
                {commerce.sousVide.aide && <span class="option__aide">{commerce.sousVide.aide}</span>}
              </span>
            </label>
          )}

          {commerce.remises.codes.length > 0 && (
            <details class="code" open={etat.codePromo !== ''}>
              <summary>{libelles.codePromoOuvrir}</summary>
              <div class="code__champ">
                <label for="code-promo" class="sr-only">{textes.commande.champs.code}</label>
                <input id="code-promo" class="champ" type="text" autocomplete="off" autocapitalize="characters" value={saisieCode} placeholder={textes.commande.champs.code}
                  onInput={(e) => setSaisieCode((e.currentTarget as HTMLInputElement).value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); majOptions({ codePromo: saisieCode }); } }} />
                <button type="button" class="btn btn--clair" onClick={() => majOptions({ codePromo: saisieCode })}>{textes.commande.champs.appliquer}</button>
              </div>
              {etat.codePromo !== '' && MESSAGES_CODE[resultat.etatCode] && (
                <p class={resultat.etatCode === 'applique' ? 'code__etat code__etat--ok' : 'code__etat'} role="status">{MESSAGES_CODE[resultat.etatCode]}</p>
              )}
            </details>
          )}
        </section>

        <fieldset class="etape" >
          <legend class="etape__titre"><span class="etape__num" aria-hidden="true">2</span>{textes.commande.etapes.recuperation}</legend>
          {modes.length > 1 && (
            <div class="bascule" role="radiogroup" aria-label={textes.commande.etapes.recuperation}>
              {modes.map((m) => (
                <label class="bascule__choix" key={m.id}>
                  <input type="radio" name="mode" value={m.id} checked={etat.mode === m.id} onChange={() => majOptions({ mode: m.id })} />
                  <span>{m.nom}</span>
                </label>
              ))}
            </div>
          )}
          {!livraisonChoisie && (
            <p class="etape__note">{commerce.adresseRetrait}{commerce.retrait.frais > 0 ? ` · ${libelles.retraitFrais} : ${rs(commerce.retrait.frais)}` : ''}</p>
          )}
          {livraisonChoisie && (
            <>
              <div class="champ-groupe">
                <label for="zone">{textes.commande.champs.zone}</label>
                <select id="zone" class="champ" value={etat.zoneId ?? ''} onChange={(e) => majOptions({ zoneId: (e.currentTarget as HTMLSelectElement).value || null })}>
                  <option value="">{textes.commande.champs.choisirZone}</option>
                  {commerce.livraison.zones.map((z) => (
                    <option value={z.id} selected={z.id === etat.zoneId} key={z.id}>{z.nom} — {rs(fraisZone(z))}</option>
                  ))}
                </select>
                {zone && zone.gratuitDes !== null && <p class="champ__aide">{libelles.zoneFrais} {rs(fraisZone(zone))} · {libelles.offerteDes(rs(zone.gratuitDes))}</p>}
              </div>
              <div class="champ-groupe">
                <label for="adresse">{textes.commande.champs.adresse}</label>
                <textarea id="adresse" class="champ" rows={2} autocomplete="street-address" value={etat.client.adresse} onInput={(e) => majClient({ adresse: (e.currentTarget as HTMLTextAreaElement).value })} />
                <p class="champ__aide">{textes.contact.livraison.hors}</p>
              </div>
            </>
          )}
        </fieldset>

        <fieldset class="etape">
          <legend class="etape__titre"><span class="etape__num" aria-hidden="true">3</span>{textes.commande.etapes.jour}</legend>
          <div class="dates" role="radiogroup">
            {dates.map((d) => (
              <label class="date" key={d.iso}>
                <input type="radio" name="date" value={d.iso} checked={etat.client.date === d.iso} onChange={() => majClient({ date: d.iso })} />
                <span class="date__carte">
                  <span class="date__court">{d.libelleCourt}</span>
                  {d.estAujourdhui && <span class="date__jour">{libelles.jourMeme}</span>}
                </span>
              </label>
            ))}
          </div>
          <p class="etape__note">{commerce.distribution.conseil}</p>
          {dateChoisie?.estAujourdhui && commerce.distribution.mentionJourMeme && <p class="avis avis--info" role="status">{commerce.distribution.mentionJourMeme}</p>}
        </fieldset>

        <fieldset class="etape">
          <legend class="etape__titre"><span class="etape__num" aria-hidden="true">4</span>{textes.commande.etapes.coordonnees}</legend>
          <div class="champ-groupe">
            <label for="nom">{textes.commande.champs.nom}</label>
            <input id="nom" class="champ" type="text" autocomplete="name" value={etat.client.nom} onInput={(e) => majClient({ nom: (e.currentTarget as HTMLInputElement).value })} />
          </div>
          <div class="champ-groupe">
            <label for="tel">{textes.commande.champs.telephone}</label>
            <input id="tel" class="champ" type="tel" autocomplete="tel" inputmode="tel" value={etat.client.telephone} onInput={(e) => majClient({ telephone: (e.currentTarget as HTMLInputElement).value })} />
          </div>
          <div class="champ-groupe">
            <label for="remarque">{textes.commande.champs.remarque}</label>
            <textarea id="remarque" class="champ" rows={2} value={etat.client.remarque} aria-describedby="remarque-aide" onInput={(e) => majClient({ remarque: (e.currentTarget as HTMLTextAreaElement).value })} />
            <p class="champ__aide" id="remarque-aide">{textes.commande.champs.remarqueAide}</p>
          </div>
        </fieldset>
      </div>

      <aside class="commande__recap" aria-labelledby="e-recap">
        <h2 id="e-recap" class="etape__titre"><span class="etape__num" aria-hidden="true">5</span>{textes.commande.etapes.recap}</h2>
        <ul class="recap__lignes">
          {resultat.lignes.map((l) => (
            <li key={l.id}><span>{l.quantite} × {l.nom}</span><span>{rs(l.total)}</span></li>
          ))}
        </ul>
        <dl class="totaux">
          <div><dt>{textes.panier.sousTotal}</dt><dd>{rs(resultat.sousTotal)}</dd></div>
          {resultat.remises.map((x) => (
            <div class="totaux__remise" key={x.libelle}><dt>{x.libelle}</dt><dd>−{rs(x.montant)}</dd></div>
          ))}
          {resultat.sousVide > 0 && <div><dt>{libelles.sousVide} ({resultat.nombrePizzas} {resultat.nombrePizzas > 1 ? libelles.pizzas : libelles.pizza})</dt><dd>{rs(resultat.sousVide)}</dd></div>}
          {resultat.livraison.applicable && (
            <div>
              <dt>{textes.panier.livraison}{resultat.livraison.zoneNom ? ` — ${resultat.livraison.zoneNom}` : ''}</dt>
              <dd>{resultat.livraison.offerte ? textes.panier.livraisonOfferte : rs(resultat.livraison.frais)}</dd>
            </div>
          )}
          {!resultat.livraison.applicable && resultat.livraison.frais > 0 && <div><dt>{libelles.retraitFrais}</dt><dd>{rs(resultat.livraison.frais)}</dd></div>}
          <div class="totaux__total"><dt>{textes.panier.total}</dt><dd>{rs(resultat.total)}</dd></div>
        </dl>
        {incitations.map((t) => <p class="incitation" key={t}>{t}</p>)}

        <div ref={refErreurs} class="erreurs" role="alert" tabIndex={-1} hidden={erreurs.length === 0}>
          {erreurs.length > 0 && (
            <>
              <p><strong>{libelles.erreursTitre}</strong></p>
              <ul>{erreurs.map((m) => <li key={m}>{m}</li>)}</ul>
            </>
          )}
        </div>

        <button type="submit" class="btn btn--whatsapp btn--large">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.600 15.100L2 22l5-1.300A10 10 0 1 0 12 2zm0 18.200c-1.500 0-3-.4-4.200-1.200l-.3-.2-3 .8.8-2.900-.2-.3A8.200 8.200 0 1 1 12 20.200zm4.500-6.100c-.2-.1-1.500-.7-1.700-.8s-.4-.1-.6.100-.6.800-.8 1-.3.200-.6.100a6.700 6.700 0 0 1-3.300-2.900c-.2-.4.200-.4.700-1.300.1-.2 0-.3 0-.4l-.8-1.900c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.300 3 3 0 0 0-.9 2.200 5.200 5.200 0 0 0 1.100 2.800 11.900 11.900 0 0 0 4.600 4c1.700.7 2.400.8 3.200.7a2.700 2.700 0 0 0 1.800-1.300 2.200 2.200 0 0 0 .2-1.300c-.1-.1-.3-.2-.6-.3z"/></svg>
          {textes.commande.envoyer}
        </button>
        <p class="recap__note">{textes.commande.avantEnvoi}</p>

        {envoi && (
          <div class="apres" ref={refApres} tabIndex={-1} role="status">
            <h3>{textes.commande.apresEnvoi.titre}</h3>
            <p>{textes.commande.apresEnvoi.texte}</p>
            <p class="apres__actions">
              <a class="btn btn--whatsapp" href={envoi.lien} target="_blank" rel="noopener noreferrer">{textes.commande.apresEnvoi.rouvrir}</a>
              <button type="button" class="btn btn--clair" onClick={copier}>{textes.commande.apresEnvoi.copier}</button>
              <button type="button" class="btn btn--clair" onClick={viderPanier}>{textes.commande.apresEnvoi.vider}</button>
            </p>
            {copie && <p class="apres__copie" role="status">{copie}</p>}
          </div>
        )}
      </aside>
    </form>
  );
}
