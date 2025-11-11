import { useKeyboard } from "@opentui/react";

interface UseKeyboardHandlerProps {
  selectedIndex: number;
  totalMetrics: number;
  onMove: (direction: "up" | "down" | "left" | "right") => void;
}

export function useKeyboardHandler({
  selectedIndex,
  totalMetrics,
  onMove,
}: UseKeyboardHandlerProps) {
  useKeyboard((key) => {
    // Always allow Ctrl+C to quit
    if (key.raw === "\u0003") {
      process.exit(0);
      return;
    }

    // Quit
    if (key.name === "q") {
      process.exit(0);
      return;
    }

    // Navigation
    if (key.name === "up" || key.name === "k") {
      onMove("up");
      return;
    }
    if (key.name === "down" || key.name === "j") {
      onMove("down");
      return;
    }
    if (key.name === "left" || key.name === "h") {
      onMove("left");
      return;
    }
    if (key.name === "right" || key.name === "l") {
      onMove("right");
      return;
    }
  });
}
