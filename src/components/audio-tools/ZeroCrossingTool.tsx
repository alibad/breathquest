'use client';
import { useState, useEffect } from 'react';
import { ZeroCrossingVisualizer } from './ZeroCrossingVisualizer';

interface ZeroCrossingToolProps {
  audioData: {
    timeDomain: Uint8Array;
    frequencyDomain: Uint8Array;
    sampleRate: number;
    bufferSize: number;
  };
  canvasRef?: any;
}

interface ZeroCrossingStats {
  totalCrossings: number;
  crossingsPerSecond: number;
  averageSegmentLength: number;
  complexity: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  signalType: 'Silence' | 'Pure Tone' | 'Breath/Wind' | 'Voice/Speech' | 'Music' | 'Noise';
}

export function ZeroCrossingTool({ audioData, canvasRef }: ZeroCrossingToolProps) {
  const [zcrStats, setZcrStats] = useState<ZeroCrossingStats>({
    totalCrossings: 0,
    crossingsPerSecond: 0,
    averageSegmentLength: 0,
    complexity: 'Very Low',
    signalType: 'Silence'
  });
  const [crossingPositions, setCrossingPositions] = useState<number[]>([]);
  const [showCrossings, setShowCrossings] = useState(true);
  const [windowSize, setWindowSize] = useState<number>(512);

  const calculateZeroCrossingRate = (timeDomainData: Uint8Array, sampleRate: number) => {
    if (timeDomainData.length === 0) {
      return {
        totalCrossings: 0,
        crossingsPerSecond: 0,
        averageSegmentLength: 0,
        complexity: 'Very Low' as const,
        signalType: 'Silence' as const,
        crossingPositions: []
      };
    }

    const centerPoint = 128; // Middle point for 8-bit audio (0-255 range)
    let crossings = 0;
    const crossingPositions: number[] = [];
    let segmentLengths: number[] = [];
    let lastCrossing = 0;

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
          
          if (lastCrossing > 0) {
            segmentLengths.push(i - lastCrossing);
          }
          lastCrossing = i;
        }
      }
    }

    // Calculate rate per second
    const duration = windowSize / sampleRate;
    const crossingsPerSecond = duration > 0 ? crossings / duration : 0;

    // Calculate average segment length
    const averageSegmentLength = segmentLengths.length > 0 
      ? segmentLengths.reduce((a, b) => a + b, 0) / segmentLengths.length 
      : 0;

    // Classify complexity based on ZCR
    let complexity: ZeroCrossingStats['complexity'];
    if (crossingsPerSecond < 50) complexity = 'Very Low';
    else if (crossingsPerSecond < 200) complexity = 'Low';
    else if (crossingsPerSecond < 500) complexity = 'Medium';
    else if (crossingsPerSecond < 1000) complexity = 'High';
    else complexity = 'Very High';

    // Classify signal type based on ZCR patterns
    let signalType: ZeroCrossingStats['signalType'];
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
      averageSegmentLength: Math.round(averageSegmentLength * 10) / 10,
      complexity,
      signalType,
      crossingPositions
    };
  };

  useEffect(() => {
    if (audioData.timeDomain.length > 0) {
      const result = calculateZeroCrossingRate(audioData.timeDomain, audioData.sampleRate);
      setZcrStats({
        totalCrossings: result.totalCrossings,
        crossingsPerSecond: result.crossingsPerSecond,
        averageSegmentLength: result.averageSegmentLength,
        complexity: result.complexity,
        signalType: result.signalType
      });
      setCrossingPositions(result.crossingPositions);
    }
  }, [audioData.timeDomain, audioData.sampleRate, windowSize]);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Very Low': return '#6B7280';
      case 'Low': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'High': return '#EF4444';
      case 'Very High': return '#8B5CF6';
      default: return '#9CA3AF';
    }
  };

  const getSignalTypeColor = (signalType: string) => {
    switch (signalType) {
      case 'Silence': return '#4B5563';
      case 'Pure Tone': return '#10B981';
      case 'Breath/Wind': return '#06B6D4';
      case 'Voice/Speech': return '#F59E0B';
      case 'Music': return '#8B5CF6';
      case 'Noise': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  return (
    <div style={{ 
      marginBottom: '2rem',
      padding: '1.5rem',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h2 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        ⚡ Zero Crossing Rate Analysis
      </h2>

      {/* Controls */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
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
              style={{ accentColor: '#10B981' }}
            />
            Show Crossing Points
          </label>
        </div>
      </div>

      {/* Full-width Visualizer */}
      <div style={{ marginBottom: '1.5rem' }}>
        <ZeroCrossingVisualizer 
          data={audioData.timeDomain.slice(0, windowSize)}
          crossingPositions={crossingPositions}
          showCrossings={showCrossings}
          canvasRef={canvasRef}
        />
      </div>

      {/* Two Column Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '2rem',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Concepts & Theory */}
        <div>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#F3F4F6',
            borderBottom: '2px solid rgba(16, 185, 129, 0.3)',
            paddingBottom: '0.5rem'
          }}>
            🎯 Concepts &amp; Theory
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#E5E7EB', marginBottom: '0.5rem' }}>
              What is Zero Crossing Rate?
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#D1D5DB', lineHeight: '1.5', marginBottom: '0.8rem' }}>
              Zero Crossing Rate (ZCR) counts how many times per second a signal changes from positive to negative 
              (or vice versa). It's a simple but powerful measure of signal complexity and frequency content.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#E5E7EB', marginBottom: '0.5rem' }}>
              Why is ZCR Useful?
            </h4>
            <div style={{ fontSize: '0.85rem', color: '#D1D5DB', lineHeight: '1.4' }}>
              • <strong>Fast Computation:</strong> Very efficient to calculate in real-time<br/>
              • <strong>Speech Detection:</strong> High ZCR indicates voiced sounds, low ZCR indicates breath<br/>
              • <strong>Noise Classification:</strong> Different sound types have characteristic ZCR ranges<br/>
              • <strong>Music Analysis:</strong> Helps distinguish between instruments and vocals
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#E5E7EB', marginBottom: '0.5rem' }}>
              ZCR Formula
            </h4>
            <div style={{ 
              padding: '0.8rem', 
              background: 'rgba(0, 0, 0, 0.3)', 
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#A5B4FC'
            }}>
              ZCR = (1/2) × Σ |sign(x[n]) - sign(x[n-1])|<br/>
              Rate = ZCR × (sampleRate / windowSize)
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#E5E7EB', marginBottom: '0.5rem' }}>
              Typical ZCR Ranges
            </h4>
            <div style={{ fontSize: '0.8rem', color: '#D1D5DB', lineHeight: '1.3' }}>
              • <strong>Silence:</strong> &lt;10 crossings/sec<br/>
              • <strong>Pure Tones:</strong> 10-50 crossings/sec<br/>
              • <strong>Breath/Wind:</strong> 50-150 crossings/sec<br/>
              • <strong>Voice/Speech:</strong> 150-400 crossings/sec<br/>
              • <strong>Music:</strong> 400-800 crossings/sec<br/>
              • <strong>Noise:</strong> &gt;800 crossings/sec
            </div>
          </div>
        </div>

        {/* Right Column: Live Data & Metrics */}
        <div>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#F3F4F6',
            borderBottom: '2px solid rgba(6, 182, 212, 0.3)',
            paddingBottom: '0.5rem'
          }}>
            📊 Live Analysis &amp; Metrics
          </h3>

          {/* Main Metrics */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '0.8rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ 
              padding: '1rem', 
              background: 'rgba(16, 185, 129, 0.1)', 
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#A7F3D0', marginBottom: '0.3rem' }}>Zero Crossings</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10B981' }}>
                {zcrStats.totalCrossings}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6EE7B7' }}>in current window</div>
            </div>
            
            <div style={{ 
              padding: '1rem', 
              background: 'rgba(6, 182, 212, 0.1)', 
              borderRadius: '8px',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#A5F3FC', marginBottom: '0.3rem' }}>Crossings/Second</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#06B6D4' }}>
                {zcrStats.crossingsPerSecond}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#67E8F9' }}>Hz equivalent</div>
            </div>
          </div>

          {/* Classification Results */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#E5E7EB', marginBottom: '0.8rem' }}>
              Signal Classification
            </h4>
            
            <div style={{ 
              padding: '0.8rem', 
              background: `${getSignalTypeColor(zcrStats.signalType)}20`,
              borderRadius: '8px',
              border: `1px solid ${getSignalTypeColor(zcrStats.signalType)}40`,
              marginBottom: '0.8rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#F3F4F6' }}>
                  Signal Type:
                </span>
                <span style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 'bold', 
                  color: getSignalTypeColor(zcrStats.signalType)
                }}>
                  {zcrStats.signalType}
                </span>
              </div>
            </div>

            <div style={{ 
              padding: '0.8rem', 
              background: `${getComplexityColor(zcrStats.complexity)}20`,
              borderRadius: '8px',
              border: `1px solid ${getComplexityColor(zcrStats.complexity)}40`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#F3F4F6' }}>
                  Complexity:
                </span>
                <span style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 'bold', 
                  color: getComplexityColor(zcrStats.complexity)
                }}>
                  {zcrStats.complexity}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#E5E7EB', marginBottom: '0.8rem' }}>
              Detailed Statistics
            </h4>
            
            <div style={{ 
              padding: '0.8rem', 
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '0.5rem',
                fontSize: '0.85rem'
              }}>
                <span style={{ color: '#D1D5DB' }}>Avg Segment Length:</span>
                <span style={{ color: '#F3F4F6', fontWeight: '600' }}>
                  {zcrStats.averageSegmentLength} samples
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '0.5rem',
                fontSize: '0.85rem'
              }}>
                <span style={{ color: '#D1D5DB' }}>Window Size:</span>
                <span style={{ color: '#F3F4F6', fontWeight: '600' }}>
                  {windowSize} samples
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '0.85rem'
              }}>
                <span style={{ color: '#D1D5DB' }}>Analysis Duration:</span>
                <span style={{ color: '#F3F4F6', fontWeight: '600' }}>
                  {((windowSize / audioData.sampleRate) * 1000).toFixed(1)}ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Try These Experiments */}
      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          color: '#F59E0B', 
          marginBottom: '1rem' 
        }}>
          🧪 Try These Experiments
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '0.8rem' 
        }}>
          <div style={{ padding: '0.6rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px' }}>
            <strong>🫁 Breath vs Speech</strong><br/>
            <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Breathe quietly vs speak - notice ZCR difference (low vs high)</span>
          </div>
          <div style={{ padding: '0.6rem', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '6px' }}>
            <strong>🎵 Whistle Pure Tones</strong><br/>
            <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Whistle a steady note - see very low, consistent ZCR</span>
          </div>
          <div style={{ padding: '0.6rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '6px' }}>
            <strong>📻 Environmental Sounds</strong><br/>
            <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Try rustling paper, typing, or music - watch ZCR patterns</span>
          </div>
        </div>
      </div>
    </div>
  );
}