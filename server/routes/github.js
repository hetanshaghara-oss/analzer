const express = require("express");
const router = express.Router();
const { optionalAuth } = require("../middleware/auth");
const {
  fetchUserProfile,
  fetchUserRepositories,
  fetchUserEvents,
  fetchRepoDetail,
  fetchRepoFileTree,
  fetchRepoReadme,
  fetchRepoLanguages,
  fetchRepoContributors,
  fetchLeaderboard,
  fetchUserFollowers,
  fetchSearchUsers,
} = require("../services/githubProxy");

router.use(optionalAuth);

// A user's manual PAT takes precedence; their GitHub OAuth token is the fallback.
function effectiveToken(req) {
  return req.user?.githubPat || req.user?.githubAccessToken || null;
}

function handleAsync(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      next(error);
    }
  };
}

router.get(
  "/users/:username",
  handleAsync(async (req, res) => {
    const accessToken = effectiveToken(req);
    const data = await fetchUserProfile(req.params.username, accessToken);
    res.json(data);
  }),
);

router.get(
  "/users/:username/repos",
  handleAsync(async (req, res) => {
    const accessToken = effectiveToken(req);
    const data = await fetchUserRepositories(req.params.username, accessToken);
    res.json(data);
  }),
);

router.get(
  "/users/:username/events",
  handleAsync(async (req, res) => {
    const accessToken = effectiveToken(req);
    const data = await fetchUserEvents(req.params.username, accessToken);
    res.json(data);
  }),
);

router.get(
  "/repos/:owner/:repo",
  handleAsync(async (req, res) => {
    const accessToken = effectiveToken(req);
    const data = await fetchRepoDetail(
      req.params.owner,
      req.params.repo,
      accessToken,
    );
    res.json(data);
  }),
);

router.get(
  "/repos/:owner/:repo/contents",
  handleAsync(async (req, res) => {
    const accessToken = effectiveToken(req);
    const data = await fetchRepoFileTree(
      req.params.owner,
      req.params.repo,
      accessToken,
    );
    res.json(data);
  }),
);

router.get(
  "/repos/:owner/:repo/readme",
  handleAsync(async (req, res) => {
    const accessToken = effectiveToken(req);
    const data = await fetchRepoReadme(
      req.params.owner,
      req.params.repo,
      accessToken,
    );
    res.json(data);
  }),
);

router.get(
  "/repos/:owner/:repo/languages",
  handleAsync(async (req, res) => {
    const accessToken = effectiveToken(req);
    const data = await fetchRepoLanguages(
      req.params.owner,
      req.params.repo,
      accessToken,
    );
    res.json(data);
  }),
);

router.get(
  "/repos/:owner/:repo/contributors",
  handleAsync(async (req, res) => {
    const accessToken = effectiveToken(req);
    const data = await fetchRepoContributors(
      req.params.owner,
      req.params.repo,
      accessToken,
    );
    res.json(data);
  }),
);

router.get(
  "/leaderboard/:category",
  handleAsync(async (req, res) => {
    const accessToken = effectiveToken(req);
    const data = await fetchLeaderboard(req.params.category, accessToken);
    res.json(data);
  }),
);

// Developer discovery: GitHub user search + profile enrichment
router.get(
  "/search/users",
  handleAsync(async (req, res) => {
    const accessToken = effectiveToken(req);
    const q = req.query.q || "type:user";
    const data = await fetchSearchUsers(
      { q, sort: "followers", order: "desc", per_page: 12 },
      accessToken,
    );
    const items = data?.items || [];

    // Enrich with profile details (location, followers, repos) — parallel, cached
    const enriched = await Promise.all(
      items.map((u) => fetchUserProfile(u.login, accessToken).catch(() => null)),
    );
    const developers = items
      .map((u, i) => ({ ...u, ...(enriched[i] || {}) }))
      .filter((d) => d && d.followers !== undefined);

    res.json(developers);
  }),
);

router.get(
  "/users/:username/followers",
  handleAsync(async (req, res) => {
    const accessToken = effectiveToken(req);
    const data = await fetchUserFollowers(req.params.username, accessToken);
    res.json(data);
  }),
);

module.exports = router;
