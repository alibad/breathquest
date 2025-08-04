'use client';

import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';

const StorySection = () => {
  const sectionRef = useFadeInOnScroll();
  
  return (
    <section id="story" ref={sectionRef}>
      <h2>My Story</h2>
      
      <div className="story-box">
        <p style={{ fontSize: '1.15rem', lineHeight: '1.8' }}>
          <strong>To the OpenAI team:</strong>
        </p>
        <p style={{ marginTop: '1rem' }}>
          I've spent <span className="highlight">18 months obsessively prototyping AI-first products</span>. 
          Built 5 products across mobile, voice, and web. Got 2.6K users on a Chrome extension. 
          Created a spiritual board game in 14+ languages.
        </p>
        <p style={{ marginTop: '1rem' }}>
          But when I saw your role for <span className="highlight">"Interfaces for Future Intelligence,"</span> 
          I didn't just apply. I started building immediately.
        </p>
        <p style={{ marginTop: '1rem' }}>
          Breath Quest isn't just a demo—it's a thesis. If we're building AGI that understands humans deeply, 
          shouldn't our interfaces reflect human biology? Breathing is universal, involuntary yet controllable, 
          calming yet energizing. <span className="highlight">It's the perfect bridge between mind and machine.</span>
        </p>
        <p style={{ marginTop: '1rem' }}>
          This prototype took 48 hours. Imagine what we could build together with OpenAI's resources. 
          Imagine AI that adapts to your stress through your breath. Imagine interfaces that make you healthier 
          just by using them.
        </p>
        <p style={{ marginTop: '1.5rem', fontStyle: 'italic' }}>
          I'm not looking for a job. I'm looking for a lab where wild ideas become tomorrow's reality. 
          Let's build interfaces that don't just serve intelligence—but embody it.
        </p>
      </div>
    </section>
  );
};

export default StorySection;