import React, { useState } from 'react';
import { Check, Zap, Crown, Rocket } from 'lucide-react';
import Reveal from './Reveal';
import CheckoutModal from './CheckoutModal';
import './PricingSection.css';

const PLANS = [
  {
    icon: Rocket,
    name: 'Free',
    price: 0,
    period: 'forever',
    tagline: 'For curious developers',
    cta: 'Start for free',
    features: [
      'Unlimited public profile analysis',
      'Full analytics & language breakdown',
      'Developer DNA report',
      'Skill tree & world rankings',
      'Commit streak tracking',
    ],
  },
  {
    icon: Zap,
    name: 'Pro',
    price: 1,
    period: 'one-time',
    tagline: 'For serious open-source builders',
    cta: 'Get Pro',
    popular: true,
    features: [
      'Everything in Free',
      'Private repo & org analysis',
      'Priority analysis queue',
      'Yearly Wrapped archive',
      'Export & shareable reports',
      'Ad-free insights',
    ],
  },
  {
    icon: Crown,
    name: 'Enterprise',
    price: 2,
    period: 'one-time',
    tagline: 'For teams & recruiters',
    cta: 'Get Enterprise',
    features: [
      'Everything in Pro',
      'Batch LinkedIn CSV import',
      'Team workspaces & shared pools',
      'SSO & audit logs',
      'Dedicated support & SLAs',
    ],
  },
];

const PricingSection = () => {
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  const handleCta = (plan) => {
    if (plan.price === 0) {
      // Free plan → jump straight to the hero analyzer
      document.getElementById('analyze')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setCheckoutPlan(plan);
  };

  return (
    <section id="pricing" className="pricing-section">
      <div className="container">
        <Reveal>
          <div className="pricing-header">
            <p className="pricing-eyebrow">Pricing</p>
            <h2 className="pricing-title">
              Start free. <span className="text-gradient">Scale when you're ready.</span>
            </h2>
            <p className="pricing-subtitle">
              No hidden fees, no surprises. Analyze any public profile forever at zero cost.
              Paid plans are a one-time ₹1 / ₹2 via UPI.
            </p>
          </div>
        </Reveal>

        <div className="pricing-grid">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const price = plan.price;
            return (
              <Reveal key={plan.name} delay={i * 110} className={plan.popular ? 'pricing-col-popular' : ''}>
                <div className={`pricing-card ${plan.popular ? 'pricing-card--popular' : ''}`}>
                  {plan.popular && <span className="pricing-popular-badge">Most popular</span>}

                  <div className="pricing-card-head">
                    <div className="pricing-icon">
                      <Icon size={22} />
                    </div>
                    <h3 className="pricing-name">{plan.name}</h3>
                    <p className="pricing-tagline">{plan.tagline}</p>
                  </div>

                  <div className="pricing-price-row">
                    <span className="pricing-price">
                      {price === 0 ? '₹0' : `₹${price}`}
                    </span>
                    <span className="pricing-period">
                      {price === 0 ? 'forever' : 'one-time'}
                    </span>
                  </div>

                  <ul className="pricing-features">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <Check size={15} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={`pricing-cta ${plan.popular ? 'pricing-cta--popular' : ''}`}
                    onClick={() => handleCta(plan)}
                  >
                    {plan.cta}
                  </button>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Real UPI checkout */}
      {checkoutPlan && (
        <CheckoutModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />
      )}
    </section>
  );
};

export default PricingSection;
