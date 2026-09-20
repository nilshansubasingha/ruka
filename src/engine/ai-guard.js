// AI guard rails shared by the Netlify function (server) and the client. Dependency-free on purpose.
// Principle: the model may help *understand* or *phrase*; it may never introduce a fact that is not in the cited source text.

export const AI_INTENTS = ['cfu', 'deadline', 'eligibility', 'ranking', 'accommodation', 'payment', 'isee', 'international', 'documents', 'enrollment', 'transfer', 'next', 'other'];
export const AI_TOPICS = ['deadlines', 'ranking', 'accommodation', 'scholarship', 'isee', 'eligibility', 'income', 'parificato', 'international', 'documents', 'cfu', 'merit', 'payment', 'suspended', 'enrollment', 'transfer', 'student_type', 'lodging', 'polito', 'updates'];
const FACT_ENUMS = {
  yearBucket: ['first', 'later'], degreeType: ['bachelor', 'master', 'single'], citizenship: ['it', 'eu', 'extra_eu', 'protected'],
  familyLocation: ['italy', 'abroad', 'mixed'], residenceType: ['in_sede', 'pendolare', 'fuori_sede'], rankingStatus: ['suspended', 'winner', 'idoneo', 'excluded'],
};
export const FACT_KEYS = [...Object.keys(FACT_ENUMS), 'partTime', 'cfu']; // the only profile facts that may ever leave the device

/** Remove control characters and obvious personal identifiers before text is sent to a third-party model. */
export function scrub(text, max = 300) {
  return String(text ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\b[A-Z]{6}\d{2}[A-EHLMPRST]\d{2}[A-Z]\d{3}[A-Z]\b/gi, '[id]')      // codice fiscale
    .replace(/\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g, '[id]')                          // IBAN-like
    .replace(/\b[sS]\d{6}\b/g, '[id]')                                              // PoliTO matricola-like
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[number]')                                  // phone numbers / long digit runs
    .replace(/\s+/g, ' ').trim().slice(0, max);
}

export function pickFacts(obj) {
  const out = {}; if (!obj || typeof obj !== 'object') return out;
  for (const [k, allowed] of Object.entries(FACT_ENUMS)) if (allowed.includes(obj[k])) out[k] = obj[k];
  if (typeof obj.partTime === 'boolean') out.partTime = obj.partTime;
  if (Number.isInteger(obj.cfu) && obj.cfu >= 0 && obj.cfu <= 400) out.cfu = obj.cfu;
  return out;
}

export function sanitizeUnderstand(o) {
  o = o && typeof o === 'object' ? o : {};
  return {
    intent: AI_INTENTS.includes(o.intent) ? o.intent : 'other',
    topics: (Array.isArray(o.topics) ? o.topics : []).filter((t) => AI_TOPICS.includes(t)).slice(0, 4),
    facts: pickFacts(o.facts),
  };
}

export function sanitizeChat(o, allowedIds) {
  o = o && typeof o === 'object' ? o : {};
  const text = typeof o.answer === 'string' ? o.answer.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 600) : '';
  const used = [...new Set((Array.isArray(o.used) ? o.used : []).filter((id) => allowedIds.includes(id)))];
  const cannot = o.cannot_answer === true || !text || !used.length;
  return { cannot, text: cannot ? '' : text, used: cannot ? [] : used };
}

const MONTHS = {
  1: ['january', 'jan', 'gennaio', 'gen'], 2: ['february', 'feb', 'febbraio'], 3: ['march', 'mar', 'marzo'], 4: ['april', 'apr', 'aprile'], 5: ['may', 'maggio', 'mag'], 6: ['june', 'jun', 'giugno', 'giu'],
  7: ['july', 'jul', 'luglio', 'lug'], 8: ['august', 'aug', 'agosto', 'ago'], 9: ['september', 'sept', 'sep', 'settembre', 'set'], 10: ['october', 'oct', 'ottobre', 'ott'], 11: ['november', 'nov', 'novembre'], 12: ['december', 'dec', 'dicembre', 'dic'],
};
const monthsIn = (s) => { const found = new Set(); const words = String(s).toLowerCase().match(/[a-zà-ú]+/g) || []; for (const w of words) for (const [n, names] of Object.entries(MONTHS)) if (names.includes(w)) found.add(Number(n)); return found; };
const nums = (s) => new Set((String(s).match(/\d[\d.,]*/g) || []).map((x) => x.replace(/[.,]+$/, '').replace(/[.,]/g, '')).filter(Boolean));

/**
 * Every number in the answer must appear in the source texts (or the user's own question), and every month named
 * must be a month named in the sources. Sinhala month names are not checked (digits still are).
 */
export function numbersGrounded(answer, sourceTexts, question = '') {
  const allowN = nums(sourceTexts.join(' ') + ' ' + question), allowM = monthsIn(sourceTexts.join(' ') + ' ' + question), bad = [];
  for (const n of nums(answer)) if (!allowN.has(n)) bad.push(n);
  for (const m of monthsIn(answer)) if (!allowM.has(m)) bad.push('month:' + m);
  return { ok: bad.length === 0, bad };
}
