// @/panels/SaveComponentDialog.tsx

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface GitRepoDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (url: string, token: string) => void;
}

const GitRepoDialog: React.FC<GitRepoDialogProps> = ({
    isOpen,
    onClose,
    onSubmit
}) => {
    const [url, seturl] = useState("");
    const [token, setToken] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!url.trim()) {
            setError("Repo url is required");
            return;
        }

        handleSaveComponent();
    };

    const handleSaveComponent = () => {
        onSubmit(url, token);
        handleClose();
    };

    const handleClose = () => {
        seturl("");
        setError(null);
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
                        <DialogTitle>Attach Git Repository</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">
                                Git Repository url *
                            </label>
                            <Input
                                value={url}
                                onChange={(e) => seturl(e.target.value)}
                                placeholder="Enter repository url"
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
                                Git Repository Token
                            </label>
                            <Input
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Enter repository token"
                                className="w-full bg-customLightGray text-white border-gray-600"
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
                                disabled={!url.trim()}
                            >
                                Attach
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default GitRepoDialog;
