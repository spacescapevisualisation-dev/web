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

## CMS editor — Vercel

The Decap CMS editor is served by the Vercel project `spacescape-cms` at
`https://cms.spacescape.co.in` (`vercel.json`: no build, serves `public/`).
Login is handled by DecapBridge (see `CMS.md`).

1. The project is imported from this repository and redeploys on every push.
2. `cms.spacescape.co.in` is added under the project's **Settings → Domains**.
3. GoDaddy DNS has a CNAME with Name `cms` and the project-specific value
   Vercel shows there.

Do not guess the CMS CNAME: Vercel may issue a project-specific hostname.

## Publishing content

Publishing in the CMS commits to `main`, which triggers the GitHub Pages
workflow automatically — no webhook needed.
