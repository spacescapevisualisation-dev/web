# Space Scape content editor (Decap CMS)

The site's content lives in this repository as plain JSON files, and
[Decap CMS](https://decapcms.org) gives non-developers a form-based editor for
them at **https://cms.spacescape.co.in**.

| What | File(s) | Editor section |
| --- | --- | --- |
| Portfolio projects (one file each) | `content/projects/*.json` | **Projects** |
| Contact email, Instagram, location, careers email, job openings | `content/settings/site.json` | **Site settings → Contact, email & careers** |
| Uploaded images | `public/project-images/uploads/` | **Media** |

Every **Publish** in the editor is a Git commit to `main`. That push runs the
existing GitHub Pages workflow, so the live site updates in ~2 minutes.

## Editing

- **Add a project:** Projects → **+ Project** → fill in the form, choose a main
  and second image (upload from your computer), then **Publish → Publish now**.
- **Edit a project:** click it in the list, change anything, Publish.
- **Order:** "Display order" — lower numbers show first (0 = top). Project
  numbers (01, 02…) are assigned automatically from this order.
- **Hide without deleting:** tick "Hide from website (draft)".
- **Delete:** open the project → **Delete entry**.
- **Change the email / Instagram / jobs:** Site settings → Contact, email & careers.

Keep images web-sized (≈2400px wide, WebP or JPG under ~1 MB) — large uploads
slow the site and the repository.

## Logging in and managing editors

Editors don't need GitHub accounts. Login runs through
[DecapBridge](https://decapbridge.com) (free plan: up to 10 editors).

- **Log in:** open https://cms.spacescape.co.in → **Login** → email + password,
  or Google / Microsoft.
- **Add or remove an editor:** sign in at https://decapbridge.com → My Sites →
  `spacescapevisualisation-dev/web` → **Manage collaborators** → invite by email.
  They get an email to set a password.
- Commits are made by DecapBridge with a fine-grained GitHub token
  ("DecapBridge - spacescape CMS", Contents read/write on this repo only, no
  expiry). If it is ever revoked, create a new one and paste it into the
  DecapBridge site **Settings**.

### How it is hosted

- The editor (`public/`, no build) is served by the Vercel project
  `spacescape-cms` at `cms.spacescape.co.in` — see `vercel.json`. It
  redeploys on every push to `main`.
- DNS: GoDaddy CNAME `cms` → the value shown in Vercel → Settings → Domains.
- The website itself stays on GitHub Pages (see `DEPLOYMENT.md`).

## Working locally (no login needed)

```bash
npm run cms   # terminal 1 — local Decap backend that writes straight to your files
npm run dev   # terminal 2
```

Open http://localhost:3000/admin/. Changes are saved to your working copy;
commit and push them yourself.

## For developers

- Form fields: `public/admin/config.yml`. If you add a field, also add it to
  the `Project` type in `src/lib/projects.ts`.
- Projects are read at build time by `src/lib/project-data.ts`; settings are
  imported in `src/lib/site.ts`.
- The Decap script is pinned in `public/admin/index.html`; bump the version
  there to upgrade.
