const mongoose = require("mongoose");

// Per-user daily AI chat usage, used to cap LLM consumption so a single user
// can't run up unbounded spend. Keyed by (userId, period) where period is a
// local date string "YYYY-MM-DD". `tokens` is an estimate (chars / 4).
const aiUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    period: { type: String, required: true }, // "2026-08-02"
    messages: { type: Number, default: 0 }, // chat requests served
    tokens: { type: Number, default: 0 }, // estimated tokens consumed
  },
  { timestamps: true },
);

aiUsageSchema.index({ userId: 1, period: 1 }, { unique: true });

module.exports = mongoose.model("AiUsage", aiUsageSchema);
