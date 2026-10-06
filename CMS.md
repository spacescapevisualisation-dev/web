# Space Scape content editor (Decap CMS)

The site's content lives in this repository as plain JSON files, and
[Decap CMS](https://decapcms.org) gives non-developers a form-based editor for
them at **https://spacescape.co.in/admin/**.

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

## One-time setup: GitHub login (≈10 minutes)

GitHub Pages can't run the login handshake, so a tiny login service in `/api`
runs on Vercel (free plan).

1. **Create a GitHub OAuth App** — GitHub → Settings → Developer settings →
   OAuth Apps → New OAuth App (create it under the
   `spacescapevisualisation-dev` organisation if possible):
   - Homepage URL: `https://spacescape.co.in`
   - Authorization callback URL: `https://cms.spacescape.co.in/api/callback`
   - Copy the **Client ID** and generate a **Client secret**.
2. **Deploy the login service on Vercel** — import this repository. Vercel reads
   `vercel.json` (no build; it only serves `/api/auth` and `/api/callback`).
   Under Settings → Environment Variables add:
   - `OAUTH_GITHUB_CLIENT_ID` = Client ID
   - `OAUTH_GITHUB_CLIENT_SECRET` = Client secret
   - `CMS_ALLOWED_ORIGINS` = `https://spacescape.co.in,https://www.spacescape.co.in,http://localhost:3000` (optional; this is the default)

   Redeploy after adding them.
3. **Domain** — add `cms.spacescape.co.in` in Vercel → Settings → Domains and
   create the CNAME Vercel shows you in GoDaddy DNS (see `DEPLOYMENT.md`).
   If you'd rather skip the custom domain, put the `*.vercel.app` URL in
   `base_url` in `public/admin/config.yml` and in the OAuth App's callback URL.
4. **Who can edit** — anyone with **write access** to the GitHub repository.
   Add editors as collaborators (Repo → Settings → Collaborators). They log in
   at `/admin/` with "Login with GitHub".

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
