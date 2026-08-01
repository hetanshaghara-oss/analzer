const { storeState, consumeState } = require("./oauthState");

const GITHUB_OAUTH_CLIENT_ID = process.env.GITHUB_OAUTH_CLIENT_ID;
const GITHUB_OAUTH_CLIENT_SECRET = process.env.GITHUB_OAUTH_CLIENT_SECRET;
const GITHUB_OAUTH_REDIRECT_URI =
  process.env.GITHUB_OAUTH_REDIRECT_URI ||
  "http://localhost:3001/api/auth/github/callback";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// storeState/consumeState are now provided by ./oauthState (shared with the
// "Sign in with …" provider flows). They are re-exported here for callers that
// imported them from this module.

function buildAuthorizeUrl(state) {
  if (!GITHUB_OAUTH_CLIENT_ID) {
    throw new Error("Missing GITHUB_OAUTH_CLIENT_ID in server environment");
  }
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", GITHUB_OAUTH_CLIENT_ID);
  url.searchParams.set("redirect_uri", GITHUB_OAUTH_REDIRECT_URI);
  url.searchParams.set("scope", "read:user user:email repo");
  url.searchParams.set("state", state);
  return url.toString();
}

async function exchangeCode(code) {
  if (!GITHUB_OAUTH_CLIENT_ID || !GITHUB_OAUTH_CLIENT_SECRET) {
    throw new Error(
      "Missing GitHub OAuth client credentials in server environment",
    );
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_OAUTH_CLIENT_ID,
      client_secret: GITHUB_OAUTH_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_OAUTH_REDIRECT_URI,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    const message =
      data.error_description ||
      data.error ||
      "Failed to exchange GitHub OAuth code.";
    const err = new Error(message);
    err.status = response.status || 500;
    throw err;
  }

  return data.access_token;
}

async function fetchGitHubUser(accessToken) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "GitInsightAI-Backend",
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.message || "Failed to fetch GitHub user profile.";
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

function getFrontendRedirectUrl(status, message) {
  const redirectUrl = new URL(`${FRONTEND_URL}/account/profile`);
  redirectUrl.searchParams.set("github", status);
  if (message) redirectUrl.searchParams.set("message", message);
  return redirectUrl.toString();
}

module.exports = {
  storeState,
  consumeState,
  buildAuthorizeUrl,
  exchangeCode,
  fetchGitHubUser,
  getFrontendRedirectUrl,
};
