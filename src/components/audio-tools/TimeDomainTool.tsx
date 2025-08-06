'use client';

import { TimeDomainVisualizer } from './TimeDomainVisualizer';

interface TimeDomainToolProps {
  audioData: {
    timeDomain: Uint8Array;
    frequencyDomain: Uint8Array;
    sampleRate: number;
    bufferSize: number;
  };
}

export function TimeDomainTool({ audioData }: TimeDomainToolProps) {
  // Helper functions for real-time measurements
  const calculateRMS = (data: Uint8Array): number => {
    if (data.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const sample = (data[i] - 128) / 128; // Normalize to -1 to 1
      sum += sample * sample;
    }
    return Math.sqrt(sum / data.length);
  };

  const calculatePeak = (data: Uint8Array): number => {
    if (data.length === 0) return 0;
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.abs(data[i] - 128); // Distance from center
      if (sample > peak) peak = sample;
    }
    return peak;
  };

  return (
    <div style={{
      background: 'rgba(0, 255, 136, 0.05)',
      padding: '2rem',
      borderRadius: '16px',
      border: '2px solid rgba(0, 255, 136, 0.2)',
      marginBottom: '2rem'
    }}>
      <h2 style={{
        color: '#00ff88',
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        ⏱️ Time Domain Analysis
      </h2>
      
      {/* Full-width Waveform Visualization */}
      <div style={{
        marginBottom: '1rem'
      }}>
        <TimeDomainVisualizer data={audioData.timeDomain} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Left Column - Concepts & Theory */}
        <div style={{
          color: '#cccccc',
          lineHeight: '1.6'
        }}>
          <h3 style={{ color: '#00ff88', marginBottom: '1rem' }}>What is Time Domain?</h3>
          <p style={{ marginBottom: '1rem' }}>
            The <strong>time domain</strong> shows how sound amplitude changes over time. 
            Think of it as a graph where:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>X-axis</strong> = Time (left to right)</li>
            <li><strong>Y-axis</strong> = Amplitude (how loud)</li>
            <li><strong>Green line</strong> = Your audio waveform</li>
            <li><strong>Center line</strong> = Silence (128/255)</li>
          </ul>
          <p style={{ marginBottom: '1rem' }}>
            <strong>Why it matters:</strong> This is the <em>raw audio data</em> that your 
            microphone captures. Every bump above or below the center line represents 
            air pressure changes from sound.
          </p>
          
          <div style={{
            background: 'rgba(68, 136, 255, 0.1)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid rgba(68, 136, 255, 0.3)',
            marginBottom: '1rem'
          }}>
            <strong style={{ color: '#4488ff' }}>🔢 What is RMS?</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
              <strong>Root Mean Square</strong> is like finding the "average loudness" of audio. 
              It takes all the ups and downs of the waveform, squares them (removes negative values), 
              averages them, then takes the square root. This gives us a single number that represents 
              how "energetic" the sound is - perfect for detecting breath vs silence!
            </p>
          </div>
        </div>

        {/* Right Column - Interactive Experiments */}
        <div>
          {/* Real-time measurements */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Current RMS
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {audioData.timeDomain.length > 0 ? calculateRMS(audioData.timeDomain).toFixed(3) : '0.000'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                Root Mean Square = Average loudness
              </div>
            </div>
            
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Peak Amplitude
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {audioData.timeDomain.length > 0 ? calculatePeak(audioData.timeDomain).toFixed(0) : '0'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                Maximum deviation from silence
              </div>
            </div>
          </div>
          {/* Interactive Experiments */}
          <div style={{
            background: 'rgba(0, 255, 136, 0.1)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid rgba(0, 255, 136, 0.3)'
          }}>
            <strong style={{ color: '#00ff88' }}>🧪 Try These Experiments:</strong>
            <div style={{ marginTop: '0.8rem', display: 'grid', gap: '0.6rem' }}>
              <div style={{ padding: '0.6rem', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '6px' }}>
                <strong>💬 Say "Hello"</strong><br/>
                <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Watch for sharp spikes, RMS jumps to 0.050+</span>
              </div>
              <div style={{ padding: '0.6rem', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '6px' }}>
                <strong>🎵 Whistle</strong><br/>
                <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>See regular, smooth waves, steady RMS ~0.030</span>
              </div>
              <div style={{ padding: '0.6rem', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '6px' }}>
                <strong>🫁 Breathe in/out</strong><br/>
                <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Gentle, flowing curves, RMS 0.005-0.020</span>
              </div>
              <div style={{ padding: '0.6rem', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '6px' }}>
                <strong>🤫 Stay silent</strong><br/>
                <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Flat center line, RMS drops to ~0.001</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}