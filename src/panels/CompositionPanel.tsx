import React, { useEffect, useRef, useMemo } from 'react';
import { DiagramComponent, Shape } from '../Types';
import DiagramComponentCard from './DiagramComponentCard';
import SVGPreview from '../components/ui/SVGPreview';

interface CompositionPanelProps {
    diagramComponents: DiagramComponent[];
    isCopied:boolean;
    svgLibrary: Shape[];
    onRemove3DShape: (id: string) => void;
    onRemove2DShape: (parentId: string, shapeIndex: number) => void;
    onSelect3DShape: (id: string) => void;
    onCut3DShape: (id: string) => void;
    onCopy3DShape: (id: string) => void;
    onCancelCut3DShape: (id: string) => void;
    onPaste3DShape: (id: string) => void;
    selected3DShape: string | null;
}

const CompositionPanel: React.FC<CompositionPanelProps> = ({
    diagramComponents,
    isCopied,
    svgLibrary,
    onRemove3DShape,
    onRemove2DShape,
    onSelect3DShape,
    onCut3DShape,
    onCopy3DShape,
    onCancelCut3DShape,
    onPaste3DShape,
    selected3DShape,
}) => {
    const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        if (selected3DShape && componentRefs.current[selected3DShape]) {
            componentRefs.current[selected3DShape]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [selected3DShape]);

    const handleScrollToParent = (parentId: string) => {
        if (componentRefs.current[parentId]) {
            componentRefs.current[parentId]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
            onSelect3DShape(parentId);
        }
    };

    const componentIndexMap = useMemo(() => {
        const indexMap: { [key: string]: number } = {};
        diagramComponents.forEach((component, index) => {
            indexMap[component.id] = index;
        });
        return indexMap;
    }, [diagramComponents]);

    const getParentIndex = (component: DiagramComponent): number | null => {
        return component.relativeToId !== null ? componentIndexMap[component.relativeToId] : null;
    };

    const getSVGContent = (shapeName: string): string => {
        const shape = svgLibrary.find(s => s.name === shapeName);
        return shape ? shape.svgContent : '';
    };

    const nonCutComponents = diagramComponents.filter(component => !component.cut);
    const cutComponents = diagramComponents.filter(component => component.cut);

    const handleCut3DShape = (id: string) => {
        // Cancel the previous cut object if it exists
        if (cutComponents.length > 0) {
            onCancelCut3DShape(cutComponents[0].id);
        }
        // Cut the new object
        onCut3DShape(id);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-hidden flex flex-col">
                <h2 className="text-xl font-semibold p-4">Composition</h2>
                <div className="flex-grow overflow-auto p-4">
                    <div className="space-y-4">
                        {nonCutComponents.map((component, ind) => (
                            <div key={component.id} ref={el => componentRefs.current[component.id] = el}>
                                <DiagramComponentCard
                                    component={component}
                                    index={componentIndexMap[component.id]}
                                    parentIndex={getParentIndex(component)}
                                    isSelected={component.id === selected3DShape}
                                    isCut={false}
                                    isCopied={false}
                                    isFirst={ind === 0}
                                    onSelect={onSelect3DShape}
                                    onCut={onCut3DShape}
                                    onCopy={onCopy3DShape}
                                    onRemove={onRemove3DShape}
                                    onCancelCut={onCancelCut3DShape}
                                    onPaste={onPaste3DShape}
                                    onRemove2DShape={onRemove2DShape}
                                    onScrollToParent={handleScrollToParent}
                                    svgPreview={<SVGPreview svgContent={getSVGContent(component.shape)} className="w-12 h-12" />}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {cutComponents.length > 0 && (
                <div className="border-t border-gray-700">
                    <h3 className="text-lg font-semibold p-4">{isCopied ? 'Copied' : 'Cut'} Objects</h3>
                    <div className="overflow-auto max-h-48 p-4">
                        <div className="space-y-2">
                            {cutComponents.map((component, ind) => (
                                <DiagramComponentCard
                                    key={component.id}
                                    component={component}
                                    index={componentIndexMap[component.id]}
                                    parentIndex={getParentIndex(component)}
                                    isSelected={false}
                                    isCut={!isCopied}
                                    isCopied={isCopied}
                                    isFirst={ind === 0}
                                    onSelect={() => { }} // No-op for cut objects
                                    onCut={() => { }} // No-op for cut objects
                                    onCopy={() => { }} // No-op for cut objects
                                    onRemove={onRemove3DShape}
                                    onCancelCut={onCancelCut3DShape}
                                    onPaste={onPaste3DShape}
                                    onRemove2DShape={onRemove2DShape}
                                    onScrollToParent={handleScrollToParent}
                                    svgPreview={<SVGPreview svgContent={getSVGContent(component.shape)} className="w-12 h-12" />}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CompositionPanel;