# The public glossary guided tour (Perry, 6 Nov 2026): every stop, its spotlight, Back, keys, Escape, phone width.
# Run: python3 tools/check-tour.py
import threading, http.server, functools
from playwright.sync_api import sync_playwright
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8779),functools.partial(http.server.SimpleHTTPRequestHandler,directory=__import__('os').path.dirname(__import__('os').path.dirname(__import__('os').path.abspath(__file__))))); threading.Thread(target=srv.serve_forever,daemon=True).start()
fails=[]
def ck(c,m,d=None): print(('PASS ' if c else 'FAIL ')+m+('' if c or d is None else '  '+str(d)[:250])); (None if c else fails.append(m))
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1440,'height':900}); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('mismo.tour.voiceOn','0')}catch(e){}")
    pg.goto('http://127.0.0.1:8779/index.html'); pg.wait_for_timeout(2000)
    ck(pg.is_visible('#gTourBtn') and 'About two minutes' in pg.inner_text('.gl-tourcta'), 'the header has Start the Guided Tour, with its note')
    pg.click('#gTourBtn'); pg.wait_for_timeout(600)
    ck(pg.is_visible('#dock') and pg.inner_text('#where')=='Welcome' and '1 of 8' in pg.inner_text('#count'), 'the tour opens on Welcome, 1 of 8')
    ck('Welcome to MISMO’s Business Glossary' in pg.inner_text('#cap'), '...with its caption')
    def spot_on(sel):
        return pg.evaluate("""s => { const sp = document.getElementById('spot').getBoundingClientRect(), t = document.querySelector(s).getBoundingClientRect();
          return sp.left <= t.left + 2 && sp.right >= t.right - 2 && sp.top <= t.top + 2 && sp.bottom >= t.bottom - 2; }""", sel)
    expect=[('The Latest Version','#aVer'),('Searching','label.search'),('Browse by Letter','#aAz'),('Narrow the List','#aSide'),('A Term','#aMain .A-row'),('Download and Suggest','.gl-cards'),('That’s It','#gTourBtn')]
    for k,(name,sel) in enumerate(expect, start=2):
        pg.click('#t-next'); pg.wait_for_timeout(1200)
        ck(pg.inner_text('#where')==name and f'{k} of 8' in pg.inner_text('#count') and spot_on(sel), f'Next: {name} ({k} of 8), the spotlight on it', [pg.inner_text('#where'), spot_on(sel)])
    pg.click('#t-prev'); pg.wait_for_timeout(500); ck(pg.inner_text('#where')=='Download and Suggest', 'Back goes to the stop before')
    # Narrow the List, one list at a time, each opened as it's described (Perry, 6 Nov 2026)
    pg.click('#t-prev'); pg.wait_for_timeout(700)
    ck(pg.inner_text('#where')=='A Term' and pg.query_selector('#aMain .A-row.open') is not None, 'A Term opens the first term')
    def say(text):
        pg.evaluate("t => { const s = [...document.querySelectorAll('#cap span')].find(x => x.textContent.trim().startsWith(t)); s.click(); }", text); pg.wait_for_timeout(450)
    for text, sel, name in [('First, its full definition.', '#aMain .A-row.open .def', 'the definition'), ('Then its term type.', '#aMain .A-row.open .pill.tt', 'its term type'),
                            ('Its focus areas', '#aMain .A-row.open .pill.fa', 'its focus areas'), ('And its source', '#aMain .A-row.open .pill.src', 'its source'),
                            ('Click any of these', '#aMain .A-row.open .A-tags', 'the tags'), ('Opening a term also gives it its own link.', '#aMain .A-row.open .A-head', 'its link')]:
        say(text); ck(spot_on(sel), f'...then the spotlight walks to {name}')
    ck(pg.evaluate('location.hash') == '#2004-end-user-license-ipr-policy', '...and the address is the term’s own link')
    pg.click('#t-prev'); pg.wait_for_timeout(700)
    ck(pg.inner_text('#where')=='Narrow the List' and pg.query_selector('#aMain .A-row.open') is None, 'moving on closes the term again')
    exp = lambda q: pg.get_attribute(f'[data-qpart="{q}"]', 'aria-expanded') == 'true'
    say('Term Type is'); ck(exp('tt') and spot_on('#aSide .C-sec.tt .Q-pop'), 'Term Type: its list opens, in the spotlight')
    say('Focus Area is'); ck(exp('fa') and not exp('tt') and spot_on('#aSide .C-sec.fa .Q-pop'), 'Focus Area: its list opens, Term Type’s closes')
    say('Source is'); ck(exp('src') and not exp('fa') and spot_on('#aSide .C-sec.src .Q-pop'), 'Source: its list opens, Focus Area’s closes')
    say('Pick any of them'); ck(not exp('src') and not exp('tt') and not exp('fa'), 'the last sentence closes them all')
    say('Focus Area is'); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    ck(not exp('fa'), 'closing the tour with a list open closes the list too')
    pg.click('#gTourBtn'); pg.wait_for_timeout(500); [pg.click('#t-next') for _ in range(6)]; pg.wait_for_timeout(500)
    pg.keyboard.press('ArrowLeft'); pg.wait_for_timeout(500); ck(pg.inner_text('#where')=='A Term', 'the arrow keys move between stops')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300); ck(not pg.is_visible('#dock') and 'on' not in (pg.get_attribute('#spot','class') or ''), 'Escape closes the tour')
    pg.set_viewport_size({'width':390,'height':844}); pg.click('#gTourBtn'); pg.wait_for_timeout(600)
    ck(pg.evaluate("() => { const d = document.getElementById('dock').getBoundingClientRect(); return d.left >= 0 && d.right <= innerWidth; }"), 'on a phone the caption card fits the screen')
    ck(not errs, 'no page errors ' + '; '.join(errs[:2])); b.close()
srv.shutdown(); print(len(fails),'failed')
