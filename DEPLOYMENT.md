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

## CMS — Vercel

1. Create or sign in to a Vercel account and import this GitHub repository.
2. Vercel reads `vercel.json`, runs `npm run studio:build`, and serves `dist`.
3. Add `cms.spacescape.co.in` under the Vercel project's **Settings → Domains**.
4. Vercel will display a project-specific CNAME value. Copy that exact value.
5. In GoDaddy DNS, add a CNAME with Name `cms` and the copied Vercel value.
6. Wait for Vercel to verify DNS and provision HTTPS.

Do not guess the CMS CNAME: Vercel may issue a project-specific hostname.

## Sanity access and CORS

In [Sanity Manage](https://sanity.io/manage), open project `q5gahqnh`:

1. Go to **Settings → API → CORS Origins**.
2. Add `https://cms.spacescape.co.in` and enable credentials.
3. Keep `http://localhost:3333` for local Studio development.
4. Under **Members**, invite only the people who should access the CMS.

Sanity authenticates users and checks project membership. The Studio build is
publicly downloadable static JavaScript, so never put private API tokens in its
environment or configuration.

## Publishing content

Publishing in Sanity changes the content database. Because the main website is
a static GitHub Pages export, configure the `sanity-publish` repository dispatch
webhook described in `CMS.md` to rebuild the website automatically.
