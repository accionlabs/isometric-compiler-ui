import React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from "../../lib/utils";

export interface ToggleGroupOption {
  value: string;
  label: string;
}

interface ToggleGroupProps {
  options: ToggleGroupOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ className, options, value, onValueChange, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex space-x-2", className)}
    type="single"
    value={value}
    onValueChange={(value) => {
      if (value) onValueChange(value);
    }}
    {...props}
  >
    {options.map((option) => (
      <ToggleGroupPrimitive.Item
        key={option.value}
        value={option.value}
        className={cn(
          "flex-1 py-2 px-4 rounded text-sm font-medium transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
          "border-2",
          value === option.value
            ? "bg-blue-600 text-white border-white shadow-inner"
            : "bg-gray-700 text-gray-200 border-gray-500 hover:bg-gray-600 hover:border-gray-400",
          value === option.value
            ? "transform scale-105"
            : "transform scale-100"
        )}
      >
        {option.label}
      </ToggleGroupPrimitive.Item>
    ))}
  </ToggleGroupPrimitive.Root>
));

ToggleGroup.displayName = "ToggleGroup";

export { ToggleGroup };