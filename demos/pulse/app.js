/* Pulse — démo de tableau de bord. Données simulées, graphiques SVG sans librairie. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const fmt = n => n.toLocaleString('fr-FR');
  const el = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  /* Générateur pseudo-aléatoire déterministe : mêmes chiffres pour une même période */
  function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }

  function makeData(days) {
    const r = rng(days * 97);
    const visitors = [], sessions = [];
    let base = 820;
    for (let i = 0; i < days; i++) {
      const weekend = [5, 6].includes(i % 7) ? 0.72 : 1;
      base = base * (0.985 + r() * 0.04);
      const v = Math.round(base * weekend * (0.9 + r() * 0.2));
      visitors.push(v);
      sessions.push(Math.round(v * (1.25 + r() * 0.2)));
    }
    const sum = a => a.reduce((s, x) => s + x, 0);
    const conv = Math.round(sum(visitors) * (0.028 + r() * 0.01));
    return {
      visitors, sessions,
      kpis: [
        { label: 'Visiteurs', value: fmt(sum(visitors)), delta: +(4 + r() * 12).toFixed(1), series: visitors },
        { label: 'Sessions', value: fmt(sum(sessions)), delta: +(2 + r() * 10).toFixed(1), series: sessions },
        { label: 'Conversions', value: fmt(conv), delta: +(-6 + r() * 14).toFixed(1), series: visitors.map(v => v * (0.8 + r() * 0.4)) },
        { label: 'Taux de rebond', value: (38 + r() * 12).toFixed(1) + ' %', delta: +(-5 + r() * 6).toFixed(1), invert: true, series: visitors.map(() => 40 + r() * 10) },
      ],
      channels: [
        { name: 'Recherche organique', color: 'var(--c1)', value: 42 + Math.round(r() * 6) },
        { name: 'Direct', color: 'var(--c2)', value: 24 + Math.round(r() * 4) },
        { name: 'Réseaux sociaux', color: 'var(--c3)', value: 16 + Math.round(r() * 4) },
        { name: 'Référents', color: 'var(--c4)', value: 0 },
      ],
      pages: ['/', '/tarifs', '/blog/guide-seo', '/contact', '/fonctionnalites', '/blog/accessibilite'].map((path, i) => ({
        path,
        views: Math.round(sum(visitors) * (0.5 / (i + 1.4)) * (0.9 + r() * 0.2)),
        time: Math.round(40 + r() * 200),
        bounce: +(25 + r() * 45).toFixed(1),
      })),
    };
  }

  /* Petits graphiques (sparklines) dans les cartes KPI */
  function spark(svg, series, color) {
    const w = 200, h = 36, max = Math.max(...series), min = Math.min(...series);
    const pts = series.map((v, i) => `${(i / (series.length - 1)) * w},${h - 3 - ((v - min) / (max - min || 1)) * (h - 6)}`);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.append(el('polyline', { points: pts.join(' '), fill: 'none', stroke: color, 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }));
  }

  function renderKpis(data) {
    const box = document.getElementById('kpis');
    box.replaceChildren();
    data.kpis.forEach(k => {
      const good = k.invert ? k.delta < 0 : k.delta >= 0;
      const card = document.createElement('div');
      card.className = 'card kpi';
      const label = document.createElement('div'); label.className = 'label';
      const name = document.createElement('span'); name.textContent = k.label;
      const d = document.createElement('span'); d.className = 'delta ' + (good ? 'up' : 'down');
      d.textContent = (k.delta >= 0 ? '+' : '') + k.delta.toLocaleString('fr-FR') + ' %';
      label.append(name, d);
      const value = document.createElement('div'); value.className = 'value'; value.textContent = k.value;
      const svg = el('svg', { class: 'spark', 'aria-hidden': 'true' });
      spark(svg, k.series, good ? '#059669' : '#dc2626');
      card.append(label, value, svg);
      box.append(card);
    });
  }

  function renderLine(data, days) {
    const svg = document.getElementById('line');
    const tip = document.getElementById('tip');
    svg.replaceChildren();
    const W = svg.clientWidth || 700, H = 260, pad = { l: 44, r: 12, t: 12, b: 28 };
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const max = Math.max(...data.sessions) * 1.1;
    const x = i => pad.l + (i / (days - 1)) * (W - pad.l - pad.r);
    const y = v => H - pad.b - (v / max) * (H - pad.t - pad.b);

    for (let g = 0; g <= 4; g++) {
      const v = (max / 4) * g;
      svg.append(el('line', { x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v), stroke: '#e6e8f0' }));
      const t = el('text', { x: pad.l - 8, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#6b6f82' });
      t.textContent = v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v);
      svg.append(t);
    }
    const today = new Date();
    const dayLabel = i => { const d = new Date(today); d.setDate(d.getDate() - (days - 1 - i)); return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); };
    const step = Math.ceil(days / 6);
    for (let i = 0; i < days; i += step) {
      const t = el('text', { x: x(i), y: H - 8, 'text-anchor': 'middle', 'font-size': 11, fill: '#6b6f82' });
      t.textContent = dayLabel(i);
      svg.append(t);
    }

    const area = data.visitors.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const grad = el('linearGradient', { id: 'ga', x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.append(el('stop', { offset: '0', 'stop-color': '#4f46e5', 'stop-opacity': '.22' }), el('stop', { offset: '1', 'stop-color': '#4f46e5', 'stop-opacity': '0' }));
    const defs = el('defs'); defs.append(grad); svg.append(defs);
    svg.append(el('polygon', { points: `${x(0)},${y(0)} ${area} ${x(days - 1)},${y(0)}`, fill: 'url(#ga)' }));
    svg.append(el('polyline', { points: data.sessions.map((v, i) => `${x(i)},${y(v)}`).join(' '), fill: 'none', stroke: '#06b6d4', 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
    svg.append(el('polyline', { points: area, fill: 'none', stroke: '#4f46e5', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));

    const guide = el('line', { y1: pad.t, y2: H - pad.b, stroke: '#14151f', 'stroke-width': 1, opacity: 0 });
    const dot = el('circle', { r: 5, fill: '#fff', stroke: '#4f46e5', 'stroke-width': 2.5, opacity: 0 });
    svg.append(guide, dot);

    const move = (clientX) => {
      const rect = svg.getBoundingClientRect();
      const px = (clientX - rect.left) * (W / rect.width);
      const i = Math.max(0, Math.min(days - 1, Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (days - 1))));
      guide.setAttribute('x1', x(i)); guide.setAttribute('x2', x(i)); guide.setAttribute('opacity', .25);
      dot.setAttribute('cx', x(i)); dot.setAttribute('cy', y(data.visitors[i])); dot.setAttribute('opacity', 1);
      tip.textContent = `${dayLabel(i)} · ${fmt(data.visitors[i])} visiteurs · ${fmt(data.sessions[i])} sessions`;
      tip.style.left = (x(i) / W) * rect.width + 'px';
      tip.style.top = (y(data.visitors[i]) / H) * rect.height + 'px';
      tip.classList.add('show');
    };
    svg.onpointermove = e => move(e.clientX);
    svg.onpointerleave = () => { tip.classList.remove('show'); guide.setAttribute('opacity', 0); dot.setAttribute('opacity', 0); };
  }

  function renderDonut(data) {
    const ch = data.channels;
    ch[3].value = 100 - ch[0].value - ch[1].value - ch[2].value;
    const svg = document.getElementById('donut');
    svg.replaceChildren();
    svg.append(el('circle', { cx: 21, cy: 21, r: 15.915, fill: 'none', stroke: '#eef0f6', 'stroke-width': 6 }));
    let offset = 25;
    ch.forEach(c => {
      svg.append(el('circle', { cx: 21, cy: 21, r: 15.915, fill: 'none', stroke: c.color.replace('var(--c1)', '#4f46e5').replace('var(--c2)', '#06b6d4').replace('var(--c3)', '#f59e0b').replace('var(--c4)', '#ec4899'), 'stroke-width': 6, 'stroke-dasharray': `${c.value - 0.6} ${100 - c.value + 0.6}`, 'stroke-dashoffset': offset }));
      offset -= c.value;
    });
    const t = el('text', { x: 21, y: 22.5, 'text-anchor': 'middle', 'font-size': 6, 'font-weight': 800, fill: '#14151f' });
    t.textContent = ch[0].value + '%';
    const s = el('text', { x: 21, y: 27, 'text-anchor': 'middle', 'font-size': 2.6, fill: '#6b6f82' });
    s.textContent = 'organique';
    svg.append(t, s);
    const list = document.getElementById('channels');
    list.replaceChildren();
    ch.forEach(c => {
      const li = document.createElement('li');
      const i = document.createElement('i'); i.style.background = c.color;
      const n = document.createElement('span'); n.textContent = c.name;
      const b = document.createElement('b'); b.textContent = c.value + ' %';
      li.append(i, n, b); list.append(li);
    });
  }

  let sortKey = 'views', sortDir = -1, current;
  function renderRows() {
    const rows = [...current.pages].sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1) * sortDir);
    const maxViews = Math.max(...current.pages.map(p => p.views));
    const body = document.getElementById('rows');
    body.replaceChildren();
    rows.forEach(p => {
      const tr = document.createElement('tr');
      const cells = [
        ['path', p.path], ['num', fmt(p.views)],
        ['num', `${Math.floor(p.time / 60)} min ${String(p.time % 60).padStart(2, '0')} s`], ['num', p.bounce.toLocaleString('fr-FR') + ' %'],
      ];
      cells.forEach(([cls, txt]) => { const td = document.createElement('td'); td.className = cls; td.textContent = txt; tr.append(td); });
      const td = document.createElement('td'); const bar = document.createElement('div'); bar.className = 'bar';
      const fill = document.createElement('span'); fill.style.width = (p.views / maxViews) * 100 + '%';
      bar.append(fill); td.append(bar); tr.append(td);
      body.append(tr);
    });
  }
  document.querySelectorAll('th button').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.sort;
    sortDir = sortKey === k ? -sortDir : (k === 'path' ? 1 : -1);
    sortKey = k;
    renderRows();
  }));

  let days = 7;
  function render() {
    current = makeData(days);
    document.getElementById('range-label').textContent = `${days} derniers jours`;
    renderKpis(current); renderLine(current, days); renderDonut(current); renderRows();
  }
  document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    days = +b.dataset.days;
    render();
  }));
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => renderLine(current, days), 150); });
  render();
})();
