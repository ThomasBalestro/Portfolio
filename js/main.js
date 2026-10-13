/* ============================================================
   PORTFOLIO — DARK FUTURISTE
   main.js — partagé par index.html et les pages annexes.
   Chaque bloc vérifie que ses éléments existent : une page
   sans burger ou sans animation de typing ne casse plus le reste.
   ============================================================ */

/* ─── EMAIL ANTI-SPAM ───
   L'adresse est fragmentée pour tromper les scrapers de bots.
   Elle est reconstruite en JS et injectée sur le bouton au chargement. ── */
(function () {
  const u     = 'thomas' + '.balestro';
  const d     = 'gmail'  + '.com';
  const email = u + '@' + d;

  const btn = document.getElementById('mailto-btn');
  if (btn) btn.href = 'mailto:' + email;
})();

/* ─── CARTES CLIQUABLES ───
   Toute la carte mène à data-href. Un vrai lien <a> placé dans la
   carte (GitHub, démo…) garde la priorité. Accessible au clavier. ── */
document.querySelectorAll('.project-card[data-href]').forEach(card => {
  const href = card.dataset.href;
  if (!href || href === '#') return;

  card.setAttribute('role', 'link');
  card.setAttribute('tabindex', '0');

  const go = () => {
    if (card.dataset.target === '_blank') window.open(href, '_blank', 'noopener');
    else window.location.href = href;
  };

  card.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    go();
  });
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') go();
  });
});

/* ─── BURGER MENU ─── */
(function () {
  const burger       = document.getElementById('burger');
  const navOverlay   = document.getElementById('nav-overlay');
  if (!burger || !navOverlay) return;

  const overlayLinks = navOverlay.querySelectorAll('.nav-overlay-item');

  function toggleMenu(forceClose = false) {
    const isOpen = burger.classList.contains('open') || forceClose;

    burger.classList.toggle('open', !isOpen);
    navOverlay.classList.toggle('open', !isOpen);
    burger.setAttribute('aria-expanded', String(!isOpen));

    /* Bloquer le scroll du body quand le menu est ouvert */
    document.body.style.overflow = isOpen ? '' : 'hidden';
  }

  burger.addEventListener('click', () => toggleMenu());
  overlayLinks.forEach(link => link.addEventListener('click', () => toggleMenu(true)));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOverlay.classList.contains('open')) toggleMenu(true);
  });
})();

/* ─── TYPING ANIMATION (index uniquement) ─── */
(function () {
  const typingEl = document.getElementById('typing-text');
  if (!typingEl) return;

  const TYPING_LINES = [
    'const dev = new Developer("Full-Stack");',
    "// Building tomorrow's web, today.",
    'git commit -m "Always learning"',
    'console.log("Passion for clean code ✓");',
  ];

  /* Texte inséré via textContent + curseur en élément DOM : aucune injection HTML possible */
  const textNode = document.createElement('span');
  const cursor   = document.createElement('span');
  cursor.className = 'cursor';
  typingEl.replaceChildren(textNode, cursor);
  const render = (txt) => { textNode.textContent = txt; };

  let lineIndex  = 0;
  let charIndex  = 0;
  let isDeleting = false;

  function type() {
    const currentLine = TYPING_LINES[lineIndex];
    const speed       = isDeleting ? 30 : 60;

    if (!isDeleting && charIndex <= currentLine.length) {
      render(currentLine.slice(0, charIndex++));
    } else if (isDeleting && charIndex >= 0) {
      render(currentLine.slice(0, charIndex--));
    }

    if (!isDeleting && charIndex > currentLine.length) {
      setTimeout(() => { isDeleting = true; }, 2200);
    } else if (isDeleting && charIndex < 0) {
      isDeleting = false;
      charIndex  = 0;
      lineIndex  = (lineIndex + 1) % TYPING_LINES.length;
    }

    setTimeout(type, speed);
  }

  type();
})();

/* ─── SCROLL REVEAL ─── */
function revealVisible() {
  document.querySelectorAll('.reveal:not(.visible), .timeline-item:not(.visible), .skill-group:not(.visible)').forEach(el => {
    const rect = el.getBoundingClientRect();
    /* Visible OU déjà dépassé (saut d'ancre, scroll rapide) */
    if (rect.top < window.innerHeight + 50) {
      el.classList.add('visible');
      el.querySelectorAll('.skill-fill').forEach(bar => {
        bar.style.transitionDelay = Math.random() * 0.3 + 's';
        bar.style.transform = `scaleX(${bar.style.getPropertyValue('--w') || 1})`;
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', revealVisible);
window.addEventListener('load', revealVisible);
window.addEventListener('scroll', revealVisible, { passive: true });
window.addEventListener('resize', revealVisible);
setTimeout(revealVisible, 100);
revealVisible();
