# Space Scape project editor

The website now reads project content from Sanity and falls back to the six
bundled projects until the CMS is connected. Existing projects can therefore
be migrated one at a time without disappearing from the site.

## One-time setup

1. Create a free project at [sanity.io/manage](https://sanity.io/manage).
2. Copy `.env.example` to `.env.local` and replace `your_project_id` with the
   project ID shown by Sanity. Keep the dataset as `production`.
3. Run `npm run studio`. The project editor opens at `http://localhost:3333`.
4. Run `npm run studio` to test the editor locally. For the custom production
   domain, follow the Vercel steps in `DEPLOYMENT.md`.
5. Add `NEXT_PUBLIC_SANITY_PROJECT_ID` as a GitHub Actions repository secret.
   Optionally add `NEXT_PUBLIC_SANITY_DATASET` as a repository variable; it
   defaults to `production`.

## Editor workflow

1. Open the hosted Studio and choose **Projects**.
2. Select an existing project or click **Create**.
3. Fill in the project details and upload the two required images.
4. Use **Generate** beside Page URL, then click **Publish**.

The URL is generated as `/projects/project-name/`. A CMS project replaces a
bundled project when their slugs match; entirely new slugs add new projects.

## Automatic GitHub Pages publishing

The deployment workflow accepts a `sanity-publish` repository dispatch event.
Create a Sanity webhook that sends that event to GitHub whenever a project is
created, updated, or deleted. The webhook should target:

`https://api.github.com/repos/OWNER/REPOSITORY/dispatches`

Use method `POST`, include GitHub API authentication, and send:

```json
{ "event_type": "sanity-publish" }
```

Until that webhook is configured, an administrator can publish CMS changes by
running the existing GitHub Actions workflow manually.

## Custom production domain

The production editor is configured to build as a standalone static app for
`https://cms.spacescape.co.in`. Follow `DEPLOYMENT.md` to deploy it to Vercel,
add the GoDaddy DNS record, enable Sanity CORS, and invite authenticated users.
