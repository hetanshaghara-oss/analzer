// ─────────────────────────────────────────────────────────────
//  REAL PAYMENT CONFIG — UPI
//  👉 Paste YOUR UPI details here. That's the only file to edit.
//  The QR code shown to buyers is generated live from `upiId`
//  + the exact ₹1 / ₹2 amount, so it always matches the order.
// ─────────────────────────────────────────────────────────────

export const PAYMENTS = {
  // Your UPI ID (VPA), e.g. 'yourname@oksbi', 'you@gmail.com', 'you@upi'
  upiId: "8154833784-lfe4@axl",

  // Your name as it should appear to the buyer in the UPI app
  payeeName: "Hetansh Aghara",

  // Short note shown on the payment screen & in the UPI app
  note: "GitInsight AI subscription",

  currency: "INR",
};

// Builds a standard `upi://pay` deep-link string that every UPI app
// (GPay, PhonePe, Paytm, BHIM, …) understands.
export const buildUpiUrl = ({ amount, note = PAYMENTS.note, ref = "" }) => {
  const params = new URLSearchParams();
  params.set("pa", PAYMENTS.upiId); // payee VPA
  params.set("pn", PAYMENTS.payeeName); // payee name
  if (amount) params.set("am", String(amount)); // amount (₹)
  params.set("cu", PAYMENTS.currency);
  if (note) params.set("tn", note); // transaction note
  if (ref) params.set("tr", ref); // transaction reference id
  return `upi://pay?${params.toString()}`;
};
