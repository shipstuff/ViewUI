import React from "react";

interface GaugeProps {
  value: number; // 0-100
  width?: number;
  showPercent?: boolean;
  label?: string;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

// Unicode block characters for smooth gauge
const BLOCKS = ["▏", "▎", "▍", "▌", "▋", "▊", "▉", "█"];

function getColor(
  value: number,
  thresholds: { warning: number; critical: number }
): string {
  if (value >= thresholds.critical) return "#ff0000";
  if (value >= thresholds.warning) return "#ffff00";
  return "#00ff00";
}

export function Gauge({
  value,
  width = 20,
  showPercent = true,
  label,
  thresholds = { warning: 70, critical: 90 },
}: GaugeProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const color = getColor(clampedValue, thresholds);

  // Calculate filled portion
  const totalUnits = width * 8; // 8 sub-units per character
  const filledUnits = Math.round((clampedValue / 100) * totalUnits);

  const fullBlocks = Math.floor(filledUnits / 8);
  const partialBlock = filledUnits % 8;
  const emptyBlocks = width - fullBlocks - (partialBlock > 0 ? 1 : 0);

  let bar = "█".repeat(fullBlocks);
  if (partialBlock > 0 && fullBlocks < width) {
    bar += BLOCKS[partialBlock - 1];
  }
  bar += "░".repeat(Math.max(0, emptyBlocks));

  const percentText = showPercent ? ` ${clampedValue.toFixed(1)}%` : "";

  return (
    <box flexDirection="row">
      {label && <text fg="#666666">{label.padEnd(8)}</text>}
      <text fg={color}>{bar}</text>
      <text fg="#ffffff">{percentText}</text>
    </box>
  );
}
