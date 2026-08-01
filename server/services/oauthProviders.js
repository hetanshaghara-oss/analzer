// OAuth "Sign in with …" provider registry.
//
// A provider is only considered configured (and therefore advertised to the
// frontend via /api/auth/oauth/providers) when its Client ID + Secret exist in
// server/.env. GitHub already ships with credentials; Google and GitLab need
// an OAuth app created at the provider's console — see .env for instructions.

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const GITHUB_REDIRECT_URI =
  process.env.GITHUB_OAUTH_REDIRECT_URI ||
  "http://localhost:3001/api/auth/github/callback";
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_OAUTH_REDIRECT_URI ||
  "http://localhost:3001/api/auth/oauth/google/callback";
const GITLAB_REDIRECT_URI =
  process.env.GITLAB_OAUTH_REDIRECT_URI ||
  "http://localhost:3001/api/auth/oauth/gitlab/callback";

async function postForm(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(body).toString(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const message =
      data.error_description || data.error || `Token exchange failed (${response.status}).`;
    const err = new Error(message);
    err.status = response.status || 500;
    throw err;
  }
  return data;
}

async function getJson(url, accessToken) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "GitInsightAI-Backend",
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      data.message || (data.error && data.error.message) || "Failed to fetch provider profile.";
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

const providers = {
  github: {
    id: "github",
    label: "GitHub",
    isConfigured: () =>
      Boolean(
        process.env.GITHUB_OAUTH_CLIENT_ID &&
          process.env.GITHUB_OAUTH_CLIENT_SECRET,
      ),
    buildAuthorizeUrl: (state) => {
      const url = new URL("https://github.com/login/oauth/authorize");
      url.searchParams.set("client_id", process.env.GITHUB_OAUTH_CLIENT_ID);
      url.searchParams.set("redirect_uri", GITHUB_REDIRECT_URI);
      url.searchParams.set("scope", "read:user user:email");
      url.searchParams.set("state", state);
      return url.toString();
    },
    exchangeCode: async (code) => {
      const data = await postForm("https://github.com/login/oauth/access_token", {
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI,
      });
      return data.access_token;
    },
    fetchProfile: async (accessToken) => {
      const profile = await getJson("https://api.github.com/user", accessToken);
      let email = profile.email;
      if (!email) {
        // The `user:email` scope is requested, so pull a verified primary email.
        const emails = await getJson(
          "https://api.github.com/user/emails",
          accessToken,
        );
        const primary =
          emails.find((e) => e.primary && e.verified) ||
          emails.find((e) => e.verified) ||
          emails[0];
        email = primary ? primary.email : null;
      }
      return {
        providerId: String(profile.id),
        email: email || null,
        name: profile.name || profile.login || "",
        avatar: profile.avatar_url || "",
        username: profile.login || "",
        profileUrl: profile.html_url || "",
      };
    },
  },

  google: {
    id: "google",
    label: "Google",
    isConfigured: () =>
      Boolean(
        process.env.GOOGLE_OAUTH_CLIENT_ID &&
          process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      ),
    buildAuthorizeUrl: (state) => {
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("client_id", process.env.GOOGLE_OAUTH_CLIENT_ID);
      url.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("prompt", "select_account");
      url.searchParams.set("state", state);
      return url.toString();
    },
    exchangeCode: async (code) => {
      const data = await postForm("https://oauth2.googleapis.com/token", {
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      });
      return data.access_token;
    },
    fetchProfile: async (accessToken) => {
      const profile = await getJson(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        accessToken,
      );
      return {
        providerId: String(profile.sub),
        email: profile.email || null,
        name: profile.name || "",
        avatar: profile.picture || "",
        username: "",
        profileUrl: "",
      };
    },
  },

  gitlab: {
    id: "gitlab",
    label: "GitLab",
    isConfigured: () =>
      Boolean(
        process.env.GITLAB_OAUTH_CLIENT_ID &&
          process.env.GITLAB_OAUTH_CLIENT_SECRET,
      ),
    buildAuthorizeUrl: (state) => {
      const url = new URL("https://gitlab.com/oauth/authorize");
      url.searchParams.set("client_id", process.env.GITLAB_OAUTH_CLIENT_ID);
      url.searchParams.set("redirect_uri", GITLAB_REDIRECT_URI);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "read_user");
      url.searchParams.set("state", state);
      return url.toString();
    },
    exchangeCode: async (code) => {
      const data = await postForm("https://gitlab.com/oauth/token", {
        client_id: process.env.GITLAB_OAUTH_CLIENT_ID,
        client_secret: process.env.GITLAB_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: GITLAB_REDIRECT_URI,
        grant_type: "authorization_code",
      });
      return data.access_token;
    },
    fetchProfile: async (accessToken) => {
      const profile = await getJson("https://gitlab.com/api/v4/user", accessToken);
      return {
        providerId: String(profile.id),
        email: profile.email || null,
        name: profile.name || profile.username || "",
        avatar: profile.avatar_url || "",
        username: profile.username || "",
        profileUrl: profile.web_url || "",
      };
    },
  },
};

function listConfiguredProviders() {
  return Object.values(providers)
    .filter((p) => p.isConfigured())
    .map((p) => p.id);
}

module.exports = { providers, listConfiguredProviders };
