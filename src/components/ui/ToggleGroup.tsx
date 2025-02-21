// @/components/ui/ToggleGroup.tsx

import React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "../../lib/utils";

export interface ToggleGroupOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
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
        className={cn("flex gap-2", className)}
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
                    value === option.value
                        ? " text-white  bg-customLightGray"
                        : " text-gray-200 bg-customGray2"
                )}
            >
                <div className="flex gap-3 justify-center items-center">
                    <div>{option.icon}</div>
                    <div>{option.label}</div>
                </div>
            </ToggleGroupPrimitive.Item>
        ))}
    </ToggleGroupPrimitive.Root>
));

ToggleGroup.displayName = "ToggleGroup";

export { ToggleGroup };
