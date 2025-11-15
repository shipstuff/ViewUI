import { useEffect, useState, useCallback } from "react";
import type { MetricValue, MetricConfig } from "../types";
import { fetchMetric } from "../services/prometheus";
import { config } from "../config";

export function usePrometheusMetrics() {
  const [metrics, setMetrics] = useState<MetricValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    const metricConfigs: MetricConfig[] = [
      config.metrics.requestsTotal,
      config.metrics.connectionsActive,
      config.metrics.timeSeriesCount,
      config.metrics.httpRequestDurationP95,
      config.metrics.gcDurationP95,
    ];

    const promises = metricConfigs.map(async (metricConfig) => {
      const { value, quantiles, error } = await fetchMetric(config.prometheus.url, metricConfig);
      return {
        config: metricConfig,
        value,
        quantiles,
        error,
        lastUpdated: Date.now(),
      } as MetricValue;
    });

    const results = await Promise.all(promises);
    setMetrics(results);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, config.prometheus.refreshInterval);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  return { metrics, isLoading, refresh: loadMetrics };
}

