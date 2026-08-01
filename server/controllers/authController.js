const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Payment = require("../models/Payment");
const { sendMail } = require("../services/mailer");

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

const getLoginInfo = (req) => ({
  ip: req.ip || req.connection.remoteAddress || "127.0.0.1",
  browser: req.headers["user-agent"]
    ? req.headers["user-agent"].substring(0, 100)
    : "Unknown",
  device: req.headers["user-agent"]
    ? req.headers["user-agent"].includes("Mobile")
      ? "Mobile"
      : "Desktop"
    : "Unknown",
  location: "Local",
  loginAt: new Date(),
});

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: "developer",
      verificationToken,
      verificationTokenExpiry,
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokens = [refreshToken];
    await user.save();

    const safeUser =
      typeof user.toSafeObject === "function" ? user.toSafeObject() : user;
    // A buyer may have paid (and been confirmed) before creating their
    // account, so derive the plan from confirmed payments rather than
    // defaulting to "free".
    safeUser.plan = await Payment.accessForEmail(safeUser.email);

    res.status(201).json({
      message: "Account created successfully.",
      accessToken,
      refreshToken,
      user: safeUser,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +githubAccessToken +githubPat",
    );
    if (!user)
      return res.status(401).json({ message: "Invalid email or password." });
    if (user.isSuspended)
      return res
        .status(403)
        .json({ message: "Account suspended. Contact support." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password." });

    const { accessToken, refreshToken } = generateTokens(user._id);

    const loginInfo = getLoginInfo(req);
    user.refreshTokens = user.refreshTokens || [];
    user.loginHistory = user.loginHistory || [];
    user.refreshTokens.push(refreshToken);
    user.loginHistory.unshift(loginInfo);
    if (user.loginHistory.length > 20)
      user.loginHistory = user.loginHistory.slice(0, 20);
    await user.save();

    const safeUser =
      typeof user.toSafeObject === "function" ? user.toSafeObject() : user;
    safeUser.plan = await Payment.accessForEmail(safeUser.email);

    res.json({
      message: "Logged in successfully.",
      accessToken,
      refreshToken,
      user: safeUser,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken && req.user) {
      req.user.refreshTokens = (req.user.refreshTokens || []).filter(
        (t) => t !== refreshToken,
      );
      await req.user.save();
    }
    res.json({ message: "Logged out successfully." });
  } catch (err) {
    res.status(500).json({ message: "Logout failed." });
  }
};

// POST /api/auth/refresh
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token required." });

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret",
    );
    const user = await User.findById(decoded.userId);
    if (!user || !(user.refreshTokens || []).includes(refreshToken)) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id,
    );
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired refresh token." });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.json({
        message:
          "If this email is registered, you will receive a reset link shortly.",
      });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Deliver the reset link by email. Without SMTP configured this no-ops
    // (logs a warning) so the endpoint still returns the safe generic message.
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Reset your GitInsight AI password",
      html: `<p>Hi ${user.name || "there"},</p>
<p>You asked to reset your GitInsight AI password. Click the link below — it expires in 1 hour:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>`,
    });

    res.json({
      message:
        "If this email is registered, you will receive a reset link shortly.",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to process request." });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res
        .status(400)
        .json({ message: "Token and new password are required." });
    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });
    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token." });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    user.refreshTokens = [];
    await user.save();

    res.json({ message: "Password reset successfully. Please log in." });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password." });
  }
};

// GET /api/auth/verify-email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res
        .status(400)
        .json({ message: "Verification token is required." });

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    });
    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token." });

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Email verified successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Email verification failed." });
  }
};

// POST /api/auth/change-password (requires auth)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res
        .status(400)
        .json({ message: "Current and new password required." });
    if (newPassword.length < 8)
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters." });

    const user = req.user;
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to change password." });
  }
};

// GET /api/auth/me (requires auth)
const getMe = async (req, res) => {
  const safeUser =
    typeof req.user.toSafeObject === "function"
      ? req.user.toSafeObject()
      : req.user;
  safeUser.plan = await Payment.accessForEmail(safeUser.email);
  res.json({ user: safeUser });
};

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
  getMe,
};
