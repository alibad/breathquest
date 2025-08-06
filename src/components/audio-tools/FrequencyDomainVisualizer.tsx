'use client';

import { useEffect, useRef } from 'react';

interface FrequencyDomainVisualizerProps {
  data: Uint8Array;
  sampleRate: number;
  bufferSize: number;
  showSpectralCentroid?: boolean;
  spectralCentroid?: number;
  canvasRef?: any;
}

export function FrequencyDomainVisualizer({ 
  data, 
  sampleRate, 
  bufferSize, 
  showSpectralCentroid = false, 
  spectralCentroid = 0,
  canvasRef: externalCanvasRef
}: FrequencyDomainVisualizerProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;

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

    // Calculate Nyquist frequency (max displayable frequency)
    const nyquistFreq = sampleRate / 2;
    
    // Only display up to a reasonable frequency range (e.g., 8kHz for breath analysis)
    const maxDisplayFreq = Math.min(8000, nyquistFreq);
    const maxDisplayBin = Math.floor((maxDisplayFreq * data.length) / nyquistFreq);
    
    // Draw frequency bars
    const barWidth = canvas.offsetWidth / maxDisplayBin;
    const maxHeight = canvas.offsetHeight - 30; // Leave space for labels

    for (let i = 0; i < maxDisplayBin; i++) {
      const magnitude = data[i];
      const barHeight = (magnitude / 255) * maxHeight;
      const frequency = (i * nyquistFreq) / data.length;
      
      // Enhanced color scheme based on frequency ranges
      let color;
      if (frequency < 200) {
        // Sub-bass: Deep purple
        color = `hsl(270, 80%, ${50 + (magnitude / 255) * 30}%)`;
      } else if (frequency < 500) {
        // Bass: Blue
        color = `hsl(240, 90%, ${40 + (magnitude / 255) * 40}%)`;
      } else if (frequency < 1000) {
        // Lower midrange: Cyan
        color = `hsl(180, 85%, ${45 + (magnitude / 255) * 35}%)`;
      } else if (frequency < 2000) {
        // Midrange: Green
        color = `hsl(120, 80%, ${50 + (magnitude / 255) * 30}%)`;
      } else if (frequency < 4000) {
        // Upper midrange: Yellow-green
        color = `hsl(80, 85%, ${55 + (magnitude / 255) * 25}%)`;
      } else if (frequency < 6000) {
        // High frequencies: Orange-red (breath-relevant)
        color = `hsl(20, 90%, ${60 + (magnitude / 255) * 25}%)`;
      } else {
        // Very high frequencies: Muted gray (less relevant for breath analysis)
        color = `hsl(0, 20%, ${30 + (magnitude / 255) * 20}%)`;
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(i * barWidth, maxHeight - barHeight + 25, barWidth - 0.5, barHeight);
    }

    // Draw spectral centroid line if enabled
    if (showSpectralCentroid && spectralCentroid > 0) {
      const centroidBin = (spectralCentroid * data.length) / nyquistFreq;
      if (centroidBin < maxDisplayBin) {
        const centroidX = centroidBin * barWidth;
        
        // Draw centroid line
        ctx.strokeStyle = '#ff4488';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centroidX, 25);
        ctx.lineTo(centroidX, maxHeight + 25);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
        
        // Draw centroid label
        ctx.fillStyle = '#ff4488';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`Centroid: ${Math.round(spectralCentroid)}Hz`, centroidX + 5, 20);
      }
    }

    // Draw frequency labels at the top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '11px monospace';
    
    // Label key frequencies within our display range at the top
    const labelFreqs = [100, 500, 1000, 2000, 4000, 6000, 8000];
    labelFreqs.forEach(freq => {
      if (freq <= maxDisplayFreq) {
        const bin = (freq * data.length) / nyquistFreq;
        if (bin < maxDisplayBin) {
          const x = bin * barWidth;
          const label = freq >= 1000 ? `${freq/1000}kHz` : `${freq}Hz`;
          ctx.fillText(label, x, 15);
        }
      }
    });

    // Also draw frequency labels at the bottom for reference
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px monospace';
    labelFreqs.forEach(freq => {
      if (freq <= maxDisplayFreq) {
        const bin = (freq * data.length) / nyquistFreq;
        if (bin < maxDisplayBin) {
          const x = bin * barWidth;
          const label = freq >= 1000 ? `${freq/1000}kHz` : `${freq}Hz`;
          ctx.fillText(label, x, maxHeight + 40);
        }
      }
    });
  }, [data, sampleRate, bufferSize, showSpectralCentroid, spectralCentroid]);

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