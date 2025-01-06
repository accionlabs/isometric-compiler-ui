// @/panels/ShapesPanel.tsx

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/Button";
import {
    CanvasSize,
    DiagramComponent,
    Shape,
    Component,
    Category
} from "../Types";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent
} from "../components/ui/Accordion";
import { Folder, Grid, List } from "lucide-react";
import categoriesData from "../assets/categories.json";

import SVGPreview from "../components/ui/SVGPreview";
import { SVGLibraryManager } from "../lib/svgLibraryUtils";
import { componentLibraryManager } from "../lib/componentLib";
import CategoryMapper from "@/components/ui/Catergories";
import ShapesMapper from "./ShapesMapper";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger
} from "@/components/ui/HoverCard";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

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
    const [layout, setLayout] = useState("list");
    const [layoutShapes, setLayoutShapes] = useState("grid");

    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set()
    );

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
    const getComponentPreview = (component: Component): string => {
        if (!component.svgContent || component.svgContent === "") {
            return componentLibraryManager.renderComponent(
                component.id,
                canvasSize,
                svgLibrary
            );
        }
        return component.svgContent;
    };

    const toggleCategory = (id: string) => {
        setExpandedCategories((prev) => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(id)) {
                newExpanded.delete(id);
            } else {
                newExpanded.add(id);
            }
            return newExpanded;
        });
    };
    const renderPreview = (element: Shape | Component) => (
        <SVGPreview
            svgContent={
                ("type" in element &&
                (element.type === "2D" || element.type === "3D")
                    ? element.svgContent
                    : getComponentPreview(element as Component)) ?? ""
            }
            className="w-full h-full object-cover bg-white"
        />
    );
    const renderCategories = (categories: Category[], level = 0) => {
        return categories.map((category) => (
            <div key={category._id}>
                <div className="flex items-center justify-between bg-customGray text-white py-1 px-2">
                    {/* Left Section: Icon and Text */}

                    <div className="flex items-center space-x-1">
                        {category.allDescendants?.length > 0 && (
                            <button
                                onClick={() => toggleCategory(category._id)}
                                className="p-2 bg-customGray rounded hover:bg-gray-600"
                            >
                                {expandedCategories.has(category._id)
                                    ? "▼"
                                    : "▶"}
                            </button>
                        )}
                        <div className="flex items-center space-x-3 hover:bg-customLightGray p-2 rounded-lg cursor-pointer">
                            {/* Folder Icon */}
                            <Folder className="p-2 rounded" size={"40px"} />

                            {/* Title and Subtitle */}
                            <div>
                                <h3 className="text-base">{category.name}</h3>
                                <p className="text-sm">54 shapes</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Section: view button */}

                    {/* <button
                            onClick={() => toggleCategory(category._id)}
                            className="p-2 bg-gray-700 rounded hover:bg-gray-600"
                        >
                          view
                        </button>
                */}
                </div>
                {/* <div className="flex items-center p-2 rounded-lg hover:bg-customLightGray cursor-pointer shadow-sm mb-2">
                    <span className="mr-2 text-white"></span>
                    <span className="text-white font-medium flex-1"></span>
                    <button
                        className="ml-auto px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded hover:bg-customLightGray"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevents triggering category toggle
                            alert(`Viewing category: ${category.name}`);
                        }}
                    >
                        View
                    </button>
                </div> */}
                {expandedCategories.has(category._id) &&
                    category.allDescendants.length > 0 && (
                        <div className="ml-6 mt-2 border-l-2 border-gray-300 pl-4">
                            {renderCategories(
                                category.allDescendants,
                                level + 1
                            )}
                        </div>
                    )}
            </div>
        ));
    };

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
                    className="flex flex-col items-center justify-center p-1 rounded-lg relative aspect-[3/2] transition-all hover:scale-105 focus:outline-none disabled:opacity-80 disabled:cursor-not-allowed"
                >
                    {renderPreview(element)}

                    <div className="text-white text-sm overflow-hidden text-ellipsis whitespace-pre-line line-clamp-1">
                        {element.name}
                    </div>
                    <div className="text-[#00BFFF] text-sm">
                        {"type" in element ? element.type : "Component"}
                    </div>
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
    const renderSection = (
        title: string,
        items: (Shape | Component)[],
        onAdd: any,
        onDelete?: any,
        onEdit?: any
    ) => (
        <div className="space-5">
            {items.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {items.map((element) =>
                        renderElement(element, onAdd, onEdit, onDelete)
                    )}
                </div>
            ) : (
                <div className=" text-gray-400">No {title} available</div>
            )}
            <div className="h-4"></div>
        </div>
    );

    return (
        <div>
            <div className="border-t-2 border-customBorderColor">
                <div className="flex items-center justify-between bg-customGray text-white p-4 rounded-lg ">
                    <h1 className="text-lg text-white ">Categories</h1>

                    <div className="flex items-center">
                        <button
                            onClick={() => setLayout("list")}
                            className={`p-2 rounded hover:bg-customLightGray ${
                                layout === "list"
                                    ? "bg-customLightGray"
                                    : "bg-customGray"
                            }`}
                        >
                            <List />
                        </button>

                        <button
                            onClick={() => setLayout("grid")}
                            className={`p-2 rounded hover:bg-customLightGray ${
                                layout === "grid"
                                    ? "bg-customLightGray"
                                    : "bg-customGray"
                            }`}
                        >
                            <Grid />
                        </button>
                    </div>
                </div>
                <div className="mx-auto bg-customGray  rounded-lg shadow-lg ">
                    <div className="h-[40vh] overflow-y-auto">
                        {renderCategories(
                            categoriesData.categories as Category[]
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t-2 border-customBorderColor">
                <div className="flex items-center justify-between bg-customGray text-white p-4 rounded-lg ">
                    <h1 className="text-lg text-white ">Shapes</h1>

                    <div className="flex items-center ">
                        <button
                            onClick={() => setLayoutShapes("list")}
                            className={`p-2 rounded hover:bg-customLightGray ${
                                layoutShapes === "list"
                                    ? "bg-customLightGray"
                                    : "bg-customGray"
                            }`}
                        >
                            <List />
                        </button>

                        <button
                            onClick={() => setLayoutShapes("grid")}
                            className={`p-2 rounded hover:bg-customLightGray ${
                                layoutShapes === "grid"
                                    ? "bg-customLightGray"
                                    : "bg-customGray"
                            }`}
                        >
                            <Grid />
                        </button>
                    </div>
                </div>
                <div className="mx-auto bg-customGray  rounded-lg shadow-lg ">
                    <div className="flex h-[40vh] overflow-y-auto ">
                        {/* <h2 className="text-white text-sm">
                            Select any category to see shapes
                        </h2> */}
                        {renderSection(
                            "#D Shapes",
                            svgLibrary.filter((shape) => shape.type === "3D"),
                            (shape: Shape) => onAdd3DShape(shape.name)
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShapesPanel;
