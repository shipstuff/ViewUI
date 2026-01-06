import type { ThresholdConfig } from "../grafana/types.ts";

/**
 * Grafana named colors to hex
 */
const GRAFANA_COLORS: Record<string, string> = {
  // Standard colors
  green: "#73BF69",
  red: "#F2495C",
  yellow: "#FADE2A",
  orange: "#FF9830",
  blue: "#5794F2",
  purple: "#B877D9",
  
  // Additional Grafana palette
  "dark-green": "#37872D",
  "semi-dark-green": "#56A64B",
  "light-green": "#96D98D",
  "super-light-green": "#C8F2C2",
  
  "dark-yellow": "#CC9D00",
  "semi-dark-yellow": "#E5AC0E",
  "light-yellow": "#FFEE52",
  "super-light-yellow": "#FFF899",
  
  "dark-red": "#C4162A",
  "semi-dark-red": "#E02F44",
  "light-red": "#FF7383",
  "super-light-red": "#FFA6B0",
  
  "dark-blue": "#1F60C4",
  "semi-dark-blue": "#3274D9",
  "light-blue": "#8AB8FF",
  "super-light-blue": "#C0D8FF",
  
  "dark-orange": "#E55400",
  "semi-dark-orange": "#FA6400",
  "light-orange": "#FFAD5A",
  "super-light-orange": "#FFD599",
  
  "dark-purple": "#8F3BB8",
  "semi-dark-purple": "#A352CC",
  "light-purple": "#CA95E5",
  "super-light-purple": "#DEB6F2",
  
  // Grayscale
  white: "#FFFFFF",
  black: "#000000",
  gray: "#808080",
  "text": "#DCE4ED",
};

/**
 * Convert Grafana color name or hex to hex
 */
export function resolveColor(color: string): string {
  // Already hex
  if (color.startsWith("#")) {
    return color;
  }
  
  // Named color
  return GRAFANA_COLORS[color] ?? GRAFANA_COLORS.green!;
}

/**
 * Get threshold color for a value
 */
export function getThresholdColor(
  value: number,
  thresholds?: ThresholdConfig
): string {
  if (!thresholds || thresholds.steps.length === 0) {
    return "#ffffff"; // Default white
  }

  // Sort steps by value (null/base first, then ascending)
  const sortedSteps = [...thresholds.steps].sort((a, b) => {
    if (a.value === null) return -1;
    if (b.value === null) return 1;
    return a.value - b.value;
  });

  // Find the appropriate threshold
  let color: string = sortedSteps[0]?.color ?? "green"; // Start with base
  
  for (const step of sortedSteps) {
    if (step.value === null) {
      color = step.color;
    } else if (value >= step.value) {
      color = step.color;
    }
  }

  return resolveColor(color);
}

/**
 * Get all threshold colors for reference
 */
export function getThresholdColors(thresholds?: ThresholdConfig): string[] {
  if (!thresholds || thresholds.steps.length === 0) {
    return ["#ffffff"];
  }

  return thresholds.steps.map((step) => resolveColor(step.color));
}
