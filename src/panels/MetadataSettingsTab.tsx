// MetadataSettingsTab.tsx
import React from 'react';
import { Input } from '@/components/ui/Input';
import { MetadataLabelSettings } from '@/Types';

interface MetadataSettingsTabProps {
    settings: MetadataLabelSettings;
    onChange: (key: keyof MetadataLabelSettings, value: number) => void;
}

export const MetadataSettingsTab: React.FC<MetadataSettingsTabProps> = ({
    settings,
    onChange
}) => {
    const handleAngleChange = (degrees: number) => {
        const radians = (degrees * Math.PI) / 180;
        onChange('smoothingAngle', radians);
    };

    const getCurrentAngleInDegrees = () => {
        return Math.round((settings.smoothingAngle * 180) / Math.PI);
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                    Minimum X Spacing
                </label>
                <Input
                    type="number"
                    value={settings.minSpacing}
                    onChange={(e) => onChange('minSpacing', parseInt(e.target.value))}
                    min={1}
                    className="bg-gray-700 text-white"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                    Minimum Y Spacing
                </label>
                <Input
                    type="number"
                    value={settings.minYSpacing}
                    onChange={(e) => onChange('minYSpacing', parseInt(e.target.value))}
                    min={1}
                    className="bg-gray-700 text-white"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                    Smoothing Angle (degrees)
                </label>
                <Input
                    type="number"
                    value={getCurrentAngleInDegrees()}
                    onChange={(e) => handleAngleChange(parseInt(e.target.value))}
                    min={0}
                    max={360}
                    className="bg-gray-700 text-white"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                    Step Size
                </label>
                <Input
                    type="number"
                    value={settings.stepSize}
                    onChange={(e) => onChange('stepSize', parseInt(e.target.value))}
                    min={1}
                    className="bg-gray-700 text-white"
                />
            </div>
        </div>
    );
};