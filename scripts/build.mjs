// Inlines engine + UI into one self-contained HTML file (dist/ruka.html). Node >= 20, no dependencies.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const order = ['src/engine/kb.js', 'src/engine/ai-guard.js', 'src/engine/i18n-ui.js', 'src/engine/i18n.js', 'src/engine/engine.js'];
const strip = (s) => s.replace(/^import [^\n]*\n/gm, '').replace(/^export \{[^}]*\};?\n/gm, '').replace(/^export (default )?/gm, '');
let js = '';
for (const f of order) js += `\n/* ── ${f} ── */\n` + strip(rd(f));
const engineSrc = rd('src/engine/engine.js');
const names = new Set([...engineSrc.matchAll(/^export (?:async )?(?:const|function) (\w+)/gm)].map((m) => m[1]));
(engineSrc.match(/^export \{([^}]*)\}/m)?.[1] || '').split(',').map((x) => x.trim()).filter(Boolean).forEach((n) => names.add(n));
js += `\nconst E = { ${[...names].join(', ')} };\n`;
for (const f of ['src/engine/selftest.js', 'src/ui/app-core.js', 'src/ui/app-pages.js']) js += `\n/* ── ${f} ── */\n` + strip(rd(f));
if (/<\/script/i.test(js)) throw new Error('script terminator inside JS');
const html = rd('src/ui/index.template.html').replace('/*__CSS__*/', () => rd('src/ui/styles.css')).replace('/*__JS__*/', () => `(() => {\n'use strict';${js}\n})();`);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/ruka.html'), html);
fs.writeFileSync(path.join(root, 'dist/index.html'), html);
// Content-Security-Policy with a hash of the one inline script (no 'unsafe-inline' for scripts). Styles need 'unsafe-inline' because the UI sets style attributes.
const inline = html.split('<script>')[1].split('</script>')[0];
const hash = 'sha256-' + crypto.createHash('sha256').update(inline).digest('base64');
const csp = `default-src 'self'; script-src 'self' '${hash}'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`;
fs.writeFileSync(path.join(root, 'dist/_headers'), `/*\n  Content-Security-Policy: ${csp}\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  X-Frame-Options: DENY\n`);
console.log('dist/ruka.html', (html.length / 1024).toFixed(0) + ' KB');
