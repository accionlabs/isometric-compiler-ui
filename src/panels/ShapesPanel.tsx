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

    const renderCategories = (categories: Category[], level = 0) => {
        return categories.map((category) => (
            <div key={category._id}>
                <div
                    onClick={() => {
                        setselectedFilter("All");
                        onCategoryChange(category._id);
                    }}
                    className={`text-sm flex items-center justify-between bg-customGray text-white py-1 px-2 hover:bg-customLightGray ${
                        activeCategory === category._id
                            ? "bg-customLightGray"
                            : ""
                    }`}
                >
                    {/* Left Section: Icon and Text */}

                    <div className="flex items-center space-x-1">
                        {category.children?.length > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCategory(category._id);
                                }}
                                className={`p-2 rounded  ${
                                    activeCategory === category._id
                                        ? "bg-customLightGray"
                                        : ""
                                }`}
                            >
                                {expandedCategories.has(category._id) ? (
                                    <ChevronDown />
                                ) : (
                                    <ChevronRight />
                                )}
                            </button>
                        )}
                        <div
                            className={`flex items-center space-x-3 hover:bg-customLightGray p-2  rounded-lg cursor-pointer`}
                        >
                            {category.parent ? <Folder /> : <RootFolder />}

                            {/* Title and Subtitle */}
                            <div>
                                <h3 className="text-base">{category.name}</h3>
                                <p className="text-sm">
                                    {category.shapeCount} shapes
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {expandedCategories.has(category._id) &&
                    category.children.length > 0 && (
                        <div className="ml-6 mt-2  border-gray-300 pl-4">
                            {renderCategories(category.children, level + 1)}
                        </div>
                    )}
            </div>
        ));
    };

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
                {/* Preview Container */}
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
                    {/* Render Preview */}
                    {renderPreview(element)}

                    {/* Hover Effect */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-3xl">+</span>
                    </div>
                </div>

                {/* Element Details */}
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

    const SearchResults = ({ results }: { results: UnifiedElement[] }) => {
        return (
            <ul className="h-[74vh] scrollbar-hide overflow-y-scroll border-t-2 border-customBorderColor">
                {results.map((result, index) => (
                    <li
                        className="flex items-center px-4 py-3 rounded-md gap-4 hover:bg-customLightGray cursor-pointer"
                        key={result.name + result.version}
                        // disabled={isAddDisabled[result.type]}
                        onClick={(e) => {
                            e.stopPropagation();
                            addActionFor[result.type](result);
                        }}
                    >
                        <div className="w-[76px] h-[76px]">
                            {renderPreview(result as Shape | Component)}
                        </div>
                        <div>
                            <div className="text-white font-semibold">
                                {result.name}
                            </div>
                            <p className="text-gray-400 text-xs">
                                {result.path}
                            </p>
                            <span
                                className={`mt-2 inline-block text-xs font-medium ${"text-blue-400"}`}
                            >
                                {"type" in result ? result.type : "Component"}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };
    const LoaderSearchSkeleton = () => (
        <ul>
            {Array.from({ length: 10 }).map((_, index) => (
                <li
                    key={index}
                    className="animate-pulse flex items-center p-4 rounded-md gap-4 hover:bg-customLightGray cursor-pointer"
                >
                    <div className="w-[76px] h-[76px] bg-gray-300 rounded-md flex-shrink-0">
                        <SVGPreview
                            className="w-full h-full object-cover bg-white"
                            svgContent=""
                        />
                    </div>
                    <div className="flex flex-col gap-1 flex-grow">
                        <div className="h-5 bg-gray-300 rounded-md my-1"></div>
                        <div className="h-2 bg-gray-300 rounded-md w-1/2"></div>
                        <div className="h-1 bg-gray-300 rounded-md w-1/3"></div>
                    </div>
                </li>
            ))}
        </ul>
    );
    const LoaderSkeleton = () => {
        return (
            <div className="grid grid-cols-1 scrollbar-hide sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, index) => (
                    <div
                        key={index}
                        className="flex flex-col p-1 rounded-lg hover:bg-customLightGray mb-2 relative aspect-[3/2] transition-all hover:scale-105 focus:outline-none  animate-pulse"
                    >
                        <SVGPreview
                            className="w-full h-full object-cover bg-white"
                            svgContent=""
                        />
                        <div className="h-2 bg-gray-300 rounded-md my-1"></div>
                        <div className="h-1 bg-gray-300 rounded-md w-1/4"></div>
                    </div>
                ))}
            </div>
        );
    };

    const renderShapeList = () => {
        return (
            <div className="mx-auto bg-customGray  rounded-lg shadow-lg ">
                <div className="flex h-[44vh] overflow-y-auto scrollbar-thin scrollbar-thumb-customLightGray scrollbar-track-transparent scrollbar-thumb-rounded custom-scrollbar">
                    {!activeCategory ? (
                        <h2 className="p-4 text-white text-sm">
                            Select any category to see shapes
                        </h2>
                    ) : (
                        <div className="px-4 pb-2 space-5">
                            {isShapesLoading ? (
                                <LoaderSkeleton />
                            ) : shapesByCategory.length > 0 ||
                              components.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
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
                            ) : (
                                <div className="p-4 text-white text-sm">
                                    No shapes available in this category
                                </div>
                            )}
                            {/* <div className="h-7"></div> */}
                        </div>
                    )}
                </div>
            </div>
        );
    };
    const renderShapeDetails = (element: Shape | Component) => {
        const elementType = "type" in element ? element.type : "COMPONENT";

        return (
            <div className="px-2 py-4 ">
                <div className="flex gap-3">
                    <div className="w-[106px] h-[106px] flex-shrink-0">
                        {renderPreview(element as Shape | Component)}
                    </div>
                    <div className="">
                        <div className="flex items-center">
                            <p className="text-sm w-24">Shape Name:</p>
                            <p className="text-xs">{element.name}</p>
                        </div>
                        <div className="flex items-center">
                            <p className="text-sm w-24">Type:</p>
                            <p className="text-xs">{elementType}</p>
                        </div>
                        {element.path && (
                            <div className="flex items-center">
                                <p className="text-sm w-24">Category:</p>
                                <p className="text-xs">{element.path}</p>
                            </div>
                        )}
                        <div className="flex items-center">
                            <p className="text-sm w-24">Version:</p>
                            <p className="text-xs">{element.version}</p>
                        </div>
                        {element.description && (
                            <div className="flex ">
                                <p className="text-sm  w-24 h-auto">
                                    Description:
                                </p>
                                <p
                                    className="text-xs flex-1 h-auto 
                        overflow-hidden text-ellipsis whitespace-pre-line line-clamp-2"
                                >
                                    {element.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 float-end mt-2">
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditDialog(true);
                        }}
                        className="flex gap-2 text-sm"
                    >
                        Edit <Edit />
                    </Button>
                    <Button
                        disabled={isAddDisabled[elementType]}
                        onClick={(e) => {
                            e.stopPropagation();
                            addActionFor[elementType](element);
                        }}
                        className="flex gap-2 text-sm"
                    >
                        Add <CirclePlus />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="border-t-2 border-customBorderColor">
                <div className="py-3 px-2 bg-customGray rounded-lg">
                    <div className="flex items-center bg-customLightGray rounded-md">
                        <input
                            value={inputQuery}
                            onChange={(e) => setInputQuery(e.target.value)}
                            type="text"
                            name="search"
                            placeholder="Search"
                            className="w-full p-2 bg-customLightGray text-white placeholder-gray-400 rounded focus:outline-none"
                        />
                        <button onClick={handleSubmit} className="p-2">
                            {!inputQuery ? <Search /> : <CircleX />}
                        </button>
                    </div>
                    <div className="flex mt-3 space-x-1 flex-wrap justify-end  ">
                        {filterOptionsWithColor.map((item) => (
                            <button
                                key={item.name}
                                className={`relative px-2 py-1 ${
                                    item.color
                                } rounded focus:outline-none 
            ${
                selectedFilter === item.name
                    ? "bg-customLightGray"
                    : "bg-customGray"
            }`}
                                onClick={() => setselectedFilter(item.name)}
                            >
                                {/* Hidden bold reference text - always maintains maximum space */}
                                <span
                                    aria-hidden="true"
                                    className="block font-bold invisible whitespace-nowrap"
                                >
                                    {item.name}
                                </span>

                                {/* Visible text that sits on top */}
                                <span
                                    className={`absolute inset-0 flex items-center justify-center
              ${selectedFilter === item.name ? "font-bold" : "font-normal"}`}
                                >
                                    {item.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                {isSearchLoading ? (
                    <LoaderSearchSkeleton />
                ) : (
                    inputQuery.length > 0 && (
                        <div className="bg-customDarkGray">
                            <h2 className="text-white p-2 text-[16px]">
                                {filteredSearch?.length} Results found
                            </h2>
                            <SearchResults results={filteredSearch ?? []} />
                        </div>
                    )
                )}
            </div>
            {!inputQuery && (
                <>
                    <div className="flex items-center justify-between bg-customGray text-white px-4 py-2  border-t-2 border-customBorderColor">
                        <h1 className="text-lg font-bold text-white ">
                            Categories
                        </h1>
                    </div>
                    <div className="mx-auto bg-customGray  rounded-lg shadow-lg">
                        <div className="h-[28vh] overflow-y-auto scrollbar-thin scrollbar-thumb-customLightGray scrollbar-track-transparent scrollbar-thumb-rounded custom-scrollbar">
                            {renderCategories(categories ?? [])}
                        </div>
                    </div>
                </>
            )}
            {!currentShapeDetails && !inputQuery && (
                <div className="border-t-2 border-customBorderColor">
                    <div className="flex items-center justify-between bg-customGray text-white px-4 py-2 rounded-lg ">
                        <h1 className="text-lg font-bold text-white ">
                            Shapes
                        </h1>
                    </div>
                    {renderShapeList()}
                </div>
            )}
            {currentShapeDetails && (
                <div className="border-t-2 border-customBorderColor">
                    <div className="flex items-center justify-between bg-customGray text-white px-4 py-2 rounded-lg ">
                        <button
                            onClick={() => setCurrentShapeDetails(null)}
                            className="text-lg font-bold text-white flex items-center"
                        >
                            <ChevronLeft />
                            Back
                        </button>
                    </div>
                    {renderShapeDetails(
                        currentShapeDetails as Shape | Component
                    )}
                </div>
            )}
            {currentShapeDetails && (
                <EditElementDialog
                    isOpen={isEditDialog}
                    onClose={() => setIsEditDialog(false)}
                    element={currentShapeDetails as UnifiedElement}
                />
            )}
        </div>
    );
};

export default ShapesPanel;
