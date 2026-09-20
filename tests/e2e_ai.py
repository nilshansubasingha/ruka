"""E2E for the AI layer against the local Netlify emulation + fake Mistral. Run: python3 tests/e2e_ai.py (after node scripts/build.mjs)"""
import os, pathlib, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).parent.parent
env = {**os.environ, 'MOCK': '1', 'PORT': '8899'}
srv = subprocess.Popen(['node', 'scripts/dev.mjs'], cwd=root, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
for _ in range(50):
    try: urllib.request.urlopen('http://127.0.0.1:8899/', timeout=1); break
    except Exception: time.sleep(0.2)
fails = []
def check(n, c):
    print(('PASS ' if c else 'FAIL ') + n)
    if not c: fails.append(n)
def ask(pg, q): pg.fill('textarea', q); pg.keyboard.press('Enter'); pg.wait_for_timeout(2200)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); errs = []
        def page(url, **kw):
            pg = b.new_context(viewport={'width': 390, 'height': 844}, locale='en-US').new_page()
            pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'fonts.g' not in m.text and '403' not in m.text and 'ERR_' not in m.text and '503' not in m.text and 'file:///api/ai' not in m.text else None); return pg
        U = 'http://127.0.0.1:8899/#/ask'
        pg = page(U); pg.goto(U); pg.wait_for_timeout(500)
        check('page runs under the strict CSP (hash-based script, no unsafe-inline scripts)', pg.locator('h1, .composer').count() > 0 and not errs)
        ask(pg, 'When do I need 20 CFU?')
        check('rule question is answered by the engine without asking for AI consent', pg.locator('.scrim').count() == 0 and 'You need 20 CFU' in pg.inner_text('.chat'))
        pg.locator('button:has-text("New conversation")').click()
        pg.fill('textarea', 'Erasmus exchange semester impact?'); pg.keyboard.press('Enter'); pg.wait_for_timeout(1200)
        check('unknown question triggers a clear consent notice naming Mistral and what is removed', 'Mistral' in pg.inner_text('.scrim') and 'never sent' in pg.inner_text('.scrim'))
        pg.click('text=Yes, use AI'); pg.wait_for_timeout(2500)
        t = pg.inner_text('.chat')
        check('AI answer is shown with AI badge, grounded text and an official source card', 'Written by AI' in t and '30 November 2026' in t and pg.locator('.src').count() >= 1)
        check('AI answer tells the user to check the source', 'Check the source' in t)
        ask(pg, 'Erasmus exchange semester impact?')
        check('consent is remembered (no second prompt)', pg.locator('.scrim').count() == 0)
        pg.fill('textarea', 'Erasmus HALLUCINATE'); pg.keyboard.press('Enter'); pg.wait_for_timeout(2500)
        check('hallucinated AI answer is dropped; user sees "cannot confirm"', "can't confirm" in pg.inner_text('.chat').split('Erasmus HALLUCINATE')[-1])
        pg.fill('textarea', 'Erasmus BADJSON'); pg.keyboard.press('Enter'); pg.wait_for_timeout(2500)
        check('upstream failure falls back gracefully (no error card)', 'Ruka hit a problem' not in pg.inner_text('.chat'))
        # decline path
        pg2 = page(U); pg2.goto(U); pg2.wait_for_timeout(400); ask_q = 'Erasmus exchange semester impact?'
        pg2.fill('textarea', ask_q); pg2.keyboard.press('Enter'); pg2.wait_for_timeout(1200); pg2.click('text=No thanks'); pg2.wait_for_timeout(1500)
        check('declining AI keeps the rule-based "cannot confirm" answer', "can't confirm" in pg2.inner_text('.chat') and 'Written by AI' not in pg2.inner_text('.chat'))
        # no function deployed (opened as a file)
        pg3 = page((root / 'dist' / 'index.html').as_uri()); pg3.goto((root / 'dist' / 'index.html').as_uri() + '#/ask'); pg3.wait_for_timeout(400)
        pg3.evaluate("localStorage.setItem('ruka.ai','true')"); pg3.reload(); pg3.wait_for_timeout(400)
        pg3.fill('textarea', ask_q); pg3.keyboard.press('Enter'); pg3.wait_for_timeout(2500)
        check('without a function deployed, RUKA still answers (rules only) and nothing breaks', "can't confirm" in pg3.inner_text('.chat') and 'Ruka hit a problem' not in pg3.inner_text('.chat'))
        check('no JS or CSP errors', not errs); print(errs[:3])
        b.close()
finally:
    srv.terminate()
sys.exit(1 if fails else 0)
