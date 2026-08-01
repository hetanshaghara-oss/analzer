const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

module.exports = { requireAuth, requireRole, optionalAuth };
