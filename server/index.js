// Force Google DNS to bypass ISP/hotspot DNS that blocks MongoDB Atlas SRV records.
// Best-effort: serverless runtimes may not allow changing DNS servers, and doing so on Vercel breaks DNS lookups.
if (!process.env.VERCEL) {
  const dns = require("dns");
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  } catch {
    /* ignored */
  }
}

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const githubRoutes = require("./routes/github");
const oauthRoutes = require("./routes/oauth");
const paymentRoutes = require("./routes/payments");

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gitinsight";

// Vercel sets this; when present the platform serves the built frontend and we
// skip serving dist/ ourselves.
const IS_VERCEL = !!process.env.VERCEL;

// Security middleware
app.use(helmet());

// CORS — allow same-origin / no-origin, localhost (dev), and any production
// origin listed in CORS_ORIGINS (comma-separated, e.g. https://app.example.com).
// When the server itself serves the frontend (same origin), CORS isn't involved
// at all, so CORS_ORIGINS is only needed for a split frontend/backend deploy.
const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      corsOrigins.includes(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
});

// Same-origin requests (e.g. the Vercel domain hosting both the frontend and
// the API) need no CORS handling at all — a cross-origin-style check would
// otherwise reject them. Only genuine cross-origin callers hit the allow-list.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host === req.get("host")) return next();
    } catch {
      /* malformed origin — fall through to the CORS middleware */
    }
  }
  return corsMiddleware(req, res, next);
});
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth/oauth", oauthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/payments", paymentRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    dbState:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Serve the built frontend (dist/) so a single process hosts the whole app —
// but only when running standalone (local dev / Render). On Vercel the static
// files are served by the platform, so this is skipped there.
if (!IS_VERCEL) {
  const distPath = path.join(__dirname, "..", "dist");
  if (fs.existsSync(path.join(distPath, "index.html"))) {
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api")) {
        return res.sendFile(path.join(distPath, "index.html"));
      }
      next();
    });
    console.log(`📦 Serving frontend build from ${distPath}`);
  }
}

// 404
app.use((req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.message || err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Internal server error." });
});

// Idempotent MongoDB connection — reused across warm serverless invocations.
async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB connected successfully to", MONGODB_URI);
  } catch (err) {
    console.warn("⚠️ MongoDB connection warning:", err.message);
  }
}

// Standalone run (node server/index.js): start the server. When this file is
// imported by the Vercel entrypoint (api/index.cjs), Vercel drives the app.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Express Backend Server running at http://localhost:${PORT}`);
    connectDB();
  });
}

module.exports = { app, connectDB };
