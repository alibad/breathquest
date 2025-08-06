'use client';
import { useEffect } from 'react';

interface FrequencyBandVisualizerProps {
  bands: Array<{
    name: string;
    min: number;
    max: number;
    color: string;
    description: string;
  }>;
  bandEnergies: number[];
  canvasRef?: any;
}

export function FrequencyBandVisualizer({ bands, bandEnergies, canvasRef }: FrequencyBandVisualizerProps) {
  
  useEffect(() => {
    if (!canvasRef?.current || bands.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = 300 * window.devicePixelRatio;
    canvas.style.width = canvas.offsetWidth + 'px';
    canvas.style.height = '300px';
    
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = 300;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (bandEnergies.length === 0) {
      // Show placeholder
      ctx.fillStyle = '#4B5563';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for audio data...', width / 2, height / 2);
      return;
    }

    // Calculate bar dimensions
    const barWidth = (width - 40) / bands.length; // 20px margin on each side
    const maxBarHeight = height - 80; // Leave space for labels
    const maxEnergy = Math.max(...bandEnergies, 0.1); // Prevent division by zero

    // Draw frequency bands
    bands.forEach((band, index) => {
      const energy = bandEnergies[index] || 0;
      const barHeight = (energy / maxEnergy) * maxBarHeight;
      const x = 20 + index * barWidth;
      const y = height - 60 - barHeight; // 60px for bottom labels

      // Draw bar background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(x + 2, height - 60 - maxBarHeight, barWidth - 4, maxBarHeight);

      // Draw energy bar
      const gradient = ctx.createLinearGradient(0, y + barHeight, 0, y);
      gradient.addColorStop(0, band.color + '80'); // Semi-transparent
      gradient.addColorStop(1, band.color); // Full color at top
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

      // Add glow effect for active bands
      if (energy > 0.01) {
        ctx.shadowColor = band.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = band.color + '40';
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
        ctx.shadowBlur = 0; // Reset shadow
      }

      // Draw frequency range label at bottom
      ctx.fillStyle = '#D1D5DB';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        band.min < 1000 ? `${band.min}` : `${band.min/1000}k`,
        x + barWidth/2,
        height - 45
      );
      ctx.fillText(
        band.max < 1000 ? `${band.max}` : `${band.max/1000}k`,
        x + barWidth/2,
        height - 35
      );
      ctx.fillText('Hz', x + barWidth/2, height - 25);

      // Draw band name at top
      ctx.fillStyle = band.color;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x + barWidth/2, 15);
      ctx.rotate(-Math.PI/6); // Slight angle for readability
      ctx.fillText(band.name, 0, 0);
      ctx.restore();

      // Draw energy value inside bar if there's space
      if (barHeight > 30) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        const percentage = maxEnergy > 0 ? (energy / maxEnergy) * 100 : 0;
        ctx.fillText(
          `${percentage.toFixed(0)}%`,
          x + barWidth/2,
          y + barHeight/2 + 3
        );
      }
    });

    // Draw scale indicators on the left
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const yPos = height - 60 - (i / 5) * maxBarHeight;
      const percentage = (i / 5) * 100;
      
      // Scale line
      ctx.fillStyle = 'rgba(156, 163, 175, 0.3)';
      ctx.fillRect(18, yPos, width - 36, 1);
      
      // Scale label
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText(`${percentage.toFixed(0)}%`, 15, yPos + 3);
    }

    // Draw title
    ctx.fillStyle = '#F3F4F6';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Energy Distribution Across Frequency Bands', 20, 30);

    // Draw max energy indicator
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Max Energy: ${maxEnergy.toFixed(3)}`, width - 20, 45);

  }, [bands, bandEnergies, canvasRef]);

  return (
    <div style={{ width: '100%', marginBottom: '1rem' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '300px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
        }}
      />
    </div>
  );
}