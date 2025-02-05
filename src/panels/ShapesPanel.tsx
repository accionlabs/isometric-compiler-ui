// @/panels/ShapesPanel.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
    CanvasSize,
    DiagramComponent,
    Shape,
    Component,
    Category,
    UnifiedElement
} from "../Types";
import {
    CircleX,
    Search,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    CirclePlus,
    Edit
} from "lucide-react";

import SVGPreview from "../components/ui/SVGPreview";
import { componentLibraryManager } from "../lib/componentLib";
import { Folder, RootFolder } from "@/components/ui/IconGroup";
import { Button } from "@/components/ui/Button";
import EditElementDialog from "./EditElementDialog";
import CategoriesPanel from "./CategoriesPanel";
import { ShapesGroupLoadingSkeleton } from "@/components/ui/LoaderSkeletons";

type ElementType = "3D" | "2D" | "LAYERS" | "COMPONENT";

interface ShapesPanelProps {
    svgLibrary: Shape[];
    shapesByCategory: Shape[];
    searchQuery: string;
    searchedData:
        | {
              data: UnifiedElement[];
              total: number;
          }
        | undefined;
    setSearchQuery: (newLibrary: string) => void;
    canvasSize: CanvasSize;
    categories: Category[];
    activeCategory: string;
    onCategoryChange: (id: string) => void;
    onAdd3DShape: (shapeName: string) => void;
    onAdd2DShape: (shapeName: string, attachTo: string) => void;
    onAddComponent: (component: Component) => void;
    onDeleteComponent: (componentId: string) => void;
    selected3DShape: string | null;
    diagramComponents: DiagramComponent[];
    components: Component[];
    activeLibrary: string;
    isDataLoading: {
        isCategoryLoading: boolean;
        isSearchLoading: boolean;
        isShapesLoading: boolean;
    };
}
const filterOptionsWithColor = [
    {
        name: "All",
        color: "text-white"
    },
    {
        name: "2D",
        color: "text-custom2D"
    },
    {
        name: "3D",
        color: "text-custom3D"
    },
    {
        name: "Layers",
        color: "text-customLayer"
    },
    {
        name: "Component",
        color: "text-customComponent"
    }
];
const ShapesPanel: React.FC<ShapesPanelProps> = ({
    svgLibrary,
    shapesByCategory,
    searchQuery,
    searchedData,
    setSearchQuery,
    canvasSize,
    categories,
    activeCategory,
    onCategoryChange,
    onAdd3DShape,
    onAdd2DShape,
    onAddComponent,
    onDeleteComponent,
    selected3DShape,
    diagramComponents,
    components,
    isDataLoading
}) => {
    const [inputQuery, setInputQuery] = useState("");
    const [selectedFilter, setselectedFilter] = useState("All");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set()
    );
    const [isEditDialog, setIsEditDialog] = useState(false);
    const [currentShapeDetails, setCurrentShapeDetails] = useState<
        Shape | Component | UnifiedElement | null
    >(null);

    useEffect(() => {
        const updatedCurrentComponentDetails = components.find(
            (component) => component.name === currentShapeDetails?.name
        );
        if (updatedCurrentComponentDetails) {
            setCurrentShapeDetails(updatedCurrentComponentDetails);
        }

        const updatedCurrentShapeDetails = shapesByCategory.find(
            (shape) => shape.name === currentShapeDetails?.name
        );
        if (updatedCurrentShapeDetails) {
            setCurrentShapeDetails(updatedCurrentShapeDetails);
        }
    }, [components, shapesByCategory]);

    const isAddDisabled: Record<ElementType, boolean> = {
        "3D": diagramComponents.length > 0 && selected3DShape === null,
        LAYERS: diagramComponents.length > 0 && selected3DShape === null,
        "2D": selected3DShape === null,
        COMPONENT: diagramComponents.length > 0 && selected3DShape === null
    };
    const addActionFor: Record<ElementType, (arg: any) => void> = {
        "3D": (shape: Shape) => onAdd3DShape(shape.name),
        LAYERS: (shape: Shape) => onAdd3DShape(shape.name),
        "2D": (shape: Shape) => onAdd2DShape(shape.name, shape.attachTo ?? ""),
        COMPONENT: (component: Component) => onAddComponent(component)
    };
    // Temporary function to show SVG preview content for a component
    const getComponentPreview = (component: Component): string => {
        if (!component.svgContent || component.svgContent === "") {
            return componentLibraryManager.renderComponent(
                component.id,
                canvasSize,
                svgLibrary,
                component
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
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInputQuery("");
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setselectedFilter("All");
            setSearchQuery(inputQuery);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [inputQuery]);

    const isAllOrComponent =
        selectedFilter === "All" ||
        selectedFilter.toLocaleUpperCase() === "COMPONENT";

    const { isCategoryLoading, isSearchLoading, isShapesLoading } =
        isDataLoading;
    const filteredShapes = useMemo(() => {
        const upperCaseFilter = selectedFilter.toLocaleUpperCase();
        if (upperCaseFilter === "COMPONENT") return [];
        const isShapeType = ["3D", "2D", "LAYERS"].includes(upperCaseFilter);

        return isShapeType
            ? shapesByCategory.filter(
                  (shape) => shape.type.toLocaleUpperCase() === upperCaseFilter
              )
            : shapesByCategory;
    }, [selectedFilter, shapesByCategory]);

    const filteredSearch = useMemo(() => {
        const upperCaseFilter = selectedFilter.toLocaleUpperCase();

        const isShapeType = ["3D", "2D", "LAYERS", "COMPONENT"].includes(
            upperCaseFilter
        );

        return isShapeType
            ? searchedData?.data.filter(
                  (shape) => shape.type.toLocaleUpperCase() === upperCaseFilter
              )
            : searchedData?.data ?? [];
    }, [selectedFilter, searchedData?.data]);

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

    const renderElement = (element: Shape | Component) => {
        const elementType =
            "type" in element
                ? element.type
                : ("COMPONENT" as keyof typeof typeColors); // Cast to the correct type

        // Define colors based on element type
        const typeColors = {
            "2D": "text-custom2D",
            "3D": "text-custom3D",
            LAYERS: "text-customLayer",
            COMPONENT: "text-customComponent"
        };

        // Utility for element type color classes
        const getElementTypeColor = (type: keyof typeof typeColors) => {
            return typeColors[type] || "text-white"; // Default to 'text-white' if no match
        };

        const handlePreviewClick = (
            e: React.MouseEvent,
            type: keyof typeof typeColors
        ) => {
            e.stopPropagation();
            if (!isAddDisabled[type]) {
                addActionFor[type](element);
            }
        };

        const handleElementClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            setCurrentShapeDetails(element);
        };

        const elementTypeColor = getElementTypeColor(elementType);

        return (
            <div
                key={`${element.name}-${element.version}`}
                onClick={handleElementClick}
                className="flex flex-col p-1 cursor-pointer rounded-lg mb-2 relative aspect-[3/2] transition-all hover:bg-cu focus:outline-none disabled:opacity-80 disabled:cursor-not-allowed"
            >
                <div
                    role="button"
                    aria-disabled={isAddDisabled[elementType]}
                    onClick={(e) => handlePreviewClick(e, elementType)}
                    className={`relative w-full h-full ${
                        isAddDisabled[elementType]
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                    }`}
                >
                    {renderPreview(element)}

                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-3xl select-none">
                            +
                        </span>
                    </div>
                </div>

                <div className="text-white text-sm overflow-hidden text-ellipsis whitespace-pre-line line-clamp-1">
                    {element.name}
                </div>
                <div className={`${elementTypeColor} text-xs capitalize`}>
                    {["2D", "3D"].includes(elementType)
                        ? elementType
                        : elementType.toLowerCase()}
                </div>
            </div>
        );
    };

    return (
        <main className="p-4 h-full flex flex-col gap-4">
            {categories.length > 0 && (
                <CategoriesPanel
                    categories={categories}
                    onCategoryChange={onCategoryChange}
                />
            )}

            <section className="flex-grow overflow-auto">
                {isShapesLoading ? (
                    <ShapesGroupLoadingSkeleton />
                ) : shapesByCategory.length > 0 || components.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                        {isAllOrComponent &&
                            components.map((element) => renderElement(element))}
                        {(selectedFilter === "All" ||
                            filteredShapes.length > 0) &&
                            filteredShapes.map((element) =>
                                renderElement(element)
                            )}
                    </div>
                ) : null}
            </section>
        </main>
    );
};

export default ShapesPanel;
