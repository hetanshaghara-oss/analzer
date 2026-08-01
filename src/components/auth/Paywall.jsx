import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';
import { hasPlan } from '../../utils/plan';
import { useAuth } from '../../context/AuthContext';
import './Paywall.css';

const REQUIRED_INFO = {
  pro: { label: 'Pro', price: 1 },
  enterprise: { label: 'Enterprise', price: 2 },
};

const Paywall = ({ required = 'pro', title, message, children }) => {
  const { user } = useAuth();
  if (hasPlan(user, required)) return children;

  const info = REQUIRED_INFO[required] || REQUIRED_INFO.pro;
  return (
    <div className="paywall">
      <div className="paywall-icon"><Lock size={26} /></div>
      <h3 className="paywall-title">{title || `${info.label} feature`}</h3>
      <p className="paywall-desc">
        {message ||
          `This is a ${info.label} feature. Unlock it with a one-time ₹${info.price} payment.`}
      </p>
      <Link to="/" className="paywall-btn">
        <Zap size={15} /> Upgrade to {info.label} · ₹{info.price}
      </Link>
      <p className="paywall-hint">One-time UPI payment · no subscription</p>
    </div>
  );
};

export default Paywall;
