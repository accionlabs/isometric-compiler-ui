// @/panels/CanvasSettingsTab.tsx

import React, { useCallback, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { CanvasSize, CanvasSizeSettings } from '@/Types';
 
interface CanvasSettingsTabProps {
    canvas: CanvasSizeSettings;
    onChange: (key: keyof CanvasSizeSettings, value: boolean|CanvasSize) => void;
    onShowAttachmentPointsChange: (value: boolean) => void;
}

export const CanvasSettingsTab: React.FC<CanvasSettingsTabProps> = ({
    canvas,
    onChange,
    onShowAttachmentPointsChange
}) => {
    const [canvasSize, setCanvasSize] = useState(canvas.canvasSize);
    const handleCanvasSizeChange = useCallback((sizePartial:Partial<CanvasSize>):void => {
        setCanvasSize({...canvasSize, ...sizePartial});
        onChange('canvasSize',canvasSize);
    },[]);
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
                        onChange={(e) => {handleCanvasSizeChange({'width': parseInt(e.target.value)})}}
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
                        onChange={(e) => {handleCanvasSizeChange({'height': parseInt(e.target.value)})}}
                        min={1}
                        className="bg-gray-700 text-white"
                    />
                </div>
            </div>
            <div className="flex items-center">
                <Checkbox
                    id="show-attachment-points"
                    checked={canvas.showAttachmentPoints}
                    onCheckedChange={(checked) => onChange('showAttachmentPoints',checked as boolean)}
                    className="mr-2"
                />
                <label htmlFor="show-attachment-points" className="text-sm">
                    Show Attachment Points
                </label>
            </div>
        </div>
    );
};