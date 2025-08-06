'use client';

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

const PlayGameComponent = () => {
  // State management
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
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
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [isUsingCalibration, setIsUsingCalibration] = useState(false);
  const [isWaitingForSilence, setIsWaitingForSilence] = useState(false);
  const [silenceCountdown, setSilenceCountdown] = useState(0);
  const [noiseLevel, setNoiseLevel] = useState(0);

  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Processing variables
  const baselineRef = useRef(0);
  const calibrationCountRef = useRef(0);
  const amplitudeHistoryRef = useRef<number[]>([]);
  const lastUpdateTimeRef = useRef(0);
  const smoothedAmplitudeRef = useRef(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceLevelsRef = useRef<number[]>([]);

  // Load calibration data on component mount
  useEffect(() => {
    const loadCalibrationData = () => {
      try {
        const saved = localStorage.getItem('breathquest_calibration');
        if (saved) {
          const data: CalibrationData = JSON.parse(saved);
          // Check if calibration is recent (within 24 hours)
          const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
          if (isRecent) {
            setCalibrationData(data);
            setIsUsingCalibration(true);
            console.log('✅ Loaded calibration data from', new Date(data.timestamp).toLocaleString());
          } else {
            console.log('⚠️ Calibration data is old, using defaults');
            setIsUsingCalibration(false);
          }
        } else {
          console.log('📝 No calibration data found, using defaults');
          setIsUsingCalibration(false);
        }
      } catch (error) {
        console.error('❌ Error loading calibration data:', error);
        setIsUsingCalibration(false);
      }
    };

    loadCalibrationData();
  }, []);

  const startSilenceDetection = async () => {
    try {
      console.log('🔇 Starting silence detection...');
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
      
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      
      microphoneRef.current.connect(analyserRef.current);
      
      setIsWaitingForSilence(true);
      setSilenceCountdown(3);
      silenceLevelsRef.current = [];
      
      detectSilence();
      
    } catch (error) {
      console.error('❌ Microphone error:', error);
      alert('Microphone access denied. Please allow microphone access and refresh the page.');
    }
  };

  const detectSilence = () => {
    if (!analyserRef.current || !isWaitingForSilence) return;
    
    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);
    
    // Calculate noise level
    let rmsSum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const sample = (dataArray[i] - 128) / 128;
      rmsSum += sample * sample;
    }
    const rms = Math.sqrt(rmsSum / bufferLength);
    const noiseLevel = rms * 100;
    
    setNoiseLevel(noiseLevel);
    silenceLevelsRef.current.push(noiseLevel);
    
    // Keep only last 30 samples (about 0.5 seconds)
    if (silenceLevelsRef.current.length > 30) {
      silenceLevelsRef.current.shift();
    }
    
    // Check if environment is quiet enough (threshold: 1.0)
    const recentAverage = silenceLevelsRef.current.length > 0 
      ? silenceLevelsRef.current.reduce((sum, val) => sum + val, 0) / silenceLevelsRef.current.length 
      : noiseLevel;
    
    if (recentAverage < 1.0 && silenceLevelsRef.current.length >= 15) {
      // Environment is quiet, start countdown
      if (!silenceTimerRef.current) {
        console.log('🤫 Quiet environment detected, starting countdown...');
        silenceTimerRef.current = setInterval(() => {
          setSilenceCountdown(prev => {
            if (prev <= 1) {
              clearInterval(silenceTimerRef.current!);
              silenceTimerRef.current = null;
              setIsWaitingForSilence(false);
              console.log('✅ Silence confirmed, starting game...');
              actuallyStartGame();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      // Environment too noisy, reset countdown
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = null;
        setSilenceCountdown(3);
      }
    }
    
    if (isWaitingForSilence) {
      animationRef.current = requestAnimationFrame(detectSilence);
    }
  };

  const startGame = async () => {
    if (isListeningRef.current) {
      stopGame();
      return;
    }

    // Start with silence detection
    await startSilenceDetection();
  };

  const actuallyStartGame = () => {
    console.log('🎮 Starting game mode after silence confirmation...');
    
    // Audio context and analyser are already set up from silence detection
    // Just need to reset game variables
    
    // Reset variables - use calibration data if available
    if (calibrationData && isUsingCalibration) {
      baselineRef.current = calibrationData.baseline;
      console.log('🎯 Using calibrated baseline:', calibrationData.baseline);
    } else {
      baselineRef.current = 2.0; // Default baseline for gaming
      console.log('🎲 Using default baseline: 2.0');
    }
    calibrationCountRef.current = 60; // Skip calibration for gaming
    amplitudeHistoryRef.current = [];
    lastUpdateTimeRef.current = 0;
    smoothedAmplitudeRef.current = 0;
    
    setIsListening(true);
    isListeningRef.current = true;
    setIsCalibrating(false); // No calibration needed for gaming
    setShowUI(true);
    setCalibrationProgress(100); // Already "calibrated"
    
    detectBreath();
  };

  const stopGame = () => {
    setIsListening(false);
    isListeningRef.current = false;
    setIsCalibrating(false);
    setIsWaitingForSilence(false);
    setShowUI(false);
    setCalibrationProgress(0);
    setSilenceCountdown(0);
    setNoiseLevel(0);
    
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
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
    
    // Enhanced breath detection algorithm
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const binSize = sampleRate / (bufferLength * 2);
    const breathingBinStart = Math.floor(100 / binSize);
    const breathingBinEnd = Math.floor(1200 / binSize);
    
    let breathingFreqPower = 0;
    const validBinEnd = Math.min(breathingBinEnd, freqArray.length);
    for (let i = breathingBinStart; i < validBinEnd; i++) {
      breathingFreqPower += freqArray[i];
    }
    breathingFreqPower /= (validBinEnd - breathingBinStart);
    
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
    
    // LPC gain approximation
    let lpcGain = 0;
    for (let i = 2; i < bufferLength - 2; i++) {
      const sample = (dataArray[i] - 128) / 128;
      const predicted = 0.5 * ((dataArray[i-1] - 128) / 128) + 0.3 * ((dataArray[i-2] - 128) / 128);
      const error = Math.abs(sample - predicted);
      lpcGain += error * error;
    }
    lpcGain = Math.sqrt(lpcGain / (bufferLength - 4));
    
    // Spectral centroid
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = breathingBinStart; i < validBinEnd; i++) {
      const frequency = i * binSize;
      const magnitude = freqArray[i];
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    
    const features: AudioFeatures = {
      rms,
      envelope,
      lpcGain,
      breathingFreqPower,
      spectralCentroid
    };
    
    const rawAmplitude = Math.max(
      envelope * 100,
      breathingFreqPower * 1.2,
      lpcGain * 80,
      rms * 60
    );
    
    setAudioFeatures(features);
    
    const currentTime = Date.now();
    const shouldUpdateUI = currentTime - lastUpdateTimeRef.current > 50;
    
    // Calibration phase
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
      
      if (calibrationCountRef.current === 60) {
        baselineRef.current = baselineRef.current / 60;
        setIsCalibrating(false);
        console.log(`✅ Game calibration complete! Baseline: ${baselineRef.current.toFixed(2)}`);
      }
      animationRef.current = requestAnimationFrame(detectBreath);
      return;
    }
    
    // Post-calibration processing
    const smoothingFactor = 0.08;
    smoothedAmplitudeRef.current = (smoothingFactor * rawAmplitude) + ((1 - smoothingFactor) * smoothedAmplitudeRef.current);
    const amplitude = smoothedAmplitudeRef.current;
    
    amplitudeHistoryRef.current.push(amplitude);
    if (amplitudeHistoryRef.current.length > 25) {
      amplitudeHistoryRef.current.shift();
    }
    
    const relativeAmplitude = amplitude - baselineRef.current;
    const normalizedAmplitude = relativeAmplitude / (baselineRef.current + 0.1);
    
    const trend = amplitudeHistoryRef.current.length >= 10 ? 
      amplitudeHistoryRef.current[amplitudeHistoryRef.current.length - 1] - amplitudeHistoryRef.current[amplitudeHistoryRef.current.length - 10] : 0;
    
    // Gaming breath state detection
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
      
      // Dynamic thresholds based on calibration data
      const exhaleThreshold = calibrationData && isUsingCalibration 
        ? calibrationData.exhaleMax * 0.7 // 70% of calibrated max exhale
        : 2.5; // Default threshold
      const inhaleThreshold = calibrationData && isUsingCalibration 
        ? calibrationData.inhaleMax * 0.6 // 60% of calibrated max inhale  
        : 1.5; // Default threshold
      const normalThreshold = calibrationData && isUsingCalibration
        ? calibrationData.baseline * 1.2 // 20% above calibrated baseline
        : 0.8; // Default threshold

      if (normalizedAmplitude > exhaleThreshold && trend > 1.0 && lpcGain > 0.5) {
        confidence = Math.min(100, (normalizedAmplitude + lpcGain) * 30);
        newState = { 
          type: 'exhale', 
          label: '🔥 Sharp Exhale', 
          color: '#ff6644', 
          scale: 0.7,
          confidence: confidence,
          medicalNote: `Strong exhale detected - great for powerful attacks! ${isUsingCalibration ? '(calibrated)' : '(default)'}`
        };
      } else if (normalizedAmplitude > inhaleThreshold && envelope > 0.8) {
        confidence = Math.min(100, (envelope + normalizedAmplitude) * 40);
        newState = { 
          type: 'inhale', 
          label: '💨 Deep Inhale', 
          color: '#4488ff', 
          scale: 1.5,
          confidence: confidence,
          medicalNote: `Deep breath detected - perfect for charging up! ${isUsingCalibration ? '(calibrated)' : '(default)'}`
        };
      } else if (normalizedAmplitude > normalThreshold) {
        confidence = Math.min(100, envelope * 60);
        newState = { 
          type: 'normal', 
          label: '🌬️ Normal Breathing', 
          color: '#00ff88', 
          scale: 1,
          confidence: confidence,
          medicalNote: `Steady breathing - good for movement and exploration ${isUsingCalibration ? '(calibrated)' : '(default)'}`
        };
      } else if (lpcGain < 0.05 && envelope < 0.1) {
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
        newState = { 
          type: 'normal', 
          label: '🔄 Changing Pattern', 
          color: '#ffaa44', 
          scale: 1,
          confidence: 30,
          medicalNote: 'Breathing pattern is changing...'
        };
      }
      
      setBreathState(newState);
      lastUpdateTimeRef.current = currentTime;
    }
    
    animationRef.current = requestAnimationFrame(detectBreath);
  };

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
      background: 'rgba(0, 255, 136, 0.05)',
      padding: '2rem',
      borderRadius: '16px',
      border: '2px solid rgba(0, 255, 136, 0.3)',
      marginBottom: '2rem'
    }}>
      <h2 style={{ color: '#00ff88', marginBottom: '1rem', textAlign: 'center' }}>
        🎮 Play Game
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#ccc' }}>
        Control a game character with your breathing patterns
      </p>

      {/* Silence Detection UI */}
      {isWaitingForSilence && (
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '2rem',
          background: 'rgba(255, 149, 0, 0.1)',
          borderRadius: '12px',
          border: '2px solid rgba(255, 149, 0, 0.4)'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#ff9500',
            marginBottom: '1rem'
          }}>
            🤫 Waiting for Quiet Environment
          </div>
          
          <div style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            marginBottom: '1rem' 
          }}>
            Please ensure your environment is quiet so we can establish a proper baseline.
          </div>

          {/* Noise Level Meter */}
          <div style={{
            width: '100%',
            height: '20px',
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, noiseLevel * 10)}%`,
              background: noiseLevel < 1.0 ? 'linear-gradient(to right, #00ff88, #4488ff)' : 
                         noiseLevel < 3.0 ? 'linear-gradient(to right, #ffff00, #ff8844)' :
                         'linear-gradient(to right, #ff4444, #ff8844)',
              transition: 'width 0.1s ease',
              borderRadius: '10px'
            }}></div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            fontSize: '0.9rem',
            color: '#888'
          }}>
            <div>
              <div style={{ color: noiseLevel < 1.0 ? '#00ff88' : '#ff8844', fontWeight: 'bold' }}>
                Environment Status
              </div>
              <div>{noiseLevel < 1.0 ? '✅ Quiet enough' : '⚠️ Too noisy'}</div>
            </div>
            <div>
              <div style={{ color: '#ff9500', fontWeight: 'bold' }}>
                Starting in
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {silenceCountdown > 0 ? `${silenceCountdown}s` : 'Waiting...'}
              </div>
            </div>
          </div>
        </div>
      )}

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
          boxShadow: '0 8px 32px rgba(0, 255, 136, 0.2)',
          margin: '0 auto 1.5rem auto'
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
        maxWidth: '800px',
        height: '60vh',
        minHeight: '400px',
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

      {/* Calibration Status */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        width: '100%',
        marginTop: '1rem'
      }}>
        <div style={{
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          background: isUsingCalibration 
            ? 'linear-gradient(45deg, #00ff88, #4488ff)' 
            : 'linear-gradient(45deg, #ff9500, #ffb347)',
          color: '#fff',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
        }}>
          {isUsingCalibration ? (
            <>
              🎯 Using Personal Calibration
              {calibrationData && (
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                  Calibrated {new Date(calibrationData.timestamp).toLocaleDateString()}
                </div>
              )}
            </>
          ) : (
            <>🎲 Using Default Settings</>
          )}
        </div>
      </div>

      {/* Start/Stop Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        width: '100%',
        marginTop: '1rem'
      }}>
        <button 
          className="btn pulse" 
          style={{ 
            fontSize: '1.1rem', 
            padding: '1rem 2rem',
            background: isListening 
              ? 'linear-gradient(45deg, #ff6b6b, #ff4444)' 
              : 'linear-gradient(45deg, #00ff88, #4488ff)',
            border: 'none',
            borderRadius: '25px',
            color: '#fff',
            fontWeight: 'bold',
            boxShadow: isListening 
              ? '0 8px 32px rgba(255, 107, 107, 0.4)' 
              : '0 8px 32px rgba(0, 255, 136, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            width: 'fit-content',
            minWidth: '250px'
          }}
          onClick={startGame}
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
          {isListening ? '🛑 Stop Game' : '🎮 Start Game'}
        </button>
      </div>
    </div>
  );
};

export default PlayGameComponent;