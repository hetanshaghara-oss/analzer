const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  register,
  login,
  logout,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
  getMe,
} = require("../controllers/authController");
const {
  startGithubOAuth,
  githubOAuthCallback,
  disconnectGithub,
} = require("../controllers/githubOauthController");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.post("/refresh", refreshAccessToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/change-password", requireAuth, changePassword);
router.get("/me", requireAuth, getMe);

router.get("/github/start", requireAuth, startGithubOAuth);
router.get("/github/callback", githubOAuthCallback);
router.post("/github/disconnect", requireAuth, disconnectGithub);

module.exports = router;
