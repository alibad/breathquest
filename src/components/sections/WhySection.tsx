'use client';

import { whyCards } from '@/lib/constants';
import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';

const WhySection = () => {
  const sectionRef = useFadeInOnScroll();
  
  return (
    <section id="why" ref={sectionRef}>
      <h2>How Breath Gaming Works</h2>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#ccc' }}>
        Your microphone detects your breathing patterns in real-time. Inhale to jump, exhale to duck, 
        hold your breath to activate shields. It's surprisingly intuitive and incredibly engaging.
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