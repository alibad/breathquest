'use client';

import { useState, useEffect, useRef } from 'react';
import { TimeDomainTool } from '@/components/audio-tools/TimeDomainTool';
import { FrequencyDomainTool } from '@/components/audio-tools/FrequencyDomainTool';
import { AmplitudeEnvelopeTool } from '@/components/audio-tools/AmplitudeEnvelopeTool';
import { FrequencyBandTool } from '@/components/audio-tools/FrequencyBandTool';

import { LPCAnalysisTool } from '@/components/audio-tools/LPCAnalysisTool';

import { AudioConfigurationPanel } from '@/components/audio-tools/AudioConfigurationPanel';
import { AudioVideoRecorder } from '@/components/audio-tools/AudioVideoRecorder';

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
  const audioStreamRef = useRef<MediaStream | null>(null);
  
  // Canvas refs for recording
  const timeDomainCanvasRef = useRef<HTMLCanvasElement>(null);
  const frequencyDomainCanvasRef = useRef<HTMLCanvasElement>(null);
  const amplitudeEnvelopeCanvasRef = useRef<HTMLCanvasElement>(null);
  const frequencyBandCanvasRef = useRef<HTMLCanvasElement>(null);

  const lpcAnalysisCanvasRef = useRef<HTMLCanvasElement>(null);


  const startAudioCapture = async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
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

    // Stop audio stream tracks
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    // Reset audio data
    setAudioData({
      timeDomain: new Uint8Array(0),
      frequencyDomain: new Uint8Array(0),
      sampleRate: 0,
      bufferSize: 0
    });
  };



  // Start/stop processing when listening state changes
  useEffect(() => {
    if (!isListening) {
      // Stop processing
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    if (!analyserRef.current || !audioContextRef.current) return;

    // Start processing with a local function that doesn't cause re-renders
    let shouldContinue = true;
    
    const processAudio = () => {
      if (!shouldContinue || !isListeningRef.current || !analyserRef.current || !audioContextRef.current) {
        return;
      }
      
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
      if (shouldContinue && isListeningRef.current) {
        animationRef.current = requestAnimationFrame(processAudio);
      }
    };

    // Start the processing loop
    processAudio();

    // Cleanup function
    return () => {
      shouldContinue = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isListening]);

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
      {isListening && <AudioConfigurationPanel audioData={audioData} />}

      {/* Recording Controls */}
      {isListening && (
        <AudioVideoRecorder 
          isListening={isListening}
          canvasRefs={[timeDomainCanvasRef, amplitudeEnvelopeCanvasRef, frequencyDomainCanvasRef, frequencyBandCanvasRef, lpcAnalysisCanvasRef]}
          audioStream={audioStreamRef.current || undefined}
        />
      )}

      {/* Audio Analysis Tools */}
      {isListening && (
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          <TimeDomainTool audioData={audioData} canvasRef={timeDomainCanvasRef} />
          <AmplitudeEnvelopeTool audioData={audioData} canvasRef={amplitudeEnvelopeCanvasRef} />
          <FrequencyDomainTool audioData={audioData} canvasRef={frequencyDomainCanvasRef} />
          <FrequencyBandTool audioData={audioData} canvasRef={frequencyBandCanvasRef} />

          <LPCAnalysisTool audioData={audioData} canvasRef={lpcAnalysisCanvasRef} />
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