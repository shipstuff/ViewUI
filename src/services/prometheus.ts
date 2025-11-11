import type { PrometheusQueryResponse, MetricConfig } from "../types";

export async function queryPrometheus(
  url: string,
  query: string
): Promise<number | null> {
  try {
    const response = await fetch(`${url}/api/v1/query?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: PrometheusQueryResponse = await response.json();
    
    if (data.status !== "success") {
      throw new Error("Prometheus query failed");
    }
    
    if (data.data.result.length === 0) {
      return null; // No data available
    }
    
    // Extract the value from the first result
    const value = parseFloat(data.data.result[0].value[1]);
    return isNaN(value) ? null : value;
  } catch (error) {
    console.error("Prometheus query error:", error);
    throw error;
  }
}

export async function fetchMetric(
  url: string,
  config: MetricConfig
): Promise<{ value: number | null; error: string | null }> {
  try {
    const value = await queryPrometheus(url, config.query);
    return { value, error: null };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}