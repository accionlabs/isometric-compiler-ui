// @/panels/CanvasSettingsTab.tsx

import React, { useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { CanvasSize, CanvasSizeSettings } from '@/Types';

interface CanvasSettingsTabProps {
    canvas: CanvasSizeSettings;
    onChange: {
        (key: 'canvasSize', value: CanvasSize): void;
        (key: 'showAttachmentPoints', value: boolean): void;
    };
}

export const CanvasSettingsTab: React.FC<CanvasSettingsTabProps> = ({
    canvas,
    onChange,
}) => {
    const handleCanvasSizeChange = useCallback((sizePartial: Partial<CanvasSize>): void => {
        console.log('sizePartial', sizePartial);
        const newCanvasSize = { ...canvas.canvasSize, ...sizePartial };
        console.log('canvasSize', canvas.canvasSize, newCanvasSize);
        onChange('canvasSize', newCanvasSize);
    }, [canvas.canvasSize, onChange]);

    const handleAttachmentPointsChange = useCallback((checked: boolean | 'indeterminate') => {
        if (typeof checked === 'boolean') {
            onChange('showAttachmentPoints', checked);
        }
    }, [onChange]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                        Width
                    </label>
                    <Input
                        type="number"
                        value={canvas.canvasSize.width}
                        onChange={(e) => handleCanvasSizeChange({ width: parseInt(e.target.value) })}
                        min={1}
                        className="bg-gray-700 text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                        Height
                    </label>
                    <Input
                        type="number"
                        value={canvas.canvasSize.height}
                        onChange={(e) => handleCanvasSizeChange({ height: parseInt(e.target.value) })}
                        min={1}
                        className="bg-gray-700 text-white"
                    />
                </div>
            </div>
            <div className="flex items-center">
                <Checkbox
                    id="show-attachment-points"
                    checked={canvas.showAttachmentPoints}
                    onCheckedChange={handleAttachmentPointsChange}
                    className="mr-2 text-white"
                />
                <label htmlFor="show-attachment-points" className="text-sm text-white">
                    Show Attachment Points
                </label>
            </div>
        </div>
    );
};