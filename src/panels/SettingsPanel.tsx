// @/panels/SettingsPanel.tsx

import React, { useState } from "react";
import { AdvancedCanvasSettings } from "./AdvancedCanvasSettingsPanel";
import LibraryManager from "./LibraryManager";
import { Shape, CanvasSettings } from "../Types";
import { StorageType } from "../lib/fileOperations";

interface SettingsPanelProps {
    canvasSize: { width: number; height: number };
    onSetCanvasSize: (size: { width: number; height: number }) => void;
    onSetCanvasSettings: (settings: CanvasSettings) => void;
    activeLibrary: string;
    onLibraryChange: (libraryId: string) => void;
    folderPath: string;
    setFolderPath: (path: string) => void;
    showAttachmentPoints: boolean;
    setShowAttachmentPoints: (show: boolean) => void;
    onUpdateShapes: (shapes: Shape[]) => void;
    storageType: StorageType;
    onStorageTypeChange: (type: StorageType) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    canvasSize,
    onSetCanvasSize,
    onSetCanvasSettings,
    activeLibrary,
    onLibraryChange,
    folderPath,
    setFolderPath,
    showAttachmentPoints,
    setShowAttachmentPoints,
    onUpdateShapes,
    storageType,
    onStorageTypeChange
}) => {
    return (
        <div className="flex flex-col space-y-6">
            <section>
                <h2 className="text-xl font-bold mb-4 text-white">Display Settings</h2>
                <AdvancedCanvasSettings
                    initialSettings={{
                        canvas: {
                            canvasSize,
                            showAttachmentPoints
                        }
                    }}
                    onSaveSettings={settings => {
                        onSetCanvasSize(settings.canvas.canvasSize);
                        setShowAttachmentPoints(settings.canvas.showAttachmentPoints);
                        onSetCanvasSettings(settings);
                    }}
                />
            </section>

            <section>
                <h2 className="text-xl font-bold mb-4 text-white">Shape Libraries</h2>
                <div className="bg-gray-800/50 rounded-lg p-4">
                    <LibraryManager
                        activeLibrary={activeLibrary}
                        onLibraryChange={onLibraryChange}
                        onUpdateShapes={onUpdateShapes}
                    />
                </div>
            </section>
        </div>
    );
};

export default SettingsPanel;