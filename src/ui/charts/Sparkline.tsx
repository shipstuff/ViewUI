import React from "react";
import asciichart from "asciichart";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  min?: number;
  max?: number;
  showAxis?: boolean;
}

/**
 * Interpolate data to fill the target width
 * This resamples the data so the chart fills the available space
 */
function interpolateData(data: number[], targetWidth: number): number[] {
  if (data.length === 0) return [];
  if (data.length === 1) return Array(targetWidth).fill(data[0]);
  if (data.length >= targetWidth) return data.slice(-targetWidth);
  
  // Interpolate to fill the width
  const result: number[] = [];
  const ratio = (data.length - 1) / (targetWidth - 1);
  
  for (let i = 0; i < targetWidth; i++) {
    const srcIndex = i * ratio;
    const lower = Math.floor(srcIndex);
    const upper = Math.ceil(srcIndex);
    const fraction = srcIndex - lower;
    
    if (upper >= data.length) {
      result.push(data[data.length - 1]!);
    } else if (lower === upper) {
      result.push(data[lower]!);
    } else {
      // Linear interpolation between points
      const lowerVal = data[lower]!;
      const upperVal = data[upper]!;
      result.push(lowerVal + (upperVal - lowerVal) * fraction);
    }
  }
  
  return result;
}

export function Sparkline({
  data,
  width = 50,
  height = 6,
  color = "#00ff00",
  min,
  max,
  showAxis = true,
}: SparklineProps) {
  if (data.length === 0) {
    return <text fg="#666666">No data</text>;
  }

  // Interpolate data to fill the entire width
  const chartData = interpolateData(data, width);

  try {
    const chartOptions = {
      height: height,
      min: min,
      max: max,
      format: showAxis 
        ? (x: number) => {
            if (Math.abs(x) >= 1000) {
              return (x / 1000).toFixed(0).padStart(4) + "k";
            }
            return x.toFixed(0).padStart(5);
          }
        : () => "", // Hide axis labels
    };

    const chart = asciichart.plot(chartData, chartOptions);

    return <text fg={color}>{chart}</text>;
  } catch {
    return <text fg="#666666">Chart error</text>;
  }
}
