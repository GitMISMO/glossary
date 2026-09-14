# Saving: how this works, and how to reuse it

Written up for reuse elsewhere. Nothing here is specific to a glossary — the pattern
suits any browser-based editor where one person maintains a body of content over months
and publishes it periodically, with no server of your own.

The short version: **the browser holds a working copy, a Git repository holds the truth,
and almost all the difficulty is in the guards rather than the saving.**

> If the project you are reusing this for publishes on save — no staging, no draft — read
> **`saving-pattern-immediate.md`** instead. It is the same architecture with the middle
> two states removed, and it says which parts drop out and which matter more.

---

## 1. Three states, not two

Most editors have "unsaved" and "saved". That is not enough when work accumulates for
months before anyone sees it. This uses three:

| State | What it means | Where it lives |
| --- | --- | --- |
| **Staged** | Edited, validated, not yet part of the working copy | Browser only |
| **Draft** | Part of the working copy, not yet public | Browser, mirrored to the repository |
| **Published** | Live | Repository, deployed |

Staged exists so a batch can be reviewed as a set before any of it lands. Draft exists so
months of work can accumulate without being public. The separation is what makes it
possible to say "apply these twelve edits" and "publish version 4" as different decisions.

If your project has no review step, collapse staged and draft. Do not collapse draft and
published — that is the one that stops half-finished work reaching readers.

---

## 2. Two places, two different jobs

**IndexedDB** holds the live working copy. Every edit writes there immediately, so a
refresh, a crash or a closed laptop lid loses nothing. It is not a backup: it is scoped
to one origin in one browser profile, and clearing site data destroys it.

```js
const persist = async () => {
  await idbSet('master', master);      // the working copy
  await idbSet('baseline', baseline);  // what was last published
  await idbSet('staged', staged);      // edits awaiting review
  await idbSet('vocab', vocab);        // controlled lists
  // …every piece of state, individually keyed
};
```

**A Git repository** holds the truth. It gets the draft on a timer and the published
content on release. It is the actual safety net, because it survives the machine and
carries full history.

The division matters: local writes are instant and constant, remote writes are periodic
and deliberate. Do not try to make the remote write on every keystroke — you will hit rate
limits and produce a useless history.

---

## 3. The draft file is a diff, not a copy

The working copy here is about 2.9MB. Committing that hourly for months would bloat the
repository for no benefit and make every commit unreadable.

Instead the draft file holds only what differs from the last published version:

```js
{
  format: 1,
  savedAt: '2026-09-09T14:00:00Z',
  editor: 'Jordan Ellis',
  summary: { added: 0, edited: 27, removed: 0 },
  diff: { added: [...rows], edited: [...rows], removed: [...ids] },
  …other state that is small: controlled lists, staged edits, release history
}
```

**1.7KB instead of 2.9MB** in practice. Restoring is: fetch the published content, apply
the diff.

This only works if you can reconstruct the base. Here the base is the published file in
the same repository, so it is always available. If your base can move independently,
record which version the diff applies to.

---

## 4. Writing to Git from a browser

Two things catch people out.

**The simple API caps at 1MB.** GitHub's Contents API refuses larger files, so anything
substantial needs the Git Data API: create blobs, build a tree, create a commit, move the
ref. Four calls instead of one, no size limit, and it commits several files atomically —
which matters when the content and its metadata must not disagree.

```js
async function ghCommit(files, message){
  const ref    = await gh(`/git/ref/heads/${branch}`);
  const parent = ref.object.sha;
  const base   = await gh(`/git/commits/${parent}`);

  const blobs = [];
  for (const f of files) {
    const b = await gh('/git/blobs', { method:'POST',
      body: JSON.stringify({ content: toBase64(f.content), encoding:'base64' }) });
    blobs.push({ path: f.path, mode:'100644', type:'blob', sha: b.sha });
  }
  const tree   = await gh('/git/trees',   { method:'POST',
    body: JSON.stringify({ base_tree: base.tree.sha, tree: blobs }) });
  const commit = await gh('/git/commits', { method:'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents:[parent] }) });

  // Deliberately not forced: if the branch moved under us this fails rather
  // than discarding someone else's commit.
  await gh(`/git/refs/heads/${branch}`, { method:'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }) });
  return commit.sha;
}
```

**btoa() cannot take a spread array.** Converting megabytes with
`String.fromCharCode(...bytes)` overflows the call stack. Convert in chunks:

```js
function toBase64(str){
  const bytes = new TextEncoder().encode(str);
  let bin = '', CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH)
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(bin);
}
```

**Reads must bypass the cache.** A file read straight after writing it comes back stale
otherwise, which quietly breaks any check that compares local against remote:

```js
fetch(url, { cache: 'no-store', headers: { Accept: 'application/vnd.github.raw' } })
```

---

## 5. The guards are the hard part

Saving is easy. Not saving at the wrong moment is where the real design is. Every guard
below exists because its absence caused a real failure.

```js
async function maybeAutoSave(){
  if (!connected)            return;   // nothing to save to
  if (state.behind)          return;   // remote is newer — load before writing
  if (!lastSave && remoteExists) return; // this browser never reconciled
  if (nothingChanged)        return;   // see §6 for what counts
  if (savedRecently)         return;   // rate limit
  await save('automatic');
}
```

**"Behind" and "never reconciled" are the important two.** A browser that has never loaded
from the repository is holding whatever it started with — a stale copy shipped with the
app. Without those two lines, signing in on a new machine commits that stale copy over
everything saved since. It is silent, immediate, and looks like a successful save.

Detect it by comparing timestamps on every connection, not just at boot:

```js
async function checkRemote(){
  const remote = JSON.parse(await readFile(DRAFT_PATH));
  state.remoteSavedAt = remote.savedAt;
  state.remoteEditor  = remote.editor;
  state.behind = remote.savedAt && (!lastSave || new Date(remote.savedAt) > new Date(lastSave));
}
```

**Apply the same guard to every write path, not just the automatic one.** This project had
the guard on autosave and not on publish for a week. Publish is the more destructive of
the two, and it was the one left open. If you have three ways to write, all three need it.

**A manual action warns; an automatic one refuses.** Someone who clicks Save may genuinely
intend to overwrite. A timer never does.

---

## 6. What counts as a change

A subtle one, and the source of two separate bugs here.

The obvious check is "do the items differ from the baseline?" That misses everything
alongside the items — controlled lists, descriptions, settings. Renaming a category can
touch no item at all, and editing a description changes no item by definition. Both were
silently dropped by a guard that only compared items.

Compare **everything the file will contain**:

```js
const changed = JSON.stringify({ vocab, descriptions }) !== lastSavedSignature;
if (!itemDiff.total && !staged.length && !changed) return;
```

The rule: **the change-detector and the serialiser must read the same state.** If the
file carries it, the guard must watch it. Derive both from one list of keys if you can.

---

## 7. Merge, never overwrite

Any state that can arrive from more than one place must be merged rather than replaced.

Descriptions here arrive from the repository file, the saved draft, and the browser. Any
of them can legitimately be empty. Publishing wrote the browser's copy over the file — so
a browser that had never loaded since the feature existed published 37 empty markers over
37 real descriptions, on the live site.

```js
const real = v => !!v && v !== UNSET;
function merge(base, over){
  const out = { ...base };
  for (const [k, v] of Object.entries(over))
    if (real(v) || !(k in out)) out[k] = v;   // a real value always wins
  return out;
}
```

Then use that one function everywhere the state meets — on load, on restore, on publish.
Three hand-written merge rules will diverge; one function cannot.

---

## 8. Attribution

If the credential belongs to an account rather than a person — a deploy token, a shared
login — every commit reads identically no matter who made it. Ask for a name once and put
it in the commit message:

```
Save working draft (0 added, 27 edited, 0 removed) — hourly save [Jordan Ellis]
```

It costs one text field and it is the only thing that makes "who changed this" survive a
handover.

---

## 9. Recovery paths

Give more than one, because they fail differently.

| Path | Recovers | Fails when |
| --- | --- | --- |
| Local working copy | Everything, instantly | Browser data cleared, machine lost |
| Repository draft | Everything to the last save | Never reconciled, or offline |
| Published versions | Any release, exactly | Only what was published |
| Manual export file | The content | Someone has to remember to take it |

The manual export matters less once the repository draft exists, but it is the only one
that works with no network and no credential. Keep it, and be honest that it holds less.

---

## 10. Failure modes to design against

Every one of these happened here.

1. **A fresh session overwrites newer remote work.** The worst one. Guard both automatic
   and manual writes.
2. **The guard watches a subset of the state.** An edit is made, shown on screen, and
   dropped. Derive guard and serialiser from the same keys.
3. **One side's blank overwrites the other's content.** Merge, never replace.
4. **A read after a write returns the old value.** Bypass the cache.
5. **Storage is per-origin.** Move the app to a new URL and the working copy is gone —
   not corrupted, just absent. Say so in the interface rather than letting it look like
   data loss.
6. **A demo or test path commits real data.** Anything that fabricates state for
   illustration must suspend saving while it runs.
7. **A rename breaks references written by name.** Either store references by ID, or
   detect the breakage and report it.

---

## 11. Checklist for the next project

- [ ] Decide how many states you need. Two is usually too few, four too many.
- [ ] Local write on every edit; remote write on a timer and on release.
- [ ] Store a diff remotely if the content is large, and make sure the base is fetchable.
- [ ] One commit function, atomic across files, non-forced ref update.
- [ ] Chunked base64; cache-bypassing reads.
- [ ] Compare remote and local timestamps on **every** connection.
- [ ] Every write path guarded. Automatic refuses, manual warns.
- [ ] One change-signature covering everything the file contains.
- [ ] One merge function used everywhere state meets.
- [ ] A name on every commit.
- [ ] At least two recovery paths, and the interface says which is which.

---

## What this pattern is not

It is not multi-user. One editor at a time, with a non-forced ref update so a second
writer fails loudly rather than silently winning. If two people must edit simultaneously,
this is the wrong shape and you want a real backend with record-level locking or merge.

It is also not appropriate where edits must be live immediately. The whole design assumes
a gap between editing and publishing, and spends that gap on review.
