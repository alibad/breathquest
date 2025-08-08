'use client';

export interface ClapEvent {
  timestamp: number;
  rms: number;
  centroid: number;
  flatness: number;
  confidence: number;
}

export interface ClapPattern {
  name: string;
  intervals: number[]; // ms between claps
  tolerance: number;   // ±ms
  minConfidence: number; // 0..1
}

export class ClapPatternMatcher {
  private history: ClapEvent[] = [];
  private readonly windowMs = 3500;
  private readonly debounceMs = 250;
  private lastEmitAt = 0;

  private patterns: ClapPattern[] = [
    { name: 'SINGLE', intervals: [], tolerance: 0, minConfidence: 0 },
    { name: 'DOUBLE', intervals: [200], tolerance: 80, minConfidence: 0 },
    { name: 'TRIPLE', intervals: [200, 200], tolerance: 90, minConfidence: 0 },
  ];

  addCustomPattern(pattern: ClapPattern) {
    this.patterns.push(pattern);
  }

  addClap(clap: ClapEvent): ClapPattern | null {
    const now = clap.timestamp;
    this.history.push(clap);
    this.history = this.history.filter(c => now - c.timestamp <= this.windowMs);

    const sinceLast = now - this.lastEmitAt;
    if (sinceLast < this.debounceMs) return null;

    // Try to match, longest first
    const sorted = [...this.patterns].sort((a, b) => b.intervals.length - a.intervals.length);
    for (const pattern of sorted) {
      if (this.isMatch(pattern)) {
        this.lastEmitAt = now;
        return pattern;
      }
    }
    return null;
  }

  private isMatch(pattern: ClapPattern): boolean {
    if (pattern.intervals.length === 0) {
      // Single clap: always true for a new clap (debounce guards repeats)
      return true;
    }

    if (this.history.length < pattern.intervals.length + 1) return false;

    // Use the last N+1 claps
    const start = this.history.length - (pattern.intervals.length + 1);
    const segment = this.history.slice(start);
    // Confidence gating disabled (we already debounce and use timing tolerances)

    for (let i = 0; i < pattern.intervals.length; i++) {
      const dt = segment[i + 1].timestamp - segment[i].timestamp;
      const expected = pattern.intervals[i];
      if (Math.abs(dt - expected) > pattern.tolerance) return false;
    }
    return true;
  }
}


