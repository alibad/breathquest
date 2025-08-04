'use client';

import { timelineItems } from '@/lib/constants';
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

  return (
    <section id="timeline" ref={sectionRef}>
      <h2>Live Build Timeline</h2>
      <p style={{ color: '#ccc', marginBottom: '3rem' }}>
        Tracking progress in real-time. This page updates as I build.
      </p>
      
      <div className="timeline">
        {timelineItems.map((item, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-content">
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