import type { TimeRange } from "./types.ts";

/**
 * Parse a duration string into seconds
 * Supports: 30s, 5m, 1h, 24h, 7d
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}

/**
 * Calculate step size based on time range
 * Aims for ~60-120 data points
 */
export function calculateStep(rangeSeconds: number): number {
  const targetPoints = 60;
  const step = Math.ceil(rangeSeconds / targetPoints);
  
  // Round to nice values
  if (step <= 15) return 15;
  if (step <= 30) return 30;
  if (step <= 60) return 60;
  if (step <= 300) return 300;  // 5m
  if (step <= 900) return 900;  // 15m
  if (step <= 3600) return 3600; // 1h
  return Math.ceil(step / 3600) * 3600;
}

/**
 * Create a time range from "now - duration" to "now"
 */
export function createTimeRange(duration: string): TimeRange {
  const now = Math.floor(Date.now() / 1000);
  const rangeSeconds = parseDuration(duration);
  const start = now - rangeSeconds;
  const step = calculateStep(rangeSeconds);

  return {
    start,
    end: now,
    step,
  };
}

/**
 * Format a time range for display
 */
export function formatTimeRange(duration: string): string {
  const seconds = parseDuration(duration);
  
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
