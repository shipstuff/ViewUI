export type MetricType = "gauge" | "counter" | "histogram" | "summary";

export interface MetricConfig {
  name: string;
  query: string;
  type: MetricType;
  // For histograms/summaries, specify which quantiles to fetch
  quantiles?: number[]; // e.g., [0.5, 0.95, 0.99]
}

export interface MetricValue {
  config: MetricConfig;
  value: number | null;
  // For histograms/summaries, store multiple quantile values
  quantiles?: Array<{ quantile: number; value: number }>;
  error: string | null;
  lastUpdated: number;
}

export interface PrometheusQueryResponse {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      value: [number, string]; // [timestamp, value]
    }>;
  };
}
