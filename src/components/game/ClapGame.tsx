'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ClapDetector } from '../clap/ClapDetector';
import { ClapPatternMatcher, type ClapEvent } from '../clap/ClapPatternMatcher';

type Action = 'JUMP' | 'FIRE' | 'SPECIAL';
type Phase = 'onboarding1' | 'onboarding2' | 'onboarding3' | 'ready' | 'running' | 'gameover';

interface Props {}

export default function ClapGame(_: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [multiplier, setMultiplier] = useState(1);
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const v = parseInt(localStorage.getItem('clapquest-highscore') || '0', 10);
      return Number.isFinite(v) ? v : 0;
    }
    return 0;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('onboarding1');
  const phaseRef = useRef<Phase>('onboarding1');
  
  // Update matcher phase when game phase changes
  useEffect(() => {
    phaseRef.current = phase;
    if (matcherRef.current) {
      matcherRef.current.setPhase(phase);
    }
  }, [phase]);
  const [progress, setProgress] = useState<number>(0);

  // audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const timeArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<ClapDetector | null>(null);
  const matcherRef = useRef<ClapPatternMatcher | null>(null);
  const lastAudioFailLogRef = useRef<number>(0);
  const isListeningRef = useRef<boolean>(false);

  // game state
  const actionQueueRef = useRef<Action[]>([]);
  const lastTsRef = useRef<number | null>(null);
  const playerYRef = useRef<number>(0);
  const playerVyRef = useRef<number>(0);
  const cooldownRef = useRef<number>(0);
  const obstaclesRef = useRef<{ x: number; y: number; w: number; h: number; type: 'low' | 'target' | 'barrier' }[]>([]);
  const projectilesRef = useRef<{ x: number; y: number; vx: number }[]>([]);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[]>([]);
  const shakeRef = useRef<{ t: number; mag: number }>({ t: 0, mag: 0 });
  const starsRef = useRef<{ x: number; y: number; s: number }[] | null>(null);
  // Soft drifting clouds (background layer)
  const cloudsRef = useRef<{ x: number; y: number; w: number; h: number; speed: number; alpha: number }[] | null>(null);
  const [paused, setPaused] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const sfxCtxRef = useRef<AudioContext | null>(null);
  const lastScoreTimeRef = useRef(0);
  // Background animation time (ms). Advances only when actively animating
  const bgTimeRef = useRef<number>(0);
  // Player visual rotation (for rolling feel)
  const playerRotRef = useRef<number>(0);

  const spawnObstacle = (force?: 'low' | 'target' | 'barrier') => {
    if (force === 'barrier') {
      // Tall barriers that MUST be shot to pass
      obstaclesRef.current.push({ x: 820, y: 0, w: 25, h: 80, type: 'barrier' });
      return;
    }
    
    const rand = Math.random();
    if (force === 'target' || (!force && rand < 0.3)) {
      // Targets give points and multiplier
      obstaclesRef.current.push({ x: 820, y: 60 + Math.random() * 40, w: 20, h: 20, type: 'target' });
    } else if (force === 'low' || (!force && rand < 0.7)) {
      // Low obstacles to jump over
      obstaclesRef.current.push({ x: 820, y: 0, w: 25, h: 18 + Math.random() * 12, type: 'low' });
    } else {
      // Barriers that block the path - must be shot!
      obstaclesRef.current.push({ x: 820, y: 0, w: 25, h: 60 + Math.random() * 20, type: 'barrier' });
    }
  };

  const enqueueAction = (name: string) => {
    const currentPhase = phaseRef.current;
    console.log(`Action enqueued: ${name}, current phase: ${currentPhase}, state phase: ${phase}, current progress: ${progress}`);
    if (name === 'SINGLE') actionQueueRef.current.push('JUMP');
    if (name === 'DOUBLE') actionQueueRef.current.push('FIRE');
    if (name === 'TRIPLE') actionQueueRef.current.push('SPECIAL');
    // Onboarding progression - allow any pattern to advance if it matches the current goal
    if (currentPhase === 'onboarding1' && name === 'SINGLE') {
      setProgress((p) => {
        const next = p + 1; 
        console.log(`📈 ONBOARDING1 PROGRESS: ${p}/3 -> ${next}/3 (SINGLE clap)`);
        if (next >= 3) { 
          console.log('🎉 ONBOARDING1 COMPLETE! Moving to Phase 2...');
          setPhase('onboarding2'); 
          return 0; 
        } 
        return next;
      });
    }
    if (currentPhase === 'onboarding2' && name === 'DOUBLE') {
      setProgress((p) => {
        const next = p + 1; 
        console.log(`📈 ONBOARDING2 PROGRESS: ${p}/3 -> ${next}/3 (DOUBLE clap)`);
        if (next >= 3) { 
          console.log('🎉 ONBOARDING2 COMPLETE! Moving to Phase 3...');
          setPhase('onboarding3'); 
          return 0; 
        } 
        return next;
      });
    }
    if (currentPhase === 'onboarding3' && name === 'TRIPLE') {
      setProgress((p) => {
        const next = p + 1; 
        console.log(`📈 ONBOARDING3 PROGRESS: ${p}/1 -> ${next}/1 (TRIPLE clap)`);
        if (next >= 1) { 
          console.log('🎉 ONBOARDING3 COMPLETE! Ready to play!');
          setPhase('ready'); 
          return 0; 
        } 
        return next;
      });
    }
    
    // Removed "skipping ahead" logic - onboarding is now strictly linear
  };

  const playSfx = (freq: number, durationMs: number = 80) => {
    if (!sfxEnabled) return;
    try {
      if (!sfxCtxRef.current) sfxCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = sfxCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.value = 0.05;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {}
  };

  // Richer collision sound: thump + crack + noise burst
  const playCollisionSfx = () => {
    if (!sfxEnabled) return;
    try {
      if (!sfxCtxRef.current) sfxCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = sfxCtxRef.current;
      const t0 = ctx.currentTime;
      // Low thump
      const o1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(180, t0);
      o1.frequency.exponentialRampToValueAtTime(80, t0 + 0.18);
      g1.gain.setValueAtTime(0.0001, t0);
      g1.gain.exponentialRampToValueAtTime(0.5, t0 + 0.01);
      g1.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o1.connect(g1).connect(ctx.destination);
      o1.start(t0); o1.stop(t0 + 0.24);
      // Crack (short high tone)
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.type = 'triangle';
      o2.frequency.setValueAtTime(1200, t0 + 0.02);
      o2.frequency.exponentialRampToValueAtTime(500, t0 + 0.1);
      g2.gain.setValueAtTime(0.0001, t0);
      g2.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
      o2.connect(g2).connect(ctx.destination);
      o2.start(t0); o2.stop(t0 + 0.14);
      // Noise burst
      const bufferSize = 0.08 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.2, t0);
      ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
      noise.connect(ng).connect(ctx.destination);
      noise.start(t0); noise.stop(t0 + 0.09);
    } catch {}
  };

  const startListening = async () => {
    console.log('🎬 startListening called, current isListening:', isListening);
    if (isListening) return;
    
    try {
      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
        video: false
      } as MediaStreamConstraints);

      console.log('✅ Got media stream, setting up audio context...');
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
      
      console.log('🔧 Audio setup complete:', {
        hasAnalyser: !!analyserRef.current,
        hasDetector: !!detectorRef.current,
        hasMatcher: !!matcherRef.current,
        arraySize: dataArrayRef.current?.length
      });

      // Reset timestamp to prevent speed issues when re-enabling mic
      lastTsRef.current = null;
      
      // Update both ref (immediate) and state (for UI)
      isListeningRef.current = true;
      setIsListening(true);
      console.log('🎯 Updated isListeningRef=true and setIsListening(true)');
      // Loop is already running from useEffect, no need to start again
    } catch (error) {
      console.error('❌ Error starting audio:', error);
    }
  };

  const stopListening = () => {
    // Update both ref (immediate) and state (for UI)
    isListeningRef.current = false;
    setIsListening(false);
    console.log('🛑 Updated isListeningRef=false and setIsListening(false)');
    // Don't stop the loop - keep rendering for onboarding
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaStreamRef.current = null;
    analyserRef.current?.disconnect();
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  };

  const GRAVITY_PER_MS = 0.0012; // slightly less gravity → slower fall
  const JUMP_IMPULSE = 0.75; // stronger impulse so mid-air taps add noticeable lift
  const MAX_ASCENT_VELOCITY = 1.5; // cap upward velocity so spam feels controlled
  const SPEED_MULTIPLIER = 1.2; // slower overall pace

  const updateGame = (dt: number, canvasWidth: number, canvasHeight: number) => {
    // Automatic scoring - 10 points per second during running phase
    if (phase === 'running') {
      const now = performance.now();
      if (lastScoreTimeRef.current === 0) {
        lastScoreTimeRef.current = now; // Initialize on first run
      }
      if (now - lastScoreTimeRef.current >= 1000) { // 1 second
        setScore(s => s + 10);
        lastScoreTimeRef.current = now;
      }
    }
    
    // Spawn light guidance visuals during onboarding
    if (phase === 'onboarding1' || phase === 'onboarding2' || phase === 'onboarding3') {
      // slow demo spawns, but non-fatal
      if (Math.random() < 0.003) spawnObstacle();
    }

    // gravity / jump
    playerVyRef.current -= GRAVITY_PER_MS * dt; // gravity pulls down (y is height)
    // Allow higher multi-jumps (was capped at 1.2 = ~120px). Raise to 2.0 (~200px)
    playerYRef.current = Math.min(2.0, Math.max(0, playerYRef.current + playerVyRef.current));
    if (playerYRef.current === 0 && playerVyRef.current < 0) playerVyRef.current = 0;

    cooldownRef.current = Math.max(0, cooldownRef.current - dt);

    // rolling visual rotation (faster when moving / in air)
    const rollingFactor = 0.002 * dt * (0.6 + (phase === 'running' ? SPEED_MULTIPLIER : 0.4));
    playerRotRef.current += rollingFactor + (-playerVyRef.current * 0.02);

    // Apex damping (floaty feel near the top);
    if (playerVyRef.current > 0) {
      playerVyRef.current *= 0.995; // tiny damping while ascending
    } else {
      // Slow the fall slightly
      playerVyRef.current *= 0.998; // gentle air resistance on descent
    }

    // actions
    while (actionQueueRef.current.length > 0) {
      const action = actionQueueRef.current.shift()!;
      if (action === 'JUMP') {
        // Multi-jump allowed! Can jump anytime
        // Add impulse and cap upward velocity so repeated taps stack but stay controllable
        playerVyRef.current = Math.min(playerVyRef.current + JUMP_IMPULSE, MAX_ASCENT_VELOCITY);
          // Jump particle effect
          for (let i = 0; i < 8; i++) {
            particlesRef.current.push({ 
              x: 60 + (Math.random() - 0.5) * 20, 
              y: 20, 
              vx: (Math.random() - 0.5) * 0.4, 
              vy: Math.random() * 0.3, 
              life: 300 + Math.random() * 200, 
              color: '#00ff88', 
              size: 2 + Math.random() * 2 
            });
          }
          playSfx(550, 40);
      } else if (action === 'FIRE') {
        // spawn projectile from player
        const startY = 16 + playerYRef.current * 100 - 12;
        projectilesRef.current.push({ x: 80, y: startY, vx: 0.55 });
        // Enhanced fire sound effect
        playSfx(800, 80);
        setTimeout(() => playSfx(650, 40), 50); // Second harmonic
        // Fire particle effect
        for (let i = 0; i < 8; i++) {
          particlesRef.current.push({ 
            x: 80, 
            y: startY, 
            vx: Math.random() * 0.4 + 0.1, 
            vy: (Math.random() - 0.5) * 0.4, 
            life: 300, 
            color: i < 4 ? '#ff6600' : '#ffaa44', 
            size: 1 + Math.random() * 1.5
          });
        }
      } else if (action === 'SPECIAL') {
        if (cooldownRef.current <= 0) {
          const cleared = obstaclesRef.current.length;
          obstaclesRef.current = [];
          setScore(s => s + cleared * 10 + 20);
          cooldownRef.current = 4000; // ms
          setMultiplier(1);
          // burst particles
          for (let i = 0; i < 60; i++) {
            particlesRef.current.push({ x: 80, y: 60, vx: (Math.random() * 2 - 1) * 0.6, vy: (Math.random() * 2 - 1) * 0.6, life: 800 + Math.random() * 400, color: '#8b5cf6', size: 2 + Math.random() * 2 });
          }
          // Enhanced triple clap sound sequence
          playSfx(400, 60);
          setTimeout(() => playSfx(500, 80), 100);
          setTimeout(() => playSfx(600, 100), 200);
          setTimeout(() => playSfx(300, 120), 300);
          // Reset pattern matcher to clear debounce state
          if (matcherRef.current) {
            matcherRef.current.reset();
          }
        }
      }
    }

    // move obstacles - much faster and more dynamic
    const gameSpeed = phase === 'running' ? SPEED_MULTIPLIER : 0.5; // slower during onboarding
    obstaclesRef.current.forEach(o => { o.x -= 0.3 * gameSpeed * dt; });
    obstaclesRef.current = obstaclesRef.current.filter(o => o.x > -60);
    // background clouds drift
    if (!cloudsRef.current) {
      const arr: { x: number; y: number; w: number; h: number; speed: number; alpha: number }[] = [];
      for (let i = 0; i < 8; i++) {
        arr.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * (canvasHeight * 0.35) + 10,
          w: 60 + Math.random() * 90,
          h: 20 + Math.random() * 20,
          speed: 0.02 + Math.random() * 0.05,
          alpha: 0.05 + Math.random() * 0.07,
        });
      }
      cloudsRef.current = arr;
    } else {
      cloudsRef.current.forEach(c => {
        c.x -= c.speed * dt * 16;
        if (c.x + c.w < -40) c.x = canvasWidth + 40;
      });
    }

    // move projectiles and hit targets - faster projectiles
    projectilesRef.current.forEach(p => { p.x += p.vx * gameSpeed * dt; });
    projectilesRef.current = projectilesRef.current.filter(p => p.x < 900);
    for (const p of projectilesRef.current) {
      for (const o of obstaclesRef.current) {
        let hit = false;
        let hitY = 0;
        
        if (o.type === 'target') {
          // Targets are in the air
          hitY = 100 + o.y;
          hit = Math.abs(o.x - p.x) < o.w && Math.abs(hitY - p.y) < o.h;
        } else if (o.type === 'barrier') {
          // Barriers are tall ground obstacles
          hitY = canvasHeight - 20 - o.h/2;
          hit = Math.abs(o.x - p.x) < o.w && p.y <= canvasHeight - 20 && p.y >= canvasHeight - 20 - o.h;
        }
        
        if (hit) {
          obstaclesRef.current = obstaclesRef.current.filter(ob => ob !== o);
          projectilesRef.current = projectilesRef.current.filter(pr => pr !== p);
          
          if (o.type === 'target') {
            // Targets give bonus points and multiplier
            setScore(s => s + Math.floor(20 * multiplier));
            setMultiplier(m => Math.min(5, m + 0.2));
            playSfx(900, 70);
            // Blue particles
            for (let i = 0; i < 15; i++) {
              particlesRef.current.push({ 
                x: o.x, y: hitY, 
                vx: (Math.random() * 2 - 1) * 0.5, 
                vy: (Math.random() * 2 - 1) * 0.5, 
                life: 600, color: '#4488ff', size: 2 + Math.random() * 2 
              });
            }
          } else if (o.type === 'barrier') {
            // Barriers give survival points - CRUCIAL for progression!
            setScore(s => s + Math.floor(100 * multiplier));
            playSfx(800, 100);
            // Orange explosion particles
            for (let i = 0; i < 25; i++) {
              particlesRef.current.push({ 
                x: o.x, y: hitY, 
                vx: (Math.random() * 2 - 1) * 0.8, 
                vy: (Math.random() * 2 - 1) * 0.8, 
                life: 800, color: '#ff6600', size: 2 + Math.random() * 3 
              });
            }
          }
          break; // Only hit one obstacle per projectile
        }
      }
    }

    // PLAYER PICKUPS (blue orbs)
    if (phase === 'running' && obstaclesRef.current.length > 0) {
      const px = 60;
      const py = canvasHeight - 20 - (playerYRef.current * 100) - 16;
      const pr = 16 - 4;
      for (const o of obstaclesRef.current) {
        if (o.type !== 'target') continue;
        const ox = o.x;
        const oy = canvasHeight - 20 - (100 + o.y);
        const ow = o.w;
        const oh = o.h;
        if (px + pr > ox && px - pr < ox + ow && py + pr > oy && py - pr < oy + oh) {
          const cx = Math.max(ox, Math.min(px, ox + ow));
          const cy = Math.max(oy, Math.min(py, oy + oh));
          const dx = px - cx;
          const dy = py - cy;
          if (dx * dx + dy * dy < pr * pr) {
            // Collect orb → add points + sparkle
            setScore(s => s + 20);
            // sparkle
            for (let i = 0; i < 16; i++) {
              const ang = Math.random() * Math.PI * 2;
              const sp = 0.4 + Math.random() * 0.6;
              particlesRef.current.push({
                x: ox + ow / 2,
                y: oy + oh / 2,
                vx: Math.cos(ang) * sp,
                vy: Math.sin(ang) * sp,
                life: 500 + Math.random() * 400,
                color: '#66ccff',
                size: 1 + Math.random() * 2,
              });
            }
            // remove orb
            const idx = obstaclesRef.current.indexOf(o);
            if (idx >= 0) obstaclesRef.current.splice(idx, 1);
          }
        }
      }
    }

    // COLLISION DETECTION - EXACT reference game logic
    if (phase === 'running' && obstaclesRef.current.length > 0) {
      const px = 60; // player x
      const py = canvasHeight - 20 - (playerYRef.current * 100) - 16; // player y  
      const pr = 16 - 4; // player radius with tolerance like reference
      
      for (const o of obstaclesRef.current) {
        if (o.type === 'target') continue; // orbs handled as pickups above
        
        // Calculate obstacle position - ground obstacles
        const ox = o.x;
        const oy = canvasHeight - 20 - o.h; // obstacle y
        const ow = o.w; // obstacle width  
        const oh = o.h; // obstacle height
        
        // Reference game collision logic: 
        // if (px + pr > o.x && px - pr < o.x + o.w && py + pr > o.y && py - pr < o.y + o.h)
        if (px + pr > ox && px - pr < ox + ow && py + pr > oy && py - pr < oy + oh) {
          // Then check distance to closest point on rectangle
          const cx = Math.max(ox, Math.min(px, ox + ow)); // clamp px to obstacle bounds
          const cy = Math.max(oy, Math.min(py, oy + oh)); // clamp py to obstacle bounds  
          const dx = px - cx;
          const dy = py - cy;
          
          // Final distance check like reference: if (dx*dx + dy*dy < pr*pr)
          if (dx * dx + dy * dy < pr * pr) {
            console.log(`💥 COLLISION! Player (${px}, ${py}, r=${pr}) hit obstacle (${ox}, ${oy}, ${ow}x${oh})`);
            
            // Lose life and effects
            setLives(l => {
              const next = l - 1;
              if (next <= 0) {
                setPhase('gameover');
              }
              return next;
            });
            
            // Remove the hit obstacle  
            const idx = obstaclesRef.current.indexOf(o);
            if (idx >= 0) obstaclesRef.current.splice(idx, 1);
            
            // Collision effects
            shakeRef.current = { t: 220, mag: 7 };
            playCollisionSfx();
            
            // Collision particles (debris burst)
            const debrisColor = '#ff6644';
            for (let i = 0; i < 40; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 0.5 + Math.random() * 0.9;
              particlesRef.current.push({ 
                x: ox + ow / 2, 
                y: oy + oh / 2, 
                vx: Math.cos(angle) * speed, 
                vy: Math.sin(angle) * speed, 
                life: 700 + Math.random() * 400, 
                color: debrisColor, 
                size: 2 + Math.random() * 3 
              });
            }
            
            break; // Only process one collision per frame
          }
        }
      }
    }

    // spawning with level-based difficulty
    if (phase === 'running') {
      const currentLevel = Math.floor(score / 1000) + 1;
      
      // Level-based spawn rates and obstacle types
      let spawnRate = 0.006; // Slightly slower base spawn rate
      let barrierChance = 0.08; // Slightly fewer barriers initially
      
      switch(Math.min(currentLevel, 10)) {
        case 1: spawnRate = 0.006; barrierChance = 0.05; break; // Very easy
        case 2: spawnRate = 0.008; barrierChance = 0.10; break; // Easy
        case 3: spawnRate = 0.010; barrierChance = 0.15; break; // Getting harder
        case 4: spawnRate = 0.012; barrierChance = 0.20; break;
        case 5: spawnRate = 0.014; barrierChance = 0.25; break; // Mid game
        case 6: spawnRate = 0.016; barrierChance = 0.30; break;
        case 7: spawnRate = 0.018; barrierChance = 0.35; break; // Hard
        case 8: spawnRate = 0.020; barrierChance = 0.40; break;
        case 9: spawnRate = 0.022; barrierChance = 0.45; break; // Very hard
        case 10: spawnRate = 0.024; barrierChance = 0.50; break; // Maximum difficulty
      }
      
      if (Math.random() < spawnRate) {
        if (Math.random() < barrierChance) {
          spawnObstacle('barrier'); // Force barrier spawn
        } else {
          spawnObstacle(); // Random spawn
        }
      }
    }

    // update particles
    particlesRef.current.forEach(p => {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 0.0005 * dt; p.life -= dt;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // update screen shake timer
    if (shakeRef.current.t > 0) shakeRef.current.t = Math.max(0, shakeRef.current.t - dt);
  };

  const renderGame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(10,10,18,1)');
    grad.addColorStop(1, 'rgba(12,12,16,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // soft clouds layer
    if (cloudsRef.current) {
      cloudsRef.current.forEach(c => {
        ctx.globalAlpha = c.alpha;
        const r = 6;
        ctx.fillStyle = '#ffffff';
        // simple rounded cloud shape
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.w * 0.4, c.h * 0.6, 0, 0, Math.PI * 2);
        ctx.ellipse(c.x + c.w * 0.3, c.y + 2, c.w * 0.3, c.h * 0.5, 0, 0, Math.PI * 2);
        ctx.ellipse(c.x - c.w * 0.3, c.y + 2, c.w * 0.3, c.h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }
    // stars (generated once)
    if (!starsRef.current) {
      const arr: { x: number; y: number; s: number }[] = [];
      for (let i = 0; i < 80; i++) arr.push({ x: Math.random() * width, y: Math.random() * (height - 120), s: Math.random() * 1.5 + 0.3 });
      starsRef.current = arr;
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    starsRef.current.forEach(st => ctx.fillRect(st.x, st.y, st.s, st.s));

    // parallax hills
    ctx.fillStyle = 'rgba(68,136,255,0.06)';
    ctx.beginPath(); ctx.moveTo(0, height - 60);
    for (let x = 0; x <= width; x += 40) ctx.lineTo(x, height - 60 - 10 * Math.sin((x + performance.now() * 0.0003) * 0.05));
    ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath(); ctx.fill();

    // city silhouette
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    const t = bgTimeRef.current * 0.02; // use frozen/incremented time
    for (let i = 0; i < 12; i++) {
      const bx = ((i * 120 - (t % 120)) % (width + 120));
      const bw = 40 + ((i * 37) % 30);
      const bh = 40 + ((i * 53) % 60);
      ctx.fillRect(bx, height - 20 - bh, bw, bh);
    }

    // ground
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    ctx.fillRect(0, height - 20, width, 2);

    // apply screen shake
    if (shakeRef.current.t > 0) {
      const p = shakeRef.current.t / 300;
      const mag = shakeRef.current.mag * p;
      ctx.save();
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    // player - bigger, more dynamic like reference game
    const py = height - 20 - (playerYRef.current * 100);
    const squash = Math.max(0.8, 1 - Math.abs(playerVyRef.current) * 2); // squash/stretch effect
    
    ctx.save();
    ctx.translate(60, py - 16);
    ctx.scale(1 / squash, squash); // squash effect
    ctx.rotate(playerRotRef.current); // rolling feel
    
    // Player glow effect
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Player body
    ctx.fillStyle = '#00ff96';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    
    // Player eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-6, -4, 3, 0, Math.PI * 2); // left eye
    ctx.arc(6, -4, 3, 0, Math.PI * 2);  // right eye
    ctx.fill();
    
    // Eye pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-6, -4, 1.5, 0, Math.PI * 2); // left pupil
    ctx.arc(6, -4, 1.5, 0, Math.PI * 2);  // right pupil
    ctx.fill();
    
    // Player mouth (happy when jumping, neutral otherwise)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (playerVyRef.current > 0) {
      // Happy mouth when jumping up
      ctx.arc(0, 4, 6, 0, Math.PI);
    } else {
      // Neutral mouth
      ctx.arc(0, 6, 4, 0, Math.PI);
    }
    ctx.stroke();
    
    ctx.restore();
 
    // (debug hitboxes removed)
 
    // Show sample obstacles during onboarding for demonstration (only if mic is enabled)
    if ((phase.startsWith('onboarding') || phase === 'ready') && isListening) {
      // Sample low obstacle (orange spiky)
      const sampleX = width * 0.7;
      const sampleY = height - 20 - 25;
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(sampleX, sampleY, 30, 25);
      
      // Spikes on top
      ctx.fillStyle = '#ff3300';
      for (let i = 0; i < 30; i += 4) {
        ctx.beginPath();
        ctx.moveTo(sampleX + i, sampleY);
        ctx.lineTo(sampleX + i + 2, sampleY - 6);
        ctx.lineTo(sampleX + i + 4, sampleY);
        ctx.fill();
      }
      
      // Outline
      ctx.strokeStyle = '#cc2200';
      ctx.lineWidth = 2;
      ctx.strokeRect(sampleX, sampleY, 30, 25);
      
      // Sample barrier (red)
      if (phase === 'onboarding2' || phase === 'onboarding3' || phase === 'ready') {
        const barrierX = width * 0.85;
        const barrierY = height - 20 - 80;
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(barrierX, barrierY, 20, 80);
        
        // Warning stripes
        ctx.fillStyle = '#ffaa00';
        for (let y = 0; y < 80; y += 8) {
          ctx.fillRect(barrierX, barrierY + y, 20, 4);
        }
        
        // Pulsing glow
        const pulse = Math.sin(performance.now() * 0.008) * 0.5 + 0.5;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 8 + pulse * 8;
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(barrierX + 2, barrierY + 2, 16, 76);
        ctx.shadowBlur = 0;
        
        // Warning indicator
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px system-ui';
        ctx.fillText('!', barrierX + 6, barrierY + 20);
      }
      
      // Sample target (blue)
      if (phase === 'onboarding2' || phase === 'onboarding3' || phase === 'ready') {
        const targetX = width * 0.6;
        const targetY = height - 60;
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(targetX, targetY, 25, 25);
        
        ctx.fillStyle = '#6699ff';
        ctx.fillRect(targetX + 2, targetY + 2, 21, 21);
        
        // Pulsing center
        const pulse = Math.sin(performance.now() * 0.01) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.8})`;
        ctx.fillRect(targetX + 6, targetY + 6, 13, 13);
      }
    }

    // obstacles/targets with enhanced graphics
    obstaclesRef.current.forEach(o => {
      if (o.type === 'low') {
        // Rounded cute block
        const x = o.x; const y = height - 20 - o.h;
        const r = 6;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + o.w, y, x + o.w, y + o.h, r);
        ctx.arcTo(x + o.w, y + o.h, x, y + o.h, r);
        ctx.arcTo(x, y + o.h, x, y, r);
        ctx.arcTo(x, y, x + o.w, y, r);
        const gradBlock = ctx.createLinearGradient(0, y, 0, y + o.h);
        gradBlock.addColorStop(0, '#ffb4a1'); gradBlock.addColorStop(1, '#ff6c4c');
        ctx.fillStyle = gradBlock; ctx.fill();
        // tiny face sometimes
        if (Math.random() < 0.25 && o.w > 18) {
          ctx.fillStyle = '#2b2b2b';
          ctx.beginPath(); ctx.arc(x + o.w * 0.35, y + o.h * 0.4, 2, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + o.w * 0.65, y + o.h * 0.4, 2, 0, Math.PI * 2); ctx.fill();
        }
      } else if (o.type === 'barrier') {
        // Tall barriers - MUST be shot to pass!
        const barrierX = o.x;
        const barrierY = height - 20 - o.h;
        
        // Main wall - imposing red
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(barrierX, barrierY, o.w, o.h);
        
        // Warning stripes
        const stripeGrad = ctx.createLinearGradient(0, barrierY, 0, barrierY + o.h);
        stripeGrad.addColorStop(0, '#fff39a'); stripeGrad.addColorStop(1, '#ffc400');
        ctx.fillStyle = stripeGrad;
        for (let i = 0; i < o.h; i += 10) ctx.fillRect(barrierX, barrierY + i, o.w, 3);
        
        // Pulsing danger glow
        const dangerPulse = Math.sin(performance.now() * 0.02) * 0.3 + 0.7;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15 * dangerPulse;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(barrierX, barrierY, o.w, o.h);
        ctx.shadowBlur = 0;
        
        // "SHOOT ME" indicator
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px system-ui';
        ctx.fillText('!', barrierX + o.w/2 - 2, barrierY + 15);
      } else {
        // Air orbs - glowing blue pickups
        const cx = o.x + o.w / 2; const cy = height - 20 - (100 + o.y) + o.h / 2;
        const R = Math.min(o.w, o.h) / 2;
        const pulse = Math.sin(performance.now() * 0.01) * 0.5 + 0.5;
        const orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R + 8);
        orbGrad.addColorStop(0, `rgba(120,180,255,${0.6 + pulse * 0.2})`);
        orbGrad.addColorStop(1, 'rgba(120,180,255,0)');
        ctx.fillStyle = orbGrad;
        ctx.beginPath(); ctx.arc(cx, cy, R + 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#66aaff';
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#cfe6ff';
        ctx.beginPath(); ctx.arc(cx - R * 0.25, cy - R * 0.25, R * 0.35, 0, Math.PI * 2); ctx.fill();
      }
    });

    // Enhanced projectiles
    projectilesRef.current.forEach(p => {
      const projX = p.x;
      const projY = height - 20 - p.y;
      
      // Glow trail
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(projX, projY, 12, 4);
      
      // Bright core
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffdd00';
      ctx.fillRect(projX + 2, projY + 1, 8, 2);
      
      // Trail particles
      if (Math.random() < 0.3) {
        particlesRef.current.push({ 
          x: projX - 5, 
          y: p.y, 
          vx: -0.1 + Math.random() * -0.2, 
          vy: (Math.random() - 0.5) * 0.1, 
          life: 150, 
          color: '#ff8800', 
          size: 1 + Math.random() 
        });
      }
    });

    // particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, height - 20 - p.y, p.size, p.size);
    });

    if (shakeRef.current.t > 0) {
      ctx.restore();
    }

    // HUD - Lives in top left, other info in top right
    if (phase === 'running' || phase === 'ready' || phase.startsWith('onboarding')) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px system-ui, -apple-system, Segoe UI, Roboto';
      
      // Lives in TOP LEFT with heart icons
      ctx.fillStyle = '#ff6b6b';
      for (let i = 0; i < lives; i++) {
        ctx.fillText('❤️', 20 + i * 25, 25);
      }
      
      // Always show score (not just in running phase)
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText(`Score: ${score}`, width - 130, height - 40);
      ctx.fillStyle = '#aaa';
      ctx.font = 'bold 12px system-ui';
      ctx.fillText(`Best: ${highScore}`, width - 130, height - 58);
      
      if (phase === 'running') {
        // Score multiplier only in running phase
        if (multiplier > 1) {
          ctx.fillStyle = '#ffaa00';
          ctx.font = 'bold 14px system-ui';
          ctx.fillText(`x${multiplier.toFixed(1)}`, width - 130, height - 20);
        }
        
        // Level indicator in TOP RIGHT
        const currentLevel = Math.floor(score / 1000) + 1;
        const levelProgress = (score % 1000) / 1000;
        
        // Check for level up
        const prevLevel = Math.floor((score - 1) / 1000) + 1;
        if (currentLevel > prevLevel && currentLevel <= 10) {
          // Level up celebration!
          for (let i = 0; i < 50; i++) {
            particlesRef.current.push({ 
              x: width - 70, y: 25, 
              vx: (Math.random() - 0.5) * 1.0, 
              vy: (Math.random() - 0.5) * 1.0, 
              life: 1500, 
              color: '#00ff88', 
              size: 3 + Math.random() * 2 
            });
          }
          playSfx(600, 200);
          setTimeout(() => playSfx(800, 200), 100);
          setTimeout(() => playSfx(1000, 200), 200);
        }
        
        ctx.fillStyle = currentLevel <= 10 ? '#00ff88' : '#ffaa00';
        ctx.font = 'bold 16px system-ui';
        const levelText = currentLevel <= 10 ? `Level ${currentLevel}` : 'MAX LEVEL';
        ctx.fillText(levelText, width - 120, 25);
        
        // Level progress bar
        if (currentLevel <= 10) {
          ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
          ctx.fillRect(width - 120, 30, 100, 8);
          ctx.fillStyle = '#00ff88';
          ctx.fillRect(width - 120, 30, 100 * levelProgress, 8);
        }
        
        // Special ability cooldown indicator
        if (cooldownRef.current > 0) {
          const cooldownPercent = cooldownRef.current / 4000;
          ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
          ctx.fillRect(width - 120, 45, 100, 8);
          ctx.fillStyle = '#8b5cf6';
          ctx.fillRect(width - 120, 45, 100 * (1 - cooldownPercent), 8);
          ctx.fillStyle = '#fff';
          ctx.font = '10px system-ui';
          ctx.fillText('SPECIAL', width - 115, 58);
        }
      }
    }

    // Game over dialog is rendered in HTML; no canvas overlay here
  };

  const loop = (ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // During onboarding, we always render even without mic
    const analyser = analyserRef.current;
    const shouldProcessAudio = analyser && isListeningRef.current;
    const currentPhase = phaseRef.current; // always up-to-date
    const shouldAnimate = isListeningRef.current && !paused && currentPhase === 'running';
    // Debug (throttled) – why we aren't animating
    (window as any).__animDbgLast = (window as any).__animDbgLast || 0;
    if (performance.now() - (window as any).__animDbgLast > 1000) {
      const state = { shouldAnimate, isListening: isListeningRef.current, paused, phase: currentPhase };
      console.log('🎮 AnimState', state);
      (window as any).__animDbgLast = performance.now();
    }

    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d')!;
    const now = performance.now();



    // audio processing - only if mic enabled and not paused
    if (shouldProcessAudio && !paused && detectorRef.current && matcherRef.current) {
      // console.log(`🔄 PROCESSING AUDIO: Phase=${phase}, shouldProcessAudio=${shouldProcessAudio}, paused=${paused}`);
      analyser.getByteFrequencyData(dataArrayRef.current!);
      analyser.getByteTimeDomainData(timeArrayRef.current!);
      const clap = detectorRef.current.process({
        timeDomain: timeArrayRef.current!,
        frequencyDomain: dataArrayRef.current!,
        sampleRate: audioContextRef.current!.sampleRate,
        timestampMs: now
      });
      if (clap) {
        console.log(`🎵 CLAP DETECTED! Phase: ${phase}, RMS: ${clap.rms.toFixed(3)}`);
        const pattern = matcherRef.current.addClap(clap);
        if (pattern) {
          console.log(`🎯 PATTERN MATCHED: ${pattern.name} -> ${pattern.name === 'SINGLE' ? 'JUMP' : pattern.name === 'DOUBLE' ? 'FIRE' : 'SPECIAL'}`);
          enqueueAction(pattern.name);
        }
        if (phase === 'running') setScore(s => s + 1);
      }

      // Check for delayed SINGLE patterns
      const pendingPattern = matcherRef.current.checkPendingSingle();
      if (pendingPattern) {
        console.log(`⏰ DELAYED PATTERN: ${pendingPattern.name} -> JUMP`);
        enqueueAction(pendingPattern.name);
        if (phase === 'running') setScore(s => s + 1);
      }
    } else {
      // Log why audio processing is not happening (but throttle it to every 2 seconds)
      if (!lastAudioFailLogRef.current || now - lastAudioFailLogRef.current > 2000) {
        // console.log(`❌ NO AUDIO PROCESSING: shouldProcessAudio=${shouldProcessAudio}, paused=${paused}, hasDetector=${!!detectorRef.current}, hasMatcher=${!!matcherRef.current}`);
        lastAudioFailLogRef.current = now;
      }
    }

    // update - only if animating
    if (shouldAnimate) {
      const last = lastTsRef.current || ts;
      const dt = Math.min(50, ts - last);
      lastTsRef.current = ts;
      bgTimeRef.current += dt; // advance background animation time only when animating
      if (lives > 0) {
        const canvas = canvasRef.current;
        if (canvas) {
          updateGame(dt, canvas.width, canvas.height);
        }
      }
    } else {
      // Reset timestamp when paused to prevent jumps when unpausing
      lastTsRef.current = ts;
      // do not advance bgTimeRef, freezing background animation
    }

    // render
    renderGame(ctx, width, height);
    // Schedule next frame with latest loop function (prevents stale closures)
    rafRef.current = requestAnimationFrame((nextTs) => loopRef.current?.(nextTs));
  };

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const stage = stageRef.current;
      if (!canvas || !stage) return;
      const dpr = (globalThis as any).devicePixelRatio || 1;
      const rect = stage.getBoundingClientRect();
      const width = Math.max(640, Math.floor(rect.width));
      const vh = Math.max(220, Math.floor(window.innerHeight - rect.top - 24));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(vh * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${vh}px`;
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(() => resize());
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener('resize', resize);
    return () => { ro.disconnect(); window.removeEventListener('resize', resize); };
  }, []);

  useEffect(() => () => stopListening(), []);

  // Persist best score whenever we reach game over with a new record
  useEffect(() => {
    if (phase === 'gameover') {
      setHighScore(prev => {
        const next = score > prev ? score : prev;
        if (next !== prev && typeof window !== 'undefined') {
          localStorage.setItem('clapquest-highscore', String(next));
        }
        return next;
      });
    }
  }, [phase, score]);

  // Keyboard controls - space bar for jump
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (phase === 'running' || phase.startsWith('onboarding')) {
          actionQueueRef.current.push('JUMP');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);



  // Store loop function in ref to avoid dependency issues
  const loopRef = useRef<((ts: number) => void) | null>(null);
  loopRef.current = loop;

  // Start visual loop immediately for onboarding (even without mic)
  useEffect(() => {
    const startLoop = (ts: number) => {
      if (loopRef.current) loopRef.current(ts);
    };
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(startLoop);
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <div ref={stageRef} style={{ position: 'relative', width: '100%' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px' }} />
        {/* Controls (no visible SFX toggle by default) */}
        {isListening && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
            <button onClick={() => setPaused(p => !p)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 700 }}>{paused ? 'Resume' : 'Pause'}</button>
            <button onClick={() => stopListening()} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255, 68, 68, 0.25)', color: '#fff', fontWeight: 700 }}>Mic Off</button>
          </div>
        )}
        {(!isListening) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(0,0,0,0.85), rgba(20,20,40,0.9))', 
              border: '2px solid rgba(255,170,0,0.5)', 
              borderRadius: '16px', 
              padding: '2rem 2.5rem', 
              textAlign: 'center',
              width: 'min(500px, 90%)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative'
            }}>
              {/* Removed mic overlay close button on request */}
              <div style={{ 
                fontSize: '1.8rem', 
                fontWeight: 900, 
                background: 'linear-gradient(45deg, #00ff88, #4488ff)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                marginBottom: '1rem'
              }}>
                Welcome to Clap Quest! 🎮
              </div>
              <div style={{ 
                color: '#ffaa00', 
                fontWeight: 600, 
                fontSize: '1.2rem',
                marginBottom: '1rem'
              }}>
                🎤 Microphone Required
              </div>
              <div style={{ 
                color: '#ccc', 
                fontSize: '1rem',
                lineHeight: 1.5,
                marginBottom: '1.5rem'
              }}>
                This game uses clap detection to control your character.<br/>
                Please enable your microphone to continue.
              </div>
              <button 
                onClick={() => startListening()} 
                style={{ 
                  padding: '1rem 2rem', 
                  borderRadius: '12px', 
                  border: '2px solid #ffaa00', 
                  background: 'linear-gradient(45deg, rgba(255,170,0,0.2), rgba(255,136,0,0.3))', 
                  color: '#fff', 
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(45deg, rgba(255,170,0,0.3), rgba(255,136,0,0.4))';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(45deg, rgba(255,170,0,0.2), rgba(255,136,0,0.3))';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                🎤 Enable Microphone
              </button>
            </div>
          </div>
        )}
        {isListening && (phase === 'onboarding1' || phase === 'onboarding2' || phase === 'onboarding3' || phase === 'ready') && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(0,0,0,0.85), rgba(20,20,40,0.9))', 
              border: '2px solid rgba(0,255,136,0.3)', 
              borderRadius: '16px', 
              padding: '2rem 2.5rem', 
              width: 'min(600px, 90%)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative'
            }}>
              
              {/* Close Button - keep only for onboarding phases (not in 'ready') */}
              {phase !== 'ready' && (
                <button 
                  onClick={() => { setPhase('ready'); setProgress(0); }}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'none',
                    border: 'none',
                    color: '#ccc',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              )}

              {/* Welcome Header */}
              {phase === 'onboarding1' && (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: 900, 
                    background: 'linear-gradient(45deg, #00ff88, #4488ff)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    marginBottom: '0.5rem'
                  }}>
                    Welcome to Clap Quest! 🎮
                  </div>
                  <div style={{ color: '#ccc', fontSize: '1rem' }}>
                    Let's learn the controls together
                  </div>
                </div>
              )}

              {/* Main Instruction */}
              <div style={{ 
                fontSize: '1.4rem', 
                fontWeight: 700, 
                textAlign: 'center',
                marginBottom: '1rem',
                color: '#fff'
              }}>
                {phase === 'onboarding1' && '👏 Clap once to JUMP'}
                {phase === 'onboarding2' && '👏👏 Clap twice to SHOOT'}
                {phase === 'onboarding3' && '👏👏👏 Clap three times for SPECIAL POWER'}
                {phase === 'ready' && '🎯 You\'re ready to play!'}
              </div>

              {/* Tutorial Explanation */}
              <div style={{ 
                color: '#aaa', 
                fontSize: '0.95rem', 
                textAlign: 'center', 
                lineHeight: 1.5,
                marginBottom: '1.2rem'
              }}>
                {phase === 'onboarding1' && (
                  <>
                    <div>Jump over <span style={{color: '#ff6600', fontWeight: 600}}>🟠 orange spiky obstacles</span></div>
                    <div style={{marginTop: '0.5rem'}}>Try clapping once now - you should see your character jump!</div>
                  </>
                )}
                {phase === 'onboarding2' && (
                  <>
                    <div>Shoot <span style={{color: '#cc0000', fontWeight: 600}}>🔴 red barriers</span> and <span style={{color: '#4488ff', fontWeight: 600}}>🔵 blue targets</span></div>
                    <div style={{marginTop: '0.5rem'}}>Clap twice quickly - you should see a projectile fire!</div>
                  </>
                )}
                {phase === 'onboarding3' && (
                  <>
                    <div>Clear all obstacles instantly with your special power</div>
                    <div style={{marginTop: '0.5rem'}}>Clap three times quickly - watch the purple explosion!</div>
                  </>
                )}
                {phase === 'ready' && (
                  <>
                    <div style={{marginBottom: '0.5rem'}}>🎯 <strong>Goal:</strong> Survive 10 levels by avoiding and shooting obstacles</div>
                    <div>💡 <strong>Strategy:</strong> Jump over small ones, shoot the tall barriers!</div>
                  </>
                )}
              </div>

              {/* Progress */}
              {phase !== 'ready' && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 600,
                    color: '#fff'
                  }}>
                    Progress: {progress}/{phase === 'onboarding3' ? 1 : 3}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.3rem' 
                  }}>
                    {Array.from({length: phase === 'onboarding3' ? 1 : 3}).map((_, i) => (
                      <div key={i} style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: i < progress ? '#00ff88' : 'rgba(255,255,255,0.2)'
                      }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Navigation */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                justifyContent: 'center', 
                marginTop: '1rem', 
                pointerEvents: 'auto' 
              }}>
                {phase !== 'ready' ? (
                  <>
                    <button 
                      onClick={() => { setPhase('onboarding1'); setProgress(0); }} 
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        borderRadius: '8px', 
                        border: phase === 'onboarding1' ? '2px solid #00ff88' : '1px solid rgba(255,255,255,0.2)', 
                        background: phase === 'onboarding1' ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)', 
                        color: phase === 'onboarding1' ? '#00ff88' : '#aaa', 
                        fontSize: '0.85rem', 
                        cursor: 'pointer',
                        fontWeight: phase === 'onboarding1' ? 600 : 400
                      }}
                    >
                      👏 Jump
                    </button>
                    <button 
                      onClick={() => { setPhase('onboarding2'); setProgress(0); }} 
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        borderRadius: '8px', 
                        border: phase === 'onboarding2' ? '2px solid #00ff88' : '1px solid rgba(255,255,255,0.2)', 
                        background: phase === 'onboarding2' ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)', 
                        color: phase === 'onboarding2' ? '#00ff88' : '#aaa', 
                        fontSize: '0.85rem', 
                        cursor: 'pointer',
                        fontWeight: phase === 'onboarding2' ? 600 : 400
                      }}
                    >
                      👏👏 Shoot
                    </button>
                    <button 
                      onClick={() => { setPhase('onboarding3'); setProgress(0); }} 
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        borderRadius: '8px', 
                        border: phase === 'onboarding3' ? '2px solid #00ff88' : '1px solid rgba(255,255,255,0.2)', 
                        background: phase === 'onboarding3' ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)', 
                        color: phase === 'onboarding3' ? '#00ff88' : '#aaa', 
                        fontSize: '0.85rem', 
                        cursor: 'pointer',
                        fontWeight: phase === 'onboarding3' ? 600 : 400
                      }}
                    >
                      👏👏👏 Special
                    </button>
                  </>
                ) : (
                  <>
                    {/* Re-add 'Start Adventure!' for ready-to-play */}
                    <button 
                      onClick={() => { 
                        console.log('▶️ GAME START button clicked');
                        setPaused(false);
                        setPhase('running');
                        phaseRef.current = 'running';
                        if (matcherRef.current) matcherRef.current.setPhase('running');
                        lastTsRef.current = performance.now();
                        bgTimeRef.current = 0;
                        // Kick off immediate feedback
                        actionQueueRef.current.push('JUMP');
                        // Ensure at least one obstacle is present
                        if (obstaclesRef.current.length === 0) spawnObstacle('barrier');
                      }} 
                      style={{ 
                        padding: '0.6rem 1.2rem', 
                        borderRadius: '12px', 
                        border: '2px solid #00ff88', 
                        background: 'linear-gradient(45deg, rgba(0,255,136,0.2), rgba(68,136,255,0.2))', 
                        color: '#fff', 
                        fontWeight: 800,
                        fontSize: '1rem',
                        cursor: 'pointer'
                      }}
                    >
                      🚀 Start Adventure!
                    </button>
                    <button 
                      onClick={() => { setPhase('onboarding1'); setProgress(0); }} 
                      style={{ 
                        padding: '0.6rem 1.0rem', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.3)', 
                        background: 'rgba(255,255,255,0.1)', 
                        color: '#ccc', 
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginLeft: '0.5rem'
                      }}
                    >
                      Practice Again
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {paused && phase === 'running' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}>
            <div style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '1rem 1.2rem', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Paused</div>
              <button onClick={() => setPaused(false)} style={{ padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0, 255, 136, 0.25)', color: '#fff', cursor: 'pointer' }}>Resume</button>
            </div>
          </div>
        )}
        {phase === 'gameover' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '1rem 1.2rem', width: 'min(520px, 90%)', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Game Over</div>
              <div style={{ color: '#ccc', marginBottom: '0.6rem' }}>Score: {score}</div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button onClick={() => { 
                  setScore(0); 
                  setLives(3); 
                  setMultiplier(1); 
                  obstaclesRef.current = []; 
                  projectilesRef.current = [];
                  particlesRef.current = [];
                  setPhase('onboarding1'); 
                  setProgress(0);
                  lastScoreTimeRef.current = 0;
                  playerYRef.current = 0;
                  playerVyRef.current = 0;
                }} style={{ padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}>Retry</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


