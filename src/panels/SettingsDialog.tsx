// @/components/SettingsDialog.tsx

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/Dialog";
import { AdvancedCanvasSettings } from "@/panels/AdvancedCanvasSettingsPanel";
import { CanvasSettings } from "@/Types";

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    settings: CanvasSettings | null;
    canvasSize: { width: number; height: number };
    onSetCanvasSize: (size: { width: number; height: number }) => void;
    onSetCanvasSettings: (settings: CanvasSettings) => void;
    showAttachmentPoints: boolean;
    setShowAttachmentPoints: (show: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
    isOpen,
    onClose,
    canvasSize,
    settings,
    onSetCanvasSize,
    onSetCanvasSettings,
    showAttachmentPoints,
    setShowAttachmentPoints,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[800px] bg-gray-800 text-white overflow-hidden">
                <DialogHeader className="px-6 py-4">
                    <DialogTitle>Display Settings</DialogTitle>
                </DialogHeader>
                
                <div className="p-6">
                    <AdvancedCanvasSettings
                        initialSettings={{
                            canvas: {
                                canvasSize,
                                showAttachmentPoints
                            }
                        }}
                        onSaveSettings={(settings) => {
                            onSetCanvasSize(settings.canvas.canvasSize);
                            setShowAttachmentPoints(settings.canvas.showAttachmentPoints);
                            onSetCanvasSettings(settings);
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SettingsDialog;