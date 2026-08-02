const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Payment = require("../models/Payment");

/**
 * Middleware: Verify JWT access token
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select(
      "+githubAccessToken +githubPat",
    );
    if (!user) return res.status(401).json({ message: "User not found." });
    if (user.isSuspended)
      return res
        .status(403)
        .json({ message: "Account is suspended. Please contact support." });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
};

/**
 * Middleware: Role-based access control
 * @param {...string} roles - Allowed roles
 */
const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated." });
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: `Access denied. Required roles: ${roles.join(", ")}`,
        });
    }
    next();
  };

/**
 * Middleware: Require a Pro (or Enterprise) plan.
 * Must run AFTER requireAuth (uses req.user). Admins always pass; everyone
 * else must have at least one confirmed payment for their account email.
 */
const requirePro = async (req, res, next) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated." });
    if (
      req.user.role === "super_admin" ||
      req.user.role === "company_admin"
    ) {
      return next();
    }
    const plan = await Payment.accessForEmail(req.user.email);
    if (plan === "free") {
      return res.status(403).json({
        message: "This is a Pro feature. Upgrade to unlock it.",
        code: "PRO_REQUIRED",
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select(
      "+githubAccessToken +githubPat",
    );
    if (user && !user.isSuspended) {
      req.user = user;
    }
  } catch (err) {
    // Ignore optional auth failures, continue without user
  }
  next();
};

module.exports = { requireAuth, requireRole, requirePro, optionalAuth };
