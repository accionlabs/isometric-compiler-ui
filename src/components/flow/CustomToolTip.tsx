import * as React from "react";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider
} from "../ui/tooltip"; // Adjust the import path

interface CustomTooltipProps {
    action: React.ReactNode; // The element triggering the tooltip
    content?: string; // Tooltip content
    header?: string; // Optional header for the tooltip
    side?: "top" | "bottom" | "left" | "right"; // Tooltip position
    sideOffset?: number; // Offset for tooltip positioning
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
    action,
    content,
    header,
    side = "top",
    sideOffset = 4
}) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{action}</TooltipTrigger>
                <TooltipContent side={side} sideOffset={sideOffset}>
                    {header && <div className="font-bold mb-1">{header}</div>}
                    <div>{content}</div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default CustomTooltip;
