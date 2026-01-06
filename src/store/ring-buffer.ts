// Sample type for time series data
export interface MetricSample {
  timestamp: number;
  value: number;
}

/**
 * Fixed-size circular buffer for time series data.
 * Once full, oldest samples are overwritten.
 */
export class RingBuffer {
  private samples: MetricSample[];
  private head: number = 0;
  private count: number = 0;
  readonly capacity: number;

  constructor(capacity: number = 300) {
    this.capacity = capacity;
    this.samples = new Array(capacity);
  }

  /**
   * Add a new sample to the buffer
   */
  push(value: number, timestamp: number = Date.now()): void {
    this.samples[this.head] = { timestamp, value };
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  /**
   * Get all samples in chronological order (oldest first)
   */
  getAll(): MetricSample[] {
    if (this.count === 0) return [];

    const result: MetricSample[] = new Array(this.count);
    const start = this.count < this.capacity ? 0 : this.head;

    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % this.capacity;
      result[i] = this.samples[idx]!;
    }

    return result;
  }

  /**
   * Get the N most recent samples (newest last)
   */
  getRecent(n: number): MetricSample[] {
    const all = this.getAll();
    if (n >= all.length) return all;
    return all.slice(-n);
  }

  /**
   * Get just the values as an array (for charting)
   */
  getValues(n?: number): number[] {
    const samples = n ? this.getRecent(n) : this.getAll();
    return samples.map((s) => s.value);
  }

  /**
   * Get the most recent value
   */
  latest(): MetricSample | undefined {
    if (this.count === 0) return undefined;
    const idx = (this.head - 1 + this.capacity) % this.capacity;
    return this.samples[idx];
  }

  /**
   * Get current number of samples
   */
  size(): number {
    return this.count;
  }

  /**
   * Clear all samples
   */
  clear(): void {
    this.head = 0;
    this.count = 0;
  }
}
