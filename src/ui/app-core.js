/* RUKA UI core: DOM helpers, state, components. The UI renders structured response objects only — never model-written HTML. */
import { INSTITUTIONS, PERSONAS, UPDATES, GLOSSARY, DOCS, CHUNKS, DEADLINES, RULES, LAST_VERIFIED } from '../engine/kb.js';
import { t, LANGS, LANG_NAMES, D, missingIn } from '../engine/i18n.js';
import * as E from '../engine/engine.js';
import { runSelfTests } from '../engine/selftest.js';

/* ── DOM ── */
const h = (tag, attrs, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'value') el.value = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  const add = (c) => { if (c == null || c === false) return; if (Array.isArray(c)) c.forEach(add); else el.append(c.nodeType ? c : document.createTextNode(String(c))); };
  kids.forEach(add); return el;
};
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  check_list: 'M9 3h6v3H9z M7 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2 M9 14l2 2 4-4', calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  file: 'M6 3h8l4 4v14H6z M14 3v4h4 M9 13h6 M9 17h6', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0', bell: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7z M10 20a2 2 0 0 0 4 0',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M21 21l-5-5', check: 'M5 12l4 4 10-10', ok: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M8 12l3 3 5-6',
  alert: 'M12 3l10 18H2z M12 10v5 M12 18v.01', bad: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M9 9l6 6 M15 9l-6 6', info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v5 M12 8v.01',
  help: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7 M12 17v.01', clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
  bed: 'M3 18V7 M3 14h18v4 M21 14v-2a3 3 0 0 0-3-3h-7v5', globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18',
  down: 'M6 9l6 6 6-6', right: 'M9 6l6 6-6 6', x: 'M6 6l12 12 M18 6L6 18', clip: 'M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7',
  send: 'M4 12l16-8-6 16-3-7z', upload: 'M12 16V4 M7 9l5-5 5 5 M4 20h16', up: 'M7 11v9H4v-9z M7 11l4-7c2 0 3 1 3 3v3h5a2 2 0 0 1 2 2l-1 6a2 2 0 0 1-2 2H7',
  dn: 'M7 13V4H4v9z M7 13l4 7c2 0 3-1 3-3v-3h5a2 2 0 0 0 2-2l-1-6a2 2 0 0 0-2-2H7', flag: 'M5 21V4 M5 4h11l-2 4 2 4H5', ext: 'M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13', shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4', plus: 'M12 5v14 M5 12h14', gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M19 12l2-1-2-4-2 .8-1.5-1L15 4h-4l-.5 2.8-1.5 1L7 7l-2 4 2 1 0 1.9L5 15l2 4 2-.8 1.5 1L11 22h4l.5-2.8 1.5-1 2 .8 2-4-2-1z',
};
const ic = (n, s = 20) => { const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', s); svg.setAttribute('height', s); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('aria-hidden', 'true'); (ICONS[n] || '').split(' M').forEach((d, i) => { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', 'M' + d.replace(/^M/, '')); svg.append(p); }); return svg; };
const TONE_ICON = { satisfied: 'ok', action: 'alert', problem: 'bad', info: 'info', accommodation: 'bed', unknown: 'help' };
const logoMark = () => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', 20); s.setAttribute('height', 20); s.setAttribute('aria-hidden', 'true'); s.innerHTML = '<path d="M12 3 6 11h3l-4 6h5v4h4v-4h5l-4-6h3z" fill="#EDF0EB"/>'; return s; };

/* ── storage & state ── */
const LS = { get(k, d) { try { const v = localStorage.getItem('ruka.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('ruka.' + k, JSON.stringify(v)); } catch (e) { /* storage may be unavailable */ } }, del(k) { try { localStorage.removeItem('ruka.' + k); } catch (e) { /* ignore */ } } };
const navLang = () => { const l = (navigator.language || 'en').slice(0, 2); return l === 'it' ? 'it' : l === 'si' ? 'si' : 'en'; };
const state = { lang: LS.get('lang', navLang()), theme: LS.get('theme', 'auto'), user: LS.get('user', null), guest: {}, convos: LS.get('convos', []), cur: null, events: LS.get('events', []), reports: LS.get('reports', []), route: 'home', dlFilter: 'all', dlView: 'cards', sit: null, docTab: 'explain', docResult: null, adminTab: 'sources', drafts: LS.get('rule_drafts', []) };
const tt = (k, v) => t(state.lang, k, v);
const profile = () => (state.user ? state.user.profile : state.guest);
const persistUser = () => { if (state.user) LS.set('user', state.user); };
const setProfile = (patch) => { if (state.user) { state.user.profile = { ...state.user.profile, ...patch }; persistUser(); } else state.guest = { ...state.guest, ...patch }; };
const now = () => new Date();
const logEvent = (e) => { state.events.push({ ts: Date.now(), lang: state.lang, signed: !!state.user, ...e }); if (state.events.length > 500) state.events.shift(); LS.set('events', state.events); };
const applyTheme = () => { const r = document.documentElement; if (state.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', state.theme); };
const uid = () => Math.random().toString(36).slice(2, 10);
let toastTimer; const toast = (m) => { document.querySelector('.toast')?.remove(); const el = h('div', { class: 'toast', role: 'status' }, m); document.body.append(el); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.remove(), 2800); };
const fmtD = (iso, o) => E.fmtDate(iso, state.lang, o);
const instName = (id) => INSTITUTIONS.find((i) => i.id === id)?.short || id;

/* ── modal ── */
function modal(title, body, { onClose } = {}) {
  const prev = document.activeElement;
  const close = () => { scrim.remove(); document.removeEventListener('keydown', esc); prev && prev.focus && prev.focus(); onClose && onClose(); };
  const esc = (e) => { if (e.key === 'Escape') close(); };
  const scrim = h('div', { class: 'scrim', onclick: (e) => e.target === scrim && close() }, h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, h('div', { class: 'mh' }, h('h2', null, title), h('button', { class: 'ib', 'aria-label': tt('ui.close'), onclick: close }, ic('x'))), body));
  document.addEventListener('keydown', esc); document.body.append(scrim);
  scrim.querySelector('button, input, select, textarea')?.focus(); return { close };
}

/* ── answer components ── */
const basisKey = { read: 'ui.basis.read', summary: 'ui.basis.summary', title: 'ui.basis.title' };
function SourceCard(s) {
  return h('a', { class: `src b-${s.basis}`, href: s.url, target: '_blank', rel: 'noopener noreferrer' },
    h('span', { class: 'si' }, ic(s.basis === 'read' ? 'shield' : 'info', 18)),
    h('div', { style: 'min-width:0' }, h('b', null, `${instName(s.institution)}: ${s.title}`),
      h('small', null, `${s.article}${s.page ? `, p. ${s.page}` : ''}`), h('small', null, `${tt(basisKey[s.basis])}. ${tt('ui.ans.verified')} ${fmtD(s.lastVerified, { day: 'numeric', month: 'short', year: 'numeric' })}`)),
    ic('ext', 16));
}
function Timeline(items, hlFirst = true) {
  const nextIdx = items.findIndex((i) => i.state !== 'passed');
  return h('ol', { class: 'tl' }, items.map((i, k) => h('li', { class: `${i.state === 'passed' ? 'passed' : 'upcoming'} ${k === nextIdx && hlFirst ? 'next-up' : ''}` }, h('span', { class: 'pt' }),
    h('div', { class: 'td' }, i.display, i.state !== 'passed' ? h('span', { class: 'tg' }, i.state === 'today' ? tt('ui.ans.today') : tt('ui.ans.left', { n: i.daysLeft })) : h('span', { class: 'tg' }, tt('ui.dl.passed'))), h('div', { class: 'tt' }, i.label))));
}
const ctxLabel = ([k, v]) => ({ yearBucket: () => tt(v === 'first' ? 'chip.first' : 'chip.later'), degreeType: () => tt('chip.' + v), cfu: () => `${v} CFU`, partTime: () => tt(v ? 'ui.f.part' : 'ui.f.full'), citizenship: () => tt('chip.' + v), familyLocation: () => tt('chip.fam_' + v), residenceType: () => tt('res.' + v), university: () => (v === 'polito' ? 'PoliTO' : 'UniTo') }[k] || (() => String(v)))();
function Answer(r, o = {}) {
  const tone = r.status.tone, uid1 = uid(); const { onChip, onInput, onCta, onFeedback, onReport, onSave, isLast } = o;
  const kids = [];
  kids.push(h('div', { class: 'plate-band' }, ic(TONE_ICON[tone], 19), r.status.label, h('span', { class: 'kick' }, r.kicker)));
  if (r.aiGenerated) kids.push(h('div', { class: 'tag-h', style: 'padding-top:12px' }, ic('info', 16), tt('ui.ai.badge')));
  kids.push(h('div', { class: 'plate-hero' }, h('h2', null, r.headline), r.summary && h('p', null, r.summary)));
  if (r.docFound?.length) kids.push(h('div', null, h('div', { class: 'tag-h' }, ic('file', 16), tt('ui.ans.from_doc')), h('dl', { class: 'doc-found' }, r.docFound.map((d) => [h('dt', null, d.label), h('dd', null, d.value)]))));
  if (r.progress) { const k = r.progress; kids.push(h('div', { class: 'prog', role: 'group', 'aria-label': `${k.current} / ${k.required} CFU` }, h('div', { class: 'prog-n' }, `${k.current} / ${k.required}`, h('small', null, 'CFU')), h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': k.required, 'aria-valuenow': k.current }, h('i', { style: `width:${k.pct}%` })), h('div', { class: 'bar-l' }, h('span', null, `${k.pct}%`), h('span', null, `${tt('m.remaining')}: ${k.remaining}`)))); }
  if (r.metrics?.length) kids.push(h('dl', { class: 'metrics' }, r.metrics.map((m) => h('div', { class: 'metric' }, h('dt', null, m.label), h('dd', { class: String(m.value).length > 22 ? 'sm' : '' }, m.value), m.note && h('small', null, m.note)))));
  if (r.deadline) { const d = r.deadline, dt = new Date(d.date + 'T12:00:00Z'), dtone = d.state === 'passed' ? 'unknown' : d.daysLeft <= 7 ? 'action' : 'info';
    kids.push(h('div', { class: `dline tone-${dtone}` }, h('div', { class: 'dd' }, E.fmtDate(d.date, state.lang, { day: 'numeric', month: 'short' })), h('div', { class: 'dm' }, d.label || d.display, h('br'), E.fmtDate(d.date, state.lang, { year: 'numeric' }) + (d.time ? `, ${d.time}` : '')), h('div', { class: 'cnt' }, d.state === 'today' ? tt('ui.ans.today') : d.state === 'passed' ? tt('ui.ans.passed', { n: Math.abs(d.daysLeft) }) : tt('ui.ans.left', { n: d.daysLeft })))); }
  if (r.assumption) kids.push(h('div', { class: 'assume' }, ic('info', 16), `${tt('ui.ans.assumed')}: ${r.assumption.text}`, isLast && onChip && h('button', { class: 'chip', onclick: () => onChip(r.assumption.chip) }, r.assumption.chip.label)));
  if (r.next_actions?.length) kids.push(h('div', { class: `next tone-${tone}` }, h('b', null, tt('ui.ans.next')), h('ul', null, r.next_actions.slice(0, o.full ? 8 : 3).map((a) => h('li', null, ic('right', 16), h('span', null, a.text, a.due && h('span', { class: 'due' }, E.fmtDate(a.due, state.lang, { day: 'numeric', month: 'short' }))))))));
  r.sections?.forEach((s) => kids.push(h('div', { class: `sec ${s.tone || ''}` }, h('h3', null, s.heading), h('ul', null, s.items.map((i) => h('li', null, i))))));
  if (r.checks?.length) kids.push(h('div', { class: 'checks', role: 'list', 'aria-label': tt('ui.ans.checks') }, r.checks.map((c) => { const tn = { ok: 'satisfied', info: 'info', unknown: 'unknown', action: 'action', bad: 'problem' }[c.state]; return h('div', { class: `check tone-${tn}`, role: 'listitem' }, h('span', { class: 'ci' }, ic(TONE_ICON[tn], 16)), h('div', null, h('b', null, c.label), h('span', null, c.note))); })));
  if (r.timeline?.length) kids.push(h('div', { class: `tlwrap tone-${tone}` }, h('h3', { class: 'sect-t', style: 'font-size:17px' }, tt('ui.ans.dates')), Timeline(r.timeline)));
  if (r.glossary?.length) kids.push(h('div', { class: 'gloss', 'aria-label': tt('ui.ans.terms') }, r.glossary.map((g) => h('span', { class: 'gl' }, h('b', null, g.it), ` ${g.en}`))));
  // details (collapsed)
  const hasDetail = r.explanation?.length || r.consequence || r.sources?.length > 1;
  if (hasDetail) { const id = 'd' + uid1; const det = h('div', { class: 'details', id, hidden: true }, r.consequence && h('p', null, h('b', null, tt('ui.ans.consequence') + ': '), r.consequence), (r.explanation || []).map((p) => h('p', null, p)), state.lang === 'si' && r.explanation?.length && h('p', { class: 'fb' }, tt('ui.ans.fallback')), r.sources?.length > 1 && h('div', { class: 'sources', style: 'padding:8px 0 0' }, r.sources.slice(1).map(SourceCard)));
    const btn = h('button', { class: 'toggle', 'aria-expanded': 'false', 'aria-controls': id, onclick: () => { const open = btn.getAttribute('aria-expanded') === 'true'; btn.setAttribute('aria-expanded', String(!open)); det.hidden = open; btn.firstChild.textContent = open ? tt('ui.ans.details') : tt('ui.ans.hide'); } }, h('span', null, tt('ui.ans.details')), ic('down', 18));
    kids.push(btn, det); }
  // follow-up questions (latest message only)
  if (isLast && r.questions?.length) r.questions.forEach((q) => { const body = q.chips ? h('div', { class: 'row' }, q.chips.map((c) => h('button', { class: 'chip', onclick: () => (c.route ? onCta && onCta({ route: c.route }) : onChip && onChip(c)) }, c.label)))
    : (() => { const i1 = h('input', { type: 'number', inputmode: 'numeric', min: 0, placeholder: q.placeholder, 'aria-label': q.text }), i2 = q.also ? h('input', { type: 'number', inputmode: 'numeric', min: 0, 'aria-label': q.also.text, placeholder: q.also.text }) : null;
      return h('form', { onsubmit: (e) => { e.preventDefault(); const patch = {}; if (i1.value !== '') patch[q.key] = Number(i1.value); if (i2 && i2.value !== '') patch[q.also.key] = Number(i2.value); if (Object.keys(patch).length) onInput && onInput(patch); } }, i1, i2, h('button', { class: 'btn sm', type: 'submit' }, tt('ui.ask.update'))); })();
    kids.push(h('div', { class: 'ask-q' }, h('b', null, q.text), body)); });
  if (r.cta && onCta) kids.push(h('div', { class: 'block' }, h('button', { class: 'btn ghost sm', onclick: () => onCta(r.cta) }, r.cta.label)));
  if (r.suggestions?.length && isLast) kids.push(h('div', { class: 'block' }, h('div', { class: 'row' }, r.suggestions.map((s) => h('button', { class: 'chip', onclick: () => o.onSuggest && o.onSuggest(s) }, s)))));
  if (r.sources?.length) kids.push(h('div', { class: 'sources' }, h('div', { class: 'tag-h', style: 'padding:0' }, ic('shield', 16), tt('ui.ans.source')), SourceCard(r.sources[0])));
  kids.push(h('div', { class: `conf c-${r.confidence}` }, ic(r.confidence === 'verified' ? 'ok' : r.confidence === 'none' ? 'help' : 'info', 16), tt('ui.conf.' + r.confidence)));
  if (o.used && r.usedCtx?.length) { const learned = Object.keys(r.learned || {}).filter((k) => r.usedCtx.some(([x]) => x === k));
    kids.push(h('div', { class: 'used' }, tt('ui.ask.used') + ':', r.usedCtx.map((c) => h('span', { class: 'u' }, ctxLabel(c))), learned.length > 0 && onSave && h('button', { class: 'link', onclick: () => onSave(r.learned) }, state.user ? tt('ui.ask.save') : tt('ui.ask.signin_save')))); }
  if (o.feedback) kids.push(h('div', { class: 'fbrow' }, h('span', null, tt('ui.ask.helpful')), h('button', { class: 'btn ghost', 'aria-label': tt('ui.yes'), onclick: (e) => onFeedback(true, e.currentTarget.parentNode) }, ic('up', 16), tt('ui.yes')), h('button', { class: 'btn ghost', 'aria-label': tt('ui.no'), onclick: (e) => onFeedback(false, e.currentTarget.parentNode) }, ic('dn', 16), tt('ui.no')), h('button', { class: 'link', onclick: () => onReport(r) }, tt('ui.ask.report'))));
  return h('article', { class: `plate tone-${tone}`, 'aria-label': r.headline }, kids);
}
const Skeleton = (msgKey) => h('div', { class: 'skel', role: 'status', 'aria-live': 'polite' }, h('div', { class: 'w' }, tt(msgKey)), h('i', { style: 'width:72%;height:28px' }), h('i', { style: 'width:96%' }), h('i', { style: 'width:60%' }));
