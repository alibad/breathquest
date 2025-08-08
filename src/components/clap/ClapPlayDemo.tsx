'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Props {
  history: { name: string; detectedAt: number }[];
  onClearHistory: () => void;
}

export default function ClapPlayDemo({ history, onClearHistory }: Props) {
  const [message, setMessage] = useState<string>('Waiting for claps…');
  const [y, setY] = useState<number>(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [paused, setPaused] = useState<boolean>(false);
  const [shadowScale, setShadowScale] = useState<number>(1);
  const historyCardRef = useRef<HTMLDivElement | null>(null);
  const [leftHeight, setLeftHeight] = useState<number>(220);

  useEffect(() => {
    const latest = history.length > 0 ? history[0].name : null;
    if (!latest) return;
    switch (latest) {
      case 'SINGLE':
        setMessage('JUMP');
        setY((v) => Math.min(180, v + 100));
        setScale(1.45);
        setTimeout(() => setScale(1), 150);
        break;
      case 'DOUBLE':
        setMessage('FIRE');
        setFlash('#ffae42');
        setTimeout(() => setFlash(null), 120);
        break;
      case 'TRIPLE':
        setMessage('SPECIAL');
        setFlash('#8b5cf6');
        setScale(1.8);
        setTimeout(() => { setFlash(null); setScale(1); }, 180);
        break;
      // Removed DOT_DASH and SHAVE_AND_A_HAIRCUT patterns
      default:
        setMessage(latest);
    }
  }, [history.length]);

  useEffect(() => {
    const id = setInterval(() => {
      setY((v) => {
        const next = Math.max(0, v - 2);
        if (v > 0 && next === 0) {
          setShadowScale(1.6);
          setTimeout(() => setShadowScale(1), 140);
        }
        return next;
      });
    }, 30);
    return () => clearInterval(id);
  }, []);

  // Keep playground height matched to history card height
  useEffect(() => {
    if (!historyCardRef.current || typeof ResizeObserver === 'undefined') return;
    const el = historyCardRef.current;
    const update = () => setLeftHeight(Math.max(200, Math.round(el.getBoundingClientRect().height)));
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '10px', padding: '1rem', minHeight: '260px', position: 'relative'
    }}>
      {flash && (
        <div style={{ position: 'absolute', inset: 0, background: flash, opacity: 0.15, borderRadius: '10px', pointerEvents: 'none' }} />
      )}
      <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Mini‑Game</div>
      <div style={{ color: '#aaa', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Actions: SINGLE → Jump, DOUBLE → Fire, TRIPLE → Special</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', alignItems: 'start', gap: '0.75rem' }}>
        {/* Playground */}
        <div style={{ position: 'relative', height: `${leftHeight}px`, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
          {paused && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>PAUSED</div>
          )}
          {/* floor */}
          <div style={{ position: 'absolute', bottom: '14px', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.08)' }} />
          {/* shadow */}
          <div style={{ position: 'absolute', bottom: '8px', left: '20px', width: '36px', height: '8px', borderRadius: '50%', background: 'rgba(0,0,0,0.35)', filter: 'blur(2px)', transform: `scaleX(${shadowScale})`, transition: 'transform 120ms ease' }} />
          {/* player */}
          <div style={{ position: 'absolute', bottom: `${y + 12}px`, left: '20px', width: '32px', height: '32px', borderRadius: '50%', background: '#00ff88', transform: `scale(${scale})`, transition: 'bottom 0.08s linear, transform 0.12s ease' }} />
        </div>
        {/* History */}
        <div ref={historyCardRef} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#aaa' }}>Pattern History</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '999px', padding: '0 8px', fontSize: '0.75rem', color: '#ccc' }}>{history.length}</span>
              <button onClick={onClearHistory} aria-label="Clear pattern history" style={{ padding: '2px 6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>Clear</button>
            </div>
          </div>
          {history.length === 0 ? (
            <div style={{ color: '#888' }}>None yet</div>
          ) : (
            <div className="scroll-panel" style={{ display: 'flex', flexDirection: 'column', maxHeight: '240px' }} aria-label="Pattern history" role="list">
              {history.map((p, idx) => {
                const d = new Date(p.detectedAt);
                const mm = String(d.getMinutes()).padStart(2, '0');
                const ss = String(d.getSeconds()).padStart(2, '0');
                const ms = String(d.getMilliseconds()).padStart(3, '0');
                const time = `${mm}:${ss}.${ms}`;
                const color = p.name === 'SINGLE' ? '#00ff88' : p.name === 'DOUBLE' ? '#ffae42' : '#8b5cf6';
                return (
                  <div key={idx} role="listitem" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', color: idx === 0 ? '#fff' : '#cfd3d7', fontWeight: 600, fontSize: '0.9rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '999px', padding: '2px 8px', fontSize: '0.85rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</span>
                      </span>
                    </span>
                    <span style={{ color: '#9aa1a6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: '0.7rem' }}>{time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


