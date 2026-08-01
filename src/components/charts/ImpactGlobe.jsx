import React, { useEffect, useRef, useState } from 'react';
import createGlobe from 'cobe';
import { fetchFollowerLocations } from '../../services/github';
import './ImpactGlobe.css';

const ImpactGlobe = ({ username }) => {
  const canvasRef = useRef();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadLocations = async () => {
      setLoading(true);
      const locs = await fetchFollowerLocations(username);
      if (active) {
        setLocations(locs);
        setLoading(false);
      }
    };
    loadLocations();
    return () => { active = false; };
  }, [username]);

  useEffect(() => {
    if (!canvasRef.current || loading) return;

    let phi = 0;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600,
      height: 600,
      phi: 0,
      theta: 0,
      dark: 0, // 0 for light theme style, 1 for dark
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [1, 1, 1],
      markerColor: [0.35, 0.43, 0.96], // accent-primary color in RGB
      glowColor: [1, 1, 1],
      markers: locations,
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = phi;
        phi += 0.005;
      },
    });

    return () => {
      globe.destroy();
    };
  }, [locations, loading]);

  return (
    <div className="impact-globe-wrapper">
      <div className="globe-header">
        <h3 className="globe-title">Global Impact</h3>
        <p className="globe-subtitle">Where in the world your followers are located</p>
      </div>
      
      <div className="globe-container">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-secondary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mb-4"></div>
            <span>Mapping the globe...</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              width: 600,
              height: 600,
              maxWidth: "100%",
              aspectRatio: "1/1",
              margin: "auto",
              display: "block",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ImpactGlobe;
