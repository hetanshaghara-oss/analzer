import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2,
  Camera,
  Globe,
  MapPin,
  Lock,
  Trash2,
  LogOut,
  Key,
} from "lucide-react";
import { GithubIcon as Github } from "../../components/ui/icons";
import "../auth/Auth.css";

const Profile = () => {
  const {
    user,
    authFetch,
    githubConnect,
    githubDisconnect,
    refreshUser,
    updateUser,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    githubUsername: user?.githubUsername || "",
    website: user?.website || "",
    location: user?.location || "",
    avatar: user?.avatar || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [tokenSaving, setTokenSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const fileRef = useRef();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await authFetch("/users/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          bio: form.bio,
          githubUsername: form.githubUsername,
          website: form.website,
          location: form.location,
          avatar: form.avatar,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateUser(data.user);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      return setError("New passwords do not match.");
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await authFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This cannot be undone.",
      )
    )
      return;
    await authFetch("/users/account", { method: "DELETE" });
    await logout();
    navigate("/");
  };

  const handleGithubConnect = async () => {
    setLoading(true);
    setError("");
    try {
      const { authorizationUrl } = await githubConnect();
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubDisconnect = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await githubDisconnect();
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubTokenSave = async (e) => {
    e.preventDefault();
    if (!githubToken.trim()) return;
    setTokenSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await authFetch("/users/github-token", {
        method: "PUT",
        body: JSON.stringify({ token: githubToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateUser(data.user);
      setGithubToken("");
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setTokenSaving(false);
    }
  };

  const handleGithubTokenClear = async () => {
    setTokenSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await authFetch("/users/github-token", {
        method: "PUT",
        body: JSON.stringify({ token: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateUser(data.user);
      setGithubToken("");
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setTokenSaving(false);
    }
  };

  useEffect(() => {
    const githubStatus = searchParams.get("github");
    const githubMessage = searchParams.get("message");
    if (githubStatus) {
      if (githubStatus === "success") {
        setMessage(githubMessage || "GitHub account connected successfully.");
        refreshUser();
      } else {
        setError(githubMessage || "GitHub connection failed.");
      }
      searchParams.delete("github");
      searchParams.delete("message");
      setSearchParams(searchParams, { replace: true });
    }
  }, [refreshUser, searchParams, setSearchParams]);

  const TABS = [
    { key: "profile", label: "Profile" },
    { key: "security", label: "Security" },
    { key: "danger", label: "Danger Zone" },
  ];

  return (
    <div
      style={{ maxWidth: "800px", margin: "0 auto", padding: "2.5rem 1.5rem" }}
    >
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.875rem",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            marginBottom: "0.25rem",
          }}
        >
          Account Settings
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Manage your profile and security preferences
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          background: "var(--background-alt)",
          padding: "0.25rem",
          borderRadius: "0.75rem",
          marginBottom: "2rem",
          width: "fit-content",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setMessage("");
              setError("");
            }}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
              transition: "all 0.15s ease",
              background: tab === t.key ? "var(--card)" : "transparent",
              color:
                tab === t.key
                  ? t.key === "danger"
                    ? "#ef4444"
                    : "var(--text-primary)"
                  : "var(--text-secondary)",
              boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <div
          className="auth-alert auth-alert-success"
          style={{ marginBottom: "1.5rem" }}
        >
          ✅ {message}
        </div>
      )}
      {error && (
        <div
          className="auth-alert auth-alert-error"
          style={{ marginBottom: "1.5rem" }}
        >
          ⚠️ {error}
        </div>
      )}

      {tab === "profile" && (
        <>
        <form onSubmit={handleProfileSave}>
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "1rem",
              padding: "2rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                marginBottom: "2rem",
                paddingBottom: "2rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: "5rem",
                    height: "5rem",
                    borderRadius: "50%",
                    background: "var(--background-alt)",
                    border: "3px solid var(--border)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                  }}
                >
                  {form.avatar ? (
                    <img
                      src={form.avatar}
                      alt="avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    user?.name?.[0]?.toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: "1.75rem",
                    height: "1.75rem",
                    borderRadius: "50%",
                    background: "var(--accent-primary)",
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Camera size={14} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  {user?.name}
                </div>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                  }}
                >
                  {user?.email}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    marginTop: "0.375rem",
                    padding: "0.2rem 0.6rem",
                    background:
                      "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
                    color: "var(--accent-primary)",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "capitalize",
                  }}
                >
                  {user?.role}
                </div>
                <div
                  style={{
                    marginTop: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    color: user?.githubConnected
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  <Github size={14} />
                  {user?.githubConnected
                    ? "GitHub connected"
                    : "GitHub not connected"}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.25rem",
              }}
            >
              <div className="auth-field" style={{ gridColumn: "1/-1" }}>
                <label className="auth-label">Full Name</label>
                <input
                  className="auth-input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="auth-field" style={{ gridColumn: "1/-1" }}>
                <label className="auth-label">Bio</label>
                <textarea
                  className="auth-input"
                  placeholder="Tell us about yourself..."
                  value={form.bio}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bio: e.target.value }))
                  }
                  style={{
                    minHeight: "4rem",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                  maxLength={250}
                />
              </div>
              <div className="auth-field">
                <label
                  className="auth-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Github size={12} /> GitHub Username
                </label>
                <input
                  className="auth-input"
                  placeholder="your-github-username"
                  value={form.githubUsername}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, githubUsername: e.target.value }))
                  }
                />
              </div>
              <div className="auth-field">
                <label
                  className="auth-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Globe size={12} /> Website
                </label>
                <input
                  className="auth-input"
                  placeholder="https://yourwebsite.com"
                  value={form.website}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, website: e.target.value }))
                  }
                />
              </div>
              <div className="auth-field" style={{ gridColumn: "1/-1" }}>
                <label
                  className="auth-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <MapPin size={12} /> Location
                </label>
                <input
                  className="auth-input"
                  placeholder="City, Country"
                  value={form.location}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, location: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <button
              type="submit"
              className="auth-btn auth-btn-primary"
              disabled={loading}
              style={{ width: "auto", padding: "0.75rem 2rem" }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
            <button
              type="button"
              onClick={handleGithubConnect}
              className="auth-btn auth-btn-secondary"
              disabled={loading}
              style={{
                width: "auto",
                padding: "0.75rem 2rem",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              Connect GitHub
            </button>
            {user?.githubConnected && (
              <button
                type="button"
                onClick={handleGithubDisconnect}
                className="auth-btn auth-btn-danger"
                disabled={loading}
                style={{
                  width: "auto",
                  padding: "0.75rem 2rem",
                  background: "#ef4444",
                  border: "none",
                  color: "white",
                }}
              >
                Disconnect GitHub
              </button>
            )}
          </div>
        </form>

        {/* GitHub API Token */}
        <form
          onSubmit={handleGithubTokenSave}
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "1rem",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
            }}
          >
            <Key size={18} style={{ color: "var(--accent)" }} />
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              GitHub API Token
            </h3>
          </div>
          <p
            style={{
              fontSize: "0.88rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: "1.25rem",
            }}
          >
            Paste a{" "}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--accent)" }}
            >
              GitHub Personal Access Token
            </a>{" "}
            to raise the API rate limit from{" "}
            <b style={{ color: "var(--text-primary)" }}>60</b> to{" "}
            <b style={{ color: "var(--text-primary)" }}>5,000</b> requests/hour
            for your account. Stored securely server-side, never exposed to the
            browser.
          </p>
          <div className="auth-field" style={{ gridColumn: "1/-1" }}>
            <input
              className="auth-input"
              type="password"
              placeholder={
                user?.githubTokenSet
                  ? "Token already set — paste a new one to replace it"
                  : "ghp_xxxxxxxxxxxx…"
              }
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            <button
              type="submit"
              className="auth-btn auth-btn-primary"
              disabled={tokenSaving || !githubToken.trim()}
              style={{ width: "auto", padding: "0.75rem 1.75rem" }}
            >
              {tokenSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving…
                </>
              ) : (
                "Save Token"
              )}
            </button>
            {user?.githubTokenSet && (
              <button
                type="button"
                onClick={handleGithubTokenClear}
                className="auth-btn auth-btn-secondary"
                disabled={tokenSaving}
                style={{
                  width: "auto",
                  padding: "0.75rem 1.75rem",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                Remove Token
              </button>
            )}
          </div>
        </form>
        </>
      )}

      {tab === "security" && (
        <form onSubmit={handlePasswordChange}>
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "1rem",
              padding: "2rem",
            }}
          >
            <h2
              style={{
                fontWeight: 700,
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Lock size={18} style={{ color: "var(--accent-primary)" }} />{" "}
              Change Password
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                maxWidth: "400px",
              }}
            >
              {[
                {
                  label: "Current Password",
                  key: "currentPassword",
                  placeholder: "Your current password",
                },
                {
                  label: "New Password",
                  key: "newPassword",
                  placeholder: "At least 8 characters",
                },
                {
                  label: "Confirm New Password",
                  key: "confirmPassword",
                  placeholder: "Repeat new password",
                },
              ].map((f) => (
                <div key={f.key} className="auth-field">
                  <label className="auth-label">{f.label}</label>
                  <input
                    type="password"
                    className="auth-input"
                    placeholder={f.placeholder}
                    value={passwordForm[f.key]}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        [f.key]: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              ))}
              <button
                type="submit"
                className="auth-btn auth-btn-primary"
                disabled={loading}
                style={{ width: "auto", padding: "0.75rem 2rem" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {tab === "danger" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "1rem",
              padding: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <LogOut size={16} /> Sign Out All Devices
              </div>
              <p
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                This will revoke all active sessions across all devices.
              </p>
            </div>
            <button
              onClick={logout}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                background: "none",
                border: "1px solid var(--border)",
                fontWeight: 600,
                cursor: "pointer",
                color: "var(--text-primary)",
              }}
            >
              Sign Out
            </button>
          </div>

          <div
            style={{
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "1rem",
              padding: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: "#ef4444",
                  marginBottom: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Trash2 size={16} /> Delete Account
              </div>
              <p
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                Permanently delete your account and all associated data.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                background: "#ef4444",
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
                color: "white",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
