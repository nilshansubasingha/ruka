// Minimal fake of Mistral's /v1/chat/completions for offline testing. Deterministic; never contacts the internet.
import http from 'node:http';
export function startMock(port = 0) {
  const calls = [];
  const server = http.createServer((req, res) => {
    let raw = ''; req.on('data', (d) => (raw += d)); req.on('end', () => {
      const body = JSON.parse(raw || '{}'), sys = body.messages?.[0]?.content || '', user = body.messages?.[1]?.content || '';
      calls.push({ auth: req.headers.authorization, sys: sys.slice(0, 40), user, model: body.model });
      const reply = (o, status = 200) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
      if (user.includes('RATELIMIT')) return reply({ error: 'rate' }, 429);
      const msg = (obj) => reply({ choices: [{ message: { content: typeof obj === 'string' ? obj : JSON.stringify(obj) } }] });
      if (sys.startsWith('You classify')) {
        if (user.includes('BADJSON')) return msg('not json at all');
        if (user.includes('CFUQ')) return msg({ intent: 'cfu', topics: ['cfu'], facts: { yearBucket: 'first', cfu: 14, evil: 'x', citizenship: 'martian' } });
        return msg({ intent: 'other', topics: ['enrollment', 'scholarship'], facts: {} });
      }
      const ids = [...sys.matchAll(/^\[([\w-]+)\]/gm)].map((m) => m[1]);
      if (user.includes('HALLUCINATE')) return msg({ cannot_answer: false, answer: 'You will receive 5000 euro on 3 January.', used: [ids[0]] });
      if (user.includes('NOSOURCES')) return msg({ cannot_answer: false, answer: 'Enrolment is checked on 30 November 2026.', used: ['made-up-id'] });
      if (user.includes('IGNORE')) return msg({ cannot_answer: false, answer: '<b>Enrolment is checked on 30 November 2026.</b>', used: ['c-enrol-checks'] });
      return msg({ cannot_answer: false, answer: 'EDISU checks your enrolment and full-time or part-time status on 31 October 2026 and 30 November 2026, and on 2 April 2027 for suspended students.', used: ['c-enrol-checks'] });
    });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, calls, url: `http://127.0.0.1:${server.address().port}/v1` })));
}
