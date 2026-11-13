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

// Révélation au défilement : blocs [data-reveal] et titres masqués [data-lignes] (déclenchés par la classe .vu)
const aRevoir = document.querySelectorAll<HTMLElement>('[data-reveal], [data-lignes]:not([data-lignes="immediat"])');
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

// Héros : le disque tourne un peu plus quand on défile (transform seul, une écriture par image)
const hero = document.querySelector<HTMLElement>('[data-hero]');
if (hero && !reduit) {
  let attente = false;
  const maj = (): void => {
    attente = false;
    if (window.scrollY < window.innerHeight * 1.5) hero.style.setProperty('--defil', String(Math.round(window.scrollY)));
  };
  window.addEventListener('scroll', () => { if (!attente) { attente = true; requestAnimationFrame(maj); } }, { passive: true });

  // Halo qui suit le pointeur (souris uniquement)
  const halo = hero.querySelector<HTMLElement>('[data-halo]');
  if (halo && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let x = 0, y = 0, enCours = false;
    const place = (): void => { enCours = false; halo.style.transform = `translate3d(${x}px, ${y}px, 0)`; };
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      halo.setAttribute('data-actif', '');
      if (!enCours) { enCours = true; requestAnimationFrame(place); }
    });
    hero.addEventListener('pointerleave', () => halo.removeAttribute('data-actif'));
  }
}

// Compteurs : de 0 à la valeur au moment où ils entrent dans l'écran (la valeur finale est déjà dans le HTML)
const compteurs = document.querySelectorAll<HTMLElement>('[data-compte]');
if (!reduit && compteurs.length && 'IntersectionObserver' in window) {
  const obsC = new IntersectionObserver((entrees) => {
    for (const e of entrees) {
      if (!e.isIntersecting) continue;
      obsC.unobserve(e.target);
      const el = e.target as HTMLElement;
      const fin = Number(el.dataset.compte);
      const debut = performance.now();
      const duree = 1100;
      const pas = (t: number): void => {
        const k = Math.min(1, (t - debut) / duree);
        el.textContent = String(Math.round(fin * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(pas);
      };
      el.textContent = '0';
      requestAnimationFrame(pas);
    }
  }, { threshold: 0.6 });
  compteurs.forEach((c) => obsC.observe(c));
}
