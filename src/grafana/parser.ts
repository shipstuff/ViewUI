import type {
  GrafanaDashboard,
  GrafanaPanel,
  NormalizedPanel,
  NormalizedQuery,
  ParseResult,
  SupportedPanelType,
  ThresholdConfig,
  ThresholdStep,
  TemplateVariable,
  VariableType,
} from "./types.ts";

// Panel types we support
const SUPPORTED_PANEL_TYPES: Set<string> = new Set(["timeseries", "stat", "table"]);

/**
 * Check if a panel type is supported
 */
function isSupportedType(type: string): type is SupportedPanelType {
  return SUPPORTED_PANEL_TYPES.has(type);
}

/**
 * Extract thresholds from a panel's fieldConfig
 */
function extractThresholds(panel: GrafanaPanel): ThresholdConfig | undefined {
  if (!panel.fieldConfig || typeof panel.fieldConfig !== "object") {
    return undefined;
  }

  const fieldConfig = panel.fieldConfig as {
    defaults?: {
      thresholds?: {
        mode?: string;
        steps?: Array<{ color: string; value: number | null }>;
      };
    };
  };

  const thresholds = fieldConfig.defaults?.thresholds;
  if (!thresholds || !thresholds.steps || !Array.isArray(thresholds.steps)) {
    return undefined;
  }

  const steps: ThresholdStep[] = thresholds.steps.map((step) => ({
    color: step.color || "green",
    value: step.value,
  }));

  return {
    mode: (thresholds.mode as "absolute" | "percentage") || "absolute",
    steps,
  };
}

/**
 * Extract PromQL queries from a panel
 */
function extractQueries(panel: GrafanaPanel): NormalizedQuery[] {
  if (!panel.targets || panel.targets.length === 0) {
    return [];
  }

  return panel.targets
    .filter((target) => target.expr && target.expr.trim() !== "")
    .map((target) => ({
      expr: target.expr,
      refId: target.refId || "A",
      legendFormat: target.legendFormat,
    }));
}

/**
 * Normalize a supported panel
 */
function normalizePanel(panel: GrafanaPanel): NormalizedPanel | null {
  if (!isSupportedType(panel.type)) {
    return null;
  }

  const queries = extractQueries(panel);
  if (queries.length === 0) {
    return null;
  }

  const thresholds = extractThresholds(panel);

  return {
    id: panel.id,
    title: panel.title || `Panel ${panel.id}`,
    type: panel.type,
    queries,
    gridPos: panel.gridPos || { x: 0, y: 0, w: 12, h: 8 },
    thresholds,
  };
}

/**
 * Supported variable types
 */
const SUPPORTED_VARIABLE_TYPES: Set<string> = new Set(["query", "custom", "constant"]);

/**
 * Extract template variables from dashboard
 */
function extractVariables(dashboard: GrafanaDashboard, warnings: string[]): TemplateVariable[] {
  if (!dashboard.templating || typeof dashboard.templating !== "object") {
    return [];
  }

  const templating = dashboard.templating as {
    list?: Array<{
      name: string;
      label?: string;
      type: string;
      query?: string | { query: string };
      options?: Array<{ value: string; text: string }>;
      current?: { value: string | string[]; text: string };
      multi?: boolean;
      includeAll?: boolean;
    }>;
  };

  if (!templating.list || !Array.isArray(templating.list)) {
    return [];
  }

  const variables: TemplateVariable[] = [];

  for (const v of templating.list) {
    if (!SUPPORTED_VARIABLE_TYPES.has(v.type)) {
      warnings.push(`Variable "${v.name}": type "${v.type}" not supported, skipping`);
      continue;
    }

    // Extract query string (can be string or object with query property)
    let queryStr: string | undefined;
    if (v.query) {
      queryStr = typeof v.query === "string" ? v.query : v.query.query;
    }

    // Extract options for custom variables
    const options = v.options?.map((o) => o.value) ?? [];

    // Get current value
    let current: string | undefined;
    if (v.current?.value) {
      current = Array.isArray(v.current.value) 
        ? v.current.value[0] 
        : v.current.value;
    }

    variables.push({
      name: v.name,
      label: v.label,
      type: v.type as VariableType,
      query: queryStr,
      options: options.length > 0 ? options : undefined,
      current,
      multi: v.multi,
      includeAll: v.includeAll,
    });
  }

  return variables;
}

/**
 * Parse a Grafana dashboard JSON and extract supported panels
 */
export function parseDashboard(json: unknown): ParseResult {
  const warnings: string[] = [];

  // Validate basic structure
  if (!json || typeof json !== "object") {
    throw new Error("Invalid dashboard JSON: not an object");
  }

  const dashboard = json as GrafanaDashboard;

  if (!dashboard.panels || !Array.isArray(dashboard.panels)) {
    throw new Error("Invalid dashboard JSON: missing panels array");
  }

  // Extract variables first
  const variables = extractVariables(dashboard, warnings);

  const normalizedPanels: NormalizedPanel[] = [];

  for (const panel of dashboard.panels) {
    // Check for unsupported features
    if (panel.transformations && panel.transformations.length > 0) {
      warnings.push(`Panel "${panel.title}" (${panel.id}): transformations not supported, skipping`);
    }

    // Check panel type
    if (!isSupportedType(panel.type)) {
      warnings.push(`Panel "${panel.title}" (${panel.id}): type "${panel.type}" not supported, skipping`);
      continue;
    }

    // Check for Prometheus datasource (warn on others)
    if (panel.targets) {
      for (const target of panel.targets) {
        if (target.datasource?.type && target.datasource.type !== "prometheus") {
          warnings.push(
            `Panel "${panel.title}" (${panel.id}): datasource "${target.datasource.type}" not supported, skipping query`
          );
        }
      }
    }

    const normalized = normalizePanel(panel);
    if (normalized) {
      normalizedPanels.push(normalized);
    } else {
      warnings.push(`Panel "${panel.title}" (${panel.id}): no valid queries found, skipping`);
    }
  }

  // Check for annotations
  if (dashboard.annotations && typeof dashboard.annotations === "object") {
    const annotations = dashboard.annotations as { list?: unknown[] };
    if (annotations.list && annotations.list.length > 0) {
      warnings.push("Dashboard uses annotations which is not supported");
    }
  }

  // Sort panels by grid position (top to bottom, left to right)
  normalizedPanels.sort((a, b) => {
    if (a.gridPos.y !== b.gridPos.y) {
      return a.gridPos.y - b.gridPos.y;
    }
    return a.gridPos.x - b.gridPos.x;
  });

  return {
    dashboard: {
      title: dashboard.title || "Untitled Dashboard",
      panels: normalizedPanels,
      variables,
    },
    warnings,
  };
}

/**
 * Load and parse a dashboard from a file path
 */
export async function loadDashboard(path: string): Promise<ParseResult> {
  const file = Bun.file(path);
  const exists = await file.exists();

  if (!exists) {
    throw new Error(`Dashboard file not found: ${path}`);
  }

  const content = await file.text();
  
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in dashboard file: ${path}`);
  }

  return parseDashboard(json);
}
