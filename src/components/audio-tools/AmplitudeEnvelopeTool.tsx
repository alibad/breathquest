'use client';

import { useState } from 'react';
import { AmplitudeEnvelopeVisualizer } from './AmplitudeEnvelopeVisualizer';

interface AmplitudeEnvelopeToolProps {
  audioData: {
    timeDomain: Uint8Array;
    frequencyDomain: Uint8Array;
    sampleRate: number;
    bufferSize: number;
  };
  canvasRef?: any;
}

export function AmplitudeEnvelopeTool({ audioData, canvasRef }: AmplitudeEnvelopeToolProps) {
  const [envelopeType, setEnvelopeType] = useState<'hilbert' | 'moving_average' | 'peak_follower'>('hilbert');
  const [windowSize, setWindowSize] = useState(64);
  const [attackTime, setAttackTime] = useState(0.003); // 3ms attack
  const [releaseTime, setReleaseTime] = useState(0.1); // 100ms release

  // Calculate different types of amplitude envelopes
  const calculateEnvelope = (data: Uint8Array, type: string): Float32Array => {
    if (data.length === 0) return new Float32Array(0);

    const envelope = new Float32Array(data.length);
    
    switch (type) {
      case 'moving_average':
        return calculateMovingAverageEnvelope(data, windowSize);
      
      case 'peak_follower':
        return calculatePeakFollowerEnvelope(data, attackTime, releaseTime);
      
      case 'hilbert':
        return calculateHilbertEnvelope(data);
      
      default:
        return envelope;
    }
  };

  // Moving Average Envelope - Simple sliding window
  const calculateMovingAverageEnvelope = (data: Uint8Array, windowSize: number): Float32Array => {
    const envelope = new Float32Array(data.length);
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      
      // Calculate average magnitude in window around current sample
      for (let j = Math.max(0, i - halfWindow); j < Math.min(data.length, i + halfWindow + 1); j++) {
        sum += Math.abs(data[j] - 128); // Convert to magnitude
        count++;
      }
      
      envelope[i] = count > 0 ? sum / count : 0;
    }
    
    return envelope;
  };

  // Peak Follower Envelope - Attack/Release envelope follower
  const calculatePeakFollowerEnvelope = (data: Uint8Array, attackTime: number, releaseTime: number): Float32Array => {
    const envelope = new Float32Array(data.length);
    const sampleRate = 48000; // Approximate sample rate
    
    // Convert times to sample-based coefficients
    const attackCoeff = Math.exp(-1.0 / (attackTime * sampleRate));
    const releaseCoeff = Math.exp(-1.0 / (releaseTime * sampleRate));
    
    let envelopeValue = 0;
    
    for (let i = 0; i < data.length; i++) {
      const inputMagnitude = Math.abs(data[i] - 128) / 128; // Normalize to 0-1
      
      if (inputMagnitude > envelopeValue) {
        // Attack: Fast rise
        envelopeValue = inputMagnitude + (envelopeValue - inputMagnitude) * attackCoeff;
      } else {
        // Release: Slow fall
        envelopeValue = inputMagnitude + (envelopeValue - inputMagnitude) * releaseCoeff;
      }
      
      envelope[i] = envelopeValue * 128; // Scale back to match input range
    }
    
    return envelope;
  };

  // Hilbert Transform Envelope - True analytical envelope
  const calculateHilbertEnvelope = (data: Uint8Array): Float32Array => {
    // Simplified Hilbert transform using 90-degree phase shift approximation
    const envelope = new Float32Array(data.length);
    const windowSize = 32; // Small window for local analysis
    
    for (let i = windowSize; i < data.length - windowSize; i++) {
      let realSum = 0;
      let imagSum = 0;
      
      // Calculate local Hilbert transform approximation
      for (let j = -windowSize; j <= windowSize; j++) {
        const sample = (data[i + j] - 128) / 128; // Normalize
        realSum += sample;
        
        // 90-degree phase shift approximation
        if (j !== 0) {
          imagSum += sample * (1.0 / (Math.PI * j)) * (1 - Math.cos(Math.PI * j));
        }
      }
      
      // Calculate magnitude of complex number
      envelope[i] = Math.sqrt(realSum * realSum + imagSum * imagSum) * 64; // Scale for visibility
    }
    
    return envelope;
  };

  // Calculate envelope statistics
  const calculateEnvelopeStats = (envelope: Float32Array) => {
    if (envelope.length === 0) return { mean: 0, std: 0, peaks: 0, valleys: 0 };
    
    let sum = 0;
    let peaks = 0;
    let valleys = 0;
    
    for (let i = 0; i < envelope.length; i++) {
      sum += envelope[i];
      
      // Detect peaks and valleys
      if (i > 0 && i < envelope.length - 1) {
        if (envelope[i] > envelope[i-1] && envelope[i] > envelope[i+1]) {
          peaks++;
        }
        if (envelope[i] < envelope[i-1] && envelope[i] < envelope[i+1]) {
          valleys++;
        }
      }
    }
    
    const mean = sum / envelope.length;
    
    // Calculate standard deviation
    let variance = 0;
    for (let i = 0; i < envelope.length; i++) {
      variance += Math.pow(envelope[i] - mean, 2);
    }
    const std = Math.sqrt(variance / envelope.length);
    
    return { mean, std, peaks, valleys };
  };

  const envelope = calculateEnvelope(audioData.timeDomain, envelopeType);
  const envelopeStats = calculateEnvelopeStats(envelope);

  return (
    <div style={{
      background: 'rgba(255, 136, 68, 0.05)',
      padding: '2rem',
      borderRadius: '16px',
      border: '2px solid rgba(255, 136, 68, 0.2)',
      marginBottom: '2rem'
    }}>
      <h2 style={{
        color: '#ff8844',
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        📈 Amplitude Envelope Analysis
      </h2>
      
      {/* Envelope Type Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setEnvelopeType('moving_average')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: envelopeType === 'moving_average' 
              ? '2px solid #ff8844' 
              : '2px solid rgba(255, 136, 68, 0.3)',
            background: envelopeType === 'moving_average' 
              ? 'rgba(255, 136, 68, 0.2)' 
              : 'rgba(255, 136, 68, 0.05)',
            color: envelopeType === 'moving_average' ? '#ff8844' : '#cccccc',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          📊 Moving Average
        </button>
        
        <button
          onClick={() => setEnvelopeType('peak_follower')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: envelopeType === 'peak_follower' 
              ? '2px solid #ff8844' 
              : '2px solid rgba(255, 136, 68, 0.3)',
            background: envelopeType === 'peak_follower' 
              ? 'rgba(255, 136, 68, 0.2)' 
              : 'rgba(255, 136, 68, 0.05)',
            color: envelopeType === 'peak_follower' ? '#ff8844' : '#cccccc',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          ⚡ Peak Follower
        </button>
        
        <button
          onClick={() => setEnvelopeType('hilbert')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: envelopeType === 'hilbert' 
              ? '2px solid #ff8844' 
              : '2px solid rgba(255, 136, 68, 0.3)',
            background: envelopeType === 'hilbert' 
              ? 'rgba(255, 136, 68, 0.2)' 
              : 'rgba(255, 136, 68, 0.05)',
            color: envelopeType === 'hilbert' ? '#ff8844' : '#cccccc',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          🌊 Hilbert Transform
        </button>
      </div>

      {/* Parameter Controls */}
      {envelopeType === 'moving_average' && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <label style={{ color: '#ff8844', fontSize: '0.9rem' }}>
            Window Size: {windowSize} samples
          </label>
          <input
            type="range"
            min="8"
            max="256"
            step="8"
            value={windowSize}
            onChange={(e) => setWindowSize(parseInt(e.target.value))}
            style={{ width: '200px' }}
          />
        </div>
      )}

      {envelopeType === 'peak_follower' && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ color: '#ff8844', fontSize: '0.9rem' }}>
              Attack: {(attackTime * 1000).toFixed(1)}ms
            </label>
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              value={attackTime}
              onChange={(e) => setAttackTime(parseFloat(e.target.value))}
              style={{ width: '120px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ color: '#ff8844', fontSize: '0.9rem' }}>
              Release: {(releaseTime * 1000).toFixed(0)}ms
            </label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={releaseTime}
              onChange={(e) => setReleaseTime(parseFloat(e.target.value))}
              style={{ width: '120px' }}
            />
          </div>
        </div>
      )}

      {/* Full-width Envelope Visualization */}
      <div style={{
        marginBottom: '1rem'
      }}>
        <AmplitudeEnvelopeVisualizer 
          timeDomainData={audioData.timeDomain}
          envelopeData={envelope}
          canvasRef={canvasRef}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Left Column - Theory */}
        <div style={{
          color: '#cccccc',
          lineHeight: '1.6'
        }}>
          <h3 style={{ color: '#ff8844', marginBottom: '1rem' }}>What is Amplitude Envelope?</h3>
          <p style={{ marginBottom: '1rem' }}>
            The <strong>amplitude envelope</strong> is a smooth curve that outlines the overall 
            loudness changes in the audio signal over time. It removes rapid fluctuations 
            to reveal the underlying pattern.
          </p>
          
          <div style={{
            background: 'rgba(255, 136, 68, 0.1)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 136, 68, 0.3)',
            marginBottom: '1rem'
          }}>
            <strong style={{ color: '#ff8844' }}>🔬 Current Method: {
              envelopeType === 'moving_average' ? 'Moving Average' :
              envelopeType === 'peak_follower' ? 'Peak Follower' :
              'Hilbert Transform'
            }</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: '0', fontSize: '0.9rem' }}>
              {envelopeType === 'moving_average' && 
                "Averages magnitude over a sliding window. Simple and smooth, good for general trends."}
              {envelopeType === 'peak_follower' && 
                "Follows peaks with attack/release timing. Mimics analog envelope followers, great for dynamic response."}
              {envelopeType === 'hilbert' && 
                "Uses complex analysis for true analytical envelope. Most accurate but computationally intensive."}
            </p>
          </div>

          <div style={{
            background: 'rgba(68, 136, 255, 0.1)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid rgba(68, 136, 255, 0.3)'
          }}>
            <strong style={{ color: '#4488ff' }}>🎯 Breathing Applications:</strong>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              <li>Visualize breath cycles without noise</li>
              <li>Detect inhale/exhale transitions</li>
              <li>Measure breathing rhythm and depth</li>
              <li>Distinguish breath from speech patterns</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Statistics */}
        <div>
          {/* Real-time envelope statistics */}
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
              <div style={{ color: '#ff8844', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Mean Envelope
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {envelopeStats.mean.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                Average envelope level
              </div>
            </div>
            
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#ff8844', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Envelope Variation
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {envelopeStats.std.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                Standard deviation
              </div>
            </div>

            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#ff8844', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Peaks Detected
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {envelopeStats.peaks}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                Local maxima
              </div>
            </div>

            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#ff8844', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Valleys Detected
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {envelopeStats.valleys}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                Local minima
              </div>
            </div>
          </div>
          
          {/* Envelope Experiments */}
          <div style={{
            background: 'rgba(255, 136, 68, 0.1)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 136, 68, 0.3)'
          }}>
            <strong style={{ color: '#ff8844' }}>🧪 Try These Envelope Experiments:</strong>
            <div style={{ marginTop: '0.8rem', display: 'grid', gap: '0.6rem' }}>
              <div style={{ padding: '0.6rem', background: 'rgba(255, 136, 68, 0.05)', borderRadius: '6px' }}>
                <strong>🫁 Slow Deep Breaths</strong><br/>
                <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Watch smooth envelope curves following your breath rhythm</span>
              </div>
              <div style={{ padding: '0.6rem', background: 'rgba(255, 136, 68, 0.05)', borderRadius: '6px' }}>
                <strong>💬 Say Words</strong><br/>
                <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>See sharp envelope spikes vs smooth breath patterns</span>
              </div>
              <div style={{ padding: '0.6rem', background: 'rgba(255, 136, 68, 0.05)', borderRadius: '6px' }}>
                <strong>⚙️ Adjust Parameters</strong><br/>
                <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Try different envelope types and see how they respond</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}