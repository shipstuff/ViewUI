import React, { useState, useEffect } from "react";
import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import type { TemplateVariable } from "../grafana/types.ts";
import type { VariableValues } from "../grafana/variables.ts";

interface VariableBarProps {
  variables: TemplateVariable[];
  values: VariableValues;
  availableOptions: Map<string, string[]>;
  onValueChange: (name: string, value: string) => void;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}

export function VariableBar({
  variables,
  values,
  availableOptions,
  onValueChange,
  active,
  onActivate,
  onDeactivate,
}: VariableBarProps) {
  const [selectedVarIndex, setSelectedVarIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(0);

  if (variables.length === 0) {
    return null;
  }

  const selectedVar = variables[selectedVarIndex];
  const options = selectedVar ? (availableOptions.get(selectedVar.name) ?? selectedVar.options ?? []) : [];
  const currentValue = selectedVar ? (values.get(selectedVar.name) ?? "") : "";

  // Handle keyboard input when active
  useKeyboard((event) => {
    if (!active) return;

    const key = event.name;

    if (key === "escape") {
      if (showDropdown) {
        setShowDropdown(false);
      } else {
        onDeactivate();
      }
      return;
    }

    if (showDropdown) {
      // Dropdown navigation
      if (key === "up" && dropdownIndex > 0) {
        setDropdownIndex(dropdownIndex - 1);
      } else if (key === "down" && dropdownIndex < options.length - 1) {
        setDropdownIndex(dropdownIndex + 1);
      } else if (key === "return" || key === "enter") {
        if (options[dropdownIndex] && selectedVar) {
          onValueChange(selectedVar.name, options[dropdownIndex]!);
          setShowDropdown(false);
        }
      }
    } else {
      // Variable selection
      if (key === "left" && selectedVarIndex > 0) {
        setSelectedVarIndex(selectedVarIndex - 1);
      } else if (key === "right" && selectedVarIndex < variables.length - 1) {
        setSelectedVarIndex(selectedVarIndex + 1);
      } else if (key === "return" || key === "enter") {
        if (options.length > 0) {
          setDropdownIndex(options.indexOf(currentValue) || 0);
          setShowDropdown(true);
        }
      }
    }
  });

  return (
    <box flexDirection="column" paddingLeft={1} paddingRight={1}>
      {/* Variable selector row */}
      <box flexDirection="row">
        <text fg={active ? "#00ffff" : "#666666"}>
          {active ? "▶ " : "  "}Variables:{" "}
        </text>
        {variables.map((v, i) => {
          const isSelected = active && i === selectedVarIndex;
          const value = values.get(v.name) ?? "";
          
          return (
            <box key={v.name} marginRight={2}>
              <text fg={isSelected ? "#00ffff" : "#888888"}>
                {v.label || v.name}:
              </text>
              <text
                fg={isSelected ? "#ffffff" : "#aaaaaa"}
                attributes={isSelected ? TextAttributes.BOLD : undefined}
              >
                {" "}{value || "(none)"}
              </text>
            </box>
          );
        })}
        {!active && (
          <text fg="#666666">[v to edit]</text>
        )}
      </box>

      {/* Dropdown */}
      {showDropdown && options.length > 0 && (
        <box
          flexDirection="column"
          marginLeft={2}
          marginTop={1}
          borderStyle="single"
          borderColor="#00ffff"
          padding={1}
        >
          <text fg="#00ffff" attributes={TextAttributes.BOLD}>
            Select value for {selectedVar?.label || selectedVar?.name}:
          </text>
          {options.slice(0, 10).map((opt, i) => {
            const isSelected = i === dropdownIndex;
            const isCurrent = opt === currentValue;
            
            return (
              <box key={opt}>
                <text fg={isSelected ? "#00ffff" : "#666666"}>
                  {isSelected ? "▶ " : "  "}
                </text>
                <text
                  fg={isSelected ? "#ffffff" : "#888888"}
                  attributes={isSelected ? TextAttributes.BOLD : undefined}
                >
                  {opt}
                </text>
                {isCurrent && (
                  <text fg="#00ff00"> ✓</text>
                )}
              </box>
            );
          })}
          {options.length > 10 && (
            <text fg="#666666">...and {options.length - 10} more</text>
          )}
        </box>
      )}
    </box>
  );
}
