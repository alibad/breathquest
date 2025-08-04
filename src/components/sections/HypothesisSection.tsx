'use client';

import { hypotheses } from '@/lib/constants';
import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';

const HypothesisSection = () => {
  const sectionRef = useFadeInOnScroll();
  
  return (
    <section id="hypothesis" ref={sectionRef}>
      <h2>Core Hypotheses</h2>
      
      <ul className="hypothesis-list">
        {hypotheses.map((hypothesis, index) => (
          <li key={index}>
            <strong>Hypothesis {index + 1}:</strong> {hypothesis}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default HypothesisSection;