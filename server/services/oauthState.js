const jwt = require("jsonwebtoken");

const STATE_TTL_SECONDS = 10 * 60; // 10 minutes

// Stateless OAuth `state` (CSRF protection + flow routing).
//
// The original implementation kept states in an in-memory Map, which breaks on
// serverless platforms (Vercel) where the authorize redirect and the callback
// can land on different function instances. Signing the payload into the token
// itself makes the state portable across instances.
//
// Trade-off: tokens are not single-use. Replay within the 10-minute window
// merely re-runs the same OAuth exchange, which is scoped to the provider's
// authorize flow and the embedded payload, so the risk is minimal.
function storeState(payload) {
  return jwt.sign(
    { payload },
    process.env.JWT_SECRET || "oauth_state_secret",
    { expiresIn: STATE_TTL_SECONDS },
  );
}

function consumeState(state) {
  if (!state) return null;
  try {
    const decoded = jwt.verify(
      state,
      process.env.JWT_SECRET || "oauth_state_secret",
    );
    return decoded.payload;
  } catch {
    return null;
  }
}

module.exports = { storeState, consumeState };
