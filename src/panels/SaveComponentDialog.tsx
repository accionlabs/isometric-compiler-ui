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
import { useQuery } from "@tanstack/react-query";
import { RadixSelect } from "@/components/ui/Select";
import { getCategoriesFlat } from "@/services/categories";

interface SaveComponentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description: string, category: string) => void;
}

const SaveComponentDialog: React.FC<SaveComponentDialogProps> = ({
    isOpen,
    onClose,
    onSave
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
    const { data: categories } = useQuery({
        queryKey: ["categories_data_flat"],
        queryFn: getCategoriesFlat
    });
    const handleSubmit = () => {
        if (!name.trim() && !category) {
            setError("Component name and category is required");
            return;
        }
        if (!name.trim()) {
            setError("Component name is required");
            return;
        }
        if (!category) {
            setError("Category is required");
            return;
        }

        // Check if component with this name already exists
        if (componentLibraryManager.hasComponent(name)) {
            setShowOverwriteDialog(true);
            return;
        }
        handleSaveComponent();
    };

    const handleSaveComponent = () => {
        onSave(name.trim(), description.trim(), category);
        handleClose();
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
                        <DialogTitle>Save as Component</DialogTitle>
                    </DialogHeader>

                    {/* Hidden description for screen readers */}
                    <span id="dialog-description" className="sr-only">
                        Create a reusable component from the current composition
                    </span>

                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">
                                Component Name *
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
                                Category
                            </label>
                            <RadixSelect
                                options={
                                    categories?.data.map((category) => ({
                                        label: category.name,
                                        value: category._id
                                    })) ?? []
                                }
                                value={
                                    categories?.data.find(
                                        (catergory) =>
                                            catergory._id === category
                                    )?.name ?? ""
                                }
                                onChange={(value) => setCategory(value)}
                                placeholder="Select categoty"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">
                                Description
                            </label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter component description"
                                className="w-full  text-white bg-customLightGray"
                                rows={3}
                            />
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
                                disabled={!name.trim() || !category}
                            >
                                Save Component
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
                        <AlertDialogAction onClick={handleSaveComponent}>
                            Overwrite
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default SaveComponentDialog;
