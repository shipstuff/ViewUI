/**
 * Prometheus HTTP API Response Types
 */

// Prometheus metric labels
export type Labels = Record<string, string>;

// Single sample (timestamp, value)
export interface Sample {
  timestamp: number;
  value: number;
}

// Instant vector result
export interface InstantVector {
  metric: Labels;
  value: [number, string]; // [unix_timestamp, value_string]
}

// Range vector result  
export interface RangeVector {
  metric: Labels;
  values: Array<[number, string]>; // [[unix_timestamp, value_string], ...]
}

// Prometheus API response wrapper
export interface PrometheusResponse<T> {
  status: "success" | "error";
  data?: {
    resultType: "vector" | "matrix" | "scalar" | "string";
    result: T[];
  };
  error?: string;
  errorType?: string;
  warnings?: string[];
}

// Instant query response
export type InstantQueryResponse = PrometheusResponse<InstantVector>;

// Range query response
export type RangeQueryResponse = PrometheusResponse<RangeVector>;

// Parsed time series data for UI
export interface TimeSeries {
  labels: Labels;
  legendFormat?: string;
  samples: Sample[];
}

// Query result with metadata
export interface QueryResult {
  refId: string;
  series: TimeSeries[];
  error?: string;
}

// Time range specification
export interface TimeRange {
  start: number; // Unix timestamp in seconds
  end: number;   // Unix timestamp in seconds
  step: number;  // Step in seconds
}
