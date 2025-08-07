'use client';

import { useEffect } from 'react';

interface LPCAnalysisVisualizerProps {
  timeDomain: Uint8Array;
  lpcResults: {
    coefficients: number[];
    residual: number[];
    predictionGain: number;
    formants: number[];
    predictability: number;
  };
  analysisMode: 'coefficients' | 'residual' | 'formants' | 'prediction';
  sampleRate: number;
  isProcessing: boolean;
  canvasRef?: any;
}

export function LPCAnalysisVisualizer({ 
  timeDomain,
  lpcResults, 
  analysisMode,
  sampleRate,
  isProcessing,
  canvasRef 
}: LPCAnalysisVisualizerProps) {

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

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw title and status
    ctx.fillStyle = '#ffa500';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    const title = `LPC Analysis - ${analysisMode.charAt(0).toUpperCase() + analysisMode.slice(1)}`;
    ctx.fillText(title, width / 2, 25);
    
    // Show processing indicator
    if (isProcessing) {
      ctx.fillStyle = '#00ff88';
      ctx.font = '12px Arial';
      ctx.fillText('⚡ Processing...', width / 2, 45);
    }

    if (timeDomain.length === 0) {
      // Show waiting message
      ctx.fillStyle = '#888888';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for audio data...', width / 2, height / 2);
      return;
    }

    if (lpcResults.coefficients.length === 0) {
      // Show processing message
      ctx.fillStyle = '#888888';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Processing LPC analysis...', width / 2, height / 2);
      return;
    }

    // Draw based on analysis mode
    if (analysisMode === 'coefficients') {
      drawCoefficients(ctx, lpcResults.coefficients, width, height);
    } else if (analysisMode === 'residual') {
      drawResidual(ctx, timeDomain, lpcResults.residual, width, height);
    } else if (analysisMode === 'formants') {
      drawFormants(ctx, lpcResults.formants, sampleRate, width, height);
    } else if (analysisMode === 'prediction') {
      drawPredictionQuality(ctx, lpcResults, width, height);
    }

  }, [timeDomain, lpcResults, analysisMode, sampleRate, isProcessing, canvasRef]);

  const drawCoefficients = (ctx: CanvasRenderingContext2D, coefficients: number[], width: number, height: number) => {
    if (coefficients.length === 0) return;

    const barWidth = width / coefficients.length;
    const maxCoeff = Math.max(...coefficients.map(Math.abs));
    
    // Add subtitle
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Vocal Tract Model Parameters', width / 2, 45);

    // Draw coefficient bars
    coefficients.forEach((coeff, i) => {
      const x = i * barWidth;
      const normalizedCoeff = coeff / (maxCoeff || 1);
      const barHeight = Math.abs(normalizedCoeff) * (height - 100) / 2;
      const y = height / 2 - (normalizedCoeff >= 0 ? barHeight : 0);
      
      // Color based on coefficient sign and magnitude
      const intensity = Math.abs(normalizedCoeff);
      if (coeff >= 0) {
        ctx.fillStyle = `rgba(255, 107, 107, ${0.3 + intensity * 0.7})`;
      } else {
        ctx.fillStyle = `rgba(78, 205, 196, ${0.3 + intensity * 0.7})`;
      }
      
      ctx.fillRect(x, y, barWidth - 2, barHeight);
      
      // Coefficient labels
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`a${i+1}`, x + barWidth/2, height - 10);
    });

    // Draw zero line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Legend
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('+ Positive coefficients', 20, height - 30);
    ctx.fillStyle = '#4ecdc4';
    ctx.fillText('- Negative coefficients', 20, height - 15);
  };

  const drawResidual = (ctx: CanvasRenderingContext2D, original: Uint8Array, residual: number[], width: number, height: number) => {
    if (residual.length === 0) return;

    ctx.fillStyle = '#cccccc';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Original Signal vs Prediction Error', width / 2, 45);

    const halfHeight = height / 2;
    
    // Draw original signal (top half)
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const sliceWidth = width / original.length;
    for (let i = 0; i < original.length; i++) {
      const x = i * sliceWidth;
      const y = ((original[i] - 128) / 128) * (halfHeight / 2 - 20) + halfHeight / 2;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw residual (bottom half)
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const residualSliceWidth = width / residual.length;
    const maxResidual = Math.max(...residual.map(Math.abs));
    
    for (let i = 0; i < residual.length; i++) {
      const x = i * residualSliceWidth;
      const normalizedResidual = maxResidual > 0 ? residual[i] / maxResidual : 0;
      const y = normalizedResidual * (halfHeight / 2 - 20) + halfHeight + halfHeight / 2;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw separation line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    ctx.lineTo(width, halfHeight);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#00ff88';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Original Signal', 10, 45);
    
    ctx.fillStyle = '#4ecdc4';
    ctx.fillText('Prediction Residual (Error)', 10, halfHeight + 20);
  };

  const drawFormants = (ctx: CanvasRenderingContext2D, formants: number[], sampleRate: number, width: number, height: number) => {
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Vocal Tract Resonant Frequencies', width / 2, 45);

    const maxFreq = Math.min(4000, sampleRate / 2); // Focus on speech/breath range
    
    // Draw frequency scale
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let freq = 0; freq <= maxFreq; freq += 500) {
      const x = (freq / maxFreq) * width;
      ctx.beginPath();
      ctx.moveTo(x, 50);
      ctx.lineTo(x, height - 30);
      ctx.stroke();
      
      // Frequency labels
      ctx.fillStyle = '#888888';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${freq}Hz`, x, height - 10);
    }

    // Draw formant bars
    formants.forEach((formant, i) => {
      if (formant <= maxFreq) {
        const x = (formant / maxFreq) * width;
        const barWidth = 8;
        const barHeight = height - 100 - (i * 20); // Stagger heights
        
        // Color intensity based on formant number
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffa500'];
        ctx.fillStyle = colors[i % colors.length];
        
        ctx.fillRect(x - barWidth/2, 50, barWidth, barHeight);
        
        // Formant labels
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`F${i+1}`, x, 45);
        ctx.font = '9px Arial';
        ctx.fillText(`${formant.toFixed(0)}Hz`, x, height - 45 - (i * 15));
      }
    });

    // Draw typical formant ranges for reference
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    
    // F1 range (300-800 Hz)
    const f1Start = (300 / maxFreq) * width;
    const f1End = (800 / maxFreq) * width;
    ctx.fillRect(f1Start, height - 30, f1End - f1Start, 10);
    
    // F2 range (800-2200 Hz)
    const f2Start = (800 / maxFreq) * width;
    const f2End = (2200 / maxFreq) * width;
    ctx.fillRect(f2Start, height - 20, f2End - f2Start, 10);

    // Legend
    ctx.fillStyle = '#cccccc';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('F1 Range (Vowel Height)', 10, height - 25);
    ctx.fillText('F2 Range (Vowel Frontness)', 10, height - 15);
  };

  const drawPredictionQuality = (ctx: CanvasRenderingContext2D, lpcResults: any, width: number, height: number) => {
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Model Performance Metrics', width / 2, 45);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;

    // Draw prediction gain as circular meter
    const gainAngle = (lpcResults.predictionGain / 30) * 2 * Math.PI; // Normalize to 0-30dB
    
    // Background circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Prediction gain arc
    ctx.strokeStyle = '#96ceb4';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI/2, -Math.PI/2 + gainAngle);
    ctx.stroke();

    // Center text - prediction gain
    ctx.fillStyle = '#96ceb4';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${lpcResults.predictionGain.toFixed(1)} dB`, centerX, centerY - 10);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('Prediction Gain', centerX, centerY + 15);

    // Predictability percentage
    ctx.fillStyle = '#ffa500';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`${(lpcResults.predictability * 100).toFixed(0)}% Predictable`, centerX, centerY + 40);

    // Quality indicators
    const qualityText = lpcResults.predictability > 0.7 ? 'Highly Predictable' :
                       lpcResults.predictability > 0.4 ? 'Moderately Predictable' :
                       'Unpredictable/Noisy';
    
    ctx.fillStyle = lpcResults.predictability > 0.7 ? '#00ff88' :
                   lpcResults.predictability > 0.4 ? '#ffa500' : '#ff6b6b';
    ctx.font = '14px Arial';
    ctx.fillText(qualityText, centerX, centerY + 65);

    // Scale markers
    ctx.fillStyle = '#888888';
    ctx.font = '10px Arial';
    for (let i = 0; i <= 30; i += 10) {
      const angle = -Math.PI/2 + (i / 30) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * (radius + 20);
      const y = centerY + Math.sin(angle) * (radius + 20);
      ctx.textAlign = 'center';
      ctx.fillText(`${i}dB`, x, y);
    }

    // Interpretation guide
    ctx.fillStyle = '#cccccc';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Interpretation:', 20, height - 60);
    ctx.fillText('• High gain + predictable = Steady breathing/speech', 20, height - 45);
    ctx.fillText('• Low gain + unpredictable = Noise/chaotic breathing', 20, height - 30);
    ctx.fillText('• Medium values = Breath onsets/transitions', 20, height - 15);
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '350px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 165, 0, 0.3)'
      }}
    />
  );
}