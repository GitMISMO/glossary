#!/usr/bin/env python3
"""Builds the embeddable Business Glossary from src/ (Perry, 13 Nov 2026, for the glossary page on mismo.org).

    python3 tools/build-embed.py [OUT]      # OUT defaults to the repository root, for working locally

Writes into OUT:
  app-<fingerprint>.css   src/glossary.css with every rule scoped to #mm-glossary, behind a reset that keeps the
                          website's own styles out of the box
  app-<fingerprint>.js    src/glossary.js, unchanged
  version.json            {"js", "css", "published"}: which app files are current (embed.js reads it on every load)
  embed.js                the loader, copied from the repository root

The fingerprint is taken from the two files' contents, so it changes only when the code does; a new name means no one is
ever served a stale copy from a cache. Earlier app-* files in OUT are removed. The deploy (.github/workflows/deploy.yml)
runs this on every publish. See docs/embed.md.
"""
import datetime, hashlib, json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOX = '#mm-glossary'

# The website's own rules must not reach into the box, and the box's must not reach out (Jonna, 10 Nov 2026). Every rule
# from src/ is prefixed with #mm-glossary (1,0,0), so it beats any website rule without an id. These come first: the box
# starts from nothing the page around it set, and inside it every property the glossary doesn't set falls back to the
# browser's own default, exactly as on the standalone page. SVG keeps its drawing attributes, so it is left out.
RESET = (BOX + '{all:initial;display:block}\n'
         + BOX + ' :where(*:not(svg,svg *)),' + BOX + ' :where(*:not(svg,svg *))::before,' + BOX + ' :where(*:not(svg,svg *))::after{all:revert}\n')


def strip_comments(css):
    out, i, n = [], 0, len(css)
    while i < n:
        c = css[i]
        if c in '"\'':
            j = i + 1
            while j < n and css[j] != c:
                j += 2 if css[j] == '\\' else 1
            out.append(css[i:j + 1]); i = j + 1
        elif css.startswith('/*', i):
            j = css.find('*/', i + 2); i = n if j < 0 else j + 2
        else:
            out.append(c); i += 1
    return ''.join(out)


def split_top(s, sep):
    """Splits on sep outside (), [] and strings."""
    parts, depth, cur, q = [], 0, [], None
    for c in s:
        if q:
            cur.append(c)
            if c == q: q = None
            continue
        if c in '"\'': q = c
        elif c in '([': depth += 1
        elif c in ')]': depth -= 1
        elif c == sep and depth == 0:
            parts.append(''.join(cur)); cur = []; continue
        cur.append(c)
    parts.append(''.join(cur))
    return parts


def parse(css, i=0):
    """[(prelude, body)] where body is a string of declarations or, for @media and the like, a nested list."""
    nodes, n = [], len(css)
    while i < n:
        j, depth, q = i, 0, None
        while j < n:
            c = css[j]
            if q:
                if c == q: q = None
            elif c in '"\'': q = c
            elif c == '(': depth += 1
            elif c == ')': depth -= 1
            elif depth == 0 and c in '{};': break
            j += 1
        if j >= n:
            if css[i:].strip(): raise ValueError('unfinished rule: ' + css[i:i + 80])
            break
        prelude = css[i:j].strip()
        if css[j] == '}': return nodes, j + 1
        if css[j] == ';':
            if prelude: nodes.append((prelude, None))     # @import and the like
            i = j + 1; continue
        if prelude.startswith('@') and re.match(r'@(media|supports|layer|container)\b', prelude):
            kids, i = parse(css, j + 1); nodes.append((prelude, kids)); continue
        k, depth, q = j + 1, 1, None
        while k < n and depth:
            c = css[k]
            if q:
                if c == q: q = None
            elif c in '"\'': q = c
            elif c == '{': depth += 1
            elif c == '}': depth -= 1
            k += 1
        nodes.append((prelude, css[j + 1:k - 1])); i = k
    return nodes, i


def scope_one(sel):
    s = sel.strip()
    if s.startswith(BOX) and not re.match(r'[\w-]', s[len(BOX):len(BOX) + 1] or ' '):
        return [s]
    if s == '*':
        return [BOX, BOX + ' *']
    m = re.match(r'(:root|html|body)(?![\w-])(.*)$', s, re.S)
    if m:
        rest = m.group(2)
        if not rest.strip(): return [BOX]
        if rest[0] in '.#[:': return [BOX + rest]                       # body.touring -> #mm-glossary.touring
        if m.group(1) == 'html' and re.match(r'\s+body(?![\w-])', rest):  # html body x
            return scope_one(rest.strip()[4:].strip() or 'body')
        return [BOX + ' ' + rest.strip()]                              # body x -> #mm-glossary x
    return [BOX + ' ' + s]


def render(nodes, keyframes=False):
    out = []
    for prelude, body in nodes:
        if body is None:
            out.append(prelude + ';'); continue
        if isinstance(body, list):
            out.append(prelude + '{' + render(body) + '}'); continue
        if prelude.startswith('@'):
            if re.match(r'@(-webkit-)?keyframes\b', prelude):
                if not re.match(r'@(-webkit-)?keyframes\s+gl-', prelude):
                    raise ValueError('keyframes are page-wide: name them gl-…: ' + prelude)
                out.append(prelude + '{' + body.strip() + '}')
            elif prelude.startswith('@font-face'):
                out.append(prelude + '{' + body.strip() + '}')
            else:
                raise ValueError('unexpected at-rule: ' + prelude)
            continue
        sels = [x for one in split_top(prelude, ',') for x in scope_one(one)]
        out.append(','.join(sels) + '{' + body.strip() + '}')
    return '\n'.join(out)


def scoped_css(src):
    nodes, _ = parse(strip_comments(src))
    return RESET + render(nodes) + '\n'


def build(out):
    css_src = open(os.path.join(ROOT, 'src', 'glossary.css'), encoding='utf-8').read()
    js = open(os.path.join(ROOT, 'src', 'glossary.js'), encoding='utf-8').read()
    css = scoped_css(css_src)
    # Every element id the glossary draws starts gl- (Jonna's rule); a plain id would be shared with the whole page.
    stray = sorted({x for x in re.findall(r'\bid=["\']([A-Za-z][\w-]*)["\']', js) if not x.startswith(('gl-', 'mm-'))})
    if stray: raise SystemExit('ids without the gl- prefix: ' + ', '.join(stray))
    fp = hashlib.sha256((css + '\0' + js).encode('utf-8')).hexdigest()[:10]
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        if re.match(r'app-[0-9a-f]{10}\.(js|css)$', f) and fp not in f: os.remove(os.path.join(out, f))
    names = {'js': f'app-{fp}.js', 'css': f'app-{fp}.css'}
    open(os.path.join(out, names['css']), 'w', encoding='utf-8').write(css)
    open(os.path.join(out, names['js']), 'w', encoding='utf-8').write(js)
    version = dict(names, published=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d'))
    open(os.path.join(out, 'version.json'), 'w', encoding='utf-8').write(json.dumps(version) + '\n')
    if os.path.abspath(out) != ROOT: shutil.copy(os.path.join(ROOT, 'embed.js'), os.path.join(out, 'embed.js'))
    return version


if __name__ == '__main__':
    v = build(os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else ROOT)
    print('built', v['js'], v['css'])
