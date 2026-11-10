'use client';

import React, { ReactNode } from 'react';

/* The Path (8 Nov 2026): the page follows day and night like the home page; the
   instrument below sits on a dark console (.bq-console in path.css) in both,
   because its own controls and canvas are drawn for a dark screen. */
export default function HypothesisThreeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bq-lab">
      <header className="bq-lab-head">
        <h1 className="hqp-display">
          Hypothesis #3 — Fun Sound Game (Done)
        </h1>
        <p className="hqp-lede">
          Build a fun, expressive mini‑game powered by simple sounds. We start with claps (SINGLE/DOUBLE/TRIPLE) and may add voice controls next.
        </p>
      </header>
      <div className="bq-console">{children}</div>
    </div>
  );
}
