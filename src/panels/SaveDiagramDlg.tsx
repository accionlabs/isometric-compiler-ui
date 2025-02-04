// @/panels/SaveDiagramDialog.tsx

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/Dialog";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface SaveDiagramDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (fileName: string) => Promise<void>;
    initialFileName: string;
}

const SaveDiagramDialog: React.FC<SaveDiagramDialogProps> = ({
    isOpen,
    onClose,
    onSave,
    initialFileName
}) => {
    const [fileName, setFileName] = React.useState(initialFileName);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!fileName.trim()) {
            setError("File name is required");
            return;
        }

        handleSaveDiagram();
    };

    const handleSaveDiagram = async () => {
        try {
            await onSave(fileName.trim());
        } catch (error) {
            console.log("Unable to save diagram:", error);
            setError("Unable to save diagram");
            handleClose();
        } finally {
            setTimeout(() => handleClose(), 5000);
        }
    };

    const handleClose = () => {
        setFileName("");
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="bg-gray-800 text-white"
                aria-describedby="dialog-description"
            >
                <DialogHeader>
                    <DialogTitle>Save Diagram</DialogTitle>
                </DialogHeader>

                {/* Hidden description for screen readers */}
                <span id="dialog-description" className="sr-only">
                    Save the composition as a diagram
                </span>

                <div className="space-y-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                            File Name *
                        </label>
                        <Input
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="Enter file name"
                            className="w-full bg-gray-700 text-white border-gray-600"
                        />
                        {error && (
                            <div className="text-red-400 text-sm mt-1">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button
                            onClick={handleClose}
                            className="bg-gray-600 hover:bg-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!fileName.trim()}
                        >
                            Save Diagram
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SaveDiagramDialog;
