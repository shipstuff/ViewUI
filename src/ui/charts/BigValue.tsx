import React from "react";

interface BigValueProps {
  value: string;
  color?: string;
  font?: "tiny" | "block" | "shade" | "slick" | "huge" | "grid" | "pallet";
}

/**
 * Large ASCII art number display for stat panels
 * Uses OpenTUI's ascii-font component for big, readable values
 * 
 * Font sizes (approximate):
 * - tiny: 4 lines tall
 * - block: 6 lines tall
 * - shade: 6 lines tall (with shading)
 * - slick: 5 lines tall
 * - huge: 10 lines tall
 * - grid: 7 lines tall
 * - pallet: 6 lines tall
 */
export function BigValue({
  value,
  color = "#ffffff",
  font = "block",  // Default to "block" - larger and more readable
}: BigValueProps) {
  return (
    <ascii-font 
      text={value} 
      font={font} 
      color={color}
    />
  );
}
