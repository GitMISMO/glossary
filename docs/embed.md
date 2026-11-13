# The Glossary on mismo.org

The public glossary is moving to the Glossary page on mismo.org: www.mismo.org/glossary, and collaborate.mismo.org/mismowebsite/glossary until the site moves. The plan is Jonna's "Business Glossary on mismo.org: What Perry's Side Provides" (10 November 2026). This page describes what the glossary side built for it (Perry, 13 November 2026).

The console stays at `resources.mismo.org/glossary/console/`, and so do the data files. Only the public page moves.

## What the Website Loads

All of these live at `https://resources.mismo.org/glossary/`, published by the deploy on every push:

| File | What It Is | Changes When |
|---|---|---|
| `embed.js` | The loader. Its address never changes. | Almost never |
| `version.json` | `{"js": "app-<fingerprint>.js", "css": "app-<fingerprint>.css", "published": "YYYY-MM-DD"}` | The code changes |
| `app-<fingerprint>.js` and `.css` | The glossary. The name changes with the content, so caches never serve an old copy. | The code changes |
| `data/glossary.json`, `data/reference.json` | The terms, read by full address | Kellie publishes |

A new glossary version that Kellie publishes from the console shows on mismo.org at once, because the page reads the data directly. `version.json` changes only when the glossary's code does.

**The website's block.** It goes on the Glossary page only:

```html
<div id="mm-glossary"></div>
<script>
  window.MISMO_GLOSSARY = { options: {
    headerOffset: function(){ return document.querySelector('<the sticky header>').offsetHeight; }
  } };
</script>
<script src="https://resources.mismo.org/glossary/embed.js"></script>
```

`embed.js` mounts the glossary on `#mm-glossary` by itself, using any options set beforehand. The website can instead call `MISMO_GLOSSARY.mount(element, options)` once the script has loaded. That returns a promise, which settles when the terms are in. A second mount changes nothing.

**Options:**
- `headerOffset`: a function returning the sticky header's height in pixels (60, or 90 with an administrator signed in). The glossary uses it for scrolling, the tour's spotlight, and the sticky letters and side panel. It's read again on every scroll, so a change in height is followed.
- `base`: where the data and files live. It defaults to wherever `embed.js` came from.
- `embedded`: true by default from `embed.js`. When true, the glossary draws no header or footer and takes the website's font.

`MISMO_GLOSSARY.version` holds `version.json`'s contents once they've been read.

## Sharing the Page

These are Jonna's rules for an embedded glossary, and how the build meets each one.

- **No global names except `window.MISMO_GLOSSARY`.** All the code is inside one function.
- **Every style is scoped under `#mm-glossary`.** The build prefixes every rule.
  - A reset placed ahead of those rules stops the website's own styles reaching in.
  - Inside the box, anything the glossary doesn't set falls back to the browser's default, exactly as on the standalone page.
  - SVG is left out of the reset, because the reset would wipe its drawing attributes.
- **Prefixed element ids.** Every id starts `gl-`, and the build refuses one that doesn't.
- **Layers stay below the menu.** Every layer sits below z-index 1030, so the website's menu opens over the glossary.
  - Suggest a Term is a native dialog, which always sits on top.
  - The tour's spotlight is placed relative to the box it sits in, so a positioned wrapper on the website doesn't shift it.
- **Term links.** A term's link is the page's own address plus `#<slug>`. Opening a term changes only the `#`, never the path or query.
- **Loading.** The hero and the search box are drawn at once. The search box and the tour stay off, and a loading line shows, until the terms arrive.
- **Suggest a Term** posts to the relay from the website's address. That needs relay request 11, plus `"suggestOrigins"` on `glossary-data` in `_internal/projects.json`. Until both are in place, sending from mismo.org fails.

## The Source

- `src/glossary.js` and `src/glossary.css` are the glossary. Edit these, not the built files.
- `index.html` is the standalone page. It loads `embed.js` and mounts the glossary with `{embedded: false}`, which draws its own copy of the website's header and footer.
- At go-live, `index.html` becomes a forwarder to www.mismo.org/glossary that keeps the `#`, and `src/` stays the source.
- `tools/build-embed.py [OUT]` builds the files into OUT. With no OUT it builds into the repository root, where they're ignored by git.
- To work locally: `python3 tools/build-embed.py && python3 -m http.server 8000`.

## Checks

- **`tools/check-embed.py`:** 40 checks, run on `tools/embed-test-page.html`. That page is a stand-in for the website's Glossary page with:
  - a sticky header and its menu
  - a jQuery-style `$`
  - a positioned wrapper
  - deliberately unfriendly site-wide styles

  The checks cover:
  - Isolation in both directions, compared with screenshots against the standalone page.
  - Loading order, term links, the sticky header at 60 and 90 pixels, and the menu opening over the glossary.
  - The tour's spotlight, and Suggest a Term with the relay stood in.
  - The phone width, the automatic mount, and recovery when a publish replaces the files mid-load.
- **`tools/check-tour.py` and `tools/check-search-scope.py`:** run on the standalone page.

All of them build first.
