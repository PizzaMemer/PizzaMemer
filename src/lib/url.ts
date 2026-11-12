/** Préfixe un chemin interne avec le chemin de base GitHub Pages. url('carte/') → "/PizzaMemer/carte/" */
export function url(chemin = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${chemin.replace(/^\//, '')}`;
}
