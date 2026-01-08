import React from "react";

interface PercentageBarProps {
  value: number; // 0-100
  width?: number;
  showLabel?: boolean;
  thresholdColors?: {
    low: string;    // Below lowThreshold
    medium: string; // Between thresholds
    high: string;   // Above highThreshold
  };
  lowThreshold?: number;
  highThreshold?: number;
}

/**
 * Visual progress bar using Unicode block characters
 * Shows a filled bar with threshold-based coloring
 */
export function PercentageBar({
  value,
  width = 20,
  showLabel = true,
  thresholdColors = {
    low: "#73BF69",    // Green
    medium: "#FADE2A", // Yellow
    high: "#F2495C",   // Red
  },
  lowThreshold = 70,
  highThreshold = 90,
}: PercentageBarProps) {
  // Clamp value to 0-100
  const clampedValue = Math.max(0, Math.min(100, value));
  
  // Calculate filled width
  const filledWidth = Math.round((clampedValue / 100) * width);
  const emptyWidth = width - filledWidth;
  
  // Determine color based on thresholds
  let barColor: string;
  if (clampedValue < lowThreshold) {
    barColor = thresholdColors.low;
  } else if (clampedValue < highThreshold) {
    barColor = thresholdColors.medium;
  } else {
    barColor = thresholdColors.high;
  }
  
  // Build bar using Unicode block characters
  // █ (full block) for filled, ░ (light shade) for empty
  const filledBar = "█".repeat(filledWidth);
  const emptyBar = "░".repeat(emptyWidth);
  
  return (
    <box flexDirection="row">
      <text fg={barColor}>{filledBar}</text>
      <text fg="#333333">{emptyBar}</text>
      {showLabel && (
        <text fg="#888888"> {clampedValue.toFixed(0)}%</text>
      )}
    </box>
  );
}
