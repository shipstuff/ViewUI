import React, { useState, useEffect } from "react";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { Header } from "./Header.tsx";
import { PanelGrid } from "./PanelGrid.tsx";
import { WarningsBar } from "./WarningsBar.tsx";
import { VariableBar } from "./VariableBar.tsx";
import { FocusedPanel } from "./FocusedPanel.tsx";
import { DashboardPicker } from "./DashboardPicker.tsx";
import { TimeSeriesRenderer } from "./renderers/TimeSeriesRenderer.tsx";
import { StatRenderer } from "./renderers/StatRenderer.tsx";
import { TableRenderer } from "./renderers/TableRenderer.tsx";
import type { DashboardStore, DashboardState, PanelData } from "../store/dashboard-store.ts";
import type { ViewuiConfig } from "../config/schema.ts";

interface AppProps {
  store: DashboardStore;
  config: ViewuiConfig;
  onExit: () => void;
}

/**
 * Calculate responsive column count (must match PanelGrid logic)
 */
function getResponsiveColumns(width: number): number {
  if (width < 80) return 1;
  if (width < 150) return 2;
  return 3;
}

export function App({ store, config, onExit }: AppProps) {
  const [state, setState] = useState<DashboardState>(store.getState());
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [warningsExpanded, setWarningsExpanded] = useState(false);
  const [panelFocused, setPanelFocused] = useState(false);
  const [showDashboardPicker, setShowDashboardPicker] = useState(false);
  const [variableBarActive, setVariableBarActive] = useState(false);
  
  // Get terminal dimensions for responsive navigation
  const { width: terminalWidth } = useTerminalDimensions();

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });

    // Load dashboard and start refresh
    store.loadDashboard().then(() => {
      store.start();
    });

    return () => {
      unsubscribe();
      store.stop();
    };
  }, [store]);

  // Handle keyboard input
  useKeyboard((event) => {
    const key = event.name;

    // Quit
    if (key === "q" || key === "Q") {
      store.stop();
      onExit();
      return;
    }

    // Manual refresh
    if (key === "r" || key === "R") {
      store.refresh();
      return;
    }

    // Toggle warnings
    if (key === "w" || key === "W") {
      setWarningsExpanded((prev) => !prev);
      return;
    }

    // Dashboard picker
    if (key === "d" || key === "D") {
      if (!panelFocused && !showDashboardPicker && !variableBarActive) {
        setShowDashboardPicker(true);
      }
      return;
    }

    // Variable bar
    if (key === "v" || key === "V") {
      if (!panelFocused && !showDashboardPicker && state.variables.length > 0) {
        setVariableBarActive(true);
      }
      return;
    }

    // Panel focus mode
    if (key === "return" || key === "enter") {
      if (state.panels.length > 0 && !showDashboardPicker) {
        setPanelFocused(true);
      }
      return;
    }

    if (key === "escape") {
      if (variableBarActive) {
        setVariableBarActive(false);
      } else if (showDashboardPicker) {
        setShowDashboardPicker(false);
      } else {
        setPanelFocused(false);
      }
      return;
    }

    // Navigation (only when not in focus mode or other modals)
    if (panelFocused || showDashboardPicker || variableBarActive) return;
    
    const panelCount = state.panels.length;
    if (panelCount === 0) return;

    // Use responsive column count matching PanelGrid
    const columns = getResponsiveColumns(terminalWidth);
    const row = Math.floor(focusedIndex / columns);
    const col = focusedIndex % columns;
    const totalRows = Math.ceil(panelCount / columns);

    let newIndex = focusedIndex;

    if (key === "left" && col > 0) {
      newIndex = focusedIndex - 1;
    } else if (key === "right" && col < columns - 1 && focusedIndex + 1 < panelCount) {
      newIndex = focusedIndex + 1;
    } else if (key === "up" && row > 0) {
      newIndex = focusedIndex - columns;
    } else if (key === "down" && row < totalRows - 1) {
      const targetIndex = focusedIndex + columns;
      if (targetIndex < panelCount) {
        newIndex = targetIndex;
      }
    }

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex);
    }
  });

  // Render a panel based on its type
  const renderPanel = (panelData: PanelData, index: number) => {
    const focused = index === focusedIndex;
    const { panel } = panelData;

    switch (panel.type) {
      case "timeseries":
        return (
          <TimeSeriesRenderer
            key={panel.id}
            data={panelData}
            focused={focused}
          />
        );
      case "stat":
        return (
          <StatRenderer
            key={panel.id}
            data={panelData}
            store={store}
            focused={focused}
          />
        );
      case "table":
        return (
          <TableRenderer
            key={panel.id}
            data={panelData}
            focused={focused}
          />
        );
      default:
        return null;
    }
  };

  // Show loading state
  if (state.loading && state.panels.length === 0) {
    return (
      <box flexDirection="column" width="100%" height="100%">
        <Header
          title="Loading..."
          prometheusUrl={config.prometheus.url}
          lastRefresh={0}
          loading={true}
        />
        <box flexGrow={1} alignItems="center" justifyContent="center">
          <text fg="#ffff00">Loading dashboard...</text>
        </box>
      </box>
    );
  }

  // Show error state
  if (state.error && state.panels.length === 0) {
    return (
      <box flexDirection="column" width="100%" height="100%">
        <Header
          title="Error"
          prometheusUrl={config.prometheus.url}
          lastRefresh={0}
          loading={false}
        />
        <box flexGrow={1} alignItems="center" justifyContent="center">
          <text fg="#ff0000">Error: {state.error}</text>
        </box>
      </box>
    );
  }

  // Dashboard picker view
  if (showDashboardPicker) {
    return (
      <box flexDirection="column" width="100%" height="100%">
        <DashboardPicker
          directory={config.dashboard.directory || "./dashboards"}
          currentPath={state.dashboardPath}
          onSelect={async (path) => {
            setShowDashboardPicker(false);
            setFocusedIndex(0);
            await store.switchDashboard(path);
          }}
          onClose={() => setShowDashboardPicker(false)}
        />
      </box>
    );
  }

  // Focused panel view
  if (panelFocused && state.panels[focusedIndex]) {
    return (
      <box flexDirection="column" width="100%" height="100%">
        <FocusedPanel
          data={state.panels[focusedIndex]!}
          store={store}
        />
      </box>
    );
  }

  return (
    <box flexDirection="column" width="100%" height="100%">
      <Header
        title={state.title}
        prometheusUrl={config.prometheus.url}
        lastRefresh={state.lastRefresh}
        loading={state.loading}
      />

      {/* Warnings bar */}
      <WarningsBar warnings={state.warnings} expanded={warningsExpanded} />

      {/* Variable bar */}
      {state.variables.length > 0 && (
        <VariableBar
          variables={state.variables}
          values={state.variableValues}
          availableOptions={state.variableOptions}
          onValueChange={(name, value) => store.setVariableValue(name, value)}
          active={variableBarActive}
          onActivate={() => setVariableBarActive(true)}
          onDeactivate={() => setVariableBarActive(false)}
        />
      )}

      {/* Panel grid */}
      {state.panels.length > 0 ? (
        <PanelGrid>
          {state.panels.map((panelData, index) => renderPanel(panelData, index))}
        </PanelGrid>
      ) : (
        <box flexGrow={1} alignItems="center" justifyContent="center">
          <text fg="#666666">No supported panels found</text>
        </box>
      )}
    </box>
  );
}
