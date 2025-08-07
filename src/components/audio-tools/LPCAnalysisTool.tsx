'use client';

import { useState, useEffect, useRef } from 'react';
import { LPCAnalysisVisualizer } from './LPCAnalysisVisualizer';

interface LPCAnalysisToolProps {
  audioData: {
    timeDomain: Uint8Array;
    frequencyDomain: Uint8Array;
    sampleRate: number;
    bufferSize: number;
  };
  canvasRef?: any;
}

interface LPCResults {
  coefficients: number[];
  residual: number[];
  predictionGain: number;
  formants: number[];
  predictability: number;
}

export function LPCAnalysisTool({ audioData, canvasRef }: LPCAnalysisToolProps) {
  // Load state from localStorage, default to collapsed
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lpcAnalysisTool-expanded');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [lpcOrder, setLpcOrder] = useState<number>(10);
  const [lpcResults, setLpcResults] = useState<LPCResults>({
    coefficients: [],
    residual: [],
    predictionGain: 0,
    formants: [],
    predictability: 0
  });
  
  const [analysisMode, setAnalysisMode] = useState<'coefficients' | 'residual' | 'formants' | 'prediction'>('coefficients');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [updateCounter, setUpdateCounter] = useState<number>(0);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lpcAnalysisTool-expanded', JSON.stringify(isExpanded));
    }
  }, [isExpanded]);

  // Toggle function
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Convert Uint8Array to Float32Array with proper normalization
  const normalizeAudioData = (data: Uint8Array): Float32Array => {
    const normalized = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      // Convert from 0-255 to -1 to 1
      normalized[i] = (data[i] - 128) / 128.0;
    }
    return normalized;
  };

  // Calculate autocorrelation
  const calculateAutocorrelation = (signal: Float32Array, maxLag: number): Float32Array => {
    const autocorr = new Float32Array(maxLag + 1);
    
    for (let lag = 0; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < signal.length - lag; i++) {
        sum += signal[i] * signal[i + lag];
      }
      autocorr[lag] = sum;
    }
    
    return autocorr;
  };

  // Levinson-Durbin algorithm for LPC coefficient calculation (with safety checks)
  const levinsonDurbin = (autocorr: Float32Array, order: number): { coefficients: number[], error: number } => {
    if (autocorr.length < order + 1 || autocorr[0] === 0) {
      return { coefficients: new Array(order).fill(0), error: 1 };
    }
    
    const a = new Array(order + 1).fill(0);
    const k = new Array(order).fill(0);
    
    let error = autocorr[0];
    a[0] = 1;
    
    for (let i = 1; i <= order; i++) {
      let sum = 0;
      for (let j = 1; j < i; j++) {
        sum += a[j] * autocorr[i - j];
      }
      
      // Safety check to prevent division by zero
      if (Math.abs(error) < 1e-10) {
        break;
      }
      
      k[i - 1] = -(autocorr[i] + sum) / error;
      
      // Stability check
      if (Math.abs(k[i - 1]) >= 1.0) {
        k[i - 1] = k[i - 1] > 0 ? 0.99 : -0.99;
      }
      
      a[i] = k[i - 1];
      
      for (let j = 1; j < i; j++) {
        a[j] = a[j] + k[i - 1] * a[i - j];
      }
      
      error = error * (1 - k[i - 1] * k[i - 1]);
      
      // Safety check for error
      if (error <= 0) {
        error = 1e-6;
      }
    }
    
    return { 
      coefficients: a.slice(1), // Remove a[0] which is always 1
      error: error 
    };
  };

  // Calculate prediction residual
  const calculateResidual = (signal: Float32Array, coefficients: number[]): Float32Array => {
    const residual = new Float32Array(signal.length);
    const order = coefficients.length;
    
    // First 'order' samples can't be predicted
    for (let i = 0; i < order; i++) {
      residual[i] = signal[i];
    }
    
    // Calculate residual for the rest
    for (let i = order; i < signal.length; i++) {
      let prediction = 0;
      for (let j = 0; j < order; j++) {
        prediction += coefficients[j] * signal[i - j - 1];
      }
      residual[i] = signal[i] - prediction;
    }
    
    return residual;
  };

  // Find formant frequencies from LPC coefficients
  const findFormants = (coefficients: number[], sampleRate: number): number[] => {
    const formants: number[] = [];
    
    // Convert LPC coefficients to polynomial roots
    // This is a simplified approach - real formant finding is more complex
    const order = coefficients.length;
    
    // For demonstration, we'll estimate formants from spectral peaks
    // In a real implementation, you'd solve for polynomial roots
    
    // Create frequency response from LPC coefficients
    const nFreqs = 512;
    const freqs: number[] = [];
    const magnitudes: number[] = [];
    
    for (let k = 0; k < nFreqs; k++) {
      const freq = (k * sampleRate) / (2 * nFreqs);
      const omega = (2 * Math.PI * freq) / sampleRate;
      
      // Calculate H(e^jw) = 1 / (1 + a1*z^-1 + a2*z^-2 + ...)
      let real = 1;
      let imag = 0;
      
      for (let i = 0; i < order; i++) {
        const angle = -(i + 1) * omega;
        real += coefficients[i] * Math.cos(angle);
        imag += coefficients[i] * Math.sin(angle);
      }
      
      const magnitude = 1 / Math.sqrt(real * real + imag * imag);
      freqs.push(freq);
      magnitudes.push(magnitude);
    }
    
    // Find peaks in the magnitude response (simplified peak detection)
    for (let i = 2; i < magnitudes.length - 2; i++) {
      if (magnitudes[i] > magnitudes[i-1] && 
          magnitudes[i] > magnitudes[i+1] &&
          magnitudes[i] > magnitudes[i-2] && 
          magnitudes[i] > magnitudes[i+2] &&
          magnitudes[i] > 0.1) { // Threshold for significant peaks
        const freq = freqs[i];
        if (freq > 100 && freq < 4000) { // Typical formant range
          formants.push(freq);
        }
      }
    }
    
    return formants.slice(0, 5); // Return first 5 formants
  };

  // Calculate prediction gain
  const calculatePredictionGain = (signal: Float32Array, residual: Float32Array): number => {
    let signalPower = 0;
    let residualPower = 0;
    
    for (let i = 0; i < signal.length; i++) {
      signalPower += signal[i] * signal[i];
      residualPower += residual[i] * residual[i];
    }
    
    if (residualPower === 0) return 0;
    return 10 * Math.log10(signalPower / residualPower);
  };

  // Calculate predictability score (0-1, higher = more predictable)
  const calculatePredictability = (predictionGain: number): number => {
    // Normalize prediction gain to 0-1 scale
    // Typical range is 0-30 dB for speech/breath
    return Math.min(1, Math.max(0, predictionGain / 30));
  };

  // Main LPC analysis (responsive to audio changes)
  useEffect(() => {
    // Only process if expanded (performance optimization)
    if (isExpanded && audioData.timeDomain.length > 0) {
      // Add debug logging to see if this is triggering
      console.log('LPC: Received new audio data, length:', audioData.timeDomain.length, 'Counter:', updateCounter);
      
      // Force a counter update to ensure we're getting new data
      setUpdateCounter(prev => prev + 1);
      
      // Run analysis immediately without throttling for testing
      setIsProcessing(true);
      console.log('LPC: Starting analysis...');
      try {
        // Use optimized window for better responsiveness
        const windowSize = Math.min(256, audioData.timeDomain.length);
        const signal = normalizeAudioData(audioData.timeDomain.slice(0, windowSize));
        
        // Reduce order for faster computation if signal is short
        const effectiveOrder = Math.min(lpcOrder, Math.floor(windowSize / 4));
        
        // Calculate autocorrelation
        const autocorr = calculateAutocorrelation(signal, effectiveOrder);
        
        // Apply LPC analysis with error handling
        const { coefficients, error } = levinsonDurbin(autocorr, effectiveOrder);
        
        // Only calculate other features if coefficients are valid
        if (coefficients.length > 0 && coefficients.some(c => !isNaN(c) && isFinite(c))) {
          // Calculate residual (simplified)
          const residual = calculateResidual(signal, coefficients);
          
          // Find formants (simplified)
          const formants = findFormants(coefficients, audioData.sampleRate);
          
          // Calculate prediction gain
          const predictionGain = calculatePredictionGain(signal, residual);
          
          // Calculate predictability
          const predictability = calculatePredictability(predictionGain);
          
          setLpcResults({
            coefficients,
            residual: Array.from(residual.slice(0, 100)), // Limit residual size
            predictionGain: isFinite(predictionGain) ? predictionGain : 0,
            formants: formants.filter(f => isFinite(f)),
            predictability: isFinite(predictability) ? predictability : 0
          });
          console.log('LPC: Analysis complete - Gain:', predictionGain.toFixed(2), 'Formants:', formants.length);
        } else {
          // Fallback for invalid coefficients
          setLpcResults({
            coefficients: new Array(effectiveOrder).fill(0),
            residual: [],
            predictionGain: 0,
            formants: [],
            predictability: 0
          });
        }
      } catch (error) {
        console.warn('LPC analysis error:', error);
        // Set fallback results
        setLpcResults({
          coefficients: new Array(lpcOrder).fill(0),
          residual: [],
          predictionGain: 0,
          formants: [],
          predictability: 0
        });
      } finally {
        setIsProcessing(false);
      }
    }
  }, [isExpanded, audioData.timeDomain, audioData.sampleRate, lpcOrder]);

  return (
    <div style={{
      marginBottom: '3rem',
      padding: '2rem',
      background: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 165, 0, 0.3)'
    }}>
      <div 
        onClick={toggleExpanded}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}
      >
        <h2 style={{
          color: '#ffa500',
          fontSize: '1.5rem',
          margin: 0,
          fontWeight: 'bold'
        }}>
          🎯 Linear Predictive Coding (LPC) Analysis {isProcessing && <span style={{ color: '#00ff88', fontSize: '0.8rem' }}>⚡ Processing...</span>}
        </h2>
        <div style={{
          fontSize: '1.2rem',
          color: '#999',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}>
          ▼
        </div>
      </div>
      
      {/* Collapsed state - show basic info */}
      {!isExpanded && (
        <div 
          onClick={toggleExpanded}
          style={{
            padding: '1rem',
            background: 'rgba(255, 165, 0, 0.1)',
            borderRadius: '8px',
            color: '#999',
            textAlign: 'center',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 165, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)';
          }}
        >
          Click to expand advanced LPC analysis (CPU intensive)
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <>
          {/* Controls */}
          <div style={{
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {/* LPC Order Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ color: '#ffa500', fontWeight: 'bold' }}>LPC Order:</label>
          <input
            type="range"
            min="6"
            max="20"
            value={lpcOrder}
            onChange={(e) => setLpcOrder(parseInt(e.target.value))}
            style={{ width: '100px' }}
          />
          <span style={{ color: '#ffffff', minWidth: '30px' }}>{lpcOrder}</span>
        </div>
        
        {/* Analysis Mode Selector */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.25rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px'
        }}>
          {[
            { key: 'coefficients', label: '📊 Coefficients', color: '#ff6b6b' },
            { key: 'residual', label: '📈 Residual', color: '#4ecdc4' },
            { key: 'formants', label: '🎵 Formants', color: '#45b7d1' },
            { key: 'prediction', label: '🔮 Prediction', color: '#96ceb4' }
          ].map(mode => (
            <button
              key={mode.key}
              onClick={() => setAnalysisMode(mode.key as any)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: analysisMode === mode.key ? mode.color : 'rgba(255, 255, 255, 0.1)',
                color: analysisMode === mode.key ? '#000' : '#fff',
                cursor: 'pointer',
                fontWeight: analysisMode === mode.key ? 'bold' : 'normal',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visualization */}
      <div style={{ marginBottom: '1rem' }}>
        <LPCAnalysisVisualizer 
          timeDomain={audioData.timeDomain}
          lpcResults={lpcResults}
          analysisMode={analysisMode}
          sampleRate={audioData.sampleRate}
          isProcessing={isProcessing}
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
          <h3 style={{ color: '#ffa500', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            What is {analysisMode === 'coefficients' ? 'LPC Coefficients' : 
                     analysisMode === 'residual' ? 'Prediction Residual' :
                     analysisMode === 'formants' ? 'Formant Analysis' : 'Prediction Quality'}?
          </h3>
          
          {analysisMode === 'coefficients' && (
            <div style={{ color: '#cccccc', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <p><strong>LPC Coefficients</strong> model how each audio sample relates to previous samples.</p>
              <p>They represent the "vocal tract filter" - perfect for analyzing breath and speech patterns.</p>
              <div style={{ 
                background: 'rgba(255, 107, 107, 0.1)', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginTop: '1rem',
                border: '1px solid rgba(255, 107, 107, 0.3)'
              }}>
                <strong style={{ color: '#ff6b6b' }}>Formula:</strong><br/>
                s[n] ≈ -a₁×s[n-1] - a₂×s[n-2] - ... - aₚ×s[n-p]
              </div>
            </div>
          )}

          {analysisMode === 'residual' && (
            <div style={{ color: '#cccccc', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <p><strong>Prediction Residual</strong> is what the LPC model couldn't predict.</p>
              <p>Low residual = predictable patterns (steady breathing). High residual = unpredictable (onset, noise).</p>
              <div style={{ 
                background: 'rgba(78, 205, 196, 0.1)', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginTop: '1rem',
                border: '1px solid rgba(78, 205, 196, 0.3)'
              }}>
                <strong style={{ color: '#4ecdc4' }}>Formula:</strong><br/>
                residual[n] = actual[n] - predicted[n]
              </div>
            </div>
          )}

          {analysisMode === 'formants' && (
            <div style={{ color: '#cccccc', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <p><strong>Formants</strong> are resonant frequencies of the vocal tract from LPC analysis.</p>
              <p>Different for speech vs breathing. Inhale/exhale have distinct formant patterns.</p>
              <div style={{ 
                background: 'rgba(69, 183, 209, 0.1)', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginTop: '1rem',
                border: '1px solid rgba(69, 183, 209, 0.3)'
              }}>
                <strong style={{ color: '#45b7d1' }}>Breath vs Speech:</strong><br/>
                Breath: Lower, broader formants<br/>
                Speech: Sharp, well-defined formants
              </div>
            </div>
          )}

          {analysisMode === 'prediction' && (
            <div style={{ color: '#cccccc', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <p><strong>Prediction Quality</strong> shows how well LPC models the signal.</p>
              <p>High predictability = steady breathing. Low = chaotic breathing or speech.</p>
              <div style={{ 
                background: 'rgba(150, 206, 180, 0.1)', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginTop: '1rem',
                border: '1px solid rgba(150, 206, 180, 0.3)'
              }}>
                <strong style={{ color: '#96ceb4' }}>Prediction Gain:</strong><br/>
                High gain = model works well (predictable signal)<br/>
                Low gain = signal is noisy/unpredictable
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
            <h4 style={{ color: '#ffffff', marginBottom: '0.8rem' }}>📊 Live LPC Metrics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.9rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(255, 165, 0, 0.1)', borderRadius: '6px' }}>
                <strong style={{ color: '#ffa500' }}>Order:</strong><br/>
                {lpcOrder} coefficients
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(150, 206, 180, 0.1)', borderRadius: '6px' }}>
                <strong style={{ color: '#96ceb4' }}>Gain:</strong><br/>
                {lpcResults.predictionGain.toFixed(1)} dB
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(69, 183, 209, 0.1)', borderRadius: '6px' }}>
                <strong style={{ color: '#45b7d1' }}>Formants:</strong><br/>
                {lpcResults.formants.length} found
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '6px' }}>
                <strong style={{ color: '#ff6b6b' }}>Predictability:</strong><br/>
                {(lpcResults.predictability * 100).toFixed(0)}%
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
              <div style={{ marginBottom: '0.3rem' }}>💨 <strong>Steady Breathing:</strong> High predictability, stable coefficients</div>
              <div style={{ marginBottom: '0.3rem' }}>🌪️ <strong>Breath Onset:</strong> High residual spikes at start</div>
              <div style={{ marginBottom: '0.3rem' }}>🗣️ <strong>Speech:</strong> Clear formant peaks, variable coefficients</div>
              <div style={{ marginBottom: '0.3rem' }}>🎵 <strong>Whistle:</strong> Very high predictability, single formant</div>
              <div style={{ marginBottom: '0.3rem' }}>👏 <strong>Clap:</strong> Very low predictability, high residual</div>
              <div>🔇 <strong>Adjust Order:</strong> Higher order = more detail, but noisier</div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}