import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const AuthContext = createContext(null);

const API = "/api";

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem("gitinsight_token") || null,
  );
  const [loading, setLoading] = useState(true);

  const saveTokens = (accessToken, refreshToken) => {
    setToken(accessToken);
    localStorage.setItem("gitinsight_token", accessToken);
    if (refreshToken) localStorage.setItem("gitinsight_refresh", refreshToken);
  };

  const clearTokens = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("gitinsight_token");
    localStorage.removeItem("gitinsight_refresh");
  };

  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(API + url, { ...options, headers });

      if (res.status === 401) {
        const data = await res.json();
        if (data.code === "TOKEN_EXPIRED") {
          const refreshed = await tryRefresh();
          if (refreshed) {
            headers["Authorization"] =
              `Bearer ${localStorage.getItem("gitinsight_token")}`;
            return fetch(API + url, { ...options, headers });
          }
        }
        clearTokens();
      }
      return res;
    },
    [token],
  );

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const { user: updatedUser } = await res.json();
      setUser(updatedUser);
      return updatedUser;
    } catch {
      clearTokens();
      return null;
    }
  }, [token]);

  const tryRefresh = async () => {
    const refreshToken = localStorage.getItem("gitinsight_refresh");
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API}/auth/refresh`, {
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
  };

  // Load user on mount. The access token lives only ~15 minutes, so if it has
  // expired by the time the user reopens the app, `/auth/me` returns 401 and we
  // must try the long-lived refresh token before logging the user out.
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const { user } = await res.json();
          setUser(user);
          return;
        }

        // Access token expired or invalid — try the refresh token once.
        if (await tryRefresh()) {
          const retry = await fetch(`${API}/auth/me`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("gitinsight_token")}`,
            },
          });
          if (retry.ok) {
            const { user } = await retry.json();
            setUser(user);
            return;
          }
        }
        clearTokens();
      } catch {
        // Transient network/server error — keep the stored session instead of
        // silently logging the user out; it will be retried on next mount.
      } finally {
        setLoading(false);
      }
    };
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeJson = async (res) => {
    try {
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return {
        message: `Backend server error (${res.status}). Please try again.`,
      };
    }
  };

  const register = async ({ name, email, password, role }) => {
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Registration failed");
      saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      return data.user;
    } catch (err) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to backend server. Ensure backend is running.",
        );
      }
      throw err;
    }
  };

  const login = async ({ email, password }) => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Login failed");
      saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      return data.user;
    } catch (err) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to backend server. Ensure backend is running.",
        );
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("gitinsight_refresh");
      await authFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch {}
    clearTokens();
  };

  const loginWithProvider = (provider, from) => {
    // Remember where to return so the OAuth callback can drop the user back.
    sessionStorage.setItem(
      "oauth_from",
      from || `${window.location.pathname}${window.location.search}`,
    );
    window.location.href = `${API}/auth/oauth/${provider}/start`;
  };

  const exchangeOAuthCode = async (code) => {
    try {
      const res = await fetch(`${API}/auth/oauth/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "OAuth sign-in failed.");
      saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      return data.user;
    } catch (err) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to backend server. Ensure backend is running.",
        );
      }
      throw err;
    }
  };

  const githubConnect = async () => {
    const res = await authFetch("/auth/github/start");
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Unable to start GitHub OAuth.");
    }
    return res.json();
  };

  const githubDisconnect = async () => {
    const res = await authFetch("/auth/github/disconnect", { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Unable to disconnect GitHub account.");
    }
    const data = await res.json();
    await refreshUser();
    return data;
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authFetch,
        register,
        login,
        logout,
        loginWithProvider,
        exchangeOAuthCode,
        githubConnect,
        githubDisconnect,
        refreshUser,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
