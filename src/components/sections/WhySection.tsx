'use client';

import { whyCards } from '@/lib/constants';
import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';

const WhySection = () => {
  const sectionRef = useFadeInOnScroll();
  
  return (
    <section id="why" ref={sectionRef}>
      <h2>The Science of Breath Control</h2>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#ccc' }}>
        Your microphone becomes a breath sensor, detecting not just inhale/exhale, but the depth, speed, 
        and technique of your breathing. Each breathing pattern unlocks different abilities in the game.
      </p>
      
      <div className="why-grid">
        {whyCards.map((card, index) => (
          <div key={index} className="why-card">
            <h3>{card.emoji} {card.title}</h3>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhySection;