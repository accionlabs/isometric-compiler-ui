// @/panels/SettingsPanel.tsx

import React, { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import LibraryManager from "./LibraryManager";
import { Shape, CanvasSettings } from "../Types";
import { StorageType } from "../lib/fileOperations";
import { ToggleGroup, ToggleGroupOption } from "../components/ui/ToggleGroup";
import { AdvancedCanvasSettings } from "./AdvancedCanvasSettingsPanel";
import ProgressDialog from "./ProgressDialog";
import { Node, useReactFlow } from "@xyflow/react";


interface SettingsPanelProps {
    canvasSize: { width: number; height: number };
    onSetCanvasSize: (size: { width: number; height: number }) => void;
    onSetCanvasSettings: (settings: CanvasSettings) => void;
    fileName: string;
    setFileName: (name: string) => void;
    activeLibrary: string;
    onLibraryChange: (libraryId: string) => void;
    onSaveDiagram: () => void;
    onLoadDiagram: (file?: File) => Promise<void>;
    folderPath: string;
    setFolderPath: (path: string) => void;
    onDownloadSVG: () => void;
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
    fileName,
    setFileName,
    activeLibrary,
    onLibraryChange,
    onSaveDiagram,
    onLoadDiagram,
    folderPath,
    setFolderPath,
    onDownloadSVG,
    showAttachmentPoints,
    setShowAttachmentPoints,
    onUpdateShapes,
    storageType,
    onStorageTypeChange
}) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const storageOptions: ToggleGroupOption[] = [
        { value: StorageType.Local, label: "Local File" },
        { value: StorageType.GoogleDrive, label: "Google Drive" }
    ];

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleStorageTypeChange = (value: string) => {
        onStorageTypeChange(value as StorageType);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onLoadDiagram(file);
            // Clear the input so the same file can be selected again if needed
            event.target.value = "";
        }
    };

    const handleSaveCanvasSettings = (settings: CanvasSettings) => {
        onSetCanvasSize(settings.canvas.canvasSize);
        setShowAttachmentPoints(settings.canvas.showAttachmentPoints);
        // Store other settings in localStorage - they will be used by other components
        onSetCanvasSettings(settings);
    };

    const handleDownloadSVG = async () => {
        console.log('Starting Image download...');
        setIsDownloading(true);
        try {
            await onDownloadSVG();
            console.log('Image download completed');
        } catch (error) {
            console.error('Error downloading Image:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex flex-col h-full p-4 overflow-y-auto">
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Display Settings</h3>
                <AdvancedCanvasSettings
                    initialSettings={{
                        canvas: {
                            canvasSize,
                            showAttachmentPoints
                        }
                    }}
                    onSaveSettings={handleSaveCanvasSettings}
                />
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Diagram Settings</h3>
                <label className="block mb-2">File Name:</label>
                <Input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 rounded mb-4"
                    placeholder="diagram.svg"
                />

                <label className="block mb-2">Storage Location:</label>
                <div className="mb-4">
                    <ToggleGroup
                        options={storageOptions}
                        value={storageType}
                        onValueChange={handleStorageTypeChange}
                    />
                </div>

                {storageType === StorageType.GoogleDrive && (
                    <div className="mb-4">
                        <label className="block mb-2">
                            Google Drive Folder Path:
                        </label>
                        <Input
                            type="text"
                            value={folderPath}
                            onChange={(e) => setFolderPath(e.target.value)}
                            className="w-full bg-gray-700 text-white p-2 rounded mb-4"
                            placeholder="My Diagrams"
                        />
                    </div>
                )}

                <div className="flex space-x-2">
                    <Button onClick={onSaveDiagram} className="flex-1">
                        Save Diagram
                    </Button>
                    {storageType === StorageType.Local ? (
                        <>
                            <Button
                                onClick={handleFileSelect}
                                className="flex-1"
                            >
                                Load Diagram
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </>
                    ) : (
                        <Button
                            onClick={() => onLoadDiagram()}
                            className="flex-1"
                        >
                            Load Diagram
                        </Button>
                    )}{" "}
                    <Button onClick={handleDownloadSVG} className="flex-1">
                        Download Image
                    </Button>
                </div>
            </div>

            <div className="mb-6">
                <LibraryManager
                    activeLibrary={activeLibrary}
                    onLibraryChange={onLibraryChange}
                    onUpdateShapes={onUpdateShapes}
                />
            </div>

            <ProgressDialog
                open={isDownloading}
                message="Processing SVG for download..."
            />
        </div>
    );
};

export default SettingsPanel;