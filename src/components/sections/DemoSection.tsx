'use client';

import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';

const DemoSection = () => {
  const sectionRef = useFadeInOnScroll();
  
  return (
    <section id="demo" className="demo-section" ref={sectionRef}>
      <h2>Try Breath Gaming</h2>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        Jump, dodge, and power-up using only your breath. Works with any microphone - 
        even your laptop's built-in mic. No downloads required.
      </p>
      
      <div className="demo-preview">
        <div className="demo-placeholder">
          <p>🎮 Breath-controlled obstacle course coming soon</p>
          <p style={{ fontSize: '0.9rem', marginTop: '1rem', opacity: '0.7' }}>
            Inhale → Jump | Exhale → Duck | Hold → Shield
          </p>
        </div>
      </div>
      
      <a 
        href="/play" 
        className="btn pulse" 
        style={{ fontSize: '1.2rem', padding: '1.2rem 3rem' }}
      >
        🚀 Start Playing
      </a>
    </section>
  );
};

export default DemoSection;