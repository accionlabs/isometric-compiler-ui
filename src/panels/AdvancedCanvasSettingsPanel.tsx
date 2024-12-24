// @/panels/AdvancedCanvasSettings.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { CanvasSettingsTab } from './CanvasSettingsTab';
import { MetadataSettingsTab } from './MetadataSettingsTab';
import { LayerSettingsTab } from './LayerSettingsTab';
import { CanvasSize,MetadataLabelSettings,LayerLabelSettings, CanvasSettings } from '@/Types';

export const DEFAULT_SETTINGS: CanvasSettings = {
    canvas: {
        canvasSize: {
            width: 1000,
            height: 1000
        },
        showAttachmentPoints: false
    },
    metadataLabel: {
        minSpacing: 200,
        minYSpacing: 17,
        smoothingAngle: (120 * Math.PI) / 180, // 120 degrees in radians
        stepSize: 20
    },
    layerLabel: {
        width: 200,
        lineSpacing: 1.2,
        fontFamily: 'sans-serif',
        fontSize: 21,
        fontWeight: 'bold'
    },
    showAttachmentPoints: false
};

interface AdvancedCanvasSettingsProps {
    onSaveSettings: (settings: CanvasSettings) => void;
    initialSettings?: Partial<CanvasSettings>;
}

const STORAGE_KEY = 'canvas-settings';

export const AdvancedCanvasSettings: React.FC<AdvancedCanvasSettingsProps> = ({
    onSaveSettings,
    initialSettings = {}
}) => {
    const [settings, setSettings] = useState<CanvasSettings>(() => {
        //const savedSettings = localStorage.getItem(STORAGE_KEY);
        const savedSettings = undefined;
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
        return { ...DEFAULT_SETTINGS, ...initialSettings };
    });

    const [hasChanges, setHasChanges] = useState(false);

    const updateSettings = (
        category: keyof CanvasSettings,
        key: string,
        value: number | string | boolean | CanvasSize
    ) => {
        setSettings(prev => {
            if (category === 'canvas') {
                return {
                    ...prev,
                    canvas: {
                        ...prev.canvas,
                        [key]: value
                    }
                };
            } else if (category === 'metadataLabel') {
                return {
                    ...prev,
                    metadataLabel: {
                        ...prev.metadataLabel,
                        [key]: value
                    }
                };
            } else if (category === 'layerLabel') {
                return {
                    ...prev,
                    layerLabel: {
                        ...prev.layerLabel,
                        [key]: value
                    }
                };
            }
            return prev;
        });
        setHasChanges(true);
    };

    const handleSave = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        onSaveSettings(settings);
        setHasChanges(false);
    };

    return (
        <div className="space-y-4">
            <Tabs defaultValue="canvas">
                <TabsList>
                    <TabsTrigger value="canvas">Canvas</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata Labels</TabsTrigger>
                    <TabsTrigger value="layer">Layer Labels</TabsTrigger>
                </TabsList>

                <TabsContent value="canvas">
                    <CanvasSettingsTab
                        canvas={settings.canvas}
                        onChange={(key, value) => updateSettings('canvas', key, value)}
                        onShowAttachmentPointsChange={(value) => 
                            setSettings(prev => ({ ...prev, showAttachmentPoints: value }))
                        }
                    />
                </TabsContent>

                <TabsContent value="metadata">
                    <MetadataSettingsTab
                        settings={settings.metadataLabel}
                        onChange={(key, value) => updateSettings('metadataLabel', key, value)}
                    />
                </TabsContent>

                <TabsContent value="layer">
                    <LayerSettingsTab
                        settings={settings.layerLabel}
                        onChange={(key, value) => updateSettings('layerLabel', key, value)}
                    />
                </TabsContent>
            </Tabs>

            {hasChanges && (
                <div className="flex justify-end">
                    <Button 
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Save Settings
                    </Button>
                </div>
            )}
        </div>
    );
};