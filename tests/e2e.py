"""Browser end-to-end checks (Playwright for Python). Run: python3 tests/e2e.py  (after: node scripts/build.mjs)"""
import pathlib, sys
from playwright.sync_api import sync_playwright
URL = (pathlib.Path(__file__).parent.parent / 'dist' / 'ruka.html').resolve().as_uri()
fails = []
def check(name, cond):
    print(('PASS ' if cond else 'FAIL ') + name)
    if not cond: fails.append(name)
def ask(pg, q):
    pg.fill('textarea', q); pg.keyboard.press('Enter'); pg.wait_for_timeout(1400)
with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    def page(w=390, h=844, locale='en-US'):
        pg = b.new_context(viewport={'width': w, 'height': h}, locale=locale).new_page(); pg.add_init_script("localStorage.setItem('ruka.ai','false')")
        pg.on('pageerror', lambda e: errs.append(str(e))); return pg
    pg = page(); pg.goto(URL); pg.wait_for_timeout(400)
    check('anonymous home renders hero', pg.locator('h1').first.inner_text().startswith('Ask Ruka'))
    check('mobile: no horizontal overflow on home', pg.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    pg.evaluate("location.hash='#/ask'"); pg.wait_for_timeout(200)
    ask(pg, 'When do I need 20 CFU?')
    check('anon Ask: structured CFU answer with deadline and source', 'You need 20 CFU' in pg.inner_text('.plate') and '10' in pg.inner_text('.dline') and pg.locator('.src').count() >= 1)
    ask(pg, 'I currently have 14.')
    check('follow-up updates to 14 / 20 and 6 remaining', '14 / 20' in pg.inner_text('.chat') and '6 CFU remaining' in pg.inner_text('.chat'))
    check('details collapsed by default', pg.locator('.details:not([hidden])').count() == 0)
    pg.locator('.toggle').last.click(); check('details expand on click', pg.locator('.details:not([hidden])').count() == 1)
    check('mobile: no horizontal overflow in Ask', pg.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    ask(pg, 'What CFU do I need for 2025/26?')
    check('2025/26 question is not answered with 2026/27 rules', 'No verified source for 2025/26' in pg.inner_text('.chat'))
    ask(pg, 'blorp zzz qq'); check('unknown question says it cannot confirm', "can't confirm" in pg.inner_text('.chat'))
    pg.locator('.langsw button', has_text='IT').click(); pg.wait_for_timeout(300); check('language switch re-renders conversation in Italian', 'Non posso confermarlo' in pg.inner_text('.chat') or 'Nessuna fonte' in pg.inner_text('.chat'))
    pg.locator('.langsw button', has_text='EN').click()
    pg.evaluate("location.hash='#/situation'"); pg.wait_for_timeout(200)
    pg.click('text=Master'); pg.click('text=First year'); pg.click('text=Continue')
    pg.click('text=Yes'); pg.click('text=Fuori sede'); pg.click('text=Continue')
    pg.click('text=Non-EU'); pg.click('text=All abroad'); check('ISEE Parificato explained instead of asking for a number', 'ISEE Parificato is calculated' in pg.inner_text('.f') or 'calculated by EDISU' in pg.inner_text('.f'))
    pg.click('text=Continue'); pg.click('text=See my situation'); pg.wait_for_timeout(300)
    t = pg.inner_text('main'); check('Situation result shows cards and next actions', 'ISEE Parificato' in t and 'What to do next' in t)
    pg.evaluate("location.hash='#/deadlines'"); pg.wait_for_timeout(300)
    check('personal deadlines section present after situation', 'Relevant to you' in pg.inner_text('main'))
    pg.click('button:has-text("PoliTO")'); pg.wait_for_timeout(200); check('PoliTO filter shows only PoliTO', 'Bando' not in pg.inner_text('.dcards') and 'enrolment' in pg.inner_text('.dcards').lower())
    pg.evaluate("location.hash='#/documents'"); pg.wait_for_timeout(200); pg.click('text=Ranking says'); pg.wait_for_timeout(300)
    t = pg.inner_text('main'); check('document analysis separates document facts from official source', 'Found in your uploaded document' in t and 'SOSPESO' in t and 'Official source' in t)
    pg.evaluate("location.hash='#/admin'"); pg.wait_for_timeout(200); pg.click('button:has-text("tests")'); pg.click('text=Run self-tests'); pg.wait_for_timeout(400)
    check('admin self-tests all pass in the browser', 'passed' in pg.inner_text('.admin') and 'FAIL' not in pg.inner_text('.admin'))
    s = page(1280, 800, 'si-LK'); s.goto(URL); s.wait_for_timeout(300)
    check('Sinhala locale selects Sinhala UI', 'Ruka' in s.locator('h1').first.inner_text() and s.evaluate("document.documentElement.lang") == 'si')
    d = page(); d.goto(URL); d.click('button[aria-label="Sign in"]'); d.click('text=Nimal (demo)'); d.wait_for_timeout(400)
    check('demo persona sign-in personalises Home', 'Nimal' in d.inner_text('h1'))
    check('no JS errors', not errs); print(errs[:3])
    b.close()
sys.exit(1 if fails else 0)
