# Production domains

## Main website — GitHub Pages

In the GitHub repository, open **Settings → Pages → Custom domain**, enter
`spacescape.co.in`, save, then enable **Enforce HTTPS** after DNS verifies.

In GoDaddy, open **My Products → spacescape.co.in → DNS** and configure:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | jatinli.github.io |

Remove conflicting parked-domain A records for `@` and any conflicting `www`
record. Do not add a wildcard DNS record.

## CMS login service — Vercel

The editor itself is served by GitHub Pages at `https://spacescape.co.in/admin/`.
Vercel only hosts the GitHub login service in `/api` (see `CMS.md`).

1. Import this GitHub repository into Vercel. `vercel.json` disables the build.
2. Add the `OAUTH_GITHUB_*` environment variables listed in `CMS.md`.
3. Add `cms.spacescape.co.in` under the Vercel project's **Settings → Domains**.
4. Vercel will display a project-specific CNAME value. Copy that exact value.
5. In GoDaddy DNS, add a CNAME with Name `cms` and the copied Vercel value.
6. Wait for Vercel to verify DNS and provision HTTPS.

Do not guess the CMS CNAME: Vercel may issue a project-specific hostname.

## Publishing content

Publishing in the CMS commits to `main`, which triggers the GitHub Pages
workflow automatically — no webhook needed.
