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
): Promise<{ 
  value: number | null; 
  quantiles?: Array<{ quantile: number; value: number }>;
  error: string | null 
}> {
  try {
    // If this is a histogram or summary with quantiles, fetch all quantiles
    if ((config.type === "histogram" || config.type === "summary") && config.quantiles) {
      const quantilePromises = config.quantiles.map(async (q) => {
        try {
          // Build query for this quantile - more precise regex replacement
          let quantileQuery: string;
          if (config.type === "histogram") {
            // Replace the quantile number (e.g., 0.95) with the new quantile
            // Match: histogram_quantile(0.95, ...) or histogram_quantile( 0.95 , ...)
            quantileQuery = config.query.replace(
              /histogram_quantile\(\s*[\d.]+\s*,/,
              `histogram_quantile(${q},`
            );
          } else {
            // Replace the quantile number for summary
            quantileQuery = config.query.replace(
              /quantile\(\s*[\d.]+\s*,/,
              `quantile(${q},`
            );
          }
          
          console.log(`Fetching quantile ${q} with query: ${quantileQuery}`);
          const value = await queryPrometheus(url, quantileQuery);
          return { quantile: q, value: value ?? null };
        } catch (error) {
          console.error(`Error fetching quantile ${q}:`, error);
          return { quantile: q, value: null };
        }
      });
      
      const quantiles = await Promise.all(quantilePromises);
      const validQuantiles = quantiles.filter(q => q.value !== null);
      
      return { 
        value: validQuantiles.length > 0 ? validQuantiles[validQuantiles.length - 1]?.value ?? null : null,
        quantiles: validQuantiles,
        error: validQuantiles.length === 0 ? "No quantile data available" : null
      };
    }
    
    // For regular metrics, just fetch the single value
    const value = await queryPrometheus(url, config.query);
    return { value, error: null };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}