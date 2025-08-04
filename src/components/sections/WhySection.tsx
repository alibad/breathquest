'use client';

import { whyCards } from '@/lib/constants';
import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';

const WhySection = () => {
  const sectionRef = useFadeInOnScroll();
  
  return (
    <section id="why" ref={sectionRef}>
      <h2>Why This Exists</h2>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#ccc' }}>
        I saw the OpenAI role for "Interfaces for Future Intelligence" and immediately started building. 
        Not another ChatGPT wrapper. Not another voice assistant. Something genuinely new.
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