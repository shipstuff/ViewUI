import React from "react";
import { TextAttributes } from "@opentui/core";
import { Panel } from "../Panel.tsx";
import { BigValue } from "../charts/BigValue.tsx";
import { PercentageBar } from "../charts/PercentageBar.tsx";
import { getThresholdColor } from "../thresholds.ts";
import type { PanelData } from "../../store/dashboard-store.ts";
import type { DashboardStore } from "../../store/dashboard-store.ts";

interface StatRendererProps {
  data: PanelData;
  store: DashboardStore;
  focused?: boolean;
}

/**
 * Format a number for large display
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
 * Calculate trend from history
 */
function calculateTrend(
  store: DashboardStore,
  panelId: number,
  refId: string
): "up" | "down" | "stable" {
  const history = store.getHistory(`${panelId}-${refId}`);
  const values = history.getValues(5);
  
  if (values.length < 2) {
    return "stable";
  }

  const first = values[0]!;
  const last = values[values.length - 1]!;
  const change = last - first;
  const threshold = Math.abs(first) * 0.01; // 1% change threshold

  if (change > threshold) return "up";
  if (change < -threshold) return "down";
  return "stable";
}

/**
 * Get trend arrow and color
 */
function getTrendDisplay(trend: "up" | "down" | "stable"): { arrow: string; color: string } {
  switch (trend) {
    case "up":
      return { arrow: "▲", color: "#00ff00" };
    case "down":
      return { arrow: "▼", color: "#ff0000" };
    case "stable":
      return { arrow: "─", color: "#888888" };
  }
}

export function StatRenderer({ data, store, focused = false }: StatRendererProps) {
  const { panel, results, error } = data;

  if (error) {
    return (
      <Panel title={panel.title} focused={focused}>
        <text fg="#ff0000">Error: {error}</text>
      </Panel>
    );
  }

  // Get the first valid value from results
  let currentValue: number | null = null;
  let refId = "A";

  for (const result of results) {
    if (!result.error && result.series.length > 0) {
      const series = result.series[0]!;
      if (series.samples.length > 0) {
        currentValue = series.samples[series.samples.length - 1]!.value;
        refId = result.refId;
        break;
      }
    }
  }

  if (currentValue === null) {
    return (
      <Panel title={panel.title} focused={focused}>
        <text fg="#666666">No data</text>
      </Panel>
    );
  }

  const trend = calculateTrend(store, panel.id, refId);
  const { arrow, color: trendColor } = getTrendDisplay(trend);
  const valueColor = getThresholdColor(currentValue, panel.thresholds);
  const formattedValue = formatLargeValue(currentValue);
  
  // Check if this is a percentage value (0-100 range and title suggests percentage)
  const isPercentage = (
    panel.title.toLowerCase().includes("%") || 
    panel.title.toLowerCase().includes("percent") ||
    panel.title.toLowerCase().includes("usage")
  ) && currentValue >= 0 && currentValue <= 100;

  return (
    <Panel title={panel.title} focused={focused}>
      <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        {/* Large ASCII art value - using "block" font for readability */}
        <box marginBottom={1}>
          <BigValue 
            value={formattedValue} 
            color={valueColor}
            font="block"
          />
        </box>

        {/* Percentage bar for percentage values */}
        {isPercentage && (
          <box marginBottom={1}>
            <PercentageBar
              value={currentValue}
              width={30}
              showLabel={false}
              lowThreshold={panel.thresholds?.steps?.[1]?.value ?? 70}
              highThreshold={panel.thresholds?.steps?.[2]?.value ?? 90}
            />
          </box>
        )}

        {/* Trend indicator */}
        <box>
          <text attributes={TextAttributes.BOLD} fg={trendColor}>{arrow} </text>
          <text fg="#888888">
            {trend === "up" ? "increasing" : trend === "down" ? "decreasing" : "stable"}
          </text>
        </box>
      </box>
    </Panel>
  );
}
