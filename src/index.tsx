import { TextAttributes, createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { useState, useCallback } from "react";
import { usePrometheusMetrics } from "./hooks/usePrometheusMetrics";
import { useKeyboardHandler } from "./hooks/useKeyboardHandler";
import { Counter } from "./components/Counter";
import { MetricCard } from "./components/MetricCard";

function App() {
  const { metrics, isLoading } = usePrometheusMetrics();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleMove = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      setSelectedIndex((current) => {
        // Simple 2-column grid navigation
        const cols = 2;
        const rows = Math.ceil(metrics.length / cols);
        const currentRow = Math.floor(current / cols);
        const currentCol = current % cols;

        let newRow = currentRow;
        let newCol = currentCol;

        switch (direction) {
          case "up":
            newRow = Math.max(0, currentRow - 1);
            break;
          case "down":
            newRow = Math.min(rows - 1, currentRow + 1);
            break;
          case "left":
            newCol = Math.max(0, currentCol - 1);
            break;
          case "right":
            newCol = Math.min(cols - 1, currentCol + 1);
            break;
        }

        const newIndex = newRow * cols + newCol;
        return Math.min(newIndex, metrics.length - 1);
      });
    },
    [metrics.length]
  );

  useKeyboardHandler({
    selectedIndex,
    totalMetrics: metrics.length,
    onMove: handleMove,
  });

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box justifyContent="center" alignItems="flex-end" marginBottom={1}>
        <ascii-font font="tiny" text="ViewUI" />
        <text attributes={TextAttributes.DIM}>
          {isLoading ? " Loading..." : ` shipstuff:  ${metrics.length} metrics`}
        </text>
      </box>

      {isLoading ? (
        <box justifyContent="center" alignItems="center" flexGrow={1}>
          <text attributes={TextAttributes.DIM}>Loading metrics...</text>
        </box>
      ) : (
        <box flexDirection="row" flexGrow={1} gap={1}>
          <box flexDirection="column" flexGrow={1}>
            {metrics
              .filter((_, idx) => idx % 2 === 0)
              .map((metric, idx) => {
                const actualIndex = idx * 2;
                return metric.config.type === "counter" ? (
                  <Counter
                    key={metric.config.name}
                    metric={metric}
                    isSelected={selectedIndex === actualIndex}
                  />
                ) : (
                  <MetricCard
                    key={metric.config.name}
                    metric={metric}
                    isSelected={selectedIndex === actualIndex}
                  />
                );
              })}
          </box>
          <box flexDirection="column" flexGrow={1}>
            {metrics
              .filter((_, idx) => idx % 2 === 1)
              .map((metric, idx) => {
                const actualIndex = idx * 2 + 1;
                return metric.config.type === "counter" ? (
                  <Counter
                    key={metric.config.name}
                    metric={metric}
                    isSelected={selectedIndex === actualIndex}
                  />
                ) : (
                  <MetricCard
                    key={metric.config.name}
                    metric={metric}
                    isSelected={selectedIndex === actualIndex}
                  />
                );
              })}
          </box>
        </box>
      )}

      <box marginTop={1}>
        <text attributes={TextAttributes.DIM}>
          ↑/↓/←/→ or k/j/h/l: navigate  q: quit
        </text>
      </box>
    </box>
  );
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
