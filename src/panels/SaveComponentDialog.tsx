import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface SaveComponentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description: string) => void;
}

const SaveComponentDialog: React.FC<SaveComponentDialogProps> = ({
    isOpen,
    onClose,
    onSave,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!name.trim()) {
            setError('Component name is required');
            return;
        }

        onSave(name.trim(), description.trim());
        setName('');
        setDescription('');
        setError(null);
        onClose();
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-gray-800 text-white">
                <DialogHeader>
                    <DialogTitle>Save as Component</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                            Component Name *
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter component name"
                            className="w-full bg-gray-700 text-white border-gray-600"
                        />
                        {error && (
                            <p className="text-red-400 text-sm mt-1">{error}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                            Description
                        </label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter component description"
                            className="w-full bg-gray-700 text-white border-gray-600"
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
                            disabled={!name.trim()}
                        >
                            Save Component
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SaveComponentDialog;