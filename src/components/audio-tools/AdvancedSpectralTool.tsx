'use client';

import { useState, useEffect, useRef } from 'react';
import { AdvancedSpectralVisualizer } from './AdvancedSpectralVisualizer';

interface AdvancedSpectralToolProps {
  audioData: {
    timeDomain: Uint8Array;
    frequencyDomain: Uint8Array;
    sampleRate: number;
    bufferSize: number;
  };
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

interface SpectralFeatures {
  rolloff: number;
  flux: number;
  spread: number;
  skewness: number;
}

export function AdvancedSpectralTool({ audioData, canvasRef }: AdvancedSpectralToolProps) {
  const [spectralFeatures, setSpectralFeatures] = useState<SpectralFeatures>({
    rolloff: 0,
    flux: 0,
    spread: 0,
    skewness: 0
  });
  
  const [showFeature, setShowFeature] = useState<'rolloff' | 'flux' | 'spread' | 'skewness'>('rolloff');
  const previousSpectrumRef = useRef<Float32Array | null>(null);

  const calculateSpectralRolloff = (frequencyData: Uint8Array, sampleRate: number, threshold: number = 0.85): number => {
    const nyquist = sampleRate / 2;
    const binCount = frequencyData.length;
    
    // Calculate total energy
    let totalEnergy = 0;
    for (let i = 0; i < binCount; i++) {
      const magnitude = frequencyData[i] / 255.0;
      totalEnergy += magnitude * magnitude;
    }
    
    // Find rolloff point
    let cumulativeEnergy = 0;
    const targetEnergy = totalEnergy * threshold;
    
    for (let i = 0; i < binCount; i++) {
      const magnitude = frequencyData[i] / 255.0;
      cumulativeEnergy += magnitude * magnitude;
      
      if (cumulativeEnergy >= targetEnergy) {
        return (i / binCount) * nyquist;
      }
    }
    
    return nyquist; // If we don't find the threshold, return max frequency
  };

  const calculateSpectralFlux = (currentSpectrum: Float32Array, previousSpectrum: Float32Array | null): number => {
    if (!previousSpectrum || currentSpectrum.length !== previousSpectrum.length) {
      return 0;
    }
    
    let flux = 0;
    for (let i = 0; i < currentSpectrum.length; i++) {
      const diff = currentSpectrum[i] - previousSpectrum[i];
      flux += Math.max(0, diff); // Only positive changes (onset detection)
    }
    
    return flux / currentSpectrum.length;
  };

  const calculateSpectralSpread = (frequencyData: Uint8Array, sampleRate: number, centroid: number): number => {
    const nyquist = sampleRate / 2;
    const binCount = frequencyData.length;
    
    let weightedVariance = 0;
    let totalMagnitude = 0;
    
    for (let i = 0; i < binCount; i++) {
      const frequency = (i / binCount) * nyquist;
      const magnitude = frequencyData[i] / 255.0;
      
      weightedVariance += magnitude * Math.pow(frequency - centroid, 2);
      totalMagnitude += magnitude;
    }
    
    return totalMagnitude > 0 ? Math.sqrt(weightedVariance / totalMagnitude) : 0;
  };

  const calculateSpectralSkewness = (frequencyData: Uint8Array, sampleRate: number, centroid: number, spread: number): number => {
    if (spread === 0) return 0;
    
    const nyquist = sampleRate / 2;
    const binCount = frequencyData.length;
    
    let weightedSkewness = 0;
    let totalMagnitude = 0;
    
    for (let i = 0; i < binCount; i++) {
      const frequency = (i / binCount) * nyquist;
      const magnitude = frequencyData[i] / 255.0;
      
      weightedSkewness += magnitude * Math.pow((frequency - centroid) / spread, 3);
      totalMagnitude += magnitude;
    }
    
    return totalMagnitude > 0 ? weightedSkewness / totalMagnitude : 0;
  };

  const calculateSpectralCentroid = (frequencyData: Uint8Array, sampleRate: number): number => {
    const nyquist = sampleRate / 2;
    const binCount = frequencyData.length;
    
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < binCount; i++) {
      const frequency = (i / binCount) * nyquist;
      const magnitude = frequencyData[i] / 255.0;
      
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  };

  useEffect(() => {
    if (audioData.frequencyDomain.length > 0) {
      // Convert to normalized float array for flux calculation
      const currentSpectrum = new Float32Array(audioData.frequencyDomain.length);
      for (let i = 0; i < audioData.frequencyDomain.length; i++) {
        currentSpectrum[i] = audioData.frequencyDomain[i] / 255.0;
      }
      
      // Calculate centroid first (needed for spread and skewness)
      const centroid = calculateSpectralCentroid(audioData.frequencyDomain, audioData.sampleRate);
      
      // Calculate all features
      const rolloff = calculateSpectralRolloff(audioData.frequencyDomain, audioData.sampleRate);
      const flux = calculateSpectralFlux(currentSpectrum, previousSpectrumRef.current);
      const spread = calculateSpectralSpread(audioData.frequencyDomain, audioData.sampleRate, centroid);
      const skewness = calculateSpectralSkewness(audioData.frequencyDomain, audioData.sampleRate, centroid, spread);
      
      setSpectralFeatures({
        rolloff,
        flux,
        spread,
        skewness
      });
      
      // Store current spectrum for next flux calculation
      previousSpectrumRef.current = currentSpectrum;
    }
  }, [audioData.frequencyDomain, audioData.sampleRate]);

  return (
    <div style={{
      marginBottom: '3rem',
      padding: '2rem',
      background: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '12px',
      border: '1px solid rgba(138, 43, 226, 0.3)'
    }}>
      <h2 style={{
        color: '#8b5cf6',
        fontSize: '1.5rem',
        marginBottom: '1rem',
        textAlign: 'center',
        fontWeight: 'bold'
      }}>
        🔬 Advanced Spectral Analysis
      </h2>
      
      {/* Feature Selector */}
      <div style={{
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          gap: '0.5rem',
          padding: '0.25rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px'
        }}>
          {[
            { key: 'rolloff', label: '📊 Rolloff', color: '#ff6b6b' },
            { key: 'flux', label: '⚡ Flux', color: '#4ecdc4' },
            { key: 'spread', label: '📏 Spread', color: '#45b7d1' },
            { key: 'skewness', label: '⚖️ Skewness', color: '#96ceb4' }
          ].map(feature => (
            <button
              key={feature.key}
              onClick={() => setShowFeature(feature.key as any)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: showFeature === feature.key ? feature.color : 'rgba(255, 255, 255, 0.1)',
                color: showFeature === feature.key ? '#000' : '#fff',
                cursor: 'pointer',
                fontWeight: showFeature === feature.key ? 'bold' : 'normal',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              {feature.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visualization */}
      <div style={{ marginBottom: '1rem' }}>
        <AdvancedSpectralVisualizer 
          data={audioData.frequencyDomain}
          sampleRate={audioData.sampleRate}
          spectralFeatures={spectralFeatures}
          showFeature={showFeature}
          canvasRef={canvasRef}
        />
      </div>

      {/* Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem'
      }}>
        {/* Left: Explanation */}
        <div>
          <h3 style={{ color: '#8b5cf6', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            What is {showFeature === 'rolloff' ? 'Spectral Rolloff' : 
                     showFeature === 'flux' ? 'Spectral Flux' :
                     showFeature === 'spread' ? 'Spectral Spread' : 'Spectral Skewness'}?
          </h3>
          
          {showFeature === 'rolloff' && (
            <div style={{ color: '#cccccc', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <p><strong>Spectral Rolloff</strong> is the frequency below which 85% of the spectral energy lies.</p>
              <p>It tells us where the "high frequency cutoff" is - how much treble content exists in the sound.</p>
              <div style={{ 
                background: 'rgba(255, 107, 107, 0.1)', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginTop: '1rem',
                border: '1px solid rgba(255, 107, 107, 0.3)'
              }}>
                <strong style={{ color: '#ff6b6b' }}>Formula:</strong><br/>
                Find frequency where Σ(energy) = 85% of total energy
              </div>
            </div>
          )}

          {showFeature === 'flux' && (
            <div style={{ color: '#cccccc', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <p><strong>Spectral Flux</strong> measures how quickly the frequency spectrum is changing over time.</p>
              <p>High flux = rapid changes (onsets, attacks). Low flux = steady state.</p>
              <div style={{ 
                background: 'rgba(78, 205, 196, 0.1)', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginTop: '1rem',
                border: '1px solid rgba(78, 205, 196, 0.3)'
              }}>
                <strong style={{ color: '#4ecdc4' }}>Formula:</strong><br/>
                Σ(max(0, current[i] - previous[i])) / bins
              </div>
            </div>
          )}

          {showFeature === 'spread' && (
            <div style={{ color: '#cccccc', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <p><strong>Spectral Spread</strong> measures how "wide" the frequency distribution is around the centroid.</p>
              <p>High spread = broad frequency content. Low spread = narrow, tonal sounds.</p>
              <div style={{ 
                background: 'rgba(69, 183, 209, 0.1)', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginTop: '1rem',
                border: '1px solid rgba(69, 183, 209, 0.3)'
              }}>
                <strong style={{ color: '#45b7d1' }}>Formula:</strong><br/>
                √(Σ(magnitude × (freq - centroid)²) / Σ(magnitude))
              </div>
            </div>
          )}

          {showFeature === 'skewness' && (
            <div style={{ color: '#cccccc', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <p><strong>Spectral Skewness</strong> measures the asymmetry of the frequency distribution.</p>
              <p>Positive = biased toward high frequencies. Negative = biased toward low frequencies.</p>
              <div style={{ 
                background: 'rgba(150, 206, 180, 0.1)', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginTop: '1rem',
                border: '1px solid rgba(150, 206, 180, 0.3)'
              }}>
                <strong style={{ color: '#96ceb4' }}>Formula:</strong><br/>
                Σ(magnitude × ((freq - centroid) / spread)³) / Σ(magnitude)
              </div>
            </div>
          )}
        </div>

        {/* Right: Metrics and Experiments */}
        <div>
          {/* Live Metrics */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ color: '#ffffff', marginBottom: '0.8rem' }}>📊 Live Metrics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.9rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '6px' }}>
                <strong style={{ color: '#ff6b6b' }}>Rolloff:</strong><br/>
                {spectralFeatures.rolloff.toFixed(0)} Hz
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(78, 205, 196, 0.1)', borderRadius: '6px' }}>
                <strong style={{ color: '#4ecdc4' }}>Flux:</strong><br/>
                {spectralFeatures.flux.toFixed(3)}
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(69, 183, 209, 0.1)', borderRadius: '6px' }}>
                <strong style={{ color: '#45b7d1' }}>Spread:</strong><br/>
                {spectralFeatures.spread.toFixed(0)} Hz
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(150, 206, 180, 0.1)', borderRadius: '6px' }}>
                <strong style={{ color: '#96ceb4' }}>Skewness:</strong><br/>
                {spectralFeatures.skewness.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Experiments */}
          <div>
            <strong style={{ color: '#ffffff', fontSize: '1rem' }}>🧪 Try These Experiments:</strong>
            <div style={{ 
              fontSize: '0.85rem', 
              color: '#cccccc', 
              marginTop: '0.5rem', 
              lineHeight: '1.4' 
            }}>
              <div style={{ marginBottom: '0.3rem' }}>🎵 <strong>Whistle:</strong> High rolloff, low spread</div>
              <div style={{ marginBottom: '0.3rem' }}>💨 <strong>Breathing:</strong> Variable flux, medium rolloff</div>
              <div style={{ marginBottom: '0.3rem' }}>🗣️ <strong>Speech:</strong> High flux, wide spread</div>
              <div style={{ marginBottom: '0.3rem' }}>👏 <strong>Clap:</strong> Very high flux, high rolloff</div>
              <div style={{ marginBottom: '0.3rem' }}>🔇 <strong>Silence:</strong> Low everything</div>
              <div>🎶 <strong>Music:</strong> Variable all features</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}