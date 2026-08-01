const User = require('../models/User');

// GET /api/users/profile
const getProfile = async (req, res) => {
  const safeUser = typeof req.user.toSafeObject === 'function' ? req.user.toSafeObject() : req.user;
  res.json({ user: safeUser });
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio, githubUsername, website, location, avatar } = req.body;
    const user = req.user;
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (githubUsername !== undefined) user.githubUsername = githubUsername;
    if (website !== undefined) user.website = website;
    if (location !== undefined) user.location = location;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    const safeUser = typeof user.toSafeObject === 'function' ? user.toSafeObject() : user;
    res.json({ message: 'Profile updated.', user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile.' });
  }
};

// PUT /api/users/github-token — save or clear a manual GitHub PAT.
// The token is verified against GitHub's API before it is stored server-side,
// and is used by the GitHub proxy to raise the API rate limit. It is stored in
// its own field (githubPat) so it never overwrites the OAuth connection token.
const verifyGithubToken = async (token) => {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "GitInsightAI-Backend",
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.ok) {
    const profile = await response.json();
    return { ok: true, login: profile.login || null };
  }
  const payload = await response.json().catch(() => ({}));
  return {
    ok: false,
    status: response.status,
    message:
      payload.message ||
      `GitHub rejected the token (HTTP ${response.status}).`,
  };
};

const setGithubToken = async (req, res) => {
  try {
    const { token } = req.body || {};
    const clean = typeof token === "string" ? token.trim() : "";

    if (clean) {
      if (!/^\S{20,}$/.test(clean)) {
        return res.status(400).json({
          message:
            "Invalid GitHub token. It should be 20+ characters with no spaces.",
        });
      }

      let verified;
      try {
        verified = await verifyGithubToken(clean);
      } catch (err) {
        return res.status(502).json({
          message: "Could not reach GitHub to verify the token. Please try again.",
        });
      }

      if (!verified.ok) {
        return res.status(400).json({
          message: `${verified.message || "GitHub rejected that token."} Check it at github.com/settings/tokens.`,
        });
      }

      req.user.githubPat = clean;
      await req.user.save();
      const safeUser =
        typeof req.user.toSafeObject === "function"
          ? req.user.toSafeObject()
          : req.user;
      return res.json({
        message: verified.login
          ? `GitHub token saved — linked to @${verified.login}.`
          : "GitHub token saved.",
        user: safeUser,
      });
    }

    // Empty token clears the stored PAT (the OAuth connection is untouched).
    req.user.githubPat = "";
    await req.user.save();
    const safeUser =
      typeof req.user.toSafeObject === "function"
        ? req.user.toSafeObject()
        : req.user;
    return res.json({
      message: "GitHub token removed.",
      user: safeUser,
    });
  } catch (err) {
    console.error("Failed to update GitHub token:", err);
    res.status(500).json({ message: "Failed to update GitHub token." });
  }
};

// GET /api/users/login-history
const getLoginHistory = async (req, res) => {
  res.json({ loginHistory: req.user.loginHistory || [] });
};

// DELETE /api/users/account
const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete account.' });
  }
};

// ADMIN: GET /api/users (all users)
const getAllUsers = async (req, res) => {
  try {
    // Explicitly exclude secrets (the -password override would otherwise
    // resurrect select:false fields like githubAccessToken / githubPat).
    const users = await User.find().select(
      "-password -githubAccessToken -githubPat -refreshTokens " +
        "-verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordExpiry",
    );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

// ADMIN: PATCH /api/users/:id/suspend
const suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "+githubAccessToken +githubPat",
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.isSuspended = true;
    await user.save();
    const safeUser = typeof user.toSafeObject === 'function' ? user.toSafeObject() : user;
    res.json({ message: 'User suspended.', user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Failed to suspend user.' });
  }
};

// ADMIN: PATCH /api/users/:id/role
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['developer', 'user', 'super_admin'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid role.' });

    const user = await User.findById(req.params.id).select(
      "+githubAccessToken +githubPat",
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.role = role;
    await user.save();
    const safeUser = typeof user.toSafeObject === 'function' ? user.toSafeObject() : user;
    res.json({ message: 'Role updated.', user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role.' });
  }
};

module.exports = { getProfile, updateProfile, setGithubToken, getLoginHistory, deleteAccount, getAllUsers, suspendUser, changeUserRole };
