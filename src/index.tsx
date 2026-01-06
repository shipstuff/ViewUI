import React from "react";
import { createRoot } from "@opentui/react";
import { createCliRenderer } from "@opentui/core";
import { App } from "./ui/App.tsx";
import { loadConfig, ensureConfigFile } from "./config/loader.ts";
import { createDashboardStore } from "./store/dashboard-store.ts";
import { createPrometheusClient } from "./prometheus/client.ts";

async function main(): Promise<void> {
  console.log("[viewui] Starting...");

  // Ensure config file exists
  await ensureConfigFile();

  // Load configuration
  const config = await loadConfig();
  console.log(`[viewui] Prometheus: ${config.prometheus.url}`);
  console.log(`[viewui] Dashboard: ${config.dashboard.path}`);

  // Create Prometheus client
  const client = createPrometheusClient(config.prometheus);

  // Check Prometheus connectivity
  const healthy = await client.healthCheck();
  if (!healthy) {
    console.warn(`[viewui] Warning: Cannot connect to Prometheus at ${config.prometheus.url}`);
  }

  // Create dashboard store
  const store = createDashboardStore(config, client);

  // Create CLI renderer
  const renderer = await createCliRenderer();

  // Create root and render
  const root = createRoot(renderer);

  const handleExit = () => {
    store.stop();
    root.unmount();
    process.exit(0);
  };

  root.render(<App store={store} config={config} onExit={handleExit} />);
}

main().catch((error) => {
  console.error("[viewui] Failed to start:", error);
  process.exit(1);
});
