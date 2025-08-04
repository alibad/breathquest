'use client';

import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';
import { useEffect } from 'react';

const DemoSection = () => {
  const sectionRef = useFadeInOnScroll();

  useEffect(() => {
    // Define the breath demo functions in the global scope
    if (typeof window !== 'undefined') {
      let audioContext: AudioContext;
      let analyser: AnalyserNode;
      let microphone: MediaStreamAudioSourceNode;
      let isListening = false;
      
      // Breath detection variables
      let baselineLevel = 0;
      let calibrationCount = 0;
      let amplitudeHistory: number[] = [];
      let lastState = 'normal';
      let stateStartTime = Date.now();
      let lastUpdateTime = 0;
      let smoothedAmplitude = 0;
      let lastDisplayedAmplitude = 0;

      const startBreathDemo = async () => {
        const btn = document.getElementById('start-demo-btn') as HTMLButtonElement;
        const stateDisplay = document.getElementById('breath-state') as HTMLElement;
        
        if (isListening) {
          stopDemo();
          return;
        }
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            } 
          });
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyser = audioContext.createAnalyser();
          microphone = audioContext.createMediaStreamSource(stream);
          
          // Better settings for breath detection
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.3;
          microphone.connect(analyser);
          
          // Reset calibration and smoothing variables
          baselineLevel = 0;
          calibrationCount = 0;
          amplitudeHistory = [];
          lastUpdateTime = 0;
          smoothedAmplitude = 0;
          lastDisplayedAmplitude = 0;
          
          // Show demo UI elements
          const audioMeterPanel = document.getElementById('audio-meter-panel') as HTMLElement;
          const gameBreathDisplay = document.getElementById('game-breath-display') as HTMLElement;
          const detectionInfo = document.getElementById('detection-info') as HTMLElement;
          const gameCharacter = document.getElementById('game-character') as HTMLElement;
          
          if (audioMeterPanel) audioMeterPanel.style.display = 'block';
          if (gameBreathDisplay) gameBreathDisplay.style.display = 'block';
          if (detectionInfo) detectionInfo.style.display = 'block';
          if (stateDisplay) stateDisplay.style.display = 'block';
          
          // Stop the breathing animation on character
          if (gameCharacter) {
            gameCharacter.style.animation = 'none';
          }
          
          isListening = true;
          btn.textContent = '🛑 Stop Demo';
          btn.classList.add('btn-secondary');
          btn.style.background = '#ff6b6b';
          btn.style.color = '#fff';
          stateDisplay.textContent = 'Calibrating... breathe normally';
          
          detectBreath();
        } catch {
          stateDisplay.textContent = 'Microphone access denied';
          stateDisplay.style.color = '#ff6b6b';
        }
      };
      
      const detectBreath = () => {
        if (!isListening) return;
        
        // Use time domain data instead of frequency for better breath detection
        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);
        
        // Calculate RMS (Root Mean Square) for better amplitude detection
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const sample = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
          sum += sample * sample;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const rawAmplitude = rms * 1000; // Scale for easier thresholding
        
        // Smooth the amplitude to reduce flickering (exponential moving average)
        const smoothingFactor = 0.3;
        smoothedAmplitude = (smoothingFactor * rawAmplitude) + ((1 - smoothingFactor) * smoothedAmplitude);
        const amplitude = smoothedAmplitude;
        
        const currentTime = Date.now();
        const shouldUpdateUI = currentTime - lastUpdateTime > 100; // Update UI max every 100ms (10 FPS)
        
        const visualizer = document.getElementById('breath-visualizer') as HTMLElement;
        const stateDisplay = document.getElementById('breath-state') as HTMLElement;
        const innerCircle = visualizer.querySelector('div') as HTMLElement;
        
        // Get all UI elements (declared outside the conditional blocks)
        const audioLevelBar = document.getElementById('audio-level-bar') as HTMLElement;
        const audioAmplitude = document.getElementById('audio-amplitude') as HTMLElement;
        const audioBaseline = document.getElementById('audio-baseline') as HTMLElement;
        const audioRelative = document.getElementById('audio-relative') as HTMLElement;
        const audioStatus = document.getElementById('audio-status') as HTMLElement;
        
        // Only update audio level indicators at reduced frequency
        if (shouldUpdateUI) {
          
          if (audioLevelBar && audioAmplitude) {
            // Show smoothed amplitude as percentage (0-100%)
            const levelPercent = Math.min(100, (amplitude / 50) * 100);
            
            // Only update if the change is significant (reduce micro-movements)
            if (Math.abs(amplitude - lastDisplayedAmplitude) > 0.5) {
              audioLevelBar.style.width = `${levelPercent}%`;
              audioAmplitude.textContent = `Amplitude: ${amplitude.toFixed(1)}`;
              lastDisplayedAmplitude = amplitude;
              
              // Color code the level bar based on intensity
              if (levelPercent > 80) {
                audioLevelBar.style.background = 'linear-gradient(to right, #ff4444, #ff8844)';
              } else if (levelPercent > 40) {
                audioLevelBar.style.background = 'linear-gradient(to right, #ffff00, #ff8844)';
              } else if (levelPercent > 10) {
                audioLevelBar.style.background = 'linear-gradient(to right, #00ff88, #ffff00)';
              } else {
                audioLevelBar.style.background = 'linear-gradient(to right, #004400, #00ff88)';
              }
            }
            
            // Update baseline display
            if (audioBaseline) {
              audioBaseline.textContent = `Baseline: ${baselineLevel.toFixed(1)}`;
            }
          }
          
          lastUpdateTime = currentTime;
        }
        
        // Calibration phase (first 60 samples)
        if (calibrationCount < 60) {
          baselineLevel += amplitude;
          calibrationCount++;
          
          if (audioStatus) {
            audioStatus.textContent = `Status: Calibrating (${calibrationCount}/60)`;
            audioStatus.style.color = '#ffaa00';
          }
          
          if (calibrationCount === 60) {
            baselineLevel = baselineLevel / 60;
            stateDisplay.textContent = `Calibrated! Baseline: ${baselineLevel.toFixed(1)}`;
            if (audioStatus) {
              audioStatus.textContent = 'Status: Ready!';
              audioStatus.style.color = '#00ff88';
            }
          }
          requestAnimationFrame(detectBreath);
          return;
        }
        
        // Add to amplitude history for trend analysis
        amplitudeHistory.push(amplitude);
        if (amplitudeHistory.length > 10) {
          amplitudeHistory.shift();
        }
        
        // Calculate relative amplitude vs baseline
        const relativeAmplitude = amplitude - baselineLevel;
        const trend = amplitudeHistory.length >= 3 ? 
          amplitudeHistory[amplitudeHistory.length - 1] - amplitudeHistory[amplitudeHistory.length - 3] : 0;
        
        // Update relative amplitude display (only when UI should update)
        if (shouldUpdateUI && audioRelative) {
          audioRelative.textContent = `Relative: ${relativeAmplitude.toFixed(1)}`;
        }
        
        // Determine breath state with more sensitive thresholds
        let breathState = 'Normal Breathing';
        let scale = 1;
        let color = 'var(--primary)';
        let currentState = 'normal';
        
        // Much more sensitive thresholds
        if (relativeAmplitude > baselineLevel * 0.8 && trend > 0.5) {
          breathState = '🔥 Sharp Exhale';
          scale = 1.6;
          color = '#ff8844';
          currentState = 'exhale';
        } else if (relativeAmplitude > baselineLevel * 0.4) {
          breathState = '💨 Deep Inhale';
          scale = 1.4;
          color = '#4488ff';
          currentState = 'inhale';
        } else if (relativeAmplitude > baselineLevel * 0.1) {
          breathState = '🌬️ Normal Breathing';
          scale = 1.1;
          color = 'var(--primary)';
          currentState = 'normal';
        } else if (relativeAmplitude < -baselineLevel * 0.1) {
          breathState = '⏸️ Breath Hold';
          scale = 0.8;
          color = 'var(--secondary)';
          currentState = 'hold';
        }
        
        // Detect breath of fire (rapid exhales)
        if (currentState === 'exhale' && lastState !== 'exhale' && Date.now() - stateStartTime < 800) {
          breathState = '🔥 Breath of Fire';
          scale = 1.8;
          color = '#ff4444';
        }
        
        // Update state tracking
        if (currentState !== lastState) {
          lastState = currentState;
          stateStartTime = Date.now();
        }
        
        // Update audio status with current detection (only when UI should update)
        if (shouldUpdateUI && audioStatus) {
          audioStatus.textContent = `Status: Detecting ${currentState}`;
          audioStatus.style.color = color;
        }
        
        // Update visualizer and game character only when state changes or UI update is due
        if (shouldUpdateUI || currentState !== lastState) {
          // Update visualizer with smooth transitions
          visualizer.style.transform = `scale(${scale})`;
          visualizer.style.transition = 'transform 0.3s ease';
          innerCircle.style.background = color;
          innerCircle.style.transition = 'background 0.3s ease';
          
          // Update game character and breath display based on breath state
          const character = document.getElementById('game-character') as HTMLElement;
          const gameBreathDisplay = document.getElementById('game-breath-display') as HTMLElement;
          
          if (character) {
            // Set smooth transitions for character
            character.style.transition = 'all 0.4s ease';
            
            switch (currentState) {
              case 'normal':
                character.style.transform = 'translateX(-50%) translateY(0px) scale(1)';
                character.style.background = '#00ff88';
                character.style.boxShadow = '0 0 60px rgba(0, 255, 136, 0.8)';
                break;
                
              case 'inhale':
                // Character grows and moves up - CLEAR inhale detection
                character.style.transform = 'translateX(-50%) translateY(-100px) scale(1.4)';
                character.style.background = '#4488ff';
                character.style.boxShadow = '0 0 100px rgba(68, 136, 255, 1)';
                break;
                
              case 'exhale':
                // Character shrinks and pulses - CLEAR exhale detection
                character.style.transform = 'translateX(-50%) translateY(20px) scale(0.8)';
                character.style.background = '#ff8844';
                character.style.boxShadow = '0 0 80px rgba(255, 136, 68, 1)';
                break;
                
              case 'hold':
                // Character holds position and glows
                character.style.transform = 'translateX(-50%) translateY(-20px) scale(1.1)';
                character.style.background = '#00ccff';
                character.style.boxShadow = '0 0 120px rgba(0, 204, 255, 1)';
                break;
            }
          }
          
          // Update the large breath display
          if (gameBreathDisplay) {
            gameBreathDisplay.textContent = breathState;
            gameBreathDisplay.style.color = color;
          }
        }
        
        // Show current breath state (only update when UI should update to reduce flickering)
        if (shouldUpdateUI || currentState !== lastState) {
          stateDisplay.textContent = breathState;
        }
        
        requestAnimationFrame(detectBreath);
      };
      
      const stopDemo = () => {
        isListening = false;
        if (audioContext) {
          audioContext.close();
        }
        
        const btn = document.getElementById('start-demo-btn') as HTMLButtonElement;
        const stateDisplay = document.getElementById('breath-state') as HTMLElement;
        
        // Hide all demo UI elements
        const audioMeterPanel = document.getElementById('audio-meter-panel') as HTMLElement;
        const gameBreathDisplay = document.getElementById('game-breath-display') as HTMLElement;
        const detectionInfo = document.getElementById('detection-info') as HTMLElement;
        const gameCharacter = document.getElementById('game-character') as HTMLElement;
        
        if (audioMeterPanel) audioMeterPanel.style.display = 'none';
        if (gameBreathDisplay) gameBreathDisplay.style.display = 'none';
        if (detectionInfo) detectionInfo.style.display = 'none';
        if (stateDisplay) stateDisplay.style.display = 'none';
        
        // Restore breathing animation on character
        if (gameCharacter) {
          gameCharacter.style.animation = 'breathe 3s ease-in-out infinite';
          gameCharacter.style.transform = 'translateX(-50%) translateY(0px) scale(1)';
          gameCharacter.style.background = '#00ff88';
          gameCharacter.style.boxShadow = '0 0 60px rgba(0, 255, 136, 1)';
        }
        
        // Reset audio indicators
        const audioLevelBar = document.getElementById('audio-level-bar') as HTMLElement;
        const audioAmplitude = document.getElementById('audio-amplitude') as HTMLElement;
        const audioBaseline = document.getElementById('audio-baseline') as HTMLElement;
        const audioRelative = document.getElementById('audio-relative') as HTMLElement;
        const audioStatus = document.getElementById('audio-status') as HTMLElement;
        
        if (audioLevelBar) audioLevelBar.style.width = '0%';
        if (audioAmplitude) audioAmplitude.textContent = 'Amplitude: --';
        if (audioBaseline) audioBaseline.textContent = 'Baseline: --';
        if (audioRelative) audioRelative.textContent = 'Relative: --';
        if (audioStatus) {
          audioStatus.textContent = 'Status: Ready';
          audioStatus.style.color = '#aaa';
        }
        
        // Reset button
        btn.textContent = '🚀 Start Breath Detection';
        btn.classList.remove('btn-secondary');
        btn.style.background = 'linear-gradient(45deg, var(--primary), var(--secondary))';
        btn.style.color = 'var(--dark)';
        stateDisplay.textContent = 'Ready to breathe...';
      };
      
      (window as any).startBreathDemo = startBreathDemo;
    }
  }, []);
  
  return (
    <section id="demo" className="demo-section" ref={sectionRef}>
      <h2>🎮 Breath Detection Demo</h2>
      <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>
        Test real-time breath detection using your microphone
      </p>
      
      <div className="demo-preview">
        <div id="breath-demo" style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          position: 'relative',
          gap: '1rem'
        }}>

          
          {/* Audio Level Meter - Hidden initially */}
          <div id="audio-meter-panel" style={{
            width: '100%',
            marginBottom: '1rem',
            padding: '1rem',
            background: 'rgba(0, 20, 40, 0.8)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            display: 'none'
          }}>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#ccc' }}>
              🎤 <strong>Live Audio Input</strong>
            </div>
            
            {/* Raw Amplitude Bar */}
            <div style={{
              width: '100%',
              height: '20px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div id="audio-level-bar" style={{
                height: '100%',
                width: '0%',
                background: 'linear-gradient(to right, #00ff88, #ffff00, #ff8844)',
                transition: 'width 0.2s ease',
                borderRadius: '10px'
              }}></div>
            </div>
            
            {/* Audio Data Display */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: '#aaa'
            }}>
              <span id="audio-amplitude">Amplitude: --</span>
              <span id="audio-baseline">Baseline: --</span>
              <span id="audio-relative">Relative: --</span>
              <span id="audio-status">Status: Ready</span>
            </div>
          </div>

          {/* Game Preview - MASSIVE */}
          <div style={{
            width: '100%',
            height: '90vh',
            background: 'linear-gradient(to bottom, #001122, #002244)',
            borderRadius: '20px',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '1rem',
            border: '4px solid rgba(0, 255, 136, 0.6)',
            boxShadow: '0 20px 60px rgba(0, 255, 136, 0.3)'
          }}>
            {/* Ground - Much taller for massive container */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              width: '100%',
              height: '120px',
              background: 'linear-gradient(to right, #00ff88, #00ccff)',
              opacity: '0.4'
            }}></div>
            
            {/* Character - HUGE and impossible to miss */}
            <div id="game-character" style={{
              position: 'absolute',
              bottom: '120px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '150px',
              height: '150px',
              background: '#00ff88',
              borderRadius: '50%',
              transition: 'all 0.4s ease',
              boxShadow: '0 0 60px rgba(0, 255, 136, 1)',
              animation: 'breathe 3s ease-in-out infinite'
            }}></div>
            
            {/* Simple breath instruction overlay */}
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
            <div id="game-breath-display" style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#00ff88',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
              textAlign: 'center',
              display: 'none'
            }}>
              🌬️ Normal Breathing
            </div>
            

            

          </div>
          
          {/* Breath Visualizer - Hidden initially */}
          <div id="breath-visualizer" style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 255, 136, 0.3), transparent)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--primary)',
              opacity: '0.8'
            }}></div>
          </div>

          {/* Breath State - Hidden initially */}
          <div id="breath-state" style={{
            fontSize: '1.3rem',
            fontWeight: 'bold',
            color: 'var(--primary)',
            marginBottom: '1rem',
            display: 'none'
          }}>
            Ready to breathe...
          </div>

          {/* Simple detection info - Hidden initially */}
          <div id="detection-info" style={{
            fontSize: '1rem',
            opacity: '0.9',
            textAlign: 'center',
            maxWidth: '600px',
            display: 'none',
            background: 'rgba(0, 20, 40, 0.7)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid rgba(0, 255, 136, 0.3)',
            marginTop: '1rem',
            marginBottom: '2rem'
          }}>
            <strong>🎯 Breath Detection Test:</strong><br/><br/>
            💨 <strong>Inhale</strong> = Character grows and moves up<br/>
            🔥 <strong>Exhale</strong> = Character shrinks and moves down<br/>
            ⏸️ <strong>Hold Breath</strong> = Character glows blue<br/>
            🌬️ <strong>Normal</strong> = Character stays green and calm
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <button 
          id="start-demo-btn"
          className="btn pulse" 
          style={{ 
            fontSize: '1rem', 
            padding: '0.6rem 1.5rem',
            marginTop: '1rem',
            background: 'linear-gradient(45deg, var(--primary), var(--secondary))',
            border: 'none',
            borderRadius: '20px',
            color: 'var(--dark)',
            fontWeight: 'bold',
            boxShadow: '0 4px 16px rgba(0, 255, 136, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            width: 'fit-content',
            maxWidth: '300px',
            display: 'inline-block'
          }}
          onClick={() => {
            if (typeof window !== 'undefined' && (window as any).startBreathDemo) {
              (window as any).startBreathDemo();
            }
          }}
        >
          🚀 Start Breath Detection
        </button>
      </div>
    </section>
  );
};

export default DemoSection;