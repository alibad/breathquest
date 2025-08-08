'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import ClapPlayDemo from '../../components/clap/ClapPlayDemo';
import ClapTimeline from '../../components/clap/ClapTimeline';
import ClapConfigPanel from '../../components/clap/ClapConfigPanel';
import { ClapDetector } from '../../components/clap/ClapDetector';
import { ClapPatternMatcher, type ClapEvent } from '../../components/clap/ClapPatternMatcher';
import ClapMeters from '../../components/clap/ClapMeters';

export default function HypothesisTwoPage() {
  const [isClient, setIsClient] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState<'play'>('play');
  const [events, setEvents] = useState<ClapEvent[]>([]);
  const [patternHistory, setPatternHistory] = useState<{ name: string; detectedAt: number }[]>([]);
  const [clapCount, setClapCount] = useState(0);
  const [liveRms, setLiveRms] = useState(0);
  const [liveBaseline, setLiveBaseline] = useState(0);
  const [liveThreshold, setLiveThreshold] = useState(0);
  const [liveCentroid, setLiveCentroid] = useState(0);
  const [liveFlatness, setLiveFlatness] = useState(0);
  const [gateStatus, setGateStatus] = useState<{ rms: boolean; band: boolean; cooldown: boolean }>({ rms: false, band: true, cooldown: false });
  const [flash, setFlash] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Audio plumbing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const timeArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Detectors
  const detectorRef = useRef<ClapDetector | null>(null);
  const matcherRef = useRef<ClapPatternMatcher | null>(null);

  useEffect(() => setIsClient(true), []);

  // Start/stop listening
  const startListening = async () => {
    if (!isClient || isListening) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1
      },
      video: false
    } as MediaStreamConstraints);
    mediaStreamRef.current = stream;
    const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ac;
    const source = ac.createMediaStreamSource(stream);
    const analyser = ac.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.05;
    source.connect(analyser);
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    timeArrayRef.current = new Uint8Array(analyser.fftSize);

    detectorRef.current = new ClapDetector();
    matcherRef.current = new ClapPatternMatcher();

    setIsListening(true);
    loop();
  };

  const stopListening = () => {
    setIsListening(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaStreamRef.current = null;
    analyserRef.current?.disconnect();
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  };

  const loop = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const now = performance.now();
    analyser.getByteFrequencyData(dataArrayRef.current!);
    analyser.getByteTimeDomainData(timeArrayRef.current!);

    const features = detectorRef.current!.computeFeatures({
      timeDomain: timeArrayRef.current!,
      frequencyDomain: dataArrayRef.current!,
      sampleRate: audioContextRef.current!.sampleRate,
      timestampMs: now
    });
    setLiveRms(features.rms);
    setLiveBaseline(features.baseline);
    setLiveThreshold(features.threshold);
    setLiveCentroid(features.centroid);
    setLiveFlatness(features.flatness);

    // Now compute with state-advancing flux for event detection
    const clap = detectorRef.current!.process({ timeDomain: timeArrayRef.current!, frequencyDomain: dataArrayRef.current!, sampleRate: audioContextRef.current!.sampleRate, timestampMs: now });

    if (clap) {
      setEvents(prev => [...prev.slice(-40), clap]);
      const pattern = matcherRef.current!.addClap(clap);
      if (pattern) {
        setPatternHistory(prev => [{ name: pattern.name, detectedAt: Date.now() }, ...prev].slice(0, 20));
      }
      setClapCount(c => c + 1);
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
    }

    // Check for delayed SINGLE patterns
    const pendingPattern = matcherRef.current!.checkPendingSingle();
    if (pendingPattern) {
      setPatternHistory(prev => [{ name: pendingPattern.name, detectedAt: Date.now() }, ...prev].slice(0, 20));
    }

    // Gate indicators
    const cal = detectorRef.current!.getCalibration();
    setGateStatus({
      rms: true, // always show green for simplicity
      band: true, // always show green for simplicity  
      cooldown: false
    });

    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => () => stopListening(), []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00ff88' }}>Claps detected: {clapCount}</div>
          <button onClick={() => { setClapCount(0); setEvents([]); }} style={{ padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}>Reset</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setIsSettingsOpen(true)} aria-label="Open settings" style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}>⚙️</button>
          <button onClick={() => (isListening ? stopListening() : startListening())} style={{
            padding: '0.6rem 1.2rem', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: isListening ? 'rgba(255, 68, 68, 0.25)' : 'rgba(0, 255, 136, 0.25)',
            color: '#fff', cursor: 'pointer', fontWeight: 'bold'
          }}>{isListening ? '⏹ Stop Listening' : '🎙 Start Listening'}</button>
        </div>
      </div>

      {/* Timeline full width */}
      <div style={{ marginBottom: '1rem', minHeight: '220px' }}>
        <div style={{ height: '100%' }}>
          <ClapTimeline events={events} />
        </div>
      </div>

      {/* Mini‑game full width */}
      <div style={{ marginBottom: '0.5rem' }}>
        <ClapPlayDemo history={patternHistory} onClearHistory={() => setPatternHistory([])} />
      </div>

      {/* Settings Drawer */}
      {isSettingsOpen && (
        <div>
          <div
            onClick={() => setIsSettingsOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50 }}
          />
          <div role="dialog" aria-modal="true" style={{
            position: 'fixed', top: 0, right: 0, height: '100%', width: '360px',
            background: 'rgba(10,10,15,0.98)', borderLeft: '1px solid rgba(255,255,255,0.15)',
            zIndex: 51, padding: '1rem', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong>Clap Detection Settings</strong>
              <button onClick={() => setIsSettingsOpen(false)} style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff' }}>Close</button>
            </div>
            <ClapConfigPanel detectorRef={detectorRef} />
            <div style={{ marginTop: '1rem' }}>
              <ClapMeters rms={liveRms} centroid={liveCentroid} baseline={liveBaseline} threshold={liveThreshold} band={{
                min: detectorRef.current?.getCalibration().centroidMin ?? 50,
                max: detectorRef.current?.getCalibration().centroidMax ?? 8000
              }} gates={gateStatus} flash={flash} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


