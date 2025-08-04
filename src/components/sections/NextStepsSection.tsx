import { nextStepsCards } from '@/lib/constants';

const NextStepsSection = () => {
  return (
    <section>
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