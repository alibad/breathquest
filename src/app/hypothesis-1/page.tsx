'use client';

import PlayGameComponent from '@/components/hypothesis1/PlayGameComponent';
import CalibrateBreathComponent from '@/components/hypothesis1/CalibrateBreathComponent';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Hypothesis1Page() {
  // Start with calibration as default to avoid hydration issues
  const [activeTab, setActiveTab] = useState<'play' | 'calibrate'>('calibrate');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [hasCalibration, setHasCalibration] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hasUserManuallySelectedTab, setHasUserManuallySelectedTab] = useState(false);

  // Check calibration status only on client side to avoid hydration issues
  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);
    
    const checkCalibrationStatus = () => {
      try {
        const saved = localStorage.getItem('breathquest_calibration');
        if (saved) {
          const data = JSON.parse(saved);
          const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
          setHasCalibration(isRecent);
          setIsFirstTime(false);
          
          // Set smart default tab only after client hydration (but not if user manually clicked)
          if (isRecent && activeTab === 'calibrate' && !hasUserManuallySelectedTab) {
            setActiveTab('play');
          }
        } else {
          setHasCalibration(false);
          setIsFirstTime(true);
        }
      } catch (error) {
        setHasCalibration(false);
        setIsFirstTime(true);
      }
    };

    checkCalibrationStatus();
    
    // Re-check when activeTab changes (in case user just completed calibration)
    const interval = setInterval(checkCalibrationStatus, 1000);
    return () => clearInterval(interval);
  }, [activeTab]);
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1c 0%, #1a2332 50%, #0a0f1c 100%)',
      color: 'white'
    }}>
      {/* Header with back link */}
      <div style={{
        padding: '1rem 2rem',
        background: 'rgba(0, 20, 40, 0.8)',
        borderBottom: '1px solid rgba(0, 255, 136, 0.3)'
      }}>
        <Link 
          href="/"
          style={{
            color: '#00ff88',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          ← Back to BreathQuest
        </Link>
      </div>

      {/* Hypothesis 1 Header */}
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'rgba(0, 255, 136, 0.05)',
        borderBottom: '2px solid rgba(0, 255, 136, 0.2)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '1rem',
          background: 'linear-gradient(45deg, #00ff88, #4488ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🧪 Hypothesis #1: Microphone Breath Detection
        </h1>
        <p style={{
          fontSize: '1.2rem',
          maxWidth: '800px',
          margin: '0 auto',
          lineHeight: '1.6',
          color: '#ccc'
        }}>
          <strong>Testing:</strong> Consumer microphones can reliably detect breathing patterns 
          with sufficient accuracy for real-time gaming.
        </p>
      </div>

      {/* First-Time User Welcome Banner */}
      {isClient && isFirstTime && (
        <div style={{
          padding: '1.5rem 2rem',
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(68, 136, 255, 0.15))',
          borderBottom: '2px solid rgba(0, 255, 136, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.3rem',
            fontWeight: 'bold',
            color: '#00ff88',
            marginBottom: '0.5rem'
          }}>
            🎯 Welcome to Enhanced Breath Detection!
          </div>
          <p style={{
            fontSize: '1rem',
            color: '#ccc',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.5'
          }}>
            For the <strong style={{ color: '#4488ff' }}>best gaming experience</strong>, we recommend 
            completing the <strong style={{ color: '#00ff88' }}>30-second calibration</strong> first. 
            This creates a personalized AI model that dramatically improves breath detection accuracy!
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => {
            setHasUserManuallySelectedTab(true);
            setActiveTab('play');
          }}
          style={{
            padding: '1rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            border: activeTab === 'play' ? '3px solid #00ff88' : '2px solid #333',
            background: activeTab === 'play' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 20, 40, 0.8)',
            color: activeTab === 'play' ? '#00ff88' : '#fff',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            opacity: !hasCalibration && !isFirstTime ? 0.7 : 1
          }}
        >
          🎮 Play Game
          {isClient && hasCalibration && (
            <div style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              width: '12px',
              height: '12px',
              background: '#00ff88',
              borderRadius: '50%',
              boxShadow: '0 0 8px rgba(0, 255, 136, 0.8)'
            }}></div>
          )}
          {isClient && !hasCalibration && !isFirstTime && (
            <div style={{
              fontSize: '0.7rem',
              color: '#ffaa00',
              marginTop: '2px'
            }}>
              Calibration Recommended
            </div>
          )}
        </button>
        
        <button
          onClick={() => {
            setHasUserManuallySelectedTab(true);
            setActiveTab('calibrate');
          }}
          style={{
            padding: '1rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            border: activeTab === 'calibrate' ? '3px solid #4488ff' : '2px solid #333',
            background: activeTab === 'calibrate' ? 'rgba(68, 136, 255, 0.2)' : 'rgba(0, 20, 40, 0.8)',
            color: activeTab === 'calibrate' ? '#4488ff' : '#fff',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
        >
          📦 Calibrate Breath
          {isClient && isFirstTime && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: 'linear-gradient(45deg, #ff9500, #ffb347)',
              color: '#fff',
              fontSize: '0.6rem',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(255, 149, 0, 0.6)',
              animation: 'pulse 2s infinite'
            }}>
              START HERE
            </div>
          )}

        </button>
      </div>

      {/* Component Content */}
      <div style={{
        padding: '0 2rem 2rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '80vh',
        overflow: 'visible'
      }}>
        {activeTab === 'play' ? (
          <PlayGameComponent />
        ) : (
          <CalibrateBreathComponent onSwitchToPlay={() => setActiveTab('play')} />
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'rgba(0, 20, 40, 0.8)',
        borderTop: '1px solid rgba(0, 255, 136, 0.3)',
        marginTop: '2rem'
      }}>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          Part of the BreathQuest research project • Testing breath-controlled gaming interfaces
        </p>
      </div>
    </div>
  );
}