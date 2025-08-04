'use client';

import { useParallax } from '@/hooks/useParallax';

const HeroSection = () => {
  const heroRef = useParallax(0.5);
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-content fade-in">
        <h1>Breath Quest</h1>
        <p className="tagline">Play games with your breath</p>
        <p style={{ margin: '2rem 0', fontSize: '1.1rem', color: '#ccc' }}>
          Master ancient breathing techniques to control your character. <br />
          From breath of fire attacks to Om-powered ultimates - your lungs are the controller.
        </p>
        <div className="cta-buttons">
          <a 
            href="#demo" 
            className="btn pulse"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('demo');
            }}
          >
            🎮 Play Now
          </a>
          <a 
            href="#why" 
            className="btn btn-secondary"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('why');
            }}
          >
            How It Works
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;