'use client';
import { useEffect } from 'react';

interface ZeroCrossingVisualizerProps {
  data: Uint8Array;
  crossingPositions: number[];
  showCrossings: boolean;
  canvasRef?: any;
}

export function ZeroCrossingVisualizer({ data, crossingPositions, showCrossings, canvasRef }: ZeroCrossingVisualizerProps) {
  
  useEffect(() => {
    if (!canvasRef?.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = 400 * window.devicePixelRatio;
    canvas.style.width = canvas.offsetWidth + 'px';
    canvas.style.height = '400px';
    
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = 400;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (data.length === 0) {
      // Show placeholder
      ctx.fillStyle = '#4B5563';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for audio data...', width / 2, height / 2);
      return;
    }

    const centerY = height / 2;
    const amplitude = (height - 80) / 2; // Leave space for labels
    const barWidth = (width - 80) / data.length; // 40px margin on each side

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = 40 + (i * (height - 80) / 4);
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 40, y);
      ctx.stroke();
    }

    // Zero line (center)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, centerY);
    ctx.lineTo(width - 40, centerY);
    ctx.stroke();

    // Draw y-axis labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    const labels = ['+127', '+64', '0', '-64', '-127'];
    labels.forEach((label, i) => {
      const y = 40 + (i * (height - 80) / 4) + 4;
      ctx.fillText(label, 35, y);
    });

    // Convert data to signed values and draw waveform
    const signedData = Array.from(data).map(val => val - 128); // Convert to -128 to +127 range
    
    // Draw waveform
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < signedData.length; i++) {
      const x = 40 + i * barWidth;
      const y = centerY - (signedData[i] / 128) * amplitude;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw crossing points
    if (showCrossings && crossingPositions.length > 0) {
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1;
      
      crossingPositions.forEach(position => {
        if (position < signedData.length) {
          const x = 40 + position * barWidth;
          const y = centerY - (signedData[position] / 128) * amplitude;
          
          // Draw crossing point as a circle
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw vertical line to zero
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, centerY);
          ctx.stroke();
        }
      });
    }

    // Draw sample indices on x-axis (every 64 samples)
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < data.length; i += 64) {
      const x = 40 + i * barWidth;
      ctx.fillText(i.toString(), x, height - 15);
    }

    // Draw title and stats
    ctx.fillStyle = '#F3F4F6';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Time Domain Waveform with Zero Crossings', 40, 25);

    // Draw crossing count
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${crossingPositions.length} Zero Crossings`, width - 40, 25);

    // Draw legend
    const legendY = height - 45;
    
    // Waveform legend
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, legendY);
    ctx.lineTo(70, legendY);
    ctx.stroke();
    
    ctx.fillStyle = '#06B6D4';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Audio Waveform', 75, legendY + 4);

    if (showCrossings) {
      // Crossing points legend - positioned further right to avoid overlap
      const crossingLegendX = 220; // Increased spacing
      
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(crossingLegendX, legendY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#EF4444';
      ctx.font = '12px Arial';
      ctx.fillText('Zero Crossings', crossingLegendX + 10, legendY + 4);
    }

    // Draw amplitude analysis in corner
    const maxAmplitude = Math.max(...signedData.map(Math.abs));
    const avgAmplitude = signedData.reduce((sum, val) => sum + Math.abs(val), 0) / signedData.length;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width - 180, 40, 140, 60);
    
    ctx.fillStyle = '#F3F4F6';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Signal Stats:', width - 175, 55);
    ctx.fillText(`Max: ${maxAmplitude.toFixed(0)}`, width - 175, 70);
    ctx.fillText(`Avg: ${avgAmplitude.toFixed(1)}`, width - 175, 85);

  }, [data, crossingPositions, showCrossings, canvasRef]);

  return (
    <div style={{ width: '100%', marginBottom: '1rem' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '400px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        }}
      />
    </div>
  );
}