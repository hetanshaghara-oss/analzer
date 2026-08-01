const API_BASE_URL = "/api/github";

function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("gitinsight_token");
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export class GitHubAPIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "GitHubAPIError";
  }
}

async function handleApiResponse(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      body?.message ||
      fallbackMessage ||
      `GitHub proxy request failed with status ${response.status}`;
    if (response.status === 404) throw new GitHubAPIError("Not found", 404);
    if (response.status === 403)
      throw new GitHubAPIError(
        "API rate limit reached. Please try again later.",
        403,
      );
    throw new GitHubAPIError(message, response.status);
  }

  return body;
}

export async function fetchUserProfile(username) {
  const response = await fetch(`${API_BASE_URL}/users/${username}`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse(
    response,
    "An error occurred while fetching the profile",
  );
}

export async function fetchUserRepositories(username) {
  const response = await fetch(`${API_BASE_URL}/users/${username}/repos`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse(
    response,
    `Failed to fetch repositories for ${username}`,
  );
}

export const fetchUserRepos = fetchUserRepositories;

export async function fetchUserEvents(username) {
  const response = await fetch(`${API_BASE_URL}/users/${username}/events`, {
    headers: getAuthHeaders(),
  });
  return (
    handleApiResponse(response, `Failed to fetch events for ${username}`) || []
  );
}

export async function fetchRepoDetail(owner, repo) {
  const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse(response, "Repository not found");
}

export async function fetchRepoFileTree(owner, repo) {
  const response = await fetch(
    `${API_BASE_URL}/repos/${owner}/${repo}/contents`,
    { headers: getAuthHeaders() },
  );
  return (
    handleApiResponse(
      response,
      `Failed to fetch repository contents for ${owner}/${repo}`,
    ) || []
  );
}

export async function fetchRepoReadme(owner, repo) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/repos/${owner}/${repo}/readme`,
      { headers: getAuthHeaders() },
    );
    const data = await handleApiResponse(response, "Failed to fetch README");
    if (!data || !data.content) return null;
    return atob(data.content.replace(/\n/g, ""));
  } catch {
    return null;
  }
}

export async function fetchRepoLanguages(owner, repo) {
  const response = await fetch(
    `${API_BASE_URL}/repos/${owner}/${repo}/languages`,
    { headers: getAuthHeaders() },
  );
  return (
    handleApiResponse(
      response,
      `Failed to fetch repository languages for ${owner}/${repo}`,
    ) || {}
  );
}

export async function fetchRepoContributors(owner, repo) {
  const response = await fetch(
    `${API_BASE_URL}/repos/${owner}/${repo}/contributors?per_page=10`,
    { headers: getAuthHeaders() },
  );
  return (
    handleApiResponse(
      response,
      `Failed to fetch repository contributors for ${owner}/${repo}`,
    ) || []
  );
}

export function calculateStatistics(repos) {
  let totalStars = 0;
  let totalForks = 0;
  let totalSize = 0;

  const languageStats = {};

  let mostStarredRepo = null;
  let mostForkedRepo = null;
  let largestRepo = null;
  let newestRepo = null;
  let oldestRepo = null;
  let recentlyUpdatedRepo = null;

  repos.forEach((repo) => {
    totalStars += repo.stargazers_count;
    totalForks += repo.forks_count;
    totalSize += repo.size;

    // Language tracking (distribution, stars, forks per language)
    if (repo.language) {
      if (!languageStats[repo.language]) {
        languageStats[repo.language] = { count: 0, stars: 0, forks: 0 };
      }
      languageStats[repo.language].count += 1;
      languageStats[repo.language].stars += repo.stargazers_count;
      languageStats[repo.language].forks += repo.forks_count;
    }

    // Highlights
    if (
      !mostStarredRepo ||
      repo.stargazers_count > mostStarredRepo.stargazers_count
    ) {
      mostStarredRepo = repo;
    }
    if (!mostForkedRepo || repo.forks_count > mostForkedRepo.forks_count) {
      mostForkedRepo = repo;
    }
    if (!largestRepo || repo.size > largestRepo.size) {
      largestRepo = repo;
    }

    const createdAt = new Date(repo.created_at);
    if (!newestRepo || createdAt > new Date(newestRepo.created_at)) {
      newestRepo = repo;
    }
    if (!oldestRepo || createdAt < new Date(oldestRepo.created_at)) {
      oldestRepo = repo;
    }

    const updatedAt = new Date(repo.updated_at);
    if (
      !recentlyUpdatedRepo ||
      updatedAt > new Date(recentlyUpdatedRepo.updated_at)
    ) {
      recentlyUpdatedRepo = repo;
    }
  });

  // Calculate top language and percentages
  let topLanguage = "N/A";
  let maxCount = 0;
  const languageDistribution = [];

  let totalLanguageRepos = 0;

  for (const [lang, stats] of Object.entries(languageStats)) {
    totalLanguageRepos += stats.count;
    if (stats.count > maxCount) {
      topLanguage = lang;
      maxCount = stats.count;
    }
  }

  for (const [lang, stats] of Object.entries(languageStats)) {
    languageDistribution.push({
      name: lang,
      count: stats.count,
      stars: stats.stars,
      forks: stats.forks,
      percentage: ((stats.count / totalLanguageRepos) * 100).toFixed(1),
    });
  }

  // Sort language distribution by count descending
  languageDistribution.sort((a, b) => b.count - a.count);

  const numRepos = repos.length;

  // Developer Stats
  const avgStars = numRepos > 0 ? (totalStars / numRepos).toFixed(1) : 0;
  const avgForks = numRepos > 0 ? (totalForks / numRepos).toFixed(1) : 0;
  const avgSize = numRepos > 0 ? (totalSize / numRepos).toFixed(0) : 0;
  const langDiversity = Object.keys(languageStats).length;

  // Calculate a mock repository growth based on newest vs oldest repo difference
  let repoGrowth = "N/A";
  if (oldestRepo && newestRepo) {
    const diffMonths =
      (new Date(newestRepo.created_at) - new Date(oldestRepo.created_at)) /
      (1000 * 60 * 60 * 24 * 30);
    if (diffMonths > 0) {
      repoGrowth = `${(numRepos / diffMonths).toFixed(2)} repos/month`;
    }
  }

  return {
    overview: {
      totalStars,
      totalForks,
      totalRepos: numRepos,
      totalSize,
      topLanguage,
      totalLanguagesUsed: langDiversity,
      avgStars,
      avgForks,
      avgSize,
      repoGrowth,
    },
    languages: languageDistribution,
    highlights: {
      mostStarredRepo,
      mostForkedRepo,
      largestRepo,
      newestRepo,
      oldestRepo,
      recentlyUpdatedRepo,
    },
    repos,
  };
}

export async function fetchLeaderboard(category = "followers") {
  const response = await fetch(`${API_BASE_URL}/leaderboard/${category}`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse(
    response,
    `Failed to fetch leaderboard for ${category}`,
  );
}

export async function fetchDeveloperSearch({ language = "", country = "" } = {}) {
  const parts = ["type:user"];
  if (language) parts.push(`language:${language}`);
  if (country) parts.push(`location:${country}`);
  parts.push("followers:>20");
  const q = parts.join(" ");
  const response = await fetch(
    `${API_BASE_URL}/search/users?q=${encodeURIComponent(q)}`,
    { headers: getAuthHeaders() },
  );
  return handleApiResponse(response, "Failed to find developers");
}

export function analyzePersona(repos, events) {
  if (!repos || repos.length === 0) {
    return {
      title: "The Silent Observer",
      summary: "You prefer to watch and learn from the sidelines. Time to make your first commit!",
      icon: "Ghost"
    };
  }

  // 1. Language Analysis
  const langCounts = {};
  repos.forEach(r => {
    if (r.language) {
      langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    }
  });
  
  const langs = Object.keys(langCounts);
  let topLang = "Unknown";
  let max = 0;
  for (const l in langCounts) {
    if (langCounts[l] > max) {
      max = langCounts[l];
      topLang = l;
    }
  }

  // 2. Time Analysis (Events)
  let earlyCommits = 0; // 5 AM - 12 PM
  let dayCommits = 0;   // 12 PM - 7 PM
  let nightCommits = 0; // 7 PM - 5 AM
  
  if (events && events.length > 0) {
    events.forEach(e => {
      const hour = new Date(e.created_at).getHours();
      if (hour >= 5 && hour < 12) earlyCommits++;
      else if (hour >= 12 && hour < 19) dayCommits++;
      else nightCommits++;
    });
  }

  // Determine Time Trait
  let timeTrait = "Daytime";
  if (nightCommits > dayCommits && nightCommits > earlyCommits) timeTrait = "Night Owl";
  else if (earlyCommits > dayCommits && earlyCommits > nightCommits) timeTrait = "Early Bird";
  else if (dayCommits > earlyCommits && dayCommits > nightCommits) timeTrait = "9-to-5";

  // Determine Role Trait
  let roleTrait = "Developer";
  let icon = "Code";
  
  const frontend = ["JavaScript", "TypeScript", "HTML", "CSS", "Vue", "Svelte"];
  const backend = ["Java", "C#", "PHP", "Ruby", "Go"];
  const data = ["Python", "Jupyter Notebook", "R"];
  const systems = ["C", "C++", "Rust", "Assembly"];
  
  if (frontend.includes(topLang)) { roleTrait = "Frontend Wizard"; icon = "Layout"; }
  else if (backend.includes(topLang)) { roleTrait = "Backend Architect"; icon = "Server"; }
  else if (data.includes(topLang)) { roleTrait = "Data Scientist"; icon = "Database"; }
  else if (systems.includes(topLang)) { roleTrait = "Systems Hacker"; icon = "Cpu"; }
  else if (langs.length >= 7) { roleTrait = "Polyglot"; icon = "Globe"; }

  const title = `${timeTrait} ${roleTrait}`;
  
  let summary = `Based on your recent GitHub activity, you're a true ${title}. `;
  if (timeTrait === "Night Owl") summary += "You do your best work when the sun goes down, pushing commits into the early hours of the morning. ";
  else if (timeTrait === "Early Bird") summary += "You love catching the worm, shipping code before most people have had their coffee! ";
  else summary += "You keep a solid, steady pace throughout the day, shipping reliable code. ";

  if (langs.length >= 7) {
    summary += `You're incredibly versatile, bouncing between ${langs.length} different languages with ease.`;
  } else if (topLang !== "Unknown") {
    summary += `Your weapon of choice is clearly ${topLang}, where you spend most of your time crafting elegant solutions.`;
  }

  return { title, summary, icon };
}

export function generateWrapped(repos, events) {
  const currentYear = new Date().getFullYear();
  
  // Filter for this year's activity
  const thisYearRepos = repos.filter(r => new Date(r.created_at).getFullYear() === currentYear);
  const thisYearEvents = events ? events.filter(e => new Date(e.created_at).getFullYear() === currentYear) : [];

  // Top Languages
  const langCounts = {};
  repos.forEach(r => {
    if (r.language) {
      langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    }
  });
  const topLanguages = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);

  // Busiest Month
  const monthCounts = {};
  thisYearEvents.forEach(e => {
    const month = new Date(e.created_at).toLocaleString('default', { month: 'long' });
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });
  let busiestMonth = "N/A";
  let maxEvents = 0;
  for (const [month, count] of Object.entries(monthCounts)) {
    if (count > maxEvents) {
      maxEvents = count;
      busiestMonth = month;
    }
  }

  // Crown Jewel (Most Starred Repo this year, or overall if none this year)
  let crownJewel = null;
  if (thisYearRepos.length > 0) {
    crownJewel = thisYearRepos.reduce((prev, current) => (prev.stargazers_count > current.stargazers_count) ? prev : current);
  } else if (repos.length > 0) {
    crownJewel = repos.reduce((prev, current) => (prev.stargazers_count > current.stargazers_count) ? prev : current);
  }

  const totalStarsEarned = repos.reduce((acc, curr) => acc + curr.stargazers_count, 0);

  return {
    year: currentYear,
    totalReposCreated: thisYearRepos.length,
    totalEvents: thisYearEvents.length,
    topLanguages,
    busiestMonth,
    crownJewel: crownJewel ? {
      name: crownJewel.name,
      stars: crownJewel.stargazers_count,
      description: crownJewel.description
    } : null,
    totalStarsEarned
  };
}

// Local Dictionary mapping common tech hub locations to [lat, lng]
const geoDictionary = {
  "san francisco": [37.7749, -122.4194],
  "sf": [37.7749, -122.4194],
  "new york": [40.7128, -74.0060],
  "london": [51.5074, -0.1278],
  "berlin": [52.5200, 13.4050],
  "paris": [48.8566, 2.3522],
  "amsterdam": [52.3676, 4.9041],
  "bangalore": [12.9716, 77.5946],
  "tokyo": [35.6762, 139.6503],
  "seoul": [37.5665, 126.9780],
  "sydney": [-33.8688, 151.2093],
  "toronto": [43.6510, -79.3470],
  "seattle": [47.6062, -122.3321],
  "austin": [30.2672, -97.7431],
  "india": [20.5937, 78.9629],
  "china": [35.8617, 104.1954],
  "uk": [55.3781, -3.4360],
  "us": [37.0902, -95.7129],
  "united states": [37.0902, -95.7129],
  "brazil": [-14.2350, -51.9253],
  "germany": [51.1657, 10.4515],
  "france": [46.2276, 2.2137],
  "canada": [56.1304, -106.3468]
};

export async function fetchFollowerLocations(username) {
  try {
    // 1. Fetch followers list
    const response = await fetch(`${API_BASE_URL}/users/${username}/followers`, {
      headers: getAuthHeaders(),
    });
    const followers = await handleApiResponse(response, "Failed to fetch followers") || [];
    
    // 2. We only take the top 15 followers to avoid hitting rate limits too hard
    const topFollowers = followers.slice(0, 15);
    
    // 3. Fetch detailed profile for each to get 'location'
    const detailedFollowers = await Promise.all(
      topFollowers.map(async (f) => {
        try {
          const res = await fetch(`${API_BASE_URL}/users/${f.login}`, { headers: getAuthHeaders() });
          return await res.json();
        } catch(e) { return null; }
      })
    );

    const locations = [];
    detailedFollowers.forEach(user => {
      if (user && user.location) {
        const locStr = user.location.toLowerCase();
        let found = false;
        // Simple string matching against dictionary
        for (const [key, coords] of Object.entries(geoDictionary)) {
          if (locStr.includes(key)) {
            locations.push({ location: [coords[0], coords[1]], size: 0.1 });
            found = true;
            break;
          }
        }
        // Fallback random location if not matched (just for visual representation in this demo)
        if (!found) {
           locations.push({ location: [(Math.random() - 0.5) * 180, (Math.random() - 0.5) * 360], size: 0.05 });
        }
      }
    });
    return locations;
  } catch (err) {
    console.error("Failed to load follower locations", err);
    return [];
  }
}

export function calculateYearlyStats(repos) {
  if (!repos || repos.length === 0) return {};

  const yearlyStats = {};

  repos.forEach((repo) => {
    const year = new Date(repo.created_at).getFullYear();
    
    if (!yearlyStats[year]) {
      yearlyStats[year] = {
        year,
        repoCount: 0,
        languages: {},
        topRepo: null,
      };
    }

    const yearData = yearlyStats[year];
    yearData.repoCount += 1;

    // Track languages
    if (repo.language) {
      yearData.languages[repo.language] = (yearData.languages[repo.language] || 0) + 1;
    }

    // Track top repo for this year
    if (!yearData.topRepo || repo.stargazers_count > yearData.topRepo.stars) {
      yearData.topRepo = {
        name: repo.name,
        stars: repo.stargazers_count,
        description: repo.description,
        language: repo.language
      };
    }
  });

  // Post-process to find the dominant language for each year
  for (const year in yearlyStats) {
    const langs = yearlyStats[year].languages;
    let dominant = "Unknown";
    let max = 0;
    for (const [lang, count] of Object.entries(langs)) {
      if (count > max) {
        max = count;
        dominant = lang;
      }
    }
    yearlyStats[year].dominantLanguage = dominant;
  }

  return yearlyStats;
}

export function calculateSkillTree(repos) {
  if (!repos || repos.length === 0) return [];

  const langCounts = {};
  let totalStars = 0;

  repos.forEach(repo => {
    totalStars += repo.stargazers_count || 0;
    if (repo.language) {
      langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
    }
  });

  const hasLang = (...langs) => langs.some(l => langCounts[l] > 0);
  const getLangCount = (...langs) => langs.reduce((sum, l) => sum + (langCounts[l] || 0), 0);

  // RPG Classes definition
  const classes = [
    {
      id: 'frontend_mage',
      name: 'Frontend Mage',
      description: 'Master of the visible realm. Weaves CSS and JS into stunning illusions.',
      icon: 'wand',
      color: '#ec4899', // Pink
      reqLangs: ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Vue', 'Svelte'],
      reqCount: 3,
      isUnlocked: false,
      progress: 0,
      repos: []
    },
    {
      id: 'backend_paladin',
      name: 'Backend Paladin',
      description: 'Defender of the server. Wields heavy logic and database armor.',
      icon: 'shield',
      color: '#3b82f6', // Blue
      reqLangs: ['Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Python', 'C++'],
      reqCount: 3,
      isUnlocked: false,
      progress: 0,
      repos: []
    },
    {
      id: 'data_alchemist',
      name: 'Data Alchemist',
      description: 'Transmutes raw data into golden insights.',
      icon: 'potion',
      color: '#10b981', // Green
      reqLangs: ['Python', 'Jupyter Notebook', 'R', 'Julia', 'Scala'],
      reqCount: 2,
      isUnlocked: false,
      progress: 0,
      repos: []
    },
    {
      id: 'devops_ranger',
      name: 'DevOps Ranger',
      description: 'Scouts the deployment pipelines and automates the wilderness.',
      icon: 'bow',
      color: '#f59e0b', // Amber
      reqLangs: ['Shell', 'Dockerfile', 'HCL', 'Makefile', 'PowerShell'],
      reqCount: 2,
      isUnlocked: false,
      progress: 0,
      repos: []
    },
    {
      id: 'archmage',
      name: 'Grand Archmage',
      description: 'A legendary coder whose repositories shine brighter than stars.',
      icon: 'crown',
      color: '#8b5cf6', // Purple
      reqLangs: [], // Based on stars instead
      reqCount: 100, // Requires 100 total stars
      isUnlocked: totalStars >= 100,
      progress: Math.min(100, (totalStars / 100) * 100),
      repos: []
    }
  ];

  // Calculate unlocks based on repo languages
  classes.forEach(cls => {
    if (cls.id === 'archmage') return; // Handled separately
    
    const count = getLangCount(...cls.reqLangs);
    cls.progress = Math.min(100, (count / cls.reqCount) * 100);
    cls.isUnlocked = count >= cls.reqCount;
    
    // Find top contributing repos for this class
    if (count > 0) {
      cls.repos = repos
        .filter(r => cls.reqLangs.includes(r.language))
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 3)
        .map(r => r.name);
    }
  });

  return classes;
}

export function calculateCommitStreak(events, repos) {
  // Build a set of unique dates with commit/push activity
  const activeDays = new Set();

  // From events (PushEvent)
  if (events && events.length > 0) {
    events.forEach(event => {
      if (event.type === 'PushEvent' && event.created_at) {
        const date = event.created_at.split('T')[0]; // 'YYYY-MM-DD'
        activeDays.add(date);
      }
    });
  }

  // Fallback: also add repo creation/update dates from repos
  if (repos && repos.length > 0) {
    repos.forEach(repo => {
      if (repo.updated_at) activeDays.add(repo.updated_at.split('T')[0]);
      if (repo.created_at) activeDays.add(repo.created_at.split('T')[0]);
    });
  }

  const sortedDays = [...activeDays].sort().reverse(); // newest first

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (activeDays.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      // Not active today — check yesterday before breaking
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak ever
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  [...activeDays].sort().forEach(dateStr => {
    const date = new Date(dateStr);
    if (prevDate) {
      const diff = (date - prevDate) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    prevDate = date;
  });
  longestStreak = Math.max(longestStreak, tempStreak);

  // Badges unlocked
  const badges = [];
  if (currentStreak >= 7)   badges.push({ label: '7-Day Flame',   emoji: '🔥', color: '#f97316', days: 7 });
  if (currentStreak >= 14)  badges.push({ label: '2-Week Legend', emoji: '⚡', color: '#eab308', days: 14 });
  if (currentStreak >= 30)  badges.push({ label: '30-Day Diamond',emoji: '💎', color: '#06b6d4', days: 30 });
  if (currentStreak >= 100) badges.push({ label: '100-Day Titan', emoji: '🏆', color: '#8b5cf6', days: 100 });
  if (currentStreak >= 365) badges.push({ label: '365-Day Crown', emoji: '👑', color: '#ec4899', days: 365 });

  // Last 30 days of activity, oldest → newest (for the streak heat-strip)
  const recentDays = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    recentDays.push({ date: ds, active: activeDays.has(ds) });
  }

  return {
    currentStreak,
    longestStreak,
    totalActiveDays: activeDays.size,
    badges,
    isActive: currentStreak > 0,
    recentDays,
  };
}

export function calculateDNAReport(userData, repos, events) {
  if (!repos) repos = [];
  if (!events) events = [];

  const totalRepos = repos.length;
  const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((s, r) => s + (r.forks_count || 0), 0);
  const followers = userData?.followers || 0;
  const following = userData?.following || 0;

  // Language diversity
  const langs = {};
  repos.forEach(r => { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
  const langCount = Object.keys(langs).length;
  const topLang = Object.entries(langs).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Unknown';

  // Forked vs original
  const originalRepos = repos.filter(r => !r.fork).length;
  const forkedRepos = totalRepos - originalRepos;

  // Avg stars
  const avgStars = totalRepos > 0 ? totalStars / totalRepos : 0;

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentEvents = events.filter(e => new Date(e.created_at) > thirtyDaysAgo);
  const pushEvents = events.filter(e => e.type === 'PushEvent');

  // Commit hour distribution (night owl vs early bird)
  const hourCounts = new Array(24).fill(0);
  pushEvents.forEach(e => {
    if (e.created_at) {
      const hour = new Date(e.created_at).getHours();
      hourCounts[hour]++;
    }
  });
  const nightPushes = hourCounts.slice(22).reduce((s,v) => s+v,0) + hourCounts.slice(0,5).reduce((s,v) => s+v,0);
  const dayPushes = hourCounts.slice(9,18).reduce((s,v) => s+v,0);
  const isNightOwl = nightPushes > dayPushes;

  // ── Personality Type ──
  let personalityType, personalityDesc, personalityEmoji;
  if (langCount >= 6 && totalRepos >= 20) {
    personalityType = 'The Polyglot Architect';
    personalityEmoji = '🏗️';
    personalityDesc = 'You speak every language of software. A master builder who designs systems across stacks.';
  } else if (avgStars > 50 && followers > 500) {
    personalityType = 'The Open Source Champion';
    personalityEmoji = '🏆';
    personalityDesc = 'Your code doesn\'t just run — it inspires. You build things that matter to thousands.';
  } else if (forkedRepos > originalRepos) {
    personalityType = 'The Collaborative Contributor';
    personalityEmoji = '🤝';
    personalityDesc = 'You believe in standing on the shoulders of giants. Contribution over creation.';
  } else if (isNightOwl) {
    personalityType = 'The Midnight Engineer';
    personalityEmoji = '🦇';
    personalityDesc = 'When the world sleeps, you ship. Your best work emerges under moonlight and monitor glow.';
  } else if (langCount <= 2 && totalRepos >= 10) {
    personalityType = 'The Deep Specialist';
    personalityEmoji = '🎯';
    personalityDesc = 'You\'ve chosen your battlefield and mastered it. Depth over breadth, precision over scatter.';
  } else {
    personalityType = 'The Curious Explorer';
    personalityEmoji = '🔭';
    personalityDesc = 'You\'re on a journey. Each repo is a new experiment, a new horizon to discover.';
  }

  // ── Coding Habits Scores (0–100) ──
  const habits = {
    consistency:   Math.min(100, recentEvents.length * 5),
    collaboration: Math.min(100, Math.round((followers / Math.max(1, following)) * 10)),
    openSource:    Math.min(100, Math.round((originalRepos / Math.max(1, totalRepos)) * 100)),
    diversity:     Math.min(100, langCount * 12),
    starPower:     Math.min(100, Math.round(Math.log10(Math.max(1, totalStars)) * 30)),
    productivity:  Math.min(100, Math.round(Math.log10(Math.max(1, totalRepos)) * 40)),
  };

  // ── Risk Profile (0–100, higher = riskier) ──
  const risks = {
    'Bus Factor':         forkedRepos === 0 && totalRepos > 5 ? 80 : 20,
    'Deprecation Risk':   recentEvents.length === 0 ? 90 : Math.max(5, 90 - recentEvents.length * 4),
    'Language Lock-in':   langCount <= 1 ? 85 : Math.max(5, 80 - langCount * 10),
    'Low Documentation':  avgStars < 1 ? 70 : 20,
  };

  // ── Specialty Badges ──
  const specialtyBadges = [];
  if (totalStars >= 1000)        specialtyBadges.push({ emoji: '⭐', label: 'Star Magnet', desc: `${totalStars.toLocaleString()} total stars`, color: '#f59e0b' });
  if (followers >= 1000)         specialtyBadges.push({ emoji: '👥', label: 'Influencer', desc: `${followers.toLocaleString()} followers`, color: '#6366f1' });
  if (langCount >= 7)            specialtyBadges.push({ emoji: '🌐', label: 'Polyglot', desc: `${langCount} languages mastered`, color: '#10b981' });
  if (isNightOwl)                specialtyBadges.push({ emoji: '🦉', label: 'Night Owl', desc: 'Most active after 10 PM', color: '#8b5cf6' });
  if (originalRepos >= 20)       specialtyBadges.push({ emoji: '🔨', label: 'Prolific Builder', desc: `${originalRepos} original projects`, color: '#ec4899' });
  if (recentEvents.length >= 15) specialtyBadges.push({ emoji: '🔥', label: 'On Fire', desc: 'Highly active this month', color: '#f97316' });
  if (totalForks >= 100)         specialtyBadges.push({ emoji: '🌿', label: 'Fork Magnet', desc: `${totalForks.toLocaleString()} forks`, color: '#22c55e' });

  return {
    personalityType,
    personalityEmoji,
    personalityDesc,
    habits,
    risks,
    specialtyBadges,
    isNightOwl,
    topLang,
    langCount,
    totalStars,
    totalRepos,
    followers,
  };
}
