// RUKA engine — pure functions, no DOM. Same file runs in the browser prototype and in Node tests.
// Flow: text -> intent + facts -> profile context -> rules + retrieval -> STRUCTURED answer (JSON) -> UI renders it.
import { AY, LAST_VERIFIED, DOCS, S, CHUNKS, DEADLINES, RULES, GLOSSARY, UPDATES, APPLIES_LABEL } from './kb.js';
import { t } from './i18n.js';
import { numbersGrounded } from './ai-guard.js';

/* ───────────── helpers ───────────── */
const LOC = { en: 'en-GB', it: 'it-IT', si: 'si-LK' };
export const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export const todayISO = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(now);
export const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
export const fmtDate = (iso, lang = 'en', o = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { ...o, timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
export const fmtEUR = (n, lang = 'en') => new Intl.NumberFormat(LOC[lang] || 'en-GB', { style: 'currency', currency: 'EUR' }).format(n);
const pick = (o, lang) => (o && (o[lang] || o.en)) || '';

export function cite(key) {
  const s = S[key], d = DOCS[s.doc];
  return { key, title: d.name, institution: d.inst, ay: d.ay, article: s.article, page: s.page, url: d.url, basis: s.basis, docType: d.type, lastVerified: LAST_VERIFIED };
}

export function deadlineState(d, now = new Date()) {
  const td = todayISO(now), dd = daysBetween(td, d.date);
  return { state: dd < 0 ? 'passed' : dd === 0 ? 'today' : 'upcoming', daysLeft: dd };
}
export function dl(d, lang, now) {
  const st = deadlineState(d, now);
  return { id: d.id, label: pick(d.title, lang), inst: d.inst, ay: AY, date: d.date, start: d.start || null, time: d.time || null,
    display: (d.start ? fmtDate(d.start, lang, { day: 'numeric', month: 'short' }) + ' – ' : '') + fmtDate(d.date, lang) + (d.time ? ', ' + d.time : ''),
    tags: d.tags, applies: d.applies.map((a) => pick(APPLIES_LABEL[a], lang)), appliesKeys: d.applies, basis: d.basis || S[d.cite]?.basis || 'read', source: d.cite ? cite(d.cite) : null, ...st };
}

/* ───────────── facts / context ───────────── */
function parseAmount(s) { const x = String(s).replace(/[^\d.,]/g, ''); if (/[.,]\d{3}(?!\d)/.test(x)) return Number(x.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.')); return Number(x.replace(',', '.')); }

export function extractFacts(text, opt = {}) {
  const n = norm(text), f = {};
  const y = n.match(/20(\d\d)\s*[\/\-]\s*(?:20)?(\d\d)/); if (y) f.ay = `20${y[1]}/${y[2]}`;
  const cfuRe = /(\d{1,3})\s*(?:cfu|crediti|credits?|ects|ක්‍රෙඩිට්)/g; let m;
  while ((m = cfuRe.exec(n))) { const before = n.slice(Math.max(0, m.index - 16), m.index); if (!/(need|needs|require\w*|serv\w*|richied\w*|least|almeno|minimum|minimo|of)\s*$/.test(before)) { f.cfu = Number(m[1]); break; } }
  if (f.cfu === undefined) { const h = n.match(/\b(?:have|got|obtained|passed|earned|ho|ottenuto|superato|currently)\s+(?:only\s+)?(\d{1,3})\b(?!\s*[\/.]\s*\d)/); if (h) f.cfu = Number(h[1]); else if (opt.expectCfu) { const w = n.match(/^\D*(\d{1,3})\D*$/); if (w && n.split(/\s+/).length <= 6) f.cfu = Number(w[1]); } }
  if (/first[\s-]*year|1st year|primo anno|matricola|freshman|පළමු වසර/.test(n)) f.yearBucket = 'first';
  else if (/second[\s-]*year|third[\s-]*year|later year|subsequent|2nd year|3rd year|secondo anno|terzo anno|anni successivi|anno successivo|දෙවන වසර|තෙවන වසර/.test(n)) f.yearBucket = 'later';
  if (/master|magistrale|\blm\b|මාස්ටර්/.test(n)) f.degreeType = 'master';
  else if (/single[\s-]*cycle|ciclo unico/.test(n)) f.degreeType = 'single';
  else if (/bachelor|triennale|උපාධි/.test(n)) f.degreeType = 'bachelor';
  if (/part[\s-]*time|tempo parziale|අර්ධ කාලීන/.test(n)) f.partTime = true; else if (/full[\s-]*time|tempo pieno|පූර්ණ කාලීන/.test(n)) f.partTime = false;
  if (/extra[\s-]*(ue|eu)|non[\s-]*(eu|ue)|outside (the )?eu/.test(n)) f.citizenship = 'extra_eu';
  else if (/refugee|rifugiat|protezione internazionale|stateless|apolid/.test(n)) f.citizenship = 'protected';
  else if (/\beu (student|citizen)|\bue (student|citizen)|cittadin\w* (ue|europe)/.test(n)) f.citizenship = 'eu';
  else if (/italian (citizen|student)|cittadin\w* italian/.test(n)) f.citizenship = 'it';
  if (/(income|family|parents|reddito|famiglia|genitori|ආදායම|පවුල).{0,50}(abroad|overseas|estero|sri lanka|විදේශ)|(abroad|overseas|estero|විදේශ).{0,30}(income|family|reddito|famiglia|ආදායම)/.test(n)) f.familyLocation = 'abroad';
  const iv = n.match(/isee\D{0,12}(\d[\d.,]*)/); if (iv) { const v = parseAmount(iv[1]); if (v > 100) f.iseeValue = v; }
  if (/\bvincitor|\bwinner/.test(n)) f.accommodationStatus = 'winner'; else if (/\bidone|eligible but/.test(n)) f.accommodationStatus = 'idoneo'; else if (/exclud|esclus/.test(n) && /accommod|posto letto|housing|bed/.test(n)) f.accommodationStatus = 'excluded';
  if (/suspend|sospes|අත්හිටු/.test(n)) f.rankingStatus = 'suspended';
  if (/fuori sede|non[\s-]*resident/.test(n)) f.residenceType = 'fuori_sede'; else if (/pendolar|commuter/.test(n)) f.residenceType = 'pendolare'; else if (/\bin sede\b|local resident/.test(n)) f.residenceType = 'in_sede';
  if (/polito|politecnico/.test(n)) f.university = 'polito'; else if (/unito|universita di torino|university of turin/.test(n)) f.university = 'unito';
  return f;
}
export const mergeCtx = (profile = {}, session = {}) => ({ ...profile, ...session });
export const isPersonalised = (p) => !!(p && (p.yearBucket || p.degreeType || p.university || p.citizenship || p.residenceType));
export const detectLang = (text) => (/[\u0D80-\u0DFF]/.test(text) ? 'si' : /\b(che|come|quando|devo|sono|posso|della|nella|borsa|scadenza|crediti|il mio|la mia)\b/i.test(text) ? 'it' : 'en');

/* ───────────── intent detection (multilingual keyword scoring) ───────────── */
const P = (arr) => arr.map(([r, w]) => [r, w]);
const INTENTS = [
  ['ranking', P([[/sospes|suspend|අත්හිටු/, 5], [/graduator|\brank(ing)?s?\b|ශ්‍රේණිග/, 3], [/vincitor|winner|idone|escluso|excluded/, 2]])],
  ['cfu', P([[/\bcfu\b|ක්‍රෙඩිට්/, 4], [/credit|crediti|merit/, 2]])],
  ['isee', P([[/parificat|equalis|equaliz/, 5], [/\bisee\b|\bispe\b/, 4], [/income|reddito|ආදායම/, 3]])],
  ['accommodation', P([[/accommodat|housing|posto letto|alloggio|residenz|dorm|fuori sede|\bbed\b|නවාතැන්|නේවාසික/, 4]])],
  ['payment', P([[/\bpaid\b|payment|instal|\brata\b|\brate\b|pagament|erogaz|ගෙවී|ගෙවීම/, 4], [/\bpay\b/, 3]])],
  ['international', P([[/international|foreign|abroad|extra[\s-]*(ue|eu)|non[\s-]*eu|visa|consular|estero|internazional|straniero|ජාත්‍යන්තර|විදේශ/, 3]])],
  ['transfer', P([[/change (of )?(degree|course|programme|program)|transfer|passaggio|trasferimento|switch (degree|course)|course change/, 5]])],
  ['documents', P([[/document|paperwork|allegat|upload|ලේඛන|ලියකියවිලි/, 4], [/what.*need|cosa serve|di cosa ho bisogno/, 1]])],
  ['notice', P([[/notice|avviso|screenshot|this (pdf|email|message)|explain this/, 4]])],
  ['enrollment', P([[/enrol|immatricol|iscrizion|register at|ලියාපදිංචි/, 3]])],
  ['eligibility', P([[/eligib|qualify|can i get|idone|requisit|posso (avere|ottenere)|සුදුසු/, 4]])],
  ['next', P([[/what (should|do) i do|next step|what now|watching|cosa devo fare|prossim|ඊළඟ/, 4]])],
  ['deadline', P([[/deadline|due date|scadenz|entro quando|when|quando|calendar|අවසාන දින|දිනය|කවදා/, 3]])],
  ['help', P([[/^(hi|hello|ciao|hey|help|aiuto|ආයුබෝවන්)\b/, 6]])],
];
export function detectIntent(text) {
  const n = norm(text) + ' ' + text; let best = { id: 'general', score: 0 };
  for (const [id, pats] of INTENTS) { const s = pats.reduce((a, [r, w]) => a + (r.test(n) ? w : 0), 0); if (s > best.score) best = { id, score: s }; }
  if (/enrol|immatricol|iscrizion|ලියාපදිංචි/.test(n) && /scholarship|borsa|edisu|ශිෂ්‍යත්ව/.test(n) && best.id !== 'documents') best = { id: 'enrollment', score: 9 };
  return best;
}

/* ───────────── rule engine (deterministic) ───────────── */
export const getRule = (id, ay = AY) => RULES.find((r) => r.id === id && r.ay === ay && r.status !== 'draft') || null;
export function cfuCalc(current, required) { const rem = Math.max(0, required - current); return { current, required, remaining: rem, done: current >= required, pct: Math.min(100, Math.round((current / required) * 100)) }; }
export function iseeRoute(p) {
  const c = p.citizenship, fam = p.familyLocation;
  if (!fam && c !== 'protected') return { route: 'unknown' };
  const year = c === 'extra_eu' ? 2025 : c ? 2024 : '2024 / 2025';
  if (c === 'protected') return { route: 'universitario', why: 'protected', year: 2024 };
  if (fam === 'italy') return { route: 'universitario', why: 'family_italy', year };
  if (fam === 'abroad') return { route: 'parificato', why: 'family_abroad', year, consular: true };
  return { route: 'parificato', why: 'family_mixed', year, consular: true, integrated: true };
}
export function iseeCheck(isee, ispe, ay = AY) {
  const li = getRule('r-isee-max', ay), lp = getRule('r-ispe-max', ay);
  if (!li) return { state: 'no_rule' };
  if (isee == null) return { state: 'unknown', limit: li.value, limitIspe: lp.value };
  const okI = isee <= li.value, okP = ispe == null ? null : ispe <= lp.value;
  return { state: !okI || okP === false ? 'not_satisfied' : okP === null ? 'partial' : 'satisfied', okI, okP, limit: li.value, limitIspe: lp.value };
}
// Art. 5 amount tables (general, non-STEM-women columns). Bands: ≤13,153.12 | ≤17,537.50 | ≤23,626.00 | ≤26,306.25
const BANDS = [13153.12, 17537.5, 23626.0, 26306.25];
const AMOUNTS = { in_sede: [3173.68, 2740.16, 2162.13, 1295.08], pendolare: [4669.32, 4040.71, 3202.57, 1945.36], fuori_sede: [8096.78, 7021.11, 5586.89, 3800.0], fuori_sede_bed: [5396.78, 4321.11, 2886.89, 1100.0] };
const PT = { in_sede: 606, pendolare: 775, fuori_sede: 1409 };
export function scholarshipAmount({ isee, type, partTime, withBed }) {
  if (!type || type === 'unknown') return null;
  if (partTime) return { amount: PT[type], note: 'part_time' };
  if (isee == null || isee > BANDS[3]) return null;
  const i = BANDS.findIndex((b) => isee <= b), key = type === 'fuori_sede' && withBed ? 'fuori_sede_bed' : type;
  return { amount: AMOUNTS[key][i], band: i, bed: key === 'fuori_sede_bed', note: 'full_time' };
}
export function appliesTo(d, p) {
  if (d.applies.includes('all')) return true;
  const s = new Set();
  if (p.yearBucket === 'first') s.add(p.degreeType === 'master' ? 'first_year_master' : 'first_year_bs');
  if (p.yearBucket === 'later') s.add('later');
  if (p.accommodationRequested || p.accommodationStatus === 'winner' || p.accommodationStatus === 'idoneo') s.add('accommodation');
  if (p.residenceType === 'fuori_sede') s.add('fuori_sede');
  if (p.rankingStatus === 'suspended') s.add('suspended');
  if (p.citizenship === 'eu' || p.citizenship === 'extra_eu' || p.familyLocation === 'abroad') s.add('international');
  if (p.scholarshipApplied) s.add('winners');
  if (p.university === 'polito') s.add('polito');
  return d.applies.some((x) => s.has(x));
}
export function listDeadlines({ filter = 'all', profile = {}, now = new Date(), lang = 'en' } = {}) {
  const all = DEADLINES.map((d) => ({ ...dl(d, lang, now), _d: d, relevant: isPersonalised(profile) && appliesTo(d, profile) }));
  const f = (x) => filter === 'all' || (filter === 'edisu' ? x.inst === 'edisu' : filter === 'polito' ? x.inst === 'polito' : filter === 'personal' ? x.relevant : x.tags.includes(filter));
  return all.filter(f).sort((a, b) => a.date.localeCompare(b.date));
}

/* ───────────── retrieval (hard academic-year filter) ───────────── */
export function retrieve({ ay = AY, topics = [], inst, limit = 4, includeDemo = false } = {}) {
  return CHUNKS.filter((c) => c.ay === ay && (includeDemo || c.basis !== 'demo') && (!inst || c.inst === inst))
    .map((c) => ({ c, s: topics.filter((x) => c.topics.includes(x)).length })).filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.c);
}
export const chunkText = (c, lang) => ({ text: c.text[lang] || c.text.en, fallback: !c.text[lang] });
const explain = (chunks, lang) => chunks.map((c) => chunkText(c, lang)).map((x) => x.text);
const srcs = (...keys) => keys.map(cite);
export function confidenceOf(sources, forced) {
  if (forced) return forced;
  if (!sources.length) return 'none';
  if (new Set(sources.map((s) => s.institution)).size > 1) return 'multiple';
  const b = sources[0].basis; return b === 'read' ? 'verified' : b === 'summary' ? 'summary' : 'unclear';
}

/* ───────────── response helpers ───────────── */
const chip = (label, set) => ({ label, set });
const yearQ = (T) => ({ key: 'yearBucket', text: T('q.year'), chips: [chip(T('chip.first'), { yearBucket: 'first' }), chip(T('chip.later'), { yearBucket: 'later' })] });
const kindQ = (T) => ({ key: 'degreeType', text: T('q.degree'), chips: [chip(T('chip.bachelor'), { degreeType: 'bachelor' }), chip(T('chip.master'), { degreeType: 'master' }), chip(T('chip.single'), { degreeType: 'single' })] });
const citizenQ = (T) => ({ key: 'citizenship', text: T('q.citizen'), chips: [chip(T('chip.it'), { citizenship: 'it' }), chip(T('chip.eu'), { citizenship: 'eu' }), chip(T('chip.extra_eu'), { citizenship: 'extra_eu' }), chip(T('chip.protected'), { citizenship: 'protected' })] });
const famQ = (T) => ({ key: 'familyLocation', text: T('q.family'), chips: [chip(T('chip.fam_italy'), { familyLocation: 'italy' }), chip(T('chip.fam_abroad'), { familyLocation: 'abroad' }), chip(T('chip.fam_mixed'), { familyLocation: 'mixed' })] });
function base(type, lang, o) { return { type, ay: AY, lang, status: { tone: 'info', label: '' }, headline: '', summary: '', metrics: [], next_actions: [], explanation: [], sources: [], questions: [], ...o }; }
const st = (T, tone, key) => ({ tone, label: T(key) });

/* ───────────── builders ───────────── */
function bCfu(c, lang, now) {
  const T = (k, v) => t(lang, k, v), r = base('cfu_requirement', lang, { kicker: T('k.cfu') });
  const rule = getRule(c.partTime ? 'r-cfu-first-pt' : 'r-cfu-first-ft');
  const later = c.yearBucket === 'later';
  if (later) {
    const req = c.cfuRequired, cur = c.cfu, ded = getRule('r-cfu-later');
    r.sources = srcs('laterMerit', 'firstYearMerit'); r.explanation = explain(retrieve({ topics: ['merit'], limit: 2 }).filter((x) => x.id === 'c-later-merit'), lang);
    r.deadline = { ...dl({ id: 'x', inst: 'edisu', date: ded.deadline, tags: [], applies: ['all'], title: { en: T('cfu.later_deadline') }, cite: 'laterMerit' }, lang, now) };
    r.metrics = [{ label: T('m.deadline'), value: fmtDate(ded.deadline, lang) }];
    if (req != null && cur != null) {
      const k = cfuCalc(cur, req); r.progress = k; r.metrics = [{ label: T('m.current'), value: String(cur) }, { label: T('m.required'), value: String(req), note: T('m.user_supplied') }, { label: T('m.remaining'), value: String(k.remaining) }, r.metrics[0]];
      r.status = k.done ? st(T, 'satisfied', 'st.appears_satisfied') : st(T, 'problem', 'st.not_satisfied');
      r.headline = k.done ? T('cfu.later_ok') : T('cfu.remaining', { n: k.remaining }); r.summary = T('cfu.later_sum', { req });
      r.next_actions = [{ text: k.done ? T('act.keep_docs') : T('act.check_bonus') }, { text: T('act.ticket') }];
    } else {
      r.status = st(T, 'unknown', 'st.cannot_confirm'); r.headline = T('cfu.later_headline'); r.summary = T('cfu.later_need');
      r.questions = [{ key: 'cfuRequired', type: 'number', text: T('q.cfu_required'), placeholder: '60', also: cur == null ? { key: 'cfu', text: T('q.cfu_now') } : null }];
      r.next_actions = [{ text: T('act.open_art15') }]; r.confidence = 'unclear';
    }
    return r;
  }
  r.sources = srcs('firstYearMerit', 'firstYearMeritBando'); r.explanation = explain(retrieve({ topics: ['merit'], limit: 3 }).filter((x) => x.id === 'c-first-merit'), lang);
  r.explanation.push(T('cfu.deferral'));
  const req = rule.value, D = rule.deadline; r.deadline = dl({ id: 'd-cfu', inst: 'edisu', date: D, tags: [], applies: ['first_year_bs', 'first_year_master'], title: { en: T('cfu.deadline_label') }, cite: 'firstYearMerit', basis: 'summary' }, lang, now);
  r.metrics = [{ label: T('m.required'), value: String(req) }];
  r.assumption = c.partTime === undefined ? { text: T('cfu.assume_ft'), chip: chip(T('chip.parttime'), { partTime: true }) } : null;
  if (c.yearBucket !== 'first') r.questions.push(yearQ(T));
  if (c.cfu == null) {
    r.status = st(T, 'info', 'st.info'); r.headline = T('cfu.need', { n: req }); r.summary = T('cfu.summary_unknown', { n: req, d: fmtDate(D, lang) });
    r.questions.push({ key: 'cfu', type: 'number', text: T('q.cfu_now'), placeholder: '14' });
    r.next_actions = [{ text: T('act.tell_cfu') }];
  } else {
    const k = cfuCalc(c.cfu, req); r.progress = k;
    r.metrics = [{ label: T('m.current'), value: String(k.current) }, { label: T('m.required'), value: String(req) }, { label: T('m.remaining'), value: String(k.remaining) }];
    r.status = k.done ? st(T, 'satisfied', 'st.appears_satisfied') : st(T, 'action', 'st.action_required');
    r.headline = k.done ? T('cfu.reached') : T('cfu.remaining', { n: k.remaining }); r.summary = T('cfu.summary', { n: req, d: fmtDate(D, lang) });
    r.next_actions = k.done ? [{ text: T('act.keep_docs') }] : [{ text: T('act.get_cfu', { n: k.remaining }), due: D }];
  }
  r.consequence = T('cfu.consequence'); return r;
}

function bDeadline(c, lang, now, { text = '' } = {}) {
  const T = (k, v) => t(lang, k, v), r = base('deadline', lang, { kicker: T('k.deadline') });
  const pers = isPersonalised(c), list = listDeadlines({ filter: pers ? 'personal' : 'all', profile: c, now, lang }).filter((d) => d.state !== 'passed');
  const use = pers && list.length ? list : list.filter((d) => d.appliesKeys.includes('all'));
  const first = use[0]; if (!first) { r.status = st(T, 'unknown', 'st.cannot_confirm'); r.headline = T('dl.none'); r.summary = T('dl.none_sum'); return r; }
  r.deadline = first; r.status = first.daysLeft <= 7 ? st(T, 'action', 'st.action_required') : st(T, 'info', 'st.info');
  r.headline = first.label; r.summary = first.state === 'today' ? T('dl.today') : T('dl.in_days', { n: first.daysLeft });
  r.timeline = use.slice(0, 6).map((d) => ({ date: d.date, display: d.display, label: d.label, state: d.state, daysLeft: d.daysLeft, inst: d.inst }));
  r.metrics = [{ label: T('m.institution'), value: first.inst === 'polito' ? 'PoliTO' : 'EDISU' }, { label: T('m.applies'), value: first.applies.join(', ') }, { label: T('m.academic_year'), value: AY }];
  r.next_actions = [{ text: T('act.open_deadlines') }]; r.cta = { route: 'deadlines', label: T('btn.all_deadlines') };
  r.sources = first.source ? [first.source] : srcs('deadlines');
  if (!pers) r.questions = [{ key: '_situation', text: T('q.personalise'), chips: [{ label: T('btn.situation'), route: 'situation' }] }];
  r.explanation = explain(retrieve({ topics: ['deadlines'], limit: 1 }), lang); return r;
}

function bEligibility(c, lang, now) {
  const T = (k, v) => t(lang, k, v), r = base('eligibility', lang, { kicker: T('k.eligibility') }); r.checks = [];
  const closed = todayISO(now) > '2026-09-04';
  r.checks.push({ label: T('chk.window'), state: closed ? 'info' : 'ok', note: closed ? T('chk.window_closed') : T('chk.window_open') });
  const route = iseeRoute(c), lim = iseeCheck(c.iseeValue, c.ispeValue);
  if (route.route === 'unknown') r.checks.push({ label: T('chk.econ'), state: 'unknown', note: T('chk.econ_need') });
  else if (route.route === 'parificato') r.checks.push({ label: T('chk.econ'), state: 'action', note: T('chk.econ_parificato', { y: route.year }) });
  else if (lim.state === 'unknown') r.checks.push({ label: T('chk.econ'), state: 'unknown', note: T('chk.econ_limit', { n: fmtEUR(lim.limit, lang) }) });
  else if (lim.state === 'not_satisfied') r.checks.push({ label: T('chk.econ'), state: 'bad', note: T('chk.econ_over', { n: fmtEUR(lim.limit, lang) }) });
  else r.checks.push({ label: T('chk.econ'), state: 'ok', note: T('chk.econ_ok', { n: fmtEUR(lim.limit, lang) }) });
  if (c.yearBucket === 'first') r.checks.push({ label: T('chk.merit'), state: 'ok', note: T('chk.merit_first') });
  else if (c.yearBucket === 'later') r.checks.push({ label: T('chk.merit'), state: 'unknown', note: T('chk.merit_later') });
  else r.checks.push({ label: T('chk.merit'), state: 'unknown', note: T('chk.merit_need') });
  const worst = r.checks.some((x) => x.state === 'bad') ? 'bad' : r.checks.some((x) => x.state === 'unknown') ? 'unknown' : r.checks.some((x) => x.state === 'action') ? 'action' : 'ok';
  r.status = worst === 'bad' ? st(T, 'problem', 'st.not_satisfied') : worst === 'unknown' ? st(T, 'unknown', 'st.needs_info') : worst === 'action' ? st(T, 'action', 'st.action_required') : st(T, 'info', 'st.potentially');
  r.headline = worst === 'bad' ? T('el.bad') : worst === 'unknown' ? T('el.unknown') : T('el.potential'); r.summary = T('el.sum');
  if (!c.yearBucket) r.questions.push(yearQ(T)); if (!c.citizenship) r.questions.push(citizenQ(T)); if (c.citizenship && !c.familyLocation && c.citizenship !== 'protected') r.questions.push(famQ(T));
  r.next_actions = [{ text: closed ? T('act.check_receipt') : T('act.apply_by', { d: fmtDate('2026-09-04', lang) }) }, { text: T('act.situation_full') }];
  r.cta = { route: 'situation', label: T('btn.situation') }; r.sources = srcs('isee', 'firstYearMerit', 'nonAdmission'); r.explanation = explain(retrieve({ topics: ['eligibility', 'isee'], limit: 2 }), lang); return r;
}

function bRanking(c, lang, now, { text = '' } = {}) {
  const T = (k, v) => t(lang, k, v), susp = c.rankingStatus === 'suspended' || /sospes|suspend|අත්හිටු/.test(norm(text) + text);
  const r = base('ranking_status', lang, { kicker: T('k.ranking') }), ids = susp ? ['d-def-gen', 'd-sus-prov', 'd-sus-compl', 'd-sus-def'] : ['d-acc-def', 'd-sch-prov', 'd-def-fy', 'd-def-gen'];
  const tl = ids.map((id) => dl(DEADLINES.find((d) => d.id === id), lang, now)); const nxt = tl.find((d) => d.state !== 'passed');
  r.timeline = tl.map((d) => ({ date: d.date, display: d.display, label: d.label, state: d.state, daysLeft: d.daysLeft, inst: d.inst })); if (nxt) r.deadline = nxt;
  r.glossary = [{ it: 'Sospeso', en: T('gl.suspended') }, { it: 'Graduatoria', en: T('gl.ranking') }, { it: 'Reclamo', en: T('gl.complaint') }];
  if (susp) {
    r.status = st(T, 'action', 'st.action_required'); r.headline = T('rk.susp_headline'); r.summary = T('rk.susp_sum');
    r.sections = [{ heading: T('rk.means'), items: [T('rk.means1'), T('rk.means2')] }, { heading: T('rk.why'), items: [T('rk.why1'), T('rk.why2')] }, { heading: T('rk.check'), items: [T('rk.check1'), T('rk.check2'), T('rk.check3')] }];
    r.next_actions = [{ text: T('act.read_reason') }, { text: T('act.complain', { d: fmtDate('2027-04-02', lang) }), due: '2027-04-02' }, { text: T('act.bed_susp') }];
    r.sources = srcs('deadlines', 'suspended', 'suspendedBed'); r.explanation = explain(retrieve({ topics: ['suspended'], limit: 1 }), lang);
  } else {
    r.status = st(T, 'info', 'st.info'); r.headline = T('rk.dates_headline'); r.summary = T('rk.dates_sum');
    r.next_actions = [{ text: T('act.check_sportello') }, { text: T('act.complain_data') }];
    r.sources = srcs('deadlines'); r.explanation = explain(retrieve({ topics: ['ranking'], limit: 2 }), lang);
    r.questions = [{ key: 'rankingStatus', text: T('q.rank_status'), chips: [chip(T('chip.suspended'), { rankingStatus: 'suspended' }), chip(T('chip.winner'), { rankingStatus: 'winner' }), chip(T('chip.idoneo'), { rankingStatus: 'idoneo' }), chip(T('chip.excluded'), { rankingStatus: 'excluded' })] }];
    if (c.rankingStatus === 'winner' || c.rankingStatus === 'idoneo' || c.rankingStatus === 'excluded') { r.status = st(T, c.rankingStatus === 'excluded' ? 'problem' : 'satisfied', 'st.' + c.rankingStatus); r.headline = T('rk.' + c.rankingStatus); r.questions = []; r.next_actions = [{ text: T('act.rk_' + c.rankingStatus) }]; }
  }
  return r;
}

function bAccommodation(c, lang, now) {
  const T = (k, v) => t(lang, k, v), r = base('accommodation', lang, { kicker: T('k.accommodation') }), a = c.accommodationStatus;
  const ids = ['d-acc-prov', 'd-acc-compl', 'd-acc-def', 'd-acc-accept', 'd-lodging-gen'];
  const tl = ids.map((id) => dl(DEADLINES.find((d) => d.id === id), lang, now)); r.timeline = tl.map((d) => ({ date: d.date, display: d.display, label: d.label, state: d.state, daysLeft: d.daysLeft, inst: d.inst }));
  const acc = tl.find((d) => d.id === 'd-acc-accept'); r.deadline = acc.state === 'passed' ? tl.find((d) => d.id === 'd-lodging-gen') : acc;
  r.sources = srcs('deadlines', 'bedAccept', 'amountsFs', 'studentType'); r.explanation = explain(retrieve({ topics: ['accommodation'], limit: 3 }), lang);
  r.metrics = [{ label: T('m.residence'), value: c.residenceType ? T('res.' + c.residenceType) : '—' }, { label: T('m.bed_status'), value: a ? T('acc.' + a) : '—' }];
  if (!a || a === 'unknown') {
    r.status = st(T, 'accommodation', 'st.needs_info'); r.headline = T('ac.need'); r.summary = T('ac.need_sum');
    r.questions = [{ key: 'accommodationStatus', text: T('q.acc_status'), chips: [chip(T('chip.winner'), { accommodationStatus: 'winner', accommodationRequested: true }), chip(T('chip.idoneo'), { accommodationStatus: 'idoneo', accommodationRequested: true }), chip(T('chip.excluded'), { accommodationStatus: 'excluded', accommodationRequested: true }), chip(T('chip.no_bed'), { accommodationStatus: 'not_applied' })] }];
    r.next_actions = [{ text: T('act.check_bed_rank') }];
  } else if (a === 'winner') { r.status = st(T, 'accommodation', 'st.action_required'); r.headline = T('ac.winner'); r.summary = T('ac.winner_sum'); r.next_actions = [{ text: T('act.accept_bed'), due: '2026-09-29' }, { text: T('act.decline_warn') }]; }
  else if (a === 'idoneo') { r.status = st(T, 'accommodation', 'st.action_required'); r.headline = T('ac.idoneo'); r.summary = T('ac.idoneo_sum'); r.next_actions = [{ text: T('act.declare_interest'), due: '2026-09-29' }, { text: T('act.lodging_backup', { d: fmtDate('2026-11-19', lang) }), due: '2026-11-19' }]; }
  else if (a === 'excluded') { r.status = st(T, 'accommodation', 'st.info'); r.headline = T('ac.excluded'); r.summary = T('ac.excluded_sum'); r.next_actions = [{ text: T('act.lodging_decl', { d: fmtDate('2026-11-19', lang) }), due: '2026-11-19' }]; }
  else { r.status = st(T, 'unknown', 'st.info'); r.headline = T('ac.none'); r.summary = T('ac.none_sum'); r.next_actions = [{ text: c.residenceType === 'fuori_sede' ? T('act.lodging_decl', { d: fmtDate('2026-11-19', lang) }) : T('act.no_action') }]; }
  return r;
}

function bPayment(c, lang, now) {
  const T = (k, v) => t(lang, k, v), r = base('payment', lang, { kicker: T('k.payment') });
  r.status = st(T, 'unknown', 'st.cannot_confirm'); r.headline = T('pay.headline'); r.summary = T('pay.sum'); r.confidence = 'unclear';
  const amt = scholarshipAmount({ isee: c.iseeValue, type: c.residenceType, partTime: c.partTime, withBed: c.accommodationStatus === 'winner' });
  r.metrics = [{ label: T('m.second_inst'), value: c.partTime ? T('pay.cond_pt') : T('pay.cond_ft') }];
  if (amt) r.metrics.push({ label: T('m.indicative'), value: fmtEUR(amt.amount, lang), note: T(amt.bed ? 'pay.amt_bed' : 'pay.amt_note') });
  r.next_actions = [{ text: T('act.read_pay') }, { text: T('act.ticket') }]; r.sources = srcs('payment', 'firstYearMerit', 'amountsFs');
  r.explanation = explain(retrieve({ topics: ['payment'], limit: 1 }), lang); r.cta = { route: 'ask', ask: T('sug.cfu'), label: T('btn.check_cfu') };
  if (!amt && !c.iseeValue) r.questions = [{ key: 'iseeValue', type: 'number', text: T('q.isee_value'), placeholder: '18000' }]; return r;
}

function bIsee(c, lang, now) {
  const T = (k, v) => t(lang, k, v), r = base('isee', lang, { kicker: T('k.isee') }), route = iseeRoute(c);
  r.sources = srcs('isee', 'iseeTable', 'parificato'); r.explanation = explain(retrieve({ topics: ['isee', 'parificato'], limit: 3 }), lang);
  const lim = iseeCheck(c.iseeValue, c.ispeValue);
  r.metrics = [{ label: T('m.isee_limit'), value: fmtEUR(lim.limit, lang) }, { label: T('m.ispe_limit'), value: fmtEUR(lim.limitIspe, lang) }];
  if (route.route === 'unknown') {
    r.status = st(T, 'info', 'st.info'); r.headline = T('is.headline'); r.summary = T('is.sum'); r.next_actions = [{ text: T('act.pick_route') }];
    if (!c.citizenship) r.questions.push(citizenQ(T)); if (!c.familyLocation && c.citizenship !== 'protected') r.questions.push(famQ(T));
  } else if (route.route === 'universitario') {
    r.status = st(T, 'info', 'st.info'); r.headline = T('is.univ'); r.summary = T('is.univ_sum', { y: route.year });
    r.next_actions = [{ text: T('act.get_isee') }, { text: T('act.quadro_c') }];
    if (lim.state !== 'unknown') { const ok = lim.state !== 'not_satisfied'; r.metrics.push({ label: T('m.your_isee'), value: fmtEUR(c.iseeValue, lang) }); r.status = st(T, ok ? 'satisfied' : 'problem', ok ? 'st.appears_satisfied' : 'st.not_satisfied'); r.headline = ok ? T('is.within') : T('is.over'); }
  } else {
    r.status = st(T, 'action', 'st.action_required'); r.headline = T('is.par'); r.summary = T(route.integrated ? 'is.par_mixed' : 'is.par_sum', { y: route.year });
    r.metrics.push({ label: T('m.income_year'), value: String(route.year) });
    r.next_actions = [{ text: T('act.consular') }, { text: T('act.only_edisu') }, { text: T('act.pdf_limit') }]; r.glossary = [{ it: 'ISEE Parificato', en: T('gl.parificato') }, { it: 'Documentazione consolare', en: T('gl.consular') }];
  }
  return r;
}

function bInternational(c, lang, now) {
  const T = (k, v) => t(lang, k, v), r = base('international', lang, { kicker: T('k.international') }), route = iseeRoute(c);
  r.status = st(T, 'action', 'st.action_required'); r.headline = T('in.headline'); r.summary = T('in.sum');
  r.metrics = [{ label: T('m.route'), value: route.route === 'parificato' ? T('rt.par') : route.route === 'universitario' ? T('rt.univ') : T('rt.unknown') }, { label: T('m.access'), value: T('in.access') }, { label: T('m.income_year'), value: route.year ? String(route.year) : '2024 / 2025' }];
  r.next_actions = [{ text: T('act.temp_code') }, { text: T('act.consular') }, { text: T('act.visa_d') }, { text: T('act.annex_f') }];
  if (!c.citizenship) r.questions.push(citizenQ(T)); if (c.citizenship && c.citizenship !== 'protected' && !c.familyLocation) r.questions.push(famQ(T));
  r.deadline = dl(DEADLINES.find((d) => d.id === 'd-code'), lang, now); r.confidence = undefined;
  r.sources = srcs('tempCode', 'iseeTable', 'intl'); r.explanation = explain(retrieve({ topics: ['international'], limit: 2 }), lang); return r;
}

function bDocuments(c, lang, now, { text = '' } = {}) {
  const T = (k, v) => t(lang, k, v), r = base('documents_checklist', lang, { kicker: T('k.documents') }), route = iseeRoute(c), n = norm(text);
  r.status = st(T, 'info', 'st.info'); r.headline = T('doc.headline'); r.summary = T('doc.sum');
  const items = [T('doc.isee'), T('doc.access')]; if (route.route === 'parificato') items.push(T('doc.consular')); if (c.citizenship === 'extra_eu' || c.citizenship === 'eu') items.push(T('doc.visa'));
  items.push(T('doc.cu'), T('doc.iban')); if (c.residenceType === 'fuori_sede') items.push(T('doc.lodging')); r.next_actions = items.map((x) => ({ text: x }));
  r.sources = srcs('isee', 'tempCode', 'parificato'); r.explanation = explain(retrieve({ topics: ['documents'], limit: 1 }), lang);
  if (/polito|enrol|immatricol|ලියාපදිංචි/.test(n + text)) r.sections = [{ heading: T('sec.polito'), items: [T('doc.polito_missing')], sources: srcs('politoReg') }];
  r.cta = { route: 'documents', label: T('btn.upload') }; return r;
}

function bEnrollment(c, lang, now) {
  const T = (k, v) => t(lang, k, v), r = base('dual_institution', lang, { kicker: T('k.enrollment') });
  r.status = st(T, 'info', 'st.multiple'); r.headline = T('en.headline'); r.summary = T('en.sum'); r.confidence = 'multiple';
  const pol = retrieve({ topics: ['polito'], inst: 'polito', limit: 2 }), ed = retrieve({ topics: ['enrollment'], inst: 'edisu', limit: 2 });
  r.sections = [
    { heading: T('sec.edisu'), tone: 'edisu', items: explain(ed, lang), sources: srcs('partTime', 'enrolMaster') },
    { heading: T('sec.polito'), tone: 'polito', items: explain(pol, lang), sources: srcs('politoArch', 'politoEng', 'politoReg') },
    { heading: T('sec.interplay'), tone: 'info', items: [T('en.i1'), T('en.i2')], sources: [] }];
  const dls = ['d-polito-e1', 'd-polito-e2', 'd-enrol-nov'].map((id) => dl(DEADLINES.find((d) => d.id === id), lang, now)).sort((a, b) => a.date.localeCompare(b.date));
  r.timeline = dls.map((d) => ({ date: d.date, display: d.display, label: d.label, state: d.state, daysLeft: d.daysLeft, inst: d.inst })); r.deadline = dls.find((d) => d.state !== 'passed') || dls[dls.length - 1];
  r.next_actions = [{ text: T('act.enrol_before') }, { text: T('act.polito_check') }, { text: T('act.read_art11') }];
  r.sources = [...srcs('partTime', 'enrolMaster'), ...srcs('politoArch')]; return r;
}

function bTransfer(c, lang) {
  const T = (k, v) => t(lang, k, v), r = base('general_rule', lang, { kicker: T('k.rule') });
  r.status = st(T, 'action', 'st.action_required'); r.headline = T('tr.headline'); r.summary = T('tr.sum');
  r.metrics = [{ label: T('m.key1'), value: T('tr.k1') }, { label: T('m.key2'), value: T('tr.k2') }, { label: T('m.key3'), value: T('tr.k3') }];
  r.next_actions = [{ text: T('act.before_transfer') }, { text: T('act.ticket') }]; r.sources = srcs('exclusion', 'nonAdmission', 'transfer'); r.explanation = explain(retrieve({ topics: ['transfer'], limit: 1 }), lang); return r;
}

function bNext(c, lang, now) {
  const T = (k, v) => t(lang, k, v), r = base('next_steps', lang, { kicker: T('k.next') });
  if (!isPersonalised(c)) { r.status = st(T, 'unknown', 'st.needs_info'); r.headline = T('nx.need'); r.summary = T('nx.need_sum'); r.questions = [yearQ(T), kindQ(T)]; r.cta = { route: 'situation', label: T('btn.situation') }; r.sources = srcs('deadlines'); r.confidence = 'more_info'; return r; }
  const a = nextActions(c, lang, now).slice(0, 5); r.status = st(T, a.length ? 'action' : 'satisfied', a.length ? 'st.action_required' : 'st.appears_satisfied'); r.headline = a.length ? T('nx.headline', { n: a.length }) : T('nx.none'); r.summary = T('nx.sum');
  r.next_actions = a; const first = a.find((x) => x.due); if (first) r.deadline = { label: first.text, date: first.due, display: fmtDate(first.due, lang), ...deadlineState({ date: first.due }, now), source: cite('deadlines') };
  r.sources = srcs('deadlines', 'firstYearMerit'); r.cta = { route: 'deadlines', label: T('btn.all_deadlines') }; return r;
}

function bHelp(c, lang) { const T = (k) => t(lang, k), r = base('help', lang, { kicker: 'Ruka' }); r.status = st(T, 'info', 'st.info'); r.headline = T('help.headline'); r.summary = T('help.sum'); r.sources = []; r.confidence = 'verified'; return r; }
function bNotice(c, lang) { const T = (k) => t(lang, k), r = base('upload_prompt', lang, { kicker: T('k.documents') }); r.status = st(T, 'info', 'st.info'); r.headline = T('notice.headline'); r.summary = T('notice.sum'); r.next_actions = [{ text: T('notice.a1') }, { text: T('notice.a2') }]; r.cta = { route: 'documents', label: T('btn.upload') }; r.sources = []; r.confidence = 'verified'; return r; }

function bGeneral(c, lang, now, { text = '' } = {}) {
  const T = (k, v) => t(lang, k, v), hits = searchTopics(text, lang, 1);
  if (hits.length && hits[0].kind === 'glossary' && hits[0].score >= 3) {
    const g = hits[0].item, r = base('general_rule', lang, { kicker: T('k.rule') }); r.status = st(T, 'info', 'st.info'); r.headline = `${g.it} — ${g[lang] || g.en}`; r.summary = g.def[lang] || g.def.en;
    r.glossary = [{ it: g.it, en: g[lang] || g.en }]; r.sources = srcs('deadlines'); r.next_actions = [{ text: T('act.ask_more') }]; r.confidence = 'verified'; return r;
  }
  return bUnknown(c, lang, now);
}
function bUnknown(c, lang) {
  const T = (k, v) => t(lang, k, v), r = base('no_source', lang, { kicker: 'Ruka' }); r.status = st(T, 'unknown', 'st.cannot_confirm'); r.headline = T('un.headline'); r.summary = T('un.sum'); r.confidence = 'none'; r.sources = [];
  r.next_actions = [{ text: T('un.a1') }, { text: T('un.a2') }]; r.suggestions = ['sug.cfu', 'sug.rank', 'sug.docs', 'sug.next'].map(T); return r;
}
function bYearMismatch(c, lang) {
  const T = (k, v) => t(lang, k, v), r = base('year_mismatch', lang, { kicker: 'Ruka', ay: c.ay }); r.status = st(T, 'unknown', 'st.cannot_confirm'); r.headline = T('ym.headline', { y: c.ay }); r.summary = T('ym.sum', { y: c.ay, cur: AY }); r.confidence = 'none'; r.sources = [];
  r.next_actions = [{ text: T('ym.a1') }, { text: T('ym.a2', { cur: AY }) }]; r.questions = [{ key: 'ay', text: T('ym.q', { cur: AY }), chips: [chip(T('ym.use', { cur: AY }), { ay: AY })] }]; return r;
}

export const BUILDERS = { cfu: bCfu, deadline: bDeadline, eligibility: bEligibility, ranking: bRanking, accommodation: bAccommodation, payment: bPayment, isee: bIsee, international: bInternational, documents: bDocuments, enrollment: bEnrollment, transfer: bTransfer, next: bNext, help: bHelp, notice: bNotice, general: bGeneral };

/* ───────────── next actions & situation ───────────── */
export function nextActions(p, lang = 'en', now = new Date()) {
  const T = (k, v) => t(lang, k, v), td = todayISO(now), out = [];
  const add = (text, due, pr, tone) => { if (!due || due >= td) out.push({ text, due: due || null, priority: pr, tone: tone || 'action' }); };
  const a = p.accommodationStatus;
  if (p.accommodationRequested || a === 'winner' || a === 'idoneo') {
    if (a === 'winner') add(T('act.accept_bed'), '2026-09-29', 1, 'accommodation'); else if (a === 'idoneo') add(T('act.declare_interest'), '2026-09-29', 1, 'accommodation'); else if (!a || a === 'unknown') add(T('act.check_bed_rank'), '2026-09-29', 1, 'accommodation');
  }
  if (p.residenceType === 'fuori_sede' && a !== 'winner' && p.scholarshipApplied !== false) { const d = p.yearBucket === 'first' && p.degreeType !== 'master' ? '2026-11-04' : '2026-11-19'; add(T('act.lodging_decl', { d: fmtDate(d, lang) }), d, 2, 'accommodation'); }
  if (p.scholarshipApplied) {
    add(T('act.check_prov'), '2026-10-21', 2, 'info');
    const cd = p.yearBucket === 'first' && p.degreeType !== 'master' ? '2026-10-28' : '2026-11-12'; add(T('act.complain', { d: fmtDate(cd, lang) }), cd, 2);
    add(T('act.residence_note'), '2026-11-12', 3, 'info');
  }
  if (p.yearBucket === 'first') add(T('act.enrol_before_d', { d: fmtDate('2026-11-30', lang) }), '2026-11-30', p.degreeType === 'master' ? 1 : 3);
  if (p.yearBucket === 'first' && p.cfu != null) { const req = getRule(p.partTime ? 'r-cfu-first-pt' : 'r-cfu-first-ft').value, k = cfuCalc(p.cfu, req); if (!k.done) add(T('act.get_cfu', { n: k.remaining }), '2027-08-10', 2); }
  if (p.yearBucket === 'first' && p.cfu == null) add(T('act.tell_cfu'), '2027-08-10', 3, 'info');
  if (p.rankingStatus === 'suspended') { add(T('act.read_reason'), '2026-12-16', 1); add(T('act.complain', { d: fmtDate('2027-04-02', lang) }), '2027-04-02', 2); }
  const rt = iseeRoute(p); if (rt.route === 'parificato' && p.scholarshipApplied) add(T('act.parificato_fix'), '2026-11-12', 1);
  if ((p.citizenship === 'extra_eu' || p.citizenship === 'eu') && p.scholarshipApplied) add(T('act.visa_d'), null, 3, 'info');
  if (p.scholarshipApplied) add(T('act.stay_enrolled'), '2027-06-01', 4, 'info');
  return out.sort((x, y) => (x.due || '9999').localeCompare(y.due || '9999') || x.priority - y.priority);
}

export function computeSituation(p, lang = 'en', now = new Date()) {
  const T = (k, v) => t(lang, k, v), cards = [], td = todayISO(now);
  const route = iseeRoute(p), lim = iseeCheck(p.iseeValue, p.ispeValue);
  // Scholarship
  if (p.scholarshipApplied === false) cards.push({ id: 'scholarship', title: T('k.scholarship'), tone: 'problem', label: T('st.window_closed'), detail: T('sit.notapplied') });
  else cards.push({ id: 'scholarship', title: T('k.scholarship'), tone: lim.state === 'not_satisfied' ? 'problem' : 'info', label: lim.state === 'not_satisfied' ? T('st.not_satisfied') : T('st.potentially'), detail: T('sit.sch_detail') });
  // Merit
  if (p.yearBucket === 'first') { const rule = getRule(p.partTime ? 'r-cfu-first-pt' : 'r-cfu-first-ft'); if (p.cfu != null) { const k = cfuCalc(p.cfu, rule.value); cards.push({ id: 'merit', title: T('k.merit'), tone: k.done ? 'satisfied' : 'action', label: `${k.current} / ${k.required} CFU`, detail: k.done ? T('st.appears_satisfied') : T('sit.remaining', { n: k.remaining }), progress: k }); } else cards.push({ id: 'merit', title: T('k.merit'), tone: 'unknown', label: T('st.needs_info'), detail: T('sit.merit_need', { n: rule.value }) }); }
  else if (p.yearBucket === 'later') cards.push({ id: 'merit', title: T('k.merit'), tone: 'unknown', label: T('st.cannot_confirm'), detail: T('sit.merit_later') });
  // ISEE
  if (route.route === 'parificato') cards.push({ id: 'isee', title: 'ISEE', tone: 'action', label: 'ISEE Parificato', detail: T('sit.par', { y: route.year }) });
  else if (route.route === 'universitario') cards.push({ id: 'isee', title: 'ISEE', tone: lim.state === 'not_satisfied' ? 'problem' : lim.state === 'unknown' ? 'info' : 'satisfied', label: lim.state === 'unknown' ? 'ISEE Universitario' : lim.state === 'not_satisfied' ? T('st.not_satisfied') : T('st.appears_satisfied'), detail: lim.state === 'unknown' ? T('sit.univ', { n: fmtEUR(lim.limit, lang) }) : T('sit.isee_val', { v: fmtEUR(p.iseeValue, lang), n: fmtEUR(lim.limit, lang) }) });
  else cards.push({ id: 'isee', title: 'ISEE', tone: 'unknown', label: T('st.needs_info'), detail: T('sit.isee_need') });
  // Accommodation
  if (p.accommodationRequested || p.accommodationStatus === 'winner' || p.accommodationStatus === 'idoneo') cards.push({ id: 'accommodation', title: T('k.accommodation'), tone: 'accommodation', label: p.accommodationStatus && p.accommodationStatus !== 'unknown' ? T('acc.' + p.accommodationStatus) : T('sit.check_rank'), detail: T('sit.acc_detail', { d: fmtDate('2026-09-29', lang) }) });
  else if (p.residenceType === 'fuori_sede') cards.push({ id: 'accommodation', title: T('k.accommodation'), tone: 'accommodation', label: T('sit.lodging_label'), detail: T('sit.lodging', { d: fmtDate('2026-11-19', lang) }) });
  // International
  if (['eu', 'extra_eu'].includes(p.citizenship) || p.familyLocation === 'abroad') cards.push({ id: 'international', title: T('k.international'), tone: 'info', label: T('sit.intl_label'), detail: route.route === 'parificato' ? T('sit.intl_docs') : T('sit.intl_temp') });
  // Amount
  const amt = scholarshipAmount({ isee: p.iseeValue, type: p.residenceType, partTime: p.partTime, withBed: p.accommodationStatus === 'winner' });
  if (amt) cards.push({ id: 'amount', title: T('m.indicative'), tone: 'info', label: fmtEUR(amt.amount, lang), detail: T('sit.amount') });
  const actions = nextActions(p, lang, now); const nd = actions.find((x) => x.due);
  return { cards, actions, nextDate: nd ? nd.due : null, nextLabel: nd ? nd.text : null };
}

/* ───────────── topic search ───────────── */
export function searchTopics(q, lang = 'en', limit = 8) {
  const n = norm(q).replace(/[?.,!]/g, ''), toks = n.split(/\s+/).filter((x) => x.length > 2 && !['what', 'does', 'mean', 'the', 'how', 'and', 'del', 'che', 'cosa', 'significa'].includes(x)); if (!toks.length && !/\d/.test(n)) return [];
  const res = [];
  for (const g of GLOSSARY) { const hay = norm([g.it, g.en, g.si, g.def.en, g.def.it].join(' ')), names = norm(g.it + ' ' + g.en); const mt = toks.filter((x) => hay.includes(x)).length; if (toks.length && mt < Math.max(1, Math.ceil(toks.length / 2))) continue; const s = toks.reduce((a, x) => a + (hay.includes(x) ? (names.includes(x) ? 3 : 1) : 0), 0) + (n && hay.includes(n) ? 3 : 0); if (s) res.push({ kind: 'glossary', score: s, item: g, title: `${g.it} — ${g[lang] || g.en}`, sub: g.def[lang] || g.def.en, ask: g.ask }); }
  for (const c of CHUNKS) { if (c.basis === 'demo' || c.ay !== AY) continue; const hay = norm(c.text.en + ' ' + c.topics.join(' ')); const s = toks.reduce((a, x) => a + (hay.includes(x) ? 1 : 0), 0); if (s >= Math.max(1, Math.ceil(toks.length / 2))) res.push({ kind: 'chunk', score: s, item: c, title: c.topics[0], sub: (c.text[lang] || c.text.en).slice(0, 140) + '…', ask: null }); }
  return res.sort((a, b) => b.score - a.score).slice(0, limit);
}

/* ───────────── documents (text already extracted; OCR/vision is a production step) ───────────── */
export function analyzeDocument({ text = '', name = '' } = {}, ctx = {}, lang = 'en', now = new Date()) {
  const T = (k, v) => t(lang, k, v), n = norm(text), r = base('document_analysis', lang, { kicker: T('k.documents') }); r.docFound = []; r.confidence = 'verified';
  if (!n.trim()) { r.status = st(T, 'unknown', 'st.cannot_confirm'); r.headline = T('da.empty'); r.summary = T('da.empty_sum'); r.next_actions = [{ text: T('da.paste') }]; r.confidence = 'none'; return r; }
  const kind = /graduator|ranking|sospes|suspend|vincitor|idone|escluso/.test(n) ? 'ranking' : /isee|dsu/.test(n) ? 'isee' : /immatricol|iscrizion|enrol/.test(n) ? 'enrolment' : 'notice';
  r.docFound.push({ label: T('da.type'), value: T('da.k_' + kind) });
  const stt = n.match(/sospes\w*|suspend\w*|vincitor\w*|winner|idone\w*|escluso|esclusa|excluded/); if (stt) r.docFound.push({ label: T('da.status'), value: stt[0].toUpperCase() });
  const ay = text.match(/20\d\d\s*[\/\-]\s*(?:20)?\d\d/); if (ay) r.docFound.push({ label: T('m.academic_year'), value: ay[0].replace(/\s/g, '') });
  const ds = [...text.matchAll(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d\d)\b/g)].map((m) => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`).filter((x) => !isNaN(Date.parse(x)));
  if (ds.length) { r.docFound.push({ label: T('da.dates'), value: [...new Set(ds)].map((d) => fmtDate(d, lang)).join('; ') }); r.timeline = [...new Set(ds)].sort().map((d) => ({ date: d, display: fmtDate(d, lang), label: T('da.date_in_doc'), ...deadlineState({ date: d }, now), state: deadlineState({ date: d }, now).state })); }
  const ie = text.match(/isee\D{0,20}(\d[\d.,]*)/i); if (ie) { const v = parseAmount(ie[1]); if (v > 100) r.docFound.push({ label: 'ISEE', value: fmtEUR(v, lang) }); }
  const cf = n.match(/(\d{1,3})\s*(cfu|crediti|credits)/); if (cf) r.docFound.push({ label: 'CFU', value: cf[1] });
  const kbTopics = kind === 'ranking' ? (/sospes|suspend/.test(n) ? ['suspended'] : ['ranking']) : kind === 'isee' ? ['isee'] : kind === 'enrolment' ? ['enrollment'] : [];
  const ch = kbTopics.length ? retrieve({ topics: kbTopics, limit: 2 }) : [];
  if (ch.length) { r.explanation = explain(ch, lang); r.sources = kbTopics[0] === 'suspended' ? srcs('deadlines', 'suspended') : kbTopics[0] === 'isee' ? srcs('isee') : kbTopics[0] === 'enrollment' ? srcs('partTime') : srcs('deadlines'); r.status = st(T, kbTopics[0] === 'suspended' ? 'action' : 'info', kbTopics[0] === 'suspended' ? 'st.action_required' : 'st.info'); r.headline = kbTopics[0] === 'suspended' ? T('da.susp') : T('da.matched'); r.summary = T('da.sum');
    r.sections = [{ heading: T('da.check'), items: kbTopics[0] === 'suspended' ? [T('rk.check1'), T('rk.check2'), T('rk.check3')] : [T('da.check_generic')] }];
    r.next_actions = kbTopics[0] === 'suspended' ? [{ text: T('act.read_reason') }, { text: T('act.complain', { d: fmtDate('2027-04-02', lang) }), due: '2027-04-02' }] : [{ text: T('da.verify') }]; }
  else { r.status = st(T, 'unknown', 'st.cannot_confirm'); r.headline = T('da.nomatch'); r.summary = T('da.nomatch_sum'); r.next_actions = [{ text: T('da.ask_edisu') }]; r.confidence = 'none'; r.sources = []; }
  r.uploaded = { name, at: now.toISOString() }; return r;
}
export const SAMPLE_DOCS = {
  ranking: 'EDISU Piemonte — Graduatoria definitiva borsa di studio a.a. 2026/27\nEsito: SOSPESO\nData pubblicazione: 16/12/2026\nGraduatoria provvisoria per sospesi: 19/03/2027\nStudente: DEMO (dati fittizi)',
  isee: 'ISEE Universitario 2026 — Ricevuta DSU\nValore ISEE: 18.450,00\nISPE: 31.200,00\nSottoscritta il 12/02/2026\nQuadro C: prestazioni universitarie',
};


/* ───────────── AI-written answers (optional layer; always re-validated here) ───────────── */
// `ai` = { text, used: [chunk ids] } from the server. Accepted only if it cites indexed 2026/27 chunks and adds no number or month
// that is absent from those chunks. Otherwise returns null and the caller keeps the rule-based "cannot confirm" answer.
export function aiAnswerResponse(ai, lang = 'en', now = new Date(), question = '') {
  const T = (k, v) => t(lang, k, v), text = String(ai?.text || '').replace(/[<>]/g, '').trim();
  const chunks = [...new Set(ai?.used || [])].map((id) => CHUNKS.find((c) => c.id === id && c.ay === AY && c.basis !== 'demo')).filter(Boolean);
  if (!chunks.length || !text || text.length > 700) return null;
  if (!numbersGrounded(text, chunks.flatMap((c) => [c.text.en, c.text.it || '']), question).ok) return null;
  const r = base('ai_answer', lang, { kicker: T('k.ai') });
  r.sources = [...new Set(chunks.map((c) => c.cite).filter(Boolean))].map(cite); if (!r.sources.length) return null;
  r.status = st(T, 'info', 'st.info'); r.headline = T('ai.headline'); r.summary = text; r.aiGenerated = true; r.explanation = explain(chunks, lang);
  r.next_actions = [{ text: T('ai.check') }]; r.intent = 'ai'; r.learned = {}; r.confidence = confidenceOf(r.sources); r.checkedAt = LAST_VERIFIED; r.usedCtx = [];
  return r;
}

/* ───────────── main entry ───────────── */
export const REQUIRED = ['type', 'ay', 'status', 'headline', 'summary', 'next_actions', 'sources'];
export function validateResponse(r) {
  const e = [], tones = ['info', 'satisfied', 'action', 'problem', 'accommodation', 'unknown'];
  for (const k of REQUIRED) if (r[k] === undefined) e.push('missing ' + k);
  if (r.status && !tones.includes(r.status.tone)) e.push('bad tone');
  if (typeof r.headline !== 'string' || !r.headline) e.push('empty headline');
  (r.metrics || []).forEach((m, i) => { if (!m.label || m.value === undefined) e.push('bad metric ' + i); });
  if (r.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(r.deadline.date)) e.push('bad deadline date');
  (r.sources || []).forEach((s, i) => { if (!s.title || !s.basis) e.push('bad source ' + i); });
  if (JSON.stringify(r).includes('⟦')) e.push('missing translation key');
  if (/<\s*(script|iframe|img)/i.test(JSON.stringify(r))) e.push('html in payload');
  return { ok: !e.length, errors: e };
}

export function answer(text, ctx = {}, lang = 'en', now = new Date()) {
  const facts = { ...extractFacts(text, { expectCfu: ctx.lastIntent === 'cfu' }), ...(ctx.patch || {}) };
  let intent = ctx.forceIntent ? { id: ctx.forceIntent, score: 0, followup: true } : detectIntent(text);
  if (intent.id === 'general' && ctx.lastIntent && Object.keys(facts).length) intent = { id: ctx.lastIntent, score: 0, followup: true };
  const merged = mergeCtx(ctx.profile, { ...ctx.session, ...facts });
  merged.ay = merged.ay || AY;
  let resp;
  if (merged.ay !== AY && !CHUNKS.some((c) => c.ay === merged.ay && c.basis !== 'demo')) resp = bYearMismatch(merged, lang);
  else resp = (BUILDERS[intent.id] || bGeneral)(merged, lang, now, { text });
  resp.intent = intent.id === 'general' && resp.type === 'no_source' ? 'unknown' : intent.id; resp.learned = facts;
  resp.confidence = confidenceOf(resp.sources, resp.confidence); resp.checkedAt = LAST_VERIFIED;
  resp.usedCtx = ['university', 'degreeType', 'yearBucket', 'partTime', 'cfu', 'citizenship', 'familyLocation', 'residenceType'].filter((k) => merged[k] !== undefined && merged[k] !== null).map((k) => [k, merged[k]]);
  return resp;
}
export { AY, DOCS, CHUNKS, DEADLINES, RULES, GLOSSARY, UPDATES };
