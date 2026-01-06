import React from "react";
import { TextAttributes } from "@opentui/core";
import { Sparkline } from "./charts/Sparkline.tsx";
import type { PanelData } from "../store/dashboard-store.ts";
import type { DashboardStore } from "../store/dashboard-store.ts";
import type { TimeSeries } from "../prometheus/types.ts";

interface FocusedPanelProps {
  data: PanelData;
  store: DashboardStore;
}

/**
 * Calculate stats for a series
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
 * Get legend from series labels
 */
function getLegend(series: TimeSeries): string {
  if (series.legendFormat) {
    let legend = series.legendFormat;
    for (const [key, value] of Object.entries(series.labels)) {
      legend = legend.replace(`{{${key}}}`, value);
    }
    return legend;
  }
  
  if (series.labels.__name__) {
    return series.labels.__name__;
  }
  
  const labelParts = Object.entries(series.labels)
    .filter(([k]) => k !== "__name__")
    .map(([k, v]) => `${k}="${v}"`)
    .join(", ");
  
  return labelParts || "value";
}

export function FocusedPanel({ data, store }: FocusedPanelProps) {
  const { panel, results, error } = data;

  // Collect all series
  const allSeries: TimeSeries[] = [];
  for (const result of results) {
    if (!result.error) {
      allSeries.push(...result.series);
    }
  }

  const primarySeries = allSeries[0];
  const primaryStats = primarySeries ? calculateStats(primarySeries) : null;
  const chartData = primarySeries?.samples.map((s) => s.value) ?? [];

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      borderStyle="rounded"
      borderColor="#00ffff"
      padding={1}
    >
      {/* Header */}
      <box marginBottom={1}>
        <text attributes={TextAttributes.BOLD} fg="#00ffff">
          {panel.title}
        </text>
        <text fg="#666666"> [Escape to close]</text>
      </box>

      {/* Error state */}
      {error && (
        <box flexGrow={1} alignItems="center" justifyContent="center">
          <text fg="#ff0000">Error: {error}</text>
        </box>
      )}

      {/* No data state */}
      {!error && allSeries.length === 0 && (
        <box flexGrow={1} alignItems="center" justifyContent="center">
          <text fg="#666666">No data</text>
        </box>
      )}

      {/* Timeseries view */}
      {!error && primarySeries && panel.type === "timeseries" && (
        <box flexDirection="column" flexGrow={1}>
          {/* Large current value */}
          <box marginBottom={1}>
            <text fg="#666666">Current: </text>
            <text attributes={TextAttributes.BOLD} fg="#00ff00">
              {formatValue(primaryStats!.current)}
            </text>
          </box>

          {/* Large sparkline chart */}
          <Sparkline
            data={chartData}
            height={8}
            width={70}
            color="#00ffff"
          />

          {/* Stats row */}
          <box marginTop={1} flexDirection="row">
            <box marginRight={4}>
              <text fg="#666666">Min: </text>
              <text fg="#ff6666">{formatValue(primaryStats!.min)}</text>
            </box>
            <box marginRight={4}>
              <text fg="#666666">Max: </text>
              <text fg="#66ff66">{formatValue(primaryStats!.max)}</text>
            </box>
            <box marginRight={4}>
              <text fg="#666666">Avg: </text>
              <text fg="#6666ff">{formatValue(primaryStats!.avg)}</text>
            </box>
            <box>
              <text fg="#666666">Samples: </text>
              <text fg="#888888">{chartData.length}</text>
            </box>
          </box>

          {/* All series list */}
          {allSeries.length > 1 && (
            <box marginTop={2} flexDirection="column">
              <text attributes={TextAttributes.BOLD} fg="#ffffff">
                All Series ({allSeries.length})
              </text>
              {allSeries.map((series, i) => {
                const stats = calculateStats(series);
                const legend = getLegend(series);
                return (
                  <box key={i} marginTop={1}>
                    <text fg="#888888">{legend.slice(0, 40).padEnd(42)}</text>
                    <text fg="#00ff00">{formatValue(stats.current).padStart(10)}</text>
                    <text fg="#666666">  min: </text>
                    <text fg="#888888">{formatValue(stats.min).padStart(8)}</text>
                    <text fg="#666666">  max: </text>
                    <text fg="#888888">{formatValue(stats.max).padStart(8)}</text>
                  </box>
                );
              })}
            </box>
          )}
        </box>
      )}

      {/* Stat panel view */}
      {!error && primarySeries && panel.type === "stat" && (
        <box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
          {/* Very large value */}
          <text attributes={TextAttributes.BOLD} fg="#ffffff">
            {formatValue(primaryStats!.current)}
          </text>
          
          {/* History sparkline */}
          <box marginTop={2}>
            <Sparkline
              data={chartData}
              height={4}
              width={50}
              color="#00ffff"
            />
          </box>

          <box marginTop={2} flexDirection="row">
            <box marginRight={4}>
              <text fg="#666666">Min: </text>
              <text fg="#888888">{formatValue(primaryStats!.min)}</text>
            </box>
            <box marginRight={4}>
              <text fg="#666666">Max: </text>
              <text fg="#888888">{formatValue(primaryStats!.max)}</text>
            </box>
            <box>
              <text fg="#666666">Avg: </text>
              <text fg="#888888">{formatValue(primaryStats!.avg)}</text>
            </box>
          </box>
        </box>
      )}

      {/* Query info */}
      <box marginTop={2} borderStyle="single" borderColor="#333333" padding={1}>
        <text fg="#666666">Queries: </text>
        {panel.queries.map((q, i) => (
          <text key={i} fg="#888888">
            {i > 0 ? " | " : ""}{q.expr.slice(0, 60)}{q.expr.length > 60 ? "..." : ""}
          </text>
        ))}
      </box>
    </box>
  );
}
