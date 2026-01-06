import React from "react";
import { TextAttributes } from "@opentui/core";

interface HeaderProps {
  title: string;
  prometheusUrl: string;
  lastRefresh: number;
  loading: boolean;
}

function formatTime(timestamp: number): string {
  if (timestamp === 0) return "--:--:--";
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function Header({ title, prometheusUrl, lastRefresh, loading }: HeaderProps) {
  const statusColor = loading ? "#ffff00" : "#00ff00";
  const statusText = loading ? "refreshing..." : `updated ${formatTime(lastRefresh)}`;

  // Extract host from URL for display
  let host = prometheusUrl;
  try {
    const url = new URL(prometheusUrl);
    host = url.host;
  } catch {
    // Keep original if parsing fails
  }

  return (
    <box
      flexDirection="row"
      justifyContent="space-between"
      paddingLeft={1}
      paddingRight={1}
      borderStyle="single"
      borderColor="#00ffff"
    >
      <text attributes={TextAttributes.BOLD} fg="#00ffff">
        ◈ viewui
      </text>
      <text>
        <span fg="#ffffff">{title}</span>
      </text>
      <text>
        <span fg="#666666">prometheus: </span>
        <span fg="#888888">{host}</span>
        <span fg="#666666"> │ </span>
        <span fg={statusColor}>{statusText}</span>
      </text>
      <text fg="#666666">q:quit r:refresh</text>
    </box>
  );
}
