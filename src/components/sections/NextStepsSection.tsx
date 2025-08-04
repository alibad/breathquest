'use client';

import { nextStepsCards } from '@/lib/constants';
import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';

const NextStepsSection = () => {
  const sectionRef = useFadeInOnScroll();
  
  return (
    <section ref={sectionRef}>
      <h2>What's Next?</h2>
      
      <div className="why-grid">
        {nextStepsCards.map((card, index) => (
          <div key={index} className="why-card">
            <h3>{card.emoji} {card.title}</h3>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NextStepsSection;