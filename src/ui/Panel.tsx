import React from "react";
import { TextAttributes } from "@opentui/core";

interface PanelProps {
  title: string;
  focused?: boolean;
  children: React.ReactNode;
}

export function Panel({
  title,
  focused = false,
  children,
}: PanelProps) {
  // Enhanced color scheme
  const borderColor = focused ? "#00ffff" : "#444444";
  const titleColor = focused ? "#00ffff" : "#ffffff";
  const bgColor = focused ? "#0a1a1a" : undefined;

  return (
    <box
      flexDirection="column"
      borderStyle="rounded"
      borderColor={borderColor}
      backgroundColor={bgColor}
      paddingLeft={1}
      paddingRight={1}
      paddingTop={1}
      paddingBottom={1}
      flexGrow={1}
      margin={0}
    >
      {/* Panel title with indicator */}
      <box marginBottom={1}>
        <text attributes={TextAttributes.BOLD} fg={titleColor}>
          {focused ? "▶ " : "  "}
          {title}
        </text>
      </box>
      
      {/* Panel content */}
      <box flexDirection="column" flexGrow={1}>
        {children}
      </box>
    </box>
  );
}
