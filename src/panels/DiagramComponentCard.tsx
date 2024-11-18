import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { RadixSelect } from '../components/ui/Select';
import { DiagramComponent } from '../Types';
import { handleWithStopPropagation } from '../lib/eventUtils';
import { schemaLoader } from '../lib/componentSchemaLib';
import MetadataForm from '../components/ui/MetadataForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';

interface DiagramComponentCardProps {
    component: DiagramComponent;
    index: number;
    parentIndex: number | null;
    isSelected: boolean;
    isCut: boolean;
    isCopied: boolean;
    isFirst: boolean;
    onSelect: (id: string) => void;
    onCut: (id: string) => void;
    onCopy: (id: string) => void;
    onRemove: (id: string) => void;
    onCancelCut: (id: string) => void;
    onPaste: (id: string) => void;
    onRemove2DShape: (parentId: string, shapeIndex: number) => void;
    onScrollToParent: (parentId: string) => void;
    svgPreview: React.ReactNode;
    onUpdateMetadata: (id: string, type: string | undefined, metadata: any) => void;
}

const DiagramComponentCard: React.FC<DiagramComponentCardProps> = ({
    component,
    index,
    parentIndex,
    isSelected,
    isCut,
    isCopied,
    isFirst,
    onSelect,
    onCut,
    onCopy,
    onRemove,
    onCancelCut,
    onPaste,
    onRemove2DShape,
    onScrollToParent,
    svgPreview,
    onUpdateMetadata,
}) => {
    const [isMetadataDialogOpen, setIsMetadataDialogOpen] = useState(false);
    const availableTypes = schemaLoader.getAvailableTypes();

    const handleTypeChange = (type: string) => {
        onUpdateMetadata(component.id, type === '' ? undefined : type, {});
    };

    const handleMetadataChange = (metadata: any) => {
        onUpdateMetadata(component.id, component.type, metadata);
    };

    return (
        <div
            className={`p-4 rounded-lg ${isSelected ? 'bg-blue-800' : 'bg-gray-800'}`}
            onClick={(e) => handleWithStopPropagation(e, () => onSelect(component.id))}
        >
            <div className="flex justify-between items-center mb-2">
                {svgPreview}
                <h3 className="text-lg font-semibold">
                    {component.shape} (3D-{index + 1})
                </h3>
                <div>
                    {isCut ? (
                        isFirst && (
                            <div className="flex space-x-2">
                                <Button onClick={(e) => handleWithStopPropagation(e, () => onCancelCut(component.id))}>
                                    Cancel
                                </Button>
                                <Button onClick={(e) => handleWithStopPropagation(e, () => onPaste(component.id))}>
                                    Paste
                                </Button>
                                <Button onClick={(e) => handleWithStopPropagation(e, () => onRemove(component.id))}>
                                    Remove
                                </Button>
                            </div>
                        )
                    ) : (
                        isCopied ? (
                            isFirst && (
                                <div className="flex space-x-2">
                                    <Button onClick={(e) => handleWithStopPropagation(e, () => onPaste(component.id))}>
                                        Paste
                                    </Button>
                                    <Button onClick={(e) => handleWithStopPropagation(e, () => onCancelCut(component.id))}>
                                        Cancel
                                    </Button>
                                </div>
                            )
                        ) : (
                            <div className="flex space-x-2">
                                <Button
                                    onClick={(e) => handleWithStopPropagation(e, () => onCopy(component.id))}
                                >
                                    Copy
                                </Button>
                                <Button
                                    onClick={(e) => handleWithStopPropagation(e, () => onCut(component.id))}
                                    disabled={isFirst}
                                >
                                    Cut
                                </Button>
                                <Button onClick={(e) => handleWithStopPropagation(e, () => onRemove(component.id))}>
                                    Remove
                                </Button>
                            </div>
                        ))}
                </div>
            </div>

            {!isCut && !isCopied && (
                <>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <span className="font-semibold">Position:</span> {component.position}
                        </div>
                        <div>
                            <span className="font-semibold">Relative To:</span>
                            {parentIndex !== null ? (
                                <button
                                    className="text-blue-400 hover:underline ml-2"
                                    onClick={(e) => handleWithStopPropagation(e, () => onScrollToParent(component.relativeToId!))}
                                >
                                    3D-{parentIndex + 1}
                                </button>
                            ) : ' None'}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-1">Attached 2D Shapes:</h4>
                        {component.attached2DShapes.length > 0 ? (
                            <ul className="space-y-2">
                                {component.attached2DShapes.map((shape, i) => (
                                    <li key={i} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                                        <span>{shape.name} (attached to {shape.attachedTo})</span>
                                        <Button
                                            className="ml-2 text-xs"
                                            onClick={(e) => handleWithStopPropagation(e, () => onRemove2DShape(component.id, i))}
                                        >
                                            Remove
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-gray-400">No 2D shapes attached</div>
                        )}
                    </div>

                    <div className="mt-4 border-t border-gray-700 pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 mr-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Component Type
                                </label>
                                <RadixSelect
                                    options={[
                                        { value: '', label: 'No Type' },
                                        ...availableTypes.map(type => ({
                                            value: type,
                                            label: schemaLoader.getComponentType(type)?.displayName || type
                                        }))
                                    ]}
                                    value={component.type || ''}
                                    onChange={handleTypeChange}
                                    placeholder="Select component type"
                                />
                            </div>
                            {component.type && (
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMetadataDialogOpen(true);
                                    }}
                                    className="mt-6"
                                >
                                    Edit Metadata
                                </Button>
                            )}
                        </div>

                        {component.type && component.metadata && (
                            <div className="mt-2 p-2 bg-gray-700 rounded">
                                <h4 className="text-sm font-medium text-gray-300 mb-1">Current Metadata:</h4>
                                <div className="text-sm text-gray-400">
                                    {Object.entries(component.metadata).map(([key, value]) => (
                                        <div key={key}>
                                            <span className="font-medium">{key}:</span> {value?.toString()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <Dialog open={isMetadataDialogOpen} onOpenChange={setIsMetadataDialogOpen}>
                <DialogContent className="bg-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Edit Metadata - {schemaLoader.getComponentType(component.type || '')?.displayName}</DialogTitle>
                    </DialogHeader>
                    {component.type && (
                        <MetadataForm
                            fields={schemaLoader.getComponentType(component.type)?.fields || []}
                            values={component.metadata || {}}
                            onChange={handleMetadataChange}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DiagramComponentCard;