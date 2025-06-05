import { cn } from "@/lib/utils";
import { Network } from "lucide-react";
import React from "react";

export default function MetricsButton({
    index,
    handleGenerateMetrics,
    isDisabled = false
}: {
    index: number;

    handleGenerateMetrics: (index: number) => void;
    isDisabled?: boolean;
}) {
    const [disabled, setDisabled] = React.useState(false);
    return (
        <button
            disabled={isDisabled || disabled}
            onClick={() => {
                handleGenerateMetrics(index);
                setDisabled(true);
            }}
            className={cn(
                "flex items-center gap-2",
                disabled && "cursor-not-allowed opacity-50"
            )}
        >
            <div className="max-w-xs px-2 py-1 bg-customGray2 cursor-pointer rounded-xl flex items-center">
                <div className="text-lightGray2 text-xs flex items-center gap-1">
                    <Network className="h-4 w-4" />
                    Generate Architecture Metrics
                </div>
            </div>
            {/* {!isGherkinScriptQuery && <Eye size={16} className="cursor-pointer" />} */}
        </button>
    );
}
