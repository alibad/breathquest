'use client';

import { useEffect, useRef } from 'react';

interface AmplitudeEnvelopeVisualizerProps {
  timeDomainData: Uint8Array;
  envelopeData: Float32Array;
  canvasRef?: any;
}

export function AmplitudeEnvelopeVisualizer({ 
  timeDomainData, 
  envelopeData, 
  canvasRef: externalCanvasRef 
}: AmplitudeEnvelopeVisualizerProps) {
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

    if (timeDomainData.length === 0) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Draw center line (silence level)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw original waveform (faded)
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const sliceWidth = width / timeDomainData.length;
    let x = 0;

    for (let i = 0; i < timeDomainData.length; i++) {
      const v = (timeDomainData[i] - 128) / 128; // Normalize to -1 to 1
      const y = (v * height / 2) + (height / 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Draw amplitude envelope (bright)
    if (envelopeData.length > 0) {
      ctx.strokeStyle = '#ff8844';
      ctx.lineWidth = 3;
      ctx.beginPath();

      x = 0;
      const envelopeSliceWidth = width / envelopeData.length;

      for (let i = 0; i < envelopeData.length; i++) {
        // Convert envelope value to screen coordinates
        // Envelope is positive magnitude, so we draw both positive and negative
        const envelopeValue = envelopeData[i] / 128; // Normalize
        const yPos = height / 2 - (envelopeValue * height / 4); // Upper envelope
        const yNeg = height / 2 + (envelopeValue * height / 4); // Lower envelope

        if (i === 0) {
          ctx.moveTo(x, yPos);
        } else {
          ctx.lineTo(x, yPos);
        }

        x += envelopeSliceWidth;
      }

      ctx.stroke();

      // Draw lower envelope (mirror)
      ctx.beginPath();
      x = 0;

      for (let i = 0; i < envelopeData.length; i++) {
        const envelopeValue = envelopeData[i] / 128;
        const yNeg = height / 2 + (envelopeValue * height / 4);

        if (i === 0) {
          ctx.moveTo(x, yNeg);
        } else {
          ctx.lineTo(x, yNeg);
        }

        x += envelopeSliceWidth;
      }

      ctx.stroke();

      // Fill between envelope curves for better visibility
      ctx.fillStyle = 'rgba(255, 136, 68, 0.1)';
      ctx.beginPath();
      
      // Top envelope
      x = 0;
      for (let i = 0; i < envelopeData.length; i++) {
        const envelopeValue = envelopeData[i] / 128;
        const yPos = height / 2 - (envelopeValue * height / 4);
        
        if (i === 0) {
          ctx.moveTo(x, yPos);
        } else {
          ctx.lineTo(x, yPos);
        }
        
        x += envelopeSliceWidth;
      }
      
      // Bottom envelope (reverse direction)
      for (let i = envelopeData.length - 1; i >= 0; i--) {
        const envelopeValue = envelopeData[i] / 128;
        const yNeg = height / 2 + (envelopeValue * height / 4);
        
        x -= envelopeSliceWidth;
        ctx.lineTo(x, yNeg);
      }
      
      ctx.closePath();
      ctx.fill();
    }

    // Add labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px monospace';
    ctx.fillText('Raw Waveform', 10, 20);
    
    ctx.fillStyle = '#ff8844';
    ctx.fillText('Amplitude Envelope', 10, 40);
    
    // Add amplitude scale
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px monospace';
    ctx.fillText('Loud', 10, height / 4);
    ctx.fillText('Silence', 10, height / 2);
    ctx.fillText('Loud', 10, 3 * height / 4);

  }, [timeDomainData, envelopeData]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '250px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 136, 68, 0.3)'
      }}
    />
  );
}