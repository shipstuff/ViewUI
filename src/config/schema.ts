/**
 * viewui Configuration Schema
 * For Grafana dashboard rendering with Prometheus backend
 */

export interface PrometheusConfig {
  // Prometheus server URL
  url: string;
  // Optional basic auth
  username?: string;
  password?: string;
  // Request timeout in milliseconds
  timeout?: number;
}

export interface DashboardConfig {
  // Path to Grafana dashboard JSON file
  path: string;
  // Directory to scan for dashboard files (for picker)
  directory?: string;
}

export interface ViewuiConfig {
  // Prometheus connection settings
  prometheus: PrometheusConfig;
  
  // Dashboard to load
  dashboard: DashboardConfig;
  
  // Refresh interval in milliseconds
  refreshInterval: number;
  
  // Default time range (e.g., "5m", "1h", "24h")
  timeRange: string;
}

export type PartialConfig = {
  prometheus?: Partial<PrometheusConfig>;
  dashboard?: Partial<DashboardConfig>;
  refreshInterval?: number;
  timeRange?: string;
};
