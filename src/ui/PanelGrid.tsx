import React from "react";

interface PanelGridProps {
  children: React.ReactNode;
  columns?: number;
}

export function PanelGrid({
  children,
  columns = 2,
}: PanelGridProps) {
  const childArray = React.Children.toArray(children);
  const rows: React.ReactNode[][] = [];

  for (let i = 0; i < childArray.length; i += columns) {
    rows.push(childArray.slice(i, i + columns));
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
