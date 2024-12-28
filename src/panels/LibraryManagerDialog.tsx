// @/components/LibraryManagerDialog.tsx

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/Dialog";
import LibraryManager from "@/panels/LibraryManager";
import { Shape } from "@/Types";

interface LibraryManagerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    activeLibrary: string;
    onLibraryChange: (libraryId: string) => void;
    onUpdateShapes: (shapes: Shape[]) => void;
}

const LibraryManagerDialog: React.FC<LibraryManagerDialogProps> = ({
    isOpen,
    onClose,
    activeLibrary,
    onLibraryChange,
    onUpdateShapes
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[800px] max-h-[80vh] bg-gray-800 text-white overflow-hidden">
                <DialogHeader className="px-6 py-4">
                    <DialogTitle>Shape Libraries</DialogTitle>
                </DialogHeader>
                
                <div className="flex flex-col flex-1 min-h-0 p-6 overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        <LibraryManager
                            activeLibrary={activeLibrary}
                            onLibraryChange={onLibraryChange}
                            onUpdateShapes={onUpdateShapes}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LibraryManagerDialog;