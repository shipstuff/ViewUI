import { RingBuffer } from "./ring-buffer.ts";
import { PrometheusClient } from "../prometheus/client.ts";
import { loadDashboard, type NormalizedPanel, type ParseResult } from "../grafana/index.ts";
import type { TemplateVariable } from "../grafana/types.ts";
import { substituteVariables, getDefaultVariableValues, parseLabelValuesQuery, type VariableValues } from "../grafana/variables.ts";
import type { ViewuiConfig } from "../config/schema.ts";
import type { TimeSeries, QueryResult } from "../prometheus/types.ts";

// Panel data with query results
export interface PanelData {
  panel: NormalizedPanel;
  results: QueryResult[];
  lastUpdated: number;
  error?: string;
}

// Dashboard state
export interface DashboardState {
  title: string;
  panels: PanelData[];
  warnings: string[];
  loading: boolean;
  error?: string;
  lastRefresh: number;
  dashboardPath: string;
  // Template variables
  variables: TemplateVariable[];
  variableValues: VariableValues;
  variableOptions: Map<string, string[]>;
}

/**
 * Dashboard store - manages Grafana dashboard state and Prometheus queries
 */
export class DashboardStore {
  private config: ViewuiConfig;
  private client: PrometheusClient;
  private state: DashboardState;
  private listeners: Set<(state: DashboardState) => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private historyBuffers: Map<string, RingBuffer> = new Map();

  constructor(config: ViewuiConfig, client: PrometheusClient) {
    this.config = config;
    this.client = client;
    
    this.state = {
      title: "Loading...",
      panels: [],
      warnings: [],
      loading: true,
      lastRefresh: 0,
      dashboardPath: config.dashboard.path,
      variables: [],
      variableValues: new Map(),
      variableOptions: new Map(),
    };
  }

  /**
   * Get current state
   */
  getState(): DashboardState {
    return this.state;
  }

  /**
   * Get history buffer for a metric
   */
  getHistory(key: string): RingBuffer {
    let buffer = this.historyBuffers.get(key);
    if (!buffer) {
      buffer = new RingBuffer(60); // Keep 60 samples for trend calculation
      this.historyBuffers.set(key, buffer);
    }
    return buffer;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: DashboardState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  /**
   * Update state and notify
   */
  private setState(partial: Partial<DashboardState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /**
   * Load dashboard from file
   */
  async loadDashboard(): Promise<void> {
    this.setState({ loading: true, error: undefined });

    try {
      const result = await loadDashboard(this.config.dashboard.path);
      
      // Log warnings
      for (const warning of result.warnings) {
        console.warn(`[viewui] ${warning}`);
      }

      // Initialize panel data
      const panels: PanelData[] = result.dashboard.panels.map((panel) => ({
        panel,
        results: [],
        lastUpdated: 0,
      }));

      // Initialize variables
      const variables = result.dashboard.variables;
      const variableValues = getDefaultVariableValues(variables);
      
      this.setState({
        title: result.dashboard.title,
        panels,
        warnings: result.warnings,
        loading: false,
        dashboardPath: this.config.dashboard.path,
        variables,
        variableValues,
        variableOptions: new Map(),
      });

      // Load variable options from Prometheus
      await this.loadVariableOptions();

      // Execute initial queries
      await this.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load dashboard";
      console.error(`[viewui] ${message}`);
      this.setState({
        loading: false,
        error: message,
      });
    }
  }

  /**
   * Load variable options from Prometheus
   */
  async loadVariableOptions(): Promise<void> {
    const options = new Map<string, string[]>();

    for (const variable of this.state.variables) {
      if (variable.type === "query" && variable.query) {
        try {
          // Parse label_values() queries
          const parsed = parseLabelValuesQuery(variable.query);
          if (parsed) {
            const values = await this.client.getLabelValues(parsed.label, parsed.metric);
            options.set(variable.name, values);
            
            // Set first value as default if not set
            if (!this.state.variableValues.has(variable.name) && values.length > 0) {
              this.state.variableValues.set(variable.name, values[0]!);
            }
          }
        } catch (error) {
          console.warn(`[viewui] Failed to load options for variable ${variable.name}:`, error);
        }
      } else if (variable.type === "custom" && variable.options) {
        options.set(variable.name, variable.options);
      }
    }

    this.setState({ variableOptions: options });
  }

  /**
   * Set a variable value and refresh queries
   */
  async setVariableValue(name: string, value: string): Promise<void> {
    const newValues = new Map(this.state.variableValues);
    newValues.set(name, value);
    this.setState({ variableValues: newValues });
    
    // Refresh with new variable values
    await this.refresh();
  }

  /**
   * Switch to a different dashboard
   */
  async switchDashboard(path: string): Promise<void> {
    // Clear history buffers
    this.historyBuffers.clear();
    
    // Update config
    this.config.dashboard.path = path;
    this.setState({ dashboardPath: path });
    
    // Load new dashboard
    await this.loadDashboard();
  }

  /**
   * Refresh all panel queries
   */
  async refresh(): Promise<void> {
    const now = Date.now();
    const panels = [...this.state.panels];

    for (let i = 0; i < panels.length; i++) {
      const panelData = panels[i]!;
      
      try {
        // Substitute variables in queries
        const substitutedQueries = panelData.panel.queries.map((q) => ({
          ...q,
          expr: substituteVariables(q.expr, this.state.variableValues),
        }));

        const results = await this.client.executeQueries(
          substitutedQueries,
          this.config.timeRange
        );

        // Store latest values in history buffers for trend calculation
        for (const result of results) {
          for (const series of result.series) {
            if (series.samples.length > 0) {
              const lastSample = series.samples[series.samples.length - 1]!;
              const key = `${panelData.panel.id}-${result.refId}`;
              this.getHistory(key).push(lastSample.value, lastSample.timestamp * 1000);
            }
          }
        }

        panels[i] = {
          ...panelData,
          results,
          lastUpdated: now,
          error: undefined,
        };
      } catch (error) {
        panels[i] = {
          ...panelData,
          lastUpdated: now,
          error: error instanceof Error ? error.message : "Query failed",
        };
      }
    }

    this.setState({
      panels,
      lastRefresh: now,
    });
  }

  /**
   * Start auto-refresh
   */
  start(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.refresh();
    }, this.config.refreshInterval);
  }

  /**
   * Stop auto-refresh
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Singleton instance
let storeInstance: DashboardStore | null = null;

export function createDashboardStore(
  config: ViewuiConfig,
  client: PrometheusClient
): DashboardStore {
  storeInstance = new DashboardStore(config, client);
  return storeInstance;
}

export function getDashboardStore(): DashboardStore | null {
  return storeInstance;
}
