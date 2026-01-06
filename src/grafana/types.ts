/**
 * Grafana Dashboard JSON Types
 * Minimal subset required for terminal rendering
 */

// Supported panel types
export type SupportedPanelType = "timeseries" | "stat" | "table";

// Grid position for panel layout
export interface GridPos {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Query target (PromQL expression)
export interface GrafanaTarget {
  expr: string;
  refId: string;
  legendFormat?: string;
  datasource?: {
    type?: string;
    uid?: string;
  };
}

// Panel definition
export interface GrafanaPanel {
  id: number;
  title: string;
  type: string;
  targets?: GrafanaTarget[];
  gridPos: GridPos;
  // Fields we acknowledge but don't process
  fieldConfig?: unknown;
  options?: unknown;
  transformations?: unknown[];
}

// Dashboard definition
export interface GrafanaDashboard {
  id?: number | null;
  uid?: string;
  title: string;
  panels: GrafanaPanel[];
  // Fields we acknowledge but don't process
  annotations?: unknown;
  templating?: unknown;
  time?: {
    from: string;
    to: string;
  };
  refresh?: string;
}

// Normalized panel for rendering (only supported types)
export interface NormalizedPanel {
  id: number;
  title: string;
  type: SupportedPanelType;
  queries: NormalizedQuery[];
  gridPos: GridPos;
  thresholds?: ThresholdConfig;
}

// Normalized query
export interface NormalizedQuery {
  expr: string;
  refId: string;
  legendFormat?: string;
}

// Threshold step (from Grafana fieldConfig.defaults.thresholds)
export interface ThresholdStep {
  color: string;
  value: number | null; // null means "base" (minimum)
}

// Threshold configuration
export interface ThresholdConfig {
  mode: "absolute" | "percentage";
  steps: ThresholdStep[];
}

// Template variable types
export type VariableType = "query" | "custom" | "constant" | "textbox" | "interval";

// Template variable definition
export interface TemplateVariable {
  name: string;
  label?: string;
  type: VariableType;
  // For query variables
  query?: string;
  // For custom variables
  options?: string[];
  // Current selected value
  current?: string;
  // Multi-select support
  multi?: boolean;
  // Include "All" option
  includeAll?: boolean;
}

// Parse result with warnings for unsupported features
export interface ParseResult {
  dashboard: {
    title: string;
    panels: NormalizedPanel[];
    variables: TemplateVariable[];
  };
  warnings: string[];
}
