'use client';

import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';

const StorySection = () => {
  const sectionRef = useFadeInOnScroll();
  
  return (
    <section id="story" ref={sectionRef}>
      <h2>My Story</h2>
      
      <div className="story-box">
        <p style={{ fontSize: '1.15rem', lineHeight: '1.8' }}>
          <strong>The Vision:</strong>
        </p>
        <p style={{ marginTop: '1rem' }}>
          As we build more intelligent systems, our interfaces need to evolve beyond clicks and taps. 
          <span className="highlight">What if technology could understand us through our most fundamental biological signals?</span>
        </p>
        <p style={{ marginTop: '1rem' }}>
          Breath Quest explores <span className="highlight">biometric interfaces for the AI age</span>. 
          Breathing is universal, involuntary yet controllable, calming yet energizing. 
          It's a direct window into our physiological and emotional state.
        </p>
        <p style={{ marginTop: '1rem' }}>
          This research prototype tests whether consumer microphones can detect breathing patterns 
          with sufficient accuracy for real-time applications. We've discovered that while technically possible, 
          <span className="highlight">practical challenges around noise sensitivity</span> point toward 
          more robust sound-based interactions.
        </p>
        <p style={{ marginTop: '1rem' }}>
          The future of human-computer interaction isn't just about better screens or faster processors—
          it's about <span className="highlight">interfaces that understand human biology</span>. 
          Systems that adapt to our stress, energy levels, and emotional states naturally.
        </p>
        <p style={{ marginTop: '1.5rem', fontStyle: 'italic' }}>
          This is just the beginning. As AI becomes more sophisticated, our ways of communicating with it 
          must become more human. Let's build interfaces that don't just process commands—but understand us.
        </p>
      </div>
    </section>
  );
};

export default StorySection;