'use client';

import { useEffect } from 'react';

interface AdvancedSpectralVisualizerProps {
  data: Uint8Array;
  sampleRate: number;
  spectralFeatures: {
    rolloff: number;
    flux: number;
    spread: number;
    skewness: number;
  };
  showFeature: 'rolloff' | 'flux' | 'spread' | 'skewness';
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export function AdvancedSpectralVisualizer({ 
  data, 
  sampleRate, 
  spectralFeatures, 
  showFeature,
  canvasRef 
}: AdvancedSpectralVisualizerProps) {

  useEffect(() => {
    const canvas = canvasRef?.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = 350 * window.devicePixelRatio;
    canvas.style.width = canvas.offsetWidth + 'px';
    canvas.style.height = '350px';
    
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = 350;
    const padding = 30; // Add padding for edge labels
    const drawWidth = width - (padding * 2);

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (data.length === 0) return;

    const nyquist = sampleRate / 2;
    const maxDisplayFreq = Math.min(20000, nyquist); // Cap at 20kHz - practical range
    
    // Draw frequency spectrum (more visible)
    for (let i = 0; i < data.length; i++) {
      const frequency = (i / data.length) * nyquist;
      if (frequency > maxDisplayFreq) break;

      const x = padding + (frequency / maxDisplayFreq) * drawWidth;
      const magnitude = data[i] / 255.0;
      const barHeight = magnitude * (height - 100);

      // More vibrant color based on frequency with better visibility
      const hue = (frequency / maxDisplayFreq) * 240;
      const saturation = 80;
      const lightness = 40 + (magnitude * 40); // Brighter based on amplitude
      ctx.fillStyle = `hsla(${240 - hue}, ${saturation}%, ${lightness}%, ${0.8 + magnitude * 0.2})`;
      ctx.fillRect(x, height - 50 - barHeight, Math.max(2, width / data.length), barHeight);
    }

    // Calculate centroid for reference
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = 0; i < data.length; i++) {
      const frequency = (i / data.length) * nyquist;
      const magnitude = data[i] / 255.0;
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    const centroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

    // Draw feature-specific overlays
    if (showFeature === 'rolloff') {
      // Draw rolloff line
      const rolloffX = padding + (spectralFeatures.rolloff / maxDisplayFreq) * drawWidth;
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(rolloffX, 50);
      ctx.lineTo(rolloffX, height - 50);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('85% Energy Below', rolloffX, 30);
      ctx.fillText(`${spectralFeatures.rolloff.toFixed(0)} Hz`, rolloffX, 45);

    } else if (showFeature === 'flux') {
      // Draw flux as change intensity per frequency bin
      const fluxIntensity = Math.min(1, spectralFeatures.flux * 20);
      
      // Draw change indicators on frequency bars that are actively changing
      for (let i = 0; i < data.length; i++) {
        const frequency = (i / data.length) * nyquist;
        if (frequency > maxDisplayFreq) break;

        const x = padding + (frequency / maxDisplayFreq) * drawWidth;
        const magnitude = data[i] / 255.0;
        const barHeight = magnitude * (height - 100);

        // Highlight bars that are likely contributing to flux
        if (magnitude > 0.1) { // Only show for significant magnitudes
          const changeIntensity = magnitude * fluxIntensity;
          ctx.fillStyle = `rgba(78, 205, 196, ${changeIntensity * 0.8})`;
          ctx.fillRect(x, height - 50 - barHeight - 10, Math.max(2, width / data.length), barHeight + 20);
        }
      }

      // Flux level bar on the right
      const fluxBarHeight = fluxIntensity * (height - 100);
      ctx.fillStyle = '#4ecdc4';
      ctx.fillRect(width - 40, height - 50 - fluxBarHeight, 30, fluxBarHeight);
      
      // Flux bar labels
      ctx.fillStyle = '#4ecdc4';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('Change', width - 45, height - 35);
      ctx.fillText('Rate', width - 45, height - 20);

      // Flux meter at top
      ctx.fillStyle = '#4ecdc4';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Spectral Flux: ${(spectralFeatures.flux * 100).toFixed(1)}%`, width / 2, 30);
      
      // Add explanation text
      ctx.fillStyle = '#4ecdc4';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('High = Rapid Changes (Onsets) | Low = Steady State', width / 2, 45);

    } else if (showFeature === 'spread') {
      // Draw centroid and spread
      const centroidX = padding + (centroid / maxDisplayFreq) * drawWidth;
      const spreadRange = spectralFeatures.spread;
      const leftBound = Math.max(padding, padding + (centroid - spreadRange) / maxDisplayFreq * drawWidth);
      const rightBound = Math.min(padding + drawWidth, padding + (centroid + spreadRange) / maxDisplayFreq * drawWidth);

      // Spread area
      ctx.fillStyle = 'rgba(69, 183, 209, 0.2)';
      ctx.fillRect(leftBound, 50, rightBound - leftBound, height - 100);

      // Centroid line
      ctx.strokeStyle = '#45b7d1';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(centroidX, 50);
      ctx.lineTo(centroidX, height - 50);
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#45b7d1';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Spread Range', width / 2, 25);
      ctx.fillText(`±${spectralFeatures.spread.toFixed(0)} Hz`, width / 2, 40);

    } else if (showFeature === 'skewness') {
      // Draw skewness visualization
      const centroidX = padding + (centroid / maxDisplayFreq) * drawWidth;
      const skewness = spectralFeatures.skewness;

      // Skewness arrow
      ctx.strokeStyle = skewness > 0 ? '#96ceb4' : '#ff9999';
      ctx.fillStyle = skewness > 0 ? '#96ceb4' : '#ff9999';
      ctx.lineWidth = 3;
      
      const arrowLength = Math.abs(skewness) * 100;
      const arrowX = skewness > 0 ? centroidX + arrowLength : centroidX - arrowLength;
      
      ctx.beginPath();
      ctx.moveTo(centroidX, height / 2);
      ctx.lineTo(arrowX, height / 2);
      ctx.stroke();

      // Arrow head
      const headSize = 10;
      ctx.beginPath();
      if (skewness > 0) {
        ctx.moveTo(arrowX, height / 2);
        ctx.lineTo(arrowX - headSize, height / 2 - headSize / 2);
        ctx.lineTo(arrowX - headSize, height / 2 + headSize / 2);
      } else {
        ctx.moveTo(arrowX, height / 2);
        ctx.lineTo(arrowX + headSize, height / 2 - headSize / 2);
        ctx.lineTo(arrowX + headSize, height / 2 + headSize / 2);
      }
      ctx.closePath();
      ctx.fill();

      // Labels
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        skewness > 0 ? 'Biased Toward High Freq' : 'Biased Toward Low Freq',
        width / 2, 
        30
      );
      ctx.fillText(`Skewness: ${skewness.toFixed(2)}`, width / 2, 45);
    }

    // Draw frequency labels at bottom (clean spacing)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    
    // Clean 2kHz steps for 20kHz range: 0, 2k, 4k, 6k, 8k, 10k, 12k, 14k, 16k, 18k, 20k
    for (let freq = 0; freq <= maxDisplayFreq; freq += 2000) {
      const x = padding + (freq / maxDisplayFreq) * drawWidth;
      
      // Clean label format
      const label = freq === 0 ? '0' : `${freq / 1000}k`;
      const textWidth = ctx.measureText(label).width;
      
      // Subtle background for better visibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x - textWidth/2 - 3, height - 22, textWidth + 6, 14);
      
      // Frequency text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x, height - 10);
    }

    // Clean - no duplicate labels at top

  }, [data, sampleRate, spectralFeatures, showFeature, canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '350px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '8px',
        border: '1px solid rgba(139, 92, 246, 0.3)'
      }}
    />
  );
}