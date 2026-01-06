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
  const borderColor = focused ? "#00ffff" : "#666666";
  const titleColor = focused ? "#00ffff" : "#ffffff";

  return (
    <box
      flexDirection="column"
      borderStyle="single"
      borderColor={borderColor}
      paddingLeft={1}
      paddingRight={1}
      flexGrow={1}
    >
      <box marginBottom={1}>
        <text attributes={TextAttributes.BOLD} fg={titleColor}>
          {focused ? "▸ " : "  "}
          {title}
        </text>
      </box>
      {children}
    </box>
  );
}
