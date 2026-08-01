const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    plan: { type: String, required: true, enum: ["Pro", "Enterprise"] },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR" },
    email: { type: String, default: "", trim: true, lowercase: true },
    // UPI transaction reference (UTR) number from the buyer's UPI app
    utr: { type: String, required: true, trim: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected"],
      default: "pending",
    },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

// Access level granted by confirmed payments for a given email.
// Returns 'enterprise' | 'pro' | 'free' (enterprise >= pro).
paymentSchema.statics.accessForEmail = async function (email) {
  if (!email) return "free";
  const confirmed = await this.find({
    email: String(email).toLowerCase(),
    status: "confirmed",
  }).select("plan");
  const levels = { enterprise: 2, pro: 1 };
  let best = "free";
  confirmed.forEach((p) => {
    const key = String(p.plan).toLowerCase();
    if (levels[key] > levels[best]) best = key;
  });
  return best;
};

module.exports = mongoose.model("Payment", paymentSchema);
