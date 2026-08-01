// Vercel serverless entry point. vercel.json rewrites every /api/* request
// here, and Vercel exposes the exported Express app.
//
// The app itself lives in server/index.js (CommonJS, via server/package.json).
// On Vercel it is imported rather than run directly, so require.main check
// there prevents it from calling app.listen() itself.
//
// connectDB() is fire-and-forget: mongoose buffers queued commands until the
// connection opens, so a cold start still serves the first request correctly,
// and warm invocations reuse the cached connection.
const { app, connectDB } = require("../server/index");

connectDB();

module.exports = app;
