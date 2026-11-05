# My Regenerate Skagit

An independent, online-first SvelteKit/TypeScript member workspace backed by
Heron's capabilities API. This project is a sibling of `heron`, `regen-skagit`,
and the other websites. It builds to ordinary static files; no Node server runs
in production.

## Build and serve

```sh
npm ci
npm run check
npm test
npm run build
```

Build command: `npm run build`. Output directory: `dist`.
`deploy.site.toml.example` follows the existing website deployment profile format;
set its repository URL when the standalone site repository is created. Deployment
and DNS are not changed by building this app.

Heron's `config/development.toml` contains:

```toml
[[dev_sites]]
hostname = "my.regen.localhost"
root = "../my.regenerateskagit.org/dist"
api_host = "my.regenerateskagit.org"
```

After building, the existing Heron development webserver serves the site at
`http://my.regen.localhost:8582/`. Fixed, prerendered page routes use query
parameters for document identities; deep links need no SPA fallback or special
Caddy rewrite. In production, serve `dist` using the existing file-server setup
and keep `/api/*` routed to Heron on the same origin. Do not route missing API
requests to HTML.

The member hostname is deliberately a separate API host. It requires its own
registered Heron host identity and account membership before real sign-in/content
access works. Public-site permissions are not inherited. This change does not
insert a host or grant roles in any database.

## Develop and preview

For Vite hot reload against your existing Heron server, copy `.env.example` to
`.env` and run `npm run dev`. Its optional API proxy targets the member-host alias.
The built site does not depend on Vite or this proxy.

For UI review without touching real accounts:

```sh
npm run dev:preview
```

Open the printed local URL. The sample invitation is available at `/invitations/?id=00000000-0000-4000-8000-000000000020`.
The clearly labelled **Sample workspace** uses an
in-memory API fixture in the development server. Edits disappear when that server
stops. Sign-in accepts test credentials only in this explicit preview mode.
The fixture is not a fallback for failed real requests, is not included in the
production bundle, and is never enabled by `npm run build`.

## Shared API client

All application API operations use named capabilities through `@heron/api-client`.
`vendor/heron-api-client` is a synchronized copy of Heron's canonical package,
not a separate implementation. This allows isolated checkout/build/deployment
without requiring a neighboring Heron checkout on the deployment machine.

From Heron, update with `node utils/sync-member-client.mjs`; use `--check` to verify.
The site's prebuild integrity check validates its checked-in client manifest.
Do not edit the vendored files independently.

## First working slice

- Existing Heron sign-in/session handling and capability discovery.
- Personal workspace, searchable library, independent interests/ideas/stories,
  and experiments linked to their own step drafts.
- Eleven guided journey steps, Markdown editing, and explicit revision saves.
- Account/document/tab-scoped recovery copies, unsaved-navigation guards,
  conflict comparison, and deliberate conflict resolution.
- Read and restore historical versions as new saves.
- Partner-or-solo planning and meeting dates; the clock starts only after an
  explicit participation decision and valid ordered meeting dates.
- Invitation drafting and email delivery, with unverified recipient accounts,
  private account setup links, and public invitation snapshots.
- Recipient-only acceptance/decline. Acceptance creates an independent experiment
  linked as growing from or alongside the original. Other signed-in visitors can
  request to follow along; owners can see requests and delivery/response status.
- Connections from actual ledger graph relationships; explicit work recording.
- Private experiment ZIP export with readable Markdown, permanent IDs,
  relationships, private notebook metadata, work logs, optional full history,
  and same-origin uploaded attachments. External attachments remain references
  and are listed in the export manifest/README. A failed local attachment fetch
  fails the export rather than silently dropping it.

## Intentional boundaries

This release edits private work. The public invitation board, ongoing notifications,
shared scheduling agreements, Group/Public
sharing, publishing review, and cross-host publishing remain separate work.
Partner confirmation here is an owner's record of an arrangement made outside
the app; it is not server-verified acceptance. The final step prepares review
notes and exports, not an operational publishing submission.

The five story questions have not been defined. The story editor is freeform
until their wording is agreed. Earlier experiment notebooks remain accessible
and exportable; they are not silently converted into step documents.

Recovery copies protect editing in the browser. They are not an offline document
store or a sync system. Export uses the latest saved documents returned when the
export starts. It does not include edits still open in an editor. Restoring history
never revives publishing approval.

## Invitation delivery

Requires Heron’s `2026-11-05-000003_member_invitations` migration and invitation
capabilities. Email uses the existing Heron SMTP configuration and host base URL.
No mail is sent during builds or tests. Failed delivery remains recorded and can
be retried after one minute. A send interrupted by a server restart can be retried
after ten minutes; as with SMTP generally, an interrupted acknowledgement may
result in a duplicate email, but not a duplicate invitation or experiment.

The invitation URL exposes only its saved invitation text, experiment title, and
sender name. It never exposes the experiment notebook or recipient address.
Account setup credentials are separate, single-use, hashed in storage, expire
after seven days, and travel in a URL fragment removed by the landing page. New
accounts verify their email by completing this setup. Accepting an invitation
grants an initial host membership without overriding a previous revocation.
Acceptance creates a private experiment without starting its clock or confirming
meeting dates. Follow requests record interest; they grant no notebook access.

## Recovery, source documents, and ledger summary

Sign-in includes **Forgot password?**. Email recovery uses host-bound, single-use
30-minute tokens and requires Heron’s
`2026-11-05-000004_member_password_resets` migration. The request and reset forms
are public static routes; account existence is not disclosed by the request
response. SMTP delivery needs the existing server email settings. Builds and
sample preview do not send email.

Connections includes links to the original referenced document and its source.
Journey documents open at their experiment step. Accepted invitations link back
to the public invitation snapshot while the inviter’s notebook stays private.

**More → Ledger summary** is available to signed-in members. Everyone sees the
same site-wide category/connection/activity counts. The D3 graph adapts the
RegenSkagit ledger interface and includes filters, zoom, dragging, and count
tables. The summary API returns aggregated categories only: no individual
identities, document titles, content, email, or raw ledger rows reach the browser.
