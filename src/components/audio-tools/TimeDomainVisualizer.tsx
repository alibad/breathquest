'use client';

import { useEffect, useRef } from 'react';

interface TimeDomainVisualizerProps {
  data: Uint8Array;
}

export function TimeDomainVisualizer({ data }: TimeDomainVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2; // For high DPI
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    if (data.length === 0) return;

    // Draw center line (silence level)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.offsetHeight / 2);
    ctx.lineTo(canvas.offsetWidth, canvas.offsetHeight / 2);
    ctx.stroke();

    // Draw waveform
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = canvas.offsetWidth / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128; // Normalize to -1 to 1
      const y = (v * canvas.offsetHeight / 2) + (canvas.offsetHeight / 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '200px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '8px',
        border: '1px solid rgba(0, 255, 136, 0.3)'
      }}
    />
  );
}