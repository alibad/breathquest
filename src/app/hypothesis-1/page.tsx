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
  
  // The Path (8 Nov 2026): the page around the instrument follows day and night;
  // the calibration and the game sit on a dark console (.bq-console in path.css)
  // in both, because they are drawn for a dark screen. Styles live in path.css.
  return (
    <div className="bq-lab bq-lab-wide">
      {/* Header with back link */}
      <div className="bq-back">
        <Link href="/">
          ← Back to BreathQuest
        </Link>
      </div>

      {/* Hypothesis 1 Header */}
      <header className="bq-lab-head">
        <h1 className="hqp-display">
          🧪 Hypothesis #1: Microphone Breath Detection
        </h1>
        <p className="hqp-lede">
          <strong>Testing:</strong> Consumer microphones can reliably detect breathing patterns 
          with sufficient accuracy for real-time gaming.
        </p>
      </header>

      {/* First-Time User Welcome Banner */}
      {isClient && isFirstTime && (
        <div className="bq-welcome">
          <div className="bq-welcome-title">
            🎯 Welcome to Enhanced Breath Detection!
          </div>
          <p>
            For the <strong>best gaming experience</strong>, we recommend 
            completing the <strong>30-second calibration</strong> first. 
            This creates a personalized AI model that dramatically improves breath detection accuracy!
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bq-tabs">
        <button
          onClick={() => {
            setHasUserManuallySelectedTab(true);
            setActiveTab('play');
          }}
          className="bq-tab"
          aria-pressed={activeTab === 'play'}
          style={{ opacity: !hasCalibration && !isFirstTime ? 0.7 : 1 }}
        >
          🎮 Play Game
          {isClient && hasCalibration && (
            <div className="bq-tab-dot"></div>
          )}
          {isClient && !hasCalibration && !isFirstTime && (
            <div className="bq-tab-note">
              Calibration Recommended
            </div>
          )}
        </button>
        
        <button
          onClick={() => {
            setHasUserManuallySelectedTab(true);
            setActiveTab('calibrate');
          }}
          className="bq-tab"
          aria-pressed={activeTab === 'calibrate'}
        >
          📦 Calibrate Breath
          {isClient && isFirstTime && (
            <div className="bq-tab-badge">
              START HERE
            </div>
          )}

        </button>
      </div>

      {/* Component Content */}
      <div className="bq-console bq-console-tall">
        {activeTab === 'play' ? (
          <PlayGameComponent />
        ) : (
          <CalibrateBreathComponent onSwitchToPlay={() => setActiveTab('play')} />
        )}
      </div>

      {/* Footer */}
      <div className="bq-lab-note">
        <p>
          Part of the BreathQuest research project • Testing breath-controlled gaming interfaces
        </p>
      </div>
    </div>
  );
}