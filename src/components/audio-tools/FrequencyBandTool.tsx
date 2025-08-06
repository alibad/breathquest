'use client';
import { useState, useEffect, useCallback } from 'react';
import { FrequencyBandVisualizer } from './FrequencyBandVisualizer';

interface FrequencyBandToolProps {
  audioData: {
    timeDomain: Uint8Array;
    frequencyDomain: Uint8Array;
    sampleRate: number;
    bufferSize: number;
  };
  canvasRef?: any;
}

interface FrequencyBand {
  name: string;
  min: number;
  max: number;
  color: string;
  description: string;
}

const PREDEFINED_BAND_SETS = {
  breath: [
    { name: 'Sub-Low', min: 50, max: 150, color: '#8B5CF6', description: 'Deep breath resonance' },
    { name: 'Low', min: 150, max: 300, color: '#3B82F6', description: 'Primary breath energy' },
    { name: 'Low-Mid', min: 300, max: 500, color: '#06B6D4', description: 'Breath turbulence' },
    { name: 'Mid', min: 500, max: 800, color: '#10B981', description: 'Breath flow noise' },
    { name: 'Mid-High', min: 800, max: 1200, color: '#F59E0B', description: 'Breath friction' },
    { name: 'High', min: 1200, max: 2000, color: '#EF4444', description: 'Sharp breath features' },
    { name: 'Very High', min: 2000, max: 4000, color: '#F97316', description: 'Breath harmonics' },
    { name: 'Ultra High', min: 4000, max: 8000, color: '#9CA3AF', description: 'Environmental noise' }
  ],
  music: [
    { name: 'Sub Bass', min: 20, max: 60, color: '#4C1D95', description: 'Deep bass foundation' },
    { name: 'Bass', min: 60, max: 250, color: '#1E40AF', description: 'Bass frequencies' },
    { name: 'Low Mid', min: 250, max: 500, color: '#0369A1', description: 'Low midrange' },
    { name: 'Mid', min: 500, max: 2000, color: '#059669', description: 'Midrange vocals' },
    { name: 'High Mid', min: 2000, max: 4000, color: '#D97706', description: 'Presence range' },
    { name: 'High', min: 4000, max: 8000, color: '#DC2626', description: 'Brightness' },
    { name: 'Very High', min: 8000, max: 16000, color: '#7C2D12', description: 'Air and sparkle' }
  ],
  voice: [
    { name: 'Fundamental', min: 80, max: 250, color: '#6366F1', description: 'Voice pitch range' },
    { name: 'Formant 1', min: 250, max: 800, color: '#8B5CF6', description: 'Vowel clarity' },
    { name: 'Formant 2', min: 800, max: 2500, color: '#EC4899', description: 'Vowel distinction' },
    { name: 'Consonants', min: 2500, max: 4000, color: '#F59E0B', description: 'Consonant clarity' },
    { name: 'Fricatives', min: 4000, max: 8000, color: '#EF4444', description: 'Sibilant sounds' }
  ]
};

export function FrequencyBandTool({ audioData, canvasRef }: FrequencyBandToolProps) {
  const [bandSet, setBandSet] = useState<'breath' | 'music' | 'voice'>('breath');
  const [bandEnergies, setBandEnergies] = useState<number[]>([]);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [dominantBand, setDominantBand] = useState<string>('');

  const bands = PREDEFINED_BAND_SETS[bandSet];

  const calculateBandEnergies = useCallback((frequencyData: Uint8Array, sampleRate: number) => {
    const nyquist = sampleRate / 2;
    const binCount = frequencyData.length;
    const energies: number[] = [];
    let totalEnergySum = 0;

    bands.forEach(band => {
      const startBin = Math.floor((band.min / nyquist) * binCount);
      const endBin = Math.floor((band.max / nyquist) * binCount);
      
      let bandEnergy = 0;
      for (let i = startBin; i <= endBin && i < binCount; i++) {
        const magnitude = frequencyData[i] / 255.0; // Normalize to 0-1
        bandEnergy += magnitude * magnitude; // Energy = magnitude squared
      }
      
      // Normalize by number of bins in the band
      const binCount_band = Math.max(1, endBin - startBin + 1);
      bandEnergy = bandEnergy / binCount_band;
      
      energies.push(bandEnergy);
      totalEnergySum += bandEnergy;
    });

    return { energies, totalEnergy: totalEnergySum };
  }, [bands]);

  useEffect(() => {
    if (audioData.frequencyDomain.length > 0) {
      const { energies, totalEnergy: total } = calculateBandEnergies(
        audioData.frequencyDomain, 
        audioData.sampleRate
      );
      
      setBandEnergies(energies);
      setTotalEnergy(total);
      
      // Find dominant band
      const maxEnergyIndex = energies.indexOf(Math.max(...energies));
      setDominantBand(bands[maxEnergyIndex]?.name || '');
    }
  }, [audioData.frequencyDomain, audioData.sampleRate, bandSet]);

  const getBandPercentage = (energy: number) => {
    return totalEnergy > 0 ? (energy / totalEnergy) * 100 : 0;
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        📊 Multi-Band Frequency Analysis
      </h2>

      {/* Band Set Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.9rem', 
          fontWeight: '600',
          color: '#e5e7eb'
        }}>
          Analysis Mode:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.keys(PREDEFINED_BAND_SETS).map((set) => (
            <button
              key={set}
              onClick={() => setBandSet(set as keyof typeof PREDEFINED_BAND_SETS)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                background: bandSet === set ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                color: bandSet === set ? '#A5B4FC' : '#D1D5DB',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'capitalize'
              }}
            >
              {set} Analysis
            </button>
          ))}
        </div>
      </div>

      {/* Full-width Visualizer */}
      <div style={{ marginBottom: '1.5rem' }}>
        <FrequencyBandVisualizer 
          bands={bands}
          bandEnergies={bandEnergies}
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
            borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
            paddingBottom: '0.5rem'
          }}>
            🎯 Concepts &amp; Theory
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#E5E7EB', marginBottom: '0.5rem' }}>
              What is Multi-Band Analysis?
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#D1D5DB', lineHeight: '1.5', marginBottom: '0.8rem' }}>
              Multi-band frequency analysis divides the audio spectrum into specific frequency ranges (bands) 
              and measures the energy in each band. This reveals which frequency ranges are most active.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#E5E7EB', marginBottom: '0.5rem' }}>
              Why Use Band Analysis?
            </h4>
            <div style={{ fontSize: '0.85rem', color: '#D1D5DB', lineHeight: '1.4' }}>
              • <strong>Pattern Recognition:</strong> Different sounds have unique frequency signatures<br/>
              • <strong>Noise Filtering:</strong> Isolate relevant frequency ranges from noise<br/>
              • <strong>Feature Extraction:</strong> Create frequency-based features for classification<br/>
              • <strong>Audio Profiling:</strong> Understand the spectral characteristics of sounds
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#E5E7EB', marginBottom: '0.5rem' }}>
              Band Energy Calculation
            </h4>
            <div style={{ 
              padding: '0.8rem', 
              background: 'rgba(0, 0, 0, 0.3)', 
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#A5B4FC'
            }}>
              Energy = Σ(magnitude²) / bin_count<br/>
              Percentage = (band_energy / total_energy) × 100
            </div>
          </div>
        </div>

        {/* Right Column: Live Data & Interaction */}
        <div>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#F3F4F6',
            borderBottom: '2px solid rgba(34, 197, 94, 0.3)',
            paddingBottom: '0.5rem'
          }}>
            📈 Live Analysis &amp; Metrics
          </h3>

          {/* Live Metrics */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '0.8rem',
              marginBottom: '1rem'
            }}>
              <div style={{ 
                padding: '0.8rem', 
                background: 'rgba(34, 197, 94, 0.1)', 
                borderRadius: '6px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#A7F3D0', marginBottom: '0.2rem' }}>Total Energy</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10B981' }}>
                  {totalEnergy.toFixed(3)}
                </div>
              </div>
              
              <div style={{ 
                padding: '0.8rem', 
                background: 'rgba(99, 102, 241, 0.1)', 
                borderRadius: '6px',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#C7D2FE', marginBottom: '0.2rem' }}>Dominant Band</div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#A5B4FC' }}>
                  {dominantBand || 'None'}
                </div>
              </div>
            </div>
          </div>

          {/* Band Energy Details */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#E5E7EB', marginBottom: '0.8rem' }}>
              Band Energy Distribution
            </h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {bands.map((band, index) => {
                const energy = bandEnergies[index] || 0;
                const percentage = getBandPercentage(energy);
                const isActive = energy > 0.01; // Threshold for "active" band
                
                return (
                  <div 
                    key={band.name}
                    style={{ 
                      marginBottom: '0.8rem',
                      padding: '0.6rem',
                      background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '6px',
                      border: isActive ? `1px solid ${band.color}40` : '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: '600', 
                        color: band.color 
                      }}>
                        {band.name}
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: isActive ? '#F3F4F6' : '#9CA3AF',
                        fontWeight: isActive ? '600' : '400'
                      }}>
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#D1D5DB', marginBottom: '0.3rem' }}>
                      {band.min}-{band.max} Hz • {band.description}
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '4px', 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(100, percentage * 2)}%`, // Scale for visibility
                        height: '100%',
                        background: band.color,
                        transition: 'width 0.1s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
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
          <div style={{ padding: '0.6rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '6px' }}>
            <strong>🫁 Breath vs Speech</strong><br/>
            <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Switch to voice mode, then whisper vs breathe - notice the band differences</span>
          </div>
          <div style={{ padding: '0.6rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '6px' }}>
            <strong>🎵 Play Music</strong><br/>
            <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Switch to music mode and play different songs - see instrument separation</span>
          </div>
          <div style={{ padding: '0.6rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px' }}>
            <strong>🔊 Environmental Analysis</strong><br/>
            <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>Analyze room noise, air conditioning, or traffic - identify noise signatures</span>
          </div>
        </div>
      </div>
    </div>
  );
}