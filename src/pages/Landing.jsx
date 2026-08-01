import React, { useEffect } from 'react';
import LandingNav from '../components/landing/LandingNav';
import Hero from '../components/landing/Hero';
import FloatingOrbs from '../components/ui/FloatingOrbs';
import LogoMarquee from '../components/landing/LogoMarquee';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorks from '../components/landing/HowItWorks';
import DeveloperDiscoverySection from '../components/landing/DeveloperDiscoverySection';
import StatsSection from '../components/landing/StatsSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import FAQsSection from '../components/landing/FAQsSection';
import PricingSection from '../components/landing/PricingSection';
import CTASection from '../components/landing/CTASection';
import LandingFooter from '../components/landing/LandingFooter';
import './Landing.css';

const Landing = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page">
      <LandingNav />
      <main>
        <Hero />
        <LogoMarquee />
        <FeaturesSection />
        <HowItWorks />
        <DeveloperDiscoverySection />
        <StatsSection />
        <TestimonialsSection />
        <FAQsSection />
        <PricingSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
