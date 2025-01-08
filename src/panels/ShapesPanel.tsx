// @/panels/ShapesPanel.tsx

import React, { useState } from "react";
import {
    CanvasSize,
    DiagramComponent,
    Shape,
    Component,
    Category
} from "../Types";
import { Folder, Grid, List } from "lucide-react";

import SVGPreview from "../components/ui/SVGPreview";
import { componentLibraryManager } from "../lib/componentLib";

type ElementType = "3D" | "2D" | "COMPONENT";

interface ShapesPanelProps {
    svgLibrary: Shape[];
    canvasSize: CanvasSize;
    categories: Category[];
    activeCategory: string;
    onCategoryChange: (id: string) => void;
    onAdd3DShape: (shapeName: string) => void;
    onAdd2DShape: (shapeName: string, attachTo: string) => void;
    onAddComponent: (componentId: string, component?: Component) => void;
    onDeleteComponent: (componentId: string) => void;
    selected3DShape: string | null;
    diagramComponents: DiagramComponent[];
    components: Component[];
    activeLibrary: string;
}

const ShapesPanel: React.FC<ShapesPanelProps> = ({
    svgLibrary,
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
    activeLibrary
}) => {
    const [layout, setLayout] = useState("list");
    const [layoutShapes, setLayoutShapes] = useState("grid");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set()
    );

    const shouldDisable3DShapeButtons = () => {
        return diagramComponents.length > 0 && selected3DShape === null;
    };

    const isAddDisabled: Record<ElementType, boolean> = {
        "3D": diagramComponents.length > 0 && selected3DShape === null,
        "2D": selected3DShape === null,
        COMPONENT: diagramComponents.length > 0 && selected3DShape === null
    };
    const addActionFor: Record<ElementType, (arg: any) => void> = {
        "3D": (shape: Shape) => onAdd3DShape(shape.name),
        "2D": (shape: Shape) => onAdd2DShape(shape.name, shape.attachTo ?? ""),
        COMPONENT: (component: Component) =>
            onAddComponent(component.id, component)
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
                                <p className="text-sm">54 shapes</p>
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
                key={element.name}
                disabled={isAddDisabled[elementType]}
                onClick={(e) => {
                    e.stopPropagation();
                    addActionFor[elementType](element);
                }}
                className="flex flex-col   p-1 rounded-lg hover:bg-customLightGray mb-2 relative aspect-[3/2] transition-all hover:scale-105 focus:outline-none disabled:opacity-80 disabled:cursor-not-allowed"
            >
                {renderPreview(element)}

                <div className="text-white text-sm overflow-hidden text-ellipsis whitespace-pre-line line-clamp-1">
                    {element.name}
                </div>
                <div className="text-[#00BFFF] text-[13px]">{elementType}</div>
            </button>
        );
    };
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
                        {renderCategories(categories ?? [])}
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
                        {!activeCategory ? (
                            <h2 className="p-4 text-white text-sm">
                                Select any category to see shapes
                            </h2>
                        ) : (
                            <div className="space-5">
                                {svgLibrary.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                        {components.map((element) =>
                                            renderElement(element)
                                        )}
                                        {svgLibrary.map((element) =>
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
        </div>
    );
};

export default ShapesPanel;

// <HoverCardContent className="w-80">
// <Card key={element.name} className="group overflow-hidden">
//     {/* Image Container */}
//     <div className="relative aspect-square overflow-hidden">
//         {renderPreview(element)}
//     </div>

//     {/* Product Details */}
//     <CardContent className="p-4">
//         <div className="space-y-2">
//             <h3 className="font-semibold text-lg truncate">
//                 {element.name}
//             </h3>
//             {"attachTo" in element && element.attachTo && (
//                 <span className="text-md ">
//                     attached to - {element.attachTo}
//                 </span>
//             )}
//             {"description" in element && (
//                 <span className="text-sm ml-1">
//                     {element.description}
//                 </span>
//             )}
//         </div>
//     </CardContent>

//     {/* Add to Cart Button */}
//     <CardFooter className="p-4 pt-0">
//         {/* {onDelete && (
//             <Button
//                 onClick={() => {
//                     onDelete(element);
//                 }}
//                 className="mr-2"
//             >
//                 Delete
//                 {"type" in element ? "Shape" : "Component"}
//             </Button>
//         )}
//         {onEdit && (
//             <Button
//                 disabled={shouldDisable3DShapeButtons()}
//             >
//                 Edit{" "}
//                 {"type" in element ? "Shape" : "Component"}
//             </Button>
//         )} */}
//     </CardFooter>
// </Card>
// </HoverCardContent>
