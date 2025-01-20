// @/components/LibraryManagerDialog.tsx

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/Dialog";
import LibraryManager from "@/panels/LibraryManager";
import { Component, Shape } from "@/Types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

interface LibraryManagerDialogProps {
    isOpen: boolean;
    onClose: () => void;

    element: Shape | Component;
}

const EditElementDialog: React.FC<LibraryManagerDialogProps> = ({
    isOpen,
    onClose,
    element
}) => {
    const [elementData, setElementData] = useState(element);
    const [uploadedSvg, setUploadedSvg] = useState<File | null>(null);
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[800px] max-h-[80vh] bg-gray-800 text-white overflow-hidden">
                <DialogHeader className="px-6 py-4">
                    <DialogTitle>Update : {elementData.name}</DialogTitle>
                </DialogHeader>

                <form className="space-y-4">
                    <div className="space-y-2 text-white">
                        <Label>Description</Label>
                        <Input
                            id="description"
                            value={elementData.description}
                            onChange={(e) =>
                                setElementData((prev) => ({
                                    ...prev,
                                    description: e.target.value
                                }))
                            }
                            autoComplete="off"
                            placeholder="Enter description"
                            aria-describedby="description of element"
                            className="w-full bg-gray-700 text-white border-gray-600"
                        />
                    </div>
                    {"type" in elementData && (
                        <div className="space-y-2 text-white">
                            <Label>upload svg</Label>
                            <Input
                                type="file"
                                accept=".svg"
                                multiple
                                onChange={(e) => {
                                    e.target.files?.[0] &&
                                        setUploadedSvg(e.target.files[0]);
                                }}
                                className="w-full bg-gray-700 text-white border-gray-600"
                                aria-describedby="upload new svg"
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-gray-700 hover:bg-gray-600"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button>Update</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditElementDialog;
