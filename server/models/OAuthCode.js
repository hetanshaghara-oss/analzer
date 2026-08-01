const mongoose = require("mongoose");

// One-time exchange codes for the OAuth sign-in flow.
//
// The pre-serverless implementation kept these in an in-memory Map, which
// breaks on Vercel where the redirect (server-side, storing the code) and the
// exchange (client-side POST) can hit different function instances. Storing
// them in MongoDB makes the flow reliable across instances; a TTL index
// garbage-collects expired codes.
const oauthCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    at: { type: String, required: true }, // access token
    rt: { type: String, required: true }, // refresh token
    userId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Auto-remove expired one-time codes.
oauthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OAuthCode", oauthCodeSchema);
