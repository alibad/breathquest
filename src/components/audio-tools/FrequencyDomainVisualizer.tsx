'use client';

import { useEffect, useRef } from 'react';

interface FrequencyDomainVisualizerProps {
  data: Uint8Array;
  sampleRate: number;
  bufferSize: number;
}

export function FrequencyDomainVisualizer({ data, sampleRate, bufferSize }: FrequencyDomainVisualizerProps) {
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

    // Draw frequency bars
    const barWidth = canvas.offsetWidth / data.length;
    const maxHeight = canvas.offsetHeight;

    for (let i = 0; i < data.length; i++) {
      const magnitude = data[i];
      const barHeight = (magnitude / 255) * maxHeight;
      
      // Color gradient from blue to cyan based on frequency
      const hue = 180 + (i / data.length) * 60; // Blue to cyan
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      
      ctx.fillRect(i * barWidth, maxHeight - barHeight, barWidth - 1, barHeight);
    }

    // Draw frequency labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px monospace';
    
    // Label some key frequencies
    const labelFreqs = [100, 1000, 5000, 10000];
    labelFreqs.forEach(freq => {
      if (freq < sampleRate / 2) {
        const bin = Math.floor((freq * data.length * 2) / sampleRate);
        if (bin < data.length) {
          const x = bin * barWidth;
          ctx.fillText(`${freq}Hz`, x, 15);
        }
      }
    });
  }, [data, sampleRate, bufferSize]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '200px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '8px',
        border: '1px solid rgba(68, 136, 255, 0.3)'
      }}
    />
  );
}