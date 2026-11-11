/* Тақта: бір экран — бір әрекет. Әдіс → Қалай орындаймыз → Тапсырма. Бағалау, сөз, рейтинг — бөлек панельдерде. */
(function () {
  const LD = window.LD, GT = window.GT;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = GT.esc, ST = LD.stages, F = LD.factors;
  const LS = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const SET = Object.assign({ autoTimer: true, guideAll: false, voice: true, videoUrl: '' }, LS.get('ge_set', {}));
  const S = { i: Math.min(ST.length - 1, Math.max(0, LS.get('ge_stage', 0))), code: '', db: null, game: {}, roster: LS.get('ge_roster', []), manual: LS.get('ge_manual', {}),
    bsc: LS.get('ge_bsc', {}), poster: LS.get('ge_poster', [[0, 0, 0], [0, 0, 0], [0, 0, 0]]), det: LS.get('ge_det', { pos: -1, queue: null, log: [], stars: [0, 0, 0] }),
    mood: {}, hw: { q: 0, pick: null, key: false }, spk: 0, spkDone: {}, gal: -1, posterMode: 'work', grouped: false, endTab: 'rate', quizShow: true };
  if (S.roster.some((p) => p.name === 'Нақшин')) { S.roster.forEach((p) => { if (p.name === 'Нақшин') p.name = 'Жасмин'; }); LS.set('ge_roster', S.roster); }
  if (!S.roster.length && LD.defaultRoster) { const list = GT.parseRoster(LD.defaultRoster); const out = []; LD.groups.forEach((_, gi) => GT.assignRoles(list.filter((p) => p.fixG === gi)).forEach((p) => out.push(Object.assign(p, { g: gi })))); S.roster = out; LS.set('ge_roster', out); }
  const grp = (i) => LD.groups[i] || LD.groups[0];
  const role = (k) => LD.roles.find((r) => r.key === k);
  const task = (k) => LD.tasks.find((t) => t.k === k);
  const kMax = (k) => task(k).d.reduce((a, d) => a + d.p, 0);
  const cur = () => ST[S.i];
  const link = (f, extra) => GT.base() + f + '?c=' + S.code + (S.db && S.db.demo ? '&demo=1' : '') + (extra || '');
  const MEDIA = 'live/media/';

  function fit() { const k = Math.min(innerWidth / 1920, innerHeight / 1080); $('#stage').style.transform = `scale(${k})`; }
  addEventListener('resize', fit); fit();

  /* ---------- ұпайлар ---------- */
  /* тақтада қойылған ұпай: S.bsc[key] = {name, g, sc:{K1_1:1, K2_0:1, K3_0:1, K3_1:0}} */
  function bScore(p, dk, v) { const key = GT.nrm(p.name); const e = S.bsc[key] || { name: p.name, g: p.g, sc: {} }; e.sc[dk] = v; S.bsc[key] = e; LS.set('ge_bsc', S.bsc); live(); }
  function boardMap() {
    const m = JSON.parse(JSON.stringify(S.bsc));
    S.roster.forEach((p) => { const pv = S.poster[p.g]; if (!pv) return; const key = GT.nrm(p.name); const e = m[key] || { name: p.name, g: p.g, sc: {} }; pv.forEach((v, i) => { if (v) e.sc['K4_' + i] = 1; }); m[key] = e; });
    return m;
  }
  function rating() {
    const rows = GT.rating(S.game, S.roster, boardMap());
    rows.forEach((r) => {
      const m = S.manual[r.key];
      if (m) Object.keys(m).forEach((k) => { if (m[k] !== '' && m[k] != null) r.byK[k] = Math.min(kMax(k), Math.max(0, +m[k])); });
      r.total = Object.values(r.byK).reduce((a, b) => a + b, 0); r.pct = GT.pct(r.total, LD.MAX); r.b = GT.ball10(r.total, LD.MAX); r.band = GT.band(r.b);
    });
    return rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }
  function groupTotals(rows) { const t = LD.groups.map(() => 0); rows.forEach((r) => { if (r.g != null) t[r.g] += r.total; }); return t; }

  /* ---------- таймер ---------- */
  const T = { total: 0, left: 0, run: false, end: 0, sig60: false, last: -1 };
  const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  function tSet(sec, start) { T.total = sec; T.left = sec; T.run = false; T.sig60 = sec <= 60; T.last = -1; $('#count').classList.remove('on'); if (start && sec > 0) tStart(); tDraw(); }
  function tStart() { if (T.left <= 0) return; T.run = true; T.end = Date.now() + T.left * 1000; tDraw(); }
  function tToggle() { if (T.run) { T.run = false; tDraw(); } else tStart(); GT.tone(1, 0.01); }
  function tDraw() { $('#tval').textContent = fmt(T.left); $('#tplay').textContent = T.run ? '⏸' : '▶'; $('#timer').classList.toggle('low', T.left <= 60 && T.total > 0); $('#timer').classList.toggle('run', T.run); }
  function banner(t, ms) { const b = $('#banner'); b.textContent = t; b.classList.add('on'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('on'), ms || 3800); }
  $('#tplay').onclick = tToggle; $('#treset').onclick = () => tSet(T.total);
  $('#tplus').onclick = () => { T.left += 60; T.total = Math.max(T.total, T.left); if (T.run) T.end += 60000; if (T.left > 60) T.sig60 = false; tDraw(); };
  const MT = { run: false, end: 0, last: -1, done: null, sec: 60 };
  function miniStart(sec, done) { MT.run = true; MT.sec = sec; MT.end = Date.now() + sec * 1000; MT.last = -1; MT.done = done; }
  setInterval(() => {
    if (T.run) {
      T.left = (T.end - Date.now()) / 1000;
      if (!T.sig60 && T.left <= 60) { T.sig60 = true; GT.chime(); banner('⏰ 1 минут қалды!'); }
      const s = Math.ceil(T.left);
      if (s <= 10 && s > 0 && s !== T.last && !MT.run) { T.last = s; GT.tick(); $('#count').classList.add('on'); const n = $('#cnum'); n.textContent = s; n.style.animation = 'none'; void n.offsetWidth; n.style.animation = ''; }
      if (T.left <= 0) { T.left = 0; T.run = false; $('#count').classList.remove('on'); GT.melody(); banner('🎵 Уақыт бітті!', 4000); }
      tDraw();
    }
    if (MT.run) {
      const left = Math.max(0, (MT.end - Date.now()) / 1000), s = Math.ceil(left), el = $('#mini');
      if (el) { el.textContent = fmt(left); el.style.color = s <= 10 ? '#D2452F' : ''; const ring = $('#ring'); if (ring) ring.style.strokeDashoffset = 314 * (1 - left / MT.sec); }
      if (s <= 10 && s > 0 && s !== MT.last) { MT.last = s; GT.tick(); }
      if (left <= 0) { MT.run = false; GT.bell(); if (MT.done) MT.done(); }
    }
  }, 200);

  /* ---------- гид ---------- */
  let kk = null; const lv = () => { try { kk = (speechSynthesis.getVoices() || []).find((v) => /^kk/i.test(v.lang)) || null; } catch (e) {} };
  try { lv(); speechSynthesis.onvoiceschanged = lv; } catch (e) {}
  function guide(text) {
    const b = $('#bub'); $('#gtext').textContent = text; b.classList.add('on'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('on'), 6500);
    if (kk && SET.voice) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.voice = kk; u.lang = kk.lang; speechSynthesis.speak(u); } catch (e) {} }
  }
  $('#gmed').onclick = () => guide(cur().guide);

  /* ---------- 3D глобус ---------- */
  let GL = null, GLmod = null, GLtoken = 0;
  async function mountGlobe(el, opts) {
    const tok = ++GLtoken; if (GL) { GL.dispose(); GL = null; }
    try { GLmod = GLmod || await import('./globe.js'); } catch (e) { el.innerHTML = '<div style="color:#fff;padding:30px;font-size:24px">3D глобус ашылмады: браузер WebGL-ді қолдамайды.</div>'; return null; }
    const g = await GLmod.createGlobe(el, opts || {}); if (tok !== GLtoken) { g.dispose(); return null; } GL = g; return g;
  }
  function killGlobe() { GLtoken++; if (GL) { GL.dispose(); GL = null; } }

  /* ---------- экрандар ---------- */
  const R = {};
  const how = (s) => `<div class="how"><h3>ҚАЛАЙ ОРЫНДАЙМЫЗ?</h3><ol>${s.how.map((h, i) => `<li><b>${i + 1}</b><span>${esc(h)}</span></li>`).join('')}</ol>
    ${s.id === 'groups' ? `<div style="display:flex;gap:12px;align-items:center;background:rgba(255,255,255,.1);border-radius:18px;padding:10px"><div class="qrbox" style="width:120px;height:120px;padding:6px;flex:none">${GT.qr(link('hatshy.html'), 120)}</div><div style="font-size:18px;font-weight:700"><b style="color:var(--amber2)">📒 ХАТШЫЛАРҒА</b><br>Әр топтан бір хатшы осы QR-ды сканерлейді</div></div>` : ''}
    <div class="say"><h4>🗣 СӨЙЛЕУ ҮЛГІСІ</h4>${(LD.say[s.id] || []).map((x) => `<i>${esc(x)}</i>`).join('')}</div></div>`;

  R.hello = () => `<div class="card dark" style="height:100%;padding:0;overflow:hidden;display:grid;grid-template-columns:1.25fr .75fr">
    <div style="position:relative;overflow:hidden;border-radius:26px 0 0 26px"><video class="bgv" src="${MEDIA}bg_earth.mp4" autoplay muted loop playsinline></video><div class="shade"></div>
      <div style="position:absolute;left:44px;right:40px;top:40px;bottom:36px;display:flex;flex-direction:column">
        <div style="font:800 18px var(--display);letter-spacing:3px;color:var(--amber2)">ГЕОГРАФИЯ · 10 «Б»</div>
        <h1 style="font-size:66px;margin-top:14px;color:#fff">Сәлеметсіздер ме, құрметті қонақтар мен оқушылар!</h1>
        <div style="font:800 30px var(--display);margin-top:18px;color:#FFD58A">${esc(LD.lesson.topic)}</div>
        <div style="font-size:21px;margin-top:8px;opacity:.85">${esc(LD.lesson.teacher)} · ${esc(LD.lesson.school)}</div>
        <div style="margin-top:auto;font:italic 800 28px var(--body);border-left:5px solid var(--amber2);padding-left:16px">${esc(LD.lesson.quote)}</div></div></div>
    <div style="padding:30px 30px;background:#FBFAF6;color:var(--ink);display:flex;flex-direction:column;gap:12px">
      <div style="font:800 18px var(--display);letter-spacing:2px;color:var(--amber)">🎯 БҮГІН САБАҚТА</div>
      ${LD.goals.map((g, i) => `<div style="display:flex;gap:12px;align-items:center;font-size:22px;font-weight:700;line-height:1.25"><b style="flex:none;width:44px;height:44px;border-radius:14px;background:${grp(i).c};color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px">${['🌍', '🗂️', '📊'][i]}</b>${esc(g)}</div>`).join('')}
      <div style="font:800 18px var(--display);letter-spacing:2px;color:var(--amber);margin-top:8px">КӨҢІЛ-КҮЙІМ</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${[['🌳', 'Шабыттымын', '#1E9A5A'], ['🌤️', 'Жақсы', '#3FA4E8'], ['🤔', 'Ойланып тұрмын', '#F2A541'], ['🌧️', 'Шаршадым', '#7C6BB5']].map(([e, t, c], i) => `<button class="mood" data-i="${i}" style="border:2px solid ${c}55;background:#fff;border-radius:20px;padding:8px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:10px"><span style="font-size:44px">${e}</span><b style="font-size:19px;color:${c};flex:1;text-align:left">${t}</b><b style="font:900 28px var(--display);color:${c}" data-c="${i}">${S.mood[i] || 0}</b></button>`).join('')}</div></div></div>`;

  R.hw = () => { const q = LD.hot[S.hw.q], p = S.hw.pick; return `<div class="card" style="height:100%;padding:0;overflow:hidden"><div class="gl" id="glb"></div>
    <div style="position:absolute;left:18px;top:18px;width:430px;display:flex;flex-direction:column;gap:12px;z-index:5">
      <div class="card" style="padding:16px 20px"><div style="font:800 15px var(--display);letter-spacing:2px;color:var(--mut)">🔥 ЫСТЫҚ ОРЫНДЫҚТА</div><div id="pick" style="font:900 40px/1.1 var(--display);min-height:48px;color:${p ? grp(p.g).ink : 'var(--ink)'}">${p ? esc(p.name) : '— ? —'}</div>${p && p.g != null ? `<div style="font-weight:800;color:${grp(p.g).c}">${grp(p.g).icon} ${esc(grp(p.g).name)}</div>` : ''}
        <button class="btn" id="spin" style="width:100%;margin-top:10px">🎲 Оқушыны таңдау</button></div>
      <div style="display:flex;gap:8px">${LD.hot.map((h, i) => `<button class="btn ${i === S.hw.q ? '' : 'sec'} hq" data-i="${i}" style="flex:1;padding:10px 8px;font-size:17px">${esc(h.place)}</button>`).join('')}</div></div>
    <div class="card dark" style="position:absolute;right:18px;top:18px;width:560px;z-index:5;padding:20px 24px"><div style="font:800 15px var(--display);letter-spacing:2px;color:var(--amber2)">📍 ${esc(q.place).toUpperCase()}</div><div style="font:800 30px/1.2 var(--display);margin-top:8px">${esc(q.q)}</div>
      <div id="ans" style="margin-top:14px;font-size:23px;font-weight:800;color:#7BE0A6;display:${S.hw.key ? 'block' : 'none'}">✓ ${esc(q.a)}</div></div>
    <div style="position:absolute;left:18px;right:18px;bottom:16px;z-index:5;display:flex;gap:12px;align-items:center"><button class="btn sec" id="ansB">🔑 Жауапты ашу</button><button class="btn green" id="okB" ${p && !p.anon ? '' : 'disabled'}>✓ Дәлелдеді +1</button><button class="btn red" id="noB" ${p && !p.anon ? '' : 'disabled'}>✗ Толықтыру керек</button><span style="flex:1"></span><span class="chip" style="background:rgba(255,255,255,.9)">📒 Қалғандары — хатшы K1 бойынша</span></div></div>`; };

  R.groups = () => {
    if (!S.roster.length) return `<div class="card" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center"><div style="font-size:90px">🌍</div><h2 style="font-size:36px">Оқушылар тізімі әлі енгізілмеген</h2><div class="mut" style="font-size:24px">⚙️ Баптау → «Тізім» бөліміне аты-жөнін деңгейімен (A/B/C) енгізіңіз — бір рет қана</div><button class="btn" id="goSet">⚙️ Тізімді енгізу</button></div>`;
    return `<div style="display:grid;grid-template-columns:1fr 1fr 1fr 300px;gap:16px;height:100%">
      ${LD.groups.map((g, gi) => { const m = S.roster.filter((p) => p.g === gi); return `<div class="card" style="padding:16px 18px;border-top:10px solid ${g.c};background:${g.soft};overflow:hidden"><div style="font:800 18px var(--display);color:${g.ink}">${g.icon} ${g.short}</div><div style="font:800 28px/1.1 var(--display);color:${g.ink};margin-bottom:8px">${esc(g.name)}</div>
        ${m.map((p, k) => `<div class="mem" style="display:flex;justify-content:space-between;gap:8px;background:#fff;border-radius:14px;padding:8px 12px;margin-top:7px;font-size:21px;font-weight:800;${S.grouped ? '' : 'opacity:0;transform:translateY(-30px) scale(.8)'};transition:.5s cubic-bezier(.2,.8,.2,1);transition-delay:${(k * 3 + gi) * 0.12}s"><span>${esc(p.name)}</span><span title="${p.role ? role(p.role).name : ''}">${p.role ? role(p.role).icon : ''}</span></div>`).join('')}</div>`; }).join('')}
      <div class="card" style="text-align:center;padding:16px;display:flex;flex-direction:column;align-items:center;gap:10px"><b style="font:800 21px var(--display)">📱 Тобыңды тап</b><div class="qrbox" style="width:250px;height:250px">${GT.qr(link('quiz.html'), 250)}</div><div class="mut" style="font-size:17px;font-weight:700">Сканерле → атыңды таңда → тобың мен рөлің → телефонды шетке қой 📵</div>
        <button class="btn" id="doGroup" style="margin-top:auto;width:100%">🎲 ${S.grouped ? 'Қайта көрсету' : 'Топтарды көрсету'}</button></div></div>`;
  };

  R.video = () => {
    const u = (SET.videoUrl || '').trim(); const yt = u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    const player = yt ? `<iframe src="https://www.youtube.com/embed/${yt[1]}?rel=0" style="width:100%;height:100%;border:0" allow="autoplay; fullscreen" allowfullscreen></iframe>`
      : `<video id="tourV" src="${esc(u || 'media/globus-sayahat.mp4')}" poster="media/globus-sayahat.jpg" controls playsinline style="width:100%;height:100%;background:#000;object-fit:contain"></video>`;
    return `<div style="display:grid;grid-template-rows:1fr auto;gap:12px;height:100%"><div class="card" style="padding:0;overflow:hidden;background:#000">${player}</div>
      <div class="card" style="padding:12px 18px;display:flex;gap:14px;align-items:center"><button class="btn" id="vplay">▶ Бейнені бастау</button><button class="btn sec" id="vfull">⛶ Толық экран</button><span class="mut" style="flex:1;font-size:19px;font-weight:700">Көріп отырып — №2 парақтағы кластерге 7 ықпалды жазыңдар</span><button class="btn sec" id="vdisc">💬 Талқылау сұрақтары</button></div></div>`;
  };

  /* 6 спикер + 7-ықпал мұғалім */
  const SPK = [{ f: 0, g: 0, r: 'sp1' }, { f: 1, g: 0, r: 'sp2' }, { f: 3, g: 1, r: 'sp1' }, { f: 5, g: 1, r: 'sp2' }, { f: 2, g: 2, r: 'sp1' }, { f: 4, g: 2, r: 'sp2' }, { f: 6, g: -1, r: 'teacher' }];
  const spWho = (x) => { if (x.r === 'teacher') return 'Мұғалім'; const p = S.roster.find((r) => r.g === x.g && r.role === x.r); return p ? p.name : (x.r === 'sp1' ? '1-спикер' : '2-спикер') + ' · ' + grp(x.g).short; };
  const spPerson = (x) => S.roster.find((r) => r.g === x.g && r.role === x.r);
  R.speak = () => {
    const sp = SPK[S.spk], f = F[sp.f], g = sp.g >= 0 ? grp(sp.g) : null, who = spPerson(sp), done = who && S.bsc[GT.nrm(who.name)] && S.bsc[GT.nrm(who.name)].sc.K2_0;
    return `<div style="display:grid;grid-template-rows:auto 1fr auto;gap:10px;height:100%">
      <div style="display:flex;gap:6px">${SPK.map((x, i) => { const gx = x.g >= 0 ? grp(x.g) : { c: '#17302A', soft: '#E9E4D6', ink: '#17302A' }; return `<button class="spt" data-i="${i}" style="flex:1;border:0;border-radius:14px;padding:7px 9px;font-family:var(--body);font-weight:800;font-size:16px;cursor:pointer;text-align:left;color:${i === S.spk ? '#fff' : gx.ink};background:${i === S.spk ? gx.c : gx.soft};opacity:${S.spkDone[i] && i !== S.spk ? 0.55 : 1};line-height:1.2">${S.spkDone[i] ? '✓' : F[x.f].ic} ${i < 6 ? i + 1 + '-спикер' : '7 · мұғалім'}<br><small style="font-weight:700">${esc(F[x.f].short)}</small></button>`; }).join('')}</div>
      <div class="card dark" style="padding:0;overflow:hidden;min-height:0"><video class="bgv" src="${MEDIA}${f.bg}.mp4" autoplay muted loop playsinline></video><div class="shade"></div>
        <div style="position:absolute;left:34px;top:26px;width:820px;bottom:24px;display:flex;flex-direction:column">
          <div style="display:inline-flex;align-self:flex-start;align-items:center;gap:10px;background:${g ? g.c : 'var(--amber)'};border-radius:999px;padding:8px 18px;font:800 20px var(--display)">🎤 ${sp.r === 'teacher' ? 'МҰҒАЛІМ ТҮСІНДІРЕДІ' : 'ҚОРҒАП ЖАТЫР'}: ${esc(spWho(sp))}${g ? ' · ' + g.icon + ' ' + esc(g.name) : ''}</div>
          <div style="font:800 17px var(--display);letter-spacing:2.4px;color:${f.c};margin-top:16px;text-transform:uppercase">${f.n}-ықпал · ${esc(f.sphere)}</div>
          <h2 style="font-size:42px;margin-top:6px;color:#fff">${f.ic} ${esc(f.name)}</h2>
          <div style="display:flex;gap:20px;align-items:baseline;margin-top:12px"><span style="font:900 72px/1 var(--display);background:linear-gradient(180deg,#FFD58A,#F7B24A 45%,#E07A1F);-webkit-background-clip:text;background-clip:text;color:transparent;white-space:nowrap">${esc(f.big)}</span><span style="font-size:22px;font-weight:700;opacity:.9">${esc(f.bigT)}<br><small style="opacity:.7">${esc(f.src)}</small></span></div>
          <div id="spChart" style="margin-top:8px;height:250px">${GC.chart(f.chart, f.c, 1)}</div>
          <div style="margin-top:auto;background:linear-gradient(90deg,rgba(255,196,0,.95),rgba(247,178,74,.95));color:#2A1A00;border-radius:18px;padding:12px 18px;font-size:21px;font-weight:800">🇰🇿 Қазақстанда: ${esc(f.kz)}</div></div>
        <div style="position:absolute;right:28px;top:26px;width:520px;display:flex;flex-direction:column;gap:10px">${f.pts.map((p, i) => `<div style="display:flex;gap:12px;background:rgba(2,10,22,.62);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:12px 14px;font-size:21px;font-weight:700;line-height:1.3"><b style="flex:none;width:34px;height:34px;border-radius:50%;background:${f.c};display:flex;align-items:center;justify-content:center;font:800 17px var(--display)">${i + 1}</b>${esc(p)}</div>`).join('')}
          <div style="background:rgba(2,10,22,.62);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:12px 14px;font-size:18px;line-height:1.35;opacity:.92">📖 ${esc(f.book)}</div></div></div>
      <div class="card" style="padding:10px 16px;display:flex;gap:12px;align-items:center"><button class="btn sec" id="spPrev" ${S.spk ? '' : 'disabled'}>◀</button>
        <svg width="58" height="58" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="#E6EDE8" stroke-width="12"/><circle id="ring" cx="60" cy="60" r="50" fill="none" stroke="${g ? g.c : '#E07A1F'}" stroke-width="12" stroke-dasharray="314" stroke-dashoffset="0" transform="rotate(-90 60 60)" stroke-linecap="round"/></svg>
        <span id="mini" style="font:900 38px var(--display);font-variant-numeric:tabular-nums">01:00</span><button class="btn sec" id="spGo">▶ 1 минут</button>
        ${who ? `<button class="btn green" id="spOk" ${done ? 'disabled' : ''}>${done ? '✓ +1 қойылды' : '✓ Жақсы түсіндірді +1'}</button>` : ''}
        <span class="mut" style="flex:1;font-size:18px;font-weight:700">Тыңдаушылар: кластерге жаз + 1 сұрақ қой</span><button class="btn" id="spNext">${S.spk < 6 ? 'Келесі ▶' : '✓ Аяқтау'}</button></div></div>`;
  };

  /* Глобус-детектив */
  const detQ = () => LD.detective[S.det.qi % LD.detective.length];
  R.globe = () => `<div class="card" style="height:100%;padding:0;overflow:hidden"><div class="gl" id="glb"></div>
    <div id="dwho" style="position:absolute;left:18px;top:18px;z-index:5;width:400px"></div>
    <div id="dtask" style="position:absolute;left:50%;top:18px;transform:translateX(-36%);z-index:5;max-width:780px;text-align:center"></div>
    <div id="dstars" style="position:absolute;right:18px;top:18px;z-index:5;display:flex;flex-direction:column;gap:8px"></div>
    <div id="dopts" style="position:absolute;left:440px;right:18px;bottom:88px;z-index:6;display:none;grid-template-columns:repeat(4,1fr);gap:10px"></div>
    <div id="dres" style="position:absolute;left:50%;top:46%;transform:translate(-50%,-50%) scale(.6);opacity:0;z-index:8;transition:.35s cubic-bezier(.2,.8,.2,1);pointer-events:none;text-align:center;background:rgba(255,255,255,.97);border-radius:28px;padding:20px 34px;max-width:760px;box-shadow:0 20px 50px rgba(0,0,0,.35)"></div>
    <div id="dconf" style="position:absolute;inset:0;pointer-events:none;z-index:9;overflow:hidden"></div>
    <div style="position:absolute;left:18px;right:18px;bottom:16px;z-index:7;display:flex;gap:12px;align-items:center">
      <button class="btn" id="dnext" style="font-size:23px">🎲 Келесі оқушы</button>
      <span id="mini" style="font:900 36px var(--display);font-variant-numeric:tabular-nums;background:rgba(255,255,255,.95);border-radius:14px;padding:2px 14px">00:${LD.detectiveTime}</span>
      <button class="btn sec" id="dskip">⏭ Өткізу</button><span style="flex:1"></span>
      <button class="btn sec" id="dlog">📋 Нәтижені жариялау</button></div></div>`;

  R.poster = () => {
    if (S.gal < 0) return `<div style="display:grid;grid-template-rows:1fr auto;gap:12px;height:100%"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;min-height:0">${LD.posters.map((p) => { const g = grp(p.g); return `<div class="card" style="padding:18px 20px;border-top:10px solid ${g.c};background:${g.soft};display:flex;flex-direction:column;gap:10px;overflow:hidden">
        <div style="font:800 18px var(--display);color:${g.ink}">${g.icon} ${g.short} · ${esc(g.name)}</div><div style="display:flex;gap:8px">${p.f.map((k) => `<span class="chip" style="background:#fff;border:2px solid ${F[k].c}">${F[k].ic} ${esc(F[k].short)}</span>`).join('')}</div>
        <div style="font:800 25px/1.2 var(--display);color:${g.ink}">${esc(p.q)}</div><div style="font-size:19px;font-weight:700;line-height:1.35">${esc(p.task)}</div>
        <div style="margin-top:auto;background:#fff;border-radius:16px;padding:10px 14px;font-size:17px;font-weight:700">📊 Постерде: <b>себеп → салдар</b> · <b>диаграмма</b> · <b>🇰🇿 мысал</b> · <b>қорғау шарасы</b></div></div>`; }).join('')}</div>
      <div class="card" style="padding:12px 18px;display:flex;gap:16px;align-items:center"><span style="font-size:21px;font-weight:800">🛠 5 минут — постер жасау (таймер жоғарыда)</span><span style="flex:1"></span><button class="btn" id="galB">▶ Қорғауды бастау (әр топқа 1 мин)</button></div></div>`;
    const p = LD.posters[S.gal], g = grp(p.g), pv = S.poster[p.g];
    return `<div style="display:grid;grid-template-rows:1fr auto;gap:12px;height:100%">
      <div class="card dark" style="padding:0;overflow:hidden;min-height:0"><video class="bgv" src="${MEDIA}${F[p.f[0]].bg}.mp4" autoplay muted loop playsinline></video><div class="shade" style="background:rgba(2,10,22,.72)"></div>
        <div style="position:absolute;inset:24px 30px;display:grid;grid-template-columns:1fr 1fr 460px;gap:20px">
          ${p.f.map((k) => { const f = F[k]; return `<div style="background:rgba(2,10,22,.55);border:1px solid rgba(255,255,255,.14);border-radius:22px;padding:18px 20px;display:flex;flex-direction:column"><div style="font:800 15px var(--display);letter-spacing:2px;color:${f.c}">${f.n}-ЫҚПАЛ</div><div style="font:800 26px/1.15 var(--display);margin:6px 0 8px">${f.ic} ${esc(f.short)}</div><div style="font:900 50px/1 var(--display);color:#FFC46B">${esc(f.big)}</div><div style="font-size:18px;font-weight:700;opacity:.85;margin-top:4px">${esc(f.bigT)}</div><div style="margin-top:auto;transform:scale(.8);transform-origin:left bottom;height:205px">${GC.chart(f.chart, f.c, 1)}</div></div>`; }).join('')}
          <div style="display:flex;flex-direction:column;gap:12px"><div style="background:${g.c};border-radius:20px;padding:14px 18px"><div style="font:800 16px var(--display);letter-spacing:2px">🎤 ҚОРҒАП ЖАТЫР</div><div style="font:800 30px var(--display)">${g.icon} ${esc(g.name)}</div><div style="font-size:19px;font-weight:700;margin-top:4px">${esc(p.q)}</div></div>
            <div style="font:800 16px var(--display);letter-spacing:2px;color:var(--amber2)">МҰҒАЛІМ БАСАДЫ → ҰПАЙ БҮКІЛ ТОПҚА</div>
            ${task('K4').d.map((d, i) => `<button class="pcrit" data-i="${i}" style="display:flex;gap:12px;align-items:center;text-align:left;border:2px solid ${pv[i] ? '#7BE0A6' : 'rgba(255,255,255,.25)'};background:${pv[i] ? '#1E9A5A' : 'rgba(255,255,255,.08)'};color:#fff;border-radius:16px;padding:12px 14px;font:800 19px/1.25 var(--body);cursor:pointer"><span style="font-size:30px">${pv[i] ? '✅' : '⬜'}</span>${esc(d.t)}</button>`).join('')}
            <div style="margin-top:auto;font:900 34px var(--display);color:#FFC46B">+${pv.reduce((a, b) => a + b, 0)} / 3 <small style="font-size:18px;color:#fff;opacity:.8">әр мүшеге</small></div></div></div></div>
      <div class="card" style="padding:12px 18px;display:flex;gap:16px;align-items:center"><span id="mini" style="font:900 38px var(--display);font-variant-numeric:tabular-nums">01:00</span><button class="btn sec" id="galGo">▶ 1 минут</button>
        <span style="font-size:20px;font-weight:700;flex:1">Басқа топтар: «2 жұлдыз, 1 тілек» + 1 сұрақ</span>${LD.posters.map((x, i) => `<button class="btn ${i === S.gal ? '' : 'sec'} galT" data-i="${i}" style="padding:10px 14px">${grp(x.g).icon}</button>`).join('')}<button class="btn" id="galB">${S.gal < 2 ? 'Келесі топ ▶' : '✓ Аяқтау'}</button></div></div>`;
  };

  R.quiz = () => `<div style="display:grid;grid-template-columns:400px 1fr;gap:18px;height:100%">
    <div class="card" style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px"><div class="qrbox" style="width:330px;height:330px">${GT.qr(link('quiz.html'), 330)}</div><div style="font-size:22px;font-weight:800">Код: <b style="font:900 36px var(--display);letter-spacing:3px">${esc(S.code)}</b></div>
      <div style="display:flex;gap:10px"><button class="btn" id="qopen">▶ Ашу</button><button class="btn sec" id="qclose">⏹ Жабу</button></div><div id="qstat" class="chip" style="margin-top:4px">—</div>
      <div id="qtop" style="width:100%;text-align:left;margin-top:6px"></div></div>
    <div class="card" style="padding:16px 20px;overflow:hidden"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font:800 26px var(--display)">✅ Жауаптар — бірден экранда</b><button class="btn sec" id="qkey" style="padding:8px 14px;font-size:17px">${S.quizShow ? '🙈 Жауапты жасыру' : '🔑 Жауапты көрсету'}</button></div><div id="qlive" style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:8px"></div></div></div>`;

  R.end = () => `<div style="display:grid;grid-template-rows:auto 1fr;gap:12px;height:100%"><div style="display:flex;gap:10px">${[['rate', '🏅 Рейтинг'], ['aw', '🎖 Номинациялар'], ['fb', '💬 Кері байланыс'], ['hw', '🏠 Үй тапсырмасы']].map(([k, t]) => `<button class="btn ${S.endTab === k ? '' : 'sec'} etab" data-t="${k}" style="flex:1">${t}</button>`).join('')}</div><div id="endBox" style="min-height:0"></div></div>`;
  function endBox() {
    const box = $('#endBox'); if (!box) return; const rows = rating(), tot = groupTotals(rows);
    if (S.endTab === 'rate') {
      const order = LD.groups.map((g, i) => ({ g, i, t: tot[i] })).sort((a, b) => b.t - a.t), mx = Math.max(1, ...tot);
      const pod = [1, 0, 2].map((k) => { const o = order[k]; const h = [230, 300, 180][[1, 0, 2].indexOf(k)]; return o ? `<div style="text-align:center;width:250px"><div style="font-size:54px">${o.g.icon}</div><div style="font:800 23px var(--display);color:${o.g.ink}">${esc(o.g.name)}</div><div style="height:${h}px;margin-top:8px;border-radius:20px 20px 0 0;background:linear-gradient(180deg,${o.g.c},${o.g.c2});display:flex;flex-direction:column;align-items:center;padding-top:12px;color:#fff"><b style="font:900 56px var(--display)">${k + 1}</b><span style="font:800 22px var(--display)">${o.t} ұпай</span></div></div>` : ''; }).join('');
      box.innerHTML = `<div style="display:grid;grid-template-columns:.95fr 1.05fr;gap:16px;height:100%"><div class="card" style="display:flex;flex-direction:column"><b style="font:800 24px var(--display)">🏆 Топтар</b><div style="flex:1;display:flex;gap:14px;align-items:flex-end;justify-content:center">${pod}</div></div>
        <div class="card" style="overflow:hidden;display:flex;flex-direction:column"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font:800 24px var(--display)">👤 Оқушылар</b><button class="btn sec" id="fullR" style="padding:8px 14px;font-size:17px">Толық кесте</button></div>
          <div style="display:flex;gap:8px;margin:8px 0;font-size:16px;font-weight:800"><span class="lv lvA">85–100% → 9–10</span><span class="lv lvB">65–84% → 7–8</span><span class="lv lvC">0–64% → 1–6</span></div>
          <div style="overflow:hidden;flex:1">${rows.slice(0, 12).map((r, i) => `<div style="display:flex;gap:10px;align-items:center;font-size:20px;font-weight:700;padding:4px 0"><b style="width:36px">${i < 3 && r.total ? ['🥇', '🥈', '🥉'][i] : i + 1}</b><span style="width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.g != null ? grp(r.g).icon : ''} ${esc(r.name)}</span><div class="bar"><i style="width:${r.pct}%"></i></div><b style="width:64px;text-align:right">${r.pct}%</b><b style="width:54px;text-align:center;font:900 26px var(--display);color:${r.b >= 9 ? '#1E9A5A' : r.b >= 7 ? '#C0661A' : '#D2452F'}">${r.b}</b></div>`).join('') || '<div class="mut" style="font-size:22px;margin-top:20px">Ұпайлар осында жиналады</div>'}</div></div></div>`;
      const fr = $('#fullR'); if (fr) fr.onclick = openRate;
    } else if (S.endTab === 'aw') {
      const A = awards(rows, tot);
      box.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:14px;height:100%">${A.map((a, i) => `<div class="card aw" style="display:flex;gap:16px;align-items:center;padding:16px 20px;opacity:0;transform:scale(.8);transition:.5s cubic-bezier(.2,.8,.2,1);transition-delay:${i * 0.18}s"><div style="flex:none;width:110px;height:110px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff6,transparent 45%),linear-gradient(160deg,${a.c},${a.c2});display:flex;align-items:center;justify-content:center;font-size:54px;box-shadow:0 0 0 6px #fff,0 0 0 9px ${a.c}55,0 12px 26px -8px ${a.c}">${a.ic}</div>
        <div style="min-width:0"><div style="font:800 15px var(--display);letter-spacing:2px;color:${a.c}">${esc(a.t).toUpperCase()}</div><div style="font:900 30px/1.1 var(--display);margin-top:4px;color:var(--deep)">${esc(a.who || '—')}</div><div class="mut" style="font-size:17px;font-weight:700;margin-top:4px">${esc(a.why)}</div></div></div>`).join('')}</div>`;
      requestAnimationFrame(() => requestAnimationFrame(() => $$('.aw', box).forEach((x) => { x.style.opacity = 1; x.style.transform = 'none'; })));
    } else if (S.endTab === 'fb') {
      const fb = (S.game || {}).feedback || {}, gs = (S.game || {}).guests || {}, cnt = {}, notes = [];
      Object.values(fb).forEach((f) => { if (f && f.k) { cnt[f.k] = (cnt[f.k] || 0) + 1; if (f.text) notes.push('🧑‍🎓 ' + f.name + ': ' + f.text); } });
      Object.values(gs).forEach((x) => { if (x && x.kind === 'fb' && x.text) notes.push('👩‍🏫 ' + (x.name || 'Қонақ') + ': ' + x.text); });
      const all = Object.values(cnt).reduce((a, b) => a + b, 0) || 1, col = ['#1E9A5A', '#F2A541', '#D2452F'];
      box.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr 1fr 330px;gap:14px;height:100%">${LD.feedback.map((f, i) => `<div class="card" style="border-top:10px solid ${col[i]};display:flex;flex-direction:column;gap:8px"><div style="font-size:64px">${f.icon}</div><div style="font:800 26px var(--display);color:${col[i]}">${esc(f.t)}</div><div class="mut" style="font-size:19px;font-weight:700">${esc(f.d)}</div><div style="margin-top:auto;display:flex;align-items:center;gap:12px"><div class="bar" style="height:22px"><i style="width:${(cnt[f.k] || 0) / all * 100}%;background:${col[i]}"></i></div><b style="font:900 44px var(--display)">${cnt[f.k] || 0}</b></div></div>`).join('')}
        <div class="card" style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px"><b style="font:800 19px var(--display)">👩‍🏫 Қонақтарға</b><div class="qrbox" style="width:200px;height:200px">${GT.qr(link('quiz.html', '&guest=1'), 200)}</div><div style="text-align:left;font-size:16px;font-weight:700;line-height:1.35;overflow:hidden;flex:1;width:100%">${notes.slice(-6).map((n) => `<div style="background:#F6F1E6;border-radius:10px;padding:6px 10px;margin-top:6px">${esc(n)}</div>`).join('') || '<span class="mut">Пікірлер осында шығады</span>'}</div></div></div>`;
    } else {
      box.innerHTML = `<div class="card" style="height:100%"><b style="font:800 28px var(--display)">🏠 Деңгейлік үй тапсырмасы</b>${LD.homework.map((h) => `<div style="display:flex;gap:16px;margin-top:18px;font-size:25px;font-weight:700;line-height:1.35;background:#F6F1E6;border-radius:18px;padding:16px 18px"><b class="lv lv${h.lvl}" style="font-size:28px;height:fit-content">${h.lvl}</b><span>${esc(h.t)}</span></div>`).join('')}<div class="mut" style="margin-top:18px;font-size:20px;font-weight:700">Оқулық, 54–56-беттер · 20–21-суреттер</div></div>`;
    }
  }

  /* ---------- Номинациялар (медальдар): рейтинг бойынша автоматты ---------- */
  function awards(rows, tot) {
    const named = rows.filter((r) => r.total > 0), by = (f) => named.slice().sort((a, b) => f(b) - f(a) || b.total - a.total)[0];
    const rl = (r) => { const p = S.roster.find((x) => GT.nrm(x.name) === r.key); return p ? p.role : ''; };
    const spk = by((r) => (/^sp/.test(rl(r)) ? 10 : 0) + (r.byK.K2 || 0));
    const order = LD.groups.map((_, i) => i).sort((a, b) => tot[b] - tot[a]);
    const hatP = S.roster.find((p) => p.g === order[0] && p.role === 'hat');
    const pIdx = LD.groups.map((_, i) => i).sort((a, b) => S.poster[b].reduce((x, y) => x + y, 0) - S.poster[a].reduce((x, y) => x + y, 0) || tot[b] - tot[a])[0];
    const det = by((r) => r.byK.K3 || 0), quiz = by((r) => r.quizC || 0), top = named[0];
    return [
      { ic: '🏆', t: 'Жер сақшысы', who: top && top.name, why: top ? `Сабақ көшбасшысы · ${top.pct}% · ${top.b} балл` : 'рейтинг бойынша 1-орын', c: '#1F7A45', c2: '#43B36B' },
      { ic: '🎤', t: 'Үздік спикер', who: spk && spk.name, why: 'Ең түсінікті түсіндірді (K2)', c: '#D2452F', c2: '#F07A64' },
      { ic: '📒', t: 'Үздік хатшы', who: hatP ? hatP.name : grp(order[0]).name + ' хатшысы', why: '1-орын алған топтың хатшысы · мұқият және әділ', c: '#4B4BC8', c2: '#7C6BB5' },
      { ic: '🖼️', t: 'Үздік постер', who: grp(pIdx).icon + ' ' + grp(pIdx).name, why: `Постер критерийлері: ${S.poster[pIdx].reduce((x, y) => x + y, 0)} / 3`, c: '#C0661A', c2: '#F7B24A' },
      { ic: '🕵️', t: 'Глобус-детектив', who: det && det.byK.K3 ? det.name : '', why: 'Глобустан ең дәл тапты (K3)', c: '#1661A3', c2: '#3FA4E8' },
      { ic: '⚡', t: 'Экожарыс көшбасшысы', who: quiz && quiz.quizC ? quiz.name : '', why: quiz && quiz.quizC ? `Квиз: ${quiz.quizC}/${LD.quiz.length} дұрыс` : 'Квиз бойынша 1-орын', c: '#8C4A12', c2: '#F2A541' }
    ];
  }

  /* ---------- көрсету ---------- */
  function show(i, opt) {
    opt = opt || {};
    const prev = S.i; S.i = Math.max(0, Math.min(ST.length - 1, i)); LS.set('ge_stage', S.i);
    const s = cur();
    if (prev !== S.i || opt.force) { MT.run = false; killGlobe(); }
    $('#num').textContent = S.i + 1; $('#title').textContent = s.title;
    const phone = LD.phoneAll.includes(s.id) ? '<span class="chip" style="background:#E1F0FB;color:#124E86">📱 Телефон: бәріне</span>' : '<span class="chip">📵 Телефон жинаулы · тек 📒 хатшы</span>';
    const mode = { 'Жеке': '👤 Жеке', 'Жұп': '👥 Жұп', 'Топ': '🌿 Топ', 'Барлығы': '🙌 Барлығы' }[s.mode] || '';
    $('#method').innerHTML = `<span class="lab">ӘДІС</span><span class="nm">${esc(s.method.name)}</span><span class="es">${esc(s.method.essence)}</span><span class="chip">${mode}</span>${s.sheet ? `<span class="chip sh">📄 ${esc(s.sheet)}</span>` : ''}${phone}${s.k ? `<span class="chip k" id="kchip" title="Критерий мен дескриптор — 📋">📋 ${s.k} · ${kMax(s.k)} ұпай</span>` : ''}`;
    $('#body').innerHTML = `${how(s)}<div class="task" id="task">${R[s.id]()}</div>`;
    $('#prog').innerHTML = ST.map((x, k) => `<i class="${k === S.i ? 'on' : k < S.i ? 'done' : ''}" data-k="${k}" title="${k + 1}. ${esc(x.title)} · ${x.min} мин">${x.ic}<small>${k + 1}</small></i>`).join('');
    if (!opt.keepTimer) tSet(s.min * 60, SET.autoTimer && !opt.noAuto && s.id !== 'video');
    bind(s); live();
    if (!opt.quiet && (SET.guideAll || s.id === 'hello' || s.id === 'end')) guide(s.guide);
    if (S.db && prev !== S.i) setMeta(s.id === 'quiz' ? { quiz: true, stage: s.id } : { stage: s.id });
  }
  const redraw = () => { killGlobe(); $('#task').innerHTML = R[cur().id](); bind(cur()); live(); };
  function spinName(el, names, done) { let n = 0; const iv = setInterval(() => { el.textContent = names[Math.floor(Math.random() * names.length)]; GT.tick(); if (++n > 18) { clearInterval(iv); done(); } }, 85); }
  function bind(s) {
    const kc = $('#kchip'); if (kc) kc.onclick = () => openAssess('now');
    $$('.mood').forEach((b) => b.onclick = () => { const k = b.dataset.i; S.mood[k] = (S.mood[k] || 0) + 1; b.querySelector('[data-c]').textContent = S.mood[k]; GT.tone(600 + k * 120, 0.15); });
    if (s.id === 'hw') bindHw();
    if (s.id === 'groups') {
      const gs = $('#goSet'); if (gs) gs.onclick = () => openSet('list');
      const dg = $('#doGroup'); if (dg) dg.onclick = () => { if (S.grouped) { S.grouped = false; redraw(); setTimeout(() => { S.grouped = true; reveal(); }, 80); } else { S.grouped = true; reveal(); dg.textContent = '🎲 Қайта көрсету'; } };
    }
    if (s.id === 'video') {
      const v = $('#tourV'); $('#vplay').onclick = () => { if (v) { v.play(); } };
      $('#vfull').onclick = () => { const el = v || $('#task iframe'); if (el && el.requestFullscreen) el.requestFullscreen(); };
      if (v) { v.onplay = () => { if (!T.run) tStart(); }; v.onerror = () => { v.outerHTML = '<div style="color:#fff;padding:40px;font-size:26px">Бейне файлы табылмады (media/globus-sayahat.mp4).</div>'; }; }
      $('#vdisc').onclick = () => full(`<h2>💬 Талқылау</h2>${['Қай ықпалдың дерегі сені ең қатты таңғалдырды? Неге?', 'Қай ықпалдар бір-бірімен байланысты? Мысал келтір.', 'Жетісайда қай ықпалдар байқалады?'].map((q, i) => `<div style="font-size:32px;font-weight:700;margin-top:18px;line-height:1.3"><b style="color:var(--amber)">${i + 1}.</b> ${esc(q)}</div>`).join('')}`);
    }
    if (s.id === 'speak') {
      const go = (i) => { S.spk = Math.max(0, Math.min(6, i)); MT.run = false; redraw(); };
      const timeUp = () => banner('🎤 1 минут өтті');
      $$('.spt').forEach((b) => b.onclick = () => go(+b.dataset.i));
      $('#spPrev').onclick = () => go(S.spk - 1);
      $('#spGo').onclick = () => miniStart(60, timeUp);
      const ok = $('#spOk'); if (ok) ok.onclick = () => { const p = spPerson(SPK[S.spk]); bScore(p, 'K2_0', 1); GT.chime(); ok.disabled = true; ok.textContent = '✓ +1 қойылды'; banner('🎤 ' + p.name + ': +1 ұпай (K2)'); };
      $('#spNext').onclick = () => { S.spkDone[S.spk] = 1; if (S.spk < 6) { go(S.spk + 1); miniStart(60, timeUp); } else { MT.run = false; banner('✓ 7 ықпал түсіндірілді · 📒 Хатшылар K2 (кластер) ұпайын қойсын', 5000); redraw(); } };
    }
    if (s.id === 'globe') bindDet();
    if (s.id === 'poster') {
      const gb = $('#galB'); if (gb) gb.onclick = () => { if (S.gal >= 2) { S.gal = -1; MT.run = false; banner('✓ Постерлер қорғалды · ұпай топтарға түсті', 5000); redraw(); return; } S.gal++; redraw(); miniStart(60, () => banner(`🖼️ ${grp(LD.posters[S.gal].g).name}: уақыт бітті`)); };
      const gg = $('#galGo'); if (gg) gg.onclick = () => miniStart(60, () => banner('🖼️ Уақыт бітті'));
      $$('.galT').forEach((b) => b.onclick = () => { S.gal = +b.dataset.i; MT.run = false; redraw(); });
      $$('.pcrit').forEach((b) => b.onclick = () => { const g = LD.posters[S.gal].g, i = +b.dataset.i; S.poster[g][i] = S.poster[g][i] ? 0 : 1; LS.set('ge_poster', S.poster); if (S.poster[g][i]) GT.chime(); MT.run = MT.run; const keep = MT.run; redraw(); if (keep) MT.run = true; });
    }
    if (s.id === 'quiz') { $('#qopen').onclick = () => setMeta({ quiz: true }); $('#qclose').onclick = () => setMeta({ quiz: false }); $('#qkey').onclick = () => { S.quizShow = !S.quizShow; redraw(); }; }
    if (s.id === 'end') { $$('.etab').forEach((b) => b.onclick = () => { S.endTab = b.dataset.t; redraw(); }); endBox(); }
  }

  /* ---------- үй тапсырмасы: ыстық орындық + глобус ---------- */
  function bindHw() {
    const q = LD.hot[S.hw.q];
    mountGlobe($('#glb'), { shift: 0.06 }).then((g) => { if (!g) return; g.pose(q.lat - 25, q.lon - 60, 46); LD.hot.forEach((h, i) => g.marker({ id: 'h' + i, lat: h.lat, lon: h.lon, label: h.place, color: i === S.hw.q ? '#E07A1F' : '#3FA4E8', size: 1.1 })); g.flyTo(q.lat, q.lon, q.d, 2600); });
    $$('.hq').forEach((b) => b.onclick = () => { S.hw.q = +b.dataset.i; S.hw.key = false; redraw(); });
    $('#ansB').onclick = () => { S.hw.key = true; $('#ans').style.display = 'block'; GT.chime(); };
    $('#spin').onclick = () => {
      const pool = S.roster.length ? S.roster : LD.groups.map((g, i) => ({ name: g.short + ' өкілі', g: i, anon: true }));
      spinName($('#pick'), pool.map((p) => p.name), () => { S.hw.pick = pool[Math.floor(Math.random() * pool.length)]; GT.melody(); redraw(); });
    };
    const ok = $('#okB'), no = $('#noB');
    if (ok) ok.onclick = () => { const p = S.hw.pick; if (!p || p.anon) return; bScore(p, 'K1_1', 1); GT.chime(); banner('✓ ' + p.name + ': +1 ұпай (K1)'); ok.disabled = true; };
    if (no) no.onclick = () => { const p = S.hw.pick; if (!p || p.anon) return; bScore(p, 'K1_1', 0); GT.tone(220, 0.3, 'triangle', 0.15); banner('✗ ' + p.name + ': сынып толықтырады'); no.disabled = true; };
  }

  /* ---------- Глобус-детектив ---------- */
  function detQueue() {
    if (S.roster.length) { const byG = LD.groups.map((_, gi) => S.roster.filter((p) => p.g === gi).map((p) => [Math.random(), p]).sort((a, b) => a[0] - b[0]).map((x) => x[1])); const q = []; for (let r = 0; byG.some((a) => a[r]); r++) byG.forEach((a) => { if (a[r]) q.push({ name: a[r].name, g: a[r].g }); }); return q; }
    const q = []; for (let r = 0; r < 5; r++) LD.groups.forEach((g, gi) => q.push({ name: g.short + ' өкілі', g: gi, anon: true })); return q;
  }
  const detSave = () => LS.set('ge_det', S.det);
  function detDraw() {
    const D = S.det, st = D.state || 'idle', c = D.cur, q = D.qi != null ? detQ() : null;
    const nx = D.queue ? D.queue.slice(D.pos + 1, D.pos + 4) : [];
    $('#dwho').innerHTML = `<div class="card" style="padding:14px 18px"><div style="font:800 14px var(--display);letter-spacing:2px;color:var(--mut)">${c ? 'ТАҚТАДА' : '🕵️ ГЛОБУС-ДЕТЕКТИВ'}</div><div id="dname" style="font:900 38px/1.1 var(--display);color:${c ? grp(c.g).ink : 'var(--ink)'}">${c ? esc(c.name) : '🎲 басыңыз'}</div>${c ? `<div style="font-weight:800;color:${grp(c.g).c}">${grp(c.g).icon} ${esc(grp(c.g).name)}</div>` : ''}
      ${nx.length ? `<div style="margin-top:8px;border-top:1px solid var(--line);padding-top:6px;font-size:16px;font-weight:800;color:var(--mut)">КЕЗЕКТЕ: ${nx.map((x) => `<span style="color:${grp(x.g).ink}">${esc(x.name)}</span>`).join(' · ')}</div>` : ''}</div>`;
    let tk = '';
    if (q && st === 'find') tk = `<div style="background:linear-gradient(180deg,#F7B24A,#E07A1F);color:#fff;border-radius:22px;padding:12px 26px;font:900 36px var(--display);box-shadow:0 12px 30px rgba(0,0,0,.35)">📍 1-қадам: Глобустан тап — «${esc(q.place)}»</div><div style="color:#FFD58A;font-size:19px;font-weight:800;margin-top:6px">Сүйреп айналдыр, дөңгелекпен үлкейт, сол жерді бас!</div>`;
    if (q && (st === 'factor' || st === 'done')) tk = `<div style="background:rgba(2,10,22,.85);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:22px;padding:14px 24px;box-shadow:0 12px 30px rgba(0,0,0,.35)"><div style="font:800 16px var(--display);letter-spacing:2px;color:#FFD58A">🔎 2-ҚАДАМ: БҰЛ ҚАЙ ЫҚПАЛ? · ${esc(q.place)}</div><div style="font-size:27px;font-weight:800;line-height:1.3;margin-top:6px">${esc(q.clue)}</div></div>`;
    $('#dtask').innerHTML = tk;
    const ops = $('#dopts'); if (st === 'factor' || st === 'done') { ops.style.display = 'grid'; ops.innerHTML = F.map((f, i) => `<button class="fopt ${st === 'done' && i === q.f ? 'ok' : st === 'done' && i === D.ans && i !== q.f ? 'no' : ''}" data-i="${i}" ${st === 'done' ? 'disabled' : ''}><i>${f.ic}</i>${esc(f.short)}</button>`).join(''); $$('.fopt', ops).forEach((b) => b.onclick = () => detFactor(+b.dataset.i)); } else ops.style.display = 'none';
    $('#dstars').innerHTML = LD.groups.map((g, i) => `<div style="background:${g.c};color:#fff;border-radius:16px;padding:8px 14px;font:800 20px var(--display);display:flex;justify-content:space-between;gap:14px;min-width:170px">${g.icon} ${g.short}<span>⭐ ${D.stars[i] || 0}</span></div>`).join('');
  }
  function detRes(ok, big, small) {
    const r = $('#dres'); if (!r) return; r.innerHTML = `<div style="font-size:70px;line-height:1">${ok ? '✅' : '❌'}</div><div style="font:900 38px var(--display);color:${ok ? '#1E9A5A' : '#D2452F'}">${big}</div>${small ? `<div style="font-size:23px;font-weight:700;margin-top:6px">${small}</div>` : ''}`;
    r.style.opacity = 1; r.style.transform = 'translate(-50%,-50%) scale(1)'; clearTimeout(r._t); r._t = setTimeout(() => { r.style.opacity = 0; r.style.transform = 'translate(-50%,-50%) scale(.6)'; }, 2600);
  }
  function confetti() { const c = $('#dconf'); if (!c) return; const cols = ['#43B36B', '#3FA4E8', '#F2A541', '#F7B24A', '#E07A1F', '#7BE0A6']; c.innerHTML = [...Array(80)].map((_, i) => `<i style="position:absolute;left:${Math.random() * 100}%;top:-20px;width:${8 + Math.random() * 10}px;height:${10 + Math.random() * 14}px;background:${cols[i % 6]};border-radius:3px;transform:rotate(${Math.random() * 360}deg);transition:transform 2.2s cubic-bezier(.2,.6,.3,1),top 2.2s cubic-bezier(.2,.6,.3,1),opacity 2.2s;opacity:1"></i>`).join(''); requestAnimationFrame(() => requestAnimationFrame(() => $$('i', c).forEach((p) => { p.style.top = (60 + Math.random() * 50) + '%'; p.style.transform = `translateX(${(Math.random() - 0.5) * 300}px) rotate(${Math.random() * 900}deg)`; p.style.opacity = 0; }))); }
  function detLog(step, ok) { const D = S.det, c = D.cur; let e = D.log.find((x) => x.turn === D.turn); if (!e) { e = { turn: D.turn, name: c.name, g: c.g, anon: !!c.anon, place: detQ().place, a: null, b: null }; D.log.push(e); } e[step] = ok ? 1 : 0; if (!c.anon) bScore(c, step === 'a' ? 'K3_0' : 'K3_1', ok ? 1 : 0); if (ok) D.stars[c.g] = (D.stars[c.g] || 0) + 1; detSave(); }
  function detPick(lat, lon) {
    const D = S.det; if (D.state !== 'find' || !GL) return; const q = detQ(), d = GLmod.dist([lat, lon], [q.lat, q.lon]), ok = d <= q.r;
    GL.marker({ id: 'tap', lat, lon, color: ok ? '#43B36B' : '#D2452F', size: 0.9 });
    GL.marker({ id: 'goal', lat: q.lat, lon: q.lon, label: q.place, color: '#F7B24A', size: 1.3 }); GL.flyTo(q.lat, q.lon, 22, 1400);
    detLog('a', ok); if (ok) { GT.chime(); confetti(); detRes(true, 'Таптың! +1', esc(q.place)); } else { GT.tone(180, 0.35, 'sawtooth', 0.15); detRes(false, 'Қате жер', 'Дұрысы — сары нүкте · ' + Math.round(d * 111) + ' км қашық'); }
    D.state = 'factor'; detDraw(); live();
  }
  function detFactor(i) {
    const D = S.det; if (D.state !== 'factor') return; const q = detQ(), ok = i === q.f; D.ans = i; MT.run = false;
    detLog('b', ok); if (ok) { GT.melody(); confetti(); detRes(true, 'Дұрыс! +1', F[q.f].ic + ' ' + esc(F[q.f].short)); } else { GT.tone(180, 0.35, 'sawtooth', 0.15); detRes(false, 'Қате', 'Дұрысы: ' + F[q.f].ic + ' ' + esc(F[q.f].short)); }
    D.state = 'done'; detDraw(); live();
  }
  function detNext() {
    const D = S.det; if (!D.queue || D.pos >= D.queue.length - 1) { D.queue = detQueue(); D.pos = -1; }
    D.state = 'spin'; D.cur = null; detDraw(); if (GL) { GL.removeMarker('tap'); GL.removeMarker('goal'); }
    const names = D.queue.map((x) => x.name);
    spinName($('#dname'), names, () => {
      D.pos++; D.cur = D.queue[D.pos]; D.turn = (D.turn || 0) + 1; D.qi = (D.turn - 1) % LD.detective.length; D.state = 'find'; D.ans = null; GT.melody(); detSave(); detDraw();
      if (GL) GL.flyTo(25, ((D.turn * 97) % 360) - 180, 40, 1800);
      const nm = $('#dname'); if (nm) { nm.style.transition = 'none'; nm.style.transform = 'scale(1.4)'; requestAnimationFrame(() => { nm.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'; nm.style.transform = 'none'; }); }
      miniStart(LD.detectiveTime, () => { const D2 = S.det; if (D2.state === 'find') { detLog('a', false); const q = detQ(); GL && GL.marker({ id: 'goal', lat: q.lat, lon: q.lon, label: q.place, color: '#F7B24A', size: 1.3 }); GL && GL.flyTo(q.lat, q.lon, 22, 1400); detRes(false, 'Уақыт бітті', 'Міне, осы жерде'); D2.state = 'factor'; detDraw(); live(); } else if (D2.state === 'factor') { detLog('b', false); D2.state = 'done'; detRes(false, 'Уақыт бітті', 'Дұрысы: ' + F[detQ().f].short); detDraw(); live(); } });
    });
  }
  function bindDet() {
    const D = S.det; if (!D.queue) { D.queue = detQueue(); D.pos = -1; } if (D.state === 'spin' || D.state === 'find' || D.state === 'factor') D.state = 'idle';
    if (D.state === 'idle') D.cur = null; detDraw();
    mountGlobe($('#glb'), { shift: 0.04, onPick: detPick, spin: 0 }).then((g) => { if (!g) return; g.labelsOn(true); g.pose(28, 50, 42); });
    $('#dnext').onclick = detNext;
    $('#dskip').onclick = () => { MT.run = false; S.det.state = 'idle'; detNext(); };
    $('#dlog').onclick = openDetLog;
  }
  function openDetLog() {
    const L = S.det.log, st = S.det.stars, mx = Math.max(1, ...st);
    full(`<h2>🕵️ «Глобус-детектив» — нәтиже</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:10px 0 16px">${LD.groups.map((g, i) => `<div style="background:${g.soft};border-radius:20px;padding:14px 18px"><b style="color:${g.ink};font:800 22px var(--display)">${g.icon} ${esc(g.name)}</b><div style="display:flex;align-items:center;gap:10px;margin-top:8px"><div class="bar" style="height:20px"><i style="width:${(st[i] || 0) / mx * 100}%;background:${g.c}"></i></div><b style="font:900 40px var(--display)">⭐ ${st[i] || 0}</b></div></div>`).join('')}</div>
      <table class="t" style="font-size:21px"><thead><tr><th>#</th><th>Оқушы</th><th>Тапсырма</th><th style="text-align:center">📍 Орын</th><th style="text-align:center">🔎 Ықпал</th><th style="text-align:center">Ұпай</th></tr></thead><tbody>${L.map((e, i) => `<tr><td>${i + 1}</td><td>${e.g != null ? grp(e.g).icon : ''} ${esc(e.name)}</td><td>${esc(e.place)}</td><td style="text-align:center;font-size:26px">${e.a == null ? '·' : e.a ? '✅' : '❌'}</td><td style="text-align:center;font-size:26px">${e.b == null ? '·' : e.b ? '✅' : '❌'}</td><td style="text-align:center"><b>${(e.a || 0) + (e.b || 0)}</b></td></tr>`).join('') || '<tr><td colspan="6" class="mut">Әзірге ойын болмады</td></tr>'}</tbody></table>
      <button class="btn sec" id="detReset" style="margin-top:14px">🔄 Ойынды басынан бастау</button>`, 'detlog');
    GT.melody(); $('#detReset').onclick = () => { if (!confirm('Ойын нәтижесі өшеді (K3 ұпайлары қалады). Жалғастырасыз ба?')) return; S.det = { pos: -1, queue: null, log: [], stars: [0, 0, 0] }; detSave(); closeOV(); redraw(); };
  }
  function reveal() { requestAnimationFrame(() => requestAnimationFrame(() => $$('.mem').forEach((m) => { m.style.opacity = 1; m.style.transform = 'none'; }))); GT.melody(); }

  /* ---------- live ---------- */
  function live() {
    const rows = rating(), tot = groupTotals(rows), g = S.game || {}, meta = g.meta || {};
    $('#ribbon').innerHTML = LD.groups.map((x, i) => `<span style="background:linear-gradient(180deg,${x.c},${x.c2})" title="${esc(x.name)} — ұпай">${x.icon} ${x.short}<b>${tot[i]}</b></span>`).join('');
    const s = cur();
    if (s.id === 'quiz' && $('#qlive')) {
      const players = g.players || {}, ans = g.answers || {}, ids = Object.keys(players);
      $('#qstat').textContent = (meta.quiz ? '🟢 ашық' : '⚪ жабық') + ' · ' + ids.length + ' оқушы';
      $('#qlive').innerHTML = LD.quiz.map((q, i) => { const a = ans[i] || {}, n = Object.keys(a).length, c = Object.values(a).filter((x) => GT.isRight(q, x.v)).length, p = n ? Math.round(c * 100 / n) : 0;
        const key = q.t === 'mc' ? q.o[q.a] : q.t === 'tf' ? (q.a ? 'Дұрыс' : 'Бұрыс') : q.t === 'num' ? String(q.a).replace('.', ',') + ' ' + (q.unit || '') : q.a.map((k) => q.o[k].split(' ').slice(0, 3).join(' ')).join(' → ');
        return `<div style="background:#F6F1E6;border-radius:14px;padding:8px 12px;font-size:16px;font-weight:700;line-height:1.25;display:flex;flex-direction:column;gap:4px;min-width:0"><div style="display:flex;gap:8px"><b style="flex:none;width:28px;height:28px;border-radius:50%;background:var(--deep);color:#F7B24A;display:flex;align-items:center;justify-content:center;font:800 14px var(--display)">${i + 1}</b><span style="overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${esc(q.q)}</span></div>
          <div style="color:#1E9A5A;font-weight:900;visibility:${S.quizShow ? 'visible' : 'hidden'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">✓ ${esc(key)}</div><div style="display:flex;align-items:center;gap:8px"><div class="bar" style="height:12px"><i style="width:${p}%;background:${p >= 65 ? '#1E9A5A' : p >= 40 ? '#F2A541' : '#D2452F'}"></i></div><b style="width:110px;text-align:right">${c}/${n} · ${p}%</b></div></div>`; }).join('');
      const rs = ids.map((u) => { let c = 0; LD.quiz.forEach((q, i) => { const a = ans[i] && ans[i][u]; if (a && GT.isRight(q, a.v)) c++; }); return { name: players[u].name, g: players[u].g, c }; }).sort((a, b) => b.c - a.c).slice(0, 5);
      $('#qtop').innerHTML = rs.map((r, i) => `<div style="display:flex;gap:8px;font-size:18px;font-weight:800;padding:3px 0"><span>${['🥇', '🥈', '🥉', '4', '5'][i]}</span><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${grp(r.g).icon} ${esc(r.name)}</span><b>${r.c}/${LD.quiz.length}</b></div>`).join('');
    }
    if (s.id === 'end') endBox();
    const conn = S.db ? (S.db.demo ? '🟡 офлайн' : '🟢 ' + S.code) : '⏳ қосылуда';
    $('#sub').textContent = `${LD.lesson.subject} · ${LD.lesson.grade}${LD.lesson.section ? ' · ' + LD.lesson.section : ''} · ${conn}`;
    if (OV.kind === 'rate') renderRate();
  }
  function setMeta(o) { if (!S.db) return; S.db.update('games/' + S.code + '/meta', o).catch((e) => banner('⚠️ Байланыс: ' + (e.code || e.message), 5000)); }

  /* ---------- оверлейлер ---------- */
  const OV = { kind: '', tab: '' };
  const ov = $('#ov');
  function closeOV() { ov.classList.remove('on'); ov.innerHTML = ''; OV.kind = ''; }
  ov.onclick = (e) => { if (e.target === ov || e.target.classList.contains('x')) closeOV(); };
  function full(html, kind) { OV.kind = kind || 'full'; ov.innerHTML = `<div class="full"><button class="x">✕</button>${html}</div>`; ov.classList.add('on'); }
  function drawer(html, kind) { OV.kind = kind; ov.innerHTML = `<div class="drawer"><button class="x">✕</button>${html}</div>`; ov.classList.add('on'); }

  function openScript() {
    const s = cur();
    drawer(`<h2>💬 Мұғалім сөзі · ${S.i + 1}-экран</h2><div class="mut" style="font-size:19px;font-weight:700">${esc(s.title)} · ${s.min} мин · әдіс: ${esc(s.method.name)}</div>
      <div style="background:#FFF4E2;border-radius:18px;padding:16px 18px;margin-top:14px;font-size:24px;font-weight:700;line-height:1.45">${esc(s.T)}</div>
      <h3 style="margin:18px 0 6px">🧑‍🎓 Оқушылар не істейді</h3><div style="font-size:21px">${esc(s.S)}</div>
      <h3 style="margin:18px 0 6px">🗣 Оқушының сөйлеу үлгісі</h3>${(LD.say[s.id] || []).map((x) => `<div style="font-size:20px;margin-top:4px">• ${esc(x)}</div>`).join('')}
      ${s.k ? `<h3 style="margin:18px 0 6px">📋 Бағалау</h3><div style="font-size:20px"><b>${s.k}</b> · ${esc(task(s.k).title)} — ${task(s.k).d.map((d) => esc(d.t) + ' (' + ({ sec: '📒 хатшы', board: '🖥 тақта', auto: '⚙️ автоматты', group: '🖥 бүкіл топқа', quiz: '📱 квиз' }[d.by]) + ')').join('; ')}</div>` : ''}
      <h3 style="margin:22px 0 8px">🗺 Сабақ жоспары</h3>${ST.map((x, k) => `<div class="pl" data-k="${k}" style="display:flex;gap:10px;padding:8px 10px;border-radius:12px;cursor:pointer;font-size:19px;${k === S.i ? 'background:#FFF1DA;font-weight:800' : ''}"><span style="width:34px">${x.ic}</span><span style="flex:1">${k + 1}. ${esc(x.title)}</span><span class="mut">${x.min} мин</span></div>`).join('')}`, 'script');
    $$('.pl').forEach((p) => p.onclick = () => { closeOV(); show(+p.dataset.k); });
  }
  function openAssess(tab) { OV.tab = tab || (OV.kind === 'assess' ? OV.tab : 'now'); drawer('', 'assess'); renderAssess(); }
  const BY = { sec: '📒 хатшы', board: '🖥 тақта', auto: '⚙️ авто', group: '🖥 топқа', quiz: '📱 квиз' };
  function descTable(t) { return `<table class="t" style="font-size:19px;margin-top:10px"><thead><tr><th>${t.k} · ${esc(t.kind)}: ${esc(t.title)}</th><th style="width:110px">Кім</th><th style="width:70px">Ұпай</th></tr></thead><tbody>${t.d.map((d) => `<tr><td>${esc(d.t)}</td><td style="font-size:16px">${BY[d.by]}</td><td style="text-align:center;font-weight:900">${d.p}</td></tr>`).join('')}</tbody></table>`; }
  function renderAssess() {
    const dr = $('.drawer'); if (!dr) return; const s = cur();
    let h = `<button class="x">✕</button><h2>📋 Бағалау</h2><div class="tabs">${[['now', 'Осы экран'], ['all', 'Критерийлер мен дескрипторлар'], ['res', 'Нәтижелер']].map(([k, t]) => `<button data-t="${k}" class="${OV.tab === k ? 'on' : ''}">${t}</button>`).join('')}</div>`;
    if (OV.tab === 'now') h += s.k ? descTable(task(s.k)) : `<div style="font-size:22px">Бұл экранда ұпай қойылмайды — ауызша мадақтау: «Жарайсың!», «Дәлелің нақты!»</div>`;
    if (OV.tab === 'all') h += `<div style="font-size:19px;margin-bottom:6px"><b>Оқу мақсаты:</b> ${esc(LD.lesson.objective)}<br><b>Бағалау критерийі:</b> ${esc(LD.lesson.criterion)}</div>${LD.tasks.map(descTable).join('')}<div style="margin-top:14px;font-size:20px;background:#FFF4E2;border-radius:14px;padding:12px 16px">Барлығы ${LD.MAX} ұпай → пайыз → 10 балл: <b>85–100%</b> → 9–10 балл · <b>65–84%</b> → 7–8 балл · <b>0–64%</b> → 1–6 балл</div>`;
    if (OV.tab === 'res') { const rows = rating(); h += `<div class="mut" style="font-size:17px;margin-bottom:8px">Сұр сан — жүйе/хатшы ұпайы. Ұяшыққа сан жазсаңыз — мұғалімнің түзетуі (басым).</div><table class="t" style="font-size:17px"><thead><tr><th style="padding:8px">Оқушы</th>${LD.tasks.map((t) => `<th style="padding:8px 4px;text-align:center">${t.k}<br><small>${kMax(t.k)}</small></th>`).join('')}<th style="padding:8px">%</th><th style="padding:8px">Балл</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td style="padding:6px 8px">${r.g != null ? grp(r.g).icon : ''} ${esc(r.name)}</td>${LD.tasks.map((t) => `<td style="padding:3px"><input data-key="${esc(r.key)}" data-k="${t.k}" value="${S.manual[r.key] && S.manual[r.key][t.k] != null ? S.manual[r.key][t.k] : ''}" placeholder="${r.byK[t.k]}" style="width:46px;font-size:18px;text-align:center;border:2px solid #E6EDE8;border-radius:8px;padding:4px"></td>`).join('')}<td style="padding:4px 8px"><b>${r.pct}%</b></td><td style="padding:4px 8px"><b>${r.b}</b></td></tr>`).join('') || '<tr><td colspan="9" class="mut">Тізім бос — ⚙️ баптауда енгізіңіз</td></tr>'}</tbody></table>
      <button class="btn sec" id="csv" style="margin-top:12px">⬇️ Excel (CSV)</button>`; }
    dr.innerHTML = h;
    $$('.tabs button', dr).forEach((b) => b.onclick = () => { OV.tab = b.dataset.t; renderAssess(); });
    $$('input[data-k]', dr).forEach((inp) => inp.onchange = () => { const k = inp.dataset.key; S.manual[k] = S.manual[k] || {}; S.manual[k][inp.dataset.k] = inp.value === '' ? null : Math.min(kMax(inp.dataset.k), Math.max(0, +inp.value)); LS.set('ge_manual', S.manual); live(); });
    const c = $('#csv'); if (c) c.onclick = csv;
  }
  function csv() { const rows = rating(); const lines = [['#', 'Оқушы', 'Топ', ...LD.tasks.map((t) => t.k), 'Ұпай', '%', 'Балл', 'Деңгей'].join(';')].concat(rows.map((x, i) => [i + 1, x.name, x.g != null ? grp(x.g).name : '', ...LD.tasks.map((t) => x.byK[t.k]), x.total + '/' + LD.MAX, x.pct, x.b, x.band].join(';'))); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })); a.download = 'geoekologiya-reyting.csv'; a.click(); }
  function openRate() { full('', 'rate'); renderRate(); }
  function renderRate() {
    const f = $('.full'); if (!f) return; const rows = rating(), tot = groupTotals(rows), mx = Math.max(1, ...tot);
    const place = LD.groups.map((_, i) => i).sort((a, b) => tot[b] - tot[a]);
    f.innerHTML = `<button class="x">✕</button><h2>🏅 Рейтинг · ${S.i + 1}-экраннан кейін</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:10px 0 18px">${LD.groups.map((x, i) => `<div style="background:${x.soft};border-radius:20px;padding:14px 18px"><b style="color:${x.ink};font:800 22px var(--display)">${['🥇', '🥈', '🥉'][place.indexOf(i)]} ${x.icon} ${esc(x.name)}</b><div style="display:flex;align-items:center;gap:10px;margin-top:8px"><div class="bar" style="height:20px"><i style="width:${tot[i] / mx * 100}%;background:${x.c}"></i></div><b style="font:900 40px var(--display)">${tot[i]}</b></div></div>`).join('')}</div>
      <table class="t" style="font-size:20px"><thead><tr><th>#</th><th>Оқушы</th>${LD.tasks.map((t) => `<th style="text-align:center">${t.k}</th>`).join('')}<th>Ұпай</th><th>%</th><th>Балл</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i < 3 && r.total ? ['🥇', '🥈', '🥉'][i] : i + 1}</td><td>${r.g != null ? grp(r.g).icon : ''} ${esc(r.name)}</td>${LD.tasks.map((t) => `<td style="text-align:center">${r.byK[t.k] || '·'}</td>`).join('')}<td><b>${r.total}/${LD.MAX}</b></td><td>${r.pct}%</td><td><b style="font:900 26px var(--display)">${r.b}</b> <span class="mut" style="font-size:16px">${r.band}</span></td></tr>`).join('') || '<tr><td colspan="10" class="mut">Әзірге ұпай жоқ</td></tr>'}</tbody></table>`;
  }
  function openSet(tab) { OV.tab = tab || 'list'; full('', 'set'); renderSet(); }
  function renderSet() {
    const f = $('.full'); if (!f) return; const tab = OV.tab;
    let h = `<button class="x">✕</button><h2>⚙️ Баптау</h2><div class="tabs">${[['list', '👥 Тізім және топтар'], ['links', '🔗 QR · Firebase'], ['docs', '📁 Құжаттар'], ['opt', '🎛 Параметрлер']].map(([k, t]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${t}</button>`).join('')}<a class="btn sec" href="materialdar.html" target="_blank" style="text-decoration:none;font-size:18px;padding:10px 16px">📁 Материалдар</a></div>`;
    if (tab === 'list') h += `<div style="display:grid;grid-template-columns:.8fr 1.2fr;gap:24px;font-size:20px"><div><div class="mut" style="margin-bottom:8px">Әр жолға: <b>Аты-жөні - A/B/C</b> (A — озат, B — екпінді, C — қанағат). Топты өзіңіз бөлсеңіз — соңына топ нөмірін жазыңыз: <b>Ұлжан - 1</b> немесе <b>Ұлжан - A - 1</b>, сосын «⚖️» басыңыз. Тізім тек осы құрылғыда сақталады — бір рет енгізсеңіз жетеді.</div><textarea id="rost" style="width:100%;height:420px;font-size:20px;border:2px solid #E6EDE8;border-radius:16px;padding:12px;font-family:inherit" placeholder="Ұлжан - 1&#10;Аяна - 2&#10;Қарақат - A - 3">${esc(S.roster.map((p) => p.name + ' - ' + p.l + ' - ' + (p.g + 1)).join('\n'))}</textarea>
      <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap"><button class="btn" id="bal">⚖️ Топтарға бөлу</button><button class="btn sec" id="rebal">🔀 Араластыру</button></div></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;align-content:start">${LD.groups.map((g, gi) => { const m = S.roster.filter((p) => p.g === gi); return `<div style="border-radius:18px;padding:12px 14px;background:${g.soft};border:3px solid ${g.c}"><b style="color:${g.ink}">${g.icon} ${esc(g.name)}</b><div class="mut">${m.length} оқушы · Σ ${GT.groupSum(m)}</div>${m.map((p) => `<div style="display:flex;justify-content:space-between;margin-top:6px"><span>${esc(p.name)} <span class="lv lv${p.l}">${p.l}</span></span><span>${p.role ? role(p.role).icon : ''}</span></div>`).join('')}</div>`; }).join('')}</div></div>`;
    if (tab === 'links') h += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:center;font-size:18px">${[['quiz.html', '📱 Оқушылар: топ, квиз, кері байланыс', ''], ['hatshy.html', '📒 Хатшылар (әр топқа 1 телефон)', ''], ['quiz.html', '👩‍🏫 Қонақ мұғалімдер: пікір', '&guest=1']].map(([fl, t, ex]) => `<div style="background:#fff;border-radius:20px;padding:14px"><b>${t}</b><div class="qrbox" style="width:230px;height:230px;margin:10px auto">${GT.qr(link(fl, ex), 230)}</div><div class="mut" style="word-break:break-all;font-size:14px">${esc(link(fl, ex))}</div></div>`).join('')}
      <div style="background:#fff;border-radius:20px;padding:14px"><b>Сабақ коды</b><div style="font:900 48px var(--display);margin:10px 0">${esc(S.code)}</div><div class="mut">${S.db ? (S.db.demo ? 'Офлайн: телефондар қосылмайды — ұпайды 📋 «Нәтижелер»-ге енгізіңіз' : 'Firebase ✓ байланыс бар') : '…'}</div><button class="btn sec" id="newc" style="margin-top:12px">🆕 Жаңа сабақ (ұпайлар нөлденеді)</button></div></div>`;
    if (tab === 'docs') h += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${[['📘', 'ҚМЖ (қысқа мерзімді жоспар)', 'materialdar/1-QMZh-Antropogendik-faktorlar', 'pdf docx'], ['🖥', 'Презентация', 'materialdar/2-Prezentaciya-Antropogendik-faktorlar', 'pdf pptx'], ['📄', 'Жұмыс парақтары', 'materialdar/3-Zhumys-paraqtary', 'pdf docx'], ['🏷', 'Наклейкалар мен медальдар', 'materialdar/4-Naklejkalar', 'pdf'], ['🖼', 'Постер-инфографикалар', 'materialdar/5-Poster-infografikalar', 'pdf'], ['🎤', 'Спикер карточкалары', 'materialdar/7-Spiker-kartochkalary', 'pdf']].map(([ic, t, f, ex]) => `<div style="background:#fff;border-radius:20px;padding:16px 18px;border:1px solid var(--line)"><div style="font-size:40px">${ic}</div><b style="font:800 21px var(--display)">${t}</b><div style="display:flex;gap:8px;margin-top:10px">${ex.split(' ').map((x) => `<a class="btn sec" style="text-decoration:none;padding:8px 14px;font-size:16px" href="${f}.${x}" target="_blank">${x.toUpperCase()}</a>`).join('')}</div></div>`).join('')}</div>
      <div style="margin-top:16px;font-size:19px;font-weight:700" class="mut">Критерийлер мен дескрипторлар — 📋 «Бағалау» панелінде · Мұғалім сөзі мен сабақ жоспары — 💬 панелінде · Барлық материал — <a href="materialdar.html" target="_blank">materialdar.html</a></div>`;
    if (tab === 'opt') h += `<div style="font-size:22px;display:flex;flex-direction:column;gap:16px;max-width:1100px">
      <label><input type="checkbox" id="oAuto" ${SET.autoTimer ? 'checked' : ''}> Экранға өткенде таймер өздігінен қосылсын</label>
      <label><input type="checkbox" id="oGuide" ${SET.guideAll ? 'checked' : ''}> Гид әр экранда сөйлесін (әйтпесе тек басы мен соңында)</label>
      <div><b>🎬 Басқа бейне</b> (қаласаңыз: YouTube сілтемесі немесе .mp4). Бос қалса — «Глобус-саяхат» бейнесі көрсетіледі.<br><input type="text" id="oVideo" value="${esc(SET.videoUrl)}" placeholder="https://youtu.be/..." style="width:100%;font-size:20px;padding:12px;border-radius:12px;border:2px solid #E6EDE8;margin-top:8px"></div>
      <div><button class="btn sec" id="oReset">🧹 Тақтадағы ұпайларды тазалау (тізім сақталады)</button></div>
      <div class="mut" style="font-size:19px">Пернелер: ← → экран · Space таймер · M мұғалім сөзі · B бағалау · R рейтинг · T баптау · Esc жабу</div></div>`;
    f.innerHTML = h;
    $$('.tabs button', f).forEach((b) => b.onclick = () => { OV.tab = b.dataset.t; renderSet(); });
    if (tab === 'list') { const doBal = (sh) => { let list = GT.parseRoster($('#rost').value); if (!list.length) return banner('Тізім бос'); if (sh) list = list.map((p) => [Math.random(), p]).sort((a, b) => a[0] - b[0]).map((x) => x[1]); const out = []; const fixed = list.length && list.every((p) => p.fixG != null && p.fixG < LD.groups.length); const parts = fixed && !sh ? LD.groups.map((_, gi) => list.filter((p) => p.fixG === gi)) : GT.balance(list, LD.groups.length); if (fixed && !sh) banner('📌 Топтар тізімдегі нөмір бойынша сақталды'); parts.forEach((m, gi) => GT.assignRoles(m).forEach((p) => out.push(Object.assign(p, { g: gi })))); S.roster = out; LS.set('ge_roster', out); S.grouped = false; S.det.queue = null; detSave(); pushRoster(); renderSet(); if (['groups', 'speak'].includes(cur().id)) redraw(); live(); }; $('#bal').onclick = () => doBal(false); $('#rebal').onclick = () => doBal(true); }
    if (tab === 'links') $('#newc').onclick = async () => { if (!confirm('Жаңа код жасалады, ағымдағы ұпайлар көрінбейді. Жалғастырасыз ба?')) return; LS.set('ge_code', ''); S.bsc = {}; S.poster = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; S.det = { pos: -1, queue: null, log: [], stars: [0, 0, 0] }; S.manual = {}; ['ge_bsc', 'ge_poster', 'ge_det', 'ge_manual'].forEach((k) => LS.set(k, k === 'ge_poster' ? S.poster : k === 'ge_det' ? S.det : {})); await connect(true); renderSet(); live(); };
    if (tab === 'opt') { const sv = () => LS.set('ge_set', SET); $('#oAuto').onchange = (e) => { SET.autoTimer = e.target.checked; sv(); }; $('#oGuide').onchange = (e) => { SET.guideAll = e.target.checked; sv(); }; $('#oVideo').onchange = (e) => { SET.videoUrl = e.target.value.trim(); sv(); if (cur().id === 'video') redraw(); };
      $('#oReset').onclick = () => { if (!confirm('Тақтадағы ұпайлар (K1, K2, K3, K4) өшеді. Жалғастырасыз ба?')) return; S.bsc = {}; S.poster = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; S.det = { pos: -1, queue: null, log: [], stars: [0, 0, 0] }; LS.set('ge_bsc', {}); LS.set('ge_poster', S.poster); detSave(); live(); banner('🧹 Тазаланды'); }; }
  }
  function pushRoster() { if (S.db && S.code) setMeta({ roster: S.roster.map((p) => ({ name: p.name, g: p.g, role: p.role || '' })) }); }

  /* ---------- Firebase ---------- */
  let unsub = null;
  async function connect(fresh) {
    if (!S.db) S.db = await GT.backend();
    const db = S.db; let code = fresh ? '' : LS.get('ge_code', '');
    for (let t = 0; t < 5; t++) {
      if (!code) code = GT.PREFIX + String(Math.floor(1000 + Math.random() * 9000));
      let meta = null; try { meta = await db.get('games/' + code + '/meta'); } catch (e) {}
      if (!meta) { try { await db.update('games/' + code + '/meta', { host: db.uid, created: db.TS, lesson: 'geoekologiya-10' }); break; } catch (e) { code = ''; continue; } }
      if (meta.host === db.uid) break; code = '';
    }
    S.code = code; LS.set('ge_code', code);
    if (unsub) unsub(); unsub = db.on('games/' + code, (v) => { S.game = v || {}; live(); });
    pushRoster(); setMeta({ stage: cur().id });
    if (['groups', 'quiz', 'end'].includes(cur().id)) redraw();
  }

  /* ---------- басқару ---------- */
  $('#bn').onclick = () => show(S.i + 1); $('#bp').onclick = () => show(S.i - 1);
  $('#prog').onclick = (e) => { const i = e.target.closest('i'); if (i) show(+i.dataset.k); };
  $('#bScript').onclick = openScript; $('#bAssess').onclick = () => openAssess(); $('#bRate').onclick = openRate; $('#bSet').onclick = () => openSet(); $('#bMat').onclick = () => window.open('materialdar.html', '_blank');
  addEventListener('keydown', (e) => {
    if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') return closeOV();
    if (OV.kind) { if (['m', 'b', 'r', 't', 'ь', 'и', 'к', 'е'].includes(k)) closeOV(); return; }
    if (k === 'arrowright' || k === 'pagedown') show(S.i + 1); else if (k === 'arrowleft' || k === 'pageup') show(S.i - 1);
    else if (k === ' ') { e.preventDefault(); tToggle(); } else if (k === 'm' || k === 'ь') openScript(); else if (k === 'b' || k === 'и') openAssess(); else if (k === 'r' || k === 'к') openRate(); else if (k === 't' || k === 'е') openSet();
  });
  const route = () => { const m = location.hash.match(/^#s(\d+)/); if (m) show(+m[1] - 1); if (location.hash === '#teacher') openSet(); };
  addEventListener('hashchange', route);
  show(S.i, { noAuto: true, force: true }); route();
  connect().catch((e) => { console.error(e); });
  window.GEAPP = { S, show, openRate, openAssess, openSet, openScript, rating, detPick, detFactor, detNext };
})();
