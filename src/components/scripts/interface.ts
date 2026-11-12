/** Interactions légères communes : menu mobile, en-tête condensé, apparition au défilement. */
const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Menu mobile
const bouton = document.querySelector<HTMLButtonElement>('[data-menu-bouton]');
const menu = document.getElementById('menu-principal');
if (bouton && menu) {
  const fermer = (): void => {
    bouton.setAttribute('aria-expanded', 'false');
    menu.dataset.ouvert = 'false';
  };
  bouton.addEventListener('click', () => {
    const ouvert = bouton.getAttribute('aria-expanded') === 'true';
    bouton.setAttribute('aria-expanded', String(!ouvert));
    menu.dataset.ouvert = String(!ouvert);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bouton.getAttribute('aria-expanded') === 'true') {
      fermer();
      bouton.focus();
    }
  });
  menu.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) fermer();
  });
}

// En-tête qui se condense au défilement
const entete = document.querySelector<HTMLElement>('[data-entete]');
if (entete) {
  const maj = (): void => {
    if (window.scrollY > 24) entete.setAttribute('data-condense', '');
    else entete.removeAttribute('data-condense');
  };
  maj();
  window.addEventListener('scroll', maj, { passive: true });
}

// Apparition douce au défilement, échelonnée pour les éléments qui entrent ensemble
const aRevoir = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (reduit || !('IntersectionObserver' in window)) {
  aRevoir.forEach((el) => el.classList.add('vu'));
} else {
  const obs = new IntersectionObserver(
    (entrees) => {
      let rang = 0;
      for (const e of entrees) {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.setProperty('--delai', `${Math.min(rang, 4) * 110}ms`);
          rang++;
          e.target.classList.add('vu');
          obs.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  aRevoir.forEach((el) => obs.observe(el));
}
