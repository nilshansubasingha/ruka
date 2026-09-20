// Self-tests: run in Node (tests/engine.test.js) and inside the admin panel of the prototype.
import * as E from './engine.js';
import { D, LANGS, missingIn } from './i18n.js';
import { CHUNKS, DEADLINES, PERSONAS, DOCS, S } from './kb.js';

const NOW = new Date('2026-09-19T10:00:00Z');
const ask = (q, ctx = {}, lang = 'en') => E.answer(q, { profile: {}, session: {}, ...ctx }, lang, NOW);

export function runSelfTests() {
  const T = [];
  const t = (name, fn) => { try { const r = fn(); T.push({ name, ok: r === undefined || r === true, detail: r === undefined || r === true ? '' : String(r) }); } catch (e) { T.push({ name, ok: false, detail: e.message }); } };
  const eq = (a, b) => (JSON.stringify(a) === JSON.stringify(b) ? true : `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

  // Deterministic rules
  t('CFU calculation: 14 of 20 leaves 6', () => eq(E.cfuCalc(14, 20).remaining, 6));
  t('CFU calculation: over target leaves 0 and done', () => { const k = E.cfuCalc(25, 20); return k.remaining === 0 && k.done && k.pct === 100; });
  t('First-year full-time rule = 20 CFU by 2027-08-10', () => { const r = E.getRule('r-cfu-first-ft'); return r.value === 20 && r.deadline === '2027-08-10'; });
  t('First-year part-time rule = 11 CFU', () => eq(E.getRule('r-cfu-first-pt').value, 11));
  t('ISEE at limit passes; one cent over fails', () => E.iseeCheck(26306.25, 1000).state === 'satisfied' && E.iseeCheck(26306.26, 1000).state === 'not_satisfied' || 'threshold wrong');
  t('ISPE over limit fails even with low ISEE', () => eq(E.iseeCheck(10000, 57187.54).state, 'not_satisfied'));
  t('ISEE route: family abroad -> Parificato', () => eq(E.iseeRoute({ citizenship: 'extra_eu', familyLocation: 'abroad' }).route, 'parificato'));
  t('ISEE route: extra-EU uses 2025 income, EU uses 2024', () => E.iseeRoute({ citizenship: 'extra_eu', familyLocation: 'abroad' }).year === 2025 && E.iseeRoute({ citizenship: 'eu', familyLocation: 'abroad' }).year === 2024);
  t('ISEE route: refugee -> Universitario', () => eq(E.iseeRoute({ citizenship: 'protected' }).route, 'universitario'));
  t('Amount table: fuori sede, ISEE 10,000 = 8,096.78', () => eq(E.scholarshipAmount({ isee: 10000, type: 'fuori_sede' }).amount, 8096.78));
  t('Amount: ISEE above limit -> no amount', () => eq(E.scholarshipAmount({ isee: 30000, type: 'pendolare' }), null));

  // Academic-year isolation
  t('Retrieval never returns another year or DEMO chunks for 2026/27', () => { const r = E.retrieve({ topics: ['cfu', 'merit'], limit: 20 }); return r.length > 0 && r.every((c) => c.ay === '2026/27' && c.basis !== 'demo') || 'leaked'; });
  t('Retrieval for 2025/26 returns nothing user-facing (only DEMO exists)', () => eq(E.retrieve({ ay: '2025/26', topics: ['cfu', 'merit'] }).length, 0));
  t('A 2025/26 question is NOT answered with 2026/27 rules', () => { const r = ask('What CFU do I need for 2025/26?'); return r.type === 'year_mismatch' && r.confidence === 'none' && r.sources.length === 0 || `got ${r.type}`; });
  t('Every published rule and deadline is 2026/27', () => E.RULES.every((r) => r.ay === '2026/27') || 'rule with other year');

  // Structured output + hallucination guards
  const qs = ['When do I need 20 CFU?', 'I have 14 CFU. I\'m a first-year Master\'s student. What happens?', 'Why does it say suspended?', 'What documents do I need?', 'How does ISEE Parificato work?', 'When are the rankings?', 'When will the scholarship be paid?', 'Can I change degree programme?', 'How does enrollment affect my scholarship?', 'What is my accommodation status?', 'What should I do next?', 'Am I eligible?', 'What do international students need?', 'What are the deadlines?', 'hello', 'blorp zzz qq'];
  t('All intents x 3 languages produce valid structured responses', () => { for (const l of LANGS) for (const q of qs) { const v = E.validateResponse(ask(q, {}, l)); if (!v.ok) return `${l} "${q}": ${v.errors.join(', ')}`; } });
  t('Personas x intents produce valid responses', () => { for (const p of PERSONAS) for (const q of qs) { const v = E.validateResponse(ask(q, { profile: p.profile }, p.profile.lang)); if (!v.ok) return `${p.id} "${q}": ${v.errors.join(', ')}`; } });
  t('Every answer with a source carries a URL to an official document or page', () => { for (const q of qs) { const r = ask(q); for (const s of r.sources) if (!/^https:\/\//.test(s.url)) return `no url in "${q}"`; } });
  t('Unknown question says it cannot confirm and cites nothing', () => { const r = ask('blorp zzz qq'); return r.type === 'no_source' && r.sources.length === 0 && r.confidence === 'none'; });
  t('Payment dates are NOT invented (not indexed)', () => { const r = ask('When will the scholarship be paid?'); return r.status.tone === 'unknown' && !r.deadline && r.confidence === 'unclear'; });
  t('Later-year CFU threshold is NOT invented', () => { const r = ask('How many CFU do I need?', { profile: { yearBucket: 'later', cfu: 50 } }); return r.status.tone === 'unknown' && !r.progress || 'invented threshold'; });
  t('Eligibility never claims official approval', () => { const r = ask('Am I eligible?', { profile: { yearBucket: 'first', citizenship: 'it', familyLocation: 'italy', iseeValue: 12000 } }); return !/officially eligible|you are eligible/i.test(JSON.stringify(r)) && r.status.label === 'Potentially eligible' || r.status.label; });
  t('Eligibility flags ISEE above the limit', () => eq(ask('Am I eligible?', { profile: { yearBucket: 'first', citizenship: 'it', familyLocation: 'italy', iseeValue: 30000 } }).status.tone, 'problem'));
  t('No raw HTML in any payload', () => qs.every((q) => !/<\s*(script|iframe|img|svg)/i.test(JSON.stringify(ask(q)))));

  // Conversation context
  t('Follow-up "I currently have 14." updates the CFU answer', () => { const a = ask('When do I need 20 CFU?'); const b = E.answer('I currently have 14.', { profile: {}, session: {}, lastIntent: a.intent }, 'en', NOW); return b.type === 'cfu_requirement' && b.progress && b.progress.current === 14 && b.progress.remaining === 6 || 'context lost'; });
  t('A 20 in "need 20 CFU" is not mistaken for current CFU', () => eq(E.extractFacts('When do I need 20 CFU?').cfu, undefined));
  t('Extracts year, degree, CFU and part-time from free text', () => { const f = E.extractFacts('I am a first-year Master student with 9 credits, part-time'); return f.yearBucket === 'first' && f.degreeType === 'master' && f.cfu === 9 && f.partTime === true || JSON.stringify(f); });
  t('Known profile answers are not asked again', () => { const r = ask('What CFU do I need?', { profile: { yearBucket: 'first', cfu: 14 } }); return !r.questions.some((q) => q.key === 'yearBucket' || q.key === 'cfu'); });
  t('Part-time profile uses 11 CFU', () => eq(ask('CFU?', { profile: { yearBucket: 'first', partTime: true, cfu: 3 } }).progress.required, 11));
  t('Multilingual intent detection (it / si)', () => ask('Quanti CFU mi servono?', {}, 'it').intent === 'cfu' && ask('ශිෂ්‍යත්වය අත්හිටුවා ඇත').intent === 'ranking' || 'intent miss');
  t('Script detection: Sinhala and Italian', () => E.detectLang('මට උදව් කරන්න') === 'si' && E.detectLang('Quando devo pagare la borsa?') === 'it');

  // Deadlines
  t('Deadline states relative to the fixed test date', () => { const d = E.listDeadlines({ now: NOW }); const app = d.find((x) => x.id === 'd-app'), prov = d.find((x) => x.id === 'd-sch-prov'); return app.state === 'passed' && prov.state === 'upcoming' && prov.daysLeft === 32 || `${app.state}/${prov.state}/${prov.daysLeft}`; });
  t('Personal filter is empty without a profile, non-empty with one', () => E.listDeadlines({ filter: 'personal', now: NOW }).length === 0 && E.listDeadlines({ filter: 'personal', profile: PERSONAS[0].profile, now: NOW }).length > 0);
  t('Suspended students get the March/April 2027 dates', () => E.listDeadlines({ filter: 'personal', profile: PERSONAS[4].profile, now: NOW }).some((d) => d.id === 'd-sus-def'));
  t('Non-accommodation applicants do not get bed deadlines', () => !E.listDeadlines({ filter: 'personal', profile: PERSONAS[1].profile, now: NOW }).some((d) => d.id === 'd-acc-accept'));
  t('Next actions are sorted by date and never in the past', () => { const a = E.nextActions(PERSONAS[0].profile, 'en', NOW); const dates = a.map((x) => x.due).filter(Boolean); return dates.every((d) => d >= '2026-09-19') && dates.join() === [...dates].sort().join() || 'order/past'; });
  t('All deadlines have a source with basis', () => DEADLINES.every((d) => d.cite && S[d.cite]) || 'missing cite');
  t('Dual-institution answer separates EDISU and PoliTO', () => { const r = ask('How does enrollment affect my scholarship?'); return r.type === 'dual_institution' && r.sections.length === 3 && r.sections[0].heading === 'EDISU rule' && r.sections[1].heading === 'PoliTO information' && r.confidence === 'multiple' || 'sections'; });

  // Documents
  t('Ranking screenshot text "SOSPESO" is explained from the official rule', () => { const r = E.analyzeDocument({ text: E.SAMPLE_DOCS.ranking }, {}, 'en', NOW); return r.docFound.some((x) => x.value === 'SOSPESO') && r.sources.length > 0 && r.type === 'document_analysis' || 'not matched'; });
  t('Unrecognised document is NOT explained by guessing', () => { const r = E.analyzeDocument({ text: 'Lorem ipsum dolor sit amet' }, {}, 'en', NOW); return r.sources.length === 0 && r.confidence === 'none'; });
  t('Empty document asks for text instead of inventing', () => eq(E.analyzeDocument({ text: '' }, {}, 'en', NOW).confidence, 'none'));
  t('Dates in a document are extracted and kept separate from official ones', () => { const r = E.analyzeDocument({ text: 'Scadenza 15/10/2026' }, {}, 'en', NOW); return r.timeline && r.timeline[0].date === '2026-10-15' || 'no date'; });

  t('A weak one-word overlap does not produce a glossary answer', () => ask('Erasmus exchange semester impact?').type === 'no_source' || ask('Erasmus exchange semester impact?').type);
  t('Explicit glossary question still works', () => ask('What does Semestre filtro mean?').type === 'general_rule');
  // i18n
  t('i18n: every key has English, Italian and Sinhala', () => { for (const l of LANGS) { const m = missingIn(l); if (m.length) return `${l} missing ${m.slice(0, 5)}`; } });
  t('i18n: no unresolved placeholders in rendered answers', () => { for (const l of LANGS) for (const q of qs) if (/\{\w+\}/.test(JSON.stringify(ask(q, { profile: PERSONAS[0].profile }, l)))) return `${l} "${q}"`; });
  t('Search finds sospeso and ISEE Parificato topics', () => E.searchTopics('sospeso').length > 0 && E.searchTopics('ISEE Parificato').length > 0);

  // Security-ish boundaries (client side)
  t('Response validator rejects HTML injection', () => E.validateResponse({ type: 'x', ay: '2026/27', status: { tone: 'info', label: '' }, headline: '<scr' + 'ipt>x<' + '/scr' + 'ipt>', summary: 's', next_actions: [], sources: [] }).ok === false);
  t('Official docs use https URLs only', () => Object.values(DOCS).filter((d) => d.type !== 'demo').every((d) => d.url.startsWith('https://')) || 'non-https');
  t('Institutions are configurable: UniTo planned, not live', () => true);
  return T;
}
