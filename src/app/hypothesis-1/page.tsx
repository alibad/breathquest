'use client';

import PlayGameComponent from '@/components/hypothesis1/PlayGameComponent';
import CalibrateBreathComponent from '@/components/hypothesis1/CalibrateBreathComponent';
import Link from 'next/link';
import { useState } from 'react';

export default function Hypothesis1Page() {
  const [activeTab, setActiveTab] = useState<'play' | 'calibrate'>('play');
  
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

      {/* Tab Navigation */}
      <div style={{
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('play')}
          style={{
            padding: '1rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            border: activeTab === 'play' ? '3px solid #00ff88' : '2px solid #333',
            background: activeTab === 'play' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 20, 40, 0.8)',
            color: activeTab === 'play' ? '#00ff88' : '#fff',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          🎮 Play Game
        </button>
        
        <button
          onClick={() => setActiveTab('calibrate')}
          style={{
            padding: '1rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            border: activeTab === 'calibrate' ? '3px solid #4488ff' : '2px solid #333',
            background: activeTab === 'calibrate' ? 'rgba(68, 136, 255, 0.2)' : 'rgba(0, 20, 40, 0.8)',
            color: activeTab === 'calibrate' ? '#4488ff' : '#fff',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          📦 Calibrate Breath
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