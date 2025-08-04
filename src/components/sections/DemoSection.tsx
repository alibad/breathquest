'use client';

import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';
import { useState, useEffect, useRef } from 'react';

interface BreathState {
  type: 'normal' | 'inhale' | 'exhale' | 'hold';
  label: string;
  color: string;
  scale: number;
}

const DemoSection = () => {
  const sectionRef = useFadeInOnScroll();
  
  // React state instead of manual DOM manipulation
  const [isListening, setIsListening] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [showUI, setShowUI] = useState(false);
  const [breathState, setBreathState] = useState<BreathState>({
    type: 'normal',
    label: '🌬️ Normal Breathing',
    color: '#00ff88',
    scale: 1
  });
  const [audioData, setAudioData] = useState({
    amplitude: 0,
    baseline: 0,
    relative: 0,
    levelPercent: 0
  });
  
  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Processing variables
  const baselineRef = useRef(0);
  const calibrationCountRef = useRef(0);
  const amplitudeHistoryRef = useRef<number[]>([]);
  const lastStateRef = useRef('normal');
  const stateStartTimeRef = useRef(Date.now());
  const lastUpdateTimeRef = useRef(0);
  const smoothedAmplitudeRef = useRef(0);
  const lastDisplayedAmplitudeRef = useRef(0);

  const startBreathDemo = async () => {
    if (isListening) {
      stopDemo();
      return;
    }

    try {
      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        } 
      });
      
      console.log('✅ Microphone access granted!');
      console.log('🔧 Creating audio context...');
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if suspended (required for some browsers)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('🔄 Audio context resumed');
      }
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Better settings for breath detection
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8; // More smoothing
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      
      microphoneRef.current.connect(analyserRef.current);
      console.log('🔗 Microphone connected to analyser');
      
      // Reset calibration and smoothing variables
      baselineRef.current = 0;
      calibrationCountRef.current = 0;
      amplitudeHistoryRef.current = [];
      lastUpdateTimeRef.current = 0;
      smoothedAmplitudeRef.current = 0;
      lastDisplayedAmplitudeRef.current = 0;
      
      // Show UI and start
      setIsListening(true);
      setIsCalibrating(true);
      setShowUI(true);
      setCalibrationProgress(0);
      
      console.log('🚀 Starting breath detection...');
      detectBreath();
    } catch (error) {
      console.error('❌ Microphone error:', error);
      alert('Microphone access denied. Please allow microphone access and refresh the page.');
    }
  };

  const stopDemo = () => {
    setIsListening(false);
    setIsCalibrating(false);
    setShowUI(false);
    setCalibrationProgress(0);
    setBreathState({
      type: 'normal',
      label: '🌬️ Normal Breathing',
      color: '#00ff88',
      scale: 1
    });
    setAudioData({ amplitude: 0, baseline: 0, relative: 0, levelPercent: 0 });
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const detectBreath = () => {
    if (!isListening || !analyserRef.current) return;
    
    // Try both time domain and frequency domain for better detection
    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    const freqArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    analyserRef.current.getByteTimeDomainData(dataArray);
    analyserRef.current.getByteFrequencyData(freqArray);
    
    // Calculate RMS from time domain
    let sum = 0;
    let maxSample = 0;
    for (let i = 0; i < bufferLength; i++) {
      const sample = Math.abs((dataArray[i] - 128) / 128); // Normalize to 0 to 1
      sum += sample * sample;
      maxSample = Math.max(maxSample, sample);
    }
    const rms = Math.sqrt(sum / bufferLength);
    
    // Calculate average frequency power (more sensitive to breath)
    let freqSum = 0;
    const breathFreqRange = Math.min(100, freqArray.length); // Focus on low frequencies for breath
    for (let i = 0; i < breathFreqRange; i++) {
      freqSum += freqArray[i];
    }
    const avgFreqPower = freqSum / breathFreqRange;
    
    // Combine both methods for better detection
    const rawAmplitude = Math.max(rms * 100, avgFreqPower, maxSample * 50); // Multiple detection methods
    
    // Debug logging during calibration
    if (calibrationCountRef.current < 10) {
      console.log(`🔊 Audio Debug - RMS: ${rms.toFixed(4)}, FreqPower: ${avgFreqPower.toFixed(1)}, MaxSample: ${maxSample.toFixed(4)}, Combined: ${rawAmplitude.toFixed(2)}`);
    }
    
    // Smooth the amplitude to reduce flickering (exponential moving average)
    const smoothingFactor = 0.2; // Less smoothing for more responsiveness
    smoothedAmplitudeRef.current = (smoothingFactor * rawAmplitude) + ((1 - smoothingFactor) * smoothedAmplitudeRef.current);
    const amplitude = smoothedAmplitudeRef.current;
    
    const currentTime = Date.now();
    const shouldUpdateUI = currentTime - lastUpdateTimeRef.current > 100; // Update UI max every 100ms (10 FPS)
    
    // Calibration phase (first 60 samples) - always update during calibration
    if (calibrationCountRef.current < 60) {
      baselineRef.current += amplitude;
      calibrationCountRef.current++;
      
      // Always update calibration progress and show real-time data
      setCalibrationProgress(calibrationCountRef.current);
      const levelPercent = Math.min(100, (amplitude / 20) * 100); // More sensitive scaling
      setAudioData({
        amplitude: amplitude,
        baseline: baselineRef.current / Math.max(1, calibrationCountRef.current), // Show running average
        relative: 0,
        levelPercent: levelPercent
      });
      
      // Log calibration progress every 10 samples
      if (calibrationCountRef.current % 10 === 0) {
        console.log(`📊 Calibration ${calibrationCountRef.current}/60 - Amplitude: ${amplitude.toFixed(2)}, Running Baseline: ${(baselineRef.current / calibrationCountRef.current).toFixed(2)}`);
      }
      
      if (calibrationCountRef.current === 60) {
        baselineRef.current = baselineRef.current / 60;
        setIsCalibrating(false);
        console.log(`✅ Calibration complete! Final baseline: ${baselineRef.current.toFixed(2)}`);
      }
      animationRef.current = requestAnimationFrame(detectBreath);
      return;
    }
    
    // Add to amplitude history for trend analysis
    amplitudeHistoryRef.current.push(amplitude);
    if (amplitudeHistoryRef.current.length > 10) {
      amplitudeHistoryRef.current.shift();
    }
    
    // Calculate relative amplitude vs baseline
    const relativeAmplitude = amplitude - baselineRef.current;
    const trend = amplitudeHistoryRef.current.length >= 3 ? 
      amplitudeHistoryRef.current[amplitudeHistoryRef.current.length - 1] - amplitudeHistoryRef.current[amplitudeHistoryRef.current.length - 3] : 0;
    
    // Only update UI at reduced frequency
    if (shouldUpdateUI) {
      // Update audio data
      const levelPercent = Math.min(100, (amplitude / 50) * 100);
      if (Math.abs(amplitude - lastDisplayedAmplitudeRef.current) > 0.5) {
        setAudioData({
          amplitude: amplitude,
          baseline: baselineRef.current,
          relative: relativeAmplitude,
          levelPercent: levelPercent
        });
        lastDisplayedAmplitudeRef.current = amplitude;
      }
      
      // Determine breath state with more sensitive thresholds
      let newState: BreathState;
      let currentStateType = 'normal';
      
      if (relativeAmplitude > baselineRef.current * 0.8 && trend > 0.5) {
        newState = { type: 'exhale', label: '🔥 Sharp Exhale', color: '#ff8844', scale: 0.8 };
        currentStateType = 'exhale';
      } else if (relativeAmplitude > baselineRef.current * 0.4) {
        newState = { type: 'inhale', label: '💨 Deep Inhale', color: '#4488ff', scale: 1.4 };
        currentStateType = 'inhale';
      } else if (relativeAmplitude > baselineRef.current * 0.1) {
        newState = { type: 'normal', label: '🌬️ Normal Breathing', color: '#00ff88', scale: 1 };
        currentStateType = 'normal';
      } else {
        newState = { type: 'hold', label: '⏸️ Breath Hold', color: '#00ccff', scale: 1.1 };
        currentStateType = 'hold';
      }
      
      // Detect breath of fire (rapid exhales)
      if (currentStateType === 'exhale' && lastStateRef.current !== 'exhale' && Date.now() - stateStartTimeRef.current < 800) {
        newState = { type: 'exhale', label: '🔥 Breath of Fire', color: '#ff4444', scale: 1.4 };
      }
      
      // Update state tracking
      if (currentStateType !== lastStateRef.current) {
        lastStateRef.current = currentStateType;
        stateStartTimeRef.current = Date.now();
      }
      
      setBreathState(newState);
      lastUpdateTimeRef.current = currentTime;
    }
    
    animationRef.current = requestAnimationFrame(detectBreath);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  function getCharacterTransform() {
    if (!showUI) return 'translateY(0px) scale(1)';
    
    switch (breathState.type) {
      case 'inhale':
        return 'translateY(-100px) scale(1.4)';
      case 'exhale':
        return 'translateY(20px) scale(0.8)';
      case 'hold':
        return 'translateY(-20px) scale(1.1)';
      default:
        return 'translateY(0px) scale(1)';
    }
  }

  return (
    <section id="demo" className="demo-section" ref={sectionRef}>
      <h2>🎮 Breath Detection Demo</h2>
      <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>
        Test real-time breath detection using your microphone
      </p>
      
      {!showUI && (
        <div style={{
          fontSize: '1.2rem',
          fontWeight: 'bold',
          color: '#00ff88',
          marginBottom: '2rem',
          textAlign: 'center',
          padding: '1rem',
          background: 'rgba(0, 255, 136, 0.1)',
          borderRadius: '12px',
          border: '2px solid rgba(0, 255, 136, 0.3)'
        }}>
          🎮 Control a game character with your breath
        </div>
      )}
      
      {isCalibrating && (
        <div style={{
          fontSize: '1.1rem',
          color: '#ffaa00',
          marginBottom: '1rem',
          textAlign: 'center',
          padding: '1rem',
          background: 'rgba(255, 170, 0, 0.1)',
          borderRadius: '12px',
          border: '2px solid rgba(255, 170, 0, 0.3)',
          fontWeight: 'bold'
        }}>
          🔧 Calibrating microphone... breathe normally ({calibrationProgress}/60)
        </div>
      )}
      
      <div className="demo-preview" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Audio Level Meter - Only show when listening */}
        {showUI && (
          <div style={{
            width: '100%',
            maxWidth: '800px',
            marginBottom: '1.5rem',
            padding: '1.5rem',
            background: 'rgba(0, 20, 40, 0.9)',
            borderRadius: '12px',
            border: '2px solid rgba(0, 255, 136, 0.4)',
            boxShadow: '0 8px 32px rgba(0, 255, 136, 0.2)'
          }}>
            <div style={{ 
              fontSize: '1rem', 
              marginBottom: '1rem', 
              color: '#00ff88',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              🎤 Live Audio Input
            </div>
            
            {/* Raw Amplitude Bar */}
            <div style={{
              width: '100%',
              height: '24px',
              background: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '1rem',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${audioData.levelPercent}%`,
                background: audioData.levelPercent > 80 ? 'linear-gradient(to right, #ff4444, #ff8844)' :
                          audioData.levelPercent > 40 ? 'linear-gradient(to right, #ffff00, #ff8844)' :
                          audioData.levelPercent > 10 ? 'linear-gradient(to right, #00ff88, #ffff00)' :
                          'linear-gradient(to right, #004400, #00ff88)',
                transition: 'width 0.1s ease',
                borderRadius: '10px',
                boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)'
              }}></div>
            </div>
            
            {/* Audio Data Display */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1rem',
              fontSize: '0.9rem',
              color: '#ccc',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ color: '#00ff88', fontWeight: 'bold' }}>Amplitude</div>
                <div>{audioData.amplitude.toFixed(1)}</div>
              </div>
              <div>
                <div style={{ color: '#00ccff', fontWeight: 'bold' }}>Baseline</div>
                <div>{audioData.baseline.toFixed(1)}</div>
              </div>
              <div>
                <div style={{ color: '#ff8844', fontWeight: 'bold' }}>Relative</div>
                <div>{audioData.relative.toFixed(1)}</div>
              </div>
              <div>
                <div style={{ color: isCalibrating ? '#ffaa00' : '#00ff88', fontWeight: 'bold' }}>Status</div>
                <div style={{ color: isCalibrating ? '#ffaa00' : '#00ff88' }}>
                  {isCalibrating ? `Calibrating ${calibrationProgress}/60` : 'Ready!'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Preview */}
        <div style={{
          width: '100%',
          maxWidth: '1000px',
          height: '70vh',
          minHeight: '500px',
          background: 'linear-gradient(to bottom, #001122, #002244)',
          borderRadius: '24px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '1rem',
          border: '3px solid rgba(0, 255, 136, 0.6)',
          boxShadow: '0 20px 60px rgba(0, 255, 136, 0.3), inset 0 0 100px rgba(0, 255, 136, 0.1)',
          margin: '0 auto 1rem auto'
        }}>
          {/* Ground */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            width: '100%',
            height: '120px',
            background: 'linear-gradient(to right, #00ff88, #00ccff)',
            opacity: '0.4'
          }}></div>
          
          {/* Character */}
          <div style={{
            position: 'absolute',
            bottom: '120px',
            left: '50%',
            width: '150px',
            height: '150px',
            background: breathState.color,
            borderRadius: '50%',
            transition: 'all 0.4s ease',
            boxShadow: `0 0 60px ${breathState.color}`,
            transform: `translateX(-50%) ${getCharacterTransform()}`,
            animation: !showUI ? 'breathe 3s ease-in-out infinite' : 'none'
          }}></div>
          
          {/* Instructions overlay */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'rgba(255, 255, 255, 0.9)',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.8)',
            textAlign: 'center'
          }}>
            💨 Breathe to Control
          </div>
          
          {/* Breath state display - Large and centered */}
          {showUI && (
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '2rem',
              fontWeight: 'bold',
              color: breathState.color,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
              textAlign: 'center'
            }}>
              {breathState.label}
            </div>
          )}
        </div>
        
        {/* Detection info - only show when listening */}
        {showUI && (
          <div style={{
            fontSize: '1.1rem',
            textAlign: 'center',
            width: '100%',
            maxWidth: '700px',
            background: 'rgba(0, 20, 40, 0.9)',
            padding: '2rem',
            borderRadius: '16px',
            border: '2px solid rgba(0, 255, 136, 0.4)',
            marginTop: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 32px rgba(0, 255, 136, 0.2)',
            lineHeight: '1.8'
          }}>
            <div style={{ 
              fontSize: '1.3rem', 
              marginBottom: '1.5rem',
              color: '#00ff88',
              fontWeight: 'bold'
            }}>
              🎯 Breath Detection Test
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', textAlign: 'left' }}>
              <div style={{ padding: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💨</span> <strong style={{ color: '#4488ff' }}>Inhale</strong><br/>
                <span style={{ color: '#ccc', fontSize: '0.9rem' }}>Character grows and moves up</span>
              </div>
              <div style={{ padding: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔥</span> <strong style={{ color: '#ff8844' }}>Exhale</strong><br/>
                <span style={{ color: '#ccc', fontSize: '0.9rem' }}>Character shrinks and moves down</span>
              </div>
              <div style={{ padding: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>⏸️</span> <strong style={{ color: '#00ccff' }}>Hold Breath</strong><br/>
                <span style={{ color: '#ccc', fontSize: '0.9rem' }}>Character glows blue</span>
              </div>
              <div style={{ padding: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🌬️</span> <strong style={{ color: '#00ff88' }}>Normal</strong><br/>
                <span style={{ color: '#ccc', fontSize: '0.9rem' }}>Character stays green and calm</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        width: '100%',
        marginTop: '2rem'
      }}>
        <button 
          className="btn pulse" 
          style={{ 
            fontSize: '1.1rem', 
            padding: '1rem 2rem',
            background: isListening 
              ? 'linear-gradient(45deg, #ff6b6b, #ff4444)' 
              : 'linear-gradient(45deg, var(--primary), var(--secondary))',
            border: 'none',
            borderRadius: '25px',
            color: isListening ? '#fff' : 'var(--dark)',
            fontWeight: 'bold',
            boxShadow: isListening 
              ? '0 8px 32px rgba(255, 107, 107, 0.4)' 
              : '0 8px 32px rgba(0, 255, 136, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            width: 'fit-content',
            minWidth: '250px',
            transform: 'translateY(0)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={startBreathDemo}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = isListening 
              ? '0 12px 40px rgba(255, 107, 107, 0.5)' 
              : '0 12px 40px rgba(0, 255, 136, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isListening 
              ? '0 8px 32px rgba(255, 107, 107, 0.4)' 
              : '0 8px 32px rgba(0, 255, 136, 0.4)';
          }}
        >
          {isListening ? '🛑 Stop Demo' : '🚀 Start Breath Detection'}
        </button>
      </div>
    </section>
  );
};

export default DemoSection;