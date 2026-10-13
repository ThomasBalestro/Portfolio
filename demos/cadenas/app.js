/* Cadenas — générateur de mots de passe 100 % local.
   - Aléa : crypto.getRandomValues avec tirage par rejet (aucun biais modulo).
   - Aucune requête réseau (CSP connect-src 'none'), aucun stockage. */
(function () {
  const $ = id => document.getElementById(id);
  const SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789', symbols: '!#$%&*+-=?@^_~.:;',
  };
  const AMBIG = /[0O1lI|]/g;
  const WORDS = ('abeille acier ananas ancre arbre argent atlas aube avion balcon bambou banane barque bateau baume berger biscuit bison blason bobine bougie boussole branche brique brume cabane cactus cadran caillou camion canard canon carafe carton castor cerise chaise chalet chameau chardon chemin cheval chouette cigale citron clairon colibri comete compas corbeau coton crayon cristal cyclone dauphin delta desert diamant domino dragon dune ecorce eclair encre epice escale etoile falaise faucon fenouil feuille figue flamant flocon fontaine foret fougere fromage fusee galet gazelle geyser girafe givre glacier gondole gorille grenade griffon guitare hamac harpe herisson hibou horizon iguane igloo indigo ivoire jardin jasmin jongleur kayak koala lagon lanterne laurier lavande lezard licorne lilas loutre lucarne lune macaron magnolia manege marmotte meduse melon mesange meteore miel moulin mousse muguet nacre narval nuage oasis ocean olive orage orchidee origami ours panda papyrus paquebot pelican perle phare pinceau pirate plume poivre pollen prairie puzzle quartz radeau raisin renard requin rivage robot roseau rubis safran sapin satellite saule sequoia sirene sorbet source tambour tanuki tapir tempete tigre tornade toucan tulipe vague vallon velours vigne violon volcan voilier yeti zebre zenith').split(' ');

  /* Entier uniforme dans [0, max) sans biais */
  function randInt(max) {
    const limit = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % max;
  }
  const pick = s => s[randInt(s.length)];
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function strength(bits) {
    if (bits < 40) return { label: 'Faible', color: '#f43f5e', pct: Math.max(8, bits / 1.28) };
    if (bits < 60) return { label: 'Moyen', color: '#f59e0b', pct: bits / 1.28 };
    if (bits < 80) return { label: 'Fort', color: '#84cc16', pct: bits / 1.28 };
    return { label: 'Très fort', color: '#22c55e', pct: Math.min(100, bits / 1.28) };
  }
  function crackTime(bits) {
    /* Hypothèse : 10 milliards d'essais par seconde, hors ligne */
    const s = Math.pow(2, bits - 1) / 1e10;
    const units = [['seconde', 60], ['minute', 60], ['heure', 24], ['jour', 365], ['an', 1000], ['millénaire', 1000], ['million d\'années', 1000]];
    let v = s, i = 0;
    while (i < units.length - 1 && v >= units[i][1]) { v /= units[i][1]; i++; }
    if (s < 1) return 'instantané';
    if (i === units.length - 1 && v > 1000) return 'plus que l\'âge de l\'univers';
    const n = Math.round(v);
    return `≈ ${n.toLocaleString('fr-FR')} ${units[i][0]}${n > 1 && !units[i][0].includes('années') ? 's' : ''}`;
  }
  function show(barId, labelId, bitsId, bits, extra) {
    const st = strength(bits);
    $(barId).style.width = st.pct + '%'; $(barId).style.background = st.color;
    $(labelId).replaceChildren(); const b = document.createElement('b'); b.textContent = st.label;
    $(labelId).append(b, document.createTextNode(' · cassage : ' + crackTime(bits)));
    $(bitsId).textContent = `${Math.round(bits)} bits d'entropie${extra || ''}`;
  }

  /* Affichage coloré : chiffres et symboles distingués (via textContent, pas d'innerHTML) */
  function paint(target, str) {
    target.replaceChildren();
    for (const ch of str) {
      const span = document.createElement('span');
      if (/[0-9]/.test(ch)) span.className = 'd'; else if (/[^A-Za-z0-9]/.test(ch)) span.className = 's';
      span.textContent = ch;
      target.append(span);
    }
  }

  function generate() {
    const len = +$('length').value;
    $('len-out').textContent = len;
    let pools = Object.keys(SETS).filter(k => $(k).checked).map(k => $('ambig').checked ? SETS[k].replace(AMBIG, '') : SETS[k]);
    if (!pools.length) { $('lower').checked = true; return generate(); }
    const all = pools.join('');
    const chars = $('each').checked ? pools.map(pick) : [];
    while (chars.length < len) chars.push(pick(all));
    const pwd = shuffle(chars).join('');
    paint($('pwd'), pwd);
    $('pwd').dataset.value = pwd;
    show('bar', 'label', 'bits', len * Math.log2(all.length), ` · ${all.length} caractères possibles`);
  }

  function phrase() {
    const n = +$('words').value;
    $('words-out').textContent = n;
    const words = Array.from({ length: n }, () => pick(WORDS));
    if ($('num').checked) words.splice(randInt(n + 1), 0, String(randInt(100)));
    const value = words.join($('sep').value);
    $('phrase').textContent = value;
    $('phrase').dataset.value = value;
    const bits = n * Math.log2(WORDS.length) + ($('num').checked ? Math.log2(100) + Math.log2(n + 1) : 0);
    show('bar2', 'label2', 'bits2', bits, ` · ${WORDS.length} mots dans le dictionnaire`);
  }

  async function copy(fromId, btn) {
    try { await navigator.clipboard.writeText($(fromId).dataset.value || ''); btn.classList.add('ok'); btn.textContent = '✓'; }
    catch (e) { btn.textContent = '!'; }
    setTimeout(() => { btn.classList.remove('ok'); btn.textContent = '⧉'; }, 1400);
  }

  /* Testeur : estimation locale, pénalise les motifs courants */
  const COMMON = ['123456', 'password', 'motdepasse', 'azerty', 'qwerty', 'soleil', 'bonjour', 'admin', 'loulou', 'chouchou', '000000', '111111', 'marseille', 'doudou', 'iloveyou'];
  function test() {
    const v = $('test').value;
    const checks = [
      ['12 caractères ou plus', v.length >= 12],
      ['Majuscules et minuscules', /[a-z]/.test(v) && /[A-Z]/.test(v)],
      ['Au moins un chiffre', /\d/.test(v)],
      ['Au moins un symbole', /[^A-Za-z0-9]/.test(v)],
      ['Pas un mot de passe courant', !COMMON.some(c => v.toLowerCase().includes(c))],
      ['Pas de suite ni de répétition (abc, 123, aaa)', !/(.)\1\1|abc|bcd|cde|123|234|345|456|789|azer|qwer/i.test(v)],
    ];
    const ul = $('checks'); ul.replaceChildren();
    checks.forEach(([txt, ok]) => { const li = document.createElement('li'); li.textContent = txt; if (v) li.className = ok ? 'ok' : 'bad'; ul.append(li); });
    if (!v) { $('bar3').style.width = '0'; $('label3').textContent = 'En attente…'; $('bits3').textContent = ''; return; }
    let pool = 0;
    if (/[a-z]/.test(v)) pool += 26; if (/[A-Z]/.test(v)) pool += 26; if (/\d/.test(v)) pool += 10; if (/[^A-Za-z0-9]/.test(v)) pool += 33;
    let bits = v.length * Math.log2(pool || 1);
    if (!checks[4][1]) bits = Math.min(bits, 12);
    if (!checks[5][1]) bits *= 0.75;
    show('bar3', 'label3', 'bits3', bits, ' (estimation)');
  }

  ['length', 'upper', 'lower', 'digits', 'symbols', 'ambig', 'each'].forEach(id => $(id).addEventListener('input', generate));
  ['words', 'sep', 'num'].forEach(id => $(id).addEventListener('input', phrase));
  $('regen').addEventListener('click', generate);
  $('gen-phrase').addEventListener('click', phrase);
  $('copy').addEventListener('click', e => copy('pwd', e.currentTarget));
  $('copy2').addEventListener('click', e => copy('phrase', e.currentTarget));
  $('test').addEventListener('input', test);
  $('show').addEventListener('change', e => { $('test').type = e.target.checked ? 'text' : 'password'; });

  const tabs = document.querySelectorAll('[role="tab"]');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => { x.setAttribute('aria-selected', String(x === t)); $(x.getAttribute('aria-controls')).classList.toggle('active', x === t); });
  }));

  generate(); phrase(); test();
})();
