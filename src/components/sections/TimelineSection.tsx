'use client';

import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';

const TimelineSection = () => {
  const sectionRef = useFadeInOnScroll();
  
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'done':
        return <span className="status done">✅ DONE</span>;
      case 'in-progress':
        return <span className="status in-progress">🔄 IN PROGRESS</span>;
      case 'planned':
        return <span className="status planned">📅 PLANNED</span>;
      default:
        return null;
    }
  };

  // Visual timeline with 3 focused milestones (dated)
  const items = [
    {
      title: 'Breath Detection (Completed)',
      description: 'Technical success with calibration; impractical in noisy environments. Documentation and demo preserved as reference.',
      status: 'done',
      date: 'Aug 6, 2025'
    },
    {
      title: 'Clap Pattern Control (In Progress)',
      description: 'Detect single/double/triple claps with low latency. Build pattern matcher and mini‑game actions.',
      status: 'in-progress',
      date: 'Aug 7, 2025'
    },
    {
      title: 'Sound‑Based Navigation (Planned)',
      description: 'Design robust, intentional sounds (whistles, taps, voice cues) for menu and gameplay navigation; measure false‑positive rates.',
      status: 'planned',
      date: 'Aug 8–10, 2025'
    }
  ] as const;

  return (
    <section id="timeline" ref={sectionRef}>
      <h2>Game Development Progress</h2>
      <p style={{ color: '#ccc', marginBottom: '3rem' }}>
        From breath to claps to broader sound navigation — the path we’re taking, with dates.
      </p>

      <div className="timeline">
        {items.map((item, index) => (
          <div key={index} className="timeline-item">
            <div className={`timeline-content`}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {getStatusDisplay(item.status)}
            </div>
            <div className="timeline-date">{item.date}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TimelineSection;