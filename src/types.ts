export type MetricType = "gauge" | "counter";

export interface MetricConfig {
  name: string;
  query: string;
  type: MetricType;
}

export interface MetricValue {
  config: MetricConfig;
  value: number | null;
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
