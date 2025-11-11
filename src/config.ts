// TODO: Fill in your Prometheus server URL
export const config = {
  prometheus: {
    url: "http://localhost:9090", // UPDATE THIS
    refreshInterval: 5000, // 5 seconds
  },
  
  metrics: {
    requestsTotal: {
      name: "Total Requests",
      query: 'sum(rate(nginx_http_requests_total[5m]))',
      type: "counter" as const,
    },
    
    connectionsActive: {
      name: "Active Connections",
      query: "nginx_connections_active",
      type: "gauge" as const,
    },
  },
};