// @/components/ui/Select.tsx

import React from "react";
import * as Select from "@radix-ui/react-select";
import {
    CheckIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    options: SelectOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    value?: string;
    textSize?: string;
}

export const RadixSelect: React.FC<SelectProps> = ({
    options,
    onChange,
    placeholder,
    value,
    textSize = "text-sm"
}) => {
    return (
        <Select.Root value={value} onValueChange={onChange}>
            <Select.Trigger
                className={cn(
                    "inline-flex items-center justify-between rounded px-3 py-2 ",
                    "leading-none h-10 gap-1 bg-customLightGray text-white",
                    "shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2",
                    " focus:ring-offset-2 focus:ring-offset-gray-900",
                    "w-full",
                    "text-left",
                    textSize
                )}
            >
                <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left">
                    <Select.Value>{value || placeholder}</Select.Value>
                </span>
                <Select.Icon className="text-gray-400 flex-shrink-0">
                    <ChevronDownIcon />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content
                    className={cn(
                        "overflow-hidden bg-customGray rounded-md shadow-lg",
                        "border border-gray-700",
                        "z-50" // Ensure the content is above other elements
                    )}
                    position="popper" // Use popper positioning
                    sideOffset={5} // Add some offset from the trigger
                    align="start"
                    alignOffset={-4} // Slight negative offset to align with the trigger's border
                    avoidCollisions={true}
                    style={{ width: "var(--radix-select-trigger-width)" }} // Match trigger width
                >
                    <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-customGray text-gray-400 cursor-default">
                        <ChevronUpIcon className={textSize} />
                    </Select.ScrollUpButton>
                    <Select.Viewport className="p-1 max-h-60 overflow-y-auto">
                        {options.map((option) => (
                            <Select.Item
                                key={option.value}
                                value={option.value}
                                className={cn(
                                    "leading-none text-gray-200 rounded flex items-center",
                                    " pr-8 pl-6 py-3 relative select-none",
                                    "data-[highlighted]:outline-none data-[highlighted]:bg-customLightGray",
                                    "data-[highlighted]:text-white cursor-pointer",
                                    textSize
                                )}
                            >
                                <Select.ItemText>
                                    {option.label}
                                </Select.ItemText>
                                <Select.ItemIndicator className="absolute left-1 w-6 inline-flex items-center justify-center">
                                    <CheckIcon />
                                </Select.ItemIndicator>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-customGray text-gray-400 cursor-default">
                        <ChevronDownIcon />
                    </Select.ScrollDownButton>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
};
