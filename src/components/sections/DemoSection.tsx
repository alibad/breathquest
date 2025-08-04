'use client';

import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';
import { useEffect } from 'react';

const DemoSection = () => {
  const sectionRef = useFadeInOnScroll();

  useEffect(() => {
    // Define the breath demo functions in the global scope
    if (typeof window !== 'undefined') {
      let audioContext: AudioContext;
      let analyser: AnalyserNode;
      let microphone: MediaStreamAudioSourceNode;
      let isListening = false;

      const startBreathDemo = async () => {
        const btn = document.getElementById('start-demo-btn') as HTMLButtonElement;
        const stateDisplay = document.getElementById('breath-state') as HTMLElement;
        
        if (isListening) {
          stopDemo();
          return;
        }
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyser = audioContext.createAnalyser();
          microphone = audioContext.createMediaStreamSource(stream);
          
          analyser.fftSize = 256;
          microphone.connect(analyser);
          
          isListening = true;
          btn.textContent = '🛑 Stop Demo';
          btn.classList.add('btn-secondary');
          
          detectBreath();
        } catch {
          stateDisplay.textContent = 'Microphone access denied';
          stateDisplay.style.color = '#ff6b6b';
        }
      };
      
      const detectBreath = () => {
        if (!isListening) return;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average amplitude
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        const visualizer = document.getElementById('breath-visualizer') as HTMLElement;
        const stateDisplay = document.getElementById('breath-state') as HTMLElement;
        const innerCircle = visualizer.querySelector('div') as HTMLElement;
        
        // Determine breath state based on amplitude and patterns
        let breathState = 'Normal Breathing';
        let scale = 1;
        let color = 'var(--primary)';
        
        if (average > 80) {
          breathState = '🔥 Breath of Fire';
          scale = 1.8;
          color = '#ff4444';
        } else if (average > 50) {
          breathState = '🔥 Sharp Exhale';
          scale = 1.5;
          color = '#ff8844';
        } else if (average > 30) {
          breathState = '💨 Deep Inhale';
          scale = 1.3;
          color = '#4488ff';
        } else if (average > 15) {
          breathState = '🌬️ Normal Breathing';
          scale = 1.1;
          color = 'var(--primary)';
        } else {
          breathState = '⏸️ Breath Hold';
          scale = 0.8;
          color = 'var(--secondary)';
        }
        
        // Update visualizer
        visualizer.style.transform = `scale(${scale})`;
        innerCircle.style.background = color;
        stateDisplay.textContent = breathState;
        
        requestAnimationFrame(detectBreath);
      };
      
      const stopDemo = () => {
        isListening = false;
        if (audioContext) {
          audioContext.close();
        }
        
        const btn = document.getElementById('start-demo-btn') as HTMLButtonElement;
        const stateDisplay = document.getElementById('breath-state') as HTMLElement;
        
        btn.textContent = '🎤 Start Breath Demo';
        btn.classList.remove('btn-secondary');
        stateDisplay.textContent = 'Ready to breathe...';
      };
      
      (window as any).startBreathDemo = startBreathDemo;
    }
  }, []);
  
  return (
    <section id="demo" className="demo-section" ref={sectionRef}>
      <h2>Testing Hypothesis #1</h2>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        Can consumer microphones reliably detect different breathing patterns? 
        This live demo tests breath detection accuracy using just your laptop's built-in mic.
      </p>
      
      <div className="demo-preview">
        <div id="breath-demo" style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{
            fontSize: '1.2rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            🎤 <strong>Click "Start Demo" to enable microphone</strong>
          </div>
          
          <div id="breath-visualizer" style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 255, 136, 0.3), transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            marginBottom: '2rem'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'var(--primary)',
              opacity: '0.8'
            }}></div>
          </div>

          <div id="breath-state" style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--primary)',
            marginBottom: '1rem'
          }}>
            Ready to breathe...
          </div>

          <div style={{
            fontSize: '0.9rem',
            opacity: '0.7',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <strong>Breathing Techniques:</strong><br/>
            🌬️ Normal = Walk | 💨 Deep Inhale = Charge | 🔥 Sharp Exhale = Attack<br/>
            ⏸️ Hold = Shield | 🔄 Breath of Fire = Special | 🕉️ Om Sound = Ultimate
          </div>
        </div>
      </div>
      
      <button 
        id="start-demo-btn"
        className="btn pulse" 
        style={{ fontSize: '1.2rem', padding: '1.2rem 3rem' }}
        onClick={() => {
          if (typeof window !== 'undefined' && (window as any).startBreathDemo) {
            (window as any).startBreathDemo();
          }
        }}
      >
        🎤 Start Breath Demo
      </button>
    </section>
  );
};

export default DemoSection;