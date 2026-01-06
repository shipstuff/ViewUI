import { parse } from "yaml";
import { defaultConfig } from "./defaults.ts";
import type { ViewuiConfig, PartialConfig } from "./schema.ts";

const CONFIG_FILE = "./config.yaml";

/**
 * Deep merge two objects
 */
function deepMerge<T extends object>(base: T, override: Partial<T>): T {
  const result = { ...base };

  for (const key of Object.keys(override) as (keyof T)[]) {
    const overrideValue = override[key];
    const baseValue = base[key];

    if (
      overrideValue !== undefined &&
      typeof overrideValue === "object" &&
      overrideValue !== null &&
      !Array.isArray(overrideValue) &&
      typeof baseValue === "object" &&
      baseValue !== null &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(
        baseValue as object,
        overrideValue as object
      ) as T[keyof T];
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue as T[keyof T];
    }
  }

  return result;
}

/**
 * Load configuration from ./config.yaml
 * Falls back to defaults if file doesn't exist
 */
export async function loadConfig(): Promise<ViewuiConfig> {
  try {
    const file = Bun.file(CONFIG_FILE);
    const exists = await file.exists();

    if (!exists) {
      console.log("No config.yaml found, using defaults");
      return defaultConfig;
    }

    const content = await file.text();
    const parsed = parse(content) as PartialConfig;

    if (!parsed || typeof parsed !== "object") {
      return defaultConfig;
    }

    return deepMerge(defaultConfig, parsed as Partial<ViewuiConfig>);
  } catch (error) {
    console.error("Error loading config:", error);
    return defaultConfig;
  }
}

/**
 * Create example config file if it doesn't exist
 */
export async function ensureConfigFile(): Promise<void> {
  try {
    const file = Bun.file(CONFIG_FILE);
    const exists = await file.exists();

    if (!exists) {
      const exampleConfig = `# viewui configuration

# Prometheus server connection
prometheus:
  url: http://localhost:9090
  # username: optional
  # password: optional
  timeout: 10000

# Dashboard to load
dashboard:
  path: ./dashboards/example.json

# Refresh interval in milliseconds
refreshInterval: 5000

# Default time range for queries
timeRange: 5m
`;
      await Bun.write(CONFIG_FILE, exampleConfig);
      console.log("Created config.yaml with defaults");
    }
  } catch (error) {
    // Ignore errors - we can run with defaults
  }
}

export { CONFIG_FILE };
