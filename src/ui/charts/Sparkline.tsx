import React from "react";
import asciichart from "asciichart";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  min?: number;
  max?: number;
}

export function Sparkline({
  data,
  width = 40,
  height = 4,
  color = "#00ff00",
  min,
  max,
}: SparklineProps) {
  if (data.length === 0) {
    return <text fg="#666666">No data</text>;
  }

  // Pad data to fill width if needed
  const paddedData =
    data.length < width ? [...Array(width - data.length).fill(0), ...data] : data.slice(-width);

  try {
    const chart = asciichart.plot(paddedData, {
      height: height,
      min: min,
      max: max,
      format: (x: number) => x.toFixed(0).padStart(3),
    });

    return <text fg={color}>{chart}</text>;
  } catch {
    return <text fg="#666666">Chart error</text>;
  }
}
