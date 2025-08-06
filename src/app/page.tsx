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
            Experience breath-controlled gaming with our live prototype
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            marginBottom: '2rem'
          }}>
            {/* Demo Preview */}
            <div style={{
              background: 'rgba(0, 20, 40, 0.8)',
              padding: '2rem',
              borderRadius: '16px',
              border: '2px solid rgba(0, 255, 136, 0.4)',
              maxWidth: '400px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem',
                animation: 'breathe 3s ease-in-out infinite'
              }}>
                💨
              </div>
              <h3 style={{ color: '#00ff88', marginBottom: '1rem' }}>
                Hypothesis #1 Demo
              </h3>
              <p style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Test breath detection accuracy with your microphone. 
                Two modes: gaming and calibration.
              </p>
              <a 
                href="/hypothesis-1"
                style={{
                  display: 'inline-block',
                  padding: '1rem 2rem',
                  background: 'linear-gradient(45deg, #00ff88, #4488ff)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 8px 24px rgba(0, 255, 136, 0.3)'
                }}
                className="hover:-translate-y-0.5 transition-transform duration-300"
              >
                🚀 Try Live Demo
              </a>
            </div>

            {/* Features */}
            <div style={{
              background: 'rgba(0, 20, 40, 0.8)',
              padding: '2rem',
              borderRadius: '16px',
              border: '2px solid rgba(68, 136, 255, 0.4)',
              maxWidth: '400px'
            }}>
              <h3 style={{ color: '#4488ff', marginBottom: '1rem' }}>
                What You'll Test
              </h3>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                lineHeight: '2'
              }}>
                <li>🎮 <strong>Play Game:</strong> Control character with breathing</li>
                <li>📦 <strong>Calibrate Breath:</strong> Box breathing measurement</li>
                <li>🔬 <strong>Live Analysis:</strong> Real-time audio processing</li>
                <li>💾 <strong>Data Storage:</strong> Personal breath calibration</li>
                <li>📊 <strong>Research Validation:</strong> Testing accuracy thresholds</li>
              </ul>
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '1.5rem',
            background: 'rgba(68, 136, 255, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(68, 136, 255, 0.3)'
          }}>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#ccc' }}>
              <strong>Research Goal:</strong> Validate that consumer microphones can detect breathing 
              patterns with sufficient accuracy for real-time gaming applications.
            </p>
          </div>
        </section>
        
        <StorySection />
        <NextStepsSection />
      </div>
    </>
  );
}