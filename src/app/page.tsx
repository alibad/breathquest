import HeroSection from '@/components/sections/HeroSection';
import WhySection from '@/components/sections/WhySection';
import TimelineSection from '@/components/sections/TimelineSection';
import TechSection from '@/components/sections/TechSection';
import HypothesisSection from '@/components/sections/HypothesisSection';
import StorySection from '@/components/sections/StorySection';
import NextStepsSection from '@/components/sections/NextStepsSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      
      <div className="container">
        <WhySection />
        <TimelineSection />
        <TechSection />
        <HypothesisSection />
        
        {/* === DEMO ENTRY POINT === */}
        <section id="demo" className="demo-section">
          <h2>🎮 Interactive Demo</h2>
          <p style={{ fontSize: '1rem', marginBottom: '2rem' }}>
            Try two live prototypes exploring sound‑based game control.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            alignItems: 'stretch',
            marginBottom: '2rem'
          }}>
            {/* Hypothesis 1 Card */}
            <a href="/hypothesis-1" style={{
              textDecoration: 'none', color: 'inherit'
            }}>
              <div style={{
                background: 'rgba(0, 20, 40, 0.8)',
                padding: '2rem',
                borderRadius: '16px',
                border: '2px solid rgba(0, 255, 136, 0.4)'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💨</div>
                <h3 style={{ color: '#00ff88', marginBottom: '0.5rem' }}>Hypothesis #1: Breath Detection</h3>
                <div style={{ fontSize: '0.95rem', color: '#ccc' }}>
                  Technical success with calibration; impractical in noise.
                </div>
                <div style={{ marginTop: '1rem', display: 'inline-block', padding: '0.6rem 1rem', background: 'linear-gradient(45deg, #00ff88, #4488ff)', color: '#000', borderRadius: '10px', fontWeight: 800 }}>Open Demo</div>
              </div>
            </a>

            {/* Hypothesis 2 Card */}
            <a href="/hypothesis-2" style={{
              textDecoration: 'none', color: 'inherit'
            }}>
              <div style={{
                background: 'rgba(0, 20, 40, 0.8)',
                padding: '2rem',
                borderRadius: '16px',
                border: '2px solid rgba(68, 136, 255, 0.4)'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👏</div>
                <h3 style={{ color: '#4488ff', marginBottom: '0.5rem' }}>Hypothesis #2: Clap Patterns</h3>
                <div style={{ fontSize: '0.95rem', color: '#ccc' }}>
                  Percussive clap events + timing patterns for robust gameplay.
                </div>
                <div style={{ marginTop: '1rem', display: 'inline-block', padding: '0.6rem 1rem', background: 'linear-gradient(45deg, #4488ff, #00ff88)', color: '#000', borderRadius: '10px', fontWeight: 800 }}>Open Demo</div>
              </div>
            </a>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '1.5rem',
            background: 'rgba(68, 136, 255, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(68, 136, 255, 0.3)'
          }}>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#ccc' }}>
              <strong>Research Goal:</strong> Identify sound interactions that are reliable, low‑latency, and fun for real‑time games.
            </p>
          </div>
        </section>
        
        <StorySection />
        <NextStepsSection />
      </div>
    </>
  );
}