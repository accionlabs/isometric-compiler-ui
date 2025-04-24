// LayerSettingsTab.tsx
import React from "react";
import { Input } from "@/components/ui/Input";
import { RadixSelect } from "@/components/ui/Select";
import { LayerLabelSettings } from "@/Types";
import { Checkbox } from "@/components/ui/Checkbox";

export const WEB_SAFE_FONTS = [
    { value: "Arial", label: "Arial" },
    { value: "Helvetica", label: "Helvetica" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Times", label: "Times" },
    { value: "Courier New", label: "Courier New" },
    { value: "Courier", label: "Courier" },
    { value: "Verdana", label: "Verdana" },
    { value: "Georgia", label: "Georgia" },
    { value: "Palatino", label: "Palatino" },
    { value: "Garamond", label: "Garamond" },
    { value: "Bookman", label: "Bookman" },
    { value: "Comic Sans MS", label: "Comic Sans MS" },
    { value: "Trebuchet MS", label: "Trebuchet MS" },
    { value: "Arial Black", label: "Arial Black" },
    { value: "sans-serif", label: "Sans-serif" }
];

interface LayerSettingsTabProps {
    settings: LayerLabelSettings;
    onChange: (
        key: keyof LayerLabelSettings,
        value: number | string | boolean
    ) => void;
}

export const LayerSettingsTab: React.FC<LayerSettingsTabProps> = ({
    settings,
    onChange
}) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                    Width
                </label>
                <Input
                    type="number"
                    value={settings.width}
                    onChange={(e) =>
                        onChange("width", parseInt(e.target.value))
                    }
                    min={1}
                    className="bg-gray-700 text-white"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                    Line Spacing
                </label>
                <Input
                    type="number"
                    value={settings.lineSpacing}
                    onChange={(e) =>
                        onChange("lineSpacing", parseFloat(e.target.value))
                    }
                    step="0.1"
                    min="1"
                    className="bg-gray-700 text-white"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                    Font Family
                </label>
                <RadixSelect
                    options={WEB_SAFE_FONTS}
                    value={settings.fontFamily}
                    onChange={(value) => onChange("fontFamily", value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                    Font Size
                </label>
                <Input
                    type="number"
                    value={settings.fontSize}
                    onChange={(e) =>
                        onChange("fontSize", parseInt(e.target.value))
                    }
                    min={1}
                    className="bg-gray-700 text-white"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                    Font Weight
                </label>
                <RadixSelect
                    options={[
                        { value: "normal", label: "Normal" },
                        { value: "bold", label: "Bold" }
                    ]}
                    value={settings.fontWeight}
                    onChange={(value) => onChange("fontWeight", value)}
                />
            </div>
            {/* <div className="flex items-center">
                <Checkbox
                    id="show-attachment-points"
                    checked={settings.hideLabels}
                    onCheckedChange={(check) => onChange("hideLabels", check)}
                    className="mr-2 text-white"
                />
                <label
                    htmlFor="show-attachment-points"
                    className="text-sm text-white"
                >
                    Hide Labels
                </label>
            </div> */}
        </div>
    );
};
