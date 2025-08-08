'use client';

export interface ClapEventInput {
  timeDomain: Uint8Array;
  frequencyDomain: Uint8Array;
  sampleRate: number;
  timestampMs: number;
}

export interface ClapEventInternal {
  timestamp: number;
  rms: number;
  centroid: number;
  flatness: number;
  confidence: number;
}

interface Calibration {
  sensitivity: 'low' | 'medium' | 'high';
  centroidMin: number;
  centroidMax: number;
  refractoryMs: number;
}

const STORAGE_KEY = 'bq_clap_calibration';

export class ClapDetector {
  private lastClapAt = 0;
  private calibration: Calibration;
  private baselineRms = 0;
  private lastUpdateAt = 0;

  constructor() {
    this.calibration = this.loadCalibration();
  }

  public setCalibration(update: Partial<Calibration>) {
    this.calibration = { ...this.calibration, ...update };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...this.calibration, timestamp: Date.now() })); } catch {}
  }

  public getCalibration(): Calibration { return this.calibration; }

  public reset(): void {
    this.lastClapAt = 0;
    this.baselineRms = 0;
    this.lastUpdateAt = 0;
  }

  // Expose feature computation for calibration/visualization
  public computeFeatures(input: ClapEventInput): { rms: number; centroid: number; baseline: number; threshold: number; flatness: number } {
    const { timeDomain, frequencyDomain, sampleRate } = input;
    const rms = this.calculateRMS(timeDomain);
    const centroid = this.calculateSpectralCentroid(frequencyDomain, sampleRate);
    const flatness = this.calculateSpectralFlatness(frequencyDomain);
    const factor = this.getSensitivityFactor();
    this.updateBaseline(rms, input.timestampMs);
    const threshold = Math.max(0.01, this.baselineRms * factor);
    return { rms, centroid, baseline: this.baselineRms, threshold, flatness };
  }

  process(input: ClapEventInput): ClapEventInternal | null {
    const { timeDomain, frequencyDomain, sampleRate, timestampMs } = input;
    
    // Convert to normalized floats (-1 to 1)
    const floatData = new Float32Array(timeDomain.length);
    for (let i = 0; i < timeDomain.length; i++) {
      floatData[i] = (timeDomain[i] - 128) / 128;
    }

    // Count high amplitude samples (clap signature)
    let highAmp = 0;
    const ampThreshold = this.getAmplitudeThreshold();
    for (let i = 0; i < floatData.length; i++) {
      if (Math.abs(floatData[i]) > ampThreshold) highAmp++;
    }

    // Count zero crossings (clap signature)
    let zeroCrossings = 0;
    for (let i = 1; i < floatData.length; i++) {
      if ((floatData[i] > 0 && floatData[i-1] < 0) || (floatData[i] < 0 && floatData[i-1] > 0)) {
        zeroCrossings++;
      }
    }

    // Clap detection logic (from proven gist)
    const minHighAmp = this.getMinHighAmp();
    const minZeroCrossings = this.getMinZeroCrossings();
    
    if (highAmp > minHighAmp && zeroCrossings > minZeroCrossings) {
      // Refractory block
      if (timestampMs - this.lastClapAt < this.calibration.refractoryMs) return null;
      this.lastClapAt = timestampMs;

      const rms = this.calculateRMS(timeDomain);
      const centroid = this.calculateSpectralCentroid(frequencyDomain, sampleRate);
      const flatness = this.calculateSpectralFlatness(frequencyDomain);
      const confidence = Math.min(1, (highAmp / 50) * (zeroCrossings / 50));

      return { timestamp: timestampMs, rms, centroid, flatness, confidence };
    }

    return null;
  }

  // --- Feature calcs ---
  private calculateRMS(timeDomain: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < timeDomain.length; i++) {
      const v = (timeDomain[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / timeDomain.length);
  }

  private calculateSpectralCentroid(frequencyData: Uint8Array, sampleRate: number): number {
    if (frequencyData.length === 0) return 0;
    let weightedSum = 0;
    let magnitudeSum = 0;
    const nyquist = sampleRate / 2;
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = frequencyData[i];
      const frequency = (i / frequencyData.length) * nyquist;
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private calculateSpectralFlatness(frequencyData: Uint8Array): number {
    const eps = 1e-6;
    let logSum = 0;
    let linSum = 0;
    let count = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const mag = frequencyData[i] / 255;
      const v = mag + eps;
      logSum += Math.log(v);
      linSum += v;
      count++;
    }
    if (count === 0) return 0;
    const geoMean = Math.exp(logSum / count);
    const arithMean = linSum / count;
    return arithMean > 0 ? geoMean / arithMean : 0;
  }

  private updateBaseline(rms: number, now: number) {
    if (this.baselineRms === 0) {
      this.baselineRms = rms;
      this.lastUpdateAt = now;
      return;
    }
    // Avoid adapting baseline during the brief lockout window after a clap
    if (now < this.lastUpdateAt) return;
    const alpha = 0.02; // slow EMA
    this.baselineRms = (1 - alpha) * this.baselineRms + alpha * rms;
  }

  private getSensitivityFactor(): number {
    switch (this.calibration.sensitivity) {
      case 'low': return 1.8;
      case 'high': return 1.1;
      case 'medium':
      default: return 1.4;
    }
  }

  private getMinDelta(): number {
    switch (this.calibration.sensitivity) {
      case 'low': return 0.012;
      case 'high': return 0.004;
      case 'medium':
      default: return 0.008;
    }
  }

  private getAmplitudeThreshold(): number {
    switch (this.calibration.sensitivity) {
      case 'low': return 0.35;
      case 'high': return 0.15;
      case 'medium':
      default: return 0.25;
    }
  }

  private getMinHighAmp(): number {
    switch (this.calibration.sensitivity) {
      case 'low': return 25;
      case 'high': return 8;
      case 'medium':
      default: return 15;
    }
  }

  private getMinZeroCrossings(): number {
    switch (this.calibration.sensitivity) {
      case 'low': return 35;
      case 'high': return 15;
      case 'medium':
      default: return 25;
    }
  }

  private loadCalibration(): Calibration {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const { sensitivity, centroidMin, centroidMax, refractoryMs } = parsed;
        return {
          sensitivity: sensitivity ?? 'medium',
          centroidMin: centroidMin ?? 50,
          centroidMax: centroidMax ?? 8000,
          refractoryMs: refractoryMs ?? 140
        };
      }
    } catch {}
    return { sensitivity: 'medium', centroidMin: 50, centroidMax: 8000, refractoryMs: 140 };
  }
}


