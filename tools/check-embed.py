# The embedded glossary on a stand-in for mismo.org's Glossary page (Perry, 13 Nov 2026; Jonna's rules of 10 Nov 2026).
# Run: python3 tools/check-embed.py   (builds first; needs Playwright with Chromium, and Pillow)
# The glossary's files are served from one address and the stand-in website from another, as resources.mismo.org and
# www.mismo.org will be. tools/embed-test-page.html is the stand-in: a sticky header with a menu, a jQuery-style $, a box
# positioned around the glossary, and unfriendly site-wide styles. The relay is stood in: nothing is sent anywhere.
import functools, http.server, io, json, os, re, subprocess, sys, threading, time
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'build-embed.py')], check=True)
GP, SP = 8711, 8712
GLOSS, SITE = f'http://127.0.0.1:{GP}', f'http://127.0.0.1:{SP}'
RELAY = 'https://rgvdi67cg27o5kcmiytcqbqnrm0hmztx.lambda-url.us-east-1.on.aws/'


class Pages(http.server.SimpleHTTPRequestHandler):   # GitHub Pages lets any site read its files
    def end_headers(self): self.send_header('Access-Control-Allow-Origin', '*'); super().end_headers()
    def log_message(self, *a): pass


TEST = open(os.path.join(ROOT, 'tools', 'embed-test-page.html'), encoding='utf-8').read().replace('GLOSSARY_BASE', GLOSS)
BARE = re.sub(r'<script>\s*window\.MISMO_GLOSSARY.*?</script>\s*<script src="[^"]*embed\.js"></script>', '', TEST, flags=re.S)
AUTO = re.sub(r'<script>\s*window\.MISMO_GLOSSARY.*?</script>', '', TEST, flags=re.S)
assert BARE != TEST and AUTO != TEST


class Site(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        body = {'/bare.html': BARE, '/auto.html': AUTO}.get(self.path.split('?')[0], TEST).encode('utf-8')
        self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.end_headers(); self.wfile.write(body)
    def log_message(self, *a): pass


for port, h in [(GP, functools.partial(Pages, directory=ROOT)), (SP, Site)]:
    s = http.server.ThreadingHTTPServer(('127.0.0.1', port), h); threading.Thread(target=s.serve_forever, daemon=True).start()

fails = []
def ck(c, m, d=None):
    print(('PASS ' if c else 'FAIL ') + m + ('' if c or d is None else '  ' + str(d)[:300])); (None if c else fails.append(m))

def same(a, b):
    A, B = Image.open(io.BytesIO(a)).convert('RGB'), Image.open(io.BytesIO(b)).convert('RGB')
    if A.size != B.size: return f'sizes {A.size} and {B.size}'
    box = ImageChops.difference(A, B).getbbox(); return True if box is None else f'differs in {box}'

SITE_ELS = ['body', '#site-header', '#site-menu-link', '#site-menu', '#site-footer', '#site-footer p', '#site-footer a', '#ask-mismo']
PROPS = ['font-family', 'font-size', 'color', 'background-color', 'margin-top', 'padding-left', 'line-height', 'letter-spacing',
         'text-align', 'text-transform', 'border-top-width', 'height', 'z-index', 'position', 'display', 'box-sizing']
STYLES_JS = """([els, props]) => els.map(s => { const e = document.querySelector(s); if(!e) return null; const c = getComputedStyle(e); return props.map(p => s === 'body' && p === 'height' ? '' : c.getPropertyValue(p)); })"""

with sync_playwright() as p:
    br = p.chromium.launch()
    def page(w=1280, h=900, delay=0):
        pg = br.new_page(viewport={'width': w, 'height': h}); pg.errs = []; pg.reqs = []; pg.sent = []
        pg.on('pageerror', lambda e: pg.errs.append(str(e)))
        pg.on('console', lambda m: pg.errs.append(m.text) if m.type == 'error' else None)
        pg.on('request', lambda r: pg.reqs.append(r.url))
        if delay:
            pg.route('**/data/glossary.json*', lambda r: (time.sleep(delay), r.continue_()))
        def relay(r):
            pg.sent.append({'url': r.request.url, 'origin': r.request.headers.get('origin'), 'body': r.request.post_data})
            r.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': r.request.headers.get('origin') or '*'},
                      body=json.dumps({'ok': True, 'reference': 'SUG-0042', 'at': '2026-11-13T15:00:00Z'}))
        pg.route(RELAY + '**', relay)
        pg.add_init_script("try{localStorage.setItem('mismo.tour.voiceOn','0')}catch(e){}")
        return pg
    def ready(pg, url):
        pg.goto(url); pg.wait_for_selector('#gl-aMain .A-row', timeout=20000); pg.wait_for_timeout(400)

    # ---------- the built styles stay inside the box
    import importlib.util
    spec = importlib.util.spec_from_file_location('build_embed', os.path.join(ROOT, 'tools', 'build-embed.py')); B = importlib.util.module_from_spec(spec); spec.loader.exec_module(B)
    css = open(os.path.join(ROOT, json.load(open(os.path.join(ROOT, 'version.json')))['css']), encoding='utf-8').read()
    def walk(nodes):
        for prelude, body in nodes:
            if isinstance(body, list): yield from walk(body)
            elif body is not None and not prelude.startswith('@'):
                yield from (x.strip() for x in B.split_top(prelude, ','))
    sels = list(walk(B.parse(B.strip_comments(css))[0]))
    loose = [x for x in sels if not re.match(r'#mm-glossary(?![\w-])', x)]
    ck(sels and not loose, f'every built style rule ({len(sels)} selectors) is scoped to #mm-glossary', loose[:3])

    # ---------- while the terms load
    pg = page(delay=1.5); pg.goto(SITE + '/'); pg.wait_for_selector('#gl-aQ', timeout=10000)
    shell = pg.evaluate("""() => ({ h1: (document.querySelector('#gl-page h1')||{}).textContent, q: document.getElementById('gl-aQ').disabled,
        load: (document.querySelector('#gl-aMain .boot')||{}).textContent, tour: document.getElementById('gl-gTourBtn').disabled, rows: document.querySelectorAll('.A-row').length })""")
    ck(shell['h1'] and 'Business Glossary' in shell['h1'] and shell['q'] and shell['tour'] and shell['load'] == 'Loading the glossary\u2026' and shell['rows'] == 0,
       'before the terms arrive: the hero and the search box are drawn, the box and the tour wait, and a loading line shows', shell)
    pg.wait_for_selector('#gl-aMain .A-row', timeout=20000)
    ck(not pg.evaluate("document.getElementById('gl-aQ').disabled") and not pg.evaluate("document.getElementById('gl-gTourBtn').disabled"), '...then the search box and the tour are switched on')
    pg.close()

    # ---------- side by side with the standalone page
    bare = page(); bare.goto(SITE + '/bare.html'); bare.wait_for_timeout(300)
    keys0 = set(bare.evaluate('Object.keys(window)')); site0 = bare.evaluate(STYLES_JS, [SITE_ELS, PROPS])
    kids0 = bare.evaluate("() => [...document.body.children].map(e => e.id || e.tagName).join(',')"); bare.close()
    pg = page(); ready(pg, SITE + '/?from=menu')
    keys1 = set(pg.evaluate('Object.keys(window)'))
    ck(keys1 - keys0 == {'MISMO_GLOSSARY'} or keys1 - keys0 == set(), 'no new global name but MISMO_GLOSSARY', sorted(keys1 - keys0))
    ck(pg.evaluate("$() === 'the website\u2019s jQuery' && $.fn.jquery === '3.6.0'"), 'the website\u2019s $ is untouched')
    ck(pg.evaluate(STYLES_JS, [SITE_ELS, PROPS]) == site0, 'the website\u2019s header, menu, footer, Ask MISMO and page keep exactly the styles they had without the glossary')
    bad = pg.evaluate("() => [...document.querySelectorAll('#mm-glossary [id]')].map(e => e.id).filter(i => !i.startsWith('gl-'))")
    ck(not bad, 'every element id inside the glossary starts gl-', bad[:5])
    outside = pg.evaluate("() => [...document.body.children].map(e => e.id || e.tagName).join(',')")
    ck(outside == kids0 + ',SCRIPT,SCRIPT', 'nothing is added to the page outside the glossary\u2019s box (the two scripts are the website\u2019s own block)', [kids0, outside])
    ck(pg.evaluate("[...document.querySelectorAll('head [data-mm-glossary]')].map(e => e.tagName).sort().join()") == 'LINK,SCRIPT', '...apart from its one stylesheet and one script, in the head')
    ck(pg.evaluate("getComputedStyle(document.getElementById('mm-glossary')).fontFamily === getComputedStyle(document.body).fontFamily"), 'the glossary uses the website\u2019s font')
    ck(not [u for u in pg.reqs if 'fonts.g' in u], '...and loads no fonts of its own')
    ck(pg.evaluate("document.querySelector('.gl-card[href]').href") == 'https://collaborate.mismo.org/viewdocument/business-glossary', 'the Members Only download link is unchanged')

    st = page(); ready(st, GLOSS + '/index.html')
    ck(st.evaluate("!!document.querySelector('.mm-header') && !!document.querySelector('.mm-footer')") and not pg.evaluate("!!document.querySelector('#mm-glossary .mm-header, #mm-glossary .mm-footer')"),
       'embedded, the glossary draws no header or footer; standalone, it still draws its own')
    pg.add_style_tag(content='#ask-mismo{visibility:hidden}')
    def shot(q, sel, h=640):   # the part's top 200 pixels down the screen, below anything sticky, and at most h tall
        q.evaluate("([s]) => { const r = document.querySelector(s).getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.top - 200); }", [sel]); q.wait_for_timeout(250)
        r = q.evaluate("([s]) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }", [sel])
        return q.screenshot(clip={'x': r[0], 'y': r[1], 'width': r[2], 'height': min(h, r[3])})
    hero = '#gl-page > div:not(.mm-header)'
    # The hero's shading is dithered by its place on the page, so for this one picture both heroes sit at the very top.
    pg.add_style_tag(content='#site-header,#site-title{display:none}'); st.add_style_tag(content='.mm-header{display:none}')
    def top(q):
        q.evaluate('window.scrollTo(0, 0)'); q.wait_for_timeout(200)
        r = q.evaluate("() => { const r = document.querySelector('#gl-page > div:not(.mm-header)').getBoundingClientRect(); return [r.top, r.width, r.height]; }")
        return Image.open(io.BytesIO(q.screenshot(clip={'x': 0, 'y': r[0], 'width': r[1], 'height': r[2]}))).convert('RGB')
    a, b = top(pg), top(st)
    # Its art is gradients, which the graphics card dithers differently from page to page: a faint speckle, never more than
    # a few levels and on a small share of pixels. Anything the website's styles changed (text, spacing, colour) is far more.
    d = ImageChops.difference(a, b).convert('L').tobytes() if a.size == b.size else b'\xff'
    worst, speckle = max(d), sum(1 for v in d if v > 4) / len(d)
    ck(worst <= 16 and speckle < 0.005, 'the hero looks as on the standalone page, despite the website\u2019s own styles (only the art\u2019s dither differs)', [worst, round(speckle, 4)])
    pg.evaluate("document.querySelectorAll('style').forEach(s => { if(s.textContent === '#site-header,#site-title{display:none}') s.remove(); })")
    st.evaluate("document.querySelectorAll('style').forEach(s => { if(s.textContent === '.mm-header{display:none}') s.remove(); })")
    for sel, name in [('.gl-sec', 'Search the Glossary'), ('.A-az', 'the letters'), ('.A-body', 'the list and the side panel')]:
        r = same(shot(pg, sel), shot(st, sel)); ck(r is True, f'{name} looks exactly as on the standalone page, despite the website\u2019s own styles', r)
    for q in (pg, st):
        q.evaluate('window.scrollTo(0, 0)'); q.fill('#gl-aQ', 'escrow'); q.wait_for_timeout(500); q.click('#gl-aMain .A-row .A-head'); q.wait_for_timeout(400)
    r = same(shot(pg, '#gl-aMain', 800), shot(st, '#gl-aMain', 800)); ck(r is True, 'a search with a term open looks exactly as on the standalone page', r)
    st.close()

    # ---------- term links
    slug = pg.evaluate('location.hash.slice(1)')
    ck(slug == 'escrow' and pg.evaluate("location.pathname + location.search") == '/?from=menu', 'opening a term changes only the # (the page\u2019s own address and ?query stay)', pg.evaluate('location.href'))
    ck(pg.evaluate("location.origin + location.pathname + location.hash") == SITE + '/#escrow', 'the address to share is this page\u2019s own, with the term\u2019s #')
    pg.evaluate("location.hash = '#escrow-account'"); pg.wait_for_timeout(500)
    ck((pg.evaluate("(document.querySelector('#gl-aMain .A-row.open .A-head .t')||{}).textContent") or '').lower() == 'escrow account', 'changing the # opens that term')
    pg.close()
    pg = page(); ready(pg, SITE + '/#escrow-analysis')
    ck((pg.evaluate("(document.querySelector('#gl-aMain .A-row.open .A-head .t')||{}).textContent") or '').lower() == 'escrow analysis', 'a link with a term\u2019s # opens that term on arrival')
    pg.close()

    # ---------- under the website's sticky header
    pg = page(); ready(pg, SITE + '/')
    pg.click('#gl-aMain .A-row .A-head'); pg.wait_for_timeout(200)
    pg.click('#gl-aMain .A-row.open .pill.fa'); pg.wait_for_timeout(1200)
    top = pg.evaluate("document.getElementById('gl-aMain').getBoundingClientRect().top")
    ck(abs(top - 160) <= 2, 'picking a focus area brings the list to 100 pixels below the website\u2019s 60-pixel header, as it sits 100 below the top on the standalone page', top)
    pg.mouse.wheel(0, 1600); pg.wait_for_timeout(500)
    ck(pg.evaluate("Math.round(document.querySelector('.A-az').getBoundingClientRect().top)") == 60, 'scrolled, the letters stick just under the website\u2019s header, not beneath it',
       pg.evaluate("document.querySelector('.A-az').getBoundingClientRect().top"))
    pg.evaluate("document.getElementById('site-header').classList.add('admin'); window.dispatchEvent(new Event('scroll'))"); pg.wait_for_timeout(300)
    ck(pg.evaluate("Math.round(document.querySelector('.A-az').getBoundingClientRect().top)") == 90, '...and under the 90-pixel header when an administrator is signed in')
    pg.evaluate("document.getElementById('site-header').classList.remove('admin'); window.dispatchEvent(new Event('scroll'))"); pg.wait_for_timeout(200)
    pg.hover('#site-menu-link'); pg.wait_for_timeout(200)
    hit = pg.evaluate("() => { const r = document.querySelector('#site-menu li:last-child a').getBoundingClientRect(); const e = document.elementFromPoint(r.left + 20, r.top + r.height / 2); return e && e.closest('#site-menu') ? 'menu' : (e && (e.id || e.className)); }")
    ck(hit == 'menu', 'the website\u2019s menu opens over the glossary, sticky letters and all', hit)
    pg.mouse.move(700, 600)

    # ---------- the guided tour
    pg.evaluate('window.scrollTo(0, 0)'); pg.wait_for_timeout(200)
    pg.click('#gl-gTourBtn'); pg.wait_for_timeout(700)
    stops = []
    for k in range(8):
        g = pg.evaluate("""() => { const s = document.getElementById('gl-spot').getBoundingClientRect(); return { where: document.getElementById('gl-where').textContent,
            s: [s.top, s.left, s.width, s.height], hdr: document.getElementById('site-header').getBoundingClientRect().bottom }; }""")
        stops.append(g)
        if k < 7: pg.click('#gl-t-next'); pg.wait_for_timeout(1300)
    ck(all(g['s'][0] >= g['hdr'] - 1 for g in stops), 'every stop\u2019s spotlight sits below the website\u2019s header', [(g['where'], round(g['s'][0])) for g in stops])
    pg.click('#gl-t-prev'); pg.wait_for_timeout(300); pg.click('#gl-t-prev'); pg.wait_for_timeout(300); pg.click('#gl-t-prev'); pg.wait_for_timeout(300)
    pg.click('#gl-t-prev'); pg.wait_for_timeout(300); pg.click('#gl-t-prev'); pg.wait_for_timeout(1300)
    fit = pg.evaluate("""() => { const s = document.getElementById('gl-spot').getBoundingClientRect(), t = document.querySelector('label.search').getBoundingClientRect();
        return [document.getElementById('gl-where').textContent, Math.abs(s.top + 10 - t.top), Math.abs(s.left + 10 - t.left), Math.abs(s.width - 20 - t.width)]; }""")
    ck(fit[0] == 'Searching' and max(fit[1:]) < 2, 'the spotlight lines up with what it lights, though the glossary sits in a positioned box', fit)
    ck(pg.evaluate("getComputedStyle(document.getElementById('gl-dock')).display") == 'block' and pg.evaluate("document.getElementById('mm-glossary').classList.contains('touring')"),
       'the tour\u2019s controls show, and only the glossary\u2019s box is marked as touring', pg.evaluate("document.body.className"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    ck(pg.evaluate("getComputedStyle(document.getElementById('gl-dock')).display") == 'none', 'Escape closes the tour')

    # ---------- Suggest a Term
    pg.click('[data-suggest]'); pg.wait_for_timeout(400)
    over = pg.evaluate("() => { const d = document.getElementById('gl-sg'), r = d.getBoundingClientRect(); const e = document.elementFromPoint(r.left + 30, r.top + 30); return [d.open, !!(e && d.contains(e)), getComputedStyle(d).borderTopColor]; }")
    ck(over[0] and over[1] and over[2] != 'rgb(255, 0, 0)', 'Suggest a Term opens over everything, the website\u2019s header included, in its own style', over)
    pg.fill('#gl-sgTerm', 'Escrow Shortage Cushion'); pg.fill('#gl-sgDef', 'The amount a servicer may hold beyond the computed escrow need.')
    pg.fill('#gl-sgName', 'Dana Whitfield'); pg.fill('#gl-sgOrg', 'Northbridge Mortgage'); pg.fill('#gl-sgEmail', 'dana@northbridge.example')
    pg.wait_for_timeout(3200); pg.click('#gl-sgGo'); pg.wait_for_timeout(800)
    sent = pg.sent[-1] if pg.sent else {}
    ck(sent.get('url', '').endswith('/glossary-data/suggestions/submit') and sent.get('origin') == SITE, 'it sends to the same relay address as today, from the website\u2019s own address (what relay request 11 allows)', sent)
    ck('SUG-0042' in pg.evaluate("document.getElementById('gl-sgDoneText').textContent") and pg.evaluate("!document.getElementById('gl-sgDone').hidden"), '...and shows its thank-you with the reference')
    pg.click('#gl-sgClose'); pg.wait_for_timeout(200)
    ck(not pg.errs, 'no errors in the browser console', pg.errs[:3])
    pg.close()

    # ---------- phone
    pg = page(390, 844); ready(pg, SITE + '/')
    ck(pg.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'), 'at 390 pixels wide nothing scrolls sideways',
       pg.evaluate('[document.documentElement.scrollWidth, document.documentElement.clientWidth]'))
    pg.fill('#gl-aQ', 'borrower'); pg.wait_for_timeout(400); pg.click('#gl-aMain .A-row .A-head'); pg.wait_for_timeout(300)
    ck(pg.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'), '...nor with a term open')
    ck(not pg.errs, '...and no errors', pg.errs[:3]); pg.close()

    # ---------- how it loads
    pg = page(); ready(pg, SITE + '/auto.html')
    ck(pg.evaluate("document.querySelectorAll('#gl-page').length") == 1 and pg.evaluate("MISMO_GLOSSARY.version && MISMO_GLOSSARY.version.js") == json.load(open(os.path.join(ROOT, 'version.json')))['js'],
       'with no options set, it mounts itself on #mm-glossary, once, and says which version it loaded')
    pg.evaluate("MISMO_GLOSSARY.mount(document.getElementById('mm-glossary'), {})"); pg.wait_for_timeout(300)
    ck(pg.evaluate("document.querySelectorAll('#gl-page').length") == 1, 'mounting again changes nothing'); pg.close()
    pg = page(); stale = {'n': 0}
    def ver(r):
        stale['n'] += 1
        if stale['n'] == 1: r.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body='{"js":"app-0000000000.js","css":"app-0000000000.css","published":"2026-11-12"}')
        else: r.continue_()
    pg.route('**/version.json*', ver); ready(pg, SITE + '/')
    ck(stale['n'] == 2, 'just after a publish, a page that finds its app files gone asks for the current ones and loads', stale)
    pg.close()
    br.close()

print(f'{len(fails)} failed' if fails else '0 failed'); sys.exit(1 if fails else 0)
