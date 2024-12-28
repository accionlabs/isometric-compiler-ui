import React from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';

interface SaveDiagramDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (fileName: string) => Promise<void>;
    fileName: string;
    setFileName: (fileName: string) => void;
}

const SaveDiagramDialog: React.FC<SaveDiagramDialogProps> = ({
    isOpen,
    onClose,
    onSave,
    fileName,
    setFileName
}) => {
    const [isSaving, setIsSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const cleanup = React.useCallback(() => {
        // Clear any active focus before closing
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        // Ensure body has focus
        document.body.focus();
        onClose();
    }, [onClose]);

    // Reset state when dialog opens
    React.useEffect(() => {
        if (isOpen) {
            setIsSaving(false);
            setError(null);
            // Focus input after dialog opens
            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        }
    }, [isOpen, fileName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!fileName.trim()) {
            setError('File name is required');
            return;
        }

        setFileName(fileName);

        if (isSaving) return;

        try {
            setIsSaving(true);
            setError(null);
            
            // First ensure no focus is trapped
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }

            // Close the dialog
            cleanup();

            // Then perform the save operation
            await onSave(fileName);
        } catch (error) {
            console.error('Error in save process:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog 
            open={isOpen} 
            onOpenChange={(open) => {
                if (!open) cleanup();
            }}
        >
            <DialogContent 
                onInteractOutside={(e) => {
                    if (isSaving) e.preventDefault();
                }}
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    inputRef.current?.focus();
                }}
                onCloseAutoFocus={(e) => {
                    e.preventDefault();
                    document.body.focus();
                }}
            >
                <DialogHeader>
                    <DialogTitle>Save Diagram</DialogTitle>
                    <DialogDescription>
                        Enter a name for your diagram file.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fileName">
                            File Name
                        </Label>
                        <Input
                            ref={inputRef}
                            id="fileName"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="Enter file name"
                            className="w-full bg-gray-700 text-white border-gray-600"
                            disabled={isSaving}
                            aria-invalid={error ? 'true' : 'false'}
                            aria-describedby={error ? 'fileName-error' : undefined}
                        />
                        {error && (
                            <div id="fileName-error" className="text-red-400 text-sm" role="alert">
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-gray-700 hover:bg-gray-600"
                            disabled={isSaving}
                            onClick={() => {
                                if (document.activeElement instanceof HTMLElement) {
                                    document.activeElement.blur();
                                }
                                cleanup();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!fileName.trim() || isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default SaveDiagramDialog;