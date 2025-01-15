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
import { CircleX, Search, ChevronDown, ChevronRight, CirclePlus } from "lucide-react";

import SVGPreview from "../components/ui/SVGPreview";
import { componentLibraryManager } from "../lib/componentLib";
import { Folder, RootFolder } from "@/components/ui/IconGroup";
import { set } from "yaml/dist/schema/yaml-1.1/set";

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
        color: "text-[#61C5FF]"
    },
    {
        name: "3D",
        color: "text-[#FC97FF]"
    },
    {
        name: "Layers",
        color: "text-[#E3FF96]"
    },
    {
        name: "Component",
        color: "text-[#FFAD00]"
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
    const [selectedfilter, setSelectedFilter] = useState("All");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set()
    );

    const [currentShapeDetails, setCurrentShapeDetails] = useState<Shape | Component | null>(null);

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
            setSearchQuery(inputQuery);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [inputQuery]);

    const isAllOrComponent =
        selectedfilter === "All" ||
        selectedfilter.toLocaleUpperCase() === "COMPONENT";

    const { isCategoryLoading, isSearchLoading, isShapesLoading } =
        isDataLoading;
    const filteredShapes = useMemo(() => {
        const upperCaseFilter = selectedfilter.toLocaleUpperCase();
        if (upperCaseFilter === "COMPONENT") return [];
        const isShapeType = ["3D", "2D", "LAYERS"].includes(upperCaseFilter);

        return isShapeType
            ? shapesByCategory.filter(
                  (shape) => shape.type.toLocaleUpperCase() === upperCaseFilter
              )
            : shapesByCategory;
    }, [selectedfilter, shapesByCategory]);

    const filteredSearch = useMemo(() => {
        const upperCaseFilter = selectedfilter.toLocaleUpperCase();

        const isShapeType = ["3D", "2D", "LAYERS", "COMPONENT"].includes(
            upperCaseFilter
        );

        return isShapeType
            ? searchedData?.data.filter(
                  (shape) => shape.type.toLocaleUpperCase() === upperCaseFilter
              )
            : searchedData?.data ?? [];
    }, [selectedfilter, searchedData?.data]);

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
                    onClick={() => onCategoryChange(category._id)}
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
        const elementType = "type" in element ? element.type : "COMPONENT";
        let elementTypeColor = "";
        switch (elementType) {
            case "2D":
                elementTypeColor = "text-custom2D";
                break;
            case "3D":
                elementTypeColor = "text-custom3D";
                break;
            case "LAYERS":
                elementTypeColor = "text-customLayers";
                break;
            case "COMPONENT":
                elementTypeColor = "text-customComponent";
                break;
            default:
                elementTypeColor = "text-white";
        }
        return (
            <button
                key={element.name + element.version}
                disabled={isAddDisabled[elementType]}
                onClick={(e) => {
                    e.stopPropagation();
                    // setCurrentShapeDetails(element);
                    addActionFor[elementType](element);
                    console.log("clicked");
                }}
                className="flex flex-col p-1 rounded-lg hover:bg-customLightGray mb-2 relative aspect-[3/2] transition-all hover:scale-105 focus:outline-none disabled:opacity-80 disabled:cursor-not-allowed"
            >
                {renderPreview(element)}
                {/* <button onClick={(e) => {
                    e.stopPropagation();
                    addActionFor[elementType](element);
                }}>
                    <CirclePlus className="text-white w-6 h-6" />
                </button> */}

                <div className="text-white text-sm overflow-hidden text-ellipsis whitespace-pre-line line-clamp-1">
                    {element.name}
                </div>
                <div className={`${elementTypeColor} text-xs capitalize`}>{(elementType == '2D' || elementType === '3D') ? elementType : elementType.toLocaleLowerCase()}</div>
            </button>
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
            <div className="flex h-[45vh] overflow-y-auto scrollbar-hide">
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
                                {(selectedfilter === "All" ||
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
        )
    }

    const ShapeDetail = (shape: Shape | Component)  => {
        console.log("shape", shape);
        const elementType = "type" in shape ? shape.type : "COMPONENT";
        return (
            <div className="flex gap-2 bg-customLightGray text-white rounded-lg shadow-md p-4 max-w-sm">
              {/* Image Section */}
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-indigo-300 rounded-md flex items-center justify-center">
                    {renderPreview(shape)}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-center items-center">
                    <span className="text-sm">Shape Name:</span>
                    <span className="text-xs text-customTextSecondary">{shape.name}</span>
                </div>
                <div className="flex">
                    <span className="text-sm">Type:</span>
                    <span className="text-xs text-customTextSecondary">{elementType}</span>
                </div>
                <div className="flex">
                    <span className="text-sm">Category:</span>
                    <span className="text-xs text-customTextSecondary">{shape.path}</span>
                </div>
                <div className="flex">
                    <span className="text-sm">Version:</span>
                    <span className="text-xs text-customTextSecondary">{shape.version}</span>
                </div>
                <div className="flex">
                    <span className="text-sm">Description:</span>
                    <span className="text-xs text-customTextSecondary">{shape.description}</span>
                </div>
              </div>
            </div>
          );
        
    }
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
                                className={`px-2 py-1 ${
                                    item.color
                                } rounded focus:outline-none text-sm ${
                                    selectedfilter === item.name
                                        ? "bg-customLightGray font-bold"
                                        : "bg-customGray"
                                }`}
                                onClick={() => setSelectedFilter(item.name)}
                            >
                                {item.name}
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
                        <div className="max-h-[28vh] overflow-y-auto scrollbar-hide">
                            {renderCategories(categories ?? [])}
                        </div>
                    </div>
                </>
            )}
            {!inputQuery && (
                <div className="border-t-2 border-customBorderColor">
                    <div className="flex items-center justify-between bg-customGray text-white px-4 py-2 rounded-lg ">
                        <h1 className="text-lg font-bold text-white ">
                            Shapes
                        </h1>
                    </div>
                    {renderShapeList()}
                    {/* { !currentShapeDetails ? renderShapeList() : ShapeDetail(currentShapeDetails)} */}
                   
                </div>
            )}
        </div>
    );
};

export default ShapesPanel;
