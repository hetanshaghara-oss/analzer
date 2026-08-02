const mongoose = require("mongoose");

// One snapshot of a watched GitHub profile's key stats, captured at `at`.
// Kept small on purpose so a watchlist's full history stays lightweight.
const snapshotSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    name: { type: String, default: "" },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    htmlUrl: { type: String, default: "" },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    publicRepos: { type: Number, default: 0 },
    gists: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 },
    totalForks: { type: Number, default: 0 },
    totalSize: { type: Number, default: 0 },
    topLanguages: { type: [String], default: [] },
  },
  { _id: false },
);

// A single monitoring report: what changed between two consecutive snapshots.
const changeLogSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    changes: { type: [String], default: [] }, // human-readable lines
    deltas: { type: Object, default: {} }, // numeric deltas keyed by metric
  },
  { _id: false },
);

// Tracks a GitHub username the user wants to keep an eye on. Snapshots are
// captured periodically (lazy refresh-on-access) and on manual refresh; each
// capture is diffed against the previous one to build the change log.
const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    githubUsername: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, default: "" },
    avatar: { type: String, default: "" },
    htmlUrl: { type: String, default: "" },
    snapshots: { type: [snapshotSchema], default: [] },
    changeLog: { type: [changeLogSchema], default: [] },
    // Most recent repo names, kept only for new-repo detection on the next
    // check. Stored separately (not in every snapshot) to keep history small.
    lastRepoNames: { type: [String], default: [] },
    lastCheckedAt: { type: Date, default: null },
    unreadChanges: { type: Boolean, default: false },
  },
  { timestamps: true },
);

watchlistSchema.index({ userId: 1, githubUsername: 1 }, { unique: true });

// Bound the history so a long-lived watchlist can't grow without limit.
// Keep the last 120 snapshots and the last 200 change entries.
watchlistSchema.methods.trimHistory = function () {
  if (this.snapshots.length > 120) {
    this.snapshots = this.snapshots.slice(-120);
  }
  if (this.changeLog.length > 200) {
    this.changeLog = this.changeLog.slice(-200);
  }
};

module.exports = mongoose.model("Watchlist", watchlistSchema);
