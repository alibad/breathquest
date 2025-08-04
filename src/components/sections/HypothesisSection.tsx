import { hypotheses } from '@/lib/constants';

const HypothesisSection = () => {
  return (
    <section id="hypothesis">
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