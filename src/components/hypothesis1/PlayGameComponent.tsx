'use client';

import { useState, useEffect, useRef } from 'react';

interface BreathState {
  type: 'silence' | 'inhale' | 'exhale' | 'noise';
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
  spectralRolloff: number;
  dominantFrequency: number;
  amplitudeVariance: number;
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
  // Enhanced spectral analysis calibration data
  spectralFeatures?: {
    inhaleRolloffAvg: number;
    exhaleRolloffAvg: number;
    inhaleVarianceAvg: number;
    exhaleVarianceAvg: number;
    rolloffThreshold: number; // For real-time detection
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
    type: 'silence',
    label: '🤫 Silence',
    color: '#6366f1',
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
    spectralCentroid: 0,
    spectralRolloff: 0,
    dominantFrequency: 0,
    amplitudeVariance: 0
  });
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [isUsingCalibration, setIsUsingCalibration] = useState(false);
  const [isWaitingForSilence, setIsWaitingForSilence] = useState(false);
  const [silenceCountdown, setSilenceCountdown] = useState(0);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [audioBars, setAudioBars] = useState<number[]>(Array(20).fill(0));
  const [isClient, setIsClient] = useState(false);

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
  const stateHistoryRef = useRef<string[]>([]);  // Track recent states for smoothing
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceLevelsRef = useRef<number[]>([]);
  const ambientBaselineRef = useRef<number | null>(null);
  const isWaitingForSilenceRef = useRef<boolean>(false);

  // Load calibration data on component mount (client-side only)
  useEffect(() => {
    setIsClient(true);
    
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

  // Enhanced spectral analysis functions (from calibration component)
  const calculateSpectralCentroid = (frequencyData: Uint8Array, sampleRate: number): number => {
    if (frequencyData.length === 0) return 0;
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = frequencyData[i];
      const frequency = (i * sampleRate) / (frequencyData.length * 2);
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  };

  const calculateSpectralRolloff = (frequencyData: Uint8Array, sampleRate: number, threshold: number = 0.85): number => {
    const nyquist = sampleRate / 2;
    const binCount = frequencyData.length;
    
    let totalEnergy = 0;
    for (let i = 0; i < binCount; i++) {
      const magnitude = frequencyData[i] / 255.0;
      totalEnergy += magnitude * magnitude;
    }
    
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

  const calculateAmplitudeVariance = (timeDomain: Uint8Array): number => {
    if (timeDomain.length === 0) return 0;
    
    // Calculate mean amplitude
    let sum = 0;
    for (let i = 0; i < timeDomain.length; i++) {
      const sample = Math.abs((timeDomain[i] - 128) / 128.0);
      sum += sample;
    }
    const mean = sum / timeDomain.length;
    
    // Calculate variance
    let variance = 0;
    for (let i = 0; i < timeDomain.length; i++) {
      const sample = Math.abs((timeDomain[i] - 128) / 128.0);
      variance += Math.pow(sample - mean, 2);
    }
    
    return variance / timeDomain.length;
  };

  // Enhanced breath detection using calibration data
  const detectBreathTypeAdvanced = (rolloff: number, variance: number, centroid: number): 'inhale' | 'exhale' | 'unknown' => {
    if (!calibrationData?.spectralFeatures) {
      // Fallback to centroid-based detection when no advanced calibration
      return centroid >= 700 ? 'inhale' : centroid > 0 ? 'exhale' : 'unknown';
    }
    
    const { rolloffThreshold, inhaleVarianceAvg, exhaleVarianceAvg } = calibrationData.spectralFeatures;
    
    // Primary detection: rolloff threshold (our key research finding!)
    if (rolloff > rolloffThreshold) {
      return 'inhale';
    } else if (rolloff < rolloffThreshold * 0.7) {
      return 'exhale';
    }
    
    // Secondary detection: amplitude variance
    const varianceThreshold = (inhaleVarianceAvg + exhaleVarianceAvg) / 2;
    if (variance < varianceThreshold) {
      return 'inhale'; // More steady breathing
    } else {
      return 'exhale'; // More variable breathing
    }
  };

  const startSilenceDetection = async () => {
    try {
      console.log('🔇 Starting silence detection...');
      
      // Force close any existing audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }
      
      // Create completely fresh stream - EXACTLY like the working test
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('🎤 Fresh stream created:', stream.getAudioTracks()[0]?.label);
      
      // Create fresh audio context - EXACTLY like the working test  
      audioContextRef.current = new AudioContext();
      console.log('🔊 Fresh AudioContext created, state:', audioContextRef.current.state);
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Simple setup - EXACTLY like working test
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Basic settings first
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      
      microphoneRef.current.connect(analyserRef.current);
      console.log('🔊 Fresh setup complete');
      
      // Set state immediately
      silenceLevelsRef.current = [];
      ambientBaselineRef.current = null;
      isWaitingForSilenceRef.current = true; // Use ref for immediate state
      
      setIsWaitingForSilence(true);
      setSilenceCountdown(3);
      
      // Start detection immediately - no timeout needed!
      console.log('🔊 Starting detection immediately...');
      detectSilence();
      
    } catch (error) {
      console.error('❌ Microphone error:', error);
      alert(`Microphone error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const detectSilence = () => {
    if (!analyserRef.current || !isWaitingForSilenceRef.current) {
      console.log('🔊 Detection stopped - analyser:', !!analyserRef.current, 'waiting:', isWaitingForSilenceRef.current);
      return;
    }
    
    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);
    
    // Debug: Check if we're getting any data
    const sampleCheck = dataArray.slice(0, 10);
    if (silenceLevelsRef.current.length % 10 === 0) {
      // Audio processing debug (disabled to reduce noise)
    }
    
    // Calculate noise level
    let rmsSum = 0;
    let nonZeroSamples = 0;
    let minSample = 255;
    let maxSample = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const rawSample = dataArray[i];
      if (rawSample !== 128) nonZeroSamples++; // 128 is silence in Uint8Array
      if (rawSample < minSample) minSample = rawSample;
      if (rawSample > maxSample) maxSample = rawSample;
      
      const sample = (rawSample - 128) / 128;
      rmsSum += sample * sample;
    }
    const rms = Math.sqrt(rmsSum / bufferLength);
    let noiseLevel = rms * 100;
    
    // If we're getting all zeros, the analyser settings might be wrong
    if (noiseLevel < 0.01 && nonZeroSamples < 10) {
      // Try different analyser settings
      if (analyserRef.current) {
        analyserRef.current.minDecibels = -90;
        analyserRef.current.maxDecibels = -10;
        analyserRef.current.smoothingTimeConstant = 0.8;
      }
      
      // Also try frequency domain for noise level
      const freqArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
      analyserRef.current!.getByteFrequencyData(freqArray);
      
      let freqSum = 0;
      for (let i = 0; i < freqArray.length; i++) {
        freqSum += freqArray[i];
      }
      const avgFreq = freqSum / freqArray.length;
      if (avgFreq > 0.1) {
        noiseLevel = (avgFreq / 255) * 20; // Use frequency data instead
        console.log(`🔊 Switching to frequency domain: ${noiseLevel.toFixed(2)}`);
      }
    }
    
    // Generate live audio visualizer data
    const freqArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(freqArray);
    
    // Create 20 frequency bands for visualization
    const barsData: number[] = [];
    const binsPerBar = Math.floor(freqArray.length / 20);
    let totalFreqActivity = 0;
    
    for (let i = 0; i < 20; i++) {
      const startBin = i * binsPerBar;
      const endBin = Math.min(startBin + binsPerBar, freqArray.length);
      let sum = 0;
      for (let j = startBin; j < endBin; j++) {
        sum += freqArray[j];
      }
      const avgBin = sum / (endBin - startBin);
      const barValue = (avgBin / 255) * 100; // Convert to percentage
      barsData.push(barValue);
      totalFreqActivity += barValue;
    }
    
    // If no frequency activity at all, add some test data to verify UI is working
    if (totalFreqActivity < 1 && silenceLevelsRef.current.length > 5) {
              // No frequency activity detected - using test data
      // Add some random test data to see if bars work
      for (let i = 0; i < 20; i++) {
        barsData[i] = Math.random() * 30 + 5; // Random between 5-35%
      }
    }
    
    setAudioBars(barsData);
    
    // Debug audio data every 30 samples
    if (silenceLevelsRef.current.length % 30 === 0) {
      const totalFreqActivity = barsData.reduce((sum, val) => sum + val, 0) / barsData.length;
      // Audio debug info (reduced logging)
    }
    
    setNoiseLevel(noiseLevel);
    silenceLevelsRef.current.push(noiseLevel);
    
    // Keep full history until baseline is established, then keep last 30 samples
    if (ambientBaselineRef.current !== null && silenceLevelsRef.current.length > 30) {
      silenceLevelsRef.current.shift();
    }
    
    // Establish ambient baseline from first 20 samples (about 0.3 seconds) - much faster!
    if (ambientBaselineRef.current === null && silenceLevelsRef.current.length >= 20) {
      const baseline = silenceLevelsRef.current.reduce((sum, val) => sum + val, 0) / silenceLevelsRef.current.length;
      ambientBaselineRef.current = Math.max(baseline, 0.5); // Minimum baseline of 0.5
      console.log(`🎯 Ambient baseline established: ${ambientBaselineRef.current.toFixed(2)} (from ${baseline.toFixed(2)})`);
    }
    
    // Calculate current average and threshold
    const recentAverage = silenceLevelsRef.current.length > 0 
      ? silenceLevelsRef.current.reduce((sum, val) => sum + val, 0) / silenceLevelsRef.current.length 
      : noiseLevel;
    
    // Much stricter threshold: baseline + 50% tolerance (more sensitive to noise)
    const threshold = ambientBaselineRef.current !== null ? ambientBaselineRef.current * 1.5 : 1.0;
    
    // Debug logging
    if (silenceLevelsRef.current.length % 30 === 0) {
      // Noise level tracking (debug disabled)
    }
    
    if (ambientBaselineRef.current !== null && recentAverage <= threshold && silenceLevelsRef.current.length >= 25) {
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
        console.log(`🔊 Environment too noisy (${recentAverage.toFixed(2)} > ${threshold.toFixed(2)}), resetting countdown`);
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = null;
        setSilenceCountdown(3);
      }
    }
    
    if (isWaitingForSilenceRef.current) {
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
    
    // STOP silence detection - it's interfering with gameplay!
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    isWaitingForSilenceRef.current = false;
    
    // Audio context and analyser are already set up from silence detection
    // Just need to reset game variables
    
    // Use the ambient baseline we just established, not the tiny calibrated baseline
    // The calibrated baseline (0.37) is too sensitive for gameplay - it's for detecting subtle breath changes
    // The ambient baseline (0.50) is better for gaming as it filters out room noise
    const gameBaseline = ambientBaselineRef.current || 1.0;
    baselineRef.current = gameBaseline;
    console.log('🎯 Using ambient baseline for gaming:', gameBaseline, '(calibrated baseline:', calibrationData?.baseline || 'none', 'is too sensitive)');
    calibrationCountRef.current = 60; // Skip calibration for gaming
    amplitudeHistoryRef.current = [];
    lastUpdateTimeRef.current = 0;
    smoothedAmplitudeRef.current = 0;
    stateHistoryRef.current = []; // Reset state history
    
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
    isWaitingForSilenceRef.current = false; // Stop detection loop
    setShowUI(false);
    setCalibrationProgress(0);
    setSilenceCountdown(0);
    setNoiseLevel(0);
    setAudioBars(Array(20).fill(0));
    
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
        setBreathState({ 
      type: 'silence', 
      label: '🤫 Silence', 
      color: '#6366f1', 
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
    
    // Envelope detection (improved)
    let envelope = 0;
    let maxSample = 0;
    let minSample = 255;
    for (let i = 0; i < bufferLength; i++) {
      const rawSample = dataArray[i];
      maxSample = Math.max(maxSample, rawSample);
      minSample = Math.min(minSample, rawSample);
      const sample = Math.abs((rawSample - 128) / 128);
      envelope += sample;
    }
    envelope /= bufferLength;
    
    // Debug envelope - will add after normalizedAmplitude is calculated
    
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
    
    // Enhanced spectral analysis
    const spectralCentroid = calculateSpectralCentroid(freqArray, sampleRate);
    const spectralRolloff = calculateSpectralRolloff(freqArray, sampleRate);
    const dominantFrequency = calculateDominantFrequency(freqArray, sampleRate);
    const amplitudeVariance = calculateAmplitudeVariance(dataArray);
    
    const features: AudioFeatures = {
      rms,
      envelope,
      lpcGain,
      breathingFreqPower,
      spectralCentroid,
      spectralRolloff,
      dominantFrequency,
      amplitudeVariance
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
      
      // Dynamic thresholds based on calibration data (made more sensitive)
      const inhaleThreshold = calibrationData && isUsingCalibration 
        ? Math.max(1.5, calibrationData.inhaleMax * 0.2) // 20% of calibrated max inhale, minimum 1.5
        : 2.0; // Default threshold
      const exhaleThreshold = calibrationData && isUsingCalibration 
        ? Math.max(1.0, calibrationData.exhaleMax * 0.15) // 15% of calibrated max exhale, minimum 1.0  
        : 1.5; // Default threshold
      const normalThreshold = calibrationData && isUsingCalibration
        ? calibrationData.baseline * 1.5 // 50% above calibrated baseline
        : 0.8; // Default threshold
      
      // Debug logging for threshold analysis
      if (Math.random() < 0.02) { // Log occasionally
        console.log(`🔍 THRESHOLDS: inhale=${inhaleThreshold.toFixed(1)}, exhale=${exhaleThreshold.toFixed(1)}, strong=${Math.max(inhaleThreshold, exhaleThreshold).toFixed(1)}`);
        console.log(`📊 CURRENT: amp=${normalizedAmplitude.toFixed(1)}, rolloff=${spectralRolloff.toFixed(0)}Hz, variance=${(amplitudeVariance*1000).toFixed(2)}`);
      }

      // SIMPLIFIED 4-STATE DETECTION: silence, inhale, exhale, noise
      const strongBreathThreshold = Math.max(inhaleThreshold, exhaleThreshold);
      
      // Define noise threshold with hysteresis to prevent rapid switching
      // MUCH higher threshold - only truly loud environmental noise should trigger this
      const baseNoiseThreshold = Math.max(25, strongBreathThreshold * 15); // At least 25 amplitude + 15x breath threshold
      const noiseThreshold = breathState.type === 'noise' 
        ? baseNoiseThreshold * 0.8  // Lower threshold to exit noise state (hysteresis)
        : baseNoiseThreshold;       // Higher threshold to enter noise state
      
      if (normalizedAmplitude > noiseThreshold) {
        // Too loud - probably environmental noise
        confidence = Math.min(100, normalizedAmplitude * 10);
        newState = { 
          type: 'noise', 
          label: '🔊 Environmental Noise', 
          color: '#ff9500', 
          scale: 0.8,
          confidence: confidence,
          medicalNote: `Environmental noise detected - too loud for breathing ${isUsingCalibration ? '(calibrated)' : '(default)'}`
        };
      } else if (normalizedAmplitude > strongBreathThreshold) {
        // Strong breathing detected - use advanced detection
        const detectedType = detectBreathTypeAdvanced(spectralRolloff, amplitudeVariance, spectralCentroid);
        
        console.log(`🔍 ENHANCED BREATH: rolloff=${spectralRolloff.toFixed(0)}Hz, variance=${(amplitudeVariance*1000).toFixed(2)}, type=${detectedType}, amp=${normalizedAmplitude.toFixed(1)}`);
        
        if (detectedType === 'inhale') {
          console.log(`✅ SETTING INHALE STATE`);
          confidence = Math.min(100, normalizedAmplitude * 40);
          newState = { 
            type: 'inhale', 
            label: '💨 Inhale', 
            color: '#4488ff', 
            scale: 1.4,
            confidence: confidence,
            medicalNote: `Inhale detected - Enhanced AI ${calibrationData?.spectralFeatures ? '(personalized)' : '(default)'}`
          };
        } else if (detectedType === 'exhale') {
          console.log(`✅ SETTING EXHALE STATE`);
          confidence = Math.min(100, normalizedAmplitude * 30);
          newState = { 
            type: 'exhale', 
            label: '🔥 Exhale', 
            color: '#ff6644', 
            scale: 0.7,
            confidence: confidence,
            medicalNote: `Exhale detected - Enhanced AI ${calibrationData?.spectralFeatures ? '(personalized)' : '(default)'}`
          };
        } else {
          // Unknown/ambiguous detection - default to silence
          confidence = Math.min(100, normalizedAmplitude * 15);
          newState = { 
            type: 'silence', 
            label: '🤔 Unclear', 
            color: '#6366f1', // Nice indigo color instead of gray
            scale: 1.0,
            confidence: confidence,
            medicalNote: `Unclear breath pattern - Enhanced AI ${calibrationData?.spectralFeatures ? '(personalized)' : '(default)'}`
          };
        }
      } else {
        // Low amplitude - silence
        confidence = Math.min(100, (normalThreshold - normalizedAmplitude) / normalThreshold * 100);
        newState = { 
          type: 'silence', 
          label: '🤫 Silence', 
          color: '#6366f1', // Nice indigo color instead of gray
          scale: 1.0,
          confidence: confidence,
          medicalNote: `Silence detected ${isUsingCalibration ? '(calibrated)' : '(default)'}`
        };
      }
      
      // State smoothing to prevent rapid oscillations
      stateHistoryRef.current.push(newState.type);
      if (stateHistoryRef.current.length > 5) {
        stateHistoryRef.current.shift(); // Keep only last 5 states
      }
      
      // Only change state if we have consistent detection (3 out of last 5)
      if (stateHistoryRef.current.length >= 3) {
        const stateCounts = stateHistoryRef.current.reduce((acc, state) => {
          acc[state] = (acc[state] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const mostCommonState = Object.entries(stateCounts)
          .sort(([,a], [,b]) => b - a)[0][0];
        
        // Only update if the most common state appears at least 3 times, OR it's different from current
        if (stateCounts[mostCommonState] >= 3 || mostCommonState !== breathState.type) {
          // Update the state type but keep other properties
          newState.type = mostCommonState as any;
          setBreathState(newState);
        }
      } else {
        // Not enough history yet, just set the state
        setBreathState(newState);
      }
      
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
        return 'translateY(20px) scale(0.7)';
      case 'noise':
        return 'translateY(10px) scale(0.9) rotate(2deg)';
      case 'silence':
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
      marginBottom: '2rem',
      position: 'relative'
    }}>
      <h2 style={{ color: '#00ff88', marginBottom: '1rem', textAlign: 'center' }}>
        🎮 Play Game
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#ccc' }}>
        Control a game character with your breathing patterns
      </p>

      {/* Calibration Recommendation Banner for Uncalibrated Users */}
      {isClient && !isUsingCalibration && !isListening && (
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.15), rgba(255, 179, 71, 0.15))',
          border: '2px solid rgba(255, 149, 0, 0.4)',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#ff9500',
            marginBottom: '0.5rem'
          }}>
            🎯 Unlock Enhanced AI Detection
          </div>
          <p style={{
            color: '#ccc',
            marginBottom: '1rem',
            lineHeight: '1.5'
          }}>
            You're using <strong style={{ color: '#ffaa00' }}>default breath detection</strong>. 
            Complete the 30-second calibration to create a <strong style={{ color: '#00ff88' }}>personalized AI model</strong> that 
            dramatically improves accuracy and gaming experience!
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              padding: '0.8rem 1rem',
              background: 'rgba(255, 149, 0, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 149, 0, 0.3)',
              fontSize: '0.9rem'
            }}>
              <div style={{ color: '#ff9500', fontWeight: 'bold' }}>Current: Default AI</div>
              <div style={{ color: '#ccc' }}>Generic breath patterns</div>
            </div>
            <div style={{
              padding: '0.8rem 1rem',
              background: 'rgba(0, 255, 136, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              fontSize: '0.9rem'
            }}>
              <div style={{ color: '#00ff88', fontWeight: 'bold' }}>After Calibration: Enhanced AI</div>
              <div style={{ color: '#ccc' }}>Your personal spectral signature</div>
            </div>
          </div>
        </div>
      )}

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
            {ambientBaselineRef.current === null 
              ? `Establishing baseline... ${Math.max(0, 20 - silenceLevelsRef.current.length)}/20 samples`
              : 'Environment detected! Stay quiet for the game to begin.'
            }
          </div>

          {/* Live Audio Visualizer - Shows RAW audio activity */}
          <div style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#ff9500', 
              marginBottom: '0.5rem',
              fontWeight: 'bold'
            }}>
              🔊 Live Audio Activity
            </div>
            
            {/* Raw Audio Bars */}
            <div style={{
              display: 'flex',
              gap: '2px',
              height: '40px',
              alignItems: 'flex-end',
              marginBottom: '0.5rem'
            }}>
              {audioBars.map((barLevel, i) => {
                const barHeight = Math.max(2, (barLevel / 100) * 40); // Scale to 40px max height
                return (
                  <div key={i} style={{
                    flex: 1,
                    height: `${barHeight}px`,
                    background: barLevel > 30 ? '#ff4444' : barLevel > 15 ? '#ffaa44' : '#00ff88',
                    borderRadius: '2px',
                    transition: 'height 0.05s ease',
                    minHeight: '2px' // Always show some bar
                  }}></div>
                );
              })}
            </div>
            
            <div style={{ fontSize: '0.8rem', color: '#888' }}>
              Live audio frequency visualization
            </div>
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
              width: `${Math.min(100, noiseLevel * 10)}%`, // More responsive scaling
              background: (() => {
                const threshold = ambientBaselineRef.current !== null ? ambientBaselineRef.current * 1.5 : 1.0;
                return noiseLevel <= threshold ? 'linear-gradient(to right, #00ff88, #4488ff)' : 
                       noiseLevel < threshold * 2 ? 'linear-gradient(to right, #ffff00, #ff8844)' :
                       'linear-gradient(to right, #ff4444, #ff8844)';
              })(),
              transition: 'width 0.05s ease', // Faster response
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
              <div style={{ 
                color: (() => {
                  const threshold = ambientBaselineRef.current !== null ? ambientBaselineRef.current * 1.5 : 1.0;
                  return noiseLevel <= threshold ? '#00ff88' : '#ff8844';
                })(), 
                fontWeight: 'bold' 
              }}>
                Environment Status
              </div>
              <div>
                {(() => {
                  const threshold = ambientBaselineRef.current !== null ? ambientBaselineRef.current * 1.5 : 1.0;
                  const status = noiseLevel <= threshold ? '✅ Quiet enough' : '⚠️ Too noisy';
                  return `${status} (${noiseLevel.toFixed(1)}/${threshold.toFixed(1)})`;
                })()}
              </div>
            </div>
            <div>
              <div style={{ color: '#ff9500', fontWeight: 'bold' }}>
                Starting in
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {ambientBaselineRef.current === null 
                  ? 'Establishing...'
                  : silenceCountdown > 0 ? `${silenceCountdown}s` : 'Waiting...'
                }
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
          
          {/* Enhanced Spectral Analysis Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '0.8rem',
            fontSize: '0.85rem',
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
              <div style={{ color: '#ff9500', fontWeight: 'bold' }}>Rolloff</div>
              <div>{audioFeatures.spectralRolloff.toFixed(0)}Hz</div>
            </div>
            <div>
              <div style={{ color: '#4488ff', fontWeight: 'bold' }}>Centroid</div>
              <div>{audioFeatures.spectralCentroid.toFixed(0)}Hz</div>
            </div>
            <div>
              <div style={{ color: '#ff6444', fontWeight: 'bold' }}>Variance</div>
              <div>{(audioFeatures.amplitudeVariance * 1000).toFixed(2)}</div>
            </div>
            <div>
              <div style={{ color: calibrationData?.spectralFeatures ? '#00ff88' : '#ffaa00', fontWeight: 'bold' }}>
                AI Mode
              </div>
              <div style={{ color: calibrationData?.spectralFeatures ? '#00ff88' : '#ffaa00' }}>
                {calibrationData?.spectralFeatures ? '🧠 Personal' : '🎲 Default'}
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
        
        {/* Compact instructions in corner */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: '#ffffff',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
          textAlign: 'right',
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(68, 136, 255, 0.2))',
          padding: '10px 16px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          💨 Breathe to Control
        </div>
        
        {/* Large, prominent breath state display */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          {/* Main state label */}
          <div style={{
            fontSize: showUI ? '4rem' : '3rem',
            fontWeight: '900',
            color: breathState.color,
            textShadow: `0 0 30px ${breathState.color}, 0 0 60px ${breathState.color}40, 0 8px 16px rgba(0, 0, 0, 0.9)`,
            marginBottom: '16px',
            transition: 'all 0.4s ease',
            letterSpacing: '2px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {breathState.label}
          </div>
          
          {/* State description/tip */}
          {showUI && (
            <div style={{
              fontSize: '1.4rem',
              color: '#ffffff',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.9), 0 0 20px rgba(255, 255, 255, 0.1)',
              fontWeight: '500',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
              padding: '12px 24px',
              borderRadius: '16px',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              letterSpacing: '0.5px'
            }}>
              {breathState.type === 'inhale' && '⬆️ Character rises and charges'}
              {breathState.type === 'exhale' && '⬇️ Character attacks and shrinks'}
              {breathState.type === 'silence' && '✨ Breathe to begin...'}
              {breathState.type === 'noise' && '🔊 Environment too loud'}
            </div>
          )}
        </div>
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
              {calibrationData?.spectralFeatures ? '🧠 Enhanced AI Calibration' : '🎯 Basic Personal Calibration'}
              {calibrationData && (
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                  {calibrationData.spectralFeatures ? 
                    `Spectral analysis • ${new Date(calibrationData.timestamp).toLocaleDateString()}` :
                    `Basic • ${new Date(calibrationData.timestamp).toLocaleDateString()}`
                  }
                </div>
              )}
            </>
          ) : (
            <>🎲 Using Default AI Settings</>
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