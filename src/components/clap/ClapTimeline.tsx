'use client';

import React, { memo } from 'react';
import type { ClapEvent } from './ClapPatternMatcher';

interface Props { events: ClapEvent[] }

function TimelineBase({ events }: Props) {
  const width = 600;
  const height = 180;
  const now = events.length > 0 ? events[events.length - 1].timestamp : 0;
  const start = now - 3000; // 3s window

  const points = events.map(e => ({
    x: Math.max(0, Math.min(width, ((e.timestamp - start) / Math.max(1, (now - start))) * width)),
    y: height - 36,
    c: e.confidence
  }));

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px' }}>
      <div style={{ padding: '0.5rem 0.75rem', color: '#aaa', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <span>Clap Timeline (last 3s)</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00ff88' }} />
            <span>High confidence</span>
          </span>
          <span style={{ opacity: 0.8 }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4488ff' }} />
            <span>Detected</span>
          </span>
        </span>
      </div>
      <svg width={width} height={height} style={{ display: 'block', width: '100%' }} viewBox={`0 0 ${width} ${height}`}>
        <rect x={0} y={0} width={width} height={height} fill="rgba(0,0,0,0.35)" />
        {/* grid */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1={(i * width) / 6} y1={0} x2={(i * width) / 6} y2={height} stroke="rgba(255,255,255,0.08)" />
        ))}
        {/* events */}
        {points.map((p, idx) => (
          <g key={idx}>
            <line x1={p.x} y1={height} x2={p.x} y2={height - 48} stroke={p.c > 0.8 ? '#00ff88' : '#4488ff'} strokeWidth={3} />
            <circle cx={p.x} cy={p.y} r={6} fill={p.c > 0.8 ? '#00ff88' : '#4488ff'} />
          </g>
        ))}
        {/* interval labels */}
        {points.length >= 2 && points.slice(1).map((p, idx) => {
          const prev = points[idx];
          const mid = (prev.x + p.x) / 2;
          const dt = Math.max(0, Math.round(events[idx + 1].timestamp - events[idx].timestamp));
          return <text key={`t${idx}`} x={mid} y={24} fill="#aaa" fontSize="10" textAnchor="middle">{dt} ms</text>;
        })}
      </svg>
    </div>
  );
}

const ClapTimeline = memo(TimelineBase);
export default ClapTimeline;


