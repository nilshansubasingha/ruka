/* RUKA UI pages + router (depends on app-core.js) */
const NAV = [['home', 'home'], ['ask', 'chat'], ['situation', 'check_list'], ['deadlines', 'calendar'], ['documents', 'file']];
const navLabel = (r, short) => tt(short && r !== 'home' ? `ui.nav.s.${r}` : `ui.nav.${r}`);
let phTimer;
const go = (route) => { if (location.hash !== '#/' + route) location.hash = '#/' + route; else render(); window.scrollTo(0, 0); };
const Q_TOPICS = { deadlines: 'ui.p.dead', ranking: 'ui.p.rank', accommodation: 'ui.p.acc', isee: 'ui.p.isee', cfu: 'ui.p.cfu', merit: 'ui.p.cfu', payment: 'ui.p.pay', international: 'ui.p.intl', documents: 'sug.docs', enrollment: 'ui.p.enrol', eligibility: 'ui.p.sch', scholarship: 'ui.p.sch', suspended: 'sug.rank', parificato: 'ui.p.isee', updates: 'sug.next', income: 'ui.p.isee', lodging: 'ui.p.acc', student_type: 'ui.p.acc', polito: 'ui.p.enrol', transfer: 'sug.next' };
const askFor = (tag) => tt(Q_TOPICS[tag] || 'sug.next');

/* ── shell ── */
function shell() {
  const frag = document.createDocumentFragment(), cur = state.route;
  const langsw = h('div', { class: 'langsw', role: 'group', 'aria-label': tt('ui.prof.lang') }, LANGS.map((l) => h('button', { 'aria-pressed': String(state.lang === l), title: l === 'si' ? tt('ui.si_draft') : LANG_NAMES[l], onclick: () => { state.lang = l; LS.set('lang', l); render(); } }, l.toUpperCase())));
  const unread = notifItems().length;
  const rail = h('nav', { class: 'rail', 'aria-label': 'Main' }, h('button', { class: 'logo', onclick: () => go('home'), 'aria-label': 'RUKA' }, h('span', { class: 'logo-mark' }, logoMark()), h('span', { class: 'logo-word' }, 'ruka'), h('span', { class: 'pill' }, tt('ui.beta'))),
    NAV.map(([r, i]) => h('button', { class: 'nav', 'aria-current': cur === r ? 'page' : null, onclick: () => go(r) }, ic(i, 20), tt('ui.nav.' + r))),
    h('div', { class: 'beta' }, h('b', null, tt('ui.supports')), h('div', null, 'EDISU Piemonte'), h('div', null, 'Politecnico di Torino'), h('div', { class: 'muted', style: 'margin-top:6px' }, `${tt('ui.soon')}: UniTo`)));
  const top = h('header', { class: 'top' }, h('div', { class: 'top-in' }, h('button', { class: 'logo', onclick: () => go('home'), 'aria-label': 'RUKA' }, h('span', { class: 'logo-mark' }, logoMark()), h('span', { class: 'logo-word' }, 'ruka'), h('span', { class: 'pill' }, tt('ui.beta'))), h('div', { class: 'grow' }),
    h('button', { class: 'ib hide-s', 'aria-label': tt('ui.search.btn'), onclick: openSearch }, ic('search')), state.user && h('button', { class: 'ib', 'aria-label': tt('ui.bell'), onclick: openNotifs }, ic('bell'), unread > 0 && h('span', { class: 'dot' }, unread)), langsw,
    state.user ? h('button', { class: 'avatar', 'aria-label': tt('ui.menu'), onclick: openProfile }, (state.user.name || '?').slice(0, 1).toUpperCase()) : h('button', { class: 'signin-btn', 'aria-label': tt('ui.auth.title'), onclick: openAuth }, ic('user', 18), h('span', { class: 'hide-s' }, tt('ui.auth.title')))));
  const main = h('main', { id: 'main', tabindex: '-1' }, PAGES[cur] ? PAGES[cur]() : PAGES.home(), footer());
  const bottom = h('nav', { class: 'bottom', 'aria-label': 'Main' }, NAV.map(([r, i]) => h('button', { 'aria-current': cur === r ? 'page' : null, onclick: () => go(r) }, h('span', { class: 'nv' }, ic(i, 20)), navLabel(r, true))));
  frag.append(h('a', { class: 'skip', href: '#main', onclick: (e) => { e.preventDefault(); main.focus(); } }, tt('ui.skip')), rail, top, main, bottom); return frag;
}
const footer = () => h('footer', { class: 'foot' }, h('div', null, tt('ui.disclaimer')), h('div', null, tt('ui.independent')), h('div', null, tt('ui.updated', { d: fmtD(LAST_VERIFIED) }), ' ', h('button', { class: 'link', onclick: () => { const on = LS.get('ai', null) === true; LS.set('ai', !on); render(); } }, LS.get('ai', null) === true ? tt('ui.ai.off') : tt('ui.ai.on')), ' ', h('button', { class: 'link', onclick: () => go('admin') }, 'Admin (prototype)')));

/* ── modals: auth / profile / notifications / search / report ── */
function openAuth() {
  const name = h('input', { type: 'text', 'aria-label': tt('ui.auth.name'), placeholder: tt('ui.auth.name'), maxlength: 30, style: 'width:100%;padding:11px;border:1.5px solid var(--line2);border-radius:11px;background:var(--surface)' });
  const consent = h('input', { type: 'checkbox', id: 'cns' });
  const m = modal(tt('ui.auth.title'), h('div', { style: 'display:grid;gap:12px' }, h('p', { class: 'muted', style: 'margin:0' }, tt('ui.auth.demo')),
    h('b', null, tt('ui.auth.pick')), h('div', { style: 'display:grid;gap:8px' }, PERSONAS.map((p) => h('button', { class: 'persona', onclick: () => { state.user = { id: p.id, name: p.profile.name, demo: true, profile: { ...p.profile }, notif: {}, saved: [] }; state.lang = p.profile.lang || state.lang; LS.set('lang', state.lang); persistUser(); m.close(); render(); } }, h('span', { class: 'av' }, p.name[0]), h('span', null, h('b', null, p.name), h('br'), h('span', { class: 'muted' }, p.desc[state.lang] || p.desc.en))))),
    h('small', { class: 'muted' }, tt('ui.auth.persona_note')), h('hr', { style: 'border:0;border-top:1px solid var(--line);width:100%' }), h('b', null, tt('ui.auth.create')), name,
    h('label', { style: 'display:flex;gap:8px;align-items:center' }, consent, tt('ui.auth.consent')),
    h('button', { class: 'btn', onclick: () => { if (!name.value.trim() || !consent.checked) { (name.value.trim() ? consent : name).focus(); return; } state.user = { id: 'local-' + uid(), name: name.value.trim(), demo: false, profile: { lang: state.lang, ...state.guest }, notif: {}, saved: [] }; persistUser(); m.close(); render(); } }, tt('ui.auth.go')),
    h('button', { class: 'btn ghost', disabled: true }, tt('ui.auth.google')), h('button', { class: 'btn ghost', disabled: true }, tt('ui.auth.magic'))));
}
const NOTIF_CATS = [['c1', ['scholarship']], ['c2', ['rankings']], ['c3', ['accommodation']], ['c4', []], ['c5', []], ['c6', []], ['c7', []]];
function notifItems() {
  if (!state.user) return []; const on = state.user.notif || {}, p = state.user.profile, out = [], nw = now();
  const dls = E.listDeadlines({ filter: 'all', profile: p, now: nw, lang: state.lang }).filter((d) => d.relevant && d.state !== 'passed' && d.daysLeft <= 14);
  for (const d of dls) { const hit = (on.c1 && d.tags.includes('scholarship')) || (on.c2 && d.tags.includes('rankings')) || (on.c3 && d.tags.includes('accommodation')) || (on.c4 && d.id === 'd-cfu') || (on.c6 && d.inst === 'polito'); if (hit) out.push({ title: d.label, sub: `${d.display}, ${tt('ui.notif.due', { n: d.daysLeft })}` }); }
  if (on.c5 || on.c7) UPDATES.filter((u) => E.appliesTo({ applies: u.applies }, p)).forEach((u) => out.push({ title: u.title[state.lang] || u.title.en, sub: fmtD(u.date) }));
  return out;
}
function openNotifs() { const items = notifItems(); modal(tt('ui.notif.title'), state.user ? (items.length ? h('div', { class: 'upd' }, items.map((i) => h('div', { class: 'card' }, h('b', null, i.title), h('small', null, i.sub)))) : h('p', { class: 'muted' }, tt('ui.notif.none'))) : h('div', null, h('p', { class: 'muted' }, tt('ui.notif.opt')), h('button', { class: 'btn', onclick: () => { document.querySelector('.scrim')?.remove(); openAuth(); } }, tt('ui.auth.title')))); }
function openProfile() {
  const u = state.user, tog = (k) => h('label', { class: 'sw' }, h('span', null, tt(`ui.notif.${k}`)), h('input', { type: 'checkbox', checked: !!u.notif[k], onchange: (e) => { u.notif[k] = e.target.checked; persistUser(); render(); } }));
  const m = modal(u.name, h('div', { style: 'display:grid;gap:14px' }, u.demo && h('span', { class: 'pill', style: 'justify-self:start' }, tt('ui.demo_badge')),
    h('div', null, h('b', null, tt('ui.prof.lang')), h('div', { class: 'row', style: 'margin-top:7px' }, LANGS.map((l) => h('button', { class: 'chip', 'aria-pressed': String(state.lang === l), onclick: () => { state.lang = l; LS.set('lang', l); u.profile.lang = l; persistUser(); m.close(); render(); } }, LANG_NAMES[l])))),
    h('div', null, h('b', null, tt('ui.prof.theme')), h('div', { class: 'row', style: 'margin-top:7px' }, [['auto', 'ui.prof.auto'], ['light', 'ui.prof.light'], ['dark', 'ui.prof.dark']].map(([v, k]) => h('button', { class: 'chip', 'aria-pressed': String(state.theme === v), onclick: () => { state.theme = v; LS.set('theme', v); applyTheme(); m.close(); openProfile(); } }, tt(k))))),
    h('div', null, h('b', null, tt('ui.notif.title')), h('p', { class: 'muted', style: 'margin:4px 0 0;font-size:15px' }, tt('ui.notif.opt')), ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'].map(tog), h('p', { class: 'muted', style: 'font-size:14px' }, tt('ui.notif.email'))),
    h('button', { class: 'btn ghost', onclick: () => { state.user = null; LS.del('user'); LS.del('convos'); state.convos = []; state.cur = null; m.close(); go('home'); } }, tt('ui.prof.signout')),
    h('button', { class: 'btn ghost', style: 'color:var(--bad);border-color:var(--bad)', onclick: () => { state.user = null; ['user', 'convos', 'events', 'reports'].forEach(LS.del); state.convos = []; state.cur = null; state.guest = {}; state.events = []; state.reports = []; m.close(); go('home'); toast(tt('ui.prof.deleted')); } }, ic('trash', 16), tt('ui.prof.delete'))));
}
function openSearch() {
  const res = h('div', { class: 'results', role: 'list' }), inp = h('input', { type: 'search', placeholder: tt('ui.search.ph'), 'aria-label': tt('ui.search.ph'), oninput: () => draw(), style: 'width:100%;padding:13px;border:1.5px solid var(--line2);border-radius:14px;background:var(--surface);font-size:17px' });
  const m = modal(tt('ui.search.btn'), h('div', null, inp, res));
  const draw = () => { const q = inp.value.trim(); res.replaceChildren(); if (!q) return; const rs = E.searchTopics(q, state.lang); if (!rs.length) res.append(h('p', { class: 'muted' }, tt('ui.search.none'), ' ', h('button', { class: 'link', onclick: () => { m.close(); askNow(q); } }, tt('ui.search.ask')))); rs.forEach((r) => res.append(h('button', { class: 'result', role: 'listitem', onclick: () => { m.close(); askNow(r.ask || askFor(r.item.topics?.[0])); } }, h('b', null, r.title), h('span', null, r.sub)))); };
}
function openReport(r) {
  let reason = 'ui.rep.r1'; const c = h('textarea', { rows: 3, placeholder: tt('ui.rep.comment'), 'aria-label': tt('ui.rep.comment'), style: 'width:100%;border:1.5px solid var(--line2);border-radius:11px;padding:10px;background:var(--surface)' });
  const m = modal(tt('ui.ask.report'), h('div', { style: 'display:grid;gap:12px' }, h('b', null, tt('ui.rep.reason')), h('div', { class: 'row' }, ['r1', 'r2', 'r3', 'r4'].map((k) => h('button', { class: 'chip', 'aria-pressed': String(k === 'r1'), onclick: (e) => { reason = 'ui.rep.' + k; e.currentTarget.parentNode.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); } }, tt('ui.rep.' + k)))),
    r.sources?.[0] && h('small', { class: 'muted' }, `${tt('ui.ans.source')}: ${r.sources[0].title}, ${r.sources[0].article}`), c,
    h('button', { class: 'btn', onclick: () => { state.reports.push({ kind: 'report', ts: Date.now(), reason: D[reason][0], comment: c.value.slice(0, 500), intent: r.intent, type: r.type, ay: r.ay, source: r.sources?.map((s) => `${s.title} ${s.article}`) || [], status: 'open' }); LS.set('reports', state.reports); m.close(); toast(tt('ui.rep.thanks')); } }, tt('ui.rep.send'))));
}

/* ── Ask ── */
const convo = () => (state.cur ||= { id: uid(), title: '', ts: Date.now(), msgs: [], session: {}, last: null });
const respFor = (m) => (m.ai ? E.aiAnswerResponse(m.ai, state.lang, now(), m.q) : m.doc ? E.analyzeDocument(m.doc, m.prof, state.lang, now()) : E.answer(m.q, { profile: m.prof, session: m.sess, lastIntent: m.last, patch: m.patch, forceIntent: m.force }, state.lang, now()));
const factLabel = (patch) => Object.entries(patch).map(([k, v]) => (k === 'cfu' ? `${v} CFU` : k === 'cfuRequired' ? `${v} CFU (table)` : k === 'iseeValue' ? `ISEE ${v}` : String(v))).join(', ');
function saveConvo() { const c = convo(); if (!state.convos.find((x) => x.id === c.id)) state.convos.unshift(c); state.convos = state.convos.slice(0, 15); if (state.user) LS.set('convos', state.convos); }
function send(text, o = {}) {
  text = (text || '').trim(); if (!text && !o.patch) return; const c = convo(); if (!c.title) c.title = text.slice(0, 60);
  c.msgs.push({ r: 'u', text: o.label || text }); const m = { r: 'k', pending: true, wkey: o.doc ? 'ui.ask.w3' : 'ui.ask.w1' }; c.msgs.push(m); render(); scrollEnd();
  setTimeout(() => { m.wkey = o.doc ? 'ui.ask.w3' : 'ui.ask.w2'; render(); scrollEnd(); }, 300);
  setTimeout(async () => {
    try {
      const base = { q: text, patch: o.patch, force: o.force, doc: o.doc, sess: { ...c.session }, last: c.last, prof: { ...profile() }, detected: E.detectLang(text) };
      let r = respFor({ ...base });
      if (r.type === 'no_source' && !o.doc && !o.patch) { m.wkey = 'ui.ai.thinking'; render(); scrollEnd(); const extra = await tryAI(text, base); if (extra) { Object.assign(base, extra); r = respFor(base); } }
      Object.assign(m, base, { pending: false });
      const v = E.validateResponse(r); if (!v.ok) throw new Error(v.errors.join());
      const { ay: _ay, ...keep } = { ...r.learned, ...(o.patch || {}), ...(base.patch || {}) }; c.session = { ...c.session, ...keep };
      if (!['unknown', 'help', 'upload_prompt', 'ai'].includes(r.intent) && r.type !== 'no_source') c.last = r.intent;
      logEvent({ intent: r.intent, type: r.type, unanswered: r.type === 'no_source' || r.type === 'year_mismatch', conf: r.confidence, ai: !!base.viaAI }); saveConvo();
    } catch (err) { console.error(err); Object.assign(m, { pending: false, error: true, retry: { text, o } }); }
    render(); scrollEnd();
  }, 620);
}

/* ── optional AI layer (Netlify function /api/ai → Mistral). Rule engine always answers first. ── */
let aiOffUntil = 0;
function askConsent() {
  return new Promise((resolve) => {
    let done = false; const fin = (v) => { if (done) return; done = true; LS.set('ai', v); m.close(); resolve(v); };
    const m = modal(tt('ui.ai.notice_title'), h('div', { style: 'display:grid;gap:12px' }, h('p', { style: 'margin:0' }, tt('ui.ai.notice')), h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => fin(true) }, tt('ui.ai.yes')), h('button', { class: 'btn ghost', onclick: () => fin(false) }, tt('ui.ai.no')))), { onClose: () => fin(false) });
  });
}
async function tryAI(text, base) {
  if (Date.now() < aiOffUntil) return null;
  let ok = LS.get('ai', null); if (ok === null) ok = await askConsent(); if (!ok) return null;
  const ctx = {}; const p = E.mergeCtx(base.prof, base.sess); ['yearBucket', 'degreeType', 'partTime', 'cfu', 'citizenship', 'familyLocation', 'residenceType', 'rankingStatus'].forEach((k) => p[k] !== undefined && (ctx[k] = p[k]));
  try {
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: text, lang: state.lang, ctx }), signal: ctrl.signal }); clearTimeout(timer);
    if (res.status === 404 || res.status === 405) { aiOffUntil = Date.now() + 600000; return null; }   // no function deployed (e.g. opened as a file)
    const j = await res.json().catch(() => null);
    if (!j || !j.ok) { if (j && (j.code === 'rate_limited' || j.code === 'upstream' || j.code === 'timeout')) aiOffUntil = Date.now() + 60000; if (j && j.code === 'ai_disabled') aiOffUntil = Date.now() + 600000; return null; }
    if (j.intent && j.intent !== 'other') return { patch: j.facts || {}, force: j.intent, viaAI: true };
    if (j.answer && !j.answer.cannot && E.aiAnswerResponse(j.answer, state.lang, now(), text)) return { ai: j.answer, viaAI: true };
  } catch (e) { aiOffUntil = Date.now() + 60000; }
  return null;
}
const askNow = (text) => { state.route = 'ask'; location.hash = '#/ask'; state.cur = null; send(text); };
const scrollEnd = () => requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
function saveFacts(learned) { if (!state.user) return openAuth(); const keep = {}; ['yearBucket', 'degreeType', 'cfu', 'partTime', 'citizenship', 'familyLocation', 'residenceType', 'university', 'iseeValue', 'rankingStatus', 'accommodationStatus'].forEach((k) => learned[k] !== undefined && (keep[k] = learned[k])); setProfile(keep); toast(tt('ui.res.saved')); render(); }
function suggestions() { const p = profile(), s = [tt('sug.cfu'), tt('sug.rank'), tt('sug.docs'), tt('sug.next')]; if (p.rankingStatus === 'suspended') s.unshift(tt('ui.ph3')); if (p.accommodationRequested) s.splice(1, 0, tt('ui.p.acc')); return [...new Set(s)].slice(0, 5); }
function AskPage() {
  const c = convo(), last = c.msgs.length - 1, p = profile();
  const chat = h('div', { class: 'chat', 'aria-live': 'polite' });
  if (!c.msgs.length) chat.append(h('div', { class: 'empty' }, h('h2', null, tt('ui.ask.empty_title')), h('p', { class: 'muted' }, tt('ui.ask.empty_sub')), h('div', { class: 'suggest', role: 'list' }, suggestions().map((s) => h('button', { class: 'chip', role: 'listitem', onclick: () => send(s) }, s)), h('button', { class: 'chip', onclick: () => go('documents') }, ic('upload', 16), tt('ui.q.upload')))));
  c.msgs.forEach((m, i) => {
    if (m.r === 'u') return chat.append(h('div', { class: 'msg-u' }, m.text));
    if (m.pending) return chat.append(Skeleton(m.wkey));
    if (m.error) return chat.append(h('div', { class: 'plate tone-problem' }, h('div', { class: 'plate-band' }, ic('bad', 18), tt('ui.ask.err')), h('div', { class: 'block', style: 'padding-bottom:16px' }, h('button', { class: 'btn sm', onclick: () => { c.msgs.splice(i - 1, 2); send(m.retry.text, m.retry.o); } }, tt('ui.ask.retry')))));
    const r = respFor(m), isLast = i === last;
    chat.append(Answer(r, { isLast, used: true, feedback: true, onChip: (ch) => send(ch.label, { patch: ch.set, force: r.intent }), onInput: (patch) => send(factLabel(patch), { patch, force: r.intent }), onCta: (cta) => (cta.route === 'ask' ? send(cta.ask) : go(cta.route)), onSuggest: (s) => send(s), onSave: saveFacts, onReport: openReport,
      onFeedback: (ok, box) => { state.reports.push({ kind: 'feedback', ts: Date.now(), helpful: ok, intent: r.intent, type: r.type, lang: state.lang }); LS.set('reports', state.reports); box.replaceChildren(h('span', null, tt('ui.ask.thanks'))); } }));
    if (isLast && m.detected && m.detected !== 'en' && m.detected !== state.lang) chat.append(h('div', { class: 'langhint' }, h('button', { class: 'chip', onclick: () => { state.lang = m.detected; LS.set('lang', m.detected); render(); } }, ic('globe', 16), tt('ui.ask.switch', { lang: LANG_NAMES[m.detected] }))));
  });
  const ta = h('textarea', { rows: 1, placeholder: tt('ui.ask.ph'), 'aria-label': tt('ui.ask.ph'), onkeydown: (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const v = ta.value; ta.value = ''; send(v); } }, oninput: () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; } });
  const file = h('input', { type: 'file', class: 'sr', accept: '.txt,.md,.csv,.pdf,image/*', onchange: (e) => attachFile(e.target.files[0]) });
  const composer = h('div', { class: 'composer' }, h('div', { class: 'comp-in' }, file, h('button', { class: 'ib', 'aria-label': tt('ui.ask.attach'), onclick: () => file.click() }, ic('clip')), ta, h('button', { class: 'btn', 'aria-label': tt('ui.ask'), onclick: () => { const v = ta.value; ta.value = ''; send(v); } }, ic('send', 18))));
  const facts = [...E.mergeCtx(p, c.session) && Object.entries(E.mergeCtx(p, c.session)).filter(([k]) => ['university', 'degreeType', 'yearBucket', 'partTime', 'cfu', 'citizenship', 'familyLocation', 'residenceType'].includes(k))];
  const pane = h('aside', { class: 'ctxpane' }, h('div', { class: 'card' }, h('b', null, tt('ui.ask.used')), h('div', { class: 'row', style: 'margin-top:8px' }, facts.length ? facts.map((f) => h('span', { class: 'gl' }, ctxLabel(f))) : h('span', { class: 'muted' }, tt('ui.home.empty_profile'))), h('button', { class: 'btn ghost sm', style: 'margin-top:12px', onclick: () => go('situation') }, tt('ui.nav.situation'))),
    h('div', { class: 'card' }, h('b', null, tt('ui.supports')), h('div', { class: 'muted' }, 'EDISU Piemonte, bando 2026/27'), h('div', { class: 'muted' }, 'Politecnico di Torino, 2026/27'), h('div', { class: 'muted', style: 'margin-top:6px' }, tt('ui.updated', { d: fmtD(LAST_VERIFIED) }))));
  return h('div', { class: 'askwrap' }, h('div', null, h('div', { class: 'ask-top' }, h('h1', { class: 'sr' }, tt('ui.nav.ask')), c.msgs.length ? h('button', { class: 'btn ghost sm', onclick: () => { state.cur = null; render(); } }, ic('plus', 16), tt('ui.ask.new')) : null), chat, composer), pane);
}
function attachFile(f) {
  if (!f) return; const isText = /text|csv|markdown/.test(f.type) || /\.(txt|md|csv)$/i.test(f.name);
  if (!isText || f.size > 300000) return send(f.name, { doc: { text: '', name: f.name }, label: `📎 ${f.name}` });
  const rd = new FileReader(); rd.onload = () => send(f.name, { doc: { text: String(rd.result).slice(0, 20000), name: f.name }, label: `📎 ${f.name}` }); rd.readAsText(f);
}

/* ── Home ── */
function HomePage() { return state.user ? DashPage() : LandingPage(); }
function LandingPage() {
  const inp = h('input', { type: 'text', placeholder: tt('ui.ph1'), 'aria-label': tt('ui.ask.ph'), onkeydown: (e) => e.key === 'Enter' && submit() }), submit = () => (inp.value.trim() ? askNow(inp.value) : go('ask'));
  const phs = ['ui.ph1', 'ui.ph2', 'ui.ph3']; let pi = 0; clearInterval(phTimer); phTimer = setInterval(() => { if (!document.body.contains(inp)) return clearInterval(phTimer); pi = (pi + 1) % 3; inp.placeholder = tt(phs[pi]); }, 3200);
  const Q = [['sch', 'check_list', 'info', 'ui.p.sch'], ['cfu', 'check_list', 'info', 'ui.p.cfu'], ['acc', 'bed', 'accommodation', 'ui.p.acc'], ['isee', 'file', 'info', 'ui.p.isee'], ['pay', 'clock', 'info', 'ui.p.pay'], ['rank', 'flag', 'action', 'ui.p.rank'], ['intl', 'globe', 'info', 'ui.p.intl'], ['enrol', 'home', 'info', 'ui.p.enrol'], ['upload', 'upload', 'unknown', null], ['dead', 'calendar', 'action', 'ui.p.dead']];
  const eg = E.answer(`I have 14 CFU. I'm a first-year Master's student. What happens?`, {}, state.lang, now());
  const sb = h('div', { class: 'searchbox' }, ic('search', 18), h('input', { type: 'search', placeholder: tt('ui.search.ph'), 'aria-label': tt('ui.search.ph'), onfocus: openSearch, readonly: true }));
  return h('div', null, h('section', { class: 'hero' }, h('h1', null, tt('ui.hero.title')), h('p', { class: 'sub' }, tt('ui.hero.sub')), h('p', null, tt('ui.hero.body')), h('div', { class: 'askbar' }, ic('chat', 22), inp, h('button', { class: 'btn', onclick: submit }, tt('ui.ask'))), h('div', { class: 'hero-cta' }, h('button', { class: 'btn ghost', onclick: () => go('situation') }, tt('ui.situation')), h('button', { class: 'btn ghost', onclick: openAuth }, tt('ui.home.create'))),
    h('div', { class: 'trust' }, h('span', null, ic('shield', 18), tt('ui.trust1')), h('span', null, ic('globe', 18), tt('ui.trust2')), h('span', null, ic('chat', 18), tt('ui.trust3')))),
    h('div', { class: 'split' }, h('section', null, h('h2', { class: 'sect-t' }, tt('ui.quick.title')), sb, h('div', { class: 'topics' }, Q.map(([k, i, tone, p]) => h('button', { class: `topic tone-${tone}`, onclick: () => (p ? askNow(tt(p)) : go('documents')) }, h('span', { class: 'ti' }, ic(i, 18)), tt('ui.q.' + k)))),
      h('div', { class: 'card', style: 'margin-top:14px' }, h('b', null, `${tt('ui.supports')}: EDISU, PoliTO`), h('div', { class: 'muted' }, `${tt('ui.soon')}: UniTo`))),
      h('section', null, h('p', { class: 'eg-label' }, `${tt('ui.ask.try')}: “I have 14 CFU. I'm a first-year Master's student.”`), Answer(eg, {}))));
}
function DashPage() {
  const p = profile(), sit = E.computeSituation(p, state.lang, now()), pers = E.isPersonalised(p);
  const dls = E.listDeadlines({ filter: 'personal', profile: p, now: now(), lang: state.lang }).filter((d) => d.state !== 'passed').slice(0, 5);
  const cfu = sit.cards.find((c) => c.progress), ups = UPDATES.filter((u) => E.appliesTo({ applies: u.applies }, p) || u.applies.includes('all')).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  return h('div', { class: 'dash' }, h('div', { class: 'full page-h' }, h('h1', null, tt('ui.home.hello', { name: state.user.name })), h('p', null, pers ? tt('ui.res.disc') : tt('ui.home.empty_profile'))),
    !pers && h('div', { class: 'full card' }, h('button', { class: 'btn', onclick: () => go('situation') }, tt('ui.nav.situation'))),
    pers && h('section', { class: 'full' }, h('h2', { class: 'sect-t' }, tt('ui.home.status')), h('div', { class: 'cards3' }, sit.cards.map(SCard))),
    pers && h('section', null, h('h2', { class: 'sect-t' }, tt('ui.home.next')), sit.actions.length ? ActList(sit.actions.slice(0, 4)) : h('p', { class: 'muted' }, tt('ui.home.no_actions')), h('button', { class: 'btn ghost sm', style: 'margin-top:10px', onclick: () => askNow(tt('sug.next')) }, tt('ui.ask'))),
    pers && h('section', null, h('h2', { class: 'sect-t' }, tt('ui.home.upcoming')), dls.length ? h('div', { class: 'card' }, Timeline(dls.map((d) => ({ display: d.display, label: d.label, state: d.state, daysLeft: d.daysLeft })))) : h('p', { class: 'muted' }, tt('ui.dl.empty')), h('button', { class: 'btn ghost sm', onclick: () => go('deadlines') }, tt('ui.home.see_all'))),
    cfu && h('section', { class: `tone-${cfu.tone}` }, h('h2', { class: 'sect-t' }, tt('ui.home.cfu')), h('div', { class: 'card' }, h('div', { class: 'prog-n', style: 'padding:0' }, `${cfu.progress.current} / ${cfu.progress.required}`, h('small', null, 'CFU')), h('div', { class: 'bar' }, h('i', { style: `width:${cfu.progress.pct}%` })), h('div', { class: 'bar-l' }, h('span', null, `${cfu.progress.pct}%`), h('span', null, `${tt('m.remaining')}: ${cfu.progress.remaining}`)))),
    h('section', null, h('h2', { class: 'sect-t' }, tt('ui.home.updates')), h('div', { class: 'upd' }, ups.map((u) => h('a', { class: 'card', href: DOCS[Object.keys(DOCS).find((k) => k === (u.cite === 'politoReg' ? 'politoReg' : u.cite === 'regione' ? 'regione' : 'bando'))].url, target: '_blank', rel: 'noopener noreferrer', style: 'text-decoration:none' }, h('b', null, u.title[state.lang] || u.title.en), h('small', null, `${instName(u.inst)}, ${fmtD(u.date)}`), h('div', { class: 'muted', style: 'font-size:15px' }, u.body[state.lang] || u.body.en))))),
    h('section', null, h('h2', { class: 'sect-t' }, tt('ui.home.recent')), state.convos.length ? h('div', { class: 'upd' }, state.convos.slice(0, 5).map((c) => h('button', { class: 'card', style: 'text-align:left', onclick: () => { state.cur = c; go('ask'); } }, h('b', null, c.title), h('small', null, fmtD(new Date(c.ts).toISOString().slice(0, 10)))))) : h('p', { class: 'muted' }, tt('ui.home.no_recent'))));
}
const SCard = (c) => h('div', { class: `scard tone-${c.tone}` }, h('div', { class: 'st' }, c.title), h('div', { class: 'sl' }, c.label), h('div', { class: 'sd' }, c.detail), c.progress && h('div', { class: 'bar' }, h('i', { style: `width:${c.progress.pct}%` })));
const ActList = (a) => h('ol', { class: 'actlist' }, a.map((x, i) => h('li', { class: `tone-${x.tone || 'action'}` }, h('span', { class: 'n' }, i + 1), h('div', null, h('b', null, x.text), x.due && h('small', null, fmtD(x.due))))));

/* ── Check my situation ── */
function SituationPage() {
  const s = (state.sit ||= { step: 0, draft: { university: 'polito', ...profile() }, done: false }), d = s.draft;
  const set = (k, v) => { d[k] = v; if (k === 'citizenship' && v === 'protected') d.familyLocation = 'italy'; render(); };
  const chips = (k, opts, dis) => h('div', { class: 'row', role: 'group' }, opts.map(([v, label, off]) => h('button', { class: 'chip', disabled: off, 'aria-pressed': String(d[k] === v), onclick: () => set(k, v) }, label)));
  const F = (label, ...body) => h('div', null, h('span', { class: 'lbl' }, label), body);
  if (s.done) return SituationResult();
  const steps = [
    () => [F(tt('ui.f.uni'), chips('university', [['polito', tt('ui.f.uni_polito')], ['unito', tt('ui.f.uni_unito'), true]])), F(tt('ui.f.degree'), chips('degreeType', [['bachelor', tt('chip.bachelor')], ['master', tt('chip.master')], ['single', tt('chip.single')]])), F(tt('ui.f.year'), chips('yearBucket', [['first', tt('chip.first')], ['later', tt('chip.later')]])), F(tt('ui.f.load'), chips('partTime', [[false, tt('ui.f.full')], [true, tt('ui.f.part')]])), F(tt('ui.f.cfu'), h('input', { type: 'number', min: 0, max: 400, inputmode: 'numeric', value: d.cfu ?? '', oninput: (e) => (d.cfu = e.target.value === '' ? undefined : Number(e.target.value)) }))],
    () => [F(tt('ui.f.applied'), chips('scholarshipApplied', [[true, tt('ui.yes')], [false, tt('ui.no')], ['unsure', tt('ui.f.unsure')]])), F(tt('ui.f.res'), chips('residenceType', [['in_sede', tt('res.in_sede')], ['pendolare', tt('res.pendolare')], ['fuori_sede', tt('res.fuori_sede')]]), h('small', null, tt('ui.f.res_help')))],
    () => { const rt = E.iseeRoute(d); return [F(tt('ui.f.citizen'), chips('citizenship', [['it', tt('chip.it')], ['eu', tt('chip.eu')], ['extra_eu', tt('chip.extra_eu')], ['protected', tt('chip.protected')]])), d.citizenship !== 'protected' && F(tt('ui.f.family'), chips('familyLocation', [['italy', tt('chip.fam_italy')], ['abroad', tt('chip.fam_abroad')], ['mixed', tt('chip.fam_mixed')]])),
      rt.route === 'universitario' && F(tt('ui.f.isee'), h('input', { type: 'number', inputmode: 'numeric', min: 0, value: d.iseeValue ?? '', oninput: (e) => (d.iseeValue = e.target.value === '' ? undefined : Number(e.target.value)) })), rt.route === 'universitario' && F(tt('ui.f.ispe'), h('input', { type: 'number', inputmode: 'numeric', min: 0, value: d.ispeValue ?? '', oninput: (e) => (d.ispeValue = e.target.value === '' ? undefined : Number(e.target.value)) })),
      rt.route === 'parificato' && h('div', { class: 'priv' }, ic('info', 18), tt('ui.f.isee_par'))]; },
    () => (d.residenceType === 'fuori_sede' ? [F(tt('ui.f.acc'), chips('accommodationRequested', [[true, tt('ui.yes')], [false, tt('ui.no')]])), d.accommodationRequested && F(tt('ui.f.acc_status'), chips('accommodationStatus', [['winner', tt('chip.winner')], ['idoneo', tt('chip.idoneo')], ['excluded', tt('chip.excluded')], ['unknown', tt('ui.f.unsure')]]))] : [h('div', { class: 'priv' }, ic('info', 18), tt('ui.f.acc_skip'))])];
  const valid = [d.degreeType && d.yearBucket, d.scholarshipApplied !== undefined && d.residenceType, d.citizenship && (d.familyLocation || d.citizenship === 'protected'), true][s.step];
  const finish = () => { const p = { ...d }; if (p.scholarshipApplied === 'unsure') delete p.scholarshipApplied; if (p.accommodationRequested === false) p.accommodationStatus = 'not_applied'; setProfile(p); s.done = true; logEvent({ intent: 'situation', type: 'situation_done' }); render(); window.scrollTo(0, 0); };
  return h('div', null, h('div', { class: 'page-h' }, h('h1', null, tt('ui.sit.intro').length ? tt('ui.nav.situation') : ''), h('p', null, tt('ui.sit.intro'))), h('div', { class: 'stepper', role: 'progressbar', 'aria-valuemin': 1, 'aria-valuemax': 4, 'aria-valuenow': s.step + 1 }, [0, 1, 2, 3].map((i) => h('i', { class: i <= s.step ? 'on' : '' }))), h('div', { class: 'stepname' }, `${tt('ui.sit.step', { n: s.step + 1, t: 4 })}: ${tt('ui.sit.s' + (s.step + 1))}`), h('div', { class: 'f' }, steps[s.step]()),
    h('div', { class: 'nav-row' }, h('button', { class: 'btn ghost', disabled: s.step === 0, onclick: () => { s.step--; render(); } }, tt('ui.btn.back')), s.step < 3 ? h('button', { class: 'btn', disabled: !valid, onclick: () => { s.step++; render(); window.scrollTo(0, 0); } }, tt('ui.btn.continue')) : h('button', { class: 'btn', onclick: finish }, tt('ui.btn.finish'))));
}
function SituationResult() {
  const p = profile(), sit = E.computeSituation(p, state.lang, now());
  return h('div', { class: 'dash' }, h('div', { class: 'full page-h' }, h('h1', null, tt('ui.res.title')), h('p', null, tt('ui.res.disc'))), h('section', { class: 'full' }, h('div', { class: 'cards3' }, sit.cards.map(SCard))),
    h('section', null, h('h2', { class: 'sect-t' }, tt('ui.res.todo')), sit.actions.length ? ActList(sit.actions.slice(0, 7)) : h('p', { class: 'muted' }, tt('ui.home.no_actions'))),
    h('section', null, h('div', { class: 'card', style: 'display:grid;gap:10px' }, state.user ? h('b', null, ic('check', 16), ' ', tt('ui.res.saved')) : [h('b', null, tt('ui.home.save')), h('button', { class: 'btn', onclick: openAuth }, tt('ui.res.signin'))], h('button', { class: 'btn ghost', onclick: () => askNow(tt('sug.next')) }, ic('chat', 16), tt('ui.ask')), h('button', { class: 'btn ghost', onclick: () => { state.sit.done = false; state.sit.step = 0; render(); } }, tt('ui.res.edit')))));
}

/* ── Deadlines ── */
function DeadlinesPage() {
  const p = profile(), f = state.dlFilter, list = E.listDeadlines({ filter: f, profile: p, now: now(), lang: state.lang }), pers = E.isPersonalised(p);
  const FL = ['all', 'edisu', 'polito', 'scholarship', 'accommodation', 'rankings', 'enrollment', 'personal'];
  const card = (d) => { const tone = d.state === 'passed' ? 'unknown' : d.daysLeft <= 7 ? 'action' : 'info'; return h('article', { class: `dcard tone-${tone} ${d.state}` }, h('div', { class: 'dbox' }, h('b', null, E.fmtDate(d.date, state.lang, { day: 'numeric' })), h('span', null, E.fmtDate(d.date, state.lang, { month: 'short' }))), h('div', { style: 'min-width:0;flex:1' }, h('h3', null, d.label), h('div', { class: 'meta' }, h('span', { class: 'tag' }, instName(d.inst)), h('span', { class: 'tag' }, d.ay), h('span', null, d.applies.slice(0, 2).join(', ')), d.time && h('span', null, d.time), d.start && h('span', null, `${fmtD(d.start, { day: 'numeric', month: 'short' })} to ${fmtD(d.date, { day: 'numeric', month: 'short' })}`)),
    h('div', { class: 'row', style: 'margin-top:8px;align-items:center' }, h('span', { class: 'badge' }, ic(d.state === 'passed' ? 'check' : 'clock', 15), d.state === 'passed' ? tt('ui.dl.passed') : d.state === 'today' ? tt('ui.dl.today') : tt('ui.ans.left', { n: d.daysLeft })), h('button', { class: 'link', onclick: () => askNow(askFor(d.tags[0])) }, tt('ui.dl.open_ask'))), d.source && d.basis !== 'read' && h('div', { class: 'muted mini-src' }, tt(basisKey[d.basis])))); };
  const body = () => {
    if (state.dlView === 'timeline') { const groups = {}; list.forEach((d) => (groups[d.date.slice(0, 7)] ||= []).push(d)); return h('div', { style: 'max-width:820px' }, Object.entries(groups).map(([m, items]) => [h('div', { class: 'month' }, E.fmtDate(m + '-01', state.lang, { month: 'long', year: 'numeric' })), h('div', { class: 'card' }, Timeline(items.map((d) => ({ display: d.display, label: `${d.label} (${instName(d.inst)})`, state: d.state, daysLeft: d.daysLeft })), false))])); }
    if (!list.length) return h('p', { class: 'muted' }, tt('ui.dl.empty'));
    if (f === 'all' && pers) { const rel = list.filter((d) => d.relevant), oth = list.filter((d) => !d.relevant); return h('div', null, rel.length > 0 && [h('h2', { class: 'sect-t' }, tt('ui.dl.relevant')), h('div', { class: 'dcards' }, rel.map(card))], h('h2', { class: 'sect-t', style: 'margin-top:22px' }, tt('ui.dl.all')), h('div', { class: 'dcards' }, oth.map(card))); }
    return h('div', { class: 'dcards' }, list.map(card));
  };
  return h('div', null, h('div', { class: 'page-h' }, h('h1', null, tt('ui.dl.title')), !pers && h('p', null, tt('ui.dl.personalise'), ' ', h('button', { class: 'link', onclick: () => go('situation') }, tt('ui.nav.situation')))), h('div', { class: 'row', style: 'justify-content:space-between;align-items:center;margin-bottom:6px' }, h('div', { class: 'seg' }, ['cards', 'timeline'].map((v) => h('button', { 'aria-pressed': String(state.dlView === v), onclick: () => { state.dlView = v; render(); } }, tt('ui.dl.' + v))))),
    h('div', { class: 'filters', role: 'group' }, FL.map((k) => h('button', { class: 'chip', 'aria-pressed': String(f === k), onclick: () => { state.dlFilter = k; render(); } }, tt('ui.dl.f.' + k)))), body());
}

/* ── Documents ── */
function DocumentsPage() {
  const tab = state.docTab, TABS = [['explain', 'ui.docs.t1'], ['saved', 'ui.docs.t2'], ['checklist', 'ui.docs.t3']];
  const head = h('div', { class: 'page-h' }, h('h1', null, tt('ui.docs.title')), h('div', { class: 'tabs', role: 'tablist', style: 'margin-top:14px' }, TABS.map(([k, l]) => h('button', { class: 'chip', role: 'tab', 'aria-selected': String(tab === k), 'aria-pressed': String(tab === k), onclick: () => { state.docTab = k; render(); } }, tt(l)))));
  let body;
  if (tab === 'saved') body = state.user?.saved?.length ? h('div', { class: 'upd' }, state.user.saved.map((s) => h('div', { class: 'card' }, h('b', null, s.name), h('small', null, tt('ui.docs.on', { d: fmtD(s.at.slice(0, 10)) })), h('dl', { class: 'doc-found', style: 'padding:8px 0;background:none;border:0' }, (s.docFound || []).map((x) => [h('dt', null, x.label), h('dd', null, x.value)])), h('button', { class: 'btn ghost sm', onclick: () => { state.user.saved = state.user.saved.filter((x) => x.id !== s.id); persistUser(); render(); } }, ic('trash', 15), tt('ui.docs.delete'))))) : h('p', { class: 'muted' }, state.user ? tt('ui.docs.none') : tt('ui.docs.signin'));
  else if (tab === 'checklist') body = Answer(E.answer(tt('sug.docs'), { profile: profile() }, state.lang, now()), { full: true });
  else {
    const ta = h('textarea', { placeholder: tt('ui.docs.paste_ph'), 'aria-label': tt('ui.docs.paste'), value: state.docDraft || '' }), over = { v: false };
    const run = (text, name) => { state.docDraft = text; const inp = { text, name: name || 'pasted text' }; state.docInput = inp; logEvent({ intent: 'document', type: 'document_analysis' }); render(); };
    const pick = (f) => { if (!f) return; const isText = /text|csv|markdown/.test(f.type) || /\.(txt|md|csv)$/i.test(f.name); if (!isText) { state.docInput = { text: '', name: f.name, imageNote: true }; return render(); } const rd = new FileReader(); rd.onload = () => run(String(rd.result).slice(0, 20000), f.name); rd.readAsText(f); };
    const file = h('input', { type: 'file', class: 'sr', accept: '.txt,.md,.csv,.pdf,image/*', onchange: (e) => pick(e.target.files[0]) });
    const box = h('div', { class: 'upload', ondragover: (e) => { e.preventDefault(); box.classList.add('over'); }, ondragleave: () => box.classList.remove('over'), ondrop: (e) => { e.preventDefault(); box.classList.remove('over'); pick(e.dataTransfer.files[0]); } }, ic('upload', 30), h('b', null, tt('ui.docs.drop')), file, h('button', { class: 'btn ghost', onclick: () => file.click() }, tt('ui.docs.choose')));
    const res = state.docInput && (state.docInput.imageNote ? h('div', { class: 'priv', style: 'background:var(--act-bg);color:var(--act)' }, ic('info', 18), tt('ui.docs.img_note')) : (() => { const r = E.analyzeDocument(state.docInput, profile(), state.lang, now()); return h('div', { style: 'display:grid;gap:12px;margin-top:16px' }, Answer(r, { full: true }), r.sources.length > 0 && h('div', { class: 'row' }, h('button', { class: 'btn ghost sm', onclick: () => { if (!state.user) return toast(tt('ui.docs.signin')); state.user.saved.unshift({ id: uid(), name: state.docInput.name, at: new Date().toISOString(), docFound: r.docFound }); persistUser(); toast(tt('ui.docs.saved_ok')); } }, ic('check', 15), tt('ui.docs.save')))); })());
    body = h('div', { style: 'max-width:720px;display:grid;gap:14px' }, h('div', { class: 'priv' }, ic('shield', 18), tt('ui.docs.privacy')), box, h('div', { class: 'f' }, F2(tt('ui.docs.paste'), ta), h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => run(ta.value, 'pasted text') }, tt('ui.docs.go')), h('span', { class: 'muted', style: 'align-self:center' }, tt('ui.docs.samples') + ':'), h('button', { class: 'chip', onclick: () => run(E.SAMPLE_DOCS.ranking, 'sample-ranking.txt') }, tt('ui.docs.s_rank')), h('button', { class: 'chip', onclick: () => run(E.SAMPLE_DOCS.isee, 'sample-isee.txt') }, tt('ui.docs.s_isee')))), res);
  }
  return h('div', null, head, body);
}
const F2 = (l, el) => h('div', null, h('span', { class: 'lbl' }, l), el);

/* ── Admin (prototype: role-protected in production) ── */
function AdminPage() {
  const tab = state.adminTab, TABS = ['sources', 'knowledge', 'rules', 'review', 'reports', 'analytics', 'tests'];
  const tbl = (cols, rows) => h('div', { class: 'tscroll' }, h('table', null, h('thead', null, h('tr', null, cols.map((c) => h('th', null, c)))), h('tbody', null, rows.map((r) => h('tr', null, r.map((c) => h('td', null, c)))))));
  const ev = state.events, cnt = (fn) => ev.reduce((a, e) => { const k = fn(e); a[k] = (a[k] || 0) + 1; return a; }, {});
  const bars = (o) => { const m = Math.max(1, ...Object.values(o)); return Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => h('div', { class: 'hbar' }, h('span', null, k), h('i', { style: `width:${(v / m) * 100}%` }), h('b', null, v))); };
  let body;
  if (tab === 'sources') body = [h('p', { class: 'muted' }, 'Production: add URL or upload PDF → assign institution, academic year, type, dates → process → re-index. Prototype shows the indexed set.'), tbl(['Institution', 'AY', 'Document', 'Type', 'Published', 'Status', 'Link'], Object.values(DOCS).map((d) => [instName(d.inst), d.ay, d.name, d.type, d.published || 'n/a', d.type === 'demo' ? 'DEMO (excluded from answers)' : 'Processed', d.url ? h('a', { href: d.url, target: '_blank', rel: 'noopener noreferrer' }, 'open') : '-']))];
  if (tab === 'knowledge') { const ay = state.adminAy || 'all'; body = [h('div', { class: 'row', style: 'margin-bottom:10px' }, ['all', '2026/27', '2025/26'].map((v) => h('button', { class: 'chip', 'aria-pressed': String(ay === v), onclick: () => { state.adminAy = v; render(); } }, v))), tbl(['Chunk', 'Inst.', 'AY', 'Article', 'Page', 'Topics', 'Basis', 'Text (EN)', 'Embedding'], CHUNKS.filter((c) => ay === 'all' || c.ay === ay).map((c) => { const s = E.cite(c.cite || 'deadlines'); return [c.id, instName(c.inst), c.ay, c.cite ? s.article : 'n/a', c.cite && s.page ? s.page : '-', c.topics.join(', '), c.basis || s.basis, c.text.en.slice(0, 110) + '…', 'not computed (pgvector in production)']; }))]; }
  if (tab === 'rules') { const inp = (n, ph, w = 130) => h('input', { name: n, placeholder: ph, 'aria-label': ph, style: `width:${w}px;padding:8px;border:1.5px solid var(--line2);border-radius:9px;background:var(--surface)` });
    const fs = ['key', 'value', 'category', 'ay', 'deadline', 'article'].map((n) => inp(n, n)); fs[3].value = '2027/28';
    body = [h('p', { class: 'muted' }, 'Deterministic rules the engine uses. New or changed rules start as drafts and need approval; high-impact changes need admin review before publishing.'), tbl(['Rule', 'AY', 'Type', 'Category', 'Key', 'Value', 'Deadline', 'Source', 'Status'], [...RULES.map((r) => [r.id, r.ay, r.type, r.category + (r.mode ? ` (${r.mode})` : ''), r.key, r.value === null ? 'null (not indexed)' : String(r.value), r.deadline || '-', E.cite(r.cite).article, r.status]), ...state.drafts.map((r) => [r.id, r.ay, 'custom', r.category, r.key, r.value, r.deadline, r.article, h('span', null, r.status, ' ', r.status === 'draft' && h('button', { class: 'link', onclick: () => { r.status = 'approved (demo, not applied)'; LS.set('rule_drafts', state.drafts); render(); } }, 'approve'))])]),
      h('form', { class: 'row', style: 'margin-top:12px', onsubmit: (e) => { e.preventDefault(); const o = {}; fs.forEach((x) => (o[x.name] = x.value)); state.drafts.push({ id: 'draft-' + uid(), status: 'draft', ...o }); LS.set('rule_drafts', state.drafts); render(); } }, fs, h('button', { class: 'btn sm', type: 'submit' }, 'Save draft rule'))]; }
  if (tab === 'review') { const st = (state.reviewState ||= 'pending'); body = [h('p', { class: 'muted' }, 'Workflow: notice detected → download → compare with rules → AI summarises changes → admin review → approve → publish → notify affected users. Nothing high-impact publishes automatically.'), h('div', { class: 'card', style: 'max-width:720px' }, h('span', { class: 'pill' }, 'DEMO item, not a real notice'), h('h3', { style: 'margin:8px 0' }, 'EDISU: hypothetical amendment to the 2026/27 bando'), h('p', null, 'AI change summary (demo): "A deadline in Art. 13 would move by 7 days. Affects: first-year master\'s students."'), h('p', { class: 'muted' }, `Status: ${st}`), h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => { state.reviewState = 'approved (demo, nothing published)'; render(); } }, 'Approve'), h('button', { class: 'btn ghost sm', onclick: () => { state.reviewState = 'rejected'; render(); } }, 'Reject')))]; }
  if (tab === 'reports') { const fb = state.reports.filter((r) => r.kind === 'feedback'), rp = state.reports.filter((r) => r.kind === 'report'); body = [h('div', { class: 'kpis' }, h('div', { class: 'kpi' }, h('b', null, fb.filter((x) => x.helpful).length), 'helpful'), h('div', { class: 'kpi' }, h('b', null, fb.filter((x) => !x.helpful).length), 'not helpful'), h('div', { class: 'kpi' }, h('b', null, rp.length), 'incorrect-info reports')), rp.length ? tbl(['When', 'Reason', 'Answer type', 'AY', 'Cited source', 'Comment'], rp.map((r) => [new Date(r.ts).toLocaleString(), r.reason, r.type, r.ay, (r.source || []).join('; '), r.comment || ''])) : h('p', { class: 'muted' }, 'No reports yet.')]; }
  if (tab === 'analytics') { const q = ev.filter((e) => e.type && e.type !== 'situation_done'), un = q.filter((e) => e.unanswered).length; body = [h('p', { class: 'muted' }, 'Privacy-conscious: only counters (intent, language, signed-in or not). Question text and personal data are never logged.'), h('div', { class: 'kpis' }, h('div', { class: 'kpi' }, h('b', null, q.length), 'questions'), h('div', { class: 'kpi' }, h('b', null, q.length ? Math.round((un / q.length) * 100) + '%' : '0%'), 'unanswered / no source'), h('div', { class: 'kpi' }, h('b', null, q.length ? Math.round((q.filter((e) => e.signed).length / q.length) * 100) + '%' : '0%'), 'signed-in use')), h('h3', { class: 'sect-t' }, 'Categories'), bars(cnt((e) => e.intent || 'n/a')), h('h3', { class: 'sect-t', style: 'margin-top:14px' }, 'Languages'), bars(cnt((e) => e.lang)), h('h3', { class: 'sect-t', style: 'margin-top:14px' }, 'Coverage gaps (no source found)'), bars(ev.filter((e) => e.unanswered).reduce((a, e) => { a[e.type] = (a[e.type] || 0) + 1; return a; }, {}))]; }
  if (tab === 'tests') { const rs = state.testResults; body = [h('button', { class: 'btn', onclick: () => { state.testResults = runSelfTests(); render(); } }, 'Run self-tests'), rs && h('p', null, h('b', { class: rs.every((x) => x.ok) ? 'pass' : 'fail' }, `${rs.filter((x) => x.ok).length} / ${rs.length} passed`)), rs && tbl(['Result', 'Test', 'Detail'], rs.map((r) => [h('span', { class: r.ok ? 'pass' : 'fail' }, r.ok ? 'PASS' : 'FAIL'), r.name, r.detail]))]; }
  return h('div', { class: 'admin' }, h('div', { class: 'banner' }, 'Admin preview. In production this route sits behind Supabase Auth with an admin role and row-level security. It is open here because the prototype has no backend.'), h('div', { class: 'page-h' }, h('h1', null, 'Admin')), h('div', { class: 'tabs' }, TABS.map((k) => h('button', { class: 'chip', 'aria-pressed': String(tab === k), onclick: () => { state.adminTab = k; render(); } }, k))), body);
}

/* ── router / boot ── */
const PAGES = { home: HomePage, ask: AskPage, situation: SituationPage, deadlines: DeadlinesPage, documents: DocumentsPage, admin: AdminPage };
function render() {
  clearInterval(phTimer); const root = document.getElementById('app'), sx = window.scrollX, sy = window.scrollY; state.route = (location.hash.replace(/^#\//, '') || 'home').split('?')[0]; if (!PAGES[state.route]) state.route = 'home';
  document.documentElement.lang = { en: 'en', it: 'it', si: 'si' }[state.lang]; document.title = `${state.route === 'home' ? 'RUKA' : navLabel(state.route in { situation: 1, ask: 1, deadlines: 1, documents: 1 } ? state.route : 'home')} | RUKA Beta`;
  try { root.replaceChildren(shell()); } catch (e) { console.error(e); root.replaceChildren(h('main', null, h('div', { class: 'plate tone-problem' }, h('div', { class: 'plate-band' }, ic('bad', 18), tt('ui.ask.err')), h('div', { class: 'block', style: 'padding-bottom:16px' }, h('button', { class: 'btn sm', onclick: () => { location.hash = '#/home'; render(); } }, tt('ui.back_home')))))); }
  if (state.route !== 'ask') window.scrollTo(sx, sy);
}
window.addEventListener('hashchange', render);
applyTheme(); render();
window.__ruka = { state, E, render, send, go };
