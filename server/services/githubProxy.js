const API_BASE_URL = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

const cache = new Map();
const DEFAULT_TTL = 4 * 60 * 1000; // 4 minutes

function buildUrl(path, query = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null)
      url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function getHeaders(accessToken) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "GitInsightAI-Backend",
  };

  const cleanAccessToken = accessToken ? String(accessToken).trim().split(/\s+/)[0] : null;
  const cleanGlobalToken = GITHUB_TOKEN ? String(GITHUB_TOKEN).trim().split(/\s+/)[0] : null;

  if (cleanAccessToken) {
    headers.Authorization = `Bearer ${cleanAccessToken}`;
  } else if (cleanGlobalToken) {
    headers.Authorization = `Bearer ${cleanGlobalToken}`;
  }

  return headers;
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttl = DEFAULT_TTL) {
  cache.set(key, {
    expiresAt: Date.now() + ttl,
    data,
  });
}

async function fetchJson(url, accessToken) {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available in this Node environment.");
  }

  const response = await fetch(url, { headers: getHeaders(accessToken) });
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      payload?.message ||
      `GitHub API request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return payload;
}

async function fetchAllPages(url, maxPages = 5, accessToken) {
  let page = 1;
  const results = [];

  while (page <= maxPages) {
    const pageUrl = `${url}&page=${page}`;
    const data = await fetchJson(pageUrl, accessToken);
    if (!Array.isArray(data) || data.length === 0) break;
    results.push(...data);
    if (data.length < 100) break;
    page += 1;
  }

  return results;
}

async function proxyToGitHub(
  path,
  query = {},
  cacheKey,
  usePagination = false,
  accessToken,
) {
  const key = cacheKey || `${path}?${new URLSearchParams(query).toString()}`;
  const useCache = !accessToken;
  if (useCache) {
    const cached = getCached(key);
    if (cached) return cached;
  }

  const url = buildUrl(path, query);
  const payload = usePagination
    ? await fetchAllPages(url, 5, accessToken)
    : await fetchJson(url, accessToken);

  if (useCache) setCache(key, payload);
  return payload;
}

module.exports = {
  async fetchSearchUsers(query, accessToken) {
    // GitHub /search/users — query object carries q, sort, order, per_page
    return proxyToGitHub("/search/users", query, null, false, accessToken);
  },

  async fetchUserProfile(username, accessToken) {
    return proxyToGitHub(
      `/users/${encodeURIComponent(username)}`,
      {},
      `users:${username}`,
      false,
      accessToken,
    );
  },

  async fetchUserRepositories(username, accessToken) {
    return proxyToGitHub(
      `/users/${encodeURIComponent(username)}/repos`,
      { per_page: 100, sort: "updated" },
      `repos:${username}`,
      true,
      accessToken,
    );
  },

  async fetchUserEvents(username, accessToken) {
    return proxyToGitHub(
      `/users/${encodeURIComponent(username)}/events/public`,
      { per_page: 30 },
      `events:${username}`,
      false,
      accessToken,
    );
  },

  async fetchRepoDetail(owner, repo, accessToken) {
    return proxyToGitHub(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      {},
      `repo:${owner}/${repo}`,
      false,
      accessToken,
    );
  },

  async fetchRepoFileTree(owner, repo, accessToken) {
    return proxyToGitHub(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents`,
      {},
      `contents:${owner}/${repo}`,
      false,
      accessToken,
    );
  },

  async fetchRepoReadme(owner, repo, accessToken) {
    return proxyToGitHub(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
      {},
      `readme:${owner}/${repo}`,
      false,
      accessToken,
    );
  },

  async fetchRepoLanguages(owner, repo, accessToken) {
    return proxyToGitHub(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`,
      {},
      `languages:${owner}/${repo}`,
      false,
      accessToken,
    );
  },

  async fetchRepoContributors(owner, repo, accessToken) {
    return proxyToGitHub(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors`,
      { per_page: 100 },
      `contributors:${owner}/${repo}`,
      true,
      accessToken,
    );
  },

  async fetchLeaderboard(category, accessToken) {
    const sort = category === "repositories" ? "repositories" : "followers";
    const q = sort === "followers" ? "followers:>1000" : "repos:>100";
    
    // Using proxyToGitHub but with manual 10 minute cache handling
    const cacheKey = `leaderboard:${sort}_detailed`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Fetch top 20 users
    const url = buildUrl(`/search/users`, { q, sort, order: "desc", per_page: 20 });
    const payload = await fetchJson(url, accessToken);

    if (payload && payload.items) {
      // Fetch detailed profiles for these top 20 users to get actual follower/repo counts
      const detailedItems = await Promise.all(
        payload.items.map(async (user) => {
          try {
            const userUrl = buildUrl(`/users/${user.login}`);
            const detailedUser = await fetchJson(userUrl, accessToken);
            return {
              ...user,
              followers: detailedUser.followers,
              public_repos: detailedUser.public_repos,
              name: detailedUser.name
            };
          } catch (e) {
            return user; // fallback to basic info if rate limited
          }
        })
      );
      
      payload.items = detailedItems;
      setCache(cacheKey, payload, 10 * 60 * 1000); // 10 minutes cache
    }
    return payload;
  },

  async fetchUserFollowers(username, accessToken) {
    return proxyToGitHub(
      `/users/${encodeURIComponent(username)}/followers`,
      { per_page: 100 },
      `followers:${username}`,
      true, // use pagination to fetch all followers
      accessToken,
    );
  },
};
