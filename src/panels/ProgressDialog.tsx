// @/panels/ProgressDialog.tsx

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Loader2 } from 'lucide-react';

interface ProgressDialogProps {
    open: boolean;
    message: string;
}

const ProgressDialog: React.FC<ProgressDialogProps> = ({ open, message }) => {
    return (
        <Dialog open={open}>
            <DialogContent className="bg-gray-800 text-white">
                <DialogHeader>
                    <DialogTitle>Processing SVG</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-4 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-sm text-gray-300">{message}</p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProgressDialog;