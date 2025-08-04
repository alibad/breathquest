'use client';

import { techCards } from '@/lib/constants';
import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';

const TechSection = () => {
  const sectionRef = useFadeInOnScroll();
  
  return (
    <section id="tech" ref={sectionRef}>
      <h2>Technical Architecture</h2>
      
      <div className="tech-grid">
        {techCards.map((card, index) => (
          <div key={index} className="tech-card">
            <h3>{card.emoji} {card.title}</h3>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TechSection;