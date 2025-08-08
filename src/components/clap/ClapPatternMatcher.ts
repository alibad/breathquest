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
  private pendingSingleAt = 0;
  private readonly singleDelayMs = 600; // Wait before emitting SINGLE

  private patterns: ClapPattern[] = [
    { name: 'SINGLE', intervals: [], tolerance: 0, minConfidence: 0 },
    { name: 'DOUBLE', intervals: [350], tolerance: 150, minConfidence: 0 },
    { name: 'TRIPLE', intervals: [350, 350], tolerance: 150, minConfidence: 0 },
  ];

  addCustomPattern(pattern: ClapPattern) {
    this.patterns.push(pattern);
  }

  addClap(clap: ClapEvent): ClapPattern | null {
    const now = clap.timestamp;
    this.history.push(clap);
    this.history = this.history.filter(c => now - c.timestamp <= this.windowMs);

    console.log(`ClapPatternMatcher: ${this.history.length} claps in history`);

    const sinceLast = now - this.lastEmitAt;
    if (sinceLast < this.debounceMs) {
      console.log(`Debounced: ${sinceLast}ms < ${this.debounceMs}ms`);
      return null;
    }

    // Cancel any pending single - we have a new clap
    this.pendingSingleAt = 0;

    // Try multi-clap patterns first (excluding SINGLE)
    const multiPatterns = this.patterns.filter(p => p.intervals.length > 0);
    const sorted = [...multiPatterns].sort((a, b) => b.intervals.length - a.intervals.length);
    
    for (const pattern of sorted) {
      console.log(`Checking pattern: ${pattern.name}`);
      if (this.isMatch(pattern)) {
        console.log(`MATCHED: ${pattern.name}`);
        this.lastEmitAt = now;
        return pattern;
      }
    }

    // No multi-clap pattern matched, schedule a delayed SINGLE
    this.pendingSingleAt = now;
    console.log(`Scheduling delayed SINGLE`);
    return null;
  }

  // Call this periodically to check for delayed SINGLE patterns
  checkPendingSingle(): ClapPattern | null {
    if (this.pendingSingleAt === 0) return null;
    
    const now = performance.now();
    if (now - this.pendingSingleAt >= this.singleDelayMs) {
      this.pendingSingleAt = 0;
      this.lastEmitAt = now;
      console.log('Firing delayed SINGLE');
      return { name: 'SINGLE', intervals: [], tolerance: 0, minConfidence: 0 };
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


