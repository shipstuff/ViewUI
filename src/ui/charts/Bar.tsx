import React from "react";

interface BarProps {
  label: string;
  value: number;
  maxValue?: number;
  width?: number;
  color?: string;
  showValue?: boolean;
  unit?: string;
}

export function Bar({
  label,
  value,
  maxValue = 100,
  width = 15,
  color = "#00ffff",
  showValue = true,
  unit = "",
}: BarProps) {
  const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const filledWidth = Math.round((percent / 100) * width);
  const emptyWidth = width - filledWidth;

  const bar = "█".repeat(filledWidth) + "░".repeat(emptyWidth);
  const valueText = showValue ? ` ${value.toFixed(1)}${unit}` : "";

  return (
    <box flexDirection="row">
      <text fg="#ffffff">{label.slice(0, 12).padEnd(12)}</text>
      <text fg="#666666"> </text>
      <text fg={color}>{bar}</text>
      <text fg="#666666">{valueText}</text>
    </box>
  );
}

interface BarListProps {
  items: Array<{
    label: string;
    value: number;
    maxValue?: number;
    color?: string;
    unit?: string;
  }>;
  width?: number;
}

export function BarList({ items, width = 15 }: BarListProps) {
  return (
    <box flexDirection="column">
      {items.map((item, index) => (
        <Bar
          key={index}
          label={item.label}
          value={item.value}
          maxValue={item.maxValue}
          width={width}
          color={item.color}
          unit={item.unit}
        />
      ))}
    </box>
  );
}
