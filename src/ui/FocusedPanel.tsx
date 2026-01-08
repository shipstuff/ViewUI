import React from "react";
import { TextAttributes } from "@opentui/core";
import { useTerminalDimensions } from "@opentui/react";
import { Sparkline } from "./charts/Sparkline.tsx";
import { BigValue } from "./charts/BigValue.tsx";
import { getThresholdColor } from "./thresholds.ts";
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
 * Format for big display
 */
function formatLargeValue(value: number): string {
  if (Math.abs(value) >= 1e12) {
    return `${(value / 1e12).toFixed(1)}T`;
  }
  if (Math.abs(value) >= 1e9) {
    return `${(value / 1e9).toFixed(1)}G`;
  }
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(1);
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
  const { width: terminalWidth, height: terminalHeight } = useTerminalDimensions();

  // Calculate chart dimensions - fill most of the available space
  // Reserve space for: border (2), padding (2), axis labels (6)
  const chartWidth = Math.max(60, terminalWidth - 12);
  // Reserve space for: header (2), stats (2), query info (5), borders/padding (8)
  const chartHeight = Math.max(10, terminalHeight - 18);

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

  // Suppress unused store warning - store is available for future use
  void store;

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      borderStyle="rounded"
      borderColor="#00ffff"
      backgroundColor="#0a1a1a"
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

      {/* Timeseries view - chart fills the screen */}
      {!error && primarySeries && panel.type === "timeseries" && (
        <box flexDirection="column" flexGrow={1}>
          {/* Stats row at top */}
          <box marginBottom={1} flexDirection="row">
            <box marginRight={3}>
              <text fg="#666666">Current: </text>
              <text attributes={TextAttributes.BOLD} fg="#00ff00">
                {formatValue(primaryStats!.current)}
              </text>
            </box>
            <box marginRight={3}>
              <text fg="#666666">Min: </text>
              <text fg="#ff6666">{formatValue(primaryStats!.min)}</text>
            </box>
            <box marginRight={3}>
              <text fg="#666666">Max: </text>
              <text fg="#66ff66">{formatValue(primaryStats!.max)}</text>
            </box>
            <box marginRight={3}>
              <text fg="#666666">Avg: </text>
              <text fg="#6666ff">{formatValue(primaryStats!.avg)}</text>
            </box>
            <box>
              <text fg="#666666">Samples: </text>
              <text fg="#888888">{chartData.length}</text>
            </box>
          </box>

          {/* Large sparkline chart - fills available space */}
          <box flexGrow={1}>
            <Sparkline
              data={chartData}
              height={chartHeight}
              width={chartWidth}
              color="#00ffff"
              showAxis={true}
            />
          </box>

          {/* All series list if multiple */}
          {allSeries.length > 1 && (
            <box marginTop={1} flexDirection="column">
              <text attributes={TextAttributes.BOLD} fg="#ffffff">
                All Series ({allSeries.length})
              </text>
              {allSeries.slice(0, 5).map((series, i) => {
                const stats = calculateStats(series);
                const legend = getLegend(series);
                const colors = ["#00ffff", "#ff00ff", "#ffff00", "#00ff00", "#ff8800"];
                return (
                  <box key={i} flexDirection="row">
                    <text fg={colors[i % colors.length]}>● </text>
                    <text fg="#888888">{legend.slice(0, 30).padEnd(32)}</text>
                    <text fg="#00ff00">{formatValue(stats.current).padStart(10)}</text>
                  </box>
                );
              })}
              {allSeries.length > 5 && (
                <text fg="#666666">  ...and {allSeries.length - 5} more</text>
              )}
            </box>
          )}
        </box>
      )}

      {/* Stat panel view - large centered value with chart below */}
      {!error && primarySeries && panel.type === "stat" && (
        <box flexDirection="column" flexGrow={1}>
          {/* Large ASCII art value at top */}
          <box alignItems="center" justifyContent="center" marginBottom={1}>
            <BigValue 
              value={formatLargeValue(primaryStats!.current)}
              color={getThresholdColor(primaryStats!.current, panel.thresholds)}
              font="huge"
            />
          </box>
          
          {/* Stats row */}
          <box marginBottom={1} flexDirection="row" justifyContent="center">
            <box marginRight={4}>
              <text fg="#666666">Min: </text>
              <text fg="#ff6666">{formatValue(primaryStats!.min)}</text>
            </box>
            <box marginRight={4}>
              <text fg="#666666">Max: </text>
              <text fg="#66ff66">{formatValue(primaryStats!.max)}</text>
            </box>
            <box>
              <text fg="#666666">Avg: </text>
              <text fg="#6666ff">{formatValue(primaryStats!.avg)}</text>
            </box>
          </box>

          {/* History sparkline - full width */}
          <box flexGrow={1}>
            <Sparkline
              data={chartData}
              height={Math.max(8, chartHeight - 16)}
              width={chartWidth}
              color="#00ffff"
              showAxis={true}
            />
          </box>
        </box>
      )}

      {/* Query info at bottom */}
      <box marginTop={1} borderStyle="single" borderColor="#333333" padding={1}>
        <text fg="#666666">Query: </text>
        <text fg="#888888">
          {panel.queries[0]?.expr.slice(0, Math.max(50, terminalWidth - 20)) ?? "N/A"}
          {(panel.queries[0]?.expr.length ?? 0) > terminalWidth - 20 ? "..." : ""}
        </text>
      </box>
    </box>
  );
}
