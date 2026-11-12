/** Interactions légères communes : menu mobile, apparition au défilement, rotation du disque du héros. */
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

// Apparition douce au défilement
const aRevoir = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (reduit || !('IntersectionObserver' in window)) {
  aRevoir.forEach((el) => el.classList.add('vu'));
} else {
  const obs = new IntersectionObserver(
    (entrees) => {
      for (const e of entrees) {
        if (e.isIntersecting) {
          e.target.classList.add('vu');
          obs.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  aRevoir.forEach((el) => obs.observe(el));
}

// Rotation lente du disque du héros au défilement
const disque = document.querySelector<HTMLElement>('[data-tourne]');
if (disque && !reduit) {
  let en = false;
  const maj = (): void => {
    en = false;
    disque.style.setProperty('--rot', `${Math.min(window.scrollY, 900) * 0.035}deg`);
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!en) {
        en = true;
        requestAnimationFrame(maj);
      }
    },
    { passive: true },
  );
}
