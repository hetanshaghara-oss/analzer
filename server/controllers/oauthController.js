const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Payment = require("../models/Payment");
const OAuthCode = require("../models/OAuthCode");
const {
  providers,
  listConfiguredProviders,
} = require("../services/oauthProviders");
const { storeState, consumeState } = require("../services/oauthState");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const OAUTH_CODE_TTL = 60 * 1000; // one-time frontend exchange codes live 60s

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret",
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" },
  );
  return { accessToken, refreshToken };
};

// GET /api/auth/oauth/providers — which providers can actually be used today
const providersStatus = (req, res) => {
  res.json({ providers: listConfiguredProviders() });
};

// GET /api/auth/oauth/:provider/start — begin an OAuth sign-in redirect
const startOauth = (req, res) => {
  const provider = providers[req.params.provider];
  if (!provider) {
    return res.status(400).json({ message: "Unknown OAuth provider." });
  }
  if (!provider.isConfigured()) {
    return res
      .status(503)
      .json({ message: `${provider.label} sign-in is not configured on the server.` });
  }
  const state = storeState({ type: "signin", provider: provider.id });
  res.redirect(provider.buildAuthorizeUrl(state));
};

// Shared with the existing GitHub "connect" callback, which reuses the same
// provider callback URL for both the sign-in and connect-to-account flows.
async function completeOAuthSignIn(providerId, code, res) {
  const provider = providers[providerId];
  try {
    if (!provider) throw new Error("Unknown OAuth provider.");

    const accessToken = await provider.exchangeCode(code);
    const profile = await provider.fetchProfile(accessToken);
    const user = await findOrCreateUser(provider, profile);

    const { accessToken: at, refreshToken: rt } = generateTokens(user._id);
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(rt);
    user.providerTokens = {
      ...(user.providerTokens || {}),
      [providerId]: accessToken,
    };
    if (providerId === "github") {
      user.githubAccessToken = accessToken;
      if (profile.username) user.githubUsername = profile.username;
    }
    await user.save();

    // Persist the one-time code in MongoDB (not an in-memory Map) so the
    // redirect that creates it and the frontend's POST /exchange that consumes
    // it stay in sync even when they land on different serverless instances.
    const oauthCode = crypto.randomBytes(24).toString("hex");
    await OAuthCode.create({
      code: oauthCode,
      at,
      rt,
      userId: user._id.toString(),
      expiresAt: new Date(Date.now() + OAUTH_CODE_TTL),
    });

    const url = new URL(`${FRONTEND_URL}/oauth/callback`);
    url.searchParams.set("code", oauthCode);
    url.searchParams.set("provider", providerId);
    res.redirect(url.toString());
  } catch (err) {
    console.error(`${providerId} OAuth sign-in error:`, err.message);
    const url = new URL(`${FRONTEND_URL}/oauth/callback`);
    url.searchParams.set(
      "error",
      err.message || `${provider.label || providerId} sign-in failed.`,
    );
    res.redirect(url.toString());
  }
}

// GET /api/auth/oauth/:provider/callback — provider redirected back here
const oauthCallback = async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.redirect(
      `${FRONTEND_URL}/oauth/callback?error=${encodeURIComponent(
        "Missing OAuth code or state.",
      )}`,
    );
  }
  const payload = consumeState(state);
  if (!payload || payload.type !== "signin") {
    return res.redirect(
      `${FRONTEND_URL}/oauth/callback?error=${encodeURIComponent(
        "Invalid or expired OAuth state. Please try signing in again.",
      )}`,
    );
  }
  await completeOAuthSignIn(payload.provider, code, res);
};

// POST /api/auth/oauth/exchange — swap the one-time code for a real session.
// Avoids ever placing JWT access tokens in the URL bar of the redirect back.
const exchangeOauthCode = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: "OAuth code is required." });
  }
  // Atomic read-and-delete makes the code single-use even across serverless
  // instances. The Mongo TTL index garbage-collects any that are never used.
  const record = await OAuthCode.findOneAndDelete({ code });
  if (!record || Date.now() > new Date(record.expiresAt).getTime()) {
    return res
      .status(400)
      .json({ message: "This sign-in link has expired. Please try again." });
  }

  const user = await User.findById(record.userId).select(
    "+githubAccessToken +githubPat",
  );
  if (!user) return res.status(401).json({ message: "Account not found." });

  const safeUser =
    typeof user.toSafeObject === "function" ? user.toSafeObject() : user;
  // Same plan derivation as email login so OAuth users get their paid tier.
  safeUser.plan = await Payment.accessForEmail(safeUser.email);

  res.json({
    accessToken: record.at,
    refreshToken: record.rt,
    user: safeUser,
  });
};

// Find an existing account by provider id, then by verified email, else create.
async function findOrCreateUser(provider, profile) {
  const providerIdField = `${provider.id}Id`; // githubId / googleId / gitlabId
  let user = await User.findOne({ [providerIdField]: profile.providerId });

  if (!user && profile.email) {
    user = await User.findOne({ email: profile.email.toLowerCase() });
  }

  if (!user) {
    const fallbackEmail = `${profile.providerId}@${provider.id}.local`;
    user = new User({
      name: profile.name || profile.username || "GitInsight User",
      email: profile.email ? profile.email.toLowerCase() : fallbackEmail,
      // OAuth-only accounts get an unguessable password they can't use.
      password: crypto.randomBytes(24).toString("hex"),
      avatar: profile.avatar || "",
      isVerified: true,
      [providerIdField]: profile.providerId,
    });
  } else {
    user[providerIdField] = profile.providerId;
    // Upgrade a placeholder email created during an earlier anonymous sign-in.
    if (
      profile.email &&
      user.email &&
      user.email.endsWith(`@${provider.id}.local`)
    ) {
      user.email = profile.email.toLowerCase();
    }
    user.isVerified = true;
  }
  return user;
}

module.exports = {
  providersStatus,
  startOauth,
  oauthCallback,
  exchangeOauthCode,
  completeOAuthSignIn,
};
