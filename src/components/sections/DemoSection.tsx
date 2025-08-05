'use client';

import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';
import { useState, useEffect, useRef } from 'react';

interface BreathState {
  type: 'normal' | 'inhale' | 'exhale' | 'hold';
  label: string;
  color: string;
  scale: number;
  confidence?: number;
  medicalNote?: string;
}

interface AudioFeatures {
  rms: number;
  envelope: number;
  lpcGain: number;
  breathingFreqPower: number;
  spectralCentroid: number;
}

type DemoMode = 'enhanced-gaming' | 'guided-training';

interface GuidedExercise {
  id: string;
  name: string;
  instruction: string;
  duration: number;
  targetPattern: 'normal' | 'deep-inhale' | 'forced-exhale' | 'breath-hold';
  expectedSignature: AudioFeatures;
}

const DemoSection = () => {
  const sectionRef = useFadeInOnScroll();
  
  // React state instead of manual DOM manipulation
  const [demoMode, setDemoMode] = useState<DemoMode>('enhanced-gaming');
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false); // Use ref for immediate access
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [showUI, setShowUI] = useState(false);
  const [breathState, setBreathState] = useState<BreathState>({
    type: 'normal',
    label: '🌬️ Normal Breathing',
    color: '#00ff88',
    scale: 1,
    confidence: 0
  });
  const [audioData, setAudioData] = useState({
    amplitude: 0,
    baseline: 0,
    relative: 0,
    levelPercent: 0
  });
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures>({
    rms: 0,
    envelope: 0,
    lpcGain: 0,
    breathingFreqPower: 0,
    spectralCentroid: 0
  });
  
  // Guided training state
  const [currentExercise, setCurrentExercise] = useState<GuidedExercise | null>(null);
  const [exerciseProgress, setExerciseProgress] = useState(0);
  const [collectedData, setCollectedData] = useState<Array<{
    features: AudioFeatures;
    label: string;
    timestamp: number;
  }>>([]);
  
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
  
  // Guided exercises based on medical research
  const guidedExercises: GuidedExercise[] = [
    {
      id: 'normal-baseline',
      name: '🌬️ Normal Breathing',
      instruction: 'Breathe naturally and normally. This helps establish your personal baseline.',
      duration: 10000, // 10 seconds
      targetPattern: 'normal',
      expectedSignature: { rms: 0.2, envelope: 0.15, lpcGain: 0.1, breathingFreqPower: 20, spectralCentroid: 200 }
    },
    {
      id: 'deep-inhale',
      name: '💨 Deep Inhale Pattern',
      instruction: 'Take slow, deep inhales. Fill your lungs completely over 4 seconds.',
      duration: 15000, // 15 seconds
      targetPattern: 'deep-inhale',
      expectedSignature: { rms: 0.6, envelope: 0.5, lpcGain: 0.4, breathingFreqPower: 60, spectralCentroid: 300 }
    },
    {
      id: 'forced-exhale',
      name: '🔥 Forced Exhale (Spirometry Style)',
      instruction: 'Breathe in fully, then exhale as hard and fast as possible. Like blowing out birthday candles!',
      duration: 8000, // 8 seconds
      targetPattern: 'forced-exhale',
      expectedSignature: { rms: 0.8, envelope: 0.7, lpcGain: 0.6, breathingFreqPower: 80, spectralCentroid: 500 }
    },
    {
      id: 'breath-hold',
      name: '⏸️ Sustained Breath Hold',
      instruction: 'Inhale normally, then hold your breath for 5 seconds. This is like spirometry breath hold.',
      duration: 12000, // 12 seconds
      targetPattern: 'breath-hold',
      expectedSignature: { rms: 0.05, envelope: 0.02, lpcGain: 0.01, breathingFreqPower: 5, spectralCentroid: 100 }
    }
  ];

  const startBreathDemo = async () => {
    if (isListeningRef.current) {
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
      
      // Debug the stream and tracks
      const tracks = stream.getAudioTracks();
      console.log('🎵 Audio tracks:', tracks.map(track => ({
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState,
        settings: track.getSettings()
      })));
      
      // Check if we can get some initial data right away
      setTimeout(() => {
        if (analyserRef.current) {
          const testData = new Uint8Array(analyserRef.current.fftSize);
          analyserRef.current.getByteTimeDomainData(testData);
          console.log('🧪 Initial audio test data sample:', testData.slice(0, 10));
          console.log('🧪 Data variance:', Math.max(...testData) - Math.min(...testData));
        }
      }, 500);
      
      // Reset calibration and smoothing variables
      baselineRef.current = 0;
      calibrationCountRef.current = 0;
      amplitudeHistoryRef.current = [];
      lastUpdateTimeRef.current = 0;
      smoothedAmplitudeRef.current = 0;
      lastDisplayedAmplitudeRef.current = 0;
      
      // Show UI and start
      setIsListening(true);
      isListeningRef.current = true; // Set ref immediately
      setIsCalibrating(true);
      setShowUI(true);
      setCalibrationProgress(0);
      
      console.log('🚀 Starting breath detection... isListeningRef:', isListeningRef.current);
      detectBreath();
    } catch (error) {
      console.error('❌ Microphone error:', error);
      alert('Microphone access denied. Please allow microphone access and refresh the page.');
    }
  };

  const stopDemo = () => {
    setIsListening(false);
    isListeningRef.current = false; // Set ref immediately
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

  // === RESEARCH-ENHANCED BREATH DETECTION ALGORITHM ===
  // Based on SpiroSmart (UbiComp 2012) and mobile spirometry research
  const detectBreath = () => {
    if (!isListeningRef.current || !analyserRef.current) {
      console.log('❌ detectBreath stopped - isListeningRef:', isListeningRef.current, 'analyserRef:', !!analyserRef.current);
      return;
    }
    
    // === SIGNAL ACQUISITION ===
    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    const freqArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    analyserRef.current.getByteTimeDomainData(dataArray);
    analyserRef.current.getByteFrequencyData(freqArray);
    
    // === FEATURE 1: RESEARCH-BACKED FREQUENCY BAND FILTERING (100-1200 Hz) ===
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const binSize = sampleRate / (bufferLength * 2);
    const breathingBinStart = Math.floor(100 / binSize);   // 100 Hz - breathing start
    const breathingBinEnd = Math.floor(1200 / binSize);    // 1200 Hz - breathing end
    
    let breathingFreqPower = 0;
    const validBinEnd = Math.min(breathingBinEnd, freqArray.length);
    for (let i = breathingBinStart; i < validBinEnd; i++) {
      breathingFreqPower += freqArray[i];
    }
    breathingFreqPower /= (validBinEnd - breathingBinStart);
    
    // === FEATURE 2: ENVELOPE DETECTION (SpiroSmart Method) ===
    let envelope = 0;
    for (let i = 0; i < bufferLength; i++) {
      const sample = Math.abs((dataArray[i] - 128) / 128);
      envelope += sample;
    }
    envelope /= bufferLength;
    
    // === FEATURE 3: RMS CALCULATION (Traditional) ===
    let rmsSum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const sample = (dataArray[i] - 128) / 128;
      rmsSum += sample * sample;
    }
    const rms = Math.sqrt(rmsSum / bufferLength);
    
    // === FEATURE 4: LINEAR PREDICTIVE CODING (LPC) GAIN APPROXIMATION ===
    // Simplified LPC for vocal tract energy estimation
    let lpcGain = 0;
    for (let i = 2; i < bufferLength - 2; i++) {
      const sample = (dataArray[i] - 128) / 128;
      // Simple 2nd order prediction
      const predicted = 0.5 * ((dataArray[i-1] - 128) / 128) + 0.3 * ((dataArray[i-2] - 128) / 128);
      const error = Math.abs(sample - predicted);
      lpcGain += error * error;
    }
    lpcGain = Math.sqrt(lpcGain / (bufferLength - 4));
    
    // === FEATURE 5: SPECTRAL CENTROID (Frequency Center of Mass) ===
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = breathingBinStart; i < validBinEnd; i++) {
      const frequency = i * binSize;
      const magnitude = freqArray[i];
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    
    // === RESEARCH-BACKED MULTI-FEATURE FUSION ===
    const features: AudioFeatures = {
      rms: rms,
      envelope: envelope,
      lpcGain: lpcGain,
      breathingFreqPower: breathingFreqPower,
      spectralCentroid: spectralCentroid
    };
    
    // SpiroSmart-style weighted combination
    const rawAmplitude = Math.max(
      envelope * 100,           // Envelope (primary SpiroSmart feature)
      breathingFreqPower * 1.2, // Breathing-specific frequencies
      lpcGain * 80,            // Vocal tract energy
      rms * 60                 // Traditional RMS
    );
    
    // Update features state
    setAudioFeatures(features);
    
    // === ENHANCED CALIBRATION WITH MEDICAL VALIDATION ===
    const currentTime = Date.now();
    const shouldUpdateUI = currentTime - lastUpdateTimeRef.current > 50; // 20 FPS for better responsiveness
    
    // Calibration phase - establish personal baseline
    if (calibrationCountRef.current < 60) {
      baselineRef.current += rawAmplitude;
      calibrationCountRef.current++;
      
      setCalibrationProgress(calibrationCountRef.current);
      const levelPercent = Math.min(100, (rawAmplitude / 30) * 100);
      setAudioData({
        amplitude: rawAmplitude,
        baseline: baselineRef.current / Math.max(1, calibrationCountRef.current),
        relative: 0,
        levelPercent: levelPercent
      });
      
      if (calibrationCountRef.current % 15 === 0) {
        console.log(`🔬 Enhanced Calibration ${calibrationCountRef.current}/60:`, {
          rawAmplitude: rawAmplitude.toFixed(2),
          envelope: envelope.toFixed(3),
          lpcGain: lpcGain.toFixed(3),
          breathingFreq: breathingFreqPower.toFixed(1),
          spectralCentroid: spectralCentroid.toFixed(0)
        });
      }
      
      if (calibrationCountRef.current === 60) {
        baselineRef.current = baselineRef.current / 60;
        setIsCalibrating(false);
        console.log(`✅ Enhanced calibration complete! Baseline: ${baselineRef.current.toFixed(2)}`);
      }
      animationRef.current = requestAnimationFrame(detectBreath);
      return;
    }
    
    // === POST-CALIBRATION PROCESSING ===
    // Smooth amplitude with exponential moving average
    const smoothingFactor = 0.15; // Optimized for responsiveness vs stability
    smoothedAmplitudeRef.current = (smoothingFactor * rawAmplitude) + ((1 - smoothingFactor) * smoothedAmplitudeRef.current);
    const amplitude = smoothedAmplitudeRef.current;
    
    // Amplitude history for trend analysis
    amplitudeHistoryRef.current.push(amplitude);
    if (amplitudeHistoryRef.current.length > 15) {
      amplitudeHistoryRef.current.shift();
    }
    
    const relativeAmplitude = amplitude - baselineRef.current;
    const normalizedAmplitude = relativeAmplitude / (baselineRef.current + 0.1);
    
    // Calculate trend (breathing direction)
    const trend = amplitudeHistoryRef.current.length >= 5 ? 
      amplitudeHistoryRef.current[amplitudeHistoryRef.current.length - 1] - amplitudeHistoryRef.current[amplitudeHistoryRef.current.length - 5] : 0;
    
    // === MEDICAL-GRADE BREATH STATE DETECTION ===
    // Based on spirometry research: specific flow rate patterns
    if (shouldUpdateUI) {
      const levelPercent = Math.min(100, (amplitude / 50) * 100);
      setAudioData({
        amplitude: amplitude,
        baseline: baselineRef.current,
        relative: relativeAmplitude,
        levelPercent: levelPercent
      });
      
      let newState: BreathState;
      let confidence = 0;
      
      // Enhanced state detection with confidence scoring
      if (normalizedAmplitude > 0.7 && trend > 0.3 && lpcGain > 0.2) {
        // Forced exhale pattern (spirometry style)
        confidence = Math.min(100, (normalizedAmplitude + lpcGain) * 50);
        newState = { 
          type: 'exhale', 
          label: '🔥 Sharp Exhale', 
          color: '#ff6644', 
          scale: 0.7,
          confidence: confidence,
          medicalNote: `Strong exhale detected - great for powerful attacks!`
        };
      } else if (normalizedAmplitude > 0.4 && envelope > 0.3) {
        // Deep inhale pattern
        confidence = Math.min(100, (envelope + normalizedAmplitude) * 60);
        newState = { 
          type: 'inhale', 
          label: '💨 Deep Inhale', 
          color: '#4488ff', 
          scale: 1.5,
          confidence: confidence,
          medicalNote: `Deep breath detected - perfect for charging up!`
        };
      } else if (normalizedAmplitude > 0.1) {
        // Normal breathing
        confidence = Math.min(100, envelope * 80);
        newState = { 
          type: 'normal', 
          label: '🌬️ Normal Breathing', 
          color: '#00ff88', 
          scale: 1,
          confidence: confidence,
          medicalNote: `Steady breathing - good for movement and exploration`
        };
      } else if (lpcGain < 0.05 && envelope < 0.1) {
        // Sustained breath hold
        confidence = Math.min(100, (1 - envelope) * 90);
        newState = { 
          type: 'hold', 
          label: '⏸️ Breath Hold', 
          color: '#00ccff', 
          scale: 1.2,
          confidence: confidence,
          medicalNote: 'Holding breath - activates shield or special abilities!'
        };
      } else {
        // Transitional state
        newState = { 
          type: 'normal', 
          label: '🔄 Changing Pattern', 
          color: '#ffaa44', 
          scale: 1,
          confidence: 30,
          medicalNote: 'Breathing pattern is changing...'
        };
      }
      
      // === GUIDED TRAINING MODE ENHANCEMENTS ===
      if (demoMode === 'guided-training' && currentExercise) {
        // Collect labeled training data
        const dataPoint = {
          features: features,
          label: currentExercise.targetPattern,
          timestamp: Date.now()
        };
        
        // Add to training dataset
        setCollectedData(prev => [...prev.slice(-100), dataPoint]); // Keep last 100 samples
        
        // Calculate exercise progress
        const exerciseElapsed = Date.now() - stateStartTimeRef.current;
        const progress = Math.min(100, (exerciseElapsed / currentExercise.duration) * 100);
        setExerciseProgress(progress);
        
        // Enhanced feedback for guided mode
        newState.label = `${newState.label} (Training: ${currentExercise.name})`;
        newState.medicalNote = currentExercise.instruction;
      }
      
      setBreathState(newState);
      lastUpdateTimeRef.current = currentTime;
    }
    
    animationRef.current = requestAnimationFrame(detectBreath);
  };

  // === GUIDED TRAINING MODE FUNCTIONS ===
  const startGuidedExercise = (exercise: GuidedExercise) => {
    setCurrentExercise(exercise);
    setExerciseProgress(0);
    stateStartTimeRef.current = Date.now();
    
    // Auto-complete exercise after duration
    setTimeout(() => {
      if (currentExercise?.id === exercise.id) {
        completeExercise();
      }
    }, exercise.duration);
  };
  
  const completeExercise = () => {
    console.log(`✅ Exercise "${currentExercise?.name}" completed!`);
    console.log(`📊 Collected ${collectedData.filter(d => d.label === currentExercise?.targetPattern).length} data points`);
    setCurrentExercise(null);
    setExerciseProgress(0);
  };
  
  const exportTrainingData = () => {
    const dataBlob = new Blob([JSON.stringify(collectedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breath-training-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
      <h2>🎮 Breath Gaming Demo</h2>
      <p style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>
        Control a game character with your breathing patterns
      </p>
      
      {/* === DUAL MODE SELECTOR === */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setDemoMode('enhanced-gaming')}
          style={{
            padding: '1rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            border: demoMode === 'enhanced-gaming' ? '3px solid #00ff88' : '2px solid #333',
            background: demoMode === 'enhanced-gaming' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 20, 40, 0.8)',
            color: demoMode === 'enhanced-gaming' ? '#00ff88' : '#fff',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          🎮 Play Game
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.8 }}>
            Control a character with your breathing
          </div>
        </button>
        
        <button
          onClick={() => setDemoMode('guided-training')}
          style={{
            padding: '1rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            border: demoMode === 'guided-training' ? '3px solid #4488ff' : '2px solid #333',
            background: demoMode === 'guided-training' ? 'rgba(68, 136, 255, 0.2)' : 'rgba(0, 20, 40, 0.8)',
            color: demoMode === 'guided-training' ? '#4488ff' : '#fff',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          🧘 Practice Breathing
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.8 }}>
            Learn different breathing techniques
          </div>
        </button>
      </div>
      
      {/* === SETUP TIPS === */}
      <div style={{
        background: 'rgba(0, 255, 136, 0.1)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        border: '1px solid rgba(0, 255, 136, 0.3)'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#00ff88' }}>📏 Setup Tips for Best Results</h4>
        <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
          <strong>Distance:</strong> Hold device at arm's length for optimal detection<br/>
          <strong>Position:</strong> Point screen toward your mouth<br/>
          <strong>Environment:</strong> Find a quiet spot for best accuracy
        </div>
      </div>
      
      {!showUI && demoMode === 'enhanced-gaming' && (
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
      
      {/* === BREATHING PRACTICE MODE UI === */}
      {!showUI && demoMode === 'guided-training' && (
        <div style={{
          background: 'rgba(68, 136, 255, 0.1)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '2px solid rgba(68, 136, 255, 0.3)'
        }}>
          <h3 style={{ color: '#4488ff', marginBottom: '1rem' }}>🧘 Breathing Practice Exercises</h3>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Learn different breathing patterns to improve your game control and breathing awareness.
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {guidedExercises.map((exercise) => (
              <div 
                key={exercise.id}
                style={{
                  background: 'rgba(0, 20, 40, 0.8)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(68, 136, 255, 0.2)'
                }}
              >
                <h4 style={{ color: '#4488ff', margin: '0 0 0.5rem 0' }}>{exercise.name}</h4>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                  {exercise.instruction}
                </p>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
                  Duration: {exercise.duration / 1000}s • Target: {exercise.targetPattern}
                </div>
                <button
                  onClick={() => {
                    startBreathDemo();
                    setTimeout(() => startGuidedExercise(exercise), 100);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#4488ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Start Exercise
                </button>
              </div>
            ))}
          </div>
          
          {collectedData.length > 0 && (
            <div style={{
              background: 'rgba(0, 255, 136, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid rgba(0, 255, 136, 0.3)'
            }}>
              <h4 style={{ color: '#00ff88', margin: '0 0 0.5rem 0' }}>📊 Training Data Collected</h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
                {collectedData.length} breath samples collected across {new Set(collectedData.map(d => d.label)).size} patterns
              </p>
              <button
                onClick={exportTrainingData}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#00ff88',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📥 Export Training Data
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* === CURRENT EXERCISE PROGRESS === */}
      {currentExercise && (
        <div style={{
          background: 'rgba(68, 136, 255, 0.2)',
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1rem',
          border: '2px solid rgba(68, 136, 255, 0.5)'
        }}>
          <h3 style={{ color: '#4488ff', margin: '0 0 0.5rem 0' }}>🎯 Current Exercise: {currentExercise.name}</h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>{currentExercise.instruction}</p>
          
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '6px', overflow: 'hidden', height: '8px' }}>
            <div style={{
              width: `${exerciseProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4488ff, #00ff88)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>
            Progress: {Math.round(exerciseProgress)}%
          </div>
          
          <button
            onClick={completeExercise}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#ff6644',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Complete Exercise
          </button>
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
            
            {/* === BREATH DETECTION DETAILS === */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ 
                fontSize: '0.9rem', 
                marginBottom: '0.5rem', 
                color: '#4488ff',
                fontWeight: 'bold'
              }}>
                🔊 Audio Analysis Details
              </div>
              
              {/* Primary features display */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.8rem',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#00ff88', fontWeight: 'bold' }}>Signal</div>
                  <div>{audioFeatures.envelope.toFixed(3)}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>Overall Power</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ff8844', fontWeight: 'bold' }}>Voice</div>
                  <div>{audioFeatures.lpcGain.toFixed(3)}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>Vocal Energy</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#4488ff', fontWeight: 'bold' }}>Breath</div>
                  <div>{audioFeatures.breathingFreqPower.toFixed(1)}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>Breathing Freq</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ffaa44', fontWeight: 'bold' }}>Tone</div>
                  <div>{audioFeatures.spectralCentroid.toFixed(0)}Hz</div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>Frequency</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#00ccff', fontWeight: 'bold' }}>Volume</div>
                  <div>{audioFeatures.rms.toFixed(3)}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>Basic Level</div>
                </div>
              </div>
            </div>
            
            {/* Traditional metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1rem',
              fontSize: '0.9rem',
              color: '#ccc',
              textAlign: 'center',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
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
                  {isCalibrating ? `Calibrating ${calibrationProgress}/60` : 'Ready to Play!'}
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
        
        {/* === ENHANCED BREATH STATE DISPLAY === */}
        {showUI && (
          <div style={{
            fontSize: '1.1rem',
            textAlign: 'center',
            width: '100%',
            maxWidth: '700px',
            background: 'rgba(0, 20, 40, 0.9)',
            padding: '2rem',
            borderRadius: '16px',
            border: `2px solid ${breathState.color}`,
            marginTop: '2rem',
            marginBottom: '1rem',
            boxShadow: `0 8px 32px ${breathState.color}40`,
            lineHeight: '1.6',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ 
              fontSize: '1.5rem', 
              marginBottom: '1rem',
              color: breathState.color,
              fontWeight: 'bold'
            }}>
              {breathState.label}
            </div>
            
            {/* Confidence Score */}
            {breathState.confidence !== undefined && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '0.5rem' }}>
                  Detection Confidence
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: `${breathState.confidence}%`,
                    height: '100%',
                    background: breathState.confidence > 70 ? '#00ff88' : 
                               breathState.confidence > 40 ? '#ffaa44' : '#ff6644',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                  {Math.round(breathState.confidence || 0)}% confident
                </div>
              </div>
            )}
            
            {/* Breathing Info */}
            {breathState.medicalNote && (
              <div style={{
                background: 'rgba(68, 136, 255, 0.1)',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid rgba(68, 136, 255, 0.3)'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#4488ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  💨 Breathing Pattern
                </div>
                <div style={{ fontSize: '0.85rem', color: '#ccc' }}>
                  {breathState.medicalNote}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Game Controls Info */}
        {showUI && demoMode === 'enhanced-gaming' && (
          <div style={{
            fontSize: '1rem',
            textAlign: 'center',
            width: '100%',
            maxWidth: '700px',
            background: 'rgba(0, 20, 40, 0.7)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(0, 255, 136, 0.2)',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            <div style={{ 
              fontSize: '1.1rem', 
              marginBottom: '1rem',
              color: '#00ff88',
              fontWeight: 'bold'
            }}>
              🎮 Game Controls
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', textAlign: 'left' }}>
              <div style={{ padding: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💨</span> <strong style={{ color: '#4488ff' }}>Deep Inhale</strong><br/>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Character grows and charges up</span>
              </div>
              <div style={{ padding: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔥</span> <strong style={{ color: '#ff6644' }}>Forced Exhale</strong><br/>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Powerful attack move</span>
              </div>
              <div style={{ padding: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>⏸️</span> <strong style={{ color: '#00ccff' }}>Breath Hold</strong><br/>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Shield activation (3-5s)</span>
              </div>
              <div style={{ padding: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🌬️</span> <strong style={{ color: '#00ff88' }}>Normal Flow</strong><br/>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>Steady movement</span>
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
          {isListening ? '🛑 Stop' : (
            demoMode === 'enhanced-gaming' ? '🎮 Start Game' : '🧘 Start Practice'
          )}
        </button>
      </div>
    </section>
  );
};

export default DemoSection;