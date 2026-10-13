/* Budgie — prototype d'app mobile de budget. Données en localStorage, validées à la lecture.
   Tout texte saisi passe par textContent. */
(function () {
  const KEY = 'budgie-demo-v1';
  const $ = id => document.getElementById(id);
  const CATS = {
    food: { label: 'Alimentation', ico: '🛒', color: '#ff8a5b' },
    home: { label: 'Logement', ico: '🏠', color: '#5b8cff' },
    move: { label: 'Transport', ico: '🚲', color: '#22c3a6' },
    fun: { label: 'Loisirs', ico: '🎬', color: '#c084fc' },
    other: { label: 'Autre', ico: '✦', color: '#f5b83d' },
    salary: { label: 'Revenu', ico: '💶', color: '#1a8a5c', income: true },
  };
  const eur = n => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const monthKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  function sample() {
    const now = new Date(), m = monthKey(now);
    const day = d => `${m}-${String(Math.min(d, now.getDate())).padStart(2, '0')}`;
    return [
      { id: 1, kind: 'in', cat: 'salary', label: 'Salaire', amount: 2150, date: day(1) },
      { id: 2, kind: 'out', cat: 'home', label: 'Loyer', amount: 690, date: day(2) },
      { id: 3, kind: 'out', cat: 'food', label: 'Marché de la Croix-Rousse', amount: 42.5, date: day(3) },
      { id: 4, kind: 'out', cat: 'move', label: 'Abonnement TCL', amount: 25, date: day(4) },
      { id: 5, kind: 'out', cat: 'fun', label: 'Cinéma', amount: 19, date: day(6) },
      { id: 6, kind: 'out', cat: 'food', label: 'Supermarché', amount: 86.3, date: day(8) },
      { id: 7, kind: 'out', cat: 'other', label: 'Cadeau anniversaire', amount: 35, date: day(9) },
    ];
  }
  const valid = t => t && ['in', 'out'].includes(t.kind) && CATS[t.cat] && typeof t.label === 'string' && Number.isFinite(t.amount) && t.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(t.date);
  function load() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(d)) return d.filter(valid); } catch (e) {} return sample(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} };

  let items = load();
  let view = new Date(); view.setDate(1);

  function render() {
    const m = monthKey(view);
    $('month').textContent = view.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const list = items.filter(t => t.date.startsWith(m)).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    const inc = list.filter(t => t.kind === 'in').reduce((s, t) => s + t.amount, 0);
    const out = list.filter(t => t.kind === 'out').reduce((s, t) => s + t.amount, 0);
    $('in').textContent = eur(inc); $('out').textContent = eur(out); $('balance').textContent = eur(inc - out);
    $('share').textContent = inc ? `${Math.round((out / inc) * 100)} % des revenus` : '';
    $('count').textContent = `${list.length}`;

    /* Donut */
    const svg = $('donut'); svg.replaceChildren();
    const NS = 'http://www.w3.org/2000/svg';
    const circle = (attrs) => { const c = document.createElementNS(NS, 'circle'); for (const k in attrs) c.setAttribute(k, attrs[k]); svg.append(c); };
    circle({ cx: 21, cy: 21, r: 15.915, fill: 'none', stroke: '#efece3', 'stroke-width': 7 });
    const byCat = {};
    list.filter(t => t.kind === 'out').forEach(t => { byCat[t.cat] = (byCat[t.cat] || 0) + t.amount; });
    let offset = 25;
    const cats = $('cats'); cats.replaceChildren();
    Object.entries(byCat).sort((a, b) => b[1] - a[1]).forEach(([cat, sum]) => {
      const pct = (sum / out) * 100;
      circle({ cx: 21, cy: 21, r: 15.915, fill: 'none', stroke: CATS[cat].color, 'stroke-width': 7, 'stroke-dasharray': `${Math.max(pct - 1, .5)} ${100 - Math.max(pct - 1, .5)}`, 'stroke-dashoffset': offset });
      offset -= pct;
      const li = document.createElement('li');
      const i = document.createElement('i'); i.style.background = CATS[cat].color;
      const n = document.createElement('span'); n.textContent = CATS[cat].label;
      const b = document.createElement('b'); b.textContent = Math.round(pct) + ' %';
      li.append(i, n, b); cats.append(li);
    });
    if (!out) { const li = document.createElement('li'); li.textContent = 'Aucune dépense ce mois-ci'; li.style.color = 'var(--soft)'; li.style.display = 'block'; cats.append(li); }

    /* Liste */
    const ul = $('tx'); ul.replaceChildren();
    if (!list.length) { const e = document.createElement('li'); e.className = 'empty'; e.style.display = 'block'; e.textContent = 'Aucune opération. Touchez « Ajouter ».'; ul.append(e); }
    list.forEach(t => {
      const li = document.createElement('li');
      const ico = document.createElement('span'); ico.className = 'ico'; ico.textContent = CATS[t.cat].ico; ico.style.background = CATS[t.cat].color + '22';
      const txt = document.createElement('div');
      const p = document.createElement('p'); p.textContent = t.label;
      const s = document.createElement('small'); s.textContent = `${CATS[t.cat].label} · ${new Date(t.date + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
      txt.append(p, s);
      const a = document.createElement('span'); a.className = 'amt' + (t.kind === 'in' ? ' plus' : ''); a.textContent = (t.kind === 'in' ? '+' : '−') + eur(t.amount);
      const del = document.createElement('button'); del.className = 'del'; del.type = 'button'; del.textContent = '✕'; del.setAttribute('aria-label', 'Supprimer ' + t.label);
      del.addEventListener('click', () => { items = items.filter(x => x.id !== t.id); save(); render(); });
      li.append(ico, txt, a, del); ul.append(li);
    });
  }

  /* Feuille d'ajout */
  let kind = 'out', cat = 'food';
  function chips() {
    const box = $('chips'); box.replaceChildren();
    Object.entries(CATS).filter(([, c]) => kind === 'in' ? c.income : !c.income).forEach(([key, c]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = `${c.ico} ${c.label}`;
      b.setAttribute('aria-pressed', String(key === cat));
      b.addEventListener('click', () => { cat = key; chips(); });
      box.append(b);
    });
  }
  const screen = $('screen');
  const open = () => { screen.classList.add('open'); $('err').textContent = ''; setTimeout(() => $('amount').focus(), 250); };
  const close = () => screen.classList.remove('open');
  $('fab').addEventListener('click', open);
  $('sheet-bg').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.querySelectorAll('.kind button').forEach(b => b.addEventListener('click', () => {
    kind = b.dataset.kind; cat = kind === 'in' ? 'salary' : 'food';
    document.querySelectorAll('.kind button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    chips();
  }));
  $('sheet').addEventListener('submit', e => {
    e.preventDefault();
    const amount = Math.round(parseFloat($('amount').value.replace(/\s/g, '').replace(',', '.')) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e7) { $('err').textContent = 'Indiquez un montant valide.'; return; }
    const label = $('label').value.trim().slice(0, 40) || CATS[cat].label;
    const now = new Date();
    /* Date locale (pas toISOString, qui passe en UTC et peut décaler d'un jour) */
    const date = monthKey(view) === monthKey(now) ? `${monthKey(now)}-${String(now.getDate()).padStart(2, '0')}` : `${monthKey(view)}-01`;
    items.push({ id: Date.now(), kind, cat, label, amount, date });
    $('amount').value = ''; $('label').value = '';
    save(); render(); close();
  });
  $('prev').addEventListener('click', () => { view.setMonth(view.getMonth() - 1); render(); });
  $('next').addEventListener('click', () => { view.setMonth(view.getMonth() + 1); render(); });

  chips(); render();
})();
