// Step 2 of Decap CMS GitHub login: swap GitHub's code for a token and hand it
// back to the CMS window that opened this popup.
// Env: OAUTH_GITHUB_CLIENT_ID, OAUTH_GITHUB_CLIENT_SECRET,
//      CMS_ALLOWED_ORIGINS (comma-separated, e.g. https://spacescape.co.in,http://localhost:3000)

const DEFAULT_ORIGINS = "https://spacescape.co.in,https://www.spacescape.co.in,http://localhost:3000";

function page(status, content, origins) {
  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  return `<!doctype html><html><body><p>${status === "success" ? "Logged in. You can close this window." : "Login failed."}</p>
<script>
(function () {
  var allowed = ${JSON.stringify(origins)};
  function receive(e) {
    if (allowed.indexOf(e.origin) === -1) return;
    window.removeEventListener("message", receive, false);
    window.opener.postMessage(${JSON.stringify(message)}, e.origin);
    setTimeout(function () { window.close(); }, 300);
  }
  window.addEventListener("message", receive, false);
  if (window.opener) window.opener.postMessage("authorizing:github", "*");
})();
</script></body></html>`;
}

function readCookie(req, name) {
  const match = (req.headers.cookie || "").match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? match[1] : null;
}

module.exports = async (req, res) => {
  const origins = (process.env.CMS_ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(",").map((o) => o.trim()).filter(Boolean);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Set-Cookie", "decap_oauth_state=; Path=/api; Max-Age=0");

  const url = new URL(req.url, "https://placeholder");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state || state !== readCookie(req, "decap_oauth_state")) {
    res.status(400).send(page("error", { message: "Invalid or expired login attempt. Please try again." }, origins));
    return;
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.OAUTH_GITHUB_CLIENT_ID,
        client_secret: process.env.OAUTH_GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const data = await response.json();
    if (!data.access_token) throw new Error(data.error_description || data.error || "No token returned");
    res.status(200).send(page("success", { token: data.access_token, provider: "github" }, origins));
  } catch (error) {
    res.status(500).send(page("error", { message: String(error.message || error) }, origins));
  }
};
