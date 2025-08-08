'use client';

import React from 'react';

interface Props {
  rms: number;
  centroid: number;
  baseline: number;
  threshold: number;
  band: { min: number; max: number };
  gates?: { rms: boolean; band: boolean; cooldown: boolean };
  flash?: boolean;
}

export default function ClapMeters({ rms, centroid, baseline, threshold, band, gates, flash }: Props) {
  const row = (label: string, value: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
      <span style={{ color: '#aaa' }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );

  const bar = (v: number, thr: number, max = 1) => {
    const pct = Math.min(100, Math.round((v / max) * 100));
    const thrPct = Math.min(100, Math.round((thr / max) * 100));
    return (
      <div style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', marginBottom: '0.4rem' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#4488ff', borderRadius: '4px' }} />
        <div style={{ position: 'absolute', left: `${thrPct}%`, top: 0, bottom: 0, width: '2px', background: '#00ff88' }} />
      </div>
    );
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.45)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '8px',
      padding: '1rem',
      boxShadow: flash ? '0 0 0 2px rgba(0,255,136,0.5)' : 'none'
    }}>
      <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Live Input</div>
      {row('RMS', rms.toFixed(3))}
      {bar(rms, threshold, 0.6)}
      {row('Baseline', baseline.toFixed(3))}
      {row('Centroid (Hz)', `${Math.round(centroid)}`)}
      <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>Band: {band.min} – {band.max} Hz</div>
      {gates && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.5rem' }}>
          <Gate label="RMS" ok={gates.rms} />
          <Gate label="Band" ok={gates.band} />
        </div>
      )}
    </div>
  );
}

function Gate({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: ok ? '#00ff88' : '#ff6666' }} />
      <div style={{ fontSize: '0.85rem', color: '#aaa' }}>{label}</div>
    </div>
  );
}


