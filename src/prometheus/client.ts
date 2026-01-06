import type { PrometheusConfig } from "../config/schema.ts";
import type {
  InstantQueryResponse,
  RangeQueryResponse,
  TimeSeries,
  Sample,
  TimeRange,
  QueryResult,
} from "./types.ts";
import { createTimeRange } from "./time-range.ts";

/**
 * Prometheus HTTP API Client
 */
export class PrometheusClient {
  private baseUrl: string;
  private timeout: number;
  private headers: Headers;

  constructor(config: PrometheusConfig) {
    this.baseUrl = config.url.replace(/\/$/, ""); // Remove trailing slash
    this.timeout = config.timeout ?? 10000;
    
    this.headers = new Headers({
      "Accept": "application/json",
    });

    // Add basic auth if provided
    if (config.username && config.password) {
      const auth = btoa(`${config.username}:${config.password}`);
      this.headers.set("Authorization", `Basic ${auth}`);
    }
  }

  /**
   * Execute an instant query
   */
  async instantQuery(expr: string, time?: number): Promise<InstantQueryResponse> {
    const params = new URLSearchParams({ query: expr });
    if (time !== undefined) {
      params.set("time", time.toString());
    }

    const url = `${this.baseUrl}/api/v1/query?${params}`;
    return this.fetch<InstantQueryResponse>(url);
  }

  /**
   * Execute a range query
   */
  async rangeQuery(
    expr: string,
    range: TimeRange
  ): Promise<RangeQueryResponse> {
    const params = new URLSearchParams({
      query: expr,
      start: range.start.toString(),
      end: range.end.toString(),
      step: `${range.step}s`,
    });

    const url = `${this.baseUrl}/api/v1/query_range?${params}`;
    return this.fetch<RangeQueryResponse>(url);
  }

  /**
   * Execute a query and return parsed time series
   */
  async queryTimeSeries(
    expr: string,
    duration: string,
    legendFormat?: string
  ): Promise<TimeSeries[]> {
    const range = createTimeRange(duration);
    const response = await this.rangeQuery(expr, range);

    if (response.status !== "success" || !response.data) {
      throw new Error(response.error ?? "Query failed");
    }

    return response.data.result.map((result) => {
      const samples: Sample[] = result.values.map(([timestamp, value]) => ({
        timestamp,
        value: parseFloat(value),
      }));

      return {
        labels: result.metric,
        legendFormat,
        samples,
      };
    });
  }

  /**
   * Execute a query and return the current value
   */
  async queryInstant(expr: string): Promise<number | null> {
    const response = await this.instantQuery(expr);

    if (response.status !== "success" || !response.data) {
      throw new Error(response.error ?? "Query failed");
    }

    if (response.data.result.length === 0) {
      return null;
    }

    const [, valueStr] = response.data.result[0]!.value;
    return parseFloat(valueStr);
  }

  /**
   * Execute multiple queries for a panel
   */
  async executeQueries(
    queries: Array<{ expr: string; refId: string; legendFormat?: string }>,
    duration: string
  ): Promise<QueryResult[]> {
    const results: QueryResult[] = [];

    for (const query of queries) {
      try {
        const series = await this.queryTimeSeries(
          query.expr,
          duration,
          query.legendFormat
        );
        results.push({
          refId: query.refId,
          series,
        });
      } catch (error) {
        results.push({
          refId: query.refId,
          series: [],
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Get label values for a label name
   * Optionally filter by metric name using match[] parameter
   */
  async getLabelValues(label: string, metric?: string): Promise<string[]> {
    let url = `${this.baseUrl}/api/v1/label/${encodeURIComponent(label)}/values`;
    
    if (metric) {
      // Add match[] parameter to filter by metric
      const params = new URLSearchParams();
      params.set("match[]", metric);
      url = `${url}?${params}`;
    }

    const response = await this.fetch<{
      status: string;
      data: string[];
      error?: string;
    }>(url);

    if (response.status !== "success") {
      throw new Error(response.error ?? "Failed to get label values");
    }

    return response.data;
  }

  /**
   * Get all series matching a selector
   */
  async getSeries(selector: string): Promise<Record<string, string>[]> {
    const params = new URLSearchParams();
    params.set("match[]", selector);
    
    const url = `${this.baseUrl}/api/v1/series?${params}`;
    
    const response = await this.fetch<{
      status: string;
      data: Record<string, string>[];
      error?: string;
    }>(url);

    if (response.status !== "success") {
      throw new Error(response.error ?? "Failed to get series");
    }

    return response.data;
  }

  /**
   * Check if Prometheus is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/v1/status/buildinfo`;
      const response = await fetch(url, {
        headers: this.headers,
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Internal fetch with timeout and error handling
   */
  private async fetch<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}

// Singleton instance
let clientInstance: PrometheusClient | null = null;

export function createPrometheusClient(config: PrometheusConfig): PrometheusClient {
  clientInstance = new PrometheusClient(config);
  return clientInstance;
}

export function getPrometheusClient(): PrometheusClient | null {
  return clientInstance;
}
