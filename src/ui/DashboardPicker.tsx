import React, { useState, useEffect } from "react";
import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";

interface DashboardEntry {
  path: string;
  title: string;
}

interface DashboardPickerProps {
  directory: string;
  currentPath: string;
  onSelect: (path: string) => void;
  onClose: () => void;
}

/**
 * Scan directory for dashboard JSON files
 */
async function scanDashboards(directory: string): Promise<DashboardEntry[]> {
  const entries: DashboardEntry[] = [];
  
  try {
    const glob = new Bun.Glob("*.json");
    const files = glob.scanSync({ cwd: directory });
    
    for (const file of files) {
      const path = `${directory}/${file}`;
      try {
        const content = await Bun.file(path).text();
        const json = JSON.parse(content);
        entries.push({
          path,
          title: json.title || file.replace(".json", ""),
        });
      } catch {
        // Skip invalid JSON files
        entries.push({
          path,
          title: file.replace(".json", ""),
        });
      }
    }
  } catch (error) {
    console.error("Failed to scan dashboards:", error);
  }
  
  return entries.sort((a, b) => a.title.localeCompare(b.title));
}

export function DashboardPicker({
  directory,
  currentPath,
  onSelect,
  onClose,
}: DashboardPickerProps) {
  const [dashboards, setDashboards] = useState<DashboardEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load dashboards on mount
  useEffect(() => {
    scanDashboards(directory).then((entries) => {
      setDashboards(entries);
      // Select current dashboard
      const currentIndex = entries.findIndex((e) => e.path === currentPath);
      if (currentIndex >= 0) {
        setSelectedIndex(currentIndex);
      }
      setLoading(false);
    });
  }, [directory, currentPath]);

  // Handle keyboard input
  useKeyboard((event) => {
    const key = event.name;

    if (key === "escape" || key === "d" || key === "D") {
      onClose();
      return;
    }

    if (key === "return" || key === "enter") {
      if (dashboards[selectedIndex]) {
        onSelect(dashboards[selectedIndex]!.path);
      }
      return;
    }

    if (key === "up" && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (key === "down" && selectedIndex < dashboards.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  });

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      borderStyle="rounded"
      borderColor="#00ffff"
      padding={1}
    >
      {/* Header */}
      <box marginBottom={1}>
        <text attributes={TextAttributes.BOLD} fg="#00ffff">
          Select Dashboard
        </text>
        <text fg="#666666"> [Enter to select, Escape to cancel]</text>
      </box>

      {/* Directory info */}
      <box marginBottom={1}>
        <text fg="#666666">Directory: </text>
        <text fg="#888888">{directory}</text>
      </box>

      {/* Loading state */}
      {loading && (
        <box>
          <text fg="#ffff00">Scanning for dashboards...</text>
        </box>
      )}

      {/* Empty state */}
      {!loading && dashboards.length === 0 && (
        <box>
          <text fg="#ff0000">No dashboard files found</text>
        </box>
      )}

      {/* Dashboard list */}
      {!loading && dashboards.length > 0 && (
        <box flexDirection="column">
          {dashboards.map((dashboard, index) => {
            const isSelected = index === selectedIndex;
            const isCurrent = dashboard.path === currentPath;
            
            return (
              <box key={dashboard.path}>
                <text fg={isSelected ? "#00ffff" : "#666666"}>
                  {isSelected ? "▶ " : "  "}
                </text>
                <text
                  fg={isSelected ? "#ffffff" : "#888888"}
                  attributes={isSelected ? TextAttributes.BOLD : undefined}
                >
                  {dashboard.title}
                </text>
                {isCurrent && (
                  <text fg="#00ff00"> (current)</text>
                )}
              </box>
            );
          })}
        </box>
      )}
    </box>
  );
}
