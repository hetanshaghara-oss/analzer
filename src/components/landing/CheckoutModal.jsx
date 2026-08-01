import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Check,
  ShieldCheck,
  QrCode,
  Copy,
  Smartphone,
  Zap,
  Crown,
  Rocket,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { buildUpiUrl, PAYMENTS } from '../../config/payments';
import { useAuth } from '../../context/AuthContext';
import './CheckoutModal.css';

const PLAN_ICONS = { Pro: Zap, Enterprise: Crown, Free: Rocket };

const CheckoutModal = ({ plan, onClose }) => {
  const { user } = useAuth();
  // Prefill the signed-in account email so a confirmed payment can be matched
  // to the buyer's account and unlock the plan.
  const [email, setEmail] = useState(user?.email || '');
  const [utr, setUtr] = useState('');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | submitted
  const [serverError, setServerError] = useState('');
  const [copied, setCopied] = useState(false);
  const [focused, setFocused] = useState('');

  const Icon = PLAN_ICONS[plan.name] || Rocket;
  const amount = plan.price;

  // Real UPI deep-link for the exact ₹ amount of this plan
  const upiUrl = useMemo(
    () => buildUpiUrl({ amount, note: `${PAYMENTS.note} — ${plan.name} plan` }),
    [amount, plan.name],
  );

  // Lock body scroll + close on Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Prefill the email once the session finishes loading (auth is async).
  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user, email]);

  const handlePayWithApp = () => {
    // Opens the installed UPI app (GPay, PhonePe, Paytm, BHIM…) with the amount pre-filled
    window.location.href = upiUrl;
  };

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENTS.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable — user can copy manually from the visible text
    }
  };

  const validate = () => {
    const e = {};
    // The email is how a confirmed payment is matched to an account — required
    // so the upgrade can actually be granted.
    if (!email) {
      e.email = 'Enter the email of the account you want to unlock';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Enter a valid email address';
    }
    if (utr.replace(/\D/g, '').length < 6) {
      e.utr = 'Enter the UTR / reference number shown in your UPI app after paying';
    }
    return e;
  };

  const handleConfirm = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus('submitting');
    setServerError('');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.name,
          amount,
          email: email.trim(),
          utr: utr.replace(/\D/g, ''),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not record your payment. Please try again.');
      setStatus('submitted');
    } catch (err) {
      setServerError(err.message);
      setStatus('idle');
    }
  };

  const inputClass = (key) =>
    `checkout-input ${errors[key] ? 'checkout-input--error' : ''} ${focused === key ? 'checkout-input--focused' : ''}`;

  return (
    <div className="checkout-overlay" onClick={onClose} role="presentation">
      <div
        className="checkout-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Checkout for ${plan.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="checkout-header">
          <div className="checkout-header-title">
            <span className="checkout-header-icon"><Icon size={18} /></span>
            <div>
              <h3 className="checkout-title">Checkout</h3>
              <p className="checkout-plan-name">{plan.name} plan</p>
            </div>
          </div>
          <button className="checkout-close" onClick={onClose} aria-label="Close checkout">
            <X size={20} />
          </button>
        </div>

        <div className="checkout-body">
          {/* Order summary */}
          <aside className="checkout-summary">
            <div className="checkout-summary-head">
              <span className="checkout-summary-label">Order summary</span>
              <span className="checkout-billing-badge">{plan.period || 'one-time'}</span>
            </div>

            <div className="checkout-line">
              <span className="checkout-line-name">
                {plan.name}
                <em>{plan.tagline}</em>
              </span>
              <span className="checkout-line-price">₹{amount}</span>
            </div>

            <div className="checkout-line">
              <span className="checkout-line-name">Billing</span>
              <span className="checkout-line-value">One-time payment</span>
            </div>

            <div className="checkout-total">
              <span>Total due today</span>
              <span className="checkout-total-price">₹{amount}</span>
            </div>

            <div className="checkout-guarantee">
              <ShieldCheck size={16} />
              <span>
                Pay by <b>UPI</b> — scan the QR or tap "Pay with UPI app". Your money goes
                straight to the account behind <b>{PAYMENTS.upiId}</b>.
              </span>
            </div>

            <div className="checkout-demo-note">
              <CheckCircle2 size={14} />
              <span>After paying, enter the UTR number from your UPI app to confirm. Access is granted once the payment is verified.</span>
            </div>
          </aside>

          {/* Payment area */}
          <div className="checkout-payment">
            {status === 'submitted' ? (
              <div className="checkout-success">
                <div className="checkout-success-check">
                  <Check size={38} strokeWidth={3} />
                </div>
                <h4 className="checkout-success-title">Payment submitted</h4>
                <p className="checkout-success-desc">
                  We recorded your payment for the <b>{plan.name}</b> plan (₹{amount}).
                  Your access will be activated once your UTR (<b>{utr}</b>) is confirmed.
                </p>
                <button className="checkout-success-btn" onClick={onClose}>
                  Done <Check size={16} />
                </button>
              </div>
            ) : (
              <>
                {/* QR code */}
                <div className="checkout-qr-block">
                  <div className="checkout-qr-head">
                    <QrCode size={16} />
                    <span className="checkout-qr-title">Scan &amp; pay ₹{amount}</span>
                  </div>
                  <div className="checkout-qr-code">
                    <QRCodeSVG
                      value={upiUrl}
                      size={180}
                      bgColor="#ffffff"
                      fgColor="#0f172a"
                      level="M"
                      marginSize={2}
                    />
                  </div>
                  <p className="checkout-qr-hint">
                    Scan with any UPI app (GPay, PhonePe, Paytm, BHIM). The amount is locked to ₹{amount}.
                  </p>
                  <button type="button" className="checkout-upi-app-btn" onClick={handlePayWithApp}>
                    <Smartphone size={16} />
                    Pay with UPI app
                    <ExternalLink size={13} />
                  </button>
                  <button type="button" className="checkout-upi-copy" onClick={handleCopyUpi}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'UPI ID copied' : `UPI ID: ${PAYMENTS.upiId}`}
                  </button>
                </div>

                <div className="checkout-divider"><span>Already paid?</span></div>

                {/* Confirm payment */}
                <form onSubmit={handleConfirm} noValidate>
                  <div className="checkout-field">
                    <label htmlFor="co-email">Email (the account you&apos;ll unlock)</label>
                    <input
                      id="co-email"
                      className={inputClass('email')}
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((er) => ({ ...er, email: undefined }));
                      }}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused('')}
                      disabled={status === 'submitting'}
                    />
                    {errors.email && <span className="checkout-error">{errors.email}</span>}
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="co-utr">UPI transaction reference (UTR)</label>
                    <input
                      id="co-utr"
                      className={inputClass('utr')}
                      inputMode="numeric"
                      placeholder="e.g. 403791229018"
                      autoComplete="off"
                      value={utr}
                      onChange={(e) => {
                        setUtr(e.target.value.replace(/[^\d]/g, '').slice(0, 20));
                        if (errors.utr) setErrors((er) => ({ ...er, utr: undefined }));
                      }}
                      onFocus={() => setFocused('utr')}
                      onBlur={() => setFocused('')}
                      disabled={status === 'submitting'}
                    />
                    {errors.utr && <span className="checkout-error">{errors.utr}</span>}
                  </div>

                  {serverError && <p className="checkout-error" role="alert">{serverError}</p>}

                  <button
                    type="submit"
                    className={`checkout-pay ${status === 'submitting' ? 'checkout-pay--processing' : ''}`}
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? (
                      <>
                        <span className="checkout-spinner" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        I&apos;ve paid — confirm ₹{amount}
                      </>
                    )}
                  </button>

                  <p className="checkout-secure">
                    <ShieldCheck size={12} />
                    Real UPI payment. Your UTR is stored on our server for verification.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
