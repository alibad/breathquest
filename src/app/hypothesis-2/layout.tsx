'use client';

import React, { ReactNode } from 'react';

export default function HypothesisTwoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container" style={{ paddingTop: '3.5rem', paddingBottom: '3rem' }}>
      <h1 style={{
        background: 'linear-gradient(45deg, #00ff88, #4488ff)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        fontSize: '2.2rem',
        fontWeight: 800,
        marginBottom: '1rem'
      }}>
        Hypothesis #2 — Clap Pattern Control (In Progress)
      </h1>
      <p style={{ color: '#cccccc', marginBottom: '1.5rem' }}>
        Testing whether intentional, percussive claps and their timing patterns can power robust, fun, noise‑resistant real‑time gameplay.
      </p>
      {children}
    </div>
  );
}


