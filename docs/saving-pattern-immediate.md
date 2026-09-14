# Saving when save means live

A revision of the previous write-up for the simpler case: one editor, a Save button, and
the change is public the moment it lands. No staging, no draft.

Most of what follows is the same. The parts that change are marked, and the short version
is this: **dropping the draft removes the safety net, so the guards and the history have
to do its job.**

---

## 1. One state, two copies

| | Where | When written |
| --- | --- | --- |
| Working copy | Browser storage | Every edit, immediately |
| Published | Repository | On Save |

The browser copy still matters even though there is no draft. It is what survives a
refresh, an accidental close, or a dead battery between one Save and the next. Write it on
every edit; it costs nothing.

```js
const persist = async () => {
  await idbSet('items', items);
  await idbSet('settings', settings);
  await idbSet('lastSavedSignature', lastSavedSignature);
};
```

What goes away is the `baseline` copy and the diff machinery. You write the real file each
time, so there is nothing to reconstruct.

---

## 2. Save writes the real file

```js
async function save(){
  const content = serialise(items, settings);
  const sha = await ghCommit([{ path: DATA_PATH, content }], commitMessage());
  lastSavedSignature = signature();     // see §5
  lastSavedAt = new Date().toISOString();
  await persist();
  return sha;
}
```

The commit function is unchanged from the previous write-up — blobs, tree, commit,
non-forced ref update. Keep the non-forced part; it is what turns a silent overwrite into
a visible failure.

**One thing to size up front.** Every save is a full copy of the file. That is fine at a
few hundred kilobytes and wasteful at several megabytes — a year of daily saves at 3MB is
a repository nobody wants to clone. If your content is large, either split it into several
files so a save only rewrites what changed, or reintroduce something draft-shaped. Under
about 1MB, do not think about it.

---

## 3. Saving cannot be automatic

With a draft, an hourly autosave is harmless — nothing is public. Without one, an
automatic save publishes whatever state the editor happens to be in, including a
half-typed sentence.

So: **Save is a button.** If you want protection against losing work between saves, that
is what the browser copy is for, not a timer.

Two things to add around the button:

**Warn on leaving with unsaved work**, since there is now no timer behind them:

```js
addEventListener('beforeunload', e => {
  if (signature() !== lastSavedSignature) e.preventDefault();
});
```

**Show the state plainly** — "Saved 14:32" versus "Unsaved changes". The person needs to
know which without having to remember.

---

## 4. The guards still apply, and matter more

Unchanged from the draft version, except that there is no longer a review step between a
mistake and the public site.

```js
async function save(){
  if (!connected)  return fail('Not signed in.');
  if (state.behind) {
    // Someone else, or you on another machine, has saved since this copy loaded.
    return confirmOverwrite();   // never proceed silently
  }
  …
}
```

**Check "behind" before every save, not just at sign-in.** Compare the remote file's last
commit against the one this session loaded:

```js
async function checkRemote(){
  const ref = await gh(`/git/ref/heads/${branch}`);
  state.remoteHead = ref.object.sha;
  state.behind = loadedFromSha && state.remoteHead !== loadedFromSha;
}
```

Timestamps worked for the draft file because it carried one. For a plain content file the
commit sha is the better signal — it changes on every write and needs no cooperation from
the format.

**A browser that never loaded holds whatever it started with.** This is the failure worth
designing against above all others: someone opens the editor on a new machine, it falls
back to a bundled or empty starting state, they save, and everything since is gone. Refuse
to save until the session has loaded from the repository at least once.

```js
if (!loadedFromSha) return fail('Load the current version before saving.');
```

---

## 5. What counts as a change

Same rule as before, and still the easiest thing to get wrong: **compare everything the
file will contain**, not just the obvious part.

```js
const signature = () => JSON.stringify({ items, settings, metadata });
```

If the serialiser writes it, the signature must include it. Derive both from one object if
you can, so they cannot drift apart. Two separate bugs in the other project came from a
signature that watched the items and not the settings stored alongside them.

This signature does double duty here: it decides whether Save is enabled, and whether to
warn on leaving.

---

## 6. History is the undo

This is what compensates for losing the draft. Every save is a commit, so the previous
version is always one revert away — provided you make that reachable from the interface
rather than expecting someone to use Git.

Worth building, in rough order of value:

- **A list of recent saves** — time, author, and a one-line summary from the commit message
- **Download any past version** — fetch the file at that commit, exactly as the other
  project does for releases
- **Restore a past version** — load it into the editor as the working copy, so the person
  reviews it and saves it forward rather than force-pushing history

Restore-as-a-new-save is better than rewriting history: it keeps the record of what
happened, and it goes through the same guards as any other save.

```js
const at = async sha => fetch(
  `${api}/contents/${DATA_PATH}?ref=${sha}`,
  { cache:'no-store', headers:{ Accept:'application/vnd.github.raw' } }
).then(r => r.text());
```

---

## 7. Every save triggers a deploy

If a workflow publishes the site on push, every Save is now a build. Two consequences.

**Rapid saves queue or cancel each other.** Set `cancel-in-progress: false` on the deploy
concurrency group. The opposite setting is right for CI and wrong here — a cancelled
deploy leaves the site on older content with nothing visibly wrong.

**The reader's browser must not serve a stale copy.** Fetch the content with
`cache: 'no-cache'` so a returning visitor revalidates. Otherwise a save looks live to
whoever checks in a fresh window, while everyone else keeps yesterday's version. That one
bit me and is invisible in testing.

---

## 8. What still holds from the draft version

Unchanged and worth keeping:

- **Git Data API** for the commit, not the Contents API — the latter caps at 1MB
- **Chunked base64**, because `String.fromCharCode(...bytes)` overflows on large content
- **Cache-bypassing reads**, or a read after a write returns the old value
- **Non-forced ref update**, so a concurrent writer fails loudly
- **Merge rather than overwrite** for anything that can arrive from more than one place,
  where a blank on one side must never replace content on the other
- **A person's name on every commit**, since the credential usually belongs to an account
- **Browser storage is per-origin** — move the app's URL and the working copy is absent,
  not corrupted. Say so rather than letting it look like data loss
- **Any demo or test path must suspend saving**, or it will publish its own fixtures

---

## 9. Checklist

- [ ] Browser copy written on every edit
- [ ] Save is an explicit action, never a timer
- [ ] Refuse to save until this session has loaded from the repository
- [ ] Check the remote head before every save; confirm before overwriting
- [ ] One signature covering everything the file contains
- [ ] Warn before leaving with unsaved changes
- [ ] Visible saved/unsaved state with a timestamp
- [ ] History reachable from the interface: list, download, restore-as-new-save
- [ ] Deploys not cancelled by newer ones; readers revalidate
- [ ] Non-forced ref update

---

## When to add a draft after all

Three signals. Any one of them means save-is-live has stopped fitting:

1. Someone asks "can I work on this without it going out yet?"
2. A mistake reaches readers and the fix takes longer than the embarrassment
3. More than one person starts editing, even occasionally

Adding a draft later is not a rewrite — it is a second file and a publish step. The guards,
the commit function and the history work unchanged. Which is a reason to get those right
now, even though the simple version does not need all of them yet.
