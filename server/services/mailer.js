const nodemailer = require("nodemailer");

// Optional SMTP mailer. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// (and optionally SMTP_SECURE, EMAIL_FROM) to actually send email — e.g. a
// Gmail/Outlook app password, or a provider like Resend / SendGrid / Postmark.
// When SMTP is not configured the mailer no-ops with a warning so the API keeps
// working; password-reset links simply aren't delivered until it is set up.
const isConfigured = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function fromAddress() {
  return (
    process.env.EMAIL_FROM ||
    `"GitInsight AI" <${process.env.SMTP_USER || "noreply@localhost"}>`
  );
}

/**
 * Send an email. Never throws on missing SMTP config — logs a warning instead.
 * @returns {Promise<boolean>} true when a message was actually sent.
 */
async function sendMail({ to, subject, text = "", html = "" }) {
  if (!isConfigured()) {
    console.warn(
      `📧 Email to ${to} skipped — SMTP not configured (set SMTP_HOST / SMTP_USER / SMTP_PASS).`,
    );
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: fromAddress(),
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ""),
      html,
    });
    return true;
  } catch (err) {
    console.error("Email send failed:", err.message);
    return false;
  }
}

module.exports = { sendMail, isConfigured };
