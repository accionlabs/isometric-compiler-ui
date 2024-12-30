import React, { useState, useMemo, useCallback } from "react";
import { Button } from "../components/ui/Button";
import { CanvasSize, DiagramComponent, Shape, Component } from "../Types";

import SVGPreview from "../components/ui/SVGPreview";
import { SVGLibraryManager } from "../lib/svgLibraryUtils";
import { componentLibraryManager } from "../lib/componentLib";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger
} from "@/components/ui/HoverCard";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";

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
    activeLibrary
}) => {
    const [openPanels, setOpenPanels] = useState<string>("3d-shapes");

    // Get active library details
    const activeLibraryData = useMemo(() => {
        return SVGLibraryManager.getLibrary(activeLibrary);
    }, [activeLibrary]);

    const shouldDisable3DShapeButtons = () => {
        return diagramComponents.length > 0 && selected3DShape === null;
    };

    const handleAccordionChange = (value: string) => {
        setOpenPanels(value);
    };

    const handleDeleteComponent = (componentId: string) => {
        // TODO: check if this component is inserted in diagramComponents and do not allow delete
        onDeleteComponent(componentId);
    };
    const isAddDisabled = {
        "3D": diagramComponents.length > 0 && selected3DShape === null,
        "2D": selected3DShape === null,
        component: diagramComponents.length > 0 && selected3DShape === null
    };

    // Temporary function to show SVG preview content for a component
    const getComponentPreview = useCallback(
        (component: Component): string => {
            if (!component.svgContent || component.svgContent === "") {
                return componentLibraryManager.renderComponent(
                    component.id,
                    canvasSize,
                    svgLibrary
                );
            }
            return component.svgContent;
        },
        [canvasSize, svgLibrary]
    );

    const renderPreview = (element: Shape | Component) => (
        <SVGPreview
            svgContent={
                ("type" in element &&
                (element.type === "2D" || element.type === "3D")
                    ? element.svgContent
                    : getComponentPreview(element as Component)) ?? ""
            }
            className="w-full h-full object-cover"
        />
    );
    const renderElement = (
        element: Shape | Component,
        onAdd: (element: Shape | Component) => void,
        onEdit?: (element: Shape | Component) => void,
        onDelete?: (element: Shape | Component) => void
    ) => (
        <HoverCard key={element.name}>
            <HoverCardTrigger asChild>
                <button
                    disabled={
                        isAddDisabled[
                            "type" in element ? element.type : "component"
                        ]
                    }
                    onClick={() => onAdd(element)}
                    className={`flex items-center justify-center p-1 rounded-lg relative aspect-[3/2] transition-all hover:scale-105 focus:outline-none disabled:opacity-80 disabled:cursor-not-allowed`}
                >
                    {renderPreview(element)}
                    {/* //opacity-50 */}
                </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
                <Card key={element.name} className="group overflow-hidden">
                    {/* Image Container */}
                    <div className="relative aspect-square overflow-hidden">
                        {renderPreview(element)}
                    </div>

                    {/* Product Details */}
                    <CardContent className="p-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg truncate">
                                {element.name}
                            </h3>
                            {"attachTo" in element && element.attachTo && (
                                <span className="text-md ">
                                    attached to - {element.attachTo}
                                </span>
                            )}
                            {"description" in element && (
                                <span className="text-sm ml-1">
                                    {element.description}
                                </span>
                            )}
                        </div>
                    </CardContent>

                    {/* Add to Cart Button */}
                    <CardFooter className="p-4 pt-0">
                        {onDelete && (
                            <Button
                                onClick={() => {
                                    onDelete(element);
                                }}
                                className="mr-2"
                            >
                                Delete
                                {"type" in element ? "Shape" : "Component"}
                            </Button>
                        )}
                        {onEdit && (
                            <Button disabled={shouldDisable3DShapeButtons()}>
                                Edit {"type" in element ? "Shape" : "Component"}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </HoverCardContent>
        </HoverCard>
    );
    // Function to render shape/component sections
    const renderSection = (
        title: string,
        items: (Shape | Component)[],
        onAdd: any,
        onDelete?: any,
        onEdit?: any
    ) => (
        <div className="space-y-4">
            <span className="font-bold">{title}</span>
            {items.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ">
                    {items.map((element) =>
                        renderElement(element, onAdd, onEdit, onDelete)
                    )}
                </div>
            ) : (
                <div className=" text-gray-400">No {title} available</div>
            )}
        </div>
    );

    return (
        <div className="container mx-auto p-6 pb-20 h-screen overflow-y-scroll flex flex-col gap-1">
            {renderSection(
                "Components",
                components,
                (component: Component) => onAddComponent(component.id),
                (component: Component) => handleDeleteComponent(component.id)
            )}
            {renderSection(
                "3D Shapes",
                svgLibrary.filter((shape) => shape.type === "3D"),
                (shape: Shape) => onAdd3DShape(shape.name)
            )}
            {renderSection(
                "2D Shapes",
                svgLibrary.filter((shape) => shape.type === "2D"),
                (shape: Shape) => onAdd2DShape(shape.name, shape.attachTo ?? "")
            )}
        </div>
    );
};

export default ShapesPanel;
