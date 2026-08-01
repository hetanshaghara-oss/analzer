const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const loginHistorySchema = new mongoose.Schema({
  device: { type: String, default: "Unknown" },
  browser: { type: String, default: "Unknown" },
  ip: { type: String, default: "0.0.0.0" },
  location: { type: String, default: "Unknown" },
  loginAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["developer", "recruiter", "company_admin", "super_admin"],
      default: "developer",
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: { type: String, maxlength: 250, default: "" },
    githubUsername: { type: String, default: "" },
    // GitHub OAuth access token — set when the user connects (or signs in with)
    // GitHub. Hidden from JSON.
    githubAccessToken: { type: String, select: false, default: "" },
    // Manual Personal Access Token pasted in Account Settings. Kept separate
    // from the OAuth token so they never overwrite each other. Hidden from JSON.
    githubPat: { type: String, select: false, default: "" },
    // OAuth identities — set when the user signs in (or links) via a provider.
    githubId: { type: String, default: "" },
    googleId: { type: String, default: "" },
    gitlabId: { type: String, default: "" },
    // Provider access tokens (github/google/gitlab) for API calls. Hidden from JSON.
    providerTokens: { type: Object, select: false, default: {} },
    website: { type: String, default: "" },
    location: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    verificationTokenExpiry: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpiry: { type: Date, select: false },
    refreshTokens: { type: [String], select: false, default: [] },
    loginHistory: { type: [loginHistorySchema], default: [] },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Return safe user object (no sensitive fields)
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.verificationToken;
  delete obj.verificationTokenExpiry;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  obj.githubConnected = Boolean(obj.githubAccessToken);
  obj.githubTokenSet = Boolean(obj.githubPat);
  obj.googleConnected = Boolean(obj.googleId);
  obj.gitlabConnected = Boolean(obj.gitlabId);
  delete obj.githubAccessToken;
  delete obj.githubPat;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
