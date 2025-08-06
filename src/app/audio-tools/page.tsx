'use client';

import { useState, useEffect, useRef } from 'react';

export default function AudioToolsPage() {
  const [isListening, setIsListening] = useState(false);
  const [audioData, setAudioData] = useState({
    timeDomain: new Uint8Array(0),
    frequencyDomain: new Uint8Array(0),
    sampleRate: 0,
    bufferSize: 0
  });

  // Audio processing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const isListeningRef = useRef<boolean>(false);

  const startAudioCapture = async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context
      audioContextRef.current = new AudioContext();
      const analyser = audioContextRef.current.createAnalyser();
      
      // Configure analyser
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      // Connect microphone to analyser
      const microphone = audioContextRef.current.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      // Store refs
      analyserRef.current = analyser;
      microphoneRef.current = microphone;
      
      setIsListening(true);
      isListeningRef.current = true;
      processAudio();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone: ' + (error as Error).message);
    }
  };

  const stopAudioCapture = () => {
    setIsListening(false);
    isListeningRef.current = false;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    // Reset audio data
    setAudioData({
      timeDomain: new Uint8Array(0),
      frequencyDomain: new Uint8Array(0),
      sampleRate: 0,
      bufferSize: 0
    });
  };

  const processAudio = () => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const bufferLength = analyserRef.current.fftSize;
    const timeDomainData = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    // Get both time and frequency domain data
    analyserRef.current.getByteTimeDomainData(timeDomainData);
    analyserRef.current.getByteFrequencyData(frequencyData);
    
    // Update state
    setAudioData({
      timeDomain: timeDomainData,
      frequencyDomain: frequencyData,
      sampleRate: audioContextRef.current.sampleRate,
      bufferSize: bufferLength
    });
    
    // Continue processing
    if (isListeningRef.current) {
      animationRef.current = requestAnimationFrame(processAudio);
    }
  };

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #0a0a0a, #1a1a2e)',
      color: '#ffffff',
      padding: '2rem',
      paddingTop: '6rem' // Added top padding for navbar
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '900',
          background: 'linear-gradient(45deg, #00ff88, #4488ff)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          marginBottom: '1rem'
        }}>
          🔬 Audio Analysis Tools
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: '#cccccc',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Scientific exploration of Web Audio API capabilities for understanding microphone input, 
          frequency analysis, and real-time audio processing.
        </p>
      </div>

      {/* Control Panel */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        <button
          onClick={isListening ? stopAudioCapture : startAudioCapture}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            background: isListening 
              ? 'linear-gradient(45deg, #ff6b6b, #ff4444)' 
              : 'linear-gradient(45deg, #00ff88, #4488ff)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          {isListening ? '🛑 Stop Audio Capture' : '🎤 Start Audio Capture'}
        </button>
      </div>

      {/* Audio Configuration Info */}
      {isListening && (
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto 3rem auto',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            color: '#ffffff',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            📊 Audio System Configuration
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              background: 'rgba(0, 255, 136, 0.05)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid rgba(0, 255, 136, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{ color: '#00ff88', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Sample Rate
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {audioData.sampleRate.toLocaleString()} Hz
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cccccc', lineHeight: '1.3' }}>
                How many times per second we capture audio data. Higher = better quality.
              </div>
            </div>

            <div style={{
              background: 'rgba(68, 136, 255, 0.05)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid rgba(68, 136, 255, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{ color: '#4488ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Buffer Size
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {audioData.bufferSize} samples
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cccccc', lineHeight: '1.3' }}>
                How many audio samples we analyze at once. Bigger = more detail, slower updates.
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 136, 68, 0.05)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid rgba(255, 136, 68, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{ color: '#ff8844', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Frequency Bins
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {audioData.frequencyDomain.length}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cccccc', lineHeight: '1.3' }}>
                Number of frequency "buckets" we can detect. More bins = finer frequency detail.
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 68, 136, 0.05)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid rgba(255, 68, 136, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{ color: '#ff4488', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Resolution
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {audioData.sampleRate && audioData.bufferSize 
                  ? (audioData.sampleRate / audioData.bufferSize).toFixed(1)
                  : '0'} Hz/bin
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cccccc', lineHeight: '1.3' }}>
                How precise each frequency bin is. Lower = we can distinguish closer frequencies.
              </div>
            </div>
          </div>
          
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#cccccc',
            textAlign: 'center'
          }}>
            💡 <strong>Why This Matters:</strong> These settings determine the quality and speed of our audio analysis. 
            Think of it like a microscope - higher resolution lets us see finer details, but takes more processing power.
          </div>
        </div>
      )}

      {/* Time Domain Section */}
      {isListening && (
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {/* Time Domain Explanation */}
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
        </div>
      )}

      {/* Getting Started Guide */}
      {!isListening && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{
            color: '#ffffff',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            🚀 Getting Started
          </h2>
          <ol style={{
            color: '#cccccc',
            lineHeight: '1.6',
            paddingLeft: '1.5rem'
          }}>
            <li>Click "Start Audio Capture" to access your microphone</li>
            <li>Grant microphone permissions when prompted</li>
            <li>Watch real-time visualizations of audio data</li>
            <li>Explore time domain (waveform) and frequency domain (spectrum) analysis</li>
            <li>Use these tools to understand how audio processing works</li>
          </ol>
        </div>
      )}
    </div>
  );
}

// Time Domain Visualizer Component
function TimeDomainVisualizer({ data }: { data: Uint8Array }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128; // Normalize to -1 to 1
      const y = (v * height / 2) + (height / 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={200}
      style={{
        width: '100%',
        height: '200px',
        border: '1px solid rgba(0, 255, 136, 0.3)',
        borderRadius: '8px'
      }}
    />
  );
}

// Frequency Domain Visualizer Component
function FrequencyDomainVisualizer({ 
  data, 
  sampleRate, 
  bufferSize 
}: { 
  data: Uint8Array;
  sampleRate: number;
  bufferSize: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Calculate frequency resolution
    const freqResolution = sampleRate / bufferSize;
    const maxFreq = sampleRate / 2; // Nyquist frequency

    // Draw frequency bars
    const barWidth = width / data.length;

    for (let i = 0; i < data.length; i++) {
      const barHeight = (data[i] / 255) * height;
      const freq = i * freqResolution;
      
      // Color coding by frequency range
      let color;
      if (freq < 500) {
        color = '#ff4444'; // Low frequencies - red
      } else if (freq < 2000) {
        color = '#ffff44'; // Mid frequencies - yellow
      } else {
        color = '#4488ff'; // High frequencies - blue
      }

      ctx.fillStyle = color;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
    }

    // Draw frequency labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    
    // Mark important frequency ranges
    const markers = [
      { freq: 100, label: '100Hz' },
      { freq: 500, label: '500Hz' },
      { freq: 1000, label: '1kHz' },
      { freq: 2000, label: '2kHz' },
      { freq: 5000, label: '5kHz' }
    ];

    markers.forEach(marker => {
      if (marker.freq <= maxFreq) {
        const x = (marker.freq / maxFreq) * width;
        ctx.fillText(marker.label, x, height - 5);
        
        // Draw vertical line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 20);
        ctx.stroke();
      }
    });

  }, [data, sampleRate, bufferSize]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={200}
      style={{
        width: '100%',
        height: '200px',
        border: '1px solid rgba(68, 136, 255, 0.3)',
        borderRadius: '8px'
      }}
    />
  );
}