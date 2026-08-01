import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserRepositories, fetchUserEvents, generateWrapped } from '../services/github';
import TiltCard from '../components/ui/TiltCard';
import { Star, Trophy, Sparkles, Code2, ArrowLeft } from 'lucide-react';
import Paywall from '../components/auth/Paywall';
import { hasPlan } from '../utils/plan';
import { useAuth } from '../context/AuthContext';
import './Wrapped.css';

const SLIDE_DURATION = 5000; // 5 seconds per slide

const Wrapped = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const repos = await fetchUserRepositories(username);
        let events = [];
        try {
          events = await fetchUserEvents(username);
        } catch(e) {
          console.warn("Could not fetch events for Wrapped");
        }
        
        const wrappedData = generateWrapped(repos, events);
        setData(wrappedData);
      } catch (err) {
        setError("Could not load your wrapped data.");
      } finally {
        setLoading(false);
      }
    };
    if (username) loadData();
  }, [username]);

  // Handle slideshow progress
  useEffect(() => {
    if (loading || error || !data) return;
    
    let startTime = Date.now();
    let animationFrame;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const p = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(p);

      if (p < 100) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        if (currentSlide < slides.length - 1) {
          setCurrentSlide(c => c + 1);
          setProgress(0);
        } else {
          // Finished
        }
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [currentSlide, loading, error, data]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(c => c + 1);
      setProgress(0);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(c => c - 1);
      setProgress(0);
    }
  };

  if (loading) {
    return <div className="wrapped-page"><div className="animate-pulse-slow text-2xl font-bold">Generating your Wrapped...</div></div>;
  }

  if (error) {
    return (
      <div className="wrapped-page">
        <div className="text-center">
          <h2 className="text-danger mb-4 text-2xl font-bold">Oops!</h2>
          <p className="text-secondary mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
        </div>
      </div>
    );
  }

  const slides = [
    {
      eyebrow: `${data.year} in Review`,
      hero: `You shipped code.`,
      subtext: `A lot of it. Let's take a look at your year on GitHub, @${username}.`,
      icon: <Sparkles size={48} className="mb-6 text-accent" />
    },
    {
      eyebrow: "The Grind",
      hero: `${data.totalEvents.toLocaleString()}`,
      subtext: `That's how many events you triggered this year. You were most active in ${data.busiestMonth}!`,
      icon: <Trophy size={48} className="mb-6 text-warning" />
    },
    {
      eyebrow: "Your Arsenal",
      hero: `${data.topLanguages[0] || 'Code'}`,
      subtext: `Your favorite language this year. You also spent a lot of time writing ${data.topLanguages.slice(1).join(" and ")}.`,
      icon: <Code2 size={48} className="mb-6 text-color-purple" />
    },
    {
      eyebrow: "The Crown Jewel",
      hero: `${data.totalStarsEarned.toLocaleString()} Stars`,
      subtext: `Your repositories earned some serious love. ${data.crownJewel ? `Especially ${data.crownJewel.name}!` : ''}`,
      icon: <Star size={48} className="mb-6 text-yellow-500" />
    }
  ];

  const slide = slides[currentSlide];

  if (!hasPlan(user, 'pro')) {
    return (
      <div className="wrapped-page">
        <Paywall
          required="pro"
          title="Yearly Wrapped"
          message="Your Yearly Wrapped archive is a Pro feature. Unlock it with a one-time ₹1 payment."
        />
      </div>
    );
  }

  return (
    <div className="wrapped-page">
      <div className="wrapped-bg-shape shape-1" />
      <div className="wrapped-bg-shape shape-2" />

      <button 
        className="absolute top-8 left-8 z-50 text-secondary hover:text-primary transition-colors flex items-center gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={20} /> Exit Wrapped
      </button>

      <div className="wrapped-container">
        <div className="wrapped-progress-container">
          {slides.map((_, i) => (
            <div key={i} className="wrapped-progress-segment">
              <div 
                className={`wrapped-progress-fill ${i < currentSlide ? 'completed' : ''}`} 
                style={{ width: i === currentSlide ? `${progress}%` : undefined }}
              />
            </div>
          ))}
        </div>

        <div className="wrapped-nav-area">
          <div className="wrapped-nav-left" onClick={handlePrev} />
          <div className="wrapped-nav-right" onClick={handleNext} />
        </div>

        <TiltCard className="w-full h-full flex" maxTilt={5}>
          <div key={currentSlide} className="wrapped-slide">
            {slide.icon}
            <div className="wrapped-eyebrow">{slide.eyebrow}</div>
            <h1 className="wrapped-hero-text tilt-child">{slide.hero}</h1>
            <p className="wrapped-subtext tilt-child">{slide.subtext}</p>
            
            {currentSlide === 3 && data.crownJewel && (
              <div className="crown-jewel-card tilt-child">
                <h4 className="font-bold text-lg mb-1">{data.crownJewel.name}</h4>
                <p className="text-sm text-secondary mb-2">{data.crownJewel.description}</p>
                <div className="flex items-center justify-center gap-1 text-warning font-semibold">
                  <Star size={14} /> {data.crownJewel.stars}
                </div>
              </div>
            )}
          </div>
        </TiltCard>
      </div>
    </div>
  );
};

export default Wrapped;
