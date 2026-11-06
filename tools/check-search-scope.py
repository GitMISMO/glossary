# Search in term names only, or definitions only (Perry, 6 Nov 2026). Run: python3 tools/check-search-scope.py
import os, threading, http.server, functools
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8791), functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)); threading.Thread(target=srv.serve_forever, daemon=True).start()
fails = []
def ck(c, m, d=None): print(('PASS ' if c else 'FAIL ') + m + ('' if c or d is None else '  ' + str(d)[:250])); (None if c else fails.append(m))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1440, 'height': 900}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://127.0.0.1:8791/index.html'); pg.wait_for_timeout(2000)
    labels = pg.eval_on_selector_all('#aScope button', 'b => b.map(x => x.textContent)')
    ck(labels == ['Terms and Definitions', 'Term Names Only', 'Definitions Only'], 'three choices under the box, no counts before a search', labels)
    ck(pg.get_attribute('[data-scope="all"]', 'aria-pressed') == 'true', 'Terms and Definitions is the default')
    count = lambda: int(pg.inner_text('#aMain .L-n b').replace(',', ''))
    pg.fill('#aQ', 'borrower'); pg.wait_for_timeout(500)
    ck(pg.eval_on_selector_all('#aScope button b', 'b => b.map(x => x.textContent)') == ['845', '130', '842'], 'with “borrower” typed, each shows how many it finds: 845, 130, 842')
    ck(count() == 845, 'the default finds what the search always found (845)')
    pg.click('[data-scope="term"]'); pg.wait_for_timeout(300)
    ck(count() == 130 and all('borrower' in t.lower() for t in pg.eval_on_selector_all('#aMain .A-head .t', 'e => e.map(x => x.textContent)')), 'Term Names Only: 130, every one with “borrower” in its name')
    ck(pg.evaluate('document.activeElement.dataset.scope') == 'term', '...the choice keeps the keyboard focus')
    pg.click('[data-scope="def"]'); pg.wait_for_timeout(300); ck(count() == 842, 'Definitions Only: 842')
    pg.click('[data-clearall]') if pg.query_selector('[data-clearall]') else None; pg.wait_for_timeout(300)
    pg.fill('#aQ', ''); pg.wait_for_timeout(300); pg.click('[data-scope="all"]'); pg.wait_for_timeout(200)
    ck(count() == 8397, 'back to all 8,397 with the search cleared')
    pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(300)
    ck(pg.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'phone width: the choices wrap; nothing scrolls sideways')
    ck(not errs, 'no page errors ' + '; '.join(errs[:2])); b.close()
srv.shutdown(); print(len(fails), 'failed')
