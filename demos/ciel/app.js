/* Ciel — météo via l'API publique Open-Meteo (sans clé).
   Montre : fetch asynchrone, gestion d'erreurs et de délai, recherche avec anti-rebond,
   géolocalisation à la demande, graphique SVG. Toutes les données externes passent par textContent. */
(function () {
  const $ = id => document.getElementById(id);
  const app = $('app');
  const NS = 'http://www.w3.org/2000/svg';

  const WMO = {
    0: ['Ciel dégagé', '☀️', 'clear'], 1: ['Plutôt dégagé', '🌤️', 'clear'], 2: ['Partiellement nuageux', '⛅', 'cloud'], 3: ['Couvert', '☁️', 'cloud'],
    45: ['Brouillard', '🌫️', 'cloud'], 48: ['Brouillard givrant', '🌫️', 'cloud'],
    51: ['Bruine légère', '🌦️', 'rain'], 53: ['Bruine', '🌦️', 'rain'], 55: ['Bruine dense', '🌧️', 'rain'], 56: ['Bruine verglaçante', '🌧️', 'rain'], 57: ['Bruine verglaçante', '🌧️', 'rain'],
    61: ['Pluie faible', '🌦️', 'rain'], 63: ['Pluie', '🌧️', 'rain'], 65: ['Forte pluie', '🌧️', 'rain'], 66: ['Pluie verglaçante', '🌧️', 'rain'], 67: ['Pluie verglaçante', '🌧️', 'rain'],
    71: ['Neige faible', '🌨️', 'snow'], 73: ['Neige', '🌨️', 'snow'], 75: ['Forte neige', '❄️', 'snow'], 77: ['Grains de neige', '🌨️', 'snow'],
    80: ['Averses', '🌦️', 'rain'], 81: ['Averses', '🌧️', 'rain'], 82: ['Violentes averses', '⛈️', 'rain'], 85: ['Averses de neige', '🌨️', 'snow'], 86: ['Averses de neige', '❄️', 'snow'],
    95: ['Orage', '⛈️', 'storm'], 96: ['Orage et grêle', '⛈️', 'storm'], 99: ['Orage et grêle', '⛈️', 'storm'],
  };
  const wmo = c => WMO[c] || ['Conditions inconnues', '🌡️', 'cloud'];

  /* fetch avec délai maximal : une API lente ne bloque pas l'interface */
  async function getJSON(url, ms = 8000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  const node = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function showError(msg) {
    app.replaceChildren();
    const c = node('div', 'card status error');
    c.append(node('p', null, msg), node('p', null, 'Vérifiez votre connexion puis réessayez.'));
    app.append(c);
  }

  async function load(place) {
    app.querySelector('.hero')?.classList.add('skeleton');
    const params = new URLSearchParams({
      latitude: place.lat, longitude: place.lon, timezone: 'auto', forecast_days: 7,
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
      hourly: 'temperature_2m', daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max',
    });
    try {
      const d = await getJSON('https://api.open-meteo.com/v1/forecast?' + params);
      render(place, d);
      try { localStorage.setItem('ciel-place', JSON.stringify(place)); } catch (e) {}
    } catch (e) {
      showError(e.name === 'AbortError' ? 'Le service météo met trop de temps à répondre.' : 'Impossible de récupérer la météo pour le moment.');
    }
  }

  let last = null;
  function render(place, d) {
    last = d;
    const cur = d.current, [label, icon, kind] = wmo(cur.weather_code);
    document.body.dataset.sky = cur.is_day ? (kind === 'clear' ? 'clear-day' : kind === 'cloud' ? 'cloud-day' : kind) : (kind === 'clear' || kind === 'cloud' ? 'night' : kind);
    app.replaceChildren();

    const hero = node('div', 'hero');
    const main = node('div', 'card');
    const pl = node('div', 'place'); pl.append(node('b', null, place.name), document.createTextNode(place.region || ''));
    const now = node('div', 'now');
    const temp = node('div', 'temp', Math.round(cur.temperature_2m)); temp.append(node('sup', null, '°C'));
    now.append(node('div', 'icon', icon), temp);
    main.append(pl, now, node('div', 'desc', label),
      node('div', 'minmax', `Max ${Math.round(d.daily.temperature_2m_max[0])}° · Min ${Math.round(d.daily.temperature_2m_min[0])}° · Ressenti ${Math.round(cur.apparent_temperature)}°`));

    const side = node('div', 'card metrics');
    [['Humidité', cur.relative_humidity_2m + ' %'], ['Vent', Math.round(cur.wind_speed_10m) + ' km/h'],
     ['Risque de pluie', (d.daily.precipitation_probability_max[0] ?? 0) + ' %'], ['Indice UV', Math.round(d.daily.uv_index_max[0] ?? 0)]]
      .forEach(([k, v]) => { const m = node('div', 'metric'); m.append(node('span', null, k), node('b', null, String(v))); side.append(m); });
    hero.append(main, side);

    const grid = node('div', 'grid2');
    const hc = node('div', 'card'); hc.append(node('h2', null, 'Prochaines 24 heures'));
    const svg = document.createElementNS(NS, 'svg'); svg.id = 'hourly'; svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Températures heure par heure');
    hc.append(svg);
    const dc = node('div', 'card'); dc.append(node('h2', null, '7 jours'));
    const ul = node('ul', 'days');
    const gmin = Math.min(...d.daily.temperature_2m_min), gmax = Math.max(...d.daily.temperature_2m_max);
    d.daily.time.forEach((t, i) => {
      const li = node('li');
      const day = i === 0 ? "Aujourd'hui" : new Date(t + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      const range = node('div', 'range'); const bar = node('span');
      const lo = d.daily.temperature_2m_min[i], hi = d.daily.temperature_2m_max[i];
      bar.style.left = ((lo - gmin) / (gmax - gmin || 1)) * 100 + '%';
      bar.style.right = (100 - ((hi - gmin) / (gmax - gmin || 1)) * 100) + '%';
      range.append(bar);
      const tt = node('span', 't'); tt.append(node('em', null, Math.round(lo) + '°'), document.createTextNode(Math.round(hi) + '°'));
      li.append(node('span', 'd', day), node('span', 'i', wmo(d.daily.weather_code[i])[1]), range, tt);
      ul.append(li);
    });
    dc.append(ul);
    grid.append(hc, dc);
    app.append(hero, grid);
    drawHourly(svg, d);
  }

  function drawHourly(svg, d) {
    const nowIdx = Math.max(0, d.hourly.time.findIndex(t => t >= d.current.time.slice(0, 13)));
    const temps = d.hourly.temperature_2m.slice(nowIdx, nowIdx + 24);
    const times = d.hourly.time.slice(nowIdx, nowIdx + 24);
    const W = svg.clientWidth || 440, H = 150, pad = 22;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const min = Math.min(...temps) - 1, max = Math.max(...temps) + 1;
    const x = i => pad + (i / (temps.length - 1)) * (W - pad * 2);
    const y = v => H - 30 - ((v - min) / (max - min)) * (H - 60);
    const pts = temps.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const mk = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); svg.append(e); return e; };
    mk('polygon', { points: `${x(0)},${H - 30} ${pts} ${x(temps.length - 1)},${H - 30}`, fill: 'rgba(255,255,255,.15)' });
    mk('polyline', { points: pts, fill: 'none', stroke: '#fff', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    temps.forEach((v, i) => {
      if (i % 4) return;
      mk('circle', { cx: x(i), cy: y(v), r: 3.5, fill: '#fff' });
      const tv = mk('text', { x: x(i), y: y(v) - 10, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#fff' }); tv.textContent = Math.round(v) + '°';
      const th = mk('text', { x: x(i), y: H - 8, 'text-anchor': 'middle', 'font-size': 11, fill: 'rgba(255,255,255,.75)' }); th.textContent = times[i].slice(11, 13) + 'h';
    });
  }

  /* Recherche de ville avec anti-rebond */
  const input = $('q'), results = $('results');
  let timer, lastQuery = '';
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { results.classList.remove('show'); return; }
    timer = setTimeout(async () => {
      lastQuery = q;
      try {
        const data = await getJSON('https://geocoding-api.open-meteo.com/v1/search?' + new URLSearchParams({ name: q, count: 6, language: 'fr', format: 'json' }));
        if (q !== lastQuery) return;
        results.replaceChildren();
        (data.results || []).forEach(r => {
          const li = node('li'); const b = node('button');
          b.type = 'button'; b.textContent = r.name;
          b.append(node('small', null, [r.admin1, r.country].filter(Boolean).join(', ')));
          b.addEventListener('click', () => {
            results.classList.remove('show'); input.value = '';
            load({ name: r.name, region: [r.admin1, r.country].filter(Boolean).join(', '), lat: r.latitude, lon: r.longitude });
          });
          li.append(b); results.append(li);
        });
        if (!results.children.length) { const li = node('li'); const b = node('button', null, 'Aucune ville trouvée'); b.disabled = true; li.append(b); results.append(li); }
        results.classList.add('show');
      } catch (e) { results.classList.remove('show'); }
    }, 300);
  });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) results.classList.remove('show'); });
  input.addEventListener('keydown', e => { if (e.key === 'Escape') results.classList.remove('show'); });

  /* Géolocalisation : uniquement sur clic, jamais automatiquement */
  $('locate').addEventListener('click', () => {
    if (!navigator.geolocation) return showError('La géolocalisation n\'est pas disponible sur cet appareil.');
    navigator.geolocation.getCurrentPosition(
      p => load({ name: 'Ma position', region: '', lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3) }),
      () => showError('Position refusée ou indisponible. Recherchez une ville à la place.'),
      { timeout: 8000 }
    );
  });

  let start = { name: 'Lyon', region: 'Auvergne-Rhône-Alpes, France', lat: 45.7485, lon: 4.8467 };
  try {
    const saved = JSON.parse(localStorage.getItem('ciel-place'));
    if (saved && typeof saved.name === 'string' && Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) start = saved;
  } catch (e) {}
  load(start);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const s = $('hourly'); if (s && last) { s.replaceChildren(); drawHourly(s, last); } }, 200); });
})();
