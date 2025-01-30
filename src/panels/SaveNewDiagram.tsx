// @/panels/SaveComponentDialog.tsx

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/Dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { componentLibraryManager } from "@/lib/componentLib";

interface SaveComponentDialogProps {
    isOpen: boolean;
    isPending: boolean;
    onClose: () => void;
    onSave: (name: string, description: string) => void;
}

const SaveNewDiagram: React.FC<SaveComponentDialogProps> = ({
    isOpen,
    onClose,
    onSave,
    isPending
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) {
            setError("Component name and category is required");
            return;
        }
        if (!name.trim()) {
            setError("Component name is required");
            return;
        }

        // Check if component with this name already exists
        if (componentLibraryManager.hasComponent(name)) {
            setShowOverwriteDialog(true);
            return;
        }
        onSave(name, description);
    };

    const handleClose = () => {
        setName("");
        setDescription("");
        setError(null);
        setShowOverwriteDialog(false);
        onClose();
    };
    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent
                    className="bg-customGray text-white"
                    aria-describedby="dialog-description"
                >
                    <DialogHeader>
                        <DialogTitle>Save New Diagram</DialogTitle>
                    </DialogHeader>

                    {/* Hidden description for screen readers */}
                    <span id="dialog-description" className="sr-only">
                        Create a new diagram with current composition
                    </span>

                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">
                                Diagram Name *
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
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
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter diagram description"
                                className="w-full  text-white bg-customLightGray"
                                rows={3}
                            />
                        </div>

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
                                {isPending ? "Saving..." : "Save Diagram"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={showOverwriteDialog}
                onOpenChange={setShowOverwriteDialog}
            >
                <AlertDialogContent className="bg-gray-800 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Overwrite Existing Component?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            A component with the name "{name}" already exists.
                            Do you want to overwrite it?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setShowOverwriteDialog(false)}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => onSave(name, description)}
                        >
                            Overwrite
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default SaveNewDiagram;
