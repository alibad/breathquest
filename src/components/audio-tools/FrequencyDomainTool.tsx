'use client';

import { useState, useEffect, useRef } from 'react';
import { FrequencyDomainVisualizer } from './FrequencyDomainVisualizer';
import { AdvancedSpectralVisualizer } from './AdvancedSpectralVisualizer';

interface FrequencyDomainToolProps {
  audioData: {
    timeDomain: Uint8Array;
    frequencyDomain: Uint8Array;
    sampleRate: number;
    bufferSize: number;
  };
  canvasRef?: any;
  // Additional canvas refs for recording different modes
  spectrumCanvasRef?: any;
  centroidCanvasRef?: any;
  rolloffCanvasRef?: any;
  fluxCanvasRef?: any;
  spreadCanvasRef?: any;
  skewnessCanvasRef?: any;
}

interface SpectralFeatures {
  rolloff: number;
  flux: number;
  spread: number;
  skewness: number;
}

export function FrequencyDomainTool({ 
  audioData, 
  canvasRef, 
  spectrumCanvasRef, 
  centroidCanvasRef, 
  rolloffCanvasRef, 
  fluxCanvasRef, 
  spreadCanvasRef, 
  skewnessCanvasRef 
}: FrequencyDomainToolProps) {
  const [showSpectralCentroid, setShowSpectralCentroid] = useState(true);
  const [analysisMode, setAnalysisMode] = useState<'spectrum' | 'centroid' | 'rolloff' | 'flux' | 'spread' | 'skewness'>('centroid');
  const [spectralFeatures, setSpectralFeatures] = useState<SpectralFeatures>({
    rolloff: 0,
    flux: 0,
    spread: 0,
    skewness: 0
  });
  const previousSpectrumRef = useRef<Float32Array | null>(null);
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

  // Advanced spectral feature calculations
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
    
    return nyquist;
  };

  const calculateSpectralFlux = (currentSpectrum: Float32Array, previousSpectrum: Float32Array | null): number => {
    if (!previousSpectrum || currentSpectrum.length !== previousSpectrum.length) {
      return 0;
    }
    
    let flux = 0;
    for (let i = 0; i < currentSpectrum.length; i++) {
      const diff = currentSpectrum[i] - previousSpectrum[i];
      flux += Math.max(0, diff);
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

  // Calculate basic metrics
  const spectralCentroid = calculateSpectralCentroid(audioData.frequencyDomain, audioData.sampleRate);
  const dominantFreq = calculateDominantFrequency(audioData.frequencyDomain, audioData.sampleRate);

  // Calculate advanced spectral features when frequency data changes
  useEffect(() => {
    if (audioData.frequencyDomain.length > 0) {
      // Convert to Float32Array for consistency
      const currentSpectrum = new Float32Array(audioData.frequencyDomain.length);
      for (let i = 0; i < audioData.frequencyDomain.length; i++) {
        currentSpectrum[i] = audioData.frequencyDomain[i] / 255.0;
      }

      const rolloff = calculateSpectralRolloff(audioData.frequencyDomain, audioData.sampleRate);
      const flux = calculateSpectralFlux(currentSpectrum, previousSpectrumRef.current);
      const spread = calculateSpectralSpread(audioData.frequencyDomain, audioData.sampleRate, spectralCentroid);
      const skewness = calculateSpectralSkewness(audioData.frequencyDomain, audioData.sampleRate, spectralCentroid, spread);

      setSpectralFeatures({
        rolloff,
        flux,
        spread,
        skewness
      });

      // Store current spectrum for next flux calculation
      previousSpectrumRef.current = currentSpectrum;
    }
  }, [audioData.frequencyDomain, audioData.sampleRate, spectralCentroid]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(68, 136, 255, 0.1), rgba(255, 68, 136, 0.05))',
      padding: '2rem',
      borderRadius: '16px',
      border: '2px solid rgba(68, 136, 255, 0.3)',
      marginBottom: '2rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      <h2 style={{
        background: 'linear-gradient(45deg, #4488ff, #ff4488)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        🌊 Frequency Domain Analysis
      </h2>
      
      {/* Analysis Mode Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'spectrum', label: '📊 Spectrum', color: '#4488ff' },
          { key: 'centroid', label: '🎯 Centroid', color: '#ff4488' },
          { key: 'rolloff', label: '📈 Rolloff', color: '#9333ea' },
          { key: 'flux', label: '⚡ Flux', color: '#06b6d4' },
          { key: 'spread', label: '📏 Spread', color: '#10b981' },
          { key: 'skewness', label: '🌊 Skewness', color: '#f59e0b' }
        ].map(mode => (
          <button
            key={mode.key}
            onClick={() => setAnalysisMode(mode.key as any)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: analysisMode === mode.key ? mode.color : 'rgba(255, 255, 255, 0.1)',
              color: analysisMode === mode.key ? '#000' : '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: analysisMode === mode.key ? 'bold' : 'normal',
              transition: 'all 0.2s ease'
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>



      {/* Full-width Frequency Visualization */}
      <div style={{
        marginBottom: '1rem'
      }}>
        {(analysisMode === 'rolloff' || analysisMode === 'flux' || analysisMode === 'spread' || analysisMode === 'skewness') ? (
          <AdvancedSpectralVisualizer 
            data={audioData.frequencyDomain}
            sampleRate={audioData.sampleRate}
            spectralFeatures={spectralFeatures}
            showFeature={analysisMode}
            canvasRef={canvasRef}
          />
        ) : (
          <FrequencyDomainVisualizer 
            data={audioData.frequencyDomain} 
            sampleRate={audioData.sampleRate}
            bufferSize={audioData.bufferSize}
            showSpectralCentroid={showSpectralCentroid}
            spectralCentroid={spectralCentroid}
            analysisMode={analysisMode}
            spectralFeatures={spectralFeatures}
            canvasRef={canvasRef}
          />
        )}
      </div>

      {/* Hidden canvases for recording different modes */}
      <div style={{ position: 'absolute', left: '-9999px', width: '800px', height: '400px' }}>
        {/* Spectrum Mode */}
        <FrequencyDomainVisualizer 
          data={audioData.frequencyDomain} 
          sampleRate={audioData.sampleRate}
          bufferSize={audioData.bufferSize}
          showSpectralCentroid={showSpectralCentroid}
          spectralCentroid={spectralCentroid}
          analysisMode="spectrum"
          spectralFeatures={spectralFeatures}
          canvasRef={spectrumCanvasRef}
        />
        
        {/* Centroid Mode */}
        <FrequencyDomainVisualizer 
          data={audioData.frequencyDomain} 
          sampleRate={audioData.sampleRate}
          bufferSize={audioData.bufferSize}
          showSpectralCentroid={showSpectralCentroid}
          spectralCentroid={spectralCentroid}
          analysisMode="centroid"
          spectralFeatures={spectralFeatures}
          canvasRef={centroidCanvasRef}
        />
        
        {/* Rolloff Mode */}
        <AdvancedSpectralVisualizer 
          data={audioData.frequencyDomain}
          sampleRate={audioData.sampleRate}
          spectralFeatures={spectralFeatures}
          showFeature="rolloff"
          canvasRef={rolloffCanvasRef}
        />
        
        {/* Flux Mode */}
        <AdvancedSpectralVisualizer 
          data={audioData.frequencyDomain}
          sampleRate={audioData.sampleRate}
          spectralFeatures={spectralFeatures}
          showFeature="flux"
          canvasRef={fluxCanvasRef}
        />
        
        {/* Spread Mode */}
        <AdvancedSpectralVisualizer 
          data={audioData.frequencyDomain}
          sampleRate={audioData.sampleRate}
          spectralFeatures={spectralFeatures}
          showFeature="spread"
          canvasRef={spreadCanvasRef}
        />
        
        {/* Skewness Mode */}
        <AdvancedSpectralVisualizer 
          data={audioData.frequencyDomain}
          sampleRate={audioData.sampleRate}
          spectralFeatures={spectralFeatures}
          showFeature="skewness"
          canvasRef={skewnessCanvasRef}
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
          {analysisMode === 'spectrum' && (
            <>
              <h3 style={{ color: '#4488ff', marginBottom: '1rem' }}>📊 Frequency Spectrum</h3>
              <p style={{ marginBottom: '1rem' }}>
                The <strong>frequency domain</strong> breaks down sound into its frequency components. 
                Instead of showing amplitude over time, it shows:
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li><strong>X-axis</strong> = Frequency (Hz - low to high pitch)</li>
                <li><strong>Y-axis</strong> = Magnitude (how strong each frequency is)</li>
                <li><strong>Colorful bars</strong> = Energy at each frequency</li>
                <li><strong>Left side</strong> = Bass (low frequencies)</li>
                <li><strong>Right side</strong> = Treble (high frequencies)</li>
              </ul>
              <div style={{
                background: 'rgba(255, 136, 68, 0.1)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 136, 68, 0.3)',
                marginBottom: '1rem'
              }}>
                <strong style={{ color: '#ff8844' }}>🎯 Spectral Centroid</strong>
                <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                  The "center of mass" of the spectrum. Bright sounds (high centroid) vs dark sounds (low centroid).
                </p>
              </div>
            </>
          )}

          {analysisMode === 'centroid' && (
            <>
              <h3 style={{ color: '#ff4488', marginBottom: '1rem' }}>🎯 Spectral Centroid</h3>
              <p style={{ marginBottom: '1rem' }}>
                The <strong>Spectral Centroid</strong> is the "center of mass" of the frequency spectrum.
                It indicates whether a sound is "bright" (high frequencies) or "dark" (low frequencies).
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li><strong>High centroid</strong> = Bright, sharp sounds (inhale)</li>
                <li><strong>Low centroid</strong> = Dark, muffled sounds (exhale)</li>
                <li><strong>Speech</strong> typically has higher centroid</li>
                <li><strong>Breathing</strong> varies between inhale/exhale</li>
              </ul>
              <div style={{
                background: 'rgba(255, 68, 136, 0.1)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 68, 136, 0.3)'
              }}>
                <strong style={{ color: '#ff4488' }}>🔬 Breath Detection:</strong><br/>
                Perfect for distinguishing inhale (bright, ≥700Hz) vs exhale (dark, &lt;700Hz) breathing patterns.
              </div>
            </>
          )}

          {analysisMode === 'rolloff' && (
            <>
              <h3 style={{ color: '#9333ea', marginBottom: '1rem' }}>🎯 Spectral Rolloff</h3>
              <p style={{ marginBottom: '1rem' }}>
                <strong>Spectral Rolloff</strong> is the frequency below which 85% of the spectral energy lies.
                It indicates the "brightness" or "darkness" of a sound.
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li><strong>Low rolloff</strong> = Dark, muffled sounds</li>
                <li><strong>High rolloff</strong> = Bright, crisp sounds</li>
                <li><strong>Speech</strong> typically has rolloff around 4-6kHz</li>
                <li><strong>Breathing</strong> usually has lower rolloff</li>
              </ul>
              <div style={{
                background: 'rgba(147, 51, 234, 0.1)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(147, 51, 234, 0.3)'
              }}>
                <strong style={{ color: '#9333ea' }}>🔬 Usage:</strong><br/>
                Perfect for distinguishing speech from breathing - speech has higher rolloff due to consonants and formants.
              </div>
            </>
          )}

          {analysisMode === 'flux' && (
            <>
              <h3 style={{ color: '#06b6d4', marginBottom: '1rem' }}>⚡ Spectral Flux</h3>
              <p style={{ marginBottom: '1rem' }}>
                <strong>Spectral Flux</strong> measures how quickly the frequency content changes over time.
                It's excellent for detecting onsets and transitions.
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li><strong>High flux</strong> = Rapid changes (onsets, attacks)</li>
                <li><strong>Low flux</strong> = Steady, sustained sounds</li>
                <li><strong>Breath onsets</strong> create flux spikes</li>
                <li><strong>Steady breathing</strong> has low flux</li>
              </ul>
              <div style={{
                background: 'rgba(6, 182, 212, 0.1)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                <strong style={{ color: '#06b6d4' }}>🔬 Usage:</strong><br/>
                Ideal for detecting when breathing starts/stops or when speech begins.
              </div>
            </>
          )}

          {analysisMode === 'spread' && (
            <>
              <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>📏 Spectral Spread</h3>
              <p style={{ marginBottom: '1rem' }}>
                <strong>Spectral Spread</strong> measures how "wide" the frequency content is around the centroid.
                It indicates the bandwidth or "richness" of a sound.
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li><strong>Low spread</strong> = Narrow, tonal sounds (whistling)</li>
                <li><strong>High spread</strong> = Broad, rich sounds (noise, speech)</li>
                <li><strong>Pure tones</strong> have very low spread</li>
                <li><strong>Breathing</strong> typically has moderate spread</li>
              </ul>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <strong style={{ color: '#10b981' }}>🔬 Usage:</strong><br/>
                Helps distinguish between tonal sounds (low spread) and noisy sounds (high spread).
              </div>
            </>
          )}

          {analysisMode === 'skewness' && (
            <>
              <h3 style={{ color: '#f59e0b', marginBottom: '1rem' }}>🌊 Spectral Skewness</h3>
              <p style={{ marginBottom: '1rem' }}>
                <strong>Spectral Skewness</strong> measures the asymmetry of the frequency distribution.
                It reveals whether energy is concentrated in low or high frequencies.
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li><strong>Positive skewness</strong> = Energy concentrated in low frequencies</li>
                <li><strong>Negative skewness</strong> = Energy concentrated in high frequencies</li>
                <li><strong>Zero skewness</strong> = Symmetric distribution</li>
                <li><strong>Voice vs breath</strong> have different skewness patterns</li>
              </ul>
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <strong style={{ color: '#f59e0b' }}>🔬 Usage:</strong><br/>
                Excellent for characterizing the overall "shape" of the frequency distribution.
              </div>
            </>
          )}
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
            {analysisMode === 'spectrum' && (
              <>
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
              </>
            )}

            {analysisMode === 'centroid' && (
              <>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#ff4488', fontWeight: 'bold', fontSize: '0.9rem' }}>
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
              </>
            )}

            {analysisMode === 'rolloff' && (
              <>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#9333ea', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Spectral Rolloff
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {spectralFeatures.rolloff.toFixed(0)} Hz
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                    85% energy cutoff
                  </div>
                </div>
                
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
                    For comparison
                  </div>
                </div>
              </>
            )}

            {analysisMode === 'flux' && (
              <>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#06b6d4', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Spectral Flux
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {spectralFeatures.flux.toFixed(3)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                    Rate of change
                  </div>
                </div>
                
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
                    Current centroid
                  </div>
                </div>
              </>
            )}

            {analysisMode === 'spread' && (
              <>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Spectral Spread
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {spectralFeatures.spread.toFixed(0)} Hz
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                    Frequency bandwidth
                  </div>
                </div>
                
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
                    Center frequency
                  </div>
                </div>
              </>
            )}

            {analysisMode === 'skewness' && (
              <>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Spectral Skewness
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {spectralFeatures.skewness.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                    Distribution asymmetry
                  </div>
                </div>
                
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
                    Center frequency
                  </div>
                </div>
              </>
            )}
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