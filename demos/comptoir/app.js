/* Comptoir — mini boutique : catalogue filtrable/triable, panier persistant, code promo,
   seuil de livraison offerte. Paiement simulé : aucune donnée bancaire n'est jamais demandée. */
(function () {
  const $ = id => document.getElementById(id);
  const eur = n => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const FREE_SHIP = 40, SHIP = 4.9, CODES = { DEMO10: 0.10 };
  const PRODUCTS = [
    { id: 'eth', name: 'Éthiopie Guji', zone: 'Afrique', notes: 'Jasmin, pêche blanche, bergamote', roast: 1, price: 12.9, color: '#c9784a', pop: 9, badge: 'Best-seller' },
    { id: 'ken', name: 'Kenya Nyeri', zone: 'Afrique', notes: 'Cassis, pamplemousse, tomate cerise', roast: 2, price: 14.5, color: '#9c3d3d', pop: 7 },
    { id: 'rwa', name: 'Rwanda Huye', zone: 'Afrique', notes: 'Fruits rouges, thé noir, miel', roast: 2, price: 13.2, color: '#b5572e', pop: 5 },
    { id: 'col', name: 'Colombie Huila', zone: 'Amérique', notes: 'Caramel, pomme, noisette', roast: 3, price: 11.5, color: '#7a5230', pop: 10, badge: 'Coup de cœur' },
    { id: 'bra', name: 'Brésil Cerrado', zone: 'Amérique', notes: 'Chocolat noir, amande grillée', roast: 4, price: 9.9, color: '#4a3020', pop: 8 },
    { id: 'gua', name: 'Guatemala Antigua', zone: 'Amérique', notes: 'Cacao, épices douces, orange', roast: 3, price: 12.2, color: '#6b4128', pop: 6 },
    { id: 'idn', name: 'Sumatra Gayo', zone: 'Asie', notes: 'Terre humide, cèdre, chocolat', roast: 5, price: 13.9, color: '#2f2620', pop: 4 },
    { id: 'ind', name: 'Inde Monsooned', zone: 'Asie', notes: 'Épices, boisé, faible acidité', roast: 4, price: 10.9, color: '#5e4a3a', pop: 3, badge: 'Nouveau' },
  ];
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const KEY = 'comptoir-cart-v1';

  let cart = {};
  try { const c = JSON.parse(localStorage.getItem(KEY)); if (c && typeof c === 'object') for (const k in c) if (byId[k] && Number.isInteger(c[k]) && c[k] > 0 && c[k] < 100) cart[k] = c[k]; } catch (e) {}
  let promo = 0, filter = 'all', sort = 'pop';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function bag(p, small) {
    const pack = el('div', small ? 'mini' : 'pack');
    pack.style.background = small ? p.color : `linear-gradient(160deg, ${p.color}22, ${p.color}44)`;
    if (small) return pack;
    if (p.badge) pack.append(el('span', 'badge', p.badge));
    const b = el('div', 'bag', p.name.split(' ')[0]); b.style.background = p.color;
    b.append(el('small', null, p.zone));
    pack.append(b);
    return pack;
  }

  function renderGrid() {
    const list = PRODUCTS.filter(p => filter === 'all' || p.zone === filter).sort((a, b) =>
      sort === 'asc' ? a.price - b.price : sort === 'desc' ? b.price - a.price : sort === 'roast' ? a.roast - b.roast : b.pop - a.pop);
    const grid = $('grid'); grid.replaceChildren();
    list.forEach(p => {
      const card = el('article', 'product');
      const roast = el('div', 'roast'); roast.append(document.createTextNode('Torréfaction '));
      for (let i = 1; i <= 5; i++) { const r = el('i'); if (i <= p.roast) r.className = 'on'; roast.append(r); }
      const buy = el('div', 'buy');
      const price = el('span', 'price', eur(p.price)); price.append(el('small', null, ' / 250 g'));
      const add = el('button', 'add', 'Ajouter'); add.type = 'button';
      add.addEventListener('click', () => {
        cart[p.id] = (cart[p.id] || 0) + 1; save(); renderCart();
        add.textContent = '✓ Ajouté'; add.classList.add('ok');
        const b = $('cart-count'); b.classList.add('bump'); setTimeout(() => b.classList.remove('bump'), 200);
        setTimeout(() => { add.textContent = 'Ajouter'; add.classList.remove('ok'); }, 1100);
      });
      buy.append(price, add);
      card.append(bag(p), el('h3', null, p.name), el('p', 'notes', p.notes), roast, buy);
      grid.append(card);
    });
  }

  function totals() {
    const sub = Object.entries(cart).reduce((s, [id, q]) => s + byId[id].price * q, 0);
    const disc = Math.round(sub * promo * 100) / 100;
    const ship = sub === 0 || sub - disc >= FREE_SHIP ? 0 : SHIP;
    return { sub, disc, ship, total: sub - disc + ship, count: Object.values(cart).reduce((a, b) => a + b, 0) };
  }

  function renderCart() {
    const t = totals();
    $('cart-count').textContent = t.count;
    const lines = $('lines'); lines.replaceChildren();
    if (!t.count) lines.append(el('li', 'empty', 'Votre panier est vide.'));
    Object.entries(cart).forEach(([id, q]) => {
      const p = byId[id];
      const li = el('li'); const info = el('div');
      const qty = el('div', 'qty');
      const minus = el('button', null, '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Retirer un ' + p.name);
      const plus = el('button', null, '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Ajouter un ' + p.name);
      minus.addEventListener('click', () => { cart[id]--; if (cart[id] <= 0) delete cart[id]; save(); renderCart(); });
      plus.addEventListener('click', () => { if (cart[id] < 99) cart[id]++; save(); renderCart(); });
      qty.append(minus, el('span', null, q), plus);
      info.append(el('p', null, p.name), qty);
      li.append(bag(p, true), info, el('span', 'lp', eur(p.price * q)));
      lines.append(li);
    });
    const left = Math.max(0, FREE_SHIP - (t.sub - t.disc));
    const ship = $('ship'); ship.replaceChildren();
    ship.append(document.createTextNode(left > 0 ? `Plus que ${eur(left)} pour la livraison offerte` : '🎉 Livraison offerte !'));
    const track = el('div', 'track'); const bar = el('span'); bar.style.width = Math.min(100, ((t.sub - t.disc) / FREE_SHIP) * 100) + '%'; track.append(bar); ship.append(track);
    $('sub').textContent = eur(t.sub);
    $('disc-row').hidden = !t.disc; $('disc').textContent = '−' + eur(t.disc);
    $('shipcost').textContent = !t.count ? '—' : t.ship ? eur(t.ship) : 'Offerte';
    $('total').textContent = eur(t.total);
    $('checkout').disabled = !t.count;
  }

  document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    filter = c.dataset.filter;
    document.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', String(x === c)));
    renderGrid();
  }));
  $('sort').addEventListener('change', e => { sort = e.target.value; renderGrid(); });

  const wrap = $('cart-wrap');
  const open = () => { wrap.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { wrap.classList.remove('open'); document.body.style.overflow = ''; };
  $('open-cart').addEventListener('click', open);
  $('close-cart').addEventListener('click', close);
  $('scrim').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  $('apply').addEventListener('click', () => {
    const code = $('code').value.trim().toUpperCase();
    const msg = $('msg');
    if (CODES[code]) { promo = CODES[code]; msg.textContent = `Code ${code} appliqué : −${CODES[code] * 100} %`; msg.style.color = 'var(--green)'; }
    else { promo = 0; msg.textContent = code ? 'Code inconnu.' : ''; msg.style.color = '#b42318'; }
    renderCart();
  });
  $('checkout').addEventListener('click', () => {
    close(); cart = {}; promo = 0; $('code').value = ''; $('msg').textContent = ''; save(); renderCart();
    $('done').showModal();
  });
  $('close-done').addEventListener('click', () => $('done').close());

  renderGrid(); renderCart();
})();
