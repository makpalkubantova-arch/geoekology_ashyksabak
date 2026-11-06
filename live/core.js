/* Экологиялық жарыс LIVE — ортақ ядро: backend (Firebase немесе демо), сұрақтар, ұпай */
(function () {
  const ECO = (window.ECO = {});

  /* ---------- сұрақтар: оқулық § 15 және 2025 жылғы деректер ---------- */
  ECO.QUESTIONS = [
    /* 1-раунд: ұғымдар мен деректер */
    { t: 'mc', time: 25, q: 'Сөйлемді оқулық бойынша толықтырыңдар: «Орман ресурстары — ... ресурстардың маңызды түрі болып табылады».', o: ['минералдық', 'биологиялық', 'энергетикалық', 'рекреациялық'], a: 1, src: 'Оқулық, 54-бет' },
    { t: 'mc', time: 20, q: '20-суретте табиғатқа антропогендік факторлардың ықпалы неше топқа жіктелген?', o: ['5', '6', '7', '8'], a: 2, src: 'Оқулық, 54-бет, 20-сурет' },
    { t: 'mc', time: 25, q: 'Табиғи ортаны сипаттайтын көрсеткіштерге жатпайтынын анықтаңдар.', o: ['тұрақтылық', 'икемділік', 'сыйымдылық', 'өнімділік'], a: 3, src: 'Оқулық, 54-бет', why: 'Табиғи ортаны сипаттайтын көрсеткіштер: тұрақтылық, икемділік, инерция, сыйымдылық және ортаның өзгеру шектері.' },
    { t: 'num', time: 30, q: 'Ормандар бүкіл құрлықтың неше пайызын алып жатыр?', unit: '%', a: 26.8, src: 'Оқулық, 54-бет', hint: 'Ондық бөлшекті үтірмен жазыңдар' },
    { t: 'mc', time: 25, q: 'Жыл сайын тек эрозия есебінен айналымнан шығып қалатын жер көлемін анықтаңдар.', o: ['0,6–0,7 млн га', '6–7 млн га', '60–70 млн га', '600–700 млн га'], a: 1, src: 'Оқулық, 55-бет' },
    { t: 'tf', time: 25, q: 'Шөлейттену үдерісі жұтаң топырақ өсімдік жамылғысының маусымдық кезеңдердегі жиі қайталанатын құрғақшылықтар әсерінен болады.', a: true, src: 'Оқулық, 55-бет', why: 'Жер шары халқының күрт өсуі, шұрайлы жерлердің толық игерілуі және техногендік әсердің артуы бұл үдерісті күшейтеді.' },
    /* 2-раунд: себеп-салдар және өмірмен байланыс */
    { t: 'order', time: 40, q: 'Су айналымы — үздіксіз тізбек. Арал теңізі мысалында себеп-салдар тізбегін ретімен құрастырыңдар.', ins: 'Себептен бастап салдарға қарай ретімен басыңдар: төменде себеп-салдар сызбасы құрылады', g: 'Себеп-салдар сызбасы · Арал теңізі', ic: ['🚢', '🚜', '🏜️', '🌊'], o: ['Теңіз деңгейі төмендеп, табаны құрғайды', 'Өзен суы шаруашылық мақсатта суаруға алынады', 'Антропогендік шөлейттену күшейеді', 'Өзен суларының жылдық ағыны өзгереді'], a: [1, 3, 0, 2], src: 'Оқулық, 55–56-беттер', why: 'Тізбектің бір буынындағы өзгеріс бүкіл тізбектегі өзгерістерге себепші болады.' },
    { t: 'num', time: 30, q: '21-сурет. Күн энергиясы жер бетіне жұтылып, оны қандай мөлшерде жылытады?', unit: 'Вт/м²', a: 168, src: 'Оқулық, 55-бет, 21-сурет' },
    { t: 'order', time: 40, q: '21-сурет бойынша жылыжай эффектісінің пайда болу үдерісін ретімен құрастырыңдар.', ins: 'Үдерістің басынан бастап ретімен басыңдар: төменде үдерістің сызбасы құрылады', g: 'Үдеріс сызбасы · жылыжай эффектісі', ic: ['🌍', '☀️', '🌡️', '↩️'], o: ['Күн энергиясы жер бетін 168 Вт/м² мөлшерінде жылытады', 'Келетін радиация — 343 Вт/м²', 'Инфрақызыл радиацияның бір бөлігін жылыжай газдарының молекулалары ұстап қалады', 'Күн радиациясының бір бөлігі кері шығарылады (103 Вт/м²)'], a: [1, 3, 0, 2], src: 'Оқулық, 55-бет, 21-сурет' },
    { t: 'mc', time: 25, q: 'Жылыжай газдарына жатпайтынын анықтаңдар.', o: ['көмірқышқыл газы', 'метан', 'азот тотығы', 'оттегі'], a: 3, src: 'Оқулық, 55-бет', why: 'Жылыжай газдары: көмірқышқыл газы, метан, фреон, азот тотығы және т.б.' },
    { t: 'mc', time: 25, q: 'Ғалымдардың пікірінше, қазіргі кезде адамзат үшін басты мәселе — судың ...', o: ['тапшылығы', 'ластануы', 'тұздануы', 'булануы'], a: 1, src: 'Оқулық, 56-бет', why: 'Өндірістік және тұрмыстық қалдықтармен ластанған сулар гидросфераның барлық дерлік бөлігіне таралуда.' },
    { t: 'mc', time: 30, q: 'Өмірмен байланыс: 2021–2025 жылдары Арал теңізінің құрғаған табанына 920 мың гектардан астам сексеуіл отырғызылды. Бұл шара 20-суреттегі қай ықпалды азайтуға бағытталған?', o: ['Антропогендік шөлейттену', 'Жылыжай эффектісінің пайда болуы', 'Табиғи ортаның антропогендік ластануы', 'Құрлықтағы ормандардың жойылуы'], a: 0, src: 'ҚР Экология министрлігі, 2025; оқулық, 54-бет' }
  ];
  ECO.TEAMS = [
    { key: 'forest', name: 'Орман сақшылары', c1: '#43B36B', c2: '#1F7A45', soft: '#E3F5E9', ink: '#165C33' },
    { key: 'water', name: 'Су сақшылары', c1: '#3FA4E8', c2: '#1661A3', soft: '#E1F0FB', ink: '#124E86' },
    { key: 'erosion', name: 'Дала сақшылары', c1: '#F2A541', c2: '#C0661A', soft: '#FDEEDC', ink: '#8C4A12' }
  ];
  ECO.LETTERS = ['А', 'Ә', 'Б', 'В'];
  ECO.IMG = (k) => 'img/' + k + '.jpg';

  ECO.isRight = function (q, v) {
    if (v === null || v === undefined || v === '') return false;
    if (q.t === 'num') return Math.abs(parseFloat(String(v).replace(',', '.')) - q.a) < 0.051;
    if (q.t === 'order') return Array.isArray(v) && v.length === q.a.length && v.every((x, k) => x === q.a[k]);
    return v === q.a;
  };
  ECO.answerText = function (q, v) {
    if (v === undefined) v = q.a;
    if (v === null || v === '' || (Array.isArray(v) && !v.length)) return 'жауап жоқ';
    if (q.t === 'mc') return ECO.LETTERS[v] + ') ' + q.o[v];
    if (q.t === 'img') return ECO.LETTERS[v] + ' сурет';
    if (q.t === 'tf') return v ? 'Шын' : 'Жалған';
    if (q.t === 'num') return String(v).replace('.', ',') + ' ' + q.unit;
    if (q.t === 'order') return v.map((j) => q.o[j]).join(' → ');
    return String(v);
  };
  /* ұпай: дұрыс жауап 500 + жылдамдыққа 500-ге дейін */
  ECO.LEAD = 3000; /* сұрақ шыққан соң 3 секунд дайындық (3-2-1) */
  ECO.qtime = function (q, meta, qi) { const ext = meta && meta.ext && meta.ext[qi]; return (q.time + (typeof ext === 'number' ? ext : 0)) * 1000; };
  ECO.points = function (q, ans, startedAt, totalMs) {
    if (!ans || !ECO.isRight(q, ans.v)) return 0;
    const total = totalMs || q.time * 1000; const st = startedAt + ECO.LEAD;
    const raw = (ans.t || st) - st;
    if (raw > total + 2000) return 0;
    const el = Math.max(0, Math.min(total, raw));
    return Math.round(500 + 500 * (1 - el / total));
  };
  /* барлық ойыншының нәтижесін есептеу */
  ECO.compute = function (game) {
    const players = game.players || {}, teams = game.teams || {}, answers = game.answers || {}, starts = (game.meta && game.meta.starts) || {};
    const asked = Object.keys(starts).map(Number).sort((a, b) => a - b);
    const rows = Object.keys(players).map((uid) => {
      let score = 0, correct = 0, time = 0, wrong = [];
      asked.forEach((qi) => {
        const q = ECO.QUESTIONS[qi]; const a = answers[qi] && answers[qi][uid]; const p = ECO.points(q, a, starts[qi], ECO.qtime(q, game.meta, qi));
        score += p; if (p > 0) { correct++; time += Math.max(0, a.t - starts[qi] - ECO.LEAD) / 1000; } else wrong.push(qi);
      });
      score += ((game.meta && game.meta.boardInd) || {})[uid] || 0;
      return { uid, name: players[uid].name, team: teams[uid], score, correct, total: asked.length, time: correct ? time / correct : 0, wrong };
    }).sort((a, b) => b.score - a.score || b.correct - a.correct || a.name.localeCompare(b.name));
    rows.forEach((r, i) => { r.rank = i + 1; });
    const teamRows = ECO.TEAMS.map((t, i) => { const m = rows.filter((r) => r.team === i); const sum = m.reduce((s, r) => s + r.score, 0);
      const bonus = ((game.meta && game.meta.boardPts) || {})[i] || 0; return { i, n: m.length, sum, bonus, avg: (m.length ? Math.round(sum / m.length) : 0) + bonus, correct: m.reduce((s, r) => s + r.correct, 0) }; })
      .sort((a, b) => b.avg - a.avg);
    teamRows.forEach((t, k) => { t.rank = k + 1; });
    return { rows, teamRows, asked };
  };
  ECO.level = function (r) {
    if (!r.total) return ['—', ''];
    const p = r.correct / r.total;
    return p >= 0.85 ? ['Жоғары', 'hi'] : p >= 0.5 ? ['Орта', 'mid'] : ['Қолдау қажет', 'low'];
  };
  ECO.esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- backend ---------- */
  function setIn(obj, parts, val) {
    if (!parts.length) return val;
    const o = obj && typeof obj === 'object' ? Object.assign({}, obj) : {};
    const [h, ...rest] = parts; const nv = setIn(o[h], rest, val);
    if (nv === null || nv === undefined) delete o[h]; else o[h] = nv;
    return o;
  }
  function getIn(obj, parts) { return parts.reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj); }
  const TS_MARK = { '.sv': 'timestamp' };
  function resolveTs(v) {
    if (v && typeof v === 'object') {
      if (v['.sv'] === 'timestamp') return Date.now();
      const o = Array.isArray(v) ? [] : {}; Object.keys(v).forEach((k) => { o[k] = resolveTs(v[k]); }); return o;
    }
    return v;
  }

  async function localBackend() {
    const KEY = 'ecolive_db_v1';
    let uid; try { uid = sessionStorage.getItem('ecolive_uid'); if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem('ecolive_uid', uid); } } catch (e) { uid = 'u' + Math.random().toString(36).slice(2, 10); }
    const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
    const listeners = new Set();
    const fire = () => { const db = read(); listeners.forEach((l) => l(db)); };
    let bc = null; try { bc = new BroadcastChannel('ecolive'); bc.onmessage = fire; } catch (e) {}
    window.addEventListener('storage', (e) => { if (e.key === KEY) fire(); });
    const write = (fn) => { const db = fn(read()); try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} fire(); if (bc) bc.postMessage(1); };
    return {
      demo: true, uid,
      TS: TS_MARK,
      now: () => Date.now(),
      set: async (p, v) => write((db) => setIn(db, p.split('/'), resolveTs(v))),
      update: async (p, o) => write((db) => { let d = db; Object.keys(o).forEach((k) => { d = setIn(d, (p + '/' + k).split('/'), resolveTs(o[k])); }); return d; }),
      on: (p, cb) => { let last; const l = (db) => { const v = getIn(db, p.split('/')); const s = JSON.stringify(v); if (s !== last) { last = s; cb(v === undefined ? null : v); } }; listeners.add(l); l(read()); return () => listeners.delete(l); },
      get: async (p) => { const v = getIn(read(), p.split('/')); return v === undefined ? null : v; }
    };
  }

  async function firebaseBackend(cfg) {
    firebase.initializeApp(cfg);
    await firebase.auth().signInAnonymously();
    const uid = firebase.auth().currentUser.uid;
    const db = firebase.database(); let offset = 0;
    db.ref('.info/serverTimeOffset').on('value', (s) => { offset = s.val() || 0; });
    return {
      demo: false, uid,
      TS: firebase.database.ServerValue.TIMESTAMP,
      now: () => Date.now() + offset,
      set: (p, v) => db.ref(p).set(v),
      update: (p, o) => db.ref(p).update(o),
      on: (p, cb) => { const r = db.ref(p); const h = (s) => cb(s.val()); r.on('value', h); return () => r.off('value', h); },
      get: async (p) => (await db.ref(p).get()).val()
    };
  }

  /* ---------- тікелей байланыс (PeerJS): тақтадағы бет — сервер, тіркелу керек емес ---------- */
  const PEER_OPTS = () => Object.assign({ debug: 0, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] } }, window.ECO_PEER || {});
  const peerId = (code) => 'ecokz-sabaq15-' + code;
  function sessionUid(key) { let u; try { u = sessionStorage.getItem(key); if (!u) { u = 'p' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem(key, u); } } catch (e) { u = 'p' + Math.random().toString(36).slice(2, 10); } return u; }

  async function p2pHost(code) {
    let uid; try { uid = localStorage.getItem('ecolive_hostuid'); if (!uid) { uid = 'h' + Math.random().toString(36).slice(2, 10); localStorage.setItem('ecolive_hostuid', uid); } } catch (e) { uid = 'h' + Math.random().toString(36).slice(2, 10); }
    const KEY = 'ecolive_p2p_' + code;
    let db = {}; try { db = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
    const listeners = new Set(); const conns = new Map();
    const G = 'games/' + code;
    const broadcast = () => { const msg = { type: 'state', game: getIn(db, G.split('/')) || null, t: Date.now() }; conns.forEach((_, c) => { if (c.open) { try { c.send(msg); } catch (e) {} } }); };
    const commit = (fn) => { db = fn(db); try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} listeners.forEach((l) => l(db)); broadcast(); };
    const allowed = (path, cuid) => {
      const p = path.split('/'); if (p[0] !== 'games' || p[1] !== code) return false;
      if (p[2] === 'players' && p[3] === cuid && p.length === 4) return true;
      if (p[2] === 'feedback' && p[3] === cuid && p.length === 4) return true;
      if (p[2] === 'guests' && p[3] === cuid && p.length === 4) return true;
      if (p[2] === 'answers' && p[4] === cuid && p.length === 5) return getIn(db, p) === undefined;
      return false;
    };
    const peer = new Peer(peerId(code), PEER_OPTS());
    await new Promise((res, rej) => {
      const to = setTimeout(res, 8000);
      peer.on('open', () => { clearTimeout(to); res(); });
      peer.on('error', (e) => { if (e && e.type === 'unavailable-id') { clearTimeout(to); rej(Object.assign(new Error('Бұл код бос емес'), { code: 'busy' })); } });
    });
    peer.on('disconnected', () => { setTimeout(() => { try { peer.reconnect(); } catch (e) {} }, 1500); });
    peer.on('connection', (c) => {
      let cuid = null;
      c.on('data', (m) => {
        if (!m || typeof m !== 'object') return;
        if (m.type === 'hello') { cuid = String(m.uid || '').slice(0, 20); conns.set(c, cuid); try { c.send({ type: 'state', game: getIn(db, G.split('/')) || null, t: Date.now() }); } catch (e) {} return; }
        if (m.type === 'set' && cuid && typeof m.path === 'string' && allowed(m.path, cuid)) {
          let v = resolveTs(m.val);
          if (v && typeof v === 'object' && v.name) v.name = String(v.name).slice(0, 24);
          if (v && typeof v === 'object' && v.text) v.text = String(v.text).slice(0, 200);
          commit((d) => setIn(d, m.path.split('/'), v));
        }
      });
      c.on('close', () => conns.delete(c));
      c.on('error', () => conns.delete(c));
      conns.set(c, cuid);
    });
    return {
      demo: false, p2p: true, uid, TS: TS_MARK,
      now: () => Date.now(),
      set: async (p, v) => commit((d) => setIn(d, p.split('/'), resolveTs(v))),
      update: async (p, o) => commit((d) => { let x = d; Object.keys(o).forEach((k) => { x = setIn(x, (p + '/' + k).split('/'), resolveTs(o[k])); }); return x; }),
      on: (p, cb) => { let last; const l = (d) => { const v = getIn(d, p.split('/')); const s = JSON.stringify(v); if (s !== last) { last = s; cb(v === undefined ? null : v); } }; listeners.add(l); l(db); return () => listeners.delete(l); },
      get: async (p) => { const v = getIn(db, p.split('/')); return v === undefined ? null : v; },
      peers: () => conns.size
    };
  }

  async function p2pPlayer() {
    const uid = sessionUid('ecolive_puid');
    let peer = null, conn = null, code = null, state = {}, offset = 0, ready = null;
    const listeners = new Set();
    const fire = () => listeners.forEach((l) => l(state));
    function ensure(c) {
      if (code === c && ready) return ready;
      code = c;
      ready = new Promise((res) => {
        const done = (ok) => { clearTimeout(to); res(ok); };
        const to = setTimeout(() => res(false), 10000);
        const open = () => {
          conn = peer.connect(peerId(c), { reliable: true });
          conn.on('open', () => { conn.send({ type: 'hello', uid }); });
          conn.on('data', (m) => { if (m && m.type === 'state') { offset = (m.t || Date.now()) - Date.now(); state = setIn(state, ['games', c], m.game); fire(); done(true); } });
          conn.on('close', () => { setTimeout(() => { if (code === c) open(); }, 2500); });
          conn.on('error', () => {});
        };
        const start = () => { peer = new Peer(undefined, PEER_OPTS()); peer.on('open', open); peer.on('error', (e) => { if (e && e.type === 'peer-unavailable') done(false); }); peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) {} }); };
        if (peer && !peer.destroyed) open(); else start();
      });
      return ready;
    }
    const codeOf = (p) => { const x = p.split('/'); return x[0] === 'games' ? x[1] : null; };
    return {
      demo: false, p2p: true, uid, TS: TS_MARK,
      now: () => Date.now() + offset,
      set: async (p, v) => { await ensure(codeOf(p)); if (conn && conn.open) conn.send({ type: 'set', path: p, val: v }); },
      update: async () => {},
      on: (p, cb) => { ensure(codeOf(p)); let last; const l = (d) => { const v = getIn(d, p.split('/')); const s = JSON.stringify(v); if (s !== last) { last = s; cb(v === undefined ? null : v); } }; listeners.add(l); l(state); return () => listeners.delete(l); },
      get: async (p) => { const ok = await ensure(codeOf(p)); if (!ok) { ready = null; return null; } const v = getIn(state, p.split('/')); return v === undefined ? null : v; }
    };
  }

  ECO.connect = async function (opts) {
    opts = opts || {};
    const cfg = window.ECO_FIREBASE;
    if (cfg && cfg.apiKey && window.firebase) return firebaseBackend(cfg);
    if (window.Peer && !window.ECO_DEMO) return opts.role === 'host' ? p2pHost(opts.code) : p2pPlayer();
    return localBackend();
  };
})();
