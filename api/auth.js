// Step 1 of Decap CMS GitHub login: send the editor to GitHub's consent page.
// Env: OAUTH_GITHUB_CLIENT_ID (from a GitHub OAuth App).

module.exports = (req, res) => {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("OAUTH_GITHUB_CLIENT_ID is not configured.");
    return;
  }
  const state = globalThis.crypto.randomUUID().replace(/-/g, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `https://${host}/api/callback`,
    scope: process.env.OAUTH_GITHUB_SCOPE || "repo,user",
    state,
  });
  res.setHeader("Set-Cookie", `decap_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.writeHead(302, { Location: `https://github.com/login/oauth/authorize?${params}` });
  res.end();
};
