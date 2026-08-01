const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const { requireAuth, requireRole } = require("../middleware/auth");

// Live plan prices (₹). Keep in sync with the frontend pricing.
const PLAN_PRICES = { Pro: 1, Enterprise: 2 };

// Public — record a payment after the buyer pays via UPI.
// No login required so buyers can pay without an account.
router.post("/", async (req, res, next) => {
  try {
    const { plan, amount, email, utr } = req.body || {};

    if (!PLAN_PRICES[plan]) {
      return res.status(400).json({ message: "Invalid plan." });
    }
    if (Number(amount) !== PLAN_PRICES[plan]) {
      return res
        .status(400)
        .json({ message: "Amount does not match the selected plan." });
    }
    const cleanUtr = String(utr || "").replace(/\D/g, "");
    if (cleanUtr.length < 6) {
      return res
        .status(400)
        .json({ message: "A valid UTR / reference number is required." });
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    const payment = await Payment.create({
      plan,
      amount: Number(amount),
      email: (email || "").toLowerCase(),
      utr: cleanUtr,
      status: "pending",
    });

    res.status(201).json({
      id: payment._id,
      plan: payment.plan,
      amount: payment.amount,
      utr: payment.utr,
      status: payment.status,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "This UTR has already been submitted." });
    }
    next(err);
  }
});

// Admin — list all payments (newest first) for verification
router.get(
  "/",
  requireAuth,
  requireRole("super_admin", "company_admin"),
  async (req, res, next) => {
    try {
      const payments = await Payment.find()
        .sort({ createdAt: -1 })
        .limit(500);
      res.json(payments);
    } catch (err) {
      next(err);
    }
  },
);

// Admin — confirm or reject a submitted payment
router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin", "company_admin"),
  async (req, res, next) => {
    try {
      const { status } = req.body || {};
      if (!["confirmed", "rejected"].includes(status)) {
        return res
          .status(400)
          .json({ message: "Status must be confirmed or rejected." });
      }
      const payment = await Payment.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true },
      );
      if (!payment) return res.status(404).json({ message: "Payment not found." });
      res.json(payment);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
