/**
 * Heatmap & Coding Rhythm Analyzer Service
 * Builds real 52-week activity matrix from GitHub Events API data.
 * Falls back gracefully when events are unavailable.
 */

const GITHUB_API = 'https://api.github.com';

/**
 * Fetch up to 3 pages of public events (max 300 events) for a user.
 */
async function fetchAllEvents(username) {
  const pages = [1, 2, 3];
  let allEvents = [];
  for (const page of pages) {
    try {
      const res = await fetch(
        `${GITHUB_API}/users/${username}/events/public?per_page=100&page=${page}`
      );
      if (!res.ok) break;
      const events = await res.json();
      if (!Array.isArray(events) || events.length === 0) break;
      allEvents = [...allEvents, ...events];
    } catch {
      break;
    }
  }
  return allEvents;
}

/**
 * Fetch commit activity (weekly) for top repos (last 52 weeks).
 * Returns an array of { week: unixTimestamp, total: commitCount }.
 */
async function fetchRepoCommitActivity(username, repoName) {
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${username}/${repoName}/stats/commit_activity`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data; // Each entry: { week, total, days: [sun..sat] }
  } catch {
    return [];
  }
}

/**
 * Main function: builds real heatmap data for a user using GitHub API.
 * @param {string} username - GitHub username
 * @param {Array} repos - List of repos from the repos API
 */
export async function buildRealHeatmapData(username, repos) {
  // === 1. Initialise 52-week grid ===
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364); // 52 weeks back
  startDate.setHours(0, 0, 0, 0);

  // Map: "YYYY-MM-DD" -> commit count
  const dayCountMap = {};
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    dayCountMap[d.toISOString().split('T')[0]] = 0;
  }

  // Hourly and weekly accumulation arrays
  const hourBucket = new Array(24).fill(0);   // index = hour 0-23
  const weekdayBucket = new Array(7).fill(0); // 0=Sun … 6=Sat
  let totalFromEvents = 0;

  // === 2. Parse Public Events (push events carry commit counts & timestamps) ===
  const events = await fetchAllEvents(username);

  for (const ev of events) {
    const createdAt = new Date(ev.created_at);
    if (createdAt < startDate) continue;

    const dateKey = createdAt.toISOString().split('T')[0];
    const hour = createdAt.getUTCHours();
    const dow = createdAt.getUTCDay();

    let commitCount = 1;
    if (ev.type === 'PushEvent' && ev.payload?.commits) {
      commitCount = ev.payload.commits.length || 1;
    }

    if (dayCountMap[dateKey] !== undefined) {
      dayCountMap[dateKey] += commitCount;
    }
    hourBucket[hour] += commitCount;
    weekdayBucket[dow] += commitCount;
    totalFromEvents += commitCount;
  }

  // === 3. Supplement with repo commit_activity stats for top 5 repos ===
  // Only fetch for repos owned by this user (not forks) sorted by recent activity
  const ownedRepos = repos
    .filter(r => !r.fork && r.owner?.login === username)
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 5);

  let hasRepoStats = false;
  for (const repo of ownedRepos) {
    const activity = await fetchRepoCommitActivity(username, repo.name);
    if (!activity || activity.length === 0) continue;
    hasRepoStats = true;

    for (const week of activity) {
      if (!week.days || !week.week) continue;
      // week.week is a Unix timestamp (start of Sunday)
      for (let dow = 0; dow < 7; dow++) {
        const dayCommits = week.days[dow] || 0;
        if (dayCommits === 0) continue;

        const dayDate = new Date((week.week + dow * 86400) * 1000);
        if (dayDate < startDate || dayDate > today) continue;

        const dateKey = dayDate.toISOString().split('T')[0];
        // Only add if events didn't already cover this day (avoid double-counting)
        if (dayCountMap[dateKey] === 0) {
          dayCountMap[dateKey] += dayCommits;
          weekdayBucket[dow] += dayCommits;
        }
      }
    }
  }

  // === 4. Build the 52-week grid (weeks × days) ===
  // Arrange Sunday → Saturday columns, oldest → newest
  const weeks = [];
  let totalContributions = 0;
  let activeDays = 0;
  let maxStreak = 0;
  let currentStreak = 0;

  // Sort dates ascending
  const sortedDates = Object.keys(dayCountMap).sort();

  // Build day array first
  const dayArray = sortedDates.map(dateStr => {
    const count = dayCountMap[dateStr];
    totalContributions += count;
    if (count > 0) {
      activeDays++;
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
    return {
      date: dateStr,
      count,
      level: count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4
    };
  });

  // Group into weeks of 7
  for (let i = 0; i < dayArray.length; i += 7) {
    weeks.push(dayArray.slice(i, i + 7));
  }

  // === 5. Build Hourly Pattern ===
  const hourLabels = [
    '00:00','02:00','04:00','06:00','08:00','10:00',
    '12:00','14:00','16:00','18:00','20:00','22:00'
  ];
  const hourlyPattern = hourLabels.map((label, idx) => {
    // Aggregate 2-hour buckets
    const h = idx * 2;
    return { hour: label, commits: (hourBucket[h] || 0) + (hourBucket[h + 1] || 0) };
  });

  // === 6. Weekly Day Breakdown ===
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // Reorder Mon-Sun for display
  const weeklyPattern = [1, 2, 3, 4, 5, 6, 0].map(dow => ({
    day: dayNames[dow],
    commits: weekdayBucket[dow]
  }));

  // === 7. Determine Archetype ===
  const peakHour = hourlyPattern.reduce(
    (max, h) => (h.commits > max.commits ? h : max),
    hourlyPattern[0]
  );
  const peakHourNum = parseInt(peakHour.hour);
  let archetype = 'Regular Hours Developer';
  if (peakHourNum >= 20 || peakHourNum <= 4) {
    archetype = 'Night Owl Coder 🌙';
  } else if (peakHourNum >= 5 && peakHourNum <= 9) {
    archetype = 'Early Bird Coder 🌅';
  } else if (peakHourNum >= 10 && peakHourNum <= 13) {
    archetype = 'Morning Peak Engineer ☀️';
  } else {
    archetype = 'Afternoon Peak Engineer ⚡';
  }

  // If no real data at all — signal caller
  const hasRealData = totalContributions > 0;

  return {
    weeks,
    totalContributions,
    activeDays,
    maxStreak,
    hourlyPattern,
    weeklyPattern,
    archetype,
    peakTime: peakHour.hour,
    hasRealData,
    dataSource: hasRepoStats ? 'GitHub Events + Repo Stats' : 'GitHub Events'
  };
}
