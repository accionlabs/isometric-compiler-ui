import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { CanvasSize, DiagramComponent, Shape, Component } from '../Types';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';
import SVGPreview from '../components/ui/SVGPreview';
import { SVGLibraryManager } from '../lib/svgLibraryUtils';
import { componentLibraryManager } from '../lib/componentLib';

interface ShapesPanelProps {
    svgLibrary: Shape[];
    canvasSize: CanvasSize;
    onAdd3DShape: (shapeName: string) => void;
    onAdd2DShape: (shapeName: string, attachTo: string) => void;
    onAddComponent: (componentId: string) => void;
    onDeleteComponent: (componentId: string) => void;
    selected3DShape: string | null;
    diagramComponents: DiagramComponent[];
    components: Component[];
    activeLibrary: string;
}

const ShapesPanel: React.FC<ShapesPanelProps> = ({
    svgLibrary,
    canvasSize,
    onAdd3DShape,
    onAdd2DShape,
    onAddComponent,
    onDeleteComponent,
    selected3DShape,
    diagramComponents,
    components,
    activeLibrary,
}) => {
    const [openPanels, setOpenPanels] = useState<string[]>(['3d-shapes', 'components', '2d-shapes']);

    // Get active library details
    const activeLibraryData = useMemo(() => {
        return SVGLibraryManager.getLibrary(activeLibrary);
    }, [activeLibrary]);

    const shouldDisable3DShapeButtons = () => {
        return diagramComponents.length > 0 && selected3DShape === null;
    };

    const handleAccordionChange = (value: string[]) => {
        setOpenPanels(value);
    };

    const handleDeleteComponent = (componentId: string) => {
        // TODO: check if this component is inserted in diagramComponents and do not allow delete
        onDeleteComponent(componentId);
    }

    // Temporary function to show SVG preview content for a component
    const getComponentPreview = (component: Component): string => {
        if (!component.svgContent || component.svgContent === '') {
            return componentLibraryManager.renderComponent(component.id, canvasSize, svgLibrary);
        }
        return component.svgContent;
    };

    const render3DShapesContent = () => (
        <div className="space-y-2">
            <div className="overflow-auto">
                <table className="w-full">
                    <thead className="sticky top-0 bg-gray-800">
                        <tr>
                            <th className="text-left">Preview</th>
                            <th className="text-left">Name</th>
                            <th className="w-20 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {svgLibrary.filter(shape => shape.type === '3D').map(shape => (
                            <tr key={shape.name}>
                                <td className="w-16">
                                    <SVGPreview svgContent={shape.svgContent} className="w-12 h-12 mr-2" />
                                </td>
                                <td>{shape.name}</td>
                                <td className="text-right">
                                    <Button
                                        onClick={() => onAdd3DShape(shape.name)}
                                        disabled={shouldDisable3DShapeButtons()}
                                    >
                                        Add
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderComponentsContent = () => (
        <div className="space-y-2">
            <div className="overflow-auto">
                {components.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">
                        No components available. Save a composition to create components.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="sticky top-0 bg-gray-800">
                            <tr>
                                <th className="text-left">Preview</th>
                                <th className="text-left">Name</th>
                                <th className="text-left">Description</th>
                                <th className="w-40 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {components.map(component => (
                                <tr key={component.id}>
                                    <td className="w-16">
                                        <SVGPreview
                                            svgContent={getComponentPreview(component)}
                                            className="w-12 h-12 mr-2"
                                        />
                                    </td>
                                    <td>{component.name}</td>
                                    <td className="text-gray-400">{component.description}</td>
                                    <td className="text-right">
                                        <Button
                                            onClick={() => handleDeleteComponent(component.id)}
                                            className="mr-2"
                                        >
                                            Del
                                        </Button>
                                        <Button
                                            onClick={() => onAddComponent(component.id)}
                                            disabled={shouldDisable3DShapeButtons()}
                                        >
                                            Add
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const render2DShapesContent = () => (
        <div className="overflow-auto">
            <table className="w-full">
                <thead className="sticky top-0 bg-gray-800">
                    <tr>
                        <th className="text-left">Preview</th>
                        <th className="text-left">Name</th>
                        <th className="text-left">Attach To</th>
                        <th className="w-20 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {svgLibrary.filter(shape => shape.type === '2D').map(shape => (
                        <tr key={shape.name}>
                            <td className="w-16">
                                <SVGPreview svgContent={shape.svgContent} className="w-12 h-12 mr-2" />
                            </td>
                            <td>{shape.name}</td>
                            <td>{shape.attachTo}</td>
                            <td className="text-right">
                                <Button
                                    onClick={() => onAdd2DShape(shape.name, shape.attachTo || '')}
                                    disabled={selected3DShape === null}
                                >
                                    Add
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <Accordion
                type="multiple"
                value={openPanels}
                onValueChange={handleAccordionChange}
                className="flex flex-col h-full"
            >
                <div className="flex flex-col h-full">
                    <AccordionItem value="3d-shapes" className="flex flex-col min-h-0 border-b border-gray-700">
                        <AccordionTrigger className="p-2 text-xl font-semibold">3D Shapes</AccordionTrigger>
                        <AccordionContent className="flex-grow overflow-auto">
                            <div className="p-2">
                                {render3DShapesContent()}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="components" className="flex flex-col min-h-0 border-b border-gray-700">
                        <AccordionTrigger className="p-2 text-xl font-semibold">Components</AccordionTrigger>
                        <AccordionContent className="flex-grow overflow-auto" fixedHeight="calc(35vh - 2rem)">
                            <div className="p-2">
                                {renderComponentsContent()}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="2d-shapes" className="flex flex-col min-h-0 border-b border-gray-700">
                        <AccordionTrigger className="p-2 text-xl font-semibold">2D Shapes</AccordionTrigger>
                        <AccordionContent className="flex-grow overflow-auto" fixedHeight="calc(35vh - 2rem)">
                            <div className="p-2">
                                {render2DShapesContent()}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </div>
            </Accordion>
        </div>
    );
};

export default ShapesPanel;