import { authFetch } from "./http";

const API_BASE_URL = "/monitoring";

// authFetch (./http) attaches the Content-Type and Authorization headers and
// transparently refreshes an expired access token, so no token logic lives here.
const getAuthHeaders = () => ({});

async function handleApiResponse(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = body?.message || fallbackMessage || "Request failed";
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return body;
}

// GET /api/monitoring — the signed-in user's watchlist (with latest stats &
// delta badges, lazily refreshed server-side when stale).
export async function fetchWatchlist() {
  const response = await authFetch(API_BASE_URL, { headers: getAuthHeaders() });
  return handleApiResponse(response, "Failed to load your watchlist");
}

// POST /api/monitoring — add a GitHub username to watch.
export async function addToWatchlist(username) {
  const response = await authFetch(API_BASE_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ username }),
  });
  return handleApiResponse(response, "Failed to add profile");
}

// DELETE /api/monitoring/:username — stop watching a profile.
export async function removeFromWatchlist(username) {
  const response = await authFetch(
    `${API_BASE_URL}/${encodeURIComponent(username)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );
  return handleApiResponse(response, "Failed to remove profile");
}

// POST /api/monitoring/:username/refresh — force a fresh snapshot now.
export async function refreshWatchlist(username) {
  const response = await authFetch(
    `${API_BASE_URL}/${encodeURIComponent(username)}/refresh`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );
  return handleApiResponse(response, "Failed to refresh profile");
}

// GET /api/monitoring/:username — full detail: snapshot history for trend
// charts, change log, and the recent activity feed.
export async function fetchWatchlistDetail(username) {
  const response = await authFetch(
    `${API_BASE_URL}/${encodeURIComponent(username)}`,
    { headers: getAuthHeaders() },
  );
  return handleApiResponse(response, "Failed to load profile details");
}

// POST /api/monitoring/:username/read — clear the unread-changes flag.
export async function markWatchlistRead(username) {
  const response = await authFetch(
    `${API_BASE_URL}/${encodeURIComponent(username)}/read`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );
  return handleApiResponse(response, "Failed to mark profile as read");
}
