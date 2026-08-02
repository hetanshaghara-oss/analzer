const express = require("express");
const {
  providersStatus,
  startOauth,
  oauthCallback,
  exchangeOauthCode,
} = require("../controllers/oauthController");

// DB-free routes — mounted ahead of the MongoDB gate in server/index.js, same
// as /api/github. The provider list only reads env vars, and the authorize
// redirect only signs a stateless state token, so both keep working even while
// the database is warming up on a cold serverless instance.
const dbFreeRouter = express.Router();

// Which providers are configured (GitHub, Google, GitLab)
dbFreeRouter.get("/providers", providersStatus);

// GET /api/auth/oauth/:provider/start — redirect to the provider
dbFreeRouter.get("/:provider/start", startOauth);

// DB-backed routes — stay behind the gate: exchanging the one-time code and
// the provider callback both read/write MongoDB.
const router = express.Router();

// POST /api/auth/oauth/exchange — one-time code -> JWT session
router.post("/exchange", exchangeOauthCode);

// GET /api/auth/oauth/:provider/callback — provider redirects back here
router.get("/:provider/callback", oauthCallback);

module.exports = router;
module.exports.dbFreeRouter = dbFreeRouter;
