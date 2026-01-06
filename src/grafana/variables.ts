import type { TemplateVariable } from "./types.ts";

/**
 * Variable values map (name -> value)
 */
export type VariableValues = Map<string, string>;

/**
 * Substitute variables in a PromQL expression
 * Replaces $varname and ${varname} patterns
 */
export function substituteVariables(expr: string, values: VariableValues): string {
  let result = expr;

  for (const [name, value] of values) {
    // Replace ${varname} pattern
    result = result.replace(new RegExp(`\\$\\{${name}\\}`, "g"), value);
    // Replace $varname pattern (word boundary)
    result = result.replace(new RegExp(`\\$${name}\\b`, "g"), value);
  }

  return result;
}

/**
 * Parse a Grafana label_values query
 * Formats: 
 *   label_values(label)
 *   label_values(metric, label)
 *   label_values(metric{filter}, label)
 */
export function parseLabelValuesQuery(query: string): {
  metric?: string;
  label: string;
} | null {
  // Match label_values(label) or label_values(metric, label) or label_values(metric{...}, label)
  const match = query.match(/label_values\s*\(\s*(?:([^,)]+)\s*,\s*)?([^)]+)\s*\)/);
  
  if (!match) {
    return null;
  }

  const [, metric, label] = match;
  
  return {
    metric: metric?.trim(),
    label: label?.trim() || "",
  };
}

/**
 * Parse a query_result variable query
 * Format: query_result(promql_expression)
 */
export function parseQueryResultQuery(query: string): string | null {
  const match = query.match(/query_result\s*\(\s*(.+)\s*\)/);
  return match ? match[1]!.trim() : null;
}

/**
 * Get initial values for variables from defaults
 */
export function getDefaultVariableValues(variables: TemplateVariable[]): VariableValues {
  const values = new Map<string, string>();
  
  for (const v of variables) {
    if (v.current) {
      values.set(v.name, v.current);
    } else if (v.options && v.options.length > 0) {
      values.set(v.name, v.options[0]!);
    } else if (v.type === "constant" && v.query) {
      values.set(v.name, v.query);
    } else {
      values.set(v.name, "");
    }
  }
  
  return values;
}
