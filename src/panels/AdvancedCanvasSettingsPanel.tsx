// @/panels/AdvancedCanvasSettings.tsx

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { CanvasSettingsTab } from "./CanvasSettingsTab";
import { MetadataSettingsTab } from "./MetadataSettingsTab";
import { LayerSettingsTab } from "./LayerSettingsTab";
import { CanvasSize, CanvasSettings } from "@/Types";
import styles from "@/styles/AdvancedCanvasSettings.module.css";
import { DEFAULT_SETTINGS } from "@/Constants";

interface AdvancedCanvasSettingsProps {
    onSaveSettings: (settings: CanvasSettings) => void;
    initialSettings?: Partial<CanvasSettings>;
}

const STORAGE_KEY = "canvasSettings";

export const AdvancedCanvasSettings: React.FC<AdvancedCanvasSettingsProps> = ({
    onSaveSettings,
    initialSettings = {}
}) => {
    const [settings, setSettings] = useState<CanvasSettings>(() => {
        const savedSettings = localStorage.getItem(STORAGE_KEY);
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
        const newSettings = function () {
            if (category === "canvas") {
                return {
                    ...settings,
                    canvas: {
                        ...settings.canvas,
                        [key]: value
                    }
                };
            } else if (category === "metadataLabel") {
                return {
                    ...settings,
                    metadataLabel: {
                        ...settings.metadataLabel,
                        [key]: value
                    }
                };
            } else if (category === "layerLabel") {
                return {
                    ...settings,
                    layerLabel: {
                        ...settings.layerLabel,
                        [key]: value
                    }
                };
            }
            return settings;
        };
        // console.log("new settings", newSettings());
        setSettings(newSettings());
        setHasChanges(true);
    };

    const handleSave = () => {
        onSaveSettings(settings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        setHasChanges(false);
    };

    useEffect(() => {
        console.log("Settings updated:", settings);
    }, [settings]);
    return (
        <div className={styles.settingsContainer}>
            <Tabs defaultValue="canvas" className={styles.tabs}>
                <TabsList className={styles.tabList}>
                    <TabsTrigger value="canvas" className={styles.tabTrigger}>
                        Canvas
                    </TabsTrigger>
                    <TabsTrigger value="metadata" className={styles.tabTrigger}>
                        Metadata Labels
                    </TabsTrigger>
                    <TabsTrigger value="layer" className={styles.tabTrigger}>
                        Layer Labels
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="canvas" className={styles.tabContent}>
                    <div className={styles.tabPanel}>
                        <CanvasSettingsTab
                            canvas={settings.canvas}
                            onChange={(key, value) =>
                                updateSettings("canvas", key, value)
                            }
                        />
                    </div>
                </TabsContent>

                <TabsContent value="metadata" className={styles.tabContent}>
                    <div className={styles.tabPanel}>
                        <MetadataSettingsTab
                            settings={settings.metadataLabel}
                            onChange={(key, value) =>
                                updateSettings("metadataLabel", key, value)
                            }
                        />
                    </div>
                </TabsContent>

                <TabsContent value="layer" className={styles.tabContent}>
                    <div className={styles.tabPanel}>
                        <LayerSettingsTab
                            settings={settings.layerLabel}
                            onChange={(key, value) =>
                                updateSettings("layerLabel", key, value)
                            }
                        />
                    </div>
                </TabsContent>
            </Tabs>

            {hasChanges && (
                <div className="flex justify-end mt-4">
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
