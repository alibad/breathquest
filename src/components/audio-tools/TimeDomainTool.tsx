'use client';

import { useState } from 'react';
import { TimeDomainVisualizer } from './TimeDomainVisualizer';
import { ZeroCrossingVisualizer } from './ZeroCrossingVisualizer';

interface TimeDomainToolProps {
  audioData: {
    timeDomain: Uint8Array;
    frequencyDomain: Uint8Array;
    sampleRate: number;
    bufferSize: number;
  };
  canvasRef?: any;
}

export function TimeDomainTool({ audioData, canvasRef }: TimeDomainToolProps) {
  const [analysisMode, setAnalysisMode] = useState<'waveform' | 'zero_crossing'>('waveform');
  const [windowSize, setWindowSize] = useState<number>(512);
  const [showCrossings, setShowCrossings] = useState(true);
  
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

  const calculateZeroCrossingRate = (timeDomainData: Uint8Array, sampleRate: number) => {
    if (timeDomainData.length === 0) {
      return {
        totalCrossings: 0,
        crossingsPerSecond: 0,
        signalType: 'Silence' as const,
        crossingPositions: []
      };
    }

    const centerPoint = 128;
    let crossings = 0;
    const crossingPositions: number[] = [];

    // Convert to signed values and detect zero crossings
    for (let i = 1; i < Math.min(timeDomainData.length, windowSize); i++) {
      const prev = timeDomainData[i - 1] - centerPoint;
      const curr = timeDomainData[i] - centerPoint;

      // Check for sign change (zero crossing)
      if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
        // Only count if there's sufficient amplitude (avoid noise crossings)
        if (Math.abs(prev) > 2 || Math.abs(curr) > 2) {
          crossings++;
          crossingPositions.push(i);
        }
      }
    }

    // Calculate rate per second
    const duration = windowSize / sampleRate;
    const crossingsPerSecond = duration > 0 ? crossings / duration : 0;

    // Classify signal type based on ZCR patterns
    let signalType: string;
    if (crossingsPerSecond < 10) {
      signalType = 'Silence';
    } else if (crossingsPerSecond < 50) {
      signalType = 'Pure Tone';
    } else if (crossingsPerSecond < 150) {
      signalType = 'Breath/Wind';
    } else if (crossingsPerSecond < 400) {
      signalType = 'Voice/Speech';
    } else if (crossingsPerSecond < 800) {
      signalType = 'Music';
    } else {
      signalType = 'Noise';
    }

    return {
      totalCrossings: crossings,
      crossingsPerSecond: Math.round(crossingsPerSecond),
      signalType,
      crossingPositions
    };
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
        {analysisMode === 'waveform' ? '⏱️ Time Domain Analysis' : '⚡ Zero Crossing Rate Analysis'}
      </h2>

      {/* Mode Switcher */}
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', gap: '0.5rem', padding: '0.25rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px' }}>
          <button
            onClick={() => setAnalysisMode('waveform')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '6px',
              background: analysisMode === 'waveform' ? 'rgba(0, 255, 136, 0.3)' : 'transparent',
              color: analysisMode === 'waveform' ? '#00ff88' : '#cccccc',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ⏱️ Waveform
          </button>
          <button
            onClick={() => setAnalysisMode('zero_crossing')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '6px',
              background: analysisMode === 'zero_crossing' ? 'rgba(0, 255, 136, 0.3)' : 'transparent',
              color: analysisMode === 'zero_crossing' ? '#00ff88' : '#cccccc',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ⚡ Zero Crossings
          </button>
        </div>
      </div>

      {/* Zero Crossing Controls (only show in zero crossing mode) */}
      {analysisMode === 'zero_crossing' && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.9rem', 
              fontWeight: '600',
              color: '#e5e7eb'
            }}>
              Analysis Window:
            </label>
            <select
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
              style={{
                padding: '0.5rem',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                borderRadius: '6px',
                background: 'rgba(0, 255, 136, 0.05)',
                color: '#D1D5DB',
                fontSize: '0.85rem'
              }}
            >
              <option value={256}>256 samples (~6ms)</option>
              <option value={512}>512 samples (~12ms)</option>
              <option value={1024}>1024 samples (~23ms)</option>
              <option value={2048}>2048 samples (~46ms)</option>
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.9rem', 
              fontWeight: '600',
              color: '#e5e7eb'
            }}>
              <input
                type="checkbox"
                checked={showCrossings}
                onChange={(e) => setShowCrossings(e.target.checked)}
                style={{ accentColor: '#00ff88' }}
              />
              Show Crossing Points
            </label>
          </div>
        </div>
      )}
      
      {/* Full-width Visualization */}
      <div style={{
        marginBottom: '1rem'
      }}>
        {analysisMode === 'waveform' ? (
          <TimeDomainVisualizer data={audioData.timeDomain} canvasRef={canvasRef} />
        ) : (
          <ZeroCrossingVisualizer 
            data={audioData.timeDomain.slice(0, windowSize)}
            crossingPositions={calculateZeroCrossingRate(audioData.timeDomain, audioData.sampleRate).crossingPositions}
            showCrossings={showCrossings}
            canvasRef={canvasRef}
          />
        )}
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
          <h3 style={{ color: '#00ff88', marginBottom: '1rem' }}>
            {analysisMode === 'waveform' ? 'What is Time Domain?' : 'What is Zero Crossing Rate?'}
          </h3>
          
          {analysisMode === 'waveform' ? (
            <>
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
            </>
          ) : (
            <>
              <p style={{ marginBottom: '1rem' }}>
                <strong>Zero Crossing Rate (ZCR)</strong> counts how many times per second a signal 
                changes from positive to negative (or vice versa). It's a simple but powerful 
                measure of signal complexity.
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li><strong>Red dots</strong> = Zero crossing points</li>
                <li><strong>Vertical lines</strong> = Connection to zero line</li>
                <li><strong>High ZCR</strong> = Complex/noisy signals</li>
                <li><strong>Low ZCR</strong> = Simple/pure signals</li>
              </ul>
              <p style={{ marginBottom: '1rem' }}>
                <strong>Why it matters:</strong> Different sounds have characteristic ZCR ranges.
                Breath has very low ZCR (~50-150/sec) while speech has higher ZCR (~150-400/sec).
              </p>
            </>
          )}
          
          {/* Conditional help sections */}
          {analysisMode === 'waveform' ? (
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
          ) : (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '1rem'
            }}>
              <strong style={{ color: '#10B981' }}>⚡ ZCR Formula</strong>
              <div style={{ 
                marginTop: '0.5rem',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: '#A5B4FC',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.8rem',
                borderRadius: '6px'
              }}>
                ZCR = (1/2) × Σ |sign(x[n]) - sign(x[n-1])|<br/>
                Rate = ZCR × (sampleRate / windowSize)
              </div>
              <p style={{ marginTop: '0.5rem', marginBottom: '0', fontSize: '0.85rem' }}>
                <strong>Typical ranges:</strong> Silence (&lt;10), Breath (50-150), Voice (150-400), Music (400-800), Noise (&gt;800) crossings/sec
              </p>
            </div>
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
            {analysisMode === 'waveform' ? (
              <>
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
              </>
            ) : (
              <>
                {(() => {
                  const zcrData = calculateZeroCrossingRate(audioData.timeDomain, audioData.sampleRate);
                  return (
                    <>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        padding: '1rem',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          Zero Crossings
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                          {zcrData.totalCrossings}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                          in current window
                        </div>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
            
            {analysisMode === 'waveform' ? (
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
            ) : (
              (() => {
                const zcrData = calculateZeroCrossingRate(audioData.timeDomain, audioData.sampleRate);
                return (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '1rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      Crossings/Second
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {zcrData.crossingsPerSecond}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#aaaaaa', marginTop: '0.3rem' }}>
                      {zcrData.signalType}
                    </div>
                  </div>
                );
              })()
            )}
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
              {analysisMode === 'waveform' ? (
                <>
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
                </>
              ) : (
                <>
                  <div style={{ padding: '0.6rem', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '6px' }}>
                    <strong>🫁 Breath vs Speech</strong><br/>
                    <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Breathe quietly vs speak - notice ZCR difference (low vs high)</span>
                  </div>
                  <div style={{ padding: '0.6rem', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '6px' }}>
                    <strong>🎵 Whistle Pure Tones</strong><br/>
                    <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Whistle a steady note - see very low, consistent ZCR</span>
                  </div>
                  <div style={{ padding: '0.6rem', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '6px' }}>
                    <strong>📻 Environmental Sounds</strong><br/>
                    <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Try rustling paper, typing, or music - watch ZCR patterns</span>
                  </div>
                  <div style={{ padding: '0.6rem', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '6px' }}>
                    <strong>🎚️ Window Size</strong><br/>
                    <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Change analysis window - shorter = more sensitive, longer = more stable</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}