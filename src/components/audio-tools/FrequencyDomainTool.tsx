'use client';

import { useState } from 'react';
import { FrequencyDomainVisualizer } from './FrequencyDomainVisualizer';

interface FrequencyDomainToolProps {
  audioData: {
    timeDomain: Uint8Array;
    frequencyDomain: Uint8Array;
    sampleRate: number;
    bufferSize: number;
  };
}

export function FrequencyDomainTool({ audioData }: FrequencyDomainToolProps) {
  const [showSpectralCentroid, setShowSpectralCentroid] = useState(true);
  // Calculate spectral centroid - the "center of mass" of the spectrum
  const calculateSpectralCentroid = (frequencyData: Uint8Array, sampleRate: number): number => {
    if (frequencyData.length === 0) return 0;
    
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = frequencyData[i];
      const frequency = (i * sampleRate) / (frequencyData.length * 2); // Convert bin to frequency
      
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  };

  // Calculate dominant frequency - the bin with highest magnitude
  const calculateDominantFrequency = (frequencyData: Uint8Array, sampleRate: number): number => {
    if (frequencyData.length === 0) return 0;
    
    let maxMagnitude = 0;
    let dominantBin = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxMagnitude) {
        maxMagnitude = frequencyData[i];
        dominantBin = i;
      }
    }
    
    return (dominantBin * sampleRate) / (frequencyData.length * 2);
  };

  const spectralCentroid = calculateSpectralCentroid(audioData.frequencyDomain, audioData.sampleRate);
  const dominantFreq = calculateDominantFrequency(audioData.frequencyDomain, audioData.sampleRate);

  return (
    <div style={{
      background: 'rgba(68, 136, 255, 0.05)',
      padding: '2rem',
      borderRadius: '16px',
      border: '2px solid rgba(68, 136, 255, 0.2)',
      marginBottom: '2rem'
    }}>
      <h2 style={{
        color: '#4488ff',
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        🌊 Frequency Domain Analysis
      </h2>
      
      {/* Visualization Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <button
          onClick={() => setShowSpectralCentroid(!showSpectralCentroid)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: showSpectralCentroid 
              ? '2px solid #ff4488' 
              : '2px solid rgba(255, 68, 136, 0.3)',
            background: showSpectralCentroid 
              ? 'rgba(255, 68, 136, 0.2)' 
              : 'rgba(255, 68, 136, 0.05)',
            color: showSpectralCentroid ? '#ff4488' : '#cccccc',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          {showSpectralCentroid ? '📍 Hide Centroid' : '📍 Show Centroid'}
        </button>
      </div>

      {/* Full-width Frequency Visualization */}
      <div style={{
        marginBottom: '1rem'
      }}>
        <FrequencyDomainVisualizer 
          data={audioData.frequencyDomain} 
          sampleRate={audioData.sampleRate}
          bufferSize={audioData.bufferSize}
          showSpectralCentroid={showSpectralCentroid}
          spectralCentroid={spectralCentroid}
        />
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
          <h3 style={{ color: '#4488ff', marginBottom: '1rem' }}>What is Frequency Domain?</h3>
          <p style={{ marginBottom: '1rem' }}>
            The <strong>frequency domain</strong> breaks down sound into its frequency components. 
            Instead of showing amplitude over time, it shows:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>X-axis</strong> = Frequency (Hz - low to high pitch)</li>
            <li><strong>Y-axis</strong> = Magnitude (how strong each frequency is)</li>
            <li><strong>Blue bars</strong> = Energy at each frequency</li>
            <li><strong>Left side</strong> = Bass (low frequencies)</li>
            <li><strong>Right side</strong> = Treble (high frequencies)</li>
          </ul>
          <p style={{ marginBottom: '1rem' }}>
            <strong>Why it matters:</strong> Different sounds have unique <em>frequency signatures</em>. 
            Inhaling vs exhaling creates different patterns that we can detect!
          </p>
          
          <div style={{
            background: 'rgba(255, 136, 68, 0.1)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 136, 68, 0.3)',
            marginBottom: '1rem'
          }}>
            <strong style={{ color: '#ff8844' }}>🎯 Spectral Centroid</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
              The <strong>spectral centroid</strong> is the "center of mass" of the frequency spectrum. 
              It tells us if a sound is "bright" (high frequencies) or "dark" (low frequencies). 
              This is key for distinguishing inhale (bright) vs exhale (dark) breathing!
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
              <div style={{ color: '#4488ff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Spectral Centroid
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {spectralCentroid.toFixed(0)} Hz
              </div>
              <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                Center of mass of frequencies
              </div>
            </div>
            
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#4488ff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Dominant Frequency
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {dominantFreq.toFixed(0)} Hz
              </div>
              <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                Strongest frequency component
              </div>
            </div>
          </div>
          
          {/* Interactive Experiments */}
          <div style={{
            background: 'rgba(68, 136, 255, 0.1)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid rgba(68, 136, 255, 0.3)'
          }}>
            <strong style={{ color: '#4488ff' }}>🧪 Try These Frequency Experiments:</strong>
            <div style={{ marginTop: '0.8rem', display: 'grid', gap: '0.6rem' }}>
              <div style={{ padding: '0.6rem', background: 'rgba(68, 136, 255, 0.05)', borderRadius: '6px' }}>
                <strong>🫁 Breathe In (Inhale)</strong><br/>
                <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Watch for higher frequencies, centroid &gt;700 Hz</span>
              </div>
              <div style={{ padding: '0.6rem', background: 'rgba(68, 136, 255, 0.05)', borderRadius: '6px' }}>
                <strong>💨 Breathe Out (Exhale)</strong><br/>
                <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>See lower frequencies dominate, centroid &lt;700 Hz</span>
              </div>
              <div style={{ padding: '0.6rem', background: 'rgba(68, 136, 255, 0.05)', borderRadius: '6px' }}>
                <strong>🎵 Whistle High</strong><br/>
                <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Single peak at high frequency, very bright</span>
              </div>
              <div style={{ padding: '0.6rem', background: 'rgba(68, 136, 255, 0.05)', borderRadius: '6px' }}>
                <strong>🗣️ Say "Ahhh"</strong><br/>
                <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Multiple peaks (harmonics), rich spectrum</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}