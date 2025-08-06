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
      'Phase 1: Basic RMS breath detection successfully implemented',
      'Phase 2: Research-enhanced algorithms (SpiroSmart) fully implemented',
      'Phase 3: Gaming-focused personal calibration system completed',
      'Personal breathing profiles: Box breathing, balanced breathing, range mapping',
      'Breathing exercises from protocols.json: Navy SEALs focus, assessment, stealth/power mapping',
      'Profile persistence: Save/load personal breathing signatures for gaming',
      'All 3 phases complete: Basic → Research-enhanced → Personal calibration'
    ],
    nextSteps: [
      'Test Phase 1 vs Phase 2 vs Phase 3 accuracy comparison',
      'Validate personal calibration improves gaming precision',
      'Measure user satisfaction with personalized profiles',
      'Test profile persistence across browser sessions',
      'Expand to hypothesis 2: Validate breath gaming is fun and engaging'
    ],
    demoLink: '/hypothesis-1'
  },
  {
    id: 2,
    title: "Breath-controlled gameplay is genuinely fun and engaging, not just a wellness novelty",
    description: "Validating whether breath gaming creates compelling gameplay experiences",
    status: 'pending',
    nextSteps: [
      'Wait for Hypothesis 1 completion (reliable breath detection)',
      'Conduct structured user testing sessions',
      'Measure engagement vs traditional controls',
      'Test extended play sessions for fatigue factors',
      'Compare breath gaming vs traditional input enjoyment'
    ]
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