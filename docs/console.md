# Running the console

The console is the glossary's editing tool. The facilitator works entirely inside it —
open a page, make changes, publish. There is no need to visit GitHub, run any commands,
or understand version control. The repository underneath is plumbing.

## What the repository does

| File | Written when | Contains |
| --- | --- | --- |
| `data/glossary.json` | you press **Publish** | the published glossary the public site reads |
| `.console/draft.json` | every hour, automatically | the work in progress |

Committing `data/glossary.json` *is* publishing: the site rebuilds itself from that
file within a minute or two.

The draft file holds only the **difference** from the published version, not a full
copy. A full copy is about 2.9MB; the difference is usually a couple of kilobytes. That
keeps a daily commit from bloating the repository over a months-long editing cycle.

## Why the draft is saved at all

Between publishes the working draft lives in this browser's IndexedDB, on one machine.
Clearing site data, a browser reset or a dead laptop would take four months of work with
it. The daily save means the repository always holds something recent, and the history
means any earlier day can be recovered.

It happens quietly — on load if an hour has passed, and again during a long session.
**Save draft now** forces it. If more than a day goes by without a save reaching the
repository, the panel says so rather than failing silently.

## One-time setup

Publishing goes through MISMO's save relay, the same one the Initiative Hub uses. The
relay holds the only GitHub credential; facilitators never handle one.

1. Give the facilitator an account. In the Initiative Hub's admin panel, add them with
   their MISMO email. A password is generated and shown once — pass it on to them.
2. Make sure their account is in this repository's `_internal/facilitators.json`. Until
   single sign-on is switched on, each tool keeps its own list, so a Hub account does not
   automatically work here.
3. They open the console, press **Sign in…** in the panel on the left, and enter their
   email and password.
4. They accept the offer to load from the repository.

Every save is recorded under the name on their account, verified by the relay. There is
no name to type, so the history cannot be attributed to the wrong person.

The password stays in their browser and is sent only to the save relay. The relay will
only change `data/` and `.console/` in this repository — never the site, the console
itself, the account list or the build workflow — so a leaked password means a bad
glossary edit, not a changed website.

## The members' spreadsheet

The public glossary points members at the MISMO Resource Library for a spreadsheet copy:

  https://collaborate.mismo.org/viewdocument/business-glossary

That file has to be produced, and **Download Excel (.xlsx)** under *Backups & earlier
versions* is what produces it — every term with its classifications and links, as a real
spreadsheet with a frozen header and filters. Produce it after publishing a version and
upload it to the Resource Library, so the two do not drift apart.

## Classification descriptions

Each term type, focus area and source carries a description, and that is what appears
under it on the public glossary. They are edited under **Manage classifications** — every
value shows its description, and **Description** opens an editor beneath it.

Values with none are marked in amber and counted at the foot of the panel, because a
value without one shows on the public site as having no published description.

**Suggest wording** offers a first draft in the phrasing MISMO already uses — focus areas
read *"A set of terms typically used in…"*, sources *"A set of terms sourced from…"* — with
the value's name spelled out from its camel case. It is a starting point to rewrite, not
an answer: it exists because an empty box is the reason descriptions go unwritten. Adding
a new value opens its editor straight away, since the moment a classification is created
is the moment its meaning is known.

Descriptions travel with the draft and are written to `data/reference.json` when a version
is published. Editing one changes no terms, so it produces no draft changes — but it is
still saved and published like any other edit.

## Guided tour

The console opens a short guided tour the first time it is used, and it can be reopened at
any time from **Getting started** in the top right. It spotlights each part of the screen in
turn, opens the edit form and stages an example so the pending area has something in it,
and cleans up after itself. With sound on it reads each step aloud and moves on when it
finishes; the speaker button beside **Close tour** silences it.

The voice comes from the browser. The natural-sounding ones — the console prefers
**Sonia** — are only available in **Microsoft Edge** and need a network connection.
Other browsers fall back to whatever built-in voice the computer has.

## The panel on the left

Two headline numbers: how many terms there are, and how many need a human decision.
Beneath them the sections carry a coloured edge in their own state — green when settled,
amber when something wants attention. Anything that *replaces* what is in the browser
(loading the online copy, importing a change-set, restoring a backup) sits behind a drawer
that says so, since each discards unsaved work.

## Publishing is protected

The console refuses to publish, and will not save automatically, while the repository holds
a newer draft than this browser has loaded. Without that, a fresh browser — which starts
from the copy of the glossary shipped inside the console — could publish that older copy
over every version since. The panel says when this is the case and offers to load.

## Day-to-day

1. Open the console. It loads the draft from this browser and checks the repository in
   the background.
2. Edit. Search, bulk-tag, fix flagged issues, add or remove terms. Everything stages
   for review; nothing changes the draft until applied.
3. The draft saves itself to the repository every hour.
4. When the working group has agreed a version, press **Publish**. That commits the new
   glossary, updates the site, and downloads a change-set CSV as a record of what
   changed for the group.

## Handing over to a new facilitator

The facilitator will change over time. Nothing about the glossary is tied to an
individual, so a handover is short:

1. **Remove the outgoing facilitator's account** from `_internal/facilitators.json`, or
   through the admin panel once it manages this tool. Their next save is refused.
   Removal, not a password change, is the real control.
2. **Ask them to press Save draft now before they finish**, so nothing is stranded. The
   hourly save means at most an hour is ever at risk, but a clean final save costs
   nothing.
3. **Add an account for the incoming facilitator** and pass on their password.
4. On their machine, they press **Sign in…**, enter their email and password, then
   accept the offer to load from the repository.

There is no GitHub token to revoke or reissue. There never is, for facilitators.

## If two people ever edit

The design assumes one editor. If a second person edits in another browser, the second
publish fails rather than overwriting the first — the commit is not forced. Recovery is
to load from the repository and redo the lost edits, so avoid the situation rather than
relying on the safeguard.

## If something goes wrong

**"That email and password were not recognised."** Check it is the same pair used for
the Initiative Hub, and that the account is listed in this repository's
`_internal/facilitators.json`. A lost password is reset by an administrator. The draft
is untouched either way.

**"Someone else saved while you were working."** Another facilitator published after
you loaded. Reload, then reapply anything that was lost.

**"The saving service refused to change …"** The console tried to write outside `data/`
and `.console/`. That should never happen in normal use and means something is wrong
with the console itself, not the account.

**A publish failed.** Nothing was written; the repository and the draft are both as
they were. Retry. If it keeps failing, the change-set CSV still downloads, so a version
can be produced by hand.

**The draft looks wrong or has been lost.** Every daily save is in the repository's
history. `.console/draft.json` at any past commit can be restored — ask whoever
administers the repository.

**Starting fresh on a new machine.** Sign in, then accept the offer to load — or later, open
**Replace what is in this browser** and choose **Load the online copy**. That pulls the
published glossary plus the most recent saved draft.
