'use client';

import { useState, useEffect, useRef } from 'react';

interface AudioFeatures {
  rms: number;
  envelope: number;
  lpcGain: number;
  breathingFreqPower: number;
  spectralCentroid: number;
}

interface CalibrationData {
  inhaleMax: number;
  exhaleMax: number;
  baseline: number;
  timestamp: number;
  dataPoints: number;
  audioLevels: {
    min: number;
    max: number;
    average: number;
  };
}

interface BoxBreathingPhase {
  phase: 'inhale' | 'hold1' | 'exhale' | 'hold2';
  duration: number;
  scale: number;
  text: string;
  bgColor: string;
}

interface CalibrateBreathComponentProps {
  onSwitchToPlay: () => void;
}

const CalibrateBreathComponent = ({ onSwitchToPlay }: CalibrateBreathComponentProps) => {
  // State management
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [isExerciseRunning, setIsExerciseRunning] = useState(false);
  const [isPreparationCountdown, setIsPreparationCountdown] = useState(false);
  const [preparationTimeLeft, setPreparationTimeLeft] = useState(0);
  const [isCalibrationComplete, setIsCalibrationComplete] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<BoxBreathingPhase | null>(null);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState(0);
  const [audioData, setAudioData] = useState({
    amplitude: 0,
    baseline: 0,
    relative: 0,
    levelPercent: 0
  });
  const [recordedLevels, setRecordedLevels] = useState<number[]>([]);
  const [savedCalibration, setSavedCalibration] = useState<CalibrationData | null>(null);
  const [frequencyBands, setFrequencyBands] = useState<number[]>(new Array(8).fill(0));

  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Processing variables
  const baselineRef = useRef(0);
  const calibrationCountRef = useRef(0);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exerciseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isExerciseRunningRef = useRef(false);

  // Box breathing phases (inspired by breathe.html)
  const boxBreathingPhases: BoxBreathingPhase[] = [
    { phase: 'inhale', duration: 4, scale: 1.25, text: 'Inhale', bgColor: '#A7F3D0' },
    { phase: 'hold1', duration: 4, scale: 1.25, text: 'Hold', bgColor: '#6EE7B7' },
    { phase: 'exhale', duration: 4, scale: 0.75, text: 'Exhale', bgColor: '#FBCFE8' },
    { phase: 'hold2', duration: 4, scale: 0.75, text: 'Hold', bgColor: '#F9A8D4' }
  ];

  // Load saved calibration on mount
  useEffect(() => {
    const saved = localStorage.getItem('breathquest_calibration');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSavedCalibration(data);
      } catch (error) {
        console.error('Error loading saved calibration:', error);
      }
    }
  }, []);

  const startCalibration = async () => {
    if (isListeningRef.current) {
      stopCalibration();
      return;
    }

    try {
      console.log('📦 Starting box breathing calibration...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        } 
      });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Calibration-optimized settings
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      
      microphoneRef.current.connect(analyserRef.current);
      
      // Reset variables
      baselineRef.current = 0;
      calibrationCountRef.current = 0;
      setRecordedLevels([]);
      
      setIsListening(true);
      isListeningRef.current = true;
      setIsCalibrating(true);
      setCalibrationProgress(0);
      
      detectBreath();
      
      // Start box breathing exercise after brief calibration
      setTimeout(() => {
        setIsCalibrating(false);
        startPreparationCountdown();
      }, 1500); // 1.5 second calibration
      
    } catch (error) {
      console.error('❌ Microphone error:', error);
      alert('Microphone access denied. Please allow microphone access and refresh the page.');
    }
  };

  const startPreparationCountdown = () => {
    console.log('⏳ Starting preparation countdown...');
    setIsPreparationCountdown(true);
    setPreparationTimeLeft(3);
    
    const countdown = setInterval(() => {
      setPreparationTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          setIsPreparationCountdown(false);
          startBoxBreathingExercise();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startBoxBreathingExercise = () => {
    console.log('🫁 Starting box breathing exercise...');
    setIsExerciseRunning(true);
    isExerciseRunningRef.current = true;
    setExerciseTimeLeft(64); // 4 cycles of 16 seconds each
    setRecordedLevels([]);
    
    // Start exercise timer
    const exerciseInterval = setInterval(() => {
      setExerciseTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(exerciseInterval);
          console.log('⏰ Exercise timer completed, calling completeBoxBreathingExercise');
          completeBoxBreathingExercise();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    exerciseTimerRef.current = exerciseInterval;
    
    // IMMEDIATELY start the first phase
    startNextPhase(0); // Start with phase 0 (inhale)
  };

  const startNextPhase = (phaseIndex: number) => {
    // Note: We don't check isExerciseRunning here since it might not be updated yet
    
    // Clear any existing phase timer first
    if (phaseTimerRef.current) {
      clearInterval(phaseTimerRef.current);
    }
    
    const phase = boxBreathingPhases[phaseIndex];
    setCurrentPhase(phase);
    setPhaseTimeLeft(phase.duration);
    
    console.log(`🫁 Starting phase: ${phase.phase} (${phase.duration}s)`);
    
    // Phase countdown timer
    let timeLeft = phase.duration;
    const phaseInterval = setInterval(() => {
      timeLeft--;
      setPhaseTimeLeft(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(phaseInterval);
        // Check if we should continue to next phase
        if (isExerciseRunningRef.current) {
          const nextPhaseIndex = (phaseIndex + 1) % boxBreathingPhases.length;
          console.log(`🔄 Phase ${phase.phase} complete, moving to phase ${nextPhaseIndex}`);
          startNextPhase(nextPhaseIndex);
        }
      }
    }, 1000);
    
    phaseTimerRef.current = phaseInterval;
  };

  const completeBoxBreathingExercise = () => {
    console.log('✅ Box breathing calibration complete!');
    console.log('📊 Recorded levels count:', recordedLevels.length);
    setIsExerciseRunning(false);
    isExerciseRunningRef.current = false;
    setCurrentPhase(null);
    
    if (phaseTimerRef.current) {
      clearInterval(phaseTimerRef.current);
    }
    if (exerciseTimerRef.current) {
      clearInterval(exerciseTimerRef.current);
    }
    
    // Calculate calibration data from recorded levels
    console.log('🧮 Calculating calibration data, recordedLevels.length:', recordedLevels.length);
    if (recordedLevels.length > 0) {
      const sortedLevels = [...recordedLevels].sort((a, b) => a - b);
      const inhaleMax = sortedLevels[Math.floor(sortedLevels.length * 0.95)]; // 95th percentile
      const exhaleMax = sortedLevels[Math.floor(sortedLevels.length * 0.85)]; // 85th percentile
      const baseline = sortedLevels[Math.floor(sortedLevels.length * 0.1)]; // 10th percentile
      const average = recordedLevels.reduce((sum, val) => sum + val, 0) / recordedLevels.length;
      
      const calibrationData: CalibrationData = {
        inhaleMax,
        exhaleMax,
        baseline,
        timestamp: Date.now(),
        dataPoints: recordedLevels.length,
        audioLevels: {
          min: Math.min(...recordedLevels),
          max: Math.max(...recordedLevels),
          average
        }
      };
      
      localStorage.setItem('breathquest_calibration', JSON.stringify(calibrationData));
      setSavedCalibration(calibrationData);
      console.log('💾 Calibration data saved:', calibrationData);
      console.log('🎉 Setting isCalibrationComplete to true');
      setIsCalibrationComplete(true);
    } else {
      console.warn('⚠️ No recorded levels found, but showing completion screen anyway');
      // Show completion screen even if no data (better UX)
      setIsCalibrationComplete(true);
    }
  };

  const stopCalibration = () => {
    setIsListening(false);
    isListeningRef.current = false;
    setIsCalibrating(false);
    setIsExerciseRunning(false);
    isExerciseRunningRef.current = false;
    setIsPreparationCountdown(false);
    setIsCalibrationComplete(false);
    setCurrentPhase(null);
    setCalibrationProgress(0);
    setExerciseTimeLeft(0);
    setPhaseTimeLeft(0);
    setPreparationTimeLeft(0);
    
    if (phaseTimerRef.current) {
      clearInterval(phaseTimerRef.current);
    }
    if (exerciseTimerRef.current) {
      clearInterval(exerciseTimerRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const detectBreath = () => {
    if (!isListeningRef.current || !analyserRef.current) {
      return;
    }
    
    // Signal acquisition
    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    const freqArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    analyserRef.current.getByteTimeDomainData(dataArray);
    analyserRef.current.getByteFrequencyData(freqArray);
    
    // Enhanced breath detection for calibration
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const binSize = sampleRate / (bufferLength * 2);
    const breathingBinStart = Math.floor(100 / binSize);
    const breathingBinEnd = Math.floor(1200 / binSize);
    
    // Debug audio settings (log once per session)
    if (!window.audioDebugLogged) {
      console.log(`🔊 Audio settings: sampleRate=${sampleRate}, bufferLength=${bufferLength}, binSize=${binSize.toFixed(2)}Hz, freqArray.length=${freqArray.length}`);
      window.audioDebugLogged = true;
    }
    
    let breathingFreqPower = 0;
    const validBinEnd = Math.min(breathingBinEnd, freqArray.length);
    for (let i = breathingBinStart; i < validBinEnd; i++) {
      breathingFreqPower += freqArray[i];
    }
    breathingFreqPower /= (validBinEnd - breathingBinStart);
    
    // 8-Band Frequency Analysis (focused on breathing frequencies 50-2000Hz)
    const bands = new Array(8).fill(0);
    
    // Define breathing-specific frequency bands (50Hz to 2000Hz)
    const breathingBandRanges = [
      [50, 150],    // Band 1: Very low breathing, chest resonance
      [150, 300],   // Band 2: Low breathing sounds
      [300, 500],   // Band 3: Primary breathing frequencies
      [500, 750],   // Band 4: Mid breathing sounds
      [750, 1000],  // Band 5: Higher breathing sounds
      [1000, 1300], // Band 6: Airflow turbulence
      [1300, 1600], // Band 7: High airflow sounds
      [1600, 2000]  // Band 8: Very high breathing/whistling
    ];
    
    for (let band = 0; band < 8; band++) {
      const [startFreq, endFreq] = breathingBandRanges[band];
      const startBin = Math.floor(startFreq / binSize);
      const endBin = Math.min(Math.floor(endFreq / binSize), freqArray.length);
      
      let bandPower = 0;
      let binCount = 0;
      for (let i = startBin; i < endBin; i++) {
        bandPower += freqArray[i];
        binCount++;
      }
      
      // Average and scale appropriately for visualization
      const avgPower = binCount > 0 ? bandPower / binCount : 0;
      // Scale to 0-255 range and apply mild logarithmic scaling
      bands[band] = avgPower > 0 ? Math.min(255, avgPower * 2) : 0;
      
      // Debug logging for first band only to avoid spam
      if (band === 0 && avgPower > 10) {
        console.log(`Band ${band} (${startFreq}-${endFreq}Hz): bins ${startBin}-${endBin}, power: ${avgPower.toFixed(1)}`);
      }
    }
    setFrequencyBands(bands);
    
    // Envelope detection
    let envelope = 0;
    for (let i = 0; i < bufferLength; i++) {
      const sample = Math.abs((dataArray[i] - 128) / 128);
      envelope += sample;
    }
    envelope /= bufferLength;
    
    // RMS calculation
    let rmsSum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const sample = (dataArray[i] - 128) / 128;
      rmsSum += sample * sample;
    }
    const rms = Math.sqrt(rmsSum / bufferLength);
    
    // Calculate combined amplitude
    const rawAmplitude = Math.max(
      envelope * 100,
      breathingFreqPower * 1.2,
      rms * 60
    );
    
    // Initial calibration phase (brief)
    if (isCalibrating && calibrationCountRef.current < 15) {
      baselineRef.current += rawAmplitude;
      calibrationCountRef.current++;
      setCalibrationProgress((calibrationCountRef.current / 15) * 100);
      
      if (calibrationCountRef.current === 15) {
        baselineRef.current = baselineRef.current / 15;
        console.log(`✅ Initial calibration complete! Baseline: ${baselineRef.current.toFixed(2)}`);
      }
    }
    
    // Update audio data and record levels during exercise
    const levelPercent = Math.min(100, (rawAmplitude / 50) * 100);
    setAudioData({
      amplitude: rawAmplitude,
      baseline: baselineRef.current,
      relative: rawAmplitude - baselineRef.current,
      levelPercent: levelPercent
    });
    
    // Record levels during the exercise for calibration
    if (isExerciseRunning) {
      setRecordedLevels(prev => [...prev, rawAmplitude]);
    }
    
    animationRef.current = requestAnimationFrame(detectBreath);
  };

  // Clean up on unmount
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
      background: 'rgba(68, 136, 255, 0.05)',
      padding: '2rem',
      borderRadius: '16px',
      border: '2px solid rgba(68, 136, 255, 0.3)',
      marginBottom: '2rem'
    }}>
      <h2 style={{ color: '#4488ff', marginBottom: '1rem', textAlign: 'center' }}>
        📦 Calibrate Breath
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#ccc' }}>
        Follow the box breathing pattern while we measure your breathing range
      </p>



      {/* Initial Setup */}
      {!isListening && (
        <div style={{
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto 2rem auto'
        }}>
          <p style={{ marginBottom: '2rem', color: '#888', fontSize: '0.9rem' }}>
            We'll guide you through a 64-second box breathing exercise (4 cycles) 
            to learn your personal breathing patterns.
          </p>

          {/* Preview Box Visual */}
          <div style={{
            width: '200px',
            height: '200px',
            margin: '0 auto 2rem auto',
            borderRadius: '8px',
            background: 'linear-gradient(45deg, #A7F3D0, #6EE7B7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#fff',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            boxShadow: '0 0 30px 5px rgba(167, 243, 208, 0.5)',
            position: 'relative',
            animation: 'boxBreathe 16s ease-in-out infinite'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                Box Breathing
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.8 }}>
                4-4-4-4 Pattern
              </div>
            </div>
            
            {/* Preview corner dots */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.6)',
              animation: 'pulse 2s infinite'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.6)',
              animation: 'pulse 2s infinite 0.5s'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.6)',
              animation: 'pulse 2s infinite 1s'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.6)',
              animation: 'pulse 2s infinite 1.5s'
            }}></div>
          </div>

          {/* Box Breathing Instructions */}
          <div style={{
            background: 'rgba(68, 136, 255, 0.1)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(68, 136, 255, 0.3)',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{ 
              color: '#4488ff', 
              marginBottom: '1rem', 
              textAlign: 'center',
              fontSize: '1.2rem'
            }}>
              📦 Box Breathing Instructions
            </h3>
            <ol style={{ 
              color: '#ccc', 
              lineHeight: '1.6',
              paddingLeft: '1.2rem',
              fontSize: '0.9rem'
            }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong>Inhale</strong> slowly through your nose for <strong>4 seconds</strong>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong>Hold</strong> your breath gently for <strong>4 seconds</strong>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong>Exhale</strong> slowly through your mouth for <strong>4 seconds</strong>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong>Hold</strong> (lungs empty) for <strong>4 seconds</strong>
              </li>
            </ol>
            <p style={{ 
              color: '#888', 
              fontSize: '0.8rem', 
              marginTop: '1rem',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              The visual box will guide you through each phase with colors and timing
            </p>
          </div>
          
          <button
            onClick={startCalibration}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #4488ff, #6699ff)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(68, 136, 255, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🚀 Start Box Breathing Calibration
          </button>
        </div>
      )}

      {/* Initial Calibration */}
      {isCalibrating && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '1.3rem',
            color: '#ffaa00',
            marginBottom: '1rem',
            textAlign: 'center',
            padding: '1.5rem',
            background: 'rgba(255, 170, 0, 0.1)',
            borderRadius: '12px',
            border: '2px solid rgba(255, 170, 0, 0.3)',
            fontWeight: 'bold'
          }}>
            🔧 Setting up microphone baseline...
            <div style={{ 
              fontSize: '1rem', 
              marginTop: '0.5rem',
              color: '#cc8800'
            }}>
              Breathe normally while we establish your baseline
            </div>
            <div style={{ 
              fontSize: '2rem', 
              marginTop: '0.5rem',
              color: '#ffaa00'
            }}>
              {Math.round(calibrationProgress)}%
            </div>
          </div>

          {/* Show live audio feedback during calibration */}
          <div style={{
            maxWidth: '400px',
            margin: '1rem auto',
            padding: '1rem',
            background: 'rgba(0, 20, 40, 0.8)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 170, 0, 0.3)'
          }}>
            <div style={{ 
              fontSize: '0.9rem', 
              marginBottom: '0.5rem', 
              color: '#ffaa00',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              🎤 Detecting Audio Level
            </div>
            
            {/* Audio Level Bar */}
            <div style={{
              width: '100%',
              height: '20px',
              background: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                height: '100%',
                width: `${audioData.levelPercent}%`,
                background: audioData.levelPercent > 10 ? 
                  'linear-gradient(to right, #ffaa00, #ff8844)' :
                  'linear-gradient(to right, #004400, #00ff88)',
                transition: 'width 0.1s ease',
                borderRadius: '10px'
              }}></div>
            </div>
            
            <div style={{
              fontSize: '0.8rem',
              color: '#ccc',
              textAlign: 'center',
              marginTop: '0.5rem'
            }}>
              Current: {audioData.amplitude.toFixed(1)} | Baseline: {audioData.baseline.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      {/* Preparation Countdown */}
      {isPreparationCountdown && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#ff9500',
            marginBottom: '1rem'
          }}>
            Get Ready!
          </div>
          <div style={{
            fontSize: '4rem',
            fontWeight: 'bold',
            color: '#ffb347',
            textShadow: '0 2px 8px rgba(255, 149, 0, 0.5)'
          }}>
            {preparationTimeLeft}
          </div>
          <div style={{
            fontSize: '1.2rem',
            color: '#888',
            marginTop: '1rem'
          }}>
            Box breathing will start in {preparationTimeLeft} second{preparationTimeLeft !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {isExerciseRunning && currentPhase && (
        <div style={{ textAlign: 'center' }}>
          {/* Exercise Timer */}
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#4488ff',
            marginBottom: '1rem'
          }}>
            Time Remaining: {Math.floor(exerciseTimeLeft / 60)}:{(exerciseTimeLeft % 60).toString().padStart(2, '0')}
          </div>

          {/* Box Breathing Visual (inspired by breathe.html) */}
          <div style={{
            width: '200px',
            height: '200px',
            margin: '0 auto 1rem auto',
            borderRadius: '8px', // Box shape instead of circle
            background: currentPhase.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#fff',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            transform: `scale(${currentPhase.scale})`,
            transition: 'all 4s ease-in-out',
            boxShadow: `0 0 30px 5px ${currentPhase.bgColor}`,
            position: 'relative'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                {currentPhase.text}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {phaseTimeLeft}
              </div>
            </div>
            
            {/* Corner dots like in breathe.html */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: currentPhase.phase === 'inhale' ? '#fff' : 'rgba(255,255,255,0.3)',
              boxShadow: currentPhase.phase === 'inhale' ? '0 0 10px 3px rgba(255,255,255,0.8)' : 'none',
              transition: 'all 0.3s ease'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: currentPhase.phase === 'hold1' ? '#fff' : 'rgba(255,255,255,0.3)',
              boxShadow: currentPhase.phase === 'hold1' ? '0 0 10px 3px rgba(255,255,255,0.8)' : 'none',
              transition: 'all 0.3s ease'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: currentPhase.phase === 'exhale' ? '#fff' : 'rgba(255,255,255,0.3)',
              boxShadow: currentPhase.phase === 'exhale' ? '0 0 10px 3px rgba(255,255,255,0.8)' : 'none',
              transition: 'all 0.3s ease'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: currentPhase.phase === 'hold2' ? '#fff' : 'rgba(255,255,255,0.3)',
              boxShadow: currentPhase.phase === 'hold2' ? '0 0 10px 3px rgba(255,255,255,0.8)' : 'none',
              transition: 'all 0.3s ease'
            }}></div>
          </div>

          {/* Real-time Audio Level */}
          <div style={{
            maxWidth: '400px',
            margin: '2rem auto',
            padding: '1rem',
            background: 'rgba(0, 20, 40, 0.8)',
            borderRadius: '12px',
            border: '1px solid rgba(68, 136, 255, 0.3)'
          }}>
            <div style={{ 
              fontSize: '0.9rem', 
              marginBottom: '0.5rem', 
              color: '#4488ff',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              🎤 Your Audio Level
            </div>
            
            {/* Audio Level Bar */}
            <div style={{
              width: '100%',
              height: '20px',
              background: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                height: '100%',
                width: `${audioData.levelPercent}%`,
                background: audioData.levelPercent > 80 ? 'linear-gradient(to right, #ff4444, #ff8844)' :
                          audioData.levelPercent > 40 ? 'linear-gradient(to right, #ffff00, #ff8844)' :
                          audioData.levelPercent > 10 ? 'linear-gradient(to right, #00ff88, #ffff00)' :
                          'linear-gradient(to right, #004400, #00ff88)',
                transition: 'width 0.1s ease',
                borderRadius: '10px'
              }}></div>
            </div>
            
            {/* Audio Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: '#ccc',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ color: '#00ff88', fontWeight: 'bold' }}>Current</div>
                <div>{audioData.amplitude.toFixed(1)}</div>
              </div>
              <div>
                <div style={{ color: '#00ccff', fontWeight: 'bold' }}>Baseline</div>
                <div>{audioData.baseline.toFixed(1)}</div>
              </div>
              <div>
                <div style={{ color: '#ff8844', fontWeight: 'bold' }}>Recording</div>
                <div>{recordedLevels.length}</div>
              </div>
            </div>
            
            {/* 8-Band Frequency Visualization */}
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                color: '#4488ff',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}>
                🎵 8-Band Frequency Analysis
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '4px',
                height: '60px',
                alignItems: 'end'
              }}>
                {frequencyBands.map((level, index) => {
                  const height = Math.min(100, (level / 255) * 100);
                  const color = height > 70 ? '#ff4444' :
                              height > 40 ? '#ff8844' :
                              height > 20 ? '#ffff00' :
                              height > 5 ? '#00ff88' : '#004400';
                  return (
                    <div key={index} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%'
                    }}>
                      <div style={{
                        width: '100%',
                        height: `${height}%`,
                        background: color,
                        borderRadius: '2px',
                        transition: 'height 0.1s ease',
                        minHeight: '2px'
                      }}></div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#888',
                        marginTop: '2px'
                      }}>
                        {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '2px',
                fontSize: '0.6rem',
                color: '#666',
                textAlign: 'center',
                marginTop: '0.5rem'
              }}>
                <div>50-150</div>
                <div>150-300</div>
                <div>300-500</div>
                <div>500-750</div>
                <div>750-1k</div>
                <div>1-1.3k</div>
                <div>1.3-1.6k</div>
                <div>1.6-2k</div>
              </div>
              <div style={{
                fontSize: '0.6rem',
                color: '#888',
                textAlign: 'center',
                marginTop: '0.2rem'
              }}>
                Breathing-specific frequency bands (Hz)
              </div>
            </div>
          </div>

          {/* Stop button */}
          <button 
            onClick={stopCalibration}
            style={{ 
              fontSize: '1rem', 
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(45deg, #ff6b6b, #ff4444)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🛑 Stop Exercise
          </button>
        </div>
      )}

      {/* Calibration Complete Results */}
      {isCalibrationComplete && (
        <div style={{
          marginTop: '2rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(68, 136, 255, 0.15))',
          borderRadius: '16px',
          border: '2px solid rgba(0, 255, 136, 0.4)',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 255, 136, 0.2)'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#00ff88',
            marginBottom: '1rem'
          }}>
            🎉 Calibration Complete!
          </div>
          
          <div style={{
            fontSize: '1.2rem',
            color: '#888',
            marginBottom: '2rem'
          }}>
            {savedCalibration 
              ? "Your personal breathing profile has been saved and will be used to improve game accuracy."
              : "Calibration completed! No breathing data was recorded during this session."
            }
          </div>
          
          {savedCalibration && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
            <div style={{
              padding: '1rem',
              background: 'rgba(68, 136, 255, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(68, 136, 255, 0.3)'
            }}>
              <div style={{ color: '#4488ff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                💨 INHALE MAX
              </div>
              <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {savedCalibration.inhaleMax.toFixed(1)}
              </div>
            </div>
            
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 100, 100, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 100, 100, 0.3)'
            }}>
              <div style={{ color: '#ff6444', fontWeight: 'bold', fontSize: '0.9rem' }}>
                🔥 EXHALE MAX
              </div>
              <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {savedCalibration.exhaleMax.toFixed(1)}
              </div>
            </div>
            
            <div style={{
              padding: '1rem',
              background: 'rgba(0, 255, 136, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 255, 136, 0.3)'
            }}>
              <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '0.9rem' }}>
                📊 BASELINE
              </div>
              <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {savedCalibration.baseline.toFixed(1)}
              </div>
            </div>
            
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 149, 0, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 149, 0, 0.3)'
            }}>
              <div style={{ color: '#ff9500', fontWeight: 'bold', fontSize: '0.9rem' }}>
                📈 DATA POINTS
              </div>
              <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {savedCalibration.dataPoints}
              </div>
            </div>
          </div>
          )}
          
          <button 
            onClick={() => {
              setIsCalibrationComplete(false);
              onSwitchToPlay();
            }}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(45deg, #00ff88, #4488ff)',
              color: '#fff',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(0, 255, 136, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 255, 136, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 255, 136, 0.3)';
            }}
          >
            ✨ Ready to Play Game!
          </button>
        </div>
      )}

      {/* Saved Calibration Data Display */}
      {savedCalibration && !isListening && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'rgba(0, 255, 136, 0.1)',
          borderRadius: '12px',
          border: '2px solid rgba(0, 255, 136, 0.3)'
        }}>
          <div style={{ 
            color: '#00ff88', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            fontSize: '1.1rem',
            textAlign: 'center'
          }}>
            ✅ Calibration Complete!
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '1rem',
            fontSize: '0.9rem',
            marginBottom: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#00ff88', fontWeight: 'bold' }}>Inhale Max</div>
              <div>{savedCalibration.inhaleMax.toFixed(1)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff8844', fontWeight: 'bold' }}>Exhale Max</div>
              <div>{savedCalibration.exhaleMax.toFixed(1)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#00ccff', fontWeight: 'bold' }}>Baseline</div>
              <div>{savedCalibration.baseline.toFixed(1)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#4488ff', fontWeight: 'bold' }}>Data Points</div>
              <div>{savedCalibration.dataPoints}</div>
            </div>
          </div>

          <div style={{
            fontSize: '0.8rem',
            color: '#888',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            Recorded on {new Date(savedCalibration.timestamp).toLocaleDateString()} at{' '}
            {new Date(savedCalibration.timestamp).toLocaleTimeString()}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => {
                localStorage.removeItem('breathquest_calibration');
                setSavedCalibration(null);
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#ff6644',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              🗑️ Reset Calibration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalibrateBreathComponent;