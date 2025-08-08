'use client';

import { hypotheses } from '@/lib/constants';
import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';
import { useState } from 'react';

interface HypothesisStatus {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'cancelled';
  phase?: string;
  accuracy?: string;
  findings?: string[];
  nextSteps?: string[];
  demoLink?: string;
}

const hypothesesData: HypothesisStatus[] = [
  {
    id: 1,
    title: "Consumer microphones can reliably detect breathing patterns with sufficient accuracy for real-time gaming",
    description: "Testing whether standard smartphone/laptop microphones can detect breathing with gaming-level precision",
    status: 'completed',
    phase: 'All 3 Phases Complete',
    findings: [
      '✅ Technical Success: Spectral rolloff analysis effectively distinguishes inhale/exhale patterns',
      '✅ Personal calibration dramatically improves detection accuracy over generic algorithms',
      '✅ Real-time breath pattern detection achieved with sub-100ms latency',
      '✅ Enhanced AI system adapts to individual breathing characteristics',
      '❌ Critical limitation: Requires complete silence to function properly',
      '❌ Any ambient noise (fans, traffic, voices) breaks detection system',
      '❌ Not practical for real-world gaming environments with background noise',
      '🎯 Conclusion: Works better with calibration since different people breathe differently'
    ],
    nextSteps: [
      '🔄 Pivot research focus: Explore robust, intentional sounds for gaming',
      '🎤 Investigate speech recognition as alternative sound-based control',
      '🎵 Research noise-resistant sounds: whistling, humming, vocal effects',
      '🎮 Design sounds that are fun and resistant to environmental interference',
      '📊 Maintain breath detection as proof-of-concept for advanced audio analysis'
    ],
    demoLink: '/hypothesis-1'
  },
  {
    id: 2,
    title: "Clap patterns can power robust, fun, noise‑resistant real‑time game control",
    description: "Evaluate whether intentional, percussive clap events and timing patterns (single, double, triple, rhythmic motifs) can be detected with low latency and mapped to reliable gameplay actions across typical environments.",
    status: 'in-progress',
    phase: 'Phase 1: Feasibility & Baselines',
    findings: [
      '✅ Claps have sharp transients and wideband spectra → easy onset detection with RMS/flux gating',
      '✅ Timing between claps naturally encodes multiple actions (single/double/triple/rhythms)',
      '🧪 Requires tolerance handling for user timing variance and room acoustics',
      '🧪 Must test robustness vs. echo, AGC, and background applause/music'
    ],
    nextSteps: [
      'Implement clap onset detector (RMS + spectral flux) with noise floor auto‑calibration',
      'Add pattern matcher for single/double/triple and simple rhythms with ±tolerance windows',
      'Build real‑time visualizer: event timeline, intervals, confidence, latency',
      'Create mini‑game mapping patterns → actions; measure player success and delight',
      'Benchmark across microphones/rooms: false positives, misses, end‑to‑end latency'
    ],
    demoLink: '/hypothesis-2'
  },
  {
    id: 3,
    title: "Heart rate and respiratory sensors provide complementary data that enables adaptive gameplay mechanics beyond microphone detection",
    description: "Exploring multi-sensor integration for enhanced breath gaming",
    status: 'cancelled',
    phase: 'Research & Cost Analysis Complete',
    findings: [
      '❌ Hardware costs too high: $125+ for educational-grade respiratory belts',
      '❌ Setup complexity: Bluetooth pairing, physical hardware, calibration',
      '❌ Consumer unfriendly: Professional lab equipment, not gaming accessories',
      '❌ Best option found: Vernier Go Direct® Respiration Belt ($125)',
      '✅ Microphone-only approach validated as optimal path forward'
    ],
    nextSteps: [
      '✅ Decision made: Focus on microphone-only detection',
      'Invest in advanced audio algorithms instead of hardware',
      'Explore breath pattern recognition improvements',
      'Consider revisiting sensors only if consumer wearables emerge'
    ]
  },
  {
    id: 4,
    title: "Breath games create measurable health improvements that persist beyond gaming sessions",
    description: "Testing whether gaming can improve breathing techniques and respiratory health",
    status: 'pending',
    nextSteps: [
      'Wait for reliable breath gaming system (Hypotheses 1-2)',
      'Design longitudinal health impact studies',
      'Partner with respiratory health professionals',
      'Implement breathing pattern tracking over time',
      'Measure pre/post gaming breathing technique improvements'
    ]
  },
  {
    id: 5,
    title: "Players learn complex breathing techniques faster through progressive game mechanics than traditional instruction",
    description: "Comparing gamified vs traditional breathing technique education",
    status: 'pending',
    nextSteps: [
      'Wait for proven breath gaming system (Hypotheses 1-2)',
      'Design comparative learning studies',
      'Create progressive difficulty breathing challenges',
      'Measure learning speed vs traditional breathing instruction',
      'Partner with breathing technique instructors for validation'
    ]
  },
  {
    id: 6,
    title: "Multiplayer breath gaming creates stronger social bonding than traditional multiplayer mechanics",
    description: "Exploring social aspects of synchronized breathing in gaming",
    status: 'pending',
    nextSteps: [
      'Wait for single-player breath gaming validation (Hypotheses 1-2)',
      'Research multiplayer breath synchronization',
      'Design social breathing game mechanics',
      'Study group breathing experiences',
      'Compare social bonding vs traditional multiplayer games'
    ]
  }
];

const HypothesisSection = () => {
  const sectionRef = useFadeInOnScroll();
  const [expandedId, setExpandedId] = useState<number | null>(1); // Start with hypothesis 1 expanded
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#00ff88';
      case 'in-progress': return '#ffaa44';
      case 'pending': return '#888888';
      case 'cancelled': return '#ff6666';
      default: return '#888888';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🚧';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      default: return '⏳';
    }
  };
  
  return (
    <section id="hypothesis" ref={sectionRef}>
      <h2>Testable Hypotheses</h2>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {hypothesesData.map((hypothesis) => (
          <div 
            key={hypothesis.id}
            style={{
              marginBottom: '1rem',
              border: `2px solid ${expandedId === hypothesis.id ? getStatusColor(hypothesis.status) : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Header - Always Visible */}
            <div 
              onClick={() => setExpandedId(expandedId === hypothesis.id ? null : hypothesis.id)}
              style={{
                padding: '1.5rem',
                background: expandedId === hypothesis.id ? `${getStatusColor(hypothesis.status)}15` : 'rgba(0, 20, 40, 0.8)',
                cursor: 'pointer',
                borderBottom: expandedId === hypothesis.id ? `1px solid ${getStatusColor(hypothesis.status)}40` : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{getStatusIcon(hypothesis.status)}</span>
                    <strong style={{ color: getStatusColor(hypothesis.status) }}>
                      Hypothesis {hypothesis.id}:
                    </strong>
                    {hypothesis.phase && (
                      <span style={{ 
                        fontSize: '0.8rem', 
                        background: getStatusColor(hypothesis.status),
                        color: '#000',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: 'bold'
                      }}>
                        {hypothesis.phase}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '1rem', lineHeight: '1.4' }}>
                    {hypothesis.title}
                  </div>
                  {hypothesis.accuracy && (
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: getStatusColor(hypothesis.status),
                      marginTop: '0.5rem',
                      fontWeight: 'bold'
                    }}>
                      Current Accuracy: {hypothesis.accuracy}
                    </div>
                  )}
                </div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  color: getStatusColor(hypothesis.status),
                  transform: expandedId === hypothesis.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  ▼
                </div>
              </div>
            </div>

            {/* Expandable Content */}
            {expandedId === hypothesis.id && (
              <div style={{
                padding: '1.5rem',
                background: 'rgba(0, 10, 20, 0.9)',
                borderTop: `1px solid ${getStatusColor(hypothesis.status)}40`
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>📋 Description</h4>
                  <p style={{ color: '#ccc', lineHeight: '1.5', margin: 0 }}>
                    {hypothesis.description}
                  </p>
                </div>

                {hypothesis.findings && hypothesis.findings.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: '#00ff88', marginBottom: '0.5rem' }}>🔬 Key Findings</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                      {hypothesis.findings.map((finding, index) => (
                        <li key={index} style={{ color: '#ccc', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hypothesis.nextSteps && hypothesis.nextSteps.length > 0 && (
                  <div>
                    <h4 style={{ color: '#4488ff', marginBottom: '0.5rem' }}>🚀 Next Steps</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                      {hypothesis.nextSteps.map((step, index) => (
                        <li key={index} style={{ color: '#ccc', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hypothesis.demoLink && (
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <a
                      href={hypothesis.demoLink}
                      style={{
                        display: 'inline-block',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(45deg, #00ff88, #4488ff)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 12px rgba(0, 255, 136, 0.3)',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      🧪 Try Interactive Demo
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default HypothesisSection;