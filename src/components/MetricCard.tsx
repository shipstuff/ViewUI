import { TextAttributes } from "@opentui/core";
import type { MetricValue } from "../types";

interface MetricCardProps {
  metric: MetricValue;
  isSelected: boolean;
}

export function MetricCard({ metric, isSelected }: MetricCardProps) {
  const displayValue =
    metric.value !== null
      ? typeof metric.value === "number"
        ? metric.value.toFixed(2)
        : "N/A"
      : "---";

  const borderColor = isSelected ? "#00FF00" : "#666666";
  const bgColor = isSelected ? "#1a1a1a" : "transparent";

  return (
    <box
      style={{
        border: true,
        borderStyle: "single",
        padding: 1,
        borderColor,
        backgroundColor: bgColor,
      }}
      marginBottom={1}
    >
      <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <text attributes={isSelected ? TextAttributes.BOLD : undefined}>
          {metric.config.name}
        </text>
        <text
          attributes={
            metric.error
              ? TextAttributes.RED
              : metric.value === null
              ? TextAttributes.DIM
              : undefined
          }
        >
          {metric.error ? "Error" : displayValue}
        </text>
      </box>
      {metric.error && (
        <box marginTop={1}>
          <text attributes={TextAttributes.DIM} style={{ fontSize: 0.8 }}>
            {metric.error}
          </text>
        </box>
      )}
      {metric.config.type === "gauge" && metric.value !== null && !metric.error && (
        <GaugeBar value={metric.value} />
      )}
    </box>
  );
}

function GaugeBar({ value }: { value: number }) {
  // Normalize value to 0-100 for display (adjust max as needed)
  // For connections_active, you might want to set a reasonable max
  const maxValue = 1000; // Adjust based on your expected max connections
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <box marginTop={1}>
      <box style={{ backgroundColor: "#333333", height: 1 }}>
        <box
          style={{
            width: `${percentage}%`,
            height: 1,
            backgroundColor: percentage > 80 ? "#FF0000" : percentage > 50 ? "#FFA500" : "#00FF00",
          }}
        />
      </box>
    </box>
  );
}

