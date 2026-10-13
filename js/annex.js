/* ============================================================
   PORTFOLIO — annex.js
   Compteur + filtres des pages Sites internet / Projets web / Applications.
   Fichier séparé : la Content-Security-Policy interdit le JS inline.
   ============================================================ */
(function () {
  const cards      = document.querySelectorAll('.project-card[data-tags]');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const emptyState = document.getElementById('empty-state');
  const counter    = document.getElementById('project-count');

  if (counter) counter.textContent = cards.length;

  filterBtns.forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.classList.contains('active')));
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      const filter = btn.dataset.filter;
      let visible = 0;
      cards.forEach(card => {
        const show = filter === 'all' || card.dataset.tags.split(' ').includes(filter);
        card.style.display = show ? '' : 'none';
        if (show) { visible++; card.classList.add('visible'); }
      });
      if (emptyState) emptyState.style.display = visible === 0 ? 'block' : 'none';
    });
  });
})();
