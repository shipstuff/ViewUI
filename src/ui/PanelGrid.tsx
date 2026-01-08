import React from "react";
import { useTerminalDimensions } from "@opentui/react";

interface PanelGridProps {
  children: React.ReactNode;
  columns?: number;
}

/**
 * Calculate optimal column count based on terminal width
 */
function getResponsiveColumns(width: number): number {
  if (width < 80) return 1;
  if (width < 150) return 2;
  return 3;
}

export function PanelGrid({
  children,
  columns,
}: PanelGridProps) {
  const { width } = useTerminalDimensions();
  
  // Use provided columns or calculate responsive columns
  const effectiveColumns = columns ?? getResponsiveColumns(width);
  
  const childArray = React.Children.toArray(children);
  const rows: React.ReactNode[][] = [];

  for (let i = 0; i < childArray.length; i += effectiveColumns) {
    rows.push(childArray.slice(i, i + effectiveColumns));
  }

  return (
    <box flexDirection="column" flexGrow={1}>
      {rows.map((row, rowIndex) => (
        <box key={rowIndex} flexDirection="row" flexGrow={1}>
          {row.map((child, colIndex) => (
            <box key={colIndex} flexGrow={1} flexBasis={0}>
              {child}
            </box>
          ))}
        </box>
      ))}
    </box>
  );
}
