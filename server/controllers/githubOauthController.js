const User = require("../models/User");
const { storeState, consumeState } = require("../services/oauthState");
const {
  buildAuthorizeUrl,
  exchangeCode,
  fetchGitHubUser,
  getFrontendRedirectUrl,
} = require("../services/githubOAuth");
const { completeOAuthSignIn } = require("./oauthController");

const startGithubOAuth = async (req, res) => {
  const user = req.user;
  if (!user)
    return res.status(401).json({ message: "Authentication required." });

  const state = storeState({ type: "connect", userId: user._id.toString() });
  const authorizationUrl = buildAuthorizeUrl(state);
  res.json({ authorizationUrl });
};

const githubOAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect(
        getFrontendRedirectUrl("error", "Missing OAuth code or state."),
      );
    }

    const payload = consumeState(state);
    if (!payload) {
      return res.redirect(
        getFrontendRedirectUrl("error", "Invalid or expired OAuth state."),
      );
    }

    // "Sign in with GitHub" (no prior login) is handled by the shared OAuth
    // controller so the sign-in and connect flows can share the same callback.
    if (payload.type === "signin") {
      return completeOAuthSignIn("github", code, res);
    }

    // Existing "connect GitHub to my account" flow (user is already logged in).
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.redirect(
        getFrontendRedirectUrl("error", "Linked account not found."),
      );
    }

    const accessToken = await exchangeCode(code);
    const githubUser = await fetchGitHubUser(accessToken);
    user.githubAccessToken = accessToken;
    user.githubUsername = githubUser.login || user.githubUsername;
    if (githubUser.id) user.githubId = String(githubUser.id);
    await user.save();

    res.redirect(
      getFrontendRedirectUrl("success", "GitHub connected successfully."),
    );
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    res.redirect(
      getFrontendRedirectUrl("error", err.message || "GitHub OAuth failed."),
    );
  }
};

const disconnectGithub = async (req, res) => {
  try {
    const user = req.user;
    user.githubAccessToken = undefined;
    user.githubId = undefined;
    await user.save();
    res.json({ message: "GitHub disconnected successfully." });
  } catch (err) {
    console.error("GitHub disconnect error:", err);
    res.status(500).json({ message: "Failed to disconnect GitHub account." });
  }
};

module.exports = { startGithubOAuth, githubOAuthCallback, disconnectGithub };
