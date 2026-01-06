import React from "react";
import { TextAttributes } from "@opentui/core";
import { Panel } from "../Panel.tsx";
import type { PanelData } from "../../store/dashboard-store.ts";
import type { TimeSeries } from "../../prometheus/types.ts";

interface TableRendererProps {
  data: PanelData;
  focused?: boolean;
}

/**
 * Format a number for table display
 */
function formatValue(value: number): string {
  if (Math.abs(value) >= 1e9) {
    return `${(value / 1e9).toFixed(2)}G`;
  }
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  if (Math.abs(value) < 0.01 && value !== 0) {
    return value.toExponential(2);
  }
  return value.toFixed(2);
}

/**
 * Get a display label from a series
 */
function getSeriesLabel(series: TimeSeries, maxLen: number = 30): string {
  // Try metric name first
  if (series.labels.__name__) {
    const name = series.labels.__name__;
    return name.length > maxLen ? name.slice(0, maxLen - 3) + "..." : name;
  }
  
  // Build from other labels
  const parts = Object.entries(series.labels)
    .filter(([k]) => k !== "__name__")
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  
  if (parts.length === 0) return "value";
  return parts.length > maxLen ? parts.slice(0, maxLen - 3) + "..." : parts;
}

/**
 * Extract key labels for columns
 */
function extractLabelColumns(allSeries: TimeSeries[]): string[] {
  const labelCounts = new Map<string, number>();
  
  for (const series of allSeries) {
    for (const key of Object.keys(series.labels)) {
      if (key !== "__name__") {
        labelCounts.set(key, (labelCounts.get(key) || 0) + 1);
      }
    }
  }
  
  // Return labels that appear in at least 2 series or have variation
  return Array.from(labelCounts.entries())
    .filter(([_, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3) // Max 3 label columns
    .map(([key]) => key);
}

export function TableRenderer({ data, focused = false }: TableRendererProps) {
  const { panel, results, error } = data;

  if (error) {
    return (
      <Panel title={panel.title} focused={focused}>
        <text fg="#ff0000">Error: {error}</text>
      </Panel>
    );
  }

  // Collect all series from all query results
  const allSeries: TimeSeries[] = [];
  for (const result of results) {
    if (!result.error) {
      allSeries.push(...result.series);
    }
  }

  if (allSeries.length === 0) {
    return (
      <Panel title={panel.title} focused={focused}>
        <text fg="#666666">No data</text>
      </Panel>
    );
  }

  // Determine label columns
  const labelCols = extractLabelColumns(allSeries);
  const maxRows = 8; // Limit rows to fit panel

  // Calculate column widths
  const labelColWidth = 15;
  const valueColWidth = 12;

  return (
    <Panel title={panel.title} focused={focused}>
      <box flexDirection="column">
        {/* Header row */}
        <box>
          {labelCols.map((col, i) => (
            <text key={col} fg="#00ffff" attributes={TextAttributes.BOLD}>
              {col.slice(0, labelColWidth).padEnd(labelColWidth)}
            </text>
          ))}
          <text fg="#00ffff" attributes={TextAttributes.BOLD}>
            {"Value".padStart(valueColWidth)}
          </text>
        </box>

        {/* Separator */}
        <box>
          <text fg="#444444">
            {"─".repeat(labelCols.length * labelColWidth + valueColWidth)}
          </text>
        </box>

        {/* Data rows */}
        {allSeries.slice(0, maxRows).map((series, i) => {
          const currentValue = series.samples.length > 0
            ? series.samples[series.samples.length - 1]!.value
            : 0;
          
          return (
            <box key={i}>
              {labelCols.map((col) => (
                <text key={col} fg="#888888">
                  {(series.labels[col] || "-").slice(0, labelColWidth).padEnd(labelColWidth)}
                </text>
              ))}
              <text fg="#00ff00">
                {formatValue(currentValue).padStart(valueColWidth)}
              </text>
            </box>
          );
        })}

        {/* Show if truncated */}
        {allSeries.length > maxRows && (
          <box marginTop={1}>
            <text fg="#666666">
              ... and {allSeries.length - maxRows} more rows
            </text>
          </box>
        )}
      </box>
    </Panel>
  );
}
