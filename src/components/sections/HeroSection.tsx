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
        <p className="tagline">Building novel interfaces for future intelligence</p>
        <p style={{ margin: '2rem 0', fontSize: '1.1rem', color: '#ccc' }}>
          What if we could control AI with our breath? <br />
          A real-time experiment in embodied interaction.
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
            Try Live Demo
          </a>
          <a 
            href="#story" 
            className="btn btn-secondary"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('story');
            }}
          >
            Read My Story
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;