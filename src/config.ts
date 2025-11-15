// TODO: Fill in your Prometheus server URL
export const config = {
  prometheus: {
    url: "http://localhost:9090",
    refreshInterval: 5000,
  },
  
  metrics: {
    // Counter - Total HTTP requests
    requestsTotal: {
      name: "HTTP Requests Total",
      query: 'sum(prometheus_http_requests_total)',
      type: "counter" as const,
    },
    
    // Gauge - Active Connections
    connectionsActive: {
      name: "Active Connections",
      query: "nginx_connections_active",
      type: "gauge" as const,
    },
    
    // Gauge - Current time series count
    timeSeriesCount: {
      name: "Time Series Count",
      query: "prometheus_tsdb_head_series",
      type: "gauge" as const,
    },
    
    // Histogram - Multiple quantiles for HTTP request duration
    httpRequestDurationP95: {
      name: "HTTP Request Duration",
      query: 'histogram_quantile(0.95, sum(rate(nginx_http_request_duration_seconds_bucket[5m])) by (le))',
      type: "histogram" as const,
      quantiles: [0.5, 0.95, 0.99], // p50, p95, p99
    },
    
    // Summary - Multiple quantiles for GC duration
    gcDurationP95: {
      name: "GC Duration",
      query: 'quantile(0.95, go_gc_duration_seconds)',
      type: "summary" as const,
      quantiles: [0.5, 0.95, 0.99],
    },
  },
};