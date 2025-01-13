// @/panels/ShapesPanel.tsx

import React, { useMemo, useState } from "react";
import {
    CanvasSize,
    DiagramComponent,
    Shape,
    Component,
    Category,
    UnifiedElement
} from "../Types";
import { Grid, List, Search } from "lucide-react";

import SVGPreview from "../components/ui/SVGPreview";
import { componentLibraryManager } from "../lib/componentLib";

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
const filterOptions = ["All", "2D", "3D", "Layers", "Component"];
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
    isDataLoading,
    activeLibrary
}) => {
    const { isCategoryLoading, isSearchLoading, isShapesLoading } =
        isDataLoading;
    const [inputquery, setInputQuery] = useState("");
    const [layout, setLayout] = useState("list");
    const [layoutShapes, setLayoutShapes] = useState("grid");
    const [selectedfilter, setSelectedFilter] = useState("All");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set()
    );

    const shouldDisable3DShapeButtons = () => {
        return diagramComponents.length > 0 && selected3DShape === null;
    };

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
            if (
                !componentLibraryManager.checkComponentCanRender(
                    component,
                    svgLibrary
                )
            )
                return "";

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
        setSearchQuery(inputquery);
    };

    const isAllOrComponent =
        selectedfilter === "All" ||
        selectedfilter.toLocaleUpperCase() === "COMPONENT";
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
                <div className="flex items-center justify-between bg-customGray text-white py-1 px-2">
                    {/* Left Section: Icon and Text */}

                    <div className="flex items-center space-x-1">
                        {category.children?.length > 0 && (
                            <button
                                onClick={() => toggleCategory(category._id)}
                                className="p-2 bg-customGray rounded hover:bg-gray-600"
                            >
                                {expandedCategories.has(category._id)
                                    ? "▼"
                                    : "▶"}
                            </button>
                        )}
                        <div
                            onClick={() => onCategoryChange(category._id)}
                            className={`flex items-center space-x-3 hover:bg-customLightGray p-2 ${
                                activeCategory === category._id
                                    ? "bg-customLightGray"
                                    : ""
                            } rounded-lg cursor-pointer`}
                        >
                            {/* Folder Icon */}
                            {/* <Folder className="p-2 rounded" size={"40px"} /> */}

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
                        <div className="ml-6 mt-2 border-l-2 border-gray-300 pl-4">
                            {renderCategories(category.children, level + 1)}
                        </div>
                    )}
            </div>
        ));
    };

    const renderElement = (element: Shape | Component) => {
        const elementType = "type" in element ? element.type : "COMPONENT";
        return (
            <button
                key={element.name + element.version}
                disabled={isAddDisabled[elementType]}
                onClick={(e) => {
                    e.stopPropagation();
                    addActionFor[elementType](element);
                }}
                className="flex flex-col p-1 rounded-lg hover:bg-customLightGray mb-2 relative aspect-[3/2] transition-all hover:scale-105 focus:outline-none disabled:opacity-80 disabled:cursor-not-allowed"
            >
                {renderPreview(element)}

                <div className="text-white text-sm overflow-hidden text-ellipsis whitespace-pre-line line-clamp-1">
                    {element.name}
                </div>
                <div className="text-[#00BFFF] text-[13px]">{elementType}</div>
            </button>
        );
    };

    const SearchResults = ({ results }: { results: UnifiedElement[] }) => {
        return (
            <ul className="h-[74vh] overflow-y-scroll">
                {results.map((result, index) => (
                    <li
                        className="flex items-center p-4 rounded-md gap-4 hover:bg-customLightGray cursor-pointer"
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
                            <h3 className="text-white font-semibold text-lg">
                                {result.name}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {result.path}
                            </p>
                            <span
                                className={`mt-2 inline-block text-sm font-medium ${"text-blue-400"}`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, index) => (
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
    return (
        <div>
            <div className="border-t-2 border-customBorderColor">
                <div className="p-4 bg-customGray rounded-lg">
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center bg-customLightGray rounded-md"
                    >
                        <input
                            value={inputquery}
                            onChange={(e) => setInputQuery(e.target.value)}
                            type="text"
                            name="search"
                            placeholder="Search"
                            className="w-full px-4 py-2 bg-customLightGray text-white placeholder-gray-400 rounded-l-md focus:outline-none"
                        />
                        <button type="submit" className="p-2">
                            <Search className="text-white" />
                        </button>
                    </form>
                    <div className="flex mt-4 space-x-2 flex-wrap justify-end  ">
                        {filterOptions.map((item) => (
                            <button
                                key={item}
                                className={`px-2 py-2 text-white font-medium  rounded-md focus:outline-none  ${
                                    selectedfilter === item
                                        ? "bg-customLightGray"
                                        : "bg-customGray"
                                }`}
                                onClick={() => setSelectedFilter(item)}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
                {isSearchLoading ? (
                    <LoaderSearchSkeleton />
                ) : (
                    inputquery.length > 0 && (
                        <div className="bg-customDarkGray p-4 rounded-lg">
                            <h2 className="text-white text-lg mb-4">
                                {filteredSearch?.length} Results found
                            </h2>
                            <SearchResults results={filteredSearch ?? []} />
                        </div>
                    )
                )}
            </div>
            {!inputquery && (
                <>
                    <div className="flex items-center justify-between bg-customGray text-white p-4  border-t-2 border-customBorderColor">
                        <h1 className="text-lg font-medium text-white ">
                            Categories
                        </h1>
                    </div>
                    <div className="mx-auto bg-customGray  rounded-lg shadow-lg ">
                        <div className="h-[25vh] overflow-y-auto">
                            {renderCategories(categories ?? [])}
                        </div>
                    </div>
                </>
            )}
            {!inputquery && (
                <div className="border-t-2 border-customBorderColor">
                    <div className="flex items-center justify-between bg-customGray text-white p-4 rounded-lg ">
                        <h1 className="text-lg font-medium text-white ">
                            Shapes
                        </h1>
                    </div>

                    <div className="mx-auto bg-customGray  rounded-lg shadow-lg ">
                        <div className="flex h-[40vh] overflow-y-auto ">
                            {!activeCategory ? (
                                <h2 className="p-4 text-white text-sm">
                                    Select any category to see shapes
                                </h2>
                            ) : (
                                <div className="space-5">
                                    {isShapesLoading ? (
                                        <LoaderSkeleton />
                                    ) : shapesByCategory.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                            {(selectedfilter === "All" ||
                                                filteredShapes.length > 0) &&
                                                filteredShapes.map((element) =>
                                                    renderElement(element)
                                                )}
                                            {isAllOrComponent &&
                                                components.map((element) =>
                                                    renderElement(element)
                                                )}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-white text-sm">
                                            No shapes available in this category
                                        </div>
                                    )}
                                    <div className="h-4"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShapesPanel;

{
    /* <div className="flex items-center ">
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
                    </div> */
}
