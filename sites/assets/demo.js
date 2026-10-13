/* Script partagé des sites de démonstration : menu mobile + apparition au scroll. */
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.querySelector('.nav-menu');
  if (toggle && menu) {
    const close = () => { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
    toggle.addEventListener('click', () => {
      const open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  const els = document.querySelectorAll('[data-reveal]');
  const show = () => els.forEach(el => {
    if (!el.classList.contains('in') && el.getBoundingClientRect().top < innerHeight - 40) el.classList.add('in');
  });
  addEventListener('scroll', show, { passive: true });
  addEventListener('resize', show);
  addEventListener('load', show);
  show();

  const y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
