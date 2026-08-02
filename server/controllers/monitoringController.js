const Watchlist = require("../models/Watchlist");
const {
  captureSnapshot,
  buildChangeReport,
  isStale,
} = require("../services/monitoring");
const { fetchUserEvents } = require("../services/githubProxy");

// The viewer's GitHub token (manual PAT > OAuth) so snapshots of private-adjacent
// data and higher rate limits are used when available. Falls back to the proxy's
// shared token / unauthenticated mode otherwise.
function effectiveToken(req) {
  return req.user?.githubPat || req.user?.githubAccessToken || null;
}

const USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;

// Capture a fresh snapshot, diff it against the previous one, and persist both
// the snapshot and (if anything changed) a change-log entry. Returns the report.
async function captureAndSave(entry, accessToken) {
  const snapshot = await captureSnapshot(entry.githubUsername, accessToken);
  const last = entry.snapshots[entry.snapshots.length - 1];

  let report = { deltas: {}, changes: [], hasChanges: false };
  if (last) {
    // Reconstruct the previous repo names for new-repo detection.
    // Must use .toObject() — spreading a Mongoose subdocument yields no data
    // fields, which made every refresh look like a huge change.
    const prevNames = entry.lastRepoNames || [];
    const prevLike = { ...last.toObject(), repoNames: prevNames };
    report = buildChangeReport(prevLike, snapshot);
    if (report.hasChanges) {
      entry.changeLog.push({
        at: snapshot.at,
        changes: report.changes,
        deltas: report.deltas,
      });
      entry.unreadChanges = true;
    }
  }

  const { repoNames, ...stored } = snapshot;
  entry.snapshots.push(stored);
  entry.lastRepoNames = repoNames;
  entry.name = snapshot.name;
  entry.avatar = snapshot.avatar;
  entry.htmlUrl = snapshot.htmlUrl;
  entry.lastCheckedAt = snapshot.at;
  entry.trimHistory();
  await entry.save();
  return report;
}

// Latest deltas, computed from the last two snapshots — what changed since the
// previous check, shown on the watchlist card.
function latestDelta(entry) {
  const n = entry.snapshots.length;
  if (n < 2) return null;
  const last = entry.snapshots[n - 1];
  const prev = entry.snapshots[n - 2];
  const delta = {};
  for (const metric of [
    "followers",
    "following",
    "publicRepos",
    "gists",
    "totalStars",
    "totalForks",
  ]) {
    delta[metric] = (last[metric] || 0) - (prev[metric] || 0);
  }
  return { at: last.at, delta };
}

function toCardView(entry) {
  return {
    id: entry._id,
    githubUsername: entry.githubUsername,
    name: entry.name,
    avatar: entry.avatar,
    htmlUrl: entry.htmlUrl,
    lastCheckedAt: entry.lastCheckedAt,
    unreadChanges: entry.unreadChanges,
    latest: entry.snapshots[entry.snapshots.length - 1] || null,
    latestDelta: latestDelta(entry),
    snapshotCount: entry.snapshots.length,
  };
}

// GET /api/monitoring — the user's watchlist. Lazily refreshes stale entries
// (a few per request) so trends keep updating without a background job.
exports.listWatchlists = async (req, res, next) => {
  try {
    const entries = await Watchlist.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    const stale = entries
      .filter(isStale)
      .sort((a, b) => new Date(a.lastCheckedAt || 0) - new Date(b.lastCheckedAt || 0));
    const toRefresh = stale.slice(0, 3); // cap GitHub calls per request
    await Promise.allSettled(
      toRefresh.map((entry) =>
        captureAndSave(entry, effectiveToken(req)).catch((err) => {
          console.warn(
            `monitoring: refresh failed for ${entry.githubUsername}:`,
            err.message,
          );
        }),
      ),
    );

    res.json(entries.map(toCardView));
  } catch (err) {
    next(err);
  }
};

// POST /api/monitoring — add a GitHub username to the watchlist.
exports.addWatchlist = async (req, res, next) => {
  try {
    const username = String(req.body?.username || "").trim().toLowerCase();
    if (!username) {
      return res.status(400).json({ message: "A GitHub username is required." });
    }
    if (!USERNAME_RE.test(username)) {
      return res
        .status(400)
        .json({ message: "That doesn't look like a valid GitHub username." });
    }

    const existing = await Watchlist.findOne({
      userId: req.user._id,
      githubUsername: username,
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "You're already monitoring this profile." });
    }

    const entry = await Watchlist.create({
      userId: req.user._id,
      githubUsername: username,
    });

    try {
      await captureAndSave(entry, effectiveToken(req));
    } catch (err) {
      // Bad username — roll the entry back so it isn't left half-created.
      await Watchlist.deleteOne({ _id: entry._id });
      if (err.status === 404) {
        return res
          .status(404)
          .json({ message: `GitHub user "${username}" not found.` });
      }
      return res
        .status(502)
        .json({ message: "Could not reach GitHub. Please try again." });
    }

    res.status(201).json(toCardView(entry));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/monitoring/:username — stop monitoring a profile.
exports.removeWatchlist = async (req, res, next) => {
  try {
    const username = String(req.params.username || "").trim().toLowerCase();
    const deleted = await Watchlist.findOneAndDelete({
      userId: req.user._id,
      githubUsername: username,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Profile not in your watchlist." });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// POST /api/monitoring/:username/refresh — force a fresh snapshot now.
exports.refreshWatchlist = async (req, res, next) => {
  try {
    const username = String(req.params.username || "").trim().toLowerCase();
    const entry = await Watchlist.findOne({
      userId: req.user._id,
      githubUsername: username,
    });
    if (!entry) {
      return res.status(404).json({ message: "Profile not in your watchlist." });
    }

    const report = await captureAndSave(entry, effectiveToken(req));
    res.json({ ...toCardView(entry), report });
  } catch (err) {
    if (err.status === 404) {
      return res
        .status(404)
        .json({ message: "GitHub user no longer exists." });
    }
    next(err);
  }
};

// GET /api/monitoring/:username — full detail: snapshot history for trend
// charts, change log, and a recent public-activity feed. Refreshes if stale.
exports.getWatchlistDetail = async (req, res, next) => {
  try {
    const username = String(req.params.username || "").trim().toLowerCase();
    const entry = await Watchlist.findOne({
      userId: req.user._id,
      githubUsername: username,
    });
    if (!entry) {
      return res.status(404).json({ message: "Profile not in your watchlist." });
    }

    if (isStale(entry)) {
      try {
        await captureAndSave(entry, effectiveToken(req));
      } catch (err) {
        console.warn(
          `monitoring: background refresh failed for ${username}:`,
          err.message,
        );
      }
    }

    let activity = [];
    try {
      activity = (await fetchUserEvents(username, effectiveToken(req))) || [];
    } catch (err) {
      console.warn(`monitoring: events failed for ${username}:`, err.message);
    }

    res.json({
      id: entry._id,
      githubUsername: entry.githubUsername,
      name: entry.name,
      avatar: entry.avatar,
      htmlUrl: entry.htmlUrl,
      lastCheckedAt: entry.lastCheckedAt,
      unreadChanges: entry.unreadChanges,
      snapshotCount: entry.snapshots.length,
      snapshots: entry.snapshots,
      changeLog: entry.changeLog.slice().reverse(), // newest first
      activity: activity.slice(0, 20),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/monitoring/:username/read — mark change-log entries as seen.
exports.markWatchlistRead = async (req, res, next) => {
  try {
    const username = String(req.params.username || "").trim().toLowerCase();
    const entry = await Watchlist.findOneAndUpdate(
      { userId: req.user._id, githubUsername: username },
      { unreadChanges: false },
      { new: true },
    );
    if (!entry) {
      return res.status(404).json({ message: "Profile not in your watchlist." });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
