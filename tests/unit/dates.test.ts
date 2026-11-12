import { describe, expect, it } from 'vitest';
import { datesProposees, estDateValide, libelleDate } from '../../src/lib/dates';
import { commerce } from '../../src/config/commerce';
import { configTest } from './helpers';

// Maurice = UTC+4. 2026-11-19 est un jeudi.
const maurice = (iso: string) => new Date(`${iso}+04:00`); // ex. '2026-11-19T10:00:00'
const isos = (d: Date, c = configTest()) => datesProposees(d, c).map((x) => x.iso);

describe('datesProposees', () => {
  it('propose jeudi/vendredi/samedi depuis un lundi', () => {
    const r = datesProposees(maurice('2026-11-16T10:00:00'), configTest());
    expect(r.map((x) => x.iso).slice(0, 4)).toEqual(['2026-11-19', '2026-11-20', '2026-11-21', '2026-11-26']);
    expect(r).toHaveLength(6);
    expect(r[0]).toMatchObject({ libelle: 'Jeudi 19 novembre', libelleCourt: 'Jeu. 19 nov.', estAujourdhui: false });
  });
  it('jour même inclus si autorisé', () => {
    const r = datesProposees(maurice('2026-11-19T10:00:00'), configTest());
    expect(r[0]).toMatchObject({ iso: '2026-11-19', estAujourdhui: true });
  });
  it('jour même exclu si interdit', () => {
    const c = configTest(); c.distribution.jourMemeAutorise = false;
    expect(isos(maurice('2026-11-19T10:00:00'), c)[0]).toBe('2026-11-20');
  });
  it('heure limite du jour même', () => {
    const c = configTest(); c.distribution.heureLimiteJourMeme = 15;
    expect(isos(maurice('2026-11-19T14:59:00'), c)[0]).toBe('2026-11-19');
    expect(isos(maurice('2026-11-19T15:00:00'), c)[0]).toBe('2026-11-20');
  });
  it('fermetures exclues', () => {
    const c = configTest(); c.distribution.fermetures = ['2026-11-20'];
    expect(isos(maurice('2026-11-16T10:00:00'), c).slice(0, 3)).toEqual(['2026-11-19', '2026-11-21', '2026-11-26']);
  });
  it('minuit : 21h UTC le mercredi = jeudi 01h à Maurice', () => {
    const d = new Date('2026-11-18T21:00:00Z');
    const r = datesProposees(d, configTest());
    expect(r[0]).toMatchObject({ iso: '2026-11-19', estAujourdhui: true });
    // juste avant (20h59 UTC = 00h59 Maurice mercredi → 18) : le jour même n'est pas un jour de distribution
    expect(isos(new Date('2026-11-18T19:59:00Z'))[0]).toBe('2026-11-19');
    expect(datesProposees(new Date('2026-11-18T19:59:00Z'), configTest())[0].estAujourdhui).toBe(false);
  });
  it('minuit : 20h UTC jeudi = vendredi 00h à Maurice, jeudi n’est plus aujourd’hui', () => {
    const r = datesProposees(new Date('2026-11-19T20:00:00Z'), configTest());
    expect(r[0]).toMatchObject({ iso: '2026-11-20', estAujourdhui: true });
  });
  it('heure limite lue en heure de Maurice (pas UTC)', () => {
    const c = configTest(); c.distribution.heureLimiteJourMeme = 3;
    // 2026-11-18T22:00Z = jeudi 02h Maurice (< 3) ; en UTC il serait 22h mercredi
    expect(isos(new Date('2026-11-18T22:00:00Z'), c)[0]).toBe('2026-11-19');
    expect(isos(new Date('2026-11-18T23:30:00Z'), c)[0]).toBe('2026-11-20');
  });
  it('config sans jour ou sans date demandée → []', () => {
    const c = configTest(); c.distribution.jours = [];
    expect(datesProposees(new Date(), c)).toEqual([]);
    const c2 = configTest(); c2.distribution.nombreDatesProposees = 0;
    expect(datesProposees(new Date(), c2)).toEqual([]);
  });
  it('passage d’année', () => {
    const r = isos(maurice('2026-12-30T10:00:00'));
    expect(r.slice(0, 3)).toEqual(['2026-12-31', '2027-01-01', '2027-01-02']);
  });
});

describe('estDateValide et libelleDate', () => {
  const now = maurice('2026-11-16T10:00:00');
  it('valide', () => {
    expect(estDateValide('2026-11-19', now, configTest())).toBe(true);
    expect(estDateValide('2026-11-17', now, configTest())).toBe(false); // mardi
    expect(estDateValide('2026-11-12', now, configTest())).toBe(false); // passé
    expect(estDateValide('', now, configTest())).toBe(false);
    expect(estDateValide('2030-01-03', now, configTest())).toBe(false); // trop loin
  });
  it('libellé', () => {
    expect(libelleDate('2026-11-19')).toBe('Jeudi 19 novembre');
    expect(libelleDate('n’importe quoi')).toBe('n’importe quoi');
  });
  it('fumée sur la vraie config', () => {
    const r = datesProposees(now, commerce);
    expect(r).toHaveLength(commerce.distribution.nombreDatesProposees);
  });
});
