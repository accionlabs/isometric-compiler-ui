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
import { CirclePlus, ArrowLeft, X, Search } from "lucide-react";

import SVGPreview from "../components/ui/SVGPreview";
import { componentLibraryManager } from "../lib/componentLib";
import { Button } from "@/components/ui/Button";
import EditElementDialog from "./EditElementDialog";
import CategoriesPanel from "./CategoriesPanel";
import {
    SearchLoadingSkeleton,
    ShapesGroupLoadingSkeleton
} from "@/components/ui/LoaderSkeletons";
import { Badge } from "@/components/ui/Badge";
import clsx from "clsx";
import { CUSTOM_SCROLLBAR } from "@/Constants";
import { formatString } from "@/lib/utils";

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
    { name: "All", color: "" },
    { name: "Primitives", color: "bg-primitive" },
    { name: "Modifiers", color: "bg-modifier" },
    { name: "Composites", color: "bg-composite" }
];
const filterBgColors = {
    "3D": "bg-primitive",
    LAYERS: "bg-primitive",
    "2D": "bg-modifier",
    COMPONENT: "bg-composite"
};

const showTypeName = {
    "3D": "3D",
    LAYERS: "Layer",
    "2D": "2D",
    COMPONENT: "Component"
};
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInputQuery("");
        setCurrentShapeDetails(null);
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
        selectedFilter.toLocaleUpperCase() === "COMPOSITES";

    const { isCategoryLoading, isSearchLoading, isShapesLoading } =
        isDataLoading;
    const filteredShapes = useMemo(() => {
        const upperCaseFilter = selectedFilter.toLocaleUpperCase();

        const filterMap: Record<string, string[] | null> = {
            ALL: null, // Show all shapes
            COMPOSITES: [], // Return empty array
            PRIMITIVES: ["3D", "LAYERS"],
            MODIFIERS: ["2D"]
        };

        const allowedTypes = filterMap[upperCaseFilter];

        return allowedTypes === null
            ? shapesByCategory
            : shapesByCategory.filter((shape) =>
                  allowedTypes.includes(shape.type.toLocaleUpperCase())
              );
    }, [selectedFilter, shapesByCategory]);

    const groupedSearchedElements = useMemo(() => {
        const upperCaseFilter = selectedFilter.toLocaleUpperCase();

        const filterMap: Record<string, string[]> = {
            COMPOSITES: ["COMPONENT"],
            PRIMITIVES: ["3D", "LAYERS"],
            MODIFIERS: ["2D"]
        };

        const allowedTypes = filterMap[upperCaseFilter] ?? null;

        const filteredData =
            allowedTypes === null
                ? searchedData?.data ?? []
                : (searchedData?.data ?? []).filter((shape) =>
                      allowedTypes.includes(shape.type.toLocaleUpperCase())
                  );

        const groupedElements = filteredData.reduce((acc, element) => {
            const pathKey = element.path?.split("/").join(" / ") || "unknown";
            (acc[pathKey] ||= []).push(element);
            return acc;
        }, {} as Record<string, UnifiedElement[]>);

        return { data: groupedElements, total: filteredData.length };
    }, [searchedData, selectedFilter]);

    const handleCategoryChange = (id: string) => {
        setCurrentShapeDetails(null);
        onCategoryChange(id);
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value === "") {
            setCurrentShapeDetails(null);
        }
        setInputQuery(e.target.value);
    };
    const renderPreview = (element: UnifiedElement) => (
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
        const elementType = "type" in element ? element.type : "COMPONENT";

        // Define colors based on element type

        const handlePreviewClick = (e: React.MouseEvent, type: ElementType) => {
            e.stopPropagation();
            if (!isAddDisabled[type]) {
                addActionFor[type](element);
            }
        };

        const handleElementClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            setCurrentShapeDetails(element);
        };

        return (
            <div
                key={`${element.name}-${element.version}`}
                onClick={handleElementClick}
                className="flex flex-col  p-2 bg-customDarkGray cursor-pointer rounded-lg  relative aspect-[3/2]  disabled:opacity-80 disabled:cursor-not-allowed"
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
                    {renderPreview(element as UnifiedElement)}

                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity">
                        <CirclePlus className="text-white text-3xl select-none" />
                    </div>
                </div>

                <div className="flex items-start gap-2 mt-2 ">
                    <div
                        className={clsx(
                            `w-2 h-2 ${
                                filterBgColors[
                                    elementType.toLocaleUpperCase() as keyof typeof filterBgColors
                                ]
                            } rounded-full shrink-0 mt-1.5`
                        )}
                    />
                    <p className="h-10 break-words text-white text-sm overflow-hidden text-ellipsis  line-clamp-2">
                        {formatString(element.name)}
                    </p>
                </div>
            </div>
        );
    };
    const renderShapeDetails = (element: UnifiedElement) => {
        const elementType = "type" in element ? element.type : "COMPONENT";

        return (
            <div className="p-2 bg-[#3B3A3A] rounded-lg">
                <div className="flex gap-3">
                    <div className="w-[106px] h-[106px] flex-shrink-0">
                        {renderPreview(element as UnifiedElement)}
                    </div>
                    <div className="flex gap-2 flex-col">
                        <div className="flex items-center gap-2 mt-2 ">
                            <div
                                className={clsx(
                                    `w-3 h-3 ${
                                        filterBgColors[
                                            elementType.toUpperCase() as keyof typeof filterBgColors
                                        ]
                                    } rounded-full shrink-0`
                                )}
                            />
                            <p className=" text-white text-base overflow-hidden text-ellipsis whitespace-pre-line line-clamp-1">
                                {formatString(element.name)}
                            </p>
                        </div>
                        <div className="flex gap-2 text-sm">
                            <Badge
                                variant="secondary"
                                className="flex items-center w-fit bg-[#626262] px-2 py-1"
                            >
                                <span>v{element.version}</span>
                            </Badge>
                            <Badge
                                variant="secondary"
                                className="flex items-center w-fit bg-[#626262] px-2 py-1"
                            >
                                <span>{showTypeName[elementType]}</span>
                            </Badge>
                        </div>
                        <p className="text-[#BFBFBF] text-sm">
                            {element.description
                                ? element.description
                                : "No description available."}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end ">
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentShapeDetails(element);

                            setIsEditDialog(true);
                        }}
                        className="flex gap-2 text-sm"
                    >
                        Edit
                    </Button>
                    <Button
                        disabled={isAddDisabled[elementType]}
                        onClick={(e) => {
                            e.stopPropagation();
                            addActionFor[elementType](element);
                        }}
                        className="flex gap-2 text-sm"
                    >
                        Add
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <main className="p-4 h-full flex flex-col gap-4">
            <div>
                <div className="flex items-center bg-customGray2 rounded-md gap-2 border-customDarkGray border-2 border-solid">
                    <input
                        value={inputQuery}
                        autoComplete="off"
                        onChange={handleInputChange}
                        type="text"
                        name="search"
                        placeholder="Search"
                        className="w-full p-2 bg-customGray2  text-white placeholder-gray-400 rounded focus:outline-none"
                    />
                    {inputQuery && (
                        <button
                            onClick={handleSubmit}
                            className="bg-customLightGray rounded p-1"
                        >
                            <X size={12} />
                        </button>
                    )}
                    <button className="p-2">
                        <Search size={20} />
                    </button>
                </div>
                <div className="flex mt-2 flex-wrap justify-end gap-1 ">
                    {filterOptionsWithColor.map((item) => (
                        <button
                            key={item.name}
                            className="flex items-center gap-1 bg-customGray2 rounded px-2 py-1 focus:outline-none"
                            onClick={() => setselectedFilter(item.name)}
                        >
                            {item.color && (
                                <div
                                    className={clsx(
                                        `w-4 h-4 ${item.color} rounded-full shrink-0`
                                    )}
                                />
                            )}
                            <div className="relative ">
                                {/* Hidden reference text */}
                                <span
                                    aria-hidden="true"
                                    className={clsx(
                                        "invisible block whitespace-nowrap",
                                        selectedFilter === item.name
                                            ? "font-bold"
                                            : "font-normal text-lightGray2"
                                    )}
                                >
                                    {item.name}
                                </span>

                                {/* Visible text */}
                                <span
                                    className={clsx(
                                        "absolute left-0 top-1/2 -translate-y-1/2 ",
                                        selectedFilter === item.name
                                            ? "font-bold"
                                            : "font-normal text-lightGray2"
                                    )}
                                >
                                    {item.name}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {inputQuery && (
                <section
                    className={`flex-grow overflow-auto  bg-[#1A1A1A] px-4 py-3 rounded-lg ${CUSTOM_SCROLLBAR}`}
                >
                    {groupedSearchedElements.total} Result Found
                    {isSearchLoading ? (
                        <SearchLoadingSkeleton />
                    ) : (
                        groupedSearchedElements.data &&
                        Object.entries(groupedSearchedElements.data).map(
                            ([path, group]) => (
                                <div key={path}>
                                    <h2 className="my-3 text-sm"> {path}</h2>
                                    <ul>
                                        {group.map((element) => (
                                            <li
                                                key={element.name}
                                                className="mt-3"
                                            >
                                                {renderShapeDetails(
                                                    element as UnifiedElement
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )
                        )
                    )}
                </section>
            )}
            {!inputQuery && categories.length > 0 && (
                <CategoriesPanel
                    categories={categories}
                    onCategoryChange={handleCategoryChange}
                />
            )}

            {!inputQuery && !currentShapeDetails && (
                <section
                    className={`flex-grow overflow-auto ${CUSTOM_SCROLLBAR}`}
                >
                    {isShapesLoading ? (
                        <ShapesGroupLoadingSkeleton />
                    ) : shapesByCategory.length > 0 || components.length > 0 ? (
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                            {isAllOrComponent &&
                                components.map((element) =>
                                    renderElement(element)
                                )}
                            {(selectedFilter === "All" ||
                                filteredShapes.length > 0) &&
                                filteredShapes.map((element) =>
                                    renderElement(element)
                                )}
                        </div>
                    ) : null}
                </section>
            )}

            {!inputQuery && currentShapeDetails && (
                <section
                    className={`flex-grow overflow-auto ${CUSTOM_SCROLLBAR}`}
                >
                    <button
                        onClick={() => setCurrentShapeDetails(null)}
                        className="flex gap-2 text-base items-center"
                    >
                        <ArrowLeft size={16} />
                        <span> Back</span>
                    </button>
                    {renderShapeDetails(currentShapeDetails as UnifiedElement)}
                </section>
            )}
            {currentShapeDetails && (
                <EditElementDialog
                    isOpen={isEditDialog}
                    onClose={() => setIsEditDialog(false)}
                    activeCategory={activeCategory}
                    element={currentShapeDetails as UnifiedElement}
                />
            )}
        </main>
    );
};

export default ShapesPanel;
