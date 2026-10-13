/* Flux — Kanban : glisser-déposer (souris), boutons ← → (tactile/clavier), sauvegarde localStorage.
   Tout le texte saisi est inséré via textContent : aucune injection HTML possible. */
(function () {
  const KEY = 'flux-demo-v1';
  const COLS = ['todo', 'doing', 'done'];
  const PRIO = { low: { label: 'Basse', color: '#06d6a0' }, mid: { label: 'Moyenne', color: '#ffd166' }, high: { label: 'Haute', color: '#ef476f' } };
  const SAMPLE = [
    { id: 1, title: 'Maquetter la page d\'accueil', prio: 'high', col: 'done' },
    { id: 2, title: 'Écrire les tests de l\'API', prio: 'mid', col: 'doing' },
    { id: 3, title: 'Optimiser les images (WebP)', prio: 'low', col: 'doing' },
    { id: 4, title: 'Configurer le déploiement continu', prio: 'high', col: 'todo' },
    { id: 5, title: 'Audit d\'accessibilité', prio: 'mid', col: 'todo' },
  ];

  /* Les données relues sont validées : un localStorage modifié à la main ne casse pas l'appli */
  const valid = t => t && typeof t.title === 'string' && PRIO[t.prio] && COLS.includes(t.col) && Number.isFinite(t.id);
  const load = () => {
    try { const d = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(d)) return d.filter(valid).map(t => ({ ...t, title: t.title.slice(0, 120) })); } catch (e) {}
    return SAMPLE.map(t => ({ ...t }));
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) {} };
  let tasks = load();

  const board = document.getElementById('board');

  function card(t) {
    const div = document.createElement('article');
    div.className = 'task';
    div.draggable = true;
    div.dataset.id = t.id;
    div.style.setProperty('--prio', PRIO[t.prio].color);
    const p = document.createElement('p'); p.textContent = t.title;
    const meta = document.createElement('div'); meta.className = 'meta';
    const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = PRIO[t.prio].label;
    const acts = document.createElement('div'); acts.className = 'acts';
    const idx = COLS.indexOf(t.col);
    const mk = (txt, label, fn, disabled) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', label); b.disabled = disabled; b.addEventListener('click', fn); return b; };
    acts.append(
      mk('←', 'Déplacer à gauche', () => move(t.id, COLS[idx - 1]), idx === 0),
      mk('→', 'Déplacer à droite', () => move(t.id, COLS[idx + 1]), idx === COLS.length - 1),
      mk('✕', 'Supprimer', () => { tasks = tasks.filter(x => x.id !== t.id); save(); render(); }, false),
    );
    meta.append(tag, acts);
    div.append(p, meta);
    div.addEventListener('dragstart', e => { div.classList.add('dragging'); e.dataTransfer.setData('text/plain', String(t.id)); e.dataTransfer.effectAllowed = 'move'; });
    div.addEventListener('dragend', () => div.classList.remove('dragging'));
    return div;
  }

  function move(id, col) {
    const t = tasks.find(x => x.id === id);
    if (!t || !col) return;
    t.col = col;
    tasks = tasks.filter(x => x.id !== id).concat(t);
    save(); render();
  }

  function render() {
    board.querySelectorAll('.col').forEach(col => {
      const list = col.querySelector('.list');
      const items = tasks.filter(t => t.col === col.dataset.col);
      list.replaceChildren();
      if (!items.length) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Déposez une tâche ici'; list.append(e); }
      items.forEach(t => list.append(card(t)));
      col.querySelector('.count').textContent = items.length;
    });
    const done = tasks.filter(t => t.col === 'done').length;
    const stats = document.getElementById('stats');
    stats.replaceChildren();
    const b = document.createElement('b'); b.textContent = tasks.length ? Math.round((done / tasks.length) * 100) + ' %' : '0 %';
    stats.append(b, document.createTextNode(` terminé · ${tasks.length} tâche${tasks.length > 1 ? 's' : ''}`));
  }

  board.querySelectorAll('.col').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
    col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
    col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); move(Number(e.dataTransfer.getData('text/plain')), col.dataset.col); });
  });

  document.getElementById('form').addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('title');
    const title = input.value.trim().slice(0, 120);
    if (!title) return;
    tasks.push({ id: Date.now(), title, prio: document.getElementById('prio').value, col: 'todo' });
    input.value = '';
    save(); render();
  });
  document.getElementById('reset').addEventListener('click', () => { tasks = SAMPLE.map(t => ({ ...t })); save(); render(); });

  render();
})();
