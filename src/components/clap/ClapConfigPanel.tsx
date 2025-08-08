'use client';

import React, { MutableRefObject, useEffect, useState } from 'react';
import { ClapDetector } from './ClapDetector';

interface Props {
  detectorRef: MutableRefObject<ClapDetector | null>;
}

export default function ClapConfigPanel({ detectorRef }: Props) {
  const [isClient, setIsClient] = useState(false);
  const [vals, setVals] = useState(() => ({
    sensitivity: 'medium' as 'low' | 'medium' | 'high',
    centroidMin: 50,
    centroidMax: 8000,
    refractoryMs: 140
  }));

  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => {
    const det = detectorRef.current;
    if (det) setVals(det.getCalibration());
  }, [detectorRef, isClient]);

  const update = (key: keyof typeof vals, value: number) => {
    const next = { ...vals, [key]: value };
    setVals(next);
    detectorRef.current?.setCalibration({ [key]: value } as any);
  };

  const label = (t: string) => <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{t}</div>;
  const row = (children: React.ReactNode) => <div style={{ marginBottom: '0.8rem' }}>{children}</div>;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.45)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '8px',
      padding: '1rem'
    }}>
      <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Clap Detection Settings</div>

      <div style={{ marginBottom: '0.8rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Sensitivity</div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['low', 'medium', 'high'] as const).map(level => (
            <button key={level} onClick={() => { setVals({ ...vals, sensitivity: level }); detectorRef.current?.setCalibration({ sensitivity: level }); }}
              style={{ padding: '0.4rem 0.7rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: vals.sensitivity === level ? 'rgba(0,255,136,0.25)' : 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}>
              {level.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {row(<>
        {label('Centroid Band (Hz)')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <input type="number" value={vals.centroidMin} onChange={(e) => update('centroidMin', Number(e.target.value))} />
          <input type="number" value={vals.centroidMax} onChange={(e) => update('centroidMax', Number(e.target.value))} />
        </div>
      </>)}

      {row(<>
        {label('Refractory (ms)')}
        <input type="range" min={80} max={260} step={5} value={vals.refractoryMs} onChange={(e) => update('refractoryMs', Number(e.target.value))} style={{ width: '100%' }} />
        <div style={{ fontSize: '0.85rem', color: '#aaa' }}>{vals.refractoryMs} ms</div>
      </>)}
    </div>
  );
}


