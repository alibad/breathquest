'use client';

import React, { ReactNode } from 'react';

export default function HypothesisThreeLayout({ children }: { children: ReactNode }) {
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
        Hypothesis #3 — Fun Sound Game (In Progress)
      </h1>
      <p style={{ color: '#cccccc', marginBottom: '1.5rem' }}>
        Build a fun, expressive mini‑game powered by simple sounds. We start with claps (SINGLE/DOUBLE/TRIPLE) and may add voice controls next.
      </p>
      {children}
    </div>
  );
}


