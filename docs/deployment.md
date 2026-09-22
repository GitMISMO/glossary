# Deployment

Both pages are static HTML with no server side. That keeps hosting simple and cheap.

**Production is GitHub Pages**, at `tools.mismo.org/glossary/`. The Deploy workflow in
`.github/workflows/deploy.yml` publishes on every push to `main` and needs no cloud
credentials of any kind.

## Why not S3 and CloudFront

An earlier version of this document specified S3 with CloudFront, Origin Access Control,
an ACM certificate and an IAM deployment role, with a hostname of its own at
`glossary.mismo.org`. That plan was correct for a glossary hosted on its own. It was
dropped in September 2026 when MISMO's tools were consolidated onto one host, because
GitHub Pages already provides every part of it:

| The AWS plan asked for | What replaced it |
|---|---|
| S3 bucket, versioning for rollback | The git repository. Every publish is a commit, attributable and revertible — better than object versioning, which cannot say who or why. |
| CloudFront, compression enabled | Pages' own CDN, which compresses text responses. `data/glossary.json` is ~2.7MB raw and was the main argument for CloudFront. |
| ACM certificate in `us-east-1` | Provisioned and renewed by GitHub, free. This was the longest lead time in the project and it is gone. |
| DNS alias for `glossary.mismo.org` | One CNAME for `tools.mismo.org`, shared by every tool. |
| IAM role with GitHub OIDC trust | Nothing. `actions/deploy-pages` publishes with the workflow's own token; no AWS identity exists. |

The AWS path has **not** been deleted from the workflow — the `deploy-s3` job still runs
if the repository variable `DEPLOY_TARGET` is set to `aws`, with the role, region, bucket
and distribution supplied as variables. If the decision is ever revisited, the list below
is what to provision. Nothing in this repository is specific to Pages.

---

## Where the console lives, and what that costs

The console ships as part of the site, at `/glossary/console/`. It has no write access of
its own: publishing goes through MISMO's save relay, which checks the facilitator's email
and password and holds the only GitHub credential.

**No GitHub token is stored in the browser any more.** Before the move to the relay, a
real GitHub personal access token sat in IndexedDB — able to rewrite anything in the
repository, including the site and its build workflow — and because every MISMO tool
shares one origin, any page on the host could read it. What replaces it is a facilitator
password whose worst case is an unwanted glossary commit: visible in history, attributed
to a verified account, and revertible. The relay refuses to write anything outside
`data/` and `.console/`.

A connection saved before the migration is found and deleted the first time the console
loads, so old tokens do not linger in browsers that used the console before.

Storage follows the shared-host convention: the IndexedDB database is `resources:glossary`.

A separate hostname for the console — the old plan's `glossary-admin.mismo.org` — is the
only thing that would give it genuinely separate storage, since host-level protection
cannot be applied to a path. It is not needed while the console holds only a password
with limited reach.

---

## What AWS needs to provision

Hand this list to whoever administers the AWS account.

### 1. S3 bucket

- Private. **Block Public Access enabled** on all four settings.
- Not the legacy "static website hosting" mode — CloudFront reads from the bucket
  directly.
- Versioning on, so a bad deploy can be rolled back.

### 2. CloudFront distribution

- Origin: the S3 bucket, via **Origin Access Control (OAC)**. This is what lets the
  bucket stay private while the site is public.
- Default root object: `index.html`.
- Redirect HTTP to HTTPS.
- Compression enabled. `data/glossary.json` is ~2.9MB raw and compresses to a fraction
  of that; this matters more than anything else for page load. The console file is a
  further ~2.3MB.

### 3. ACM certificate

- For whatever hostname is chosen. `glossary.mismo.org` was decided on 8 September 2026
  and then superseded by `tools.mismo.org/glossary/`; this section applies only if the
  AWS path is revived.
- Optionally a second name for the console, e.g. `glossary-admin.mismo.org`. See below.
- **Must be issued in `us-east-1`**, regardless of which region the bucket lives in.
  CloudFront only reads certificates from that region. This is the single most common
  thing to get wrong.
- Validation is via DNS, so whoever controls the MISMO domain has to add a record.
  Start this early — it is the longest pole.

### 4. DNS

- A record (alias) for the hostname pointing at the CloudFront distribution.

### 5. Deployment identity

Preferred: an **IAM role with a GitHub OIDC trust policy**, so no long-lived access key
ever exists. Alternative: an IAM user with an access key, stored as a GitHub secret.

Either way, scope permissions to this one bucket and this one distribution:

| Action | Resource |
| --- | --- |
| `s3:PutObject`, `s3:DeleteObject` | `arn:aws:s3:::<bucket>/*` |
| `s3:ListBucket` | `arn:aws:s3:::<bucket>` |
| `cloudfront:CreateInvalidation` | the distribution ARN |

Nothing broader. No `s3:*`, no account-wide CloudFront access.

### Simpler alternative

**AWS Amplify Hosting** bundles the bucket, CDN, certificate and DNS into one setup and
connects straight to a Git repository. Less control, considerably less to configure.
Defensible if the AWS team would rather not hand-assemble the pieces above.

---

## The members' copy

The spreadsheet is not served from this site. The public page links to the MISMO Resource
Library, which is behind the MISMO/MBA sign-in, and the file is uploaded there by the
facilitator after each release. A static site cannot enforce membership, so it does not
pretend to — access control stays where it already exists.

## Cache behaviour

Worth getting right up front, because it is annoying to retrofit:

- **`index.html`** — short TTL or `no-cache`. It must not be stale, or users get an old
  page pointing at data that has moved.
- **`data/*.json`** — long TTL. These change only when the glossary is republished, and
  they are the large files.
- Every deploy issues a CloudFront invalidation so a publish is visible immediately
  rather than whenever the edge cache happens to expire.

The `deploy-s3` job in `.github/workflows/deploy.yml` handles the invalidation. None of
this applies to the Pages deployment, which has no invalidation step and no cache
configuration to set.

---

## Status

- [x] Public page reads `data/glossary.json` and performs acceptably at 8,397 terms
- [x] Permalinks resolve (hash-based, so no rewrite rule is needed on any host)
- [x] Console shipped with the site, at `/glossary/console/`
- [x] Repositories renamed so the Pages path matches the URL (`GitMISMO/glossary`)
- [x] Deployed via GitHub Pages with no cloud credentials
- [ ] `tools.mismo.org` DNS record in place, and **Enforce HTTPS** ticked once the
      certificate issues
- [ ] Console migrated from a pasted GitHub token to the save relay
- [ ] IndexedDB renamed to `tools:glossary` and `localStorage` keys namespaced
      `tools:glossary:<name>` (do this with the relay migration, not before — renaming the
      database orphans any draft sitting in the old one)

One carry-over from the old cutover plan still applies whenever the URL changes: **the
facilitator's working copy is per-origin and does not follow the tool to a new address.**
Any draft should be saved to the repository before the move. Signing in at the new URL and
loading the online copy restores it.
