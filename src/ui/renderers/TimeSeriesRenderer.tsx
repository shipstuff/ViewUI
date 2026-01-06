import React from "react";
import { TextAttributes } from "@opentui/core";
import { Panel } from "../Panel.tsx";
import { Sparkline } from "../charts/Sparkline.tsx";
import type { PanelData } from "../../store/dashboard-store.ts";
import type { TimeSeries } from "../../prometheus/types.ts";

interface TimeSeriesRendererProps {
  data: PanelData;
  focused?: boolean;
}

/**
 * Calculate min, max, avg, current for a series
 */
function calculateStats(series: TimeSeries) {
  if (series.samples.length === 0) {
    return { min: 0, max: 0, avg: 0, current: 0 };
  }

  const values = series.samples.map((s) => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const current = values[values.length - 1] ?? 0;

  return { min, max, avg, current };
}

/**
 * Format a number for display
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
 * Get legend from series labels or format
 */
function getLegend(series: TimeSeries): string {
  if (series.legendFormat) {
    // Simple template substitution
    let legend = series.legendFormat;
    for (const [key, value] of Object.entries(series.labels)) {
      legend = legend.replace(`{{${key}}}`, value);
    }
    return legend;
  }
  
  // Fallback to metric name or labels
  if (series.labels.__name__) {
    return series.labels.__name__;
  }
  
  const labelParts = Object.entries(series.labels)
    .filter(([k]) => k !== "__name__")
    .map(([k, v]) => `${k}="${v}"`)
    .join(", ");
  
  return labelParts || "value";
}

export function TimeSeriesRenderer({ data, focused = false }: TimeSeriesRendererProps) {
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

  // Show first series with sparkline, others as list
  const primarySeries = allSeries[0]!;
  const primaryStats = calculateStats(primarySeries);
  const chartData = primarySeries.samples.map((s) => s.value);

  return (
    <Panel title={panel.title} focused={focused}>
      <box flexDirection="column">
        {/* Current value */}
        <box marginBottom={1}>
          <text attributes={TextAttributes.BOLD} fg="#ffffff">
            Current:{" "}
          </text>
          <text fg="#00ff00">{formatValue(primaryStats.current)}</text>
        </box>

        {/* Sparkline chart */}
        <Sparkline
          data={chartData}
          height={3}
          width={35}
          color="#00ffff"
        />

        {/* Stats row */}
        <box marginTop={1} flexDirection="row">
          <box marginRight={2}>
            <text fg="#666666">min: </text>
            <text fg="#888888">{formatValue(primaryStats.min)}</text>
          </box>
          <box marginRight={2}>
            <text fg="#666666">max: </text>
            <text fg="#888888">{formatValue(primaryStats.max)}</text>
          </box>
          <box>
            <text fg="#666666">avg: </text>
            <text fg="#888888">{formatValue(primaryStats.avg)}</text>
          </box>
        </box>

        {/* Additional series */}
        {allSeries.length > 1 && (
          <box marginTop={1} flexDirection="column">
            <text fg="#666666">Series:</text>
            {allSeries.slice(0, 4).map((series, i) => {
              const stats = calculateStats(series);
              const legend = getLegend(series);
              return (
                <box key={i}>
                  <text fg="#888888">{legend.slice(0, 20).padEnd(20)}</text>
                  <text fg="#00ff00">{formatValue(stats.current)}</text>
                </box>
              );
            })}
            {allSeries.length > 4 && (
              <text fg="#666666">...and {allSeries.length - 4} more</text>
            )}
          </box>
        )}
      </box>
    </Panel>
  );
}
