'use client';

import { useEffect, useRef } from 'react';

interface SpectralFeatures {
  rolloff: number;
  flux: number;
  spread: number;
  skewness: number;
}

interface FrequencyDomainVisualizerProps {
  data: Uint8Array;
  sampleRate: number;
  bufferSize: number;
  showSpectralCentroid?: boolean;
  spectralCentroid?: number;
  analysisMode?: 'spectrum' | 'centroid' | 'rolloff' | 'flux' | 'spread' | 'skewness';
  spectralFeatures?: SpectralFeatures;
  canvasRef?: any;
}

export function FrequencyDomainVisualizer({ 
  data, 
  sampleRate, 
  bufferSize, 
  showSpectralCentroid = false, 
  spectralCentroid = 0,
  analysisMode = 'spectrum',
  spectralFeatures = { rolloff: 0, flux: 0, spread: 0, skewness: 0 },
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

    // Draw analysis mode-specific overlays
    if (analysisMode === 'centroid' && spectralCentroid > 0) {
      // Draw centroid line exactly as it was in spectrum tab
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
    } else if (analysisMode === 'rolloff' && spectralFeatures.rolloff > 0) {
      // Draw rolloff line using same positioning method as centroid
      const rolloffBin = (spectralFeatures.rolloff * data.length) / nyquistFreq;
      if (rolloffBin < maxDisplayBin) {
        const rolloffX = rolloffBin * barWidth;
        
        ctx.strokeStyle = '#9333ea';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(rolloffX, 25);
        ctx.lineTo(rolloffX, maxHeight + 25);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Label
        ctx.fillStyle = '#9333ea';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`85% Rolloff: ${spectralFeatures.rolloff.toFixed(0)}Hz`, rolloffX + 5, 20);
      }
    } else if (analysisMode === 'flux') {
      // Create a dynamic flux visualization based on current spectral flux value
      const fluxIntensity = Math.min(1, spectralFeatures.flux * 1000); // Scale flux for better visibility
      
      if (fluxIntensity > 0.01) {
        // Create pulsing overlay for flux changes
        const alpha = Math.min(0.8, fluxIntensity * 2);
        
        // Full-width flux overlay
        ctx.fillStyle = `rgba(6, 182, 212, ${alpha * 0.3})`;
        ctx.fillRect(0, 25, canvas.offsetWidth, maxHeight);
        
        // Highlight high-change frequency regions
        for (let i = 0; i < maxDisplayBin; i++) {
          const magnitude = data[i];
          if (magnitude > 50) { // Only highlight significant frequencies
            const x = i * barWidth;
            ctx.fillStyle = `rgba(6, 182, 212, ${alpha * 0.8})`;
            ctx.fillRect(x, 25, barWidth - 0.5, (magnitude / 255) * maxHeight * 0.3);
          }
        }
      }
      
      // Flux indicator with status
      const fluxStatus = fluxIntensity > 0.05 ? 'HIGH CHANGE' : fluxIntensity > 0.01 ? 'MEDIUM CHANGE' : 'STABLE';
      const fluxColor = fluxIntensity > 0.05 ? '#ff4488' : fluxIntensity > 0.01 ? '#f59e0b' : '#06b6d4';
      
      ctx.fillStyle = fluxColor;
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`${fluxStatus} - Flux: ${spectralFeatures.flux.toFixed(4)}`, 10, 20);
    } else if (analysisMode === 'spread' && spectralFeatures.spread > 0 && spectralCentroid > 0) {
      // Draw spread range around centroid
      const centroidX = (spectralCentroid / maxDisplayFreq) * canvas.offsetWidth;
      const spreadWidth = (spectralFeatures.spread / maxDisplayFreq) * canvas.offsetWidth;
      
      // Spread area
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fillRect(Math.max(0, centroidX - spreadWidth/2), 25, 
                   Math.min(canvas.offsetWidth, spreadWidth), maxHeight);
      
      // Centroid line
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centroidX, 25);
      ctx.lineTo(centroidX, maxHeight + 25);
      ctx.stroke();
      
      // Labels
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`Spread: ${spectralFeatures.spread.toFixed(0)}Hz`, 10, 20);
    } else if (analysisMode === 'skewness') {
      // Color-code the spectrum based on skewness
      const skew = spectralFeatures.skewness;
      let skewColor;
      let skewText;
      
      if (skew > 0.5) {
        skewColor = '#f59e0b';
        skewText = 'Low-frequency heavy';
      } else if (skew < -0.5) {
        skewColor = '#06b6d4';
        skewText = 'High-frequency heavy';
      } else {
        skewColor = '#10b981';
        skewText = 'Balanced distribution';
      }
      
      // Overlay gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.offsetWidth, 0);
      if (skew > 0) {
        gradient.addColorStop(0, `rgba(245, 158, 11, ${Math.abs(skew) * 0.3})`);
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
        gradient.addColorStop(1, `rgba(6, 182, 212, ${Math.abs(skew) * 0.3})`);
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 25, canvas.offsetWidth, maxHeight);
      
      // Label
      ctx.fillStyle = skewColor;
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`Skewness: ${skew.toFixed(2)} (${skewText})`, 10, 20);
    }

    // Spectrum mode shows no overlays - just the pure frequency spectrum

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
  }, [data, sampleRate, bufferSize, showSpectralCentroid, spectralCentroid, analysisMode, spectralFeatures]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '350px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '8px',
        border: '1px solid rgba(68, 136, 255, 0.3)'
      }}
    />
  );
}