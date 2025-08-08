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

  private currentPhase = 'normal'; // Default to normal mode

  private patterns: ClapPattern[] = [
    { name: 'SINGLE', intervals: [], tolerance: 0, minConfidence: 0 },
    { name: 'DOUBLE', intervals: [300], tolerance: 200, minConfidence: 0 }, // 100-500ms range (much wider!)
    { name: 'TRIPLE', intervals: [300, 300], tolerance: 200, minConfidence: 0 }, // 100-500ms range per gap
  ];

  addCustomPattern(pattern: ClapPattern) {
    this.patterns.push(pattern);
  }

  setPhase(phase: string) {
    this.currentPhase = phase;
    console.log(`ClapPatternMatcher phase set to: ${phase}`);
  }

  reset() {
    this.history = [];
    this.lastEmitAt = 0;
    console.log('ClapPatternMatcher reset');
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



    // Try multi-clap patterns first (excluding SINGLE)
    const multiPatterns = this.patterns.filter(p => p.intervals.length > 0);
    const sorted = [...multiPatterns].sort((a, b) => b.intervals.length - a.intervals.length);
    
    for (const pattern of sorted) {
      console.log(`Checking pattern: ${pattern.name}, need ${pattern.intervals.length + 1} claps, have ${this.history.length}`);
      if (this.isMatch(pattern)) {
        console.log(`MATCHED: ${pattern.name}`);
        this.lastEmitAt = now;
        return pattern;
      }
    }

    // No multi-clap pattern matched, return SINGLE immediately
    console.log(`No multi-clap match, returning SINGLE`);
    this.lastEmitAt = now;
    return { name: 'SINGLE', intervals: [], tolerance: 0, minConfidence: 0 };
  }

  // No longer needed - we return SINGLE immediately
  checkPendingSingle(): ClapPattern | null {
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
    
    // Debug timing info
    const timings = [];
    for (let i = 0; i < pattern.intervals.length; i++) {
      const dt = segment[i + 1].timestamp - segment[i].timestamp;
      const expected = pattern.intervals[i];
      const diff = Math.abs(dt - expected);
      timings.push(`${dt.toFixed(0)}ms(±${diff.toFixed(0)})`);
      if (diff > pattern.tolerance) {
        console.log(`${pattern.name} timing FAIL: ${timings.join(', ')} vs expected ${pattern.intervals.join(',')}±${pattern.tolerance}`);
        return false;
      }
    }
    console.log(`${pattern.name} timing OK: ${timings.join(', ')}`);
    return true;
  }
}


