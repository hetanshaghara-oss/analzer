const {
  fetchUserProfile,
  fetchUserRepositories,
} = require("./githubProxy");

/**
 * Capture a point-in-time snapshot of a GitHub profile's key stats.
 * Uses the GitHub proxy so it benefits from the same caching / token fallback
 * as the rest of the app. Best-effort: if the repos call fails we still return
 * a snapshot built from the profile alone.
 */
async function captureSnapshot(username, accessToken) {
  const profile = await fetchUserProfile(username, accessToken);

  let repos = [];
  try {
    repos = (await fetchUserRepositories(username, accessToken)) || [];
  } catch {
    /* repos are optional — the profile numbers still make a valid snapshot */
  }

  const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((s, r) => s + (r.forks_count || 0), 0);
  const totalSize = repos.reduce((s, r) => s + (r.size || 0), 0);

  const langCount = {};
  repos.forEach((r) => {
    if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
  });
  const topLanguages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  return {
    at: new Date(),
    name: profile.name || profile.login,
    avatar: profile.avatar_url || "",
    bio: profile.bio || "",
    location: profile.location || "",
    htmlUrl: profile.html_url || "",
    followers: profile.followers ?? 0,
    following: profile.following ?? 0,
    publicRepos: profile.public_repos ?? repos.length,
    gists: profile.public_gists ?? 0,
    totalStars,
    totalForks,
    totalSize,
    topLanguages,
    repoNames: repos.map((r) => r.name),
  };
}

const METRIC_LABELS = {
  followers: "followers",
  following: "following",
  publicRepos: "repositories",
  gists: "gists",
  totalStars: "stars",
  totalForks: "forks",
  totalSize: "size (KB)",
};

/**
 * Diff two snapshots and return { deltas, changes, hasChanges }.
 * `changes` is a list of short human-readable lines (with emoji) describing
 * what moved since the previous check — used both for the change log and for
 * the "unread changes" indicator on the watchlist card.
 */
function buildChangeReport(prev, next) {
  const deltas = {};
  for (const metric of Object.keys(METRIC_LABELS)) {
    deltas[metric] = (next[metric] || 0) - (prev[metric] || 0);
  }

  const changes = [];

  // New repositories detected by name.
  const prevNames = new Set(prev.repoNames || []);
  const newRepos = (next.repoNames || []).filter((n) => !prevNames.has(n));
  if (newRepos.length > 0) {
    changes.push(
      `🚀 New repo${newRepos.length > 1 ? "s" : ""}: ${newRepos.join(", ")}`,
    );
  }

  const formatDelta = (value) =>
    value > 0 ? `+${value.toLocaleString()}` : value.toLocaleString();

  if (deltas.followers !== 0)
    changes.push(`👥 ${formatDelta(deltas.followers)} followers`);
  if (deltas.totalStars !== 0)
    changes.push(`⭐ ${formatDelta(deltas.totalStars)} stars`);
  if (deltas.totalForks !== 0)
    changes.push(`⑂ ${formatDelta(deltas.totalForks)} forks`);
  if (deltas.publicRepos !== 0)
    changes.push(`📦 ${formatDelta(deltas.publicRepos)} repositories`);
  if (deltas.following !== 0)
    changes.push(`🤝 ${formatDelta(deltas.following)} following`);
  if (deltas.gists !== 0) changes.push(`📜 ${formatDelta(deltas.gists)} gists`);

  // Profile detail changes.
  if (prev.name && next.name && prev.name !== next.name)
    changes.push(`✏️ Display name: ${prev.name} → ${next.name}`);
  if (prev.bio !== next.bio) changes.push("✏️ Bio updated");
  if (prev.location !== next.location)
    changes.push(`📍 Location: ${prev.location || "—"} → ${next.location || "—"}`);
  if (prev.avatar && next.avatar && prev.avatar !== next.avatar)
    changes.push("🖼️ Profile picture updated");

  const prevLang = prev.topLanguages?.[0];
  const nextLang = next.topLanguages?.[0];
  if (prevLang !== nextLang)
    changes.push(
      nextLang ? `🧩 Top language: ${nextLang}` : "🧩 Top language changed",
    );

  return { deltas, changes, hasChanges: changes.length > 0 };
}

/** How long a profile can go unchecked before it's considered stale. */
const STALE_MS = 6 * 60 * 60 * 1000; // 6 hours

function isStale(entry) {
  if (!entry.lastCheckedAt) return true;
  return Date.now() - new Date(entry.lastCheckedAt).getTime() > STALE_MS;
}

module.exports = {
  captureSnapshot,
  buildChangeReport,
  STALE_MS,
  isStale,
};
