import type { ViewuiConfig } from "./schema.ts";

export const defaultConfig: ViewuiConfig = {
  prometheus: {
    url: "http://localhost:9090",
    timeout: 10000,
  },
  
  dashboard: {
    path: "./dashboards/example.json",
    directory: "./dashboards",
  },
  
  refreshInterval: 5000,
  timeRange: "5m",
};
