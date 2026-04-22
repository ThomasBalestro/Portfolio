/* ============================================================
   PORTFOLIO — DARK FUTURISTE
   main.js
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

/* ─── CARTES CLIQUABLES ─── */
document.querySelectorAll('.project-card[data-href]').forEach(card => {
  card.addEventListener('click', () => {
    window.location.href = card.dataset.href;
  });
});

/* ─── BURGER MENU ─── */
const burger     = document.getElementById('burger');
const navOverlay = document.getElementById('nav-overlay');
const overlayLinks = document.querySelectorAll('.nav-overlay-item');

function toggleMenu(forceClose = false) {
  const isOpen = burger.classList.contains('open') || forceClose;

  burger.classList.toggle('open', !isOpen);
  navOverlay.classList.toggle('open', !isOpen);
  burger.setAttribute('aria-expanded', String(!isOpen));

  /* Bloquer le scroll du body quand le menu est ouvert */
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

burger.addEventListener('click', () => toggleMenu());

/* Fermer le menu au clic sur un lien */
overlayLinks.forEach(link => {
  link.addEventListener('click', () => toggleMenu(true));
});

/* Fermer avec Échap */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navOverlay.classList.contains('open')) {
    toggleMenu(true);
  }
});


const TYPING_LINES = [
  'const dev = new Developer("Full-Stack");',
  "// Building tomorrow's web, today.",
  'git commit -m "Always learning"',
  'console.log("Passion for clean code ✓");',
];

let lineIndex   = 0;
let charIndex   = 0;
let isDeleting  = false;

const typingEl = document.getElementById('typing-text');

function type() {
  const currentLine = TYPING_LINES[lineIndex];
  const speed       = isDeleting ? 30 : 60;

  if (!isDeleting && charIndex <= currentLine.length) {
    typingEl.innerHTML = currentLine.slice(0, charIndex++) + '<span class="cursor"></span>';
  } else if (isDeleting && charIndex >= 0) {
    typingEl.innerHTML = currentLine.slice(0, charIndex--) + '<span class="cursor"></span>';
  }

  if (!isDeleting && charIndex > currentLine.length) {
    setTimeout(() => { isDeleting = true; }, 2200);
  } else if (isDeleting && charIndex < 0) {
    isDeleting  = false;
    charIndex   = 0;
    lineIndex   = (lineIndex + 1) % TYPING_LINES.length;
  }

  setTimeout(type, speed);
}

type();

/* ─── SCROLL REVEAL ─── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    entry.target.classList.add('visible');

    /* Animate skill bars when their parent becomes visible */
    entry.target.querySelectorAll('.skill-fill').forEach((bar) => {
      bar.style.transitionDelay = Math.random() * 0.3 + 's';
      bar.style.transform = `scaleX(${bar.style.getPropertyValue('--w') || 1})`;
    });
  });
}, { threshold: 0.12 });

document
  .querySelectorAll('.reveal, .timeline-item, .skill-group')
  .forEach((el) => revealObserver.observe(el));
