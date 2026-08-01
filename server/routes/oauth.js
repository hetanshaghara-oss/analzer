const express = require("express");
const router = express.Router();
const {
  providersStatus,
  startOauth,
  oauthCallback,
  exchangeOauthCode,
} = require("../controllers/oauthController");

// Which providers are configured (GitHub, Google, GitLab)
router.get("/providers", providersStatus);

// POST /api/auth/oauth/exchange — one-time code -> JWT session
router.post("/exchange", exchangeOauthCode);

// GET /api/auth/oauth/:provider/start — redirect to the provider
router.get("/:provider/start", startOauth);

// GET /api/auth/oauth/:provider/callback — provider redirects back here
router.get("/:provider/callback", oauthCallback);

module.exports = router;
