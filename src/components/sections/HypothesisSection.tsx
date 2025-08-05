'use client';

import { hypotheses } from '@/lib/constants';
import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';
import { useState } from 'react';

interface HypothesisStatus {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  phase?: string;
  accuracy?: string;
  findings?: string[];
  nextSteps?: string[];
}

const hypothesesData: HypothesisStatus[] = [
  {
    id: 1,
    title: "Consumer microphones can reliably detect breathing patterns with sufficient accuracy for real-time gaming",
    description: "Testing whether standard smartphone/laptop microphones can detect breathing with gaming-level precision",
    status: 'pending',
    phase: 'Planning Phase 1',
    findings: [
      'Research review shows SpiroSmart achieved 94.9% accuracy vs medical spirometer',
      'Academic studies validate microphone breath detection is technically feasible',
      'Frequency band filtering (100-1200 Hz) identified as key technique',
      'Multi-feature analysis approach shows promise in research',
      'Personal calibration critical for cross-user consistency'
    ],
    nextSteps: [
      'Build Phase 1: Simple RMS-based breath detection',
      'Implement basic threshold-based state detection',
      'Test fundamental microphone breath detection capability',
      'Establish baseline performance metrics',
      'Build Phase 2: Add research-enhanced algorithms'
    ]
  },
  {
    id: 2,
    title: "Breath-controlled gameplay is genuinely fun and engaging, not just a wellness novelty",
    description: "Validating whether breath gaming creates compelling gameplay experiences",
    status: 'pending',
    findings: [
      'Initial user feedback shows high engagement with breath controls',
      'Natural breathing integration feels intuitive after brief learning period',
      'Unique gameplay mechanics impossible with traditional input methods'
    ],
    nextSteps: [
      'Conduct structured user testing sessions',
      'Measure engagement vs traditional controls',
      'Test extended play sessions for fatigue factors'
    ]
  },
  {
    id: 3,
    title: "Heart rate and respiratory sensors provide complementary data that enables adaptive gameplay mechanics beyond microphone detection",
    description: "Exploring multi-sensor integration for enhanced breath gaming",
    status: 'pending',
    findings: [
      'Microphone-only detection provides solid foundation',
      'Additional sensors could enhance accuracy and enable new mechanics'
    ],
    nextSteps: [
      'Research wearable sensor integration options',
      'Design complementary data fusion algorithms',
      'Prototype multi-sensor breath gaming experiences'
    ]
  },
  {
    id: 4,
    title: "Breath games create measurable health improvements that persist beyond gaming sessions",
    description: "Testing whether gaming can improve breathing techniques and respiratory health",
    status: 'pending',
    findings: [
      'Guided breathing exercises successfully implemented',
      'Pattern recognition and feedback systems operational'
    ],
    nextSteps: [
      'Design longitudinal health impact studies',
      'Partner with respiratory health professionals',
      'Implement breathing pattern tracking over time'
    ]
  },
  {
    id: 5,
    title: "Players learn complex breathing techniques faster through progressive game mechanics than traditional instruction",
    description: "Comparing gamified vs traditional breathing technique education",
    status: 'pending',
    nextSteps: [
      'Design comparative learning studies',
      'Create progressive difficulty breathing challenges',
      'Measure learning speed vs traditional methods'
    ]
  },
  {
    id: 6,
    title: "Multiplayer breath gaming creates stronger social bonding than traditional multiplayer mechanics",
    description: "Exploring social aspects of synchronized breathing in gaming",
    status: 'pending',
    nextSteps: [
      'Research multiplayer breath synchronization',
      'Design social breathing game mechanics',
      'Study group breathing experiences'
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
      default: return '#888888';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🚧';
      case 'pending': return '⏳';
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
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default HypothesisSection;