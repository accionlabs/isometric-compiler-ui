// @/panels/SaveComponentDialog.tsx

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/Dialog";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { componentLibraryManager } from "@/lib/componentLib";
import { DiagramInfo } from "@/Types";
type Mode = "save" | "clone" | "edit_details" | "delete";
interface SaveComponentDialogProps {
    isOpen: boolean;
    isPending: boolean;
    mode: Mode;
    onClose: () => void;
    onSubmit: (name: string, description: string) => void;
    diagramInfo: DiagramInfo | null;
}

const SaveNewDiagram: React.FC<SaveComponentDialogProps> = ({
    isOpen,
    onClose,
    mode,
    onSubmit,
    isPending,
    diagramInfo
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    const getheading: Record<Mode, string> = {
        save: "Save New Diagram",
        clone: "Clone Existing Diagram",
        edit_details: "Edit Diagram Details",
        delete: `Delete Diagram with name ${diagramInfo?.name}?`
    };
    const getSubmitButtonName: Record<Mode, string> = {
        save: "Save Diagram",
        clone: "Clone Diagram",
        edit_details: "Edit Diagram",
        delete: "Delete Diagram"
    };
    const getSubmitLoadingName: Record<Mode, string> = {
        save: "Saving...",
        clone: "Cloning...",
        edit_details: "Editing...",
        delete: "Deleting..."
    };

    const getDescription: Record<Mode, string> = {
        save: "Create a new diagram with current composition",
        clone: "Clone existing diagram with current composition",
        edit_details: "Edit existing diagram details with current composition",
        delete: "Delete existing diagram"
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            setError("Component name and category is required");
            return;
        }
        if (!name.trim()) {
            setError("Component name is required");
            return;
        }

        onSubmit(name, description);
    };

    const handleClose = () => {
        setName("");
        setDescription("");
        setError(null);
        onClose();
    };

    useEffect(() => {
        setName(diagramInfo?.name ?? "");
        setDescription(diagramInfo?.metadata?.description ?? "");
    }, [diagramInfo]);
    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent
                    className="bg-customGray text-white"
                    aria-describedby="dialog-description"
                >
                    <DialogHeader>
                        <DialogTitle>{getheading[mode]}</DialogTitle>
                    </DialogHeader>

                    {/* Hidden description for screen readers */}
                    <span id="dialog-description" className="sr-only">
                        {getDescription[mode]}
                    </span>

                    <div className="space-y-4 mt-4">
                        {mode !== "delete" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-1">
                                        Diagram Name *
                                    </label>
                                    <Input
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="Enter component name"
                                        className="w-full bg-customLightGray text-white border-gray-600"
                                    />
                                    {error && (
                                        <div className="text-red-400 text-sm mt-1">
                                            {error}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-1">
                                        Description
                                    </label>
                                    <Textarea
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        placeholder="Enter diagram description"
                                        className="w-full  text-white bg-customLightGray"
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex justify-end space-x-2">
                            <Button
                                onClick={handleClose}
                                disabled={isPending}
                                className="bg-gray-600 hover:bg-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={!name.trim() || isPending}
                            >
                                {isPending
                                    ? getSubmitLoadingName[mode]
                                    : getSubmitButtonName[mode]}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SaveNewDiagram;
