/* Frappe — test de vitesse de frappe.
   Mesure standard : 1 mot = 5 caractères ; mpm = caractères justes / 5 / minutes. */
(function () {
  const $ = id => document.getElementById(id);
  const WORDS = ('le la les un une des et en de du que qui dans pour sur avec sans sous par pas plus tout faire dire voir venir prendre donner savoir vouloir pouvoir aller temps jour monde vie main chose homme femme enfant maison ville pays travail projet code site page lien image texte mot ligne fichier écran clavier souris réseau serveur client donnée valeur liste table nombre petit grand nouveau premier dernier bon beau long simple rapide clair vrai juste libre ouvert toujours encore jamais souvent ici maintenant demain hier soir matin café pain soleil pluie vent route train vélo livre musique film jeu idée question réponse raison exemple moment façon partie groupe équipe ami lumière couleur montagne rivière jardin fleur arbre').split(' ');
  const textEl = $('text'), input = $('input'), hint = $('hint'), box = $('box');

  let duration = 30, words = [], wi = 0, typed = [], started = 0, timer = null, ended = false, samples = [], okChars = 0, errChars = 0;

  function randomWords(n) { const out = []; for (let i = 0; i < n; i++) out.push(WORDS[Math.floor(Math.random() * WORDS.length)]); return out; }

  function build() {
    textEl.replaceChildren();
    words.forEach((w, i) => {
      const span = document.createElement('span'); span.className = 'word';
      for (const ch of w) { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; span.append(c); }
      textEl.append(span);
    });
  }

  function paint() {
    const wordEls = textEl.children;
    textEl.querySelectorAll('.cur, .cur-end').forEach(e => e.classList.remove('cur', 'cur-end'));
    for (let i = Math.max(0, wi - 1); i <= Math.min(wordEls.length - 1, wi); i++) {
      const w = words[i], t = typed[i] || '', el = wordEls[i];
      el.querySelectorAll('.extra').forEach(x => x.remove());
      [...el.querySelectorAll('.c')].forEach((c, k) => { c.className = 'c' + (k < t.length ? (t[k] === w[k] ? ' ok' : ' bad') : ''); });
      for (let k = w.length; k < t.length && k < w.length + 8; k++) { const x = document.createElement('span'); x.className = 'c extra'; x.textContent = t[k]; el.append(x); }
    }
    const cur = wordEls[wi];
    if (!cur) return;
    const t = typed[wi] || '';
    const target = cur.querySelectorAll('.c')[t.length];
    if (target) target.classList.add('cur'); else cur.classList.add('cur-end');
    /* Faire défiler : la ligne courante reste la 2e ligne visible */
    const lineH = parseFloat(getComputedStyle(textEl).lineHeight);
    const top = cur.offsetTop - textEl.firstChild.offsetTop;
    textEl.scrollTop = Math.max(0, top - lineH);
  }

  function count() {
    let ok = 0, err = 0;
    for (let i = 0; i <= wi; i++) {
      const w = words[i] || '', t = typed[i] || '';
      for (let k = 0; k < t.length; k++) (t[k] === w[k] ? ok++ : err++);
      if (i < wi) { if (t === w) ok++; else err += Math.max(0, w.length - t.length); }
    }
    return { ok, err };
  }

  function tick() {
    const elapsed = (performance.now() - started) / 1000;
    const left = Math.max(0, duration - elapsed);
    $('timer').textContent = Math.ceil(left);
    const { ok } = count();
    const wpm = elapsed > 0.5 ? Math.round((ok / 5) / (elapsed / 60)) : 0;
    $('wpm-live').replaceChildren(document.createTextNode(wpm + ' '), Object.assign(document.createElement('small'), { textContent: 'mpm' }));
    if (Math.floor(elapsed) > samples.length - 1 && elapsed >= 1) samples.push(wpm);
    if (left <= 0) finish();
  }

  function start() {
    started = performance.now();
    timer = setInterval(tick, 100);
    box.classList.add('typing');
  }

  function finish() {
    clearInterval(timer); ended = true; input.blur();
    const { ok, err } = count();
    okChars = ok; errChars = err;
    const wpm = Math.round((ok / 5) / (duration / 60));
    const acc = ok + err ? Math.round((ok / (ok + err)) * 100) : 0;
    let best = 0; try { best = +localStorage.getItem('frappe-best-' + duration) || 0; } catch (e) {}
    const record = wpm > best && acc >= 80;
    if (record) { try { localStorage.setItem('frappe-best-' + duration, String(wpm)); } catch (e) {} best = wpm; }
    $('r-wpm').textContent = wpm; $('r-acc').textContent = acc + ' %';
    $('r-ok').textContent = ok; $('r-err').textContent = err; $('r-time').textContent = duration + ' s';
    $('r-best').textContent = best ? best + ' mpm' : '—';
    $('r-record').textContent = record ? '★ Nouveau record pour ' + duration + ' secondes !' : (acc < 80 ? 'Précision sous 80 % : le score ne compte pas pour le record.' : '');
    chart();
    $('test').hidden = true; $('result').classList.add('show');
    $('restart').focus();
  }

  function chart() {
    const svg = $('chart'); svg.replaceChildren();
    const NS = 'http://www.w3.org/2000/svg';
    const data = samples.length > 1 ? samples : [0, ...samples, samples[0] || 0];
    const W = svg.clientWidth || 800, H = 140, max = Math.max(10, ...data) * 1.15;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const x = i => 30 + (i / (data.length - 1)) * (W - 40), y = v => H - 20 - (v / max) * (H - 30);
    const mk = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); svg.append(e); return e; };
    [0, .5, 1].forEach(f => { mk('line', { x1: 30, x2: W - 10, y1: y(max * f / 1.15), y2: y(max * f / 1.15), stroke: '#2a2a2a' }); const t = mk('text', { x: 24, y: y(max * f / 1.15) + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#646669' }); t.textContent = Math.round(max * f / 1.15); });
    mk('polyline', { points: data.map((v, i) => `${x(i)},${y(v)}`).join(' '), fill: 'none', stroke: '#e2b714', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
  }

  function reset() {
    clearInterval(timer); ended = false; started = 0; wi = 0; typed = []; samples = [];
    words = randomWords(120); build();
    input.value = ''; $('timer').textContent = duration;
    $('wpm-live').replaceChildren(Object.assign(document.createElement('small'), { textContent: '— mpm' }));
    $('test').hidden = false; $('result').classList.remove('show');
    box.classList.remove('typing');
    paint(); focus();
  }

  function focus() { if (!ended) { input.focus({ preventScroll: true }); hint.hidden = true; } }

  input.addEventListener('input', () => {
    if (ended) return;
    if (!started) start();
    const v = input.value;
    if (v.endsWith(' ')) {
      const word = v.trim();
      if (word.length) { typed[wi] = word; wi++; }
      input.value = '';
    } else {
      typed[wi] = v.slice(0, 40);
    }
    paint();
  });
  input.addEventListener('keydown', e => {
    /* Retour arrière sur un champ vide : revenir au mot précédent s'il était faux */
    if (e.key === 'Backspace' && input.value === '' && wi > 0 && typed[wi - 1] !== words[wi - 1]) {
      e.preventDefault(); wi--; input.value = typed[wi] || ''; typed[wi] = input.value; paint();
    }
    if (e.key === 'Escape') input.blur();
  });
  input.addEventListener('blur', () => { if (!ended) hint.hidden = false; });
  box.addEventListener('click', focus);
  document.addEventListener('keydown', e => {
    if (document.activeElement === input || ended || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length === 1 && document.activeElement?.tagName !== 'BUTTON') focus();
  });
  $('restart').addEventListener('click', reset);
  document.querySelectorAll('.opts button').forEach(b => b.addEventListener('click', () => {
    duration = +b.dataset.time;
    document.querySelectorAll('.opts button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    reset();
  }));

  reset();
})();
