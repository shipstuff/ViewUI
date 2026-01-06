import React from "react";

interface WarningsBarProps {
  warnings: string[];
  expanded: boolean;
}

export function WarningsBar({ warnings, expanded }: WarningsBarProps) {
  if (warnings.length === 0) {
    return null;
  }

  if (!expanded) {
    // Collapsed view - single line summary
    return (
      <box paddingLeft={1} paddingRight={1} height={1}>
        <text fg="#ffff00">
          ⚠ {warnings.length} unsupported feature{warnings.length > 1 ? "s" : ""} [w to expand]
        </text>
      </box>
    );
  }

  // Expanded view - full list
  return (
    <box flexDirection="column" paddingLeft={1} paddingRight={1}>
      <text fg="#ffff00">
        ⚠ Unsupported Features ({warnings.length}) [w to collapse]
      </text>
      {warnings.map((warning, index) => {
        const isLast = index === warnings.length - 1;
        const prefix = isLast ? "└─" : "├─";
        return (
          <box key={index} paddingLeft={1}>
            <text fg="#888888">
              {prefix} {warning}
            </text>
          </box>
        );
      })}
    </box>
  );
}
