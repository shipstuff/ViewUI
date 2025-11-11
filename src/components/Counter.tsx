import { TextAttributes } from "@opentui/core";
import type { MetricValue } from "../types";

interface CounterProps {
  metric: MetricValue;
  isSelected: boolean;
}

export function Counter({ metric, isSelected }: CounterProps) {
  const displayValue =
    metric.value !== null
      ? typeof metric.value === "number"
        ? metric.value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
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
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={isSelected ? TextAttributes.BOLD : undefined}>
          {metric.config.name}
        </text>
        <text
          attributes={
            metric.error
              ? TextAttributes.RED
              : metric.value === null
              ? TextAttributes.DIM
              : TextAttributes.BOLD
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
    </box>
  );
}

