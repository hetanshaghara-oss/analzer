// Shared authenticated fetch helpers for the browser.
//
// Centralizes where tokens are read/written (localStorage) and how an expired
// access token is transparently refreshed with the long-lived refresh token.
// Both the React auth context and the plain service modules go through these,
// so a mid-session token expiry never causes a stray 401 — the request is
// retried with a fresh token automatically.

const API_BASE = "/api";
const ACCESS_KEY = "gitinsight_token";
const REFRESH_KEY = "gitinsight_refresh";

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

/**
 * Exchange the stored refresh token for a fresh access token (and a rotated
 * refresh token). Returns true on success (localStorage updated), false when
 * there is no refresh token or the exchange fails.
 */
export async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const { accessToken, refreshToken: newRefresh } = await res.json();
    saveTokens(accessToken, newRefresh);
    return true;
  } catch {
    return false;
  }
}

/**
 * fetch() wrapper that attaches the access token and transparently retries the
 * request once when the token has expired. If the session is genuinely invalid
 * (refresh fails), the stored tokens are cleared so callers can treat a
 * returned 401 as a hard "not signed in".
 */
export async function authFetch(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(API_BASE + url, { ...options, headers });

  if (res.status === 401) {
    let isExpired = false;
    try {
      const data = await res.clone().json();
      isExpired = data?.code === "TOKEN_EXPIRED";
    } catch {
      // non-JSON body — treat as a generic 401
    }

    if (isExpired && (await tryRefresh())) {
      headers.Authorization = `Bearer ${getAccessToken()}`;
      res = await fetch(API_BASE + url, { ...options, headers });
    } else {
      clearTokens();
    }
  }

  return res;
}
