// @/panels/AttachmentOptionsPanel.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { ToggleGroup, ToggleGroupOption } from '../components/ui/ToggleGroup';
import { RadixSelect } from '../components/ui/Select';
import { Top, FrontLeft, FrontRight } from '@/components/ui/IconGroup';

interface AttachmentOptionsPanelProps {
    selectedPosition: string;
    setSelectedPosition: (position: string) => void;
    selectedAttachmentPoint: string | null;
    setSelectedAttachmentPoint: (point: string) => void;
    availableAttachmentPoints: string[];
}

const AttachmentOptionsPanel: React.FC<AttachmentOptionsPanelProps> = ({
    selectedPosition,
    setSelectedPosition,
    selectedAttachmentPoint,
    setSelectedAttachmentPoint,
    availableAttachmentPoints
}) => {
    const [filteredAttachmentPoints, setFilteredAttachmentPoints] = useState<string[]>([]);

    const positionOptions: ToggleGroupOption[] = [
        { value: 'top', label: 'Top', icon: <Top /> },
        { value: 'front-left', label: 'Front Left', icon: <FrontLeft /> },
        { value: 'front-right', label: 'Front Right', icon: <FrontRight /> },
    ];

    useEffect(() => {
        const updateFilteredAttachmentPoints = () => {
            const prefix = `${selectedPosition}-`;
            const newFilteredPoints = availableAttachmentPoints.filter(point => point.startsWith(prefix));
            setFilteredAttachmentPoints(newFilteredPoints);
    
            if (selectedAttachmentPoint && (newFilteredPoints.length === 0 || !newFilteredPoints.includes(selectedAttachmentPoint))) {
                setSelectedAttachmentPoint('none');
            }
        };
        updateFilteredAttachmentPoints();
    }, [availableAttachmentPoints, selectedPosition, selectedAttachmentPoint, setSelectedAttachmentPoint]);

    const attachmentPointOptions = useMemo(() => [
        { value: 'none', label: 'Default' },
        ...filteredAttachmentPoints.map(point => ({ value: point, label: point }))
    ], [filteredAttachmentPoints]);

    const handlePositionChange = (value: string) => {
        console.log(`Attachment Options: ${value}`);
        setSelectedPosition(value);
        setSelectedAttachmentPoint('none');
    };

    return (
        <div className="bg-customGray px-4 py-3 shadow-md w-full">
            {/* <h3 className="text-lg font-semibold mb-2">Attachment Options</h3> */}
            <div className="flex items-center space-x-4">
                <div className="flex-grow">
                    <ToggleGroup
                        options={positionOptions}
                        value={selectedPosition}
                        onValueChange={handlePositionChange}
                    />
                </div>
                {filteredAttachmentPoints.length > 0 && (
                    <div className="w-48">
                        <RadixSelect
                            options={attachmentPointOptions}
                            value={selectedAttachmentPoint || 'none'}
                            onChange={setSelectedAttachmentPoint}
                            placeholder="Select point"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttachmentOptionsPanel;